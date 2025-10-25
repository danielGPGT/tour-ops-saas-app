'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAllocation } from '@/lib/hooks/useAllocations'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { InfoCard } from '@/components/common/InfoCard'
import { DetailRow } from '@/components/common/DetailRow'
import { EnterpriseInlineEdit } from '@/components/common/EnterpriseInlineEdit'
import { SummaryCard } from '@/components/common/SummaryCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  Edit,
  Package,
  Calendar,
  Settings,
  AlertTriangle,
  Clock,
  ExternalLink,
  Building,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'

export default function AllocationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const allocationId = params.id as string
  
  const { data: allocation, isLoading, error } = useAllocation(allocationId)

  // Helper function to convert day numbers to day names
  const getDayName = (dayNumber: number) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days[dayNumber] || 'Unknown'
  }

  const handleEdit = () => {
    router.push(`/allocations/${allocationId}/edit`)
  }

  const handleSetupInventory = () => {
    router.push(`/allocations/${allocationId}/inventory`)
  }

  const handleViewAvailability = () => {
    router.push(`/allocations/${allocationId}/availability`)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'allotment': return 'bg-blue-100 text-blue-800'
      case 'free_sell': return 'bg-green-100 text-green-800'
      case 'on_request': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateRange = (from: string, to: string) => {
    const fromDate = format(new Date(from), 'MMM d, yyyy')
    const toDate = format(new Date(to), 'MMM d, yyyy')
    return `${fromDate} - ${toDate}`
  }

  const getDuration = () => {
    if (allocation?.valid_from && allocation?.valid_to) {
      const from = new Date(allocation.valid_from)
      const to = new Date(allocation.valid_to)
      const diffTime = Math.abs(to.getTime() - from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 0
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (error || !allocation) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Allocation not found</h3>
        <p className="mt-2 text-muted-foreground">
          The allocation you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={allocation.allocation_name}
        description={`Allocation ${allocation.id.slice(0, 8)}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={handleSetupInventory}>
              <Package className="mr-2 h-4 w-4" />
              Setup Inventory
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Allocation Type"
          value={allocation.allocation_type?.replace('_', ' ').toUpperCase() || 'Unknown'}
          icon={<Package className="h-4 w-4" />}
          description="Type of allocation"
        />
        <SummaryCard
          title="Valid Period"
          value={`${getDuration()} days`}
          icon={<Calendar className="h-4 w-4" />}
          description={formatDateRange(allocation.valid_from, allocation.valid_to)}
        />
        <SummaryCard
          title="Release Days"
          value={allocation.release_days === 0 ? 'Immediate' : `${allocation.release_days} days`}
          icon={<Clock className="h-4 w-4" />}
          description="Inventory release timing"
        />
        <SummaryCard
          title="Status"
          value={allocation.is_active ? 'Active' : 'Inactive'}
          icon={<Settings className="h-4 w-4" />}
          description="Current status"
          trend={allocation.is_active ? 'up' : 'down'}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  label="Allocation Name"
                  value={
                    <EnterpriseInlineEdit
                      value={allocation.allocation_name}
                      onSave={(value) => {
                        // TODO: Implement update
                        console.log('Update allocation name:', value)
                      }}
                      className="font-medium"
                    />
                  }
                />
                <DetailRow
                  label="Allocation Code"
                  value={<span className="font-mono">{allocation.allocation_code}</span>}
                />
                <DetailRow
                  label="Type"
                  value={
                    <Badge className={getTypeColor(allocation.allocation_type)}>
                      {allocation.allocation_type?.replace('_', ' ').toUpperCase() || 'Unknown'}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Status"
                  value={<StatusBadge status={allocation.is_active ? 'active' : 'inactive'} />}
                />
              </CardContent>
            </Card>

            {/* Contract & Product */}
            <Card>
              <CardHeader>
                <CardTitle>Contract & Product</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  label="Contract"
                  value={
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{allocation.contract?.contract_name}</div>
                        <div className="text-sm text-muted-foreground">
                          #{allocation.contract?.contract_number}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/contracts/${allocation.contract_id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  }
                />
                <DetailRow
                  label="Supplier"
                  value={
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{allocation.contract?.supplier?.name}</span>
                    </div>
                  }
                />
                <DetailRow
                  label="Product"
                  value={
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{allocation.product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {allocation.product?.code} • {allocation.product?.product_type?.type_name || 'Unknown'}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/products/${allocation.product_id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Dates & Timing */}
          <Card>
            <CardHeader>
              <CardTitle>Dates & Timing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailRow
                  label="Valid From"
                  value={format(new Date(allocation.valid_from), 'MMM d, yyyy')}
                />
                <DetailRow
                  label="Valid To"
                  value={format(new Date(allocation.valid_to), 'MMM d, yyyy')}
                />
                <DetailRow
                  label="Duration"
                  value={`${getDuration()} days`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow
                  label="Release Days"
                  value={allocation.release_days === 0 ? 'Immediate' : `${allocation.release_days} days`}
                />
                <DetailRow
                  label="Release Type"
                  value={allocation.release_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {allocation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{allocation.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Inventory Setup</h3>
            <p className="mt-2 text-muted-foreground">
              Configure which product options are available and their quantities.
            </p>
            <Button onClick={handleSetupInventory} className="mt-4">
              <Package className="mr-2 h-4 w-4" />
              Setup Inventory
            </Button>
          </div>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Availability Calendar</h3>
            <p className="mt-2 text-muted-foreground">
              View and manage daily availability for this allocation.
            </p>
            <Button onClick={handleViewAvailability} className="mt-4">
              <Calendar className="mr-2 h-4 w-4" />
              View Availability
            </Button>
          </div>
        </TabsContent>

        {/* Restrictions Tab */}
        <TabsContent value="restrictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Night Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Night Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  label="Min Nights"
                  value={allocation.min_nights ? `${allocation.min_nights} nights` : 'No minimum'}
                />
                <DetailRow
                  label="Max Nights"
                  value={allocation.max_nights ? `${allocation.max_nights} nights` : 'No maximum'}
                />
              </CardContent>
            </Card>

            {/* Day of Week Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Day of Week Restrictions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  label="Arrival Days"
                  value={
                    allocation.dow_arrival && allocation.dow_arrival.length > 0
                      ? allocation.dow_arrival.map(day => getDayName(day)).join(', ')
                      : 'All days allowed'
                  }
                />
                <DetailRow
                  label="Departure Days"
                  value={
                    allocation.dow_departure && allocation.dow_departure.length > 0
                      ? allocation.dow_departure.map(day => getDayName(day)).join(', ')
                      : 'All days allowed'
                  }
                />
              </CardContent>
            </Card>

            {/* Blackout Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Blackout Dates</CardTitle>
              </CardHeader>
              <CardContent>
                {allocation.blackout_dates && allocation.blackout_dates.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allocation.blackout_dates?.map((date) => (
                      <Badge key={date} variant="outline">
                        {format(new Date(date), 'MMM d, yyyy')}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No blackout dates set</p>
                )}
              </CardContent>
            </Card>

            {/* Overbooking */}
            <Card>
              <CardHeader>
                <CardTitle>Overbooking Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailRow
                  label="Allow Overbooking"
                  value={allocation.allow_overbooking ? 'Yes' : 'No'}
                />
                {allocation.allow_overbooking && (
                  <DetailRow
                    label="Overbooking Limit"
                    value={allocation.overbooking_limit ? `${allocation.overbooking_limit} units` : 'No limit'}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
