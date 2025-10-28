'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Settings
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, parseISO } from 'date-fns'
import { 
  useAvailabilityForAllocation,
  useCreateAvailabilityRecord,
  useUpdateAvailabilityRecord,
  useBulkCreateAvailability
} from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AllocationAvailabilityCalendarProps {
  allocationId: string
  allocation: any
}

interface AvailabilityRecord {
  id: string
  date: string
  total_available: number
  available: number
  booked: number
  is_closed: boolean
  allocation_inventory: {
    id: string
    product_option: {
      id: string
      option_name: string
      option_code: string
    }
  }
}

export function AllocationAvailabilityCalendar({ 
  allocationId, 
  allocation 
}: AllocationAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isCreatingBulk, setIsCreatingBulk] = useState(false)
  const [editingRecord, setEditingRecord] = useState<AvailabilityRecord | null>(null)

  // Calculate date range for current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = monthStart.toISOString().split('T')[0]
  const endDate = monthEnd.toISOString().split('T')[0]

  const { data: availabilityData = [], isLoading } = useAvailabilityForAllocation(
    allocationId,
    startDate,
    endDate
  )

  const createRecord = useCreateAvailabilityRecord()
  const updateRecord = useUpdateAvailabilityRecord()
  const bulkCreate = useBulkCreateAvailability()

  // Process availability data into a map for easy lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityRecord[]>()
    
    availabilityData?.forEach((record: any) => {
      const dateKey = record.date
      if (!map.has(dateKey)) {
        map.set(dateKey, [])
      }
      map.get(dateKey)!.push(record)
    })
    
    return map
  }, [availabilityData])

  // Generate all days in the current month
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const records = availabilityMap.get(dateStr) || []
    
    if (records.length === 0) {
      return { status: 'no-data', color: 'bg-gray-100 text-gray-400', records: [] }
    }

    const totalCapacity = records.reduce((sum, r) => sum + r.total_available, 0)
    const totalBooked = records.reduce((sum, r) => sum + r.booked, 0)
    const totalAvailable = records.reduce((sum, r) => sum + r.available, 0)
    const hasClosed = records.some(r => r.is_closed)

    if (hasClosed) {
      return { status: 'closed', color: 'bg-red-100 text-red-600', records, totalCapacity, totalBooked, totalAvailable }
    }

    const utilizationRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0

    if (utilizationRate >= 100) {
      return { status: 'sold-out', color: 'bg-red-100 text-red-800', records, totalCapacity, totalBooked, totalAvailable }
    } else if (utilizationRate >= 80) {
      return { status: 'high', color: 'bg-orange-100 text-orange-800', records, totalCapacity, totalBooked, totalAvailable }
    } else if (utilizationRate >= 50) {
      return { status: 'medium', color: 'bg-yellow-100 text-yellow-800', records, totalCapacity, totalBooked, totalAvailable }
    } else if (utilizationRate > 0) {
      return { status: 'low', color: 'bg-green-100 text-green-800', records, totalCapacity, totalBooked, totalAvailable }
    } else {
      return { status: 'available', color: 'bg-blue-100 text-blue-800', records, totalCapacity, totalBooked, totalAvailable }
    }
  }

  const handleBulkCreate = async (data: {
    startDate: string
    endDate: string
    inventorySelections: { inventoryId: string; quantity: number }[]
  }) => {
    try {
      // Create availability records for each selected inventory and date range
      for (const selection of data.inventorySelections) {
        await bulkCreate.mutateAsync({
          allocationInventoryId: selection.inventoryId,
          dateRange: { start: data.startDate, end: data.endDate },
          defaultAvailable: selection.quantity
        })
      }
      
      setIsCreatingBulk(false)
      toast.success('Availability calendar created successfully')
      
    } catch (error) {
      console.error('Error creating availability:', error)
      toast.error('Failed to create availability calendar')
    }
  }

  const handleUpdateRecord = async (recordId: string, updates: any) => {
    try {
      await updateRecord.mutateAsync({ id: recordId, updates })
      setEditingRecord(null)
      toast.success('Availability updated successfully')
      
    } catch (error) {
      console.error('Error updating availability:', error)
      toast.error('Failed to update availability')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Availability Calendar</CardTitle>
              <CardDescription>
                Date-specific inventory tracking for {allocation.allocation_name}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreatingBulk(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Setup Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className="bg-gray-100 text-gray-600">No Data</Badge>
            <Badge className="bg-blue-100 text-blue-800">Available</Badge>
            <Badge className="bg-green-100 text-green-800">Low Booking</Badge>
            <Badge className="bg-yellow-100 text-yellow-800">Medium Booking</Badge>
            <Badge className="bg-orange-100 text-orange-800">High Booking</Badge>
            <Badge className="bg-red-100 text-red-800">Sold Out</Badge>
            <Badge className="bg-red-100 text-red-600">Closed</Badge>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {monthDays.map(date => {
              const dateStatus = getDateStatus(date)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isCurrentDay = isToday(date)
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'min-h-[60px] p-1 border border-border cursor-pointer transition-colors',
                    dateStatus.color,
                    isSelected && 'ring-2 ring-primary',
                    isCurrentDay && 'ring-1 ring-blue-500'
                  )}
                  onClick={() => handleDateClick(date)}
                >
                  <div className="text-xs font-medium">
                    {format(date, 'd')}
                  </div>
                  {dateStatus.status !== 'no-data' && (
                    <div className="text-xs mt-1">
                      <div>{dateStatus.totalBooked}/{dateStatus.totalCapacity}</div>
                      {dateStatus.status === 'closed' && (
                        <XCircle className="h-3 w-3 mt-1" />
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Selected Date Details */}
          {selectedDate && (
            <SelectedDateDetails
              date={selectedDate}
              availabilityRecords={availabilityMap.get(format(selectedDate, 'yyyy-MM-dd')) || []}
              onEdit={(record) => setEditingRecord(record)}
              allocation={allocation}
            />
          )}
        </CardContent>
      </Card>

      {/* Bulk Create Dialog */}
      {isCreatingBulk && (
        <BulkAvailabilityDialog
          allocation={allocation}
          onSave={handleBulkCreate}
          onCancel={() => setIsCreatingBulk(false)}
          isSubmitting={bulkCreate.isPending}
        />
      )}

      {/* Edit Record Dialog */}
      {editingRecord && (
        <EditAvailabilityDialog
          record={editingRecord}
          onSave={(updates) => handleUpdateRecord(editingRecord.id, updates)}
          onCancel={() => setEditingRecord(null)}
          isSubmitting={updateRecord.isPending}
        />
      )}
    </div>
  )
}

// Selected date details component
function SelectedDateDetails({ 
  date, 
  availabilityRecords, 
  onEdit, 
  allocation 
}: {
  date: Date
  availabilityRecords: AvailabilityRecord[]
  onEdit: (record: AvailabilityRecord) => void
  allocation: any
}) {
  if (availabilityRecords.length === 0) {
    return (
      <Alert>
        <CalendarIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>{format(date, 'EEEE, MMMM d, yyyy')}</strong>
          <br />
          No availability data for this date. Use "Setup Calendar" to create availability records.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {availabilityRecords.map(record => (
            <div
              key={record.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">
                  {record.allocation_inventory.product_option.option_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {record.allocation_inventory.product_option.option_code}
                </div>
                <div className="flex gap-4 mt-1 text-sm">
                  <span>Total: {record.total_available}</span>
                  <span className="text-orange-600">Booked: {record.booked}</span>
                  <span className="text-green-600">Available: {record.available}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {record.is_closed && (
                  <Badge variant="destructive">Closed</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(record)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Bulk availability creation dialog
function BulkAvailabilityDialog({
  allocation,
  onSave,
  onCancel,
  isSubmitting = false
}: {
  allocation: any
  onSave: (data: {
    startDate: string
    endDate: string
    inventorySelections: { inventoryId: string; quantity: number }[]
  }) => void
  onCancel: () => void
  isSubmitting?: boolean
}) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [inventorySelections, setInventorySelections] = useState<{ inventoryId: string; quantity: number }[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates')
      return
    }
    
    if (inventorySelections.length === 0) {
      toast.error('Please select at least one product option')
      return
    }

    onSave({ startDate, endDate, inventorySelections })
  }

  const handleInventoryToggle = (inventoryId: string, quantity: number) => {
    setInventorySelections(prev => {
      const existing = prev.find(s => s.inventoryId === inventoryId)
      if (existing) {
        return prev.filter(s => s.inventoryId !== inventoryId)
      } else {
        return [...prev, { inventoryId, quantity }]
      }
    })
  }

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Setup Availability Calendar</DialogTitle>
          <DialogDescription>
            Create availability records for a date range
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Product Options *</Label>
            <div className="space-y-2 mt-2">
              {allocation?.allocation_inventory?.map((inventory: any) => {
                const isSelected = inventorySelections.some(s => s.inventoryId === inventory.id)
                
                return (
                  <div
                    key={inventory.id}
                    className={cn(
                      'flex items-center justify-between p-3 border rounded cursor-pointer',
                      isSelected && 'border-primary bg-primary/5'
                    )}
                    onClick={() => handleInventoryToggle(inventory.id, inventory.total_quantity)}
                  >
                    <div>
                      <div className="font-medium">{inventory.product_option.option_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {inventory.total_quantity} units available
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleInventoryToggle(inventory.id, inventory.total_quantity)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Calendar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit availability record dialog
function EditAvailabilityDialog({
  record,
  onSave,
  onCancel,
  isSubmitting = false
}: {
  record: AvailabilityRecord
  onSave: (updates: any) => void
  onCancel: () => void
  isSubmitting?: boolean
}) {
  const [totalAvailable, setTotalAvailable] = useState(record.total_available)
  const [isClosed, setIsClosed] = useState(record.is_closed)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate new available quantity (total - booked)
    const newAvailable = Math.max(0, totalAvailable - record.booked)
    
    onSave({
      total_available: totalAvailable,
      available: newAvailable,
      is_closed: isClosed
    })
  }

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Availability</DialogTitle>
          <DialogDescription>
            {format(parseISO(record.date), 'EEEE, MMMM d, yyyy')} - {record.allocation_inventory.product_option.option_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="total_available">Total Available *</Label>
            <Input
              id="total_available"
              type="number"
              min="0"
              value={totalAvailable}
              onChange={(e) => setTotalAvailable(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Currently booked: {record.booked}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_closed"
              type="checkbox"
              checked={isClosed}
              onChange={(e) => setIsClosed(e.target.checked)}
            />
            <Label htmlFor="is_closed">Mark as closed (no new bookings)</Label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
