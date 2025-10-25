'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAllocation } from '@/lib/hooks/useAllocations'
import { useAvailabilityStats } from '@/lib/hooks/useAvailability'
import { AvailabilityCalendar } from '@/components/availability/availability-calendar'
import { AvailabilityStatsComponent } from '@/components/availability/availability-stats'
import { BulkUpdateDialog } from '@/components/availability/bulk-update-dialog'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Calendar,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { format, subDays, addDays } from 'date-fns'
import type { AvailabilityCalendarDay } from '@/lib/types/availability'

export default function AvailabilityCalendarPage() {
  const params = useParams()
  const router = useRouter()
  const allocationId = params.id as string
  
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [showBulkUpdate, setShowBulkUpdate] = useState(false)
  const [selectedDay, setSelectedDay] = useState<AvailabilityCalendarDay | null>(null)
  
  // Date range for stats (last 30 days to next 30 days)
  const dateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const dateTo = format(addDays(new Date(), 30), 'yyyy-MM-dd')
  
  const { data: allocation, isLoading: allocationLoading } = useAllocation(allocationId)
  const { data: stats, isLoading: statsLoading } = useAvailabilityStats(
    allocationId, 
    dateFrom, 
    dateTo
  )

  const handleDateClick = (dayData: AvailabilityCalendarDay) => {
    setSelectedDay(dayData)
  }

  const handleBulkUpdate = (selectedDates: string[]) => {
    setSelectedDates(selectedDates)
    setShowBulkUpdate(true)
  }

  const handleBulkUpdateSubmit = (updates: any) => {
    console.log('Bulk update:', updates)
    // Here you would call the API to update the selected dates
    setShowBulkUpdate(false)
    setSelectedDates([])
  }

  const handleRefresh = () => {
    // Refresh data
    window.location.reload()
  }

  const handleExport = () => {
    // Export availability data
    console.log('Export availability data')
  }

  if (allocationLoading) {
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

  if (!allocation) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Allocation not found</h3>
        <p className="mt-2 text-muted-foreground">
          The allocation you're looking for doesn't exist.
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
        title="Availability Calendar"
        description={`Manage daily availability for ${allocation.allocation_name}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Allocation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Allocation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Allocation Name</div>
              <div className="font-medium">{allocation.allocation_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-medium capitalize">
                {allocation.allocation_type.replace('_', ' ')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Valid Period</div>
              <div className="font-medium">
                {format(new Date(allocation.valid_from), 'MMM d')} - {format(new Date(allocation.valid_to), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <AvailabilityCalendar
            allocationId={allocationId}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateClick={handleDateClick}
            onBulkUpdate={handleBulkUpdate}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <AvailabilityStatsComponent
            stats={stats || {
              total_inventory: 0,
              total_available: 0,
              total_booked: 0,
              utilization_percentage: 0,
              sold_out_days: 0,
              low_availability_days: 0,
              closed_days: 0
            }}
            isLoading={statsLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Day Details */}
      {selectedDay && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(new Date(selectedDay.date), 'EEEE, MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Available</div>
                <div className="text-2xl font-bold">{selectedDay.total_available}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available</div>
                <div className="text-2xl font-bold text-green-600">{selectedDay.available}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Booked</div>
                <div className="text-2xl font-bold text-blue-600">{selectedDay.booked}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Utilization</div>
                <div className="text-2xl font-bold">
                  {Math.round(selectedDay.utilization_percentage)}%
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedDay(null)}
              >
                Close Details
              </Button>
              <Button
                onClick={() => {
                  // Handle edit for this specific day
                  console.log('Edit day:', selectedDay.date)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Day
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog
        open={showBulkUpdate}
        onOpenChange={setShowBulkUpdate}
        selectedDates={selectedDates}
        onUpdate={handleBulkUpdateSubmit}
      />
    </div>
  )
}
