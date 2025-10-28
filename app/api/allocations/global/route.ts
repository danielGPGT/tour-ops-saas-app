import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')
    const search = searchParams.get('search')
    const contractId = searchParams.get('contract_id')
    const status = searchParams.get('status')
    const allocationType = searchParams.get('allocation_type')
    const urgency = searchParams.get('urgency')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    let query = supabase
      .from('contract_allocations')
      .select(`
        id,
        allocation_name,
        allocation_type,
        total_quantity,
        total_cost,
        cost_per_unit,
        currency,
        valid_from,
        valid_to,
        release_days,
        status,
        contract_id,
        product_id,
        created_at,
        updated_at,
        contract:contracts(
          id,
          contract_name,
          supplier:suppliers(
            id,
            name
          )
        ),
        product:products(
          id,
          name,
          code,
          product_type
        ),
        allocation_inventory(
          total_quantity,
          sold_quantity,
          available_quantity
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    // Apply filters
    if (search) {
      query = query.or(`allocation_name.ilike.%${search}%,contract.contract_name.ilike.%${search}%,product.name.ilike.%${search}%`)
    }

    if (contractId && contractId !== 'all') {
      query = query.eq('contract_id', contractId)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (allocationType && allocationType !== 'all') {
      query = query.eq('allocation_type', allocationType)
    }

    // Apply urgency filter
    if (urgency && urgency !== 'all') {
      const now = new Date()
      
      if (urgency === 'urgent') {
        // Items releasing within 7 days
        const urgentDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        query = query.not('release_days', 'is', null)
        // This is complex to filter on computed release dates in SQL, so we'll filter on the client side
      } else if (urgency === 'warning') {
        // Items releasing within 30 days
        const warningDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        query = query.not('release_days', 'is', null)
      } else if (urgency === 'safe') {
        // Items releasing in more than 30 days or no release date
        // This is also complex, will filter client-side
      }
    }

    // Apply sorting - default by created_at descending
    query = query.order('created_at', { ascending: false })

    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    const { data: allocations, error: queryError, count } = await query.range(from, to)

    if (queryError) {
      console.error('Error fetching global allocations:', queryError)
      return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
    }

    // Process the data to calculate derived fields and apply urgency filtering
    const processedAllocations = (allocations || []).map(allocation => {
      // Calculate inventory summary
      let soldQuantity = 0
      let availableQuantity = 0
      let totalInventoryQuantity = 0

      if (allocation.allocation_inventory && allocation.allocation_inventory.length > 0) {
        allocation.allocation_inventory.forEach(inv => {
          totalInventoryQuantity += inv.total_quantity || 0
          soldQuantity += inv.sold_quantity || 0
          availableQuantity += inv.available_quantity || 0
        })
      } else {
        // If no inventory records, assume all units are available
        availableQuantity = allocation.total_quantity || 0
        soldQuantity = 0
      }

      // Calculate release urgency
      let releaseUrgency = null
      let daysUntilRelease = null
      
      if (allocation.release_days && allocation.valid_from) {
        const validFromDate = new Date(allocation.valid_from)
        const releaseDate = new Date(validFromDate.getTime() - allocation.release_days * 24 * 60 * 60 * 1000)
        daysUntilRelease = Math.ceil((releaseDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
        
        if (daysUntilRelease <= 3) releaseUrgency = 'critical'
        else if (daysUntilRelease <= 7) releaseUrgency = 'urgent'
        else if (daysUntilRelease <= 30) releaseUrgency = 'warning'
        else releaseUrgency = 'safe'
      }

      return {
        ...allocation,
        sold_quantity: soldQuantity,
        available_quantity: availableQuantity,
        release_urgency: releaseUrgency,
        days_until_release: daysUntilRelease
      }
    }).filter(allocation => {
      // Apply urgency filter client-side
      if (urgency && urgency !== 'all') {
        if (urgency === 'urgent' && allocation.release_urgency !== 'urgent' && allocation.release_urgency !== 'critical') {
          return false
        }
        if (urgency === 'warning' && allocation.release_urgency !== 'warning' && allocation.release_urgency !== 'urgent' && allocation.release_urgency !== 'critical') {
          return false
        }
        if (urgency === 'safe' && allocation.release_urgency !== 'safe' && !allocation.release_urgency) {
          return false
        }
      }
      return true
    })

    return NextResponse.json({
      data: processedAllocations,
      total: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0,
      currentPage: page,
      pageSize
    })

  } catch (error) {
    console.error('Error in global allocations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
