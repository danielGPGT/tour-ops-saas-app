import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Get all active allocations with release information
    const { data: allocations, error } = await supabase
      .from('contract_allocations')
      .select(`
        id,
        allocation_name,
        total_quantity,
        total_cost,
        cost_per_unit,
        currency,
        valid_from,
        valid_to,
        release_days,
        is_active,
        created_at,
        contract_id,
        product_id,
        contract:contracts(
          id,
          contract_name,
          supplier:suppliers(name)
        ),
        product:products(
          id,
          name,
          code
        ),
        allocation_inventory(
          total_quantity,
          available_quantity,
          sold_quantity
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .not('release_days', 'is', null)
      .order('valid_from', { ascending: true })

    if (error) {
      console.error('Error fetching allocations for release warnings:', error)
      return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
    }

    // Process allocations to identify release warnings
    const warnings = (allocations || []).map(allocation => {
      // Calculate release date
      const validFromDate = new Date(allocation.valid_from)
      const releaseDate = subDays(validFromDate, allocation.release_days || 0)
      const daysUntilRelease = differenceInDays(releaseDate, new Date())

      // Calculate inventory totals
      let totalInventoryQuantity = 0
      let totalAvailableQuantity = 0
      let totalSoldQuantity = 0

      if (allocation.allocation_inventory) {
        allocation.allocation_inventory.forEach((inv: any) => {
          totalInventoryQuantity += inv.total_quantity || 0
          totalAvailableQuantity += inv.available_quantity || 0
          totalSoldQuantity += inv.sold_quantity || 0
        })
      }

      // Use inventory quantities if available, otherwise use allocation totals
      const availableQuantity = totalInventoryQuantity > 0 ? totalAvailableQuantity : allocation.total_quantity
      const soldQuantity = totalInventoryQuantity > 0 ? totalSoldQuantity : 0
      const actualTotalQuantity = totalInventoryQuantity > 0 ? totalInventoryQuantity : allocation.total_quantity

      // Calculate potential loss (available units * cost per unit)
      const costPerUnit = allocation.cost_per_unit || (allocation.total_cost && allocation.total_quantity ? allocation.total_cost / allocation.total_quantity : 0)
      const potentialLoss = availableQuantity * costPerUnit

      return {
        id: allocation.id,
        allocation_name: allocation.allocation_name,
        total_quantity: actualTotalQuantity,
        available_quantity: availableQuantity,
        sold_quantity: soldQuantity,
        total_cost: allocation.total_cost,
        cost_per_unit: costPerUnit,
        currency: allocation.currency,
        valid_from: allocation.valid_from,
        valid_to: allocation.valid_to,
        release_days: allocation.release_days,
        release_date: releaseDate.toISOString(),
        days_until_release: daysUntilRelease,
        potential_loss: potentialLoss,
        contract_id: allocation.contract_id,
        product_id: allocation.product_id,
        contract: allocation.contract,
        product: allocation.product,
        created_at: allocation.created_at
      }
    })
    .filter(warning => {
      // Only include warnings that:
      // 1. Haven't passed the release date yet (or just passed)
      // 2. Are within the next 30 days
      // 3. Have available quantity > 0
      return warning.days_until_release >= -1 && 
             warning.days_until_release <= 30 && 
             warning.available_quantity > 0
    })
    .sort((a, b) => a.days_until_release - b.days_until_release)

    return NextResponse.json(warnings)

  } catch (error) {
    console.error('Error in release-warnings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get release urgency level
export function getReleaseUrgencyLevel(daysUntilRelease: number): 'critical' | 'high' | 'medium' | 'low' {
  if (daysUntilRelease <= 3) return 'critical'
  if (daysUntilRelease <= 7) return 'high'
  if (daysUntilRelease <= 14) return 'medium'
  return 'low'
}

// Helper function to get release recommendations
export function getReleaseRecommendations(warning: any): string[] {
  const recommendations = []
  const utilizationRate = warning.total_quantity > 0 ? (warning.sold_quantity / warning.total_quantity) * 100 : 0

  if (warning.days_until_release <= 3) {
    recommendations.push('URGENT: Contact supplier immediately')
    recommendations.push('Consider emergency price reduction')
    recommendations.push('Alert sales team for last-minute push')
  } else if (warning.days_until_release <= 7) {
    recommendations.push('Schedule supplier call this week')
    if (utilizationRate < 50) {
      recommendations.push('Reduce prices to accelerate sales')
    }
    recommendations.push('Send urgent alert to sales team')
  } else if (warning.days_until_release <= 14) {
    recommendations.push('Monitor daily and prepare action plan')
    if (utilizationRate < 30) {
      recommendations.push('Consider promotional pricing')
    }
    recommendations.push('Weekly sales team reminder')
  }

  if (warning.potential_loss > 50000) {
    recommendations.push('High financial risk - prioritize resolution')
  }

  return recommendations
}
