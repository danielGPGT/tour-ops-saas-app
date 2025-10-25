import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get user and organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User not linked to organization' }, { status: 400 })
    }

    const body = await request.json()
    const { contract, allocations, payments, rates } = body

    // Validate required fields
    if (!contract.supplier_id || !contract.contract_number || !contract.contract_name) {
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
        created_by: user.id
      })
      .select()
      .single()

    if (contractError) {
      console.error('Contract creation failed:', contractError)
      return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
    }

    // Create allocations
    if (allocations && allocations.length > 0) {
      const allocationInserts = allocations.map((allocation: any) => ({
        contract_id: newContract.id,
        product_id: allocation.product_id,
        allocation_name: allocation.allocation_name,
        allocation_type: allocation.allocation_type || 'allotment',
        total_quantity: allocation.total_quantity,
        valid_from: allocation.valid_from || contract.valid_from,
        valid_to: allocation.valid_to || contract.valid_to,
        total_cost: allocation.total_cost,
        cost_per_unit: allocation.cost_per_unit,
        min_nights: allocation.min_nights,
        max_nights: allocation.max_nights,
        notes: allocation.notes,
        is_active: true
      }))

      const { error: allocationError } = await supabase
        .from('contract_allocations')
        .insert(allocationInserts)

      if (allocationError) {
        console.error('Allocation creation failed:', allocationError)
        // Continue - don't fail the whole operation
      }
    }

    // Create payment schedule
    if (payments && payments.length > 0) {
      const paymentInserts = payments.map((payment: any) => ({
        contract_id: newContract.id,
        payment_number: payment.payment_number,
        due_date: payment.due_date,
        amount_due: payment.amount_due,
        percentage: payment.percentage,
        description: payment.description,
        status: payment.status || 'pending',
        paid_date: payment.paid_date,
        paid_amount: payment.paid_amount,
        payment_reference: payment.payment_reference
      }))

      const { error: paymentError } = await supabase
        .from('contract_payments')
        .insert(paymentInserts)

      if (paymentError) {
        console.error('Payment creation failed:', paymentError)
        // Continue - don't fail the whole operation
      }
    }

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
