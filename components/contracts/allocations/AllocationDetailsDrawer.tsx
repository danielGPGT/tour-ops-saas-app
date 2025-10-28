'use client'

import React, { useState, useMemo } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
  Settings
} from 'lucide-react'
import { format, subDays, differenceInDays } from 'date-fns'
import { useAllocationDetails } from '@/lib/hooks/useContracts'
import { AllocationInventoryManager } from './AllocationInventoryManager'
import { AllocationAvailabilityCalendar } from './AllocationAvailabilityCalendar'
import { ReleaseScheduleManager } from './ReleaseScheduleManager'
import { cn } from '@/lib/utils'

interface AllocationDetailsDrawerProps {
  allocationId: string
  onClose: () => void
}

export function AllocationDetailsDrawer({ allocationId, onClose }: AllocationDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const { data: allocation, isLoading, error } = useAllocationDetails(allocationId)

  // Calculate derived data
  const inventorySummary = useMemo(() => {
    if (!allocation?.allocation_inventory) return null

    let totalDistributed = 0
    let totalSold = 0
    let totalAvailable = 0
    let totalCost = 0

    allocation.allocation_inventory.forEach((inventory: any) => {
      totalDistributed += inventory.total_quantity || 0
      totalSold += inventory.sold_quantity || 0
      totalAvailable += inventory.available_quantity || 0
      totalCost += (inventory.total_quantity || 0) * (inventory.batch_cost_per_unit || 0)
    })

    const parentTotal = allocation.total_quantity || 0
    const undistributed = parentTotal - totalDistributed
    const utilizationRate = parentTotal > 0 ? (totalSold / parentTotal) * 100 : 0

    return {
      totalDistributed,
      totalSold,
      totalAvailable,
      totalCost,
      undistributed,
      parentTotal,
      utilizationRate,
      distributionRate: parentTotal > 0 ? (totalDistributed / parentTotal) * 100 : 0
    }
  }, [allocation])

  // Calculate release date and urgency
  const releaseInfo = useMemo(() => {
    if (!allocation?.release_days || !allocation?.valid_from) return null

    const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
    const daysUntil = differenceInDays(releaseDate, new Date())
    const isPast = daysUntil < 0
    const isUrgent = daysUntil > 0 && daysUntil <= 7
    const isWarning = daysUntil > 7 && daysUntil <= 30

    return {
      releaseDate,
      daysUntil,
      isPast,
      isUrgent,
      isWarning
    }
  }, [allocation])

  if (isLoading) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-[900px] overflow-y-auto">
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

  if (error || !allocation) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-[900px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Error</SheetTitle>
          </SheetHeader>
          <div className="py-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to load allocation details. Please try again.
              </AlertDescription>
            </Alert>
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{allocation.allocation_name}</SheetTitle>
          <SheetDescription>
            {allocation.product?.name} • {allocation.allocation_type}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{allocation.total_quantity || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">Total Units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{inventorySummary?.totalSold || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      {inventorySummary?.utilizationRate.toFixed(0)}% Sold
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">{inventorySummary?.totalAvailable || 0}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div className="ml-2">
                    <p className="text-2xl font-bold">
                      {allocation.currency} {(allocation.total_cost || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Cost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Release Warning */}
          {releaseInfo && !releaseInfo.isPast && (releaseInfo.isUrgent || releaseInfo.isWarning) && (
            <Alert variant={releaseInfo.isUrgent ? 'destructive' : 'default'} className={
              releaseInfo.isUrgent ? '' : 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
            }>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Release deadline approaching:</strong> {format(releaseInfo.releaseDate, 'MMMM d, yyyy')}
                    <br />
                    <span className="text-sm">
                      {inventorySummary?.totalAvailable || 0} units still available
                    </span>
                  </div>
                  <Badge variant={releaseInfo.isUrgent ? 'destructive' : 'secondary'}>
                    {releaseInfo.daysUntil} days left
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Distribution Progress */}
          {inventorySummary && allocation.total_quantity && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribution Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Distributed: {inventorySummary.totalDistributed} / {allocation.total_quantity}</span>
                    <span>{inventorySummary.distributionRate.toFixed(0)}%</span>
                  </div>
                  <Progress value={inventorySummary.distributionRate} className="h-2" />
                  
                  {inventorySummary.undistributed > 0 && (
                    <Alert>
                      <Package className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{inventorySummary.undistributed} units</strong> not yet distributed to product options
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Distribution</TabsTrigger>
              <TabsTrigger value="releases">Release Schedule</TabsTrigger>
              <TabsTrigger value="analytics">Availability Calendar</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Allocation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Product</label>
                      <p className="font-medium">{allocation.product?.name}</p>
                      <p className="text-sm text-muted-foreground">{allocation.product?.code}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          allocation.allocation_type === 'allotment' ? 'default' :
                          allocation.allocation_type === 'batch' ? 'secondary' : 'outline'
                        }>
                          {allocation.allocation_type}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Valid Period</label>
                      <p className="font-medium">
                        {format(new Date(allocation.valid_from), 'MMM d, yyyy')} - {format(new Date(allocation.valid_to), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {differenceInDays(new Date(allocation.valid_to), new Date(allocation.valid_from))} days
                      </p>
                    </div>

                    {allocation.cost_per_unit && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Unit Cost</label>
                        <p className="font-medium">
                          {allocation.currency} {allocation.cost_per_unit.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {allocation.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm bg-muted p-3 rounded">{allocation.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Distribution Tab */}
            <TabsContent value="inventory" className="space-y-4">
              <AllocationInventoryManager 
                allocationId={allocationId}
                allocation={allocation}
                inventorySummary={inventorySummary}
              />
            </TabsContent>

            {/* Release Schedule Tab */}
            <TabsContent value="releases" className="space-y-4">
              <ReleaseScheduleManager 
                allocationId={allocationId}
                allocation={allocation}
              />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4">
              <AllocationAvailabilityCalendar 
                allocationId={allocationId}
                allocation={allocation}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
