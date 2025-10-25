'use client'

import { SummaryCard } from '@/components/common/SummaryCard'
import { Package, BarChart3, Settings, Calendar, TrendingUp } from 'lucide-react'

interface InventoryStatsCardsProps {
  totalItems: number
  totalQuantity: number
  activeItems: number
  flexibleItems: number
  availabilityGenerated: number
}

export function InventoryStatsCards({
  totalItems,
  totalQuantity,
  activeItems,
  flexibleItems,
  availabilityGenerated
}: InventoryStatsCardsProps) {
  const activePercentage = totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0
  const flexiblePercentage = totalItems > 0 ? Math.round((flexibleItems / totalItems) * 100) : 0
  const generatedPercentage = totalItems > 0 ? Math.round((availabilityGenerated / totalItems) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <SummaryCard
        title="Total Items"
        value={totalItems.toLocaleString()}
        icon={<Package className="h-4 w-4 text-primary" />}
        description="Inventory items configured"
        trend={totalItems > 0 ? 'up' : 'neutral'}
      />
      <SummaryCard
        title="Total Quantity"
        value={totalQuantity.toLocaleString()}
        icon={<BarChart3 className="h-4 w-4 text-secondary" />}
        description="Total units available"
        trend={totalQuantity > 0 ? 'up' : 'neutral'}
      />
      <SummaryCard
        title="Active Items"
        value={`${activeItems} (${activePercentage}%)`}
        icon={<TrendingUp className="h-4 w-4 text-primary" />}
        description="Currently active"
        trend={activePercentage > 80 ? 'up' : activePercentage > 50 ? 'neutral' : 'down'}
        variant={activePercentage > 80 ? 'success' : activePercentage > 50 ? 'default' : 'warning'}
      />
      <SummaryCard
        title="Flexible Config"
        value={`${flexibleItems} (${flexiblePercentage}%)`}
        icon={<Settings className="h-4 w-4 text-secondary" />}
        description="With flexible options"
        trend={flexibleItems > 0 ? 'up' : 'neutral'}
        variant={flexibleItems > 0 ? 'success' : 'default'}
      />
      <SummaryCard
        title="Availability Generated"
        value={`${availabilityGenerated} (${generatedPercentage}%)`}
        icon={<Calendar className="h-4 w-4 text-primary" />}
        description="With availability data"
        trend={generatedPercentage > 80 ? 'up' : generatedPercentage > 50 ? 'neutral' : 'down'}
        variant={generatedPercentage > 80 ? 'success' : generatedPercentage > 50 ? 'default' : 'warning'}
      />
    </div>
  )
}
