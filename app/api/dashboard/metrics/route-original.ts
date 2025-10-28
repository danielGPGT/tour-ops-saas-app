import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, subDays, subWeeks } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get all active allocations with inventory data
    const { data: allocations, error } = await supabase
      .from('contract_allocations')
      .select(`
        id,
        total_quantity,
        total_cost,
        currency,
        valid_from,
        release_days,
        status,
        created_at,
        allocation_inventory(
          total_quantity,
          sold_quantity,
          available_quantity
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .eq('status', 'active')

    if (error) {
      console.error('Error fetching allocations for metrics:', error)
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
    }

    // Calculate current metrics
    let totalUnits = 0
    let soldUnits = 0
    let availableUnits = 0
    let totalCost = 0
    let atRiskUnits = 0
    let atRiskCount = 0
    const currencies = new Set<string>()

    const now = new Date()
    
    allocations?.forEach(allocation => {
      // Add currency to set
      if (allocation.currency) currencies.add(allocation.currency)
      
      // Calculate costs
      totalCost += allocation.total_cost || 0

      // Calculate inventory from allocation_inventory if available
      if (allocation.allocation_inventory && allocation.allocation_inventory.length > 0) {
        allocation.allocation_inventory.forEach(inv => {
          totalUnits += inv.total_quantity || 0
          soldUnits += inv.sold_quantity || 0
          availableUnits += inv.available_quantity || 0
        })
      } else {
        // Fallback to allocation totals
        totalUnits += allocation.total_quantity || 0
        // If no inventory data, assume all units are available
        availableUnits += allocation.total_quantity || 0
      }

      // Check if at risk (releasing within 7 days and has available units)
      if (allocation.release_days && allocation.valid_from) {
        const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
        const daysUntilRelease = differenceInDays(releaseDate, now)
        
        if (daysUntilRelease >= 0 && daysUntilRelease <= 7) {
          // Calculate available units for this allocation
          let allocationAvailable = 0
          if (allocation.allocation_inventory && allocation.allocation_inventory.length > 0) {
            allocationAvailable = allocation.allocation_inventory.reduce((sum, inv) => 
              sum + (inv.available_quantity || 0), 0
            )
          } else {
            allocationAvailable = allocation.total_quantity || 0
          }
          
          if (allocationAvailable > 0) {
            atRiskUnits += allocationAvailable
            atRiskCount++
          }
        }
      }
    })

    const utilizationRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0

    // Calculate 7-day trends
    const weekAgo = subWeeks(now, 1)
    
    // Get data from a week ago for trend calculation
    const { data: weekAgoAllocations } = await supabase
      .from('allocation_inventory')
      .select(`
        sold_quantity,
        total_quantity,
        created_at
      `)
      .eq('organization_id', organizationId)
      .lte('created_at', weekAgo.toISOString())

    let weekAgoSoldUnits = 0
    let weekAgoTotalUnits = 0

    weekAgoAllocations?.forEach(inv => {
      weekAgoSoldUnits += inv.sold_quantity || 0
      weekAgoTotalUnits += inv.total_quantity || 0
    })

    const weekAgoUtilization = weekAgoTotalUnits > 0 ? (weekAgoSoldUnits / weekAgoTotalUnits) * 100 : 0
    const utilizationChange = utilizationRate - weekAgoUtilization
    const unitsSoldChange = soldUnits - weekAgoSoldUnits
    const unitsSoldPercentChange = weekAgoSoldUnits > 0 ? ((unitsSoldChange / weekAgoSoldUnits) * 100) : 0

    const metrics = {
      total_units: totalUnits,
      sold_units: soldUnits,
      available_units: availableUnits,
      at_risk_units: atRiskUnits,
      total_cost: totalCost,
      currency: Array.from(currencies)[0] || 'GBP',
      utilization_rate: utilizationRate,
      at_risk_count: atRiskCount,
      trend_7d: {
        units_sold: unitsSoldPercentChange,
        utilization_change: utilizationChange
      }
    }

    return NextResponse.json(metrics)

  } catch (error) {
    console.error('Error in dashboard metrics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
