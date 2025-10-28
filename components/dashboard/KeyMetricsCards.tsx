'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Package, 
  ShoppingCart, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/useAuth'

interface KeyMetricsCardsProps {
  className?: string
}

interface DashboardMetrics {
  total_units: number
  sold_units: number
  available_units: number
  at_risk_units: number
  total_cost: number
  currency: string
  utilization_rate: number
  at_risk_count: number
  trend_7d: {
    units_sold: number
    utilization_change: number
  }
}

export function KeyMetricsCards({ className }: KeyMetricsCardsProps) {
  const { profile, loading: authLoading } = useAuth()

  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null
      
      const response = await fetch(`/api/dashboard/metrics?organization_id=${profile.organization_id}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      
      return response.json() as DashboardMetrics
    },
    enabled: !!profile?.organization_id && !authLoading,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 1,
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  })

  // Show loading while auth is loading or query is loading
  if (authLoading || (isLoading && !error)) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="col-span-4">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <p>Error loading metrics: {error.message}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Auth: {authLoading ? 'Loading...' : profile?.organization_id ? 'OK' : 'No org ID'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show no data state
  if (!metrics) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No data available
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getTrendIcon = (change: number, size = "h-4 w-4") => {
    if (change > 0) return <TrendingUp className={`${size} text-green-600`} />
    if (change < 0) return <TrendingDown className={`${size} text-destructive`} />
    return <Minus className={`${size} text-muted-foreground`} />
  }

  const getTrendText = (change: number) => {
    if (change === 0) return "No change"
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs last week`
  }

  return (
    <div className={`grid gap-4 md:grid-cols-4 ${className}`}>
      {/* Total Units */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Units</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_units.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across all allocations
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
          <div className="text-2xl font-bold text-green-600">
            {metrics.sold_units.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-2">
            {getTrendIcon(metrics.trend_7d.units_sold, "h-3 w-3")}
            <p className="text-xs text-muted-foreground">
              {getTrendText(metrics.trend_7d.units_sold)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Units */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {metrics.available_units.toLocaleString()}
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Utilization</span>
              <span>{metrics.utilization_rate.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.utilization_rate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* At Risk */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">At Risk</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {metrics.at_risk_units.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.at_risk_count} allocation{metrics.at_risk_count !== 1 ? 's' : ''} releasing soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
