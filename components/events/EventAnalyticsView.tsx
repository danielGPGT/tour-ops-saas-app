'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Package,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { useEventAnalytics } from '@/lib/hooks/useEvents'

interface EventAnalyticsViewProps {
  eventId: string
}

export function EventAnalyticsView({ eventId }: EventAnalyticsViewProps) {
  const { data: analytics, isLoading } = useEventAnalytics(eventId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Available</h3>
            <p className="text-muted-foreground">
              Analytics will be available once products and allocations are linked to this event.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { summary, product_type_breakdown, products } = analytics

  // Calculate additional metrics
  const averageCostPerUnit = summary.total_units > 0 ? summary.total_cost / summary.total_units : 0
  const inventoryValue = summary.total_available * averageCostPerUnit
  const salesValue = summary.total_sold * averageCostPerUnit
  const utilizationRate = summary.utilization_rate || 0

  // Determine performance status
  const getPerformanceStatus = (rate: number) => {
    if (rate >= 80) return { label: 'Excellent', color: 'text-green-600', variant: 'default' as const }
    if (rate >= 60) return { label: 'Good', color: 'text-blue-600', variant: 'secondary' as const }
    if (rate >= 40) return { label: 'Fair', color: 'text-orange-600', variant: 'secondary' as const }
    return { label: 'Poor', color: 'text-destructive', variant: 'destructive' as const }
  }

  const performanceStatus = getPerformanceStatus(utilizationRate)

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(utilizationRate)}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={utilizationRate} className="flex-1 h-2" />
              <Badge variant={performanceStatus.variant} className="text-xs">
                {performanceStatus.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Potential</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.primary_currency} {Math.round(salesValue / 1000).toLocaleString()}k
            </div>
            <p className="text-xs text-muted-foreground">
              From sold inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.primary_currency} {Math.round(inventoryValue / 1000).toLocaleString()}k
            </div>
            <p className="text-xs text-muted-foreground">
              Available inventory value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Unit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.primary_currency} {Math.round(averageCostPerUnit).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Average cost per unit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Product Type Breakdown</CardTitle>
            <CardDescription>Performance by product category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(product_type_breakdown).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No product types to display
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(product_type_breakdown).map(([type, count]) => {
                  const percentage = (count as number / summary.total_products) * 100
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize font-medium">{type}</span>
                        <span>{count} products ({Math.round(percentage)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
            <CardDescription>Current inventory status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{summary.total_sold} / {summary.total_units} units sold</span>
                </div>
                <Progress value={utilizationRate} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">{summary.total_sold}</div>
                  <div className="text-xs text-muted-foreground">Units Sold</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{summary.total_available}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                {utilizationRate >= 60 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : utilizationRate >= 30 ? (
                  <Clock className="h-4 w-4 text-orange-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {utilizationRate >= 60 ? 'Strong Performance' :
                     utilizationRate >= 30 ? 'Moderate Performance' :
                     'Needs Attention'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {utilizationRate >= 60 ? 'Good utilization rate - keep monitoring' :
                     utilizationRate >= 30 ? 'Consider promotional strategies' :
                     'Review pricing and marketing approach'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance Details */}
      {products && products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>Individual product utilization rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product: any) => {
                if (!product?.contract_allocations || product.contract_allocations.length === 0) {
                  return null
                }

                const totalUnits = product.contract_allocations.reduce((sum: number, alloc: any) => 
                  sum + (alloc.total_quantity || 0), 0
                )
                
                const totalSold = product.contract_allocations.reduce((sum: number, alloc: any) => {
                  if (!alloc.allocation_inventory) return sum
                  return sum + alloc.allocation_inventory.reduce((invSum: number, inv: any) => 
                    invSum + (inv.sold_quantity || 0), 0
                  )
                }, 0)

                const productUtilization = totalUnits > 0 ? (totalSold / totalUnits) * 100 : 0

                return (
                  <div key={product.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {product.contract_allocations.length} allocation{product.contract_allocations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant={productUtilization >= 60 ? 'default' : productUtilization >= 30 ? 'secondary' : 'destructive'}>
                        {Math.round(productUtilization)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={productUtilization} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{totalSold} sold</span>
                        <span>{totalUnits - totalSold} available</span>
                        <span>{totalUnits} total</span>
                      </div>
                    </div>
                  </div>
                )
              }).filter(Boolean)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
