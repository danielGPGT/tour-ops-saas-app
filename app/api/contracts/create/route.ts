import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Create server-side Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // Get user ID from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }
    
    const userId = authHeader.replace('Bearer ', '')
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User not linked to organization' }, { status: 400 })
    }

    const body = await request.json()
    console.log('📦 Received wizard data:', JSON.stringify(body, null, 2))
    
    const { contract, allocations, payments, rates } = body
    console.log('📋 Contract data:', contract)
    console.log('📋 Allocations data:', allocations)
    console.log('📋 Payments data:', payments)
    console.log('📋 Rates data:', rates)

    // Validate required fields
    if (!contract?.supplier_id || !contract?.contract_number || !contract?.contract_name) {
      console.log('❌ Missing required contract fields:', {
        supplier_id: contract?.supplier_id,
        contract_number: contract?.contract_number,
        contract_name: contract?.contract_name
      })
      return NextResponse.json({ error: 'Missing required contract fields' }, { status: 400 })
    }

    // Create contract
    const { data: newContract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        organization_id: profile.organization_id,
        supplier_id: contract.supplier_id,
        contract_number: contract.contract_number,
        contract_name: contract.contract_name,
        contract_type: contract.contract_type || 'allocation',
        contract_date: contract.contract_date || new Date().toISOString(),
        valid_from: contract.valid_from,
        valid_to: contract.valid_to,
        currency: contract.currency || 'USD',
        total_value: contract.total_value,
        payment_terms: contract.payment_terms,
        cancellation_policy: contract.cancellation_policy,
        attrition_policy: contract.attrition_policy,
        commission_rate: contract.commission_rate,
        booking_cutoff_days: contract.booking_cutoff_days,
        has_attrition: contract.has_attrition || false,
        special_notes: contract.special_notes,
        contract_document_url: contract.contract_document_url,
        contract_document_name: contract.contract_document_name,
        status: 'active',
        created_by: userId,
        is_quick_entry: contract.is_quick_entry || false
      })
      .select()
      .single()

    if (contractError) {
      console.error('Contract creation failed:', contractError)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    // Create allocations
    console.log('🏗️ Creating allocations...', allocations)
    if (allocations && allocations.length > 0) {
      console.log('📝 Processing', allocations.length, 'allocations')
      const allocationInserts = allocations.map((allocation: any) => {
        // Skip allocations without product_id
        if (!allocation.product_id || allocation.product_id === '') {
          console.log('⚠️ Skipping allocation without product_id:', allocation.allocation_name)
          return null
        }
        
        return {
          contract_id: newContract.id,
          product_id: allocation.product_id,
          allocation_name: allocation.allocation_name,
          allocation_type: allocation.allocation_type || 'committed',
          total_quantity: allocation.total_quantity,
          valid_from: allocation.valid_from || contract.valid_from,
          valid_to: allocation.valid_to || contract.valid_to,
          total_cost: allocation.total_cost,
          cost_per_unit: allocation.cost_per_unit,
          min_nights: allocation.min_nights,
          max_nights: allocation.max_nights,
          notes: allocation.notes,
          is_active: true
        }
      }).filter(Boolean) // Remove null entries

      const { error: allocationError } = await supabase
        .from('contract_allocations')
        .insert(allocationInserts)

      if (allocationError) {
        console.error('❌ Allocation creation failed:', allocationError)
        // Continue - don't fail the whole operation
      } else {
        console.log('✅ Allocations created successfully')
      }
    }

    // Create payment schedule
    console.log('💳 Creating payments...', payments)
    if (payments && payments.length > 0) {
      console.log('📝 Processing', payments.length, 'payments')
      const paymentInserts = payments.map((payment: any) => {
        // Convert relative dates to actual dates
        let dueDate = payment.due_date
        if (typeof dueDate === 'string' && !dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Handle relative dates
          if (dueDate.includes('contract signing')) {
            dueDate = contract.valid_from // Use contract start date
          } else if (dueDate.includes('90 days before arrival')) {
            const arrivalDate = new Date(contract.valid_from)
            arrivalDate.setDate(arrivalDate.getDate() - 90)
            dueDate = arrivalDate.toISOString().split('T')[0]
          } else if (dueDate.includes('60 days before arrival')) {
            const arrivalDate = new Date(contract.valid_from)
            arrivalDate.setDate(arrivalDate.getDate() - 60)
            dueDate = arrivalDate.toISOString().split('T')[0]
          } else if (dueDate.includes('30 days before arrival')) {
            const arrivalDate = new Date(contract.valid_from)
            arrivalDate.setDate(arrivalDate.getDate() - 30)
            dueDate = arrivalDate.toISOString().split('T')[0]
          }
        }

        return {
          contract_id: newContract.id,
          payment_number: payment.payment_number,
          due_date: dueDate,
          amount_due: payment.amount_due || payment.amount,
          percentage: payment.percentage,
          description: payment.description,
          status: payment.status || 'pending',
          paid_date: payment.paid_date,
          paid_amount: payment.paid_amount,
          payment_reference: payment.payment_reference
        }
      })

      const { error: paymentError } = await supabase
        .from('contract_payments')
        .insert(paymentInserts)

      if (paymentError) {
        console.error('❌ Payment creation failed:', paymentError)
        // Continue - don't fail the whole operation
      } else {
        console.log('✅ Payments created successfully')
      }
    }

    // Note: Rates table doesn't exist yet, skipping rates creation
    console.log('💰 Rates creation skipped - contract_rates table does not exist')

    return NextResponse.json({
      success: true,
      contract: newContract,
      message: 'Contract created successfully'
    })

  } catch (error) {
    console.error('Contract creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}
