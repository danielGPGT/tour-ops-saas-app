'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Calendar, 
  Package, 
  TrendingUp, 
  Target,
  BarChart3,
  AlertTriangle,
  Edit,
  Copy
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore } from 'date-fns'
import { useSellingRate, useRateComparison } from '@/lib/hooks/useSellingRates'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface SellingRateDetailsDrawerProps {
  rateId: string
  onClose: () => void
}

export function SellingRateDetailsDrawer({ rateId, onClose }: SellingRateDetailsDrawerProps) {
  const { data: rate, isLoading, error } = useSellingRate(rateId)
  const { data: comparison } = useRateComparison(
    rate?.product_id, 
    rate?.product_option_id, 
    rate?.organization_id
  )

  if (isLoading) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Loading...</SheetTitle>
          </SheetHeader>
          <div className="py-8 space-y-4">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  if (error || !rate) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Error</SheetTitle>
          </SheetHeader>
          <div className="py-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load rate details. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const getRateStatus = () => {
    const now = new Date()
    const validFrom = parseISO(rate.valid_from)
    const validTo = parseISO(rate.valid_to)

    if (!rate.is_active) {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-600', label: 'Inactive' }
    }

    if (isAfter(now, validTo)) {
      return { status: 'expired', color: 'bg-red-100 text-red-600', label: 'Expired' }
    }

    if (isBefore(now, validFrom)) {
      return { status: 'future', color: 'bg-blue-100 text-blue-600', label: 'Future' }
    }

    return { status: 'active', color: 'bg-green-100 text-green-600', label: 'Active' }
  }

  const rateStatus = getRateStatus()
  
  // Find comparison data for this rate
  const rateComparison = comparison?.find(c => c.selling_rate?.id === rate.id)
  const hasMarginData = rateComparison && rateComparison.margin !== null

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {rate.rate_name}
            <Badge className={rateStatus.color}>
              {rateStatus.label}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            {rate.product?.name} • {rate.product_option?.option_name}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">
                      {rate.currency} {rate.base_price?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Selling Price</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold capitalize">{rate.rate_basis.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">Rate Basis</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">
                      {Math.ceil((new Date(rate.valid_to).getTime() - new Date(rate.valid_from).getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                    <p className="text-xs text-muted-foreground">Days Valid</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    {hasMarginData ? (
                      <>
                        <p className={cn(
                          "text-2xl font-bold",
                          rateComparison.margin_percentage > 20 ? "text-green-600" :
                          rateComparison.margin_percentage > 10 ? "text-yellow-600" :
                          "text-red-600"
                        )}>
                          {rateComparison.margin_percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Margin</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-muted-foreground">--</p>
                        <p className="text-xs text-muted-foreground">No Cost Data</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Margin Analysis Alert */}
          {hasMarginData && (
            <Alert className={cn(
              rateComparison.margin_percentage > 20 ? "border-green-200 bg-green-50" :
              rateComparison.margin_percentage > 10 ? "border-yellow-200 bg-yellow-50" :
              "border-red-200 bg-red-50"
            )}>
              <Target className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    Margin Analysis: {rate.currency} {rateComparison.margin.toLocaleString()} profit per unit
                  </span>
                  <Badge variant="outline" className={cn(
                    rateComparison.margin_percentage > 20 ? "text-green-600" :
                    rateComparison.margin_percentage > 10 ? "text-yellow-600" :
                    "text-red-600"
                  )}>
                    {rateComparison.margin_percentage > 20 ? 'Excellent' :
                     rateComparison.margin_percentage > 10 ? 'Good' : 'Low'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Rate Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product</label>
                      <p className="font-medium">{rate.product?.name}</p>
                      <p className="text-sm text-muted-foreground">{rate.product?.code}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product Option</label>
                      <p className="font-medium">{rate.product_option.option_name}</p>
                      <p className="text-sm text-muted-foreground">{rate.product_option.option_code}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valid Period</label>
                      <p className="font-medium">
                        {format(parseISO(rate.valid_from), 'MMM d, yyyy')} - {format(parseISO(rate.valid_to), 'MMM d, yyyy')}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rate Type</label>
                      <p className="font-medium capitalize">{rate.rate_basis.replace('_', ' ')}</p>
                    </div>

                    {rate.markup_type && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Markup</label>
                        <p className="font-medium">
                          {rate.markup_type === 'percentage' 
                            ? `${rate.markup_amount}%` 
                            : `${rate.currency} ${rate.markup_amount}`
                          }
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">{rate.markup_type}</p>
                      </div>
                    )}

                    {rate.target_cost && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Target Cost</label>
                        <p className="font-medium">{rate.currency} {rate.target_cost.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {hasMarginData && (
                    <>
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Cost Analysis</h4>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Supplier Cost</label>
                            <p className="font-medium">{rate.currency} {rateComparison.supplier_rate.base_cost.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Selling Price</label>
                            <p className="font-medium">{rate.currency} {rate.base_price.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Profit Margin</label>
                            <p className="font-medium text-green-600">
                              {rate.currency} {rateComparison.margin.toLocaleString()} ({rateComparison.margin_percentage.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {rate.notes && (
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm bg-muted p-3 rounded mt-1">{rate.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Rules Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Configuration</CardTitle>
                  <CardDescription>
                    Advanced pricing rules and dynamic adjustments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Advanced Pricing Rules</h3>
                    <p className="text-sm">
                      Dynamic pricing, seasonal adjustments, and volume discounts configuration
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>
                    Sales performance and booking statistics for this rate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                    <p className="text-sm">
                      Booking conversion rates, revenue analytics, and performance metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Rate
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
