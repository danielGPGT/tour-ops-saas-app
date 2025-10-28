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
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Calendar, 
  Package, 
  TrendingUp, 
  Settings,
  BarChart3,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore } from 'date-fns'
import { useSupplierRate } from '@/lib/hooks/useContracts'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SupplierRateDetailsDrawerProps {
  rateId: string
  onClose: () => void
}

export function SupplierRateDetailsDrawer({ rateId, onClose }: SupplierRateDetailsDrawerProps) {
  const { data: rate, isLoading, error } = useSupplierRate(rateId)

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
  const hasComplexPricing = rate.pricing_details && Object.keys(rate.pricing_details).length > 0

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
            {rate.product?.name} • {rate.supplier?.name || 'No supplier specified'}
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
                      {rate.currency} {rate.base_cost?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Base Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{rate.rate_basis}</p>
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
                  {hasComplexPricing ? (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="ml-2">
                    <p className="text-2xl font-bold">
                      {hasComplexPricing ? 'Complex' : 'Simple'}
                    </p>
                    <p className="text-xs text-muted-foreground">Pricing Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
              <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
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
                    
                    {rate.product_option && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Product Option</label>
                        <p className="font-medium">{rate.product_option.option_name}</p>
                        <p className="text-sm text-muted-foreground">{rate.product_option.option_code}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                      <p className="font-medium">{rate.supplier?.name || 'No specific supplier'}</p>
                      {rate.supplier?.code && (
                        <p className="text-sm text-muted-foreground">{rate.supplier.code}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contract</label>
                      <p className="font-medium">{rate.contract?.contract_number || 'No specific contract'}</p>
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
                  </div>

                  {rate.notes && (
                    <div>
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
                  <CardTitle>Pricing Structure</CardTitle>
                  <CardDescription>
                    Configure seasonal rates, volume discounts, and other pricing rules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {hasComplexPricing ? (
                    <div className="space-y-4">
                      {rate.pricing_details.seasonal_rates && (
                        <div>
                          <h4 className="font-medium mb-2">Seasonal Rates</h4>
                          <Badge variant="outline">Configured</Badge>
                        </div>
                      )}
                      {rate.pricing_details.volume_discounts && (
                        <div>
                          <h4 className="font-medium mb-2">Volume Discounts</h4>
                          <Badge variant="outline">Configured</Badge>
                        </div>
                      )}
                      {rate.pricing_details.early_booking && (
                        <div>
                          <h4 className="font-medium mb-2">Early Booking Discounts</h4>
                          <Badge variant="outline">Configured</Badge>
                        </div>
                      )}
                      <Separator />
                      <div className="text-center py-4">
                        <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Advanced pricing configuration coming soon
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">Simple Pricing</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This rate uses simple base cost pricing
                      </p>
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="text-2xl font-bold">
                          {rate.currency} {rate.base_cost?.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Per {rate.rate_basis.replace('_', ' ').toLowerCase()}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    Track how this rate is being used in bookings and quotes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Analytics Coming Soon</h3>
                    <p className="text-sm">
                      Booking statistics, usage patterns, and revenue analytics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
