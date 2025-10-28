'use client'

import React from 'react'
import { useAllocationStats } from '@/lib/hooks/useContracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingCart, CheckCircle, DollarSign } from 'lucide-react'

interface AllocationsSummaryProps {
  contractId: string
}

export function AllocationsSummary({ contractId }: AllocationsSummaryProps) {
  const { data: stats, isLoading } = useAllocationStats(contractId)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-20" />
              </CardTitle>
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No allocation data</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total Units */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_units.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across {stats.allocation_count} allocation{stats.allocation_count !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Units Sold */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.sold_units.toLocaleString()}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {stats.sold_percentage}% sold
            </p>
            <Progress value={stats.sold_percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Available */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.available_units.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.available_percentage}% remaining
          </p>
        </CardContent>
      </Card>

      {/* Total Investment */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.currency} {stats.total_cost.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Avg {stats.currency} {Math.round(stats.avg_cost_per_unit).toLocaleString()}/unit
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
