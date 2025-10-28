'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Package,
  TrendingUp
} from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { useContractAllocations, useAvailabilityForAllocation } from '@/lib/hooks/useContracts'
import { cn } from '@/lib/utils'

interface ContractAllocationCalendarViewProps {
  contractId: string
}

export function ContractAllocationCalendarView({ contractId }: ContractAllocationCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedAllocation, setSelectedAllocation] = useState<string>('all')

  const { data: allocations = [] } = useContractAllocations(contractId)

  // Calculate date range for current month
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = monthStart.toISOString().split('T')[0]
  const endDate = monthEnd.toISOString().split('T')[0]

  // Get availability data for the selected allocation or all allocations
  const targetAllocationId = selectedAllocation === 'all' ? (allocations[0]?.id || '') : selectedAllocation
  
  const { data: availabilityData = [] } = useAvailabilityForAllocation(
    targetAllocationId,
    startDate,
    endDate
  )

  // Process availability data into a map for easy lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, any[]>()
    
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

  const getDateStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const records = availabilityMap.get(dateStr) || []
    
    if (records.length === 0) {
      return { status: 'no-data', color: 'bg-gray-50 text-gray-400 border-gray-200', records: [] }
    }

    const totalCapacity = records.reduce((sum, r) => sum + r.total_available, 0)
    const totalBooked = records.reduce((sum, r) => sum + r.booked, 0)
    const hasClosed = records.some(r => r.is_closed)

    if (hasClosed) {
      return { 
        status: 'closed', 
        color: 'bg-red-50 text-red-600 border-red-200', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `${totalBooked}/${totalCapacity} (Closed)`
      }
    }

    const utilizationRate = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0

    if (utilizationRate >= 100) {
      return { 
        status: 'sold-out', 
        color: 'bg-red-50 text-red-800 border-red-300', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `${totalBooked}/${totalCapacity} (Full)`
      }
    } else if (utilizationRate >= 80) {
      return { 
        status: 'high', 
        color: 'bg-orange-50 text-orange-800 border-orange-300', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `${totalBooked}/${totalCapacity}`
      }
    } else if (utilizationRate >= 50) {
      return { 
        status: 'medium', 
        color: 'bg-yellow-50 text-yellow-800 border-yellow-300', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `${totalBooked}/${totalCapacity}`
      }
    } else if (utilizationRate > 0) {
      return { 
        status: 'low', 
        color: 'bg-green-50 text-green-800 border-green-300', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `${totalBooked}/${totalCapacity}`
      }
    } else {
      return { 
        status: 'available', 
        color: 'bg-blue-50 text-blue-800 border-blue-300', 
        records, 
        totalCapacity, 
        totalBooked,
        summary: `0/${totalCapacity}`
      }
    }
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No Allocations</h3>
        <p className="text-sm text-muted-foreground">
          Create allocations first to view the availability calendar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedAllocation} onValueChange={setSelectedAllocation}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Allocations</SelectItem>
              {allocations.map((allocation: any) => (
                <SelectItem key={allocation.id} value={allocation.id}>
                  {allocation.allocation_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-gray-50 text-gray-600">No Data</Badge>
        <Badge variant="outline" className="bg-blue-50 text-blue-800">Available</Badge>
        <Badge variant="outline" className="bg-green-50 text-green-800">Low Booking</Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-800">Medium Booking</Badge>
        <Badge variant="outline" className="bg-orange-50 text-orange-800">High Booking</Badge>
        <Badge variant="outline" className="bg-red-50 text-red-800">Sold Out</Badge>
        <Badge variant="outline" className="bg-red-50 text-red-600">Closed</Badge>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <div className="grid grid-cols-7 gap-4">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-px bg-border">
            {monthDays.map(date => {
              const dateStatus = getDateStatus(date)
              const isCurrentDay = isToday(date)
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    'min-h-[100px] p-3 bg-background transition-colors',
                    dateStatus.color,
                    isCurrentDay && 'ring-2 ring-primary ring-inset',
                    'hover:bg-opacity-80 cursor-pointer'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {format(date, 'd')}
                      </span>
                      {isCurrentDay && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
                    {dateStatus.status !== 'no-data' && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium">
                          {dateStatus.summary}
                        </div>
                        {dateStatus.records.length > 1 && (
                          <div className="text-xs opacity-75">
                            {dateStatus.records.length} options
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">
                  {Array.from(availabilityMap.values()).reduce((sum, records) => 
                    sum + records.reduce((total, r) => total + r.total_available, 0), 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold text-orange-600">
                  {Array.from(availabilityMap.values()).reduce((sum, records) => 
                    sum + records.reduce((total, r) => total + r.booked, 0), 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold text-green-600">
                  {Array.from(availabilityMap.values()).reduce((sum, records) => 
                    sum + records.reduce((total, r) => total + r.available, 0), 0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
