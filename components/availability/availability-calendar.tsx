'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { DateCell } from './date-cell'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Download,
  Settings,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock
} from 'lucide-react'
import type { AvailabilityCalendarDay } from '@/lib/types/availability'

interface AvailabilityCalendarProps {
  allocationId: string
  dateFrom: string
  dateTo: string
  onDateClick?: (dayData: AvailabilityCalendarDay) => void
  onBulkUpdate?: (selectedDates: string[]) => void
  className?: string
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function AvailabilityCalendar({
  allocationId,
  dateFrom,
  dateTo,
  onDateClick,
  onBulkUpdate,
  className = ''
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock data - in real app, this would come from the API
  const [calendarData, setCalendarData] = useState<AvailabilityCalendarDay[]>([])

  // Generate mock calendar data
  useEffect(() => {
    const generateMockData = () => {
      const startDate = startOfMonth(currentMonth)
      const endDate = endOfMonth(currentMonth)
      const days = eachDayOfInterval({ start: startDate, end: endDate })
      
      return days.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        total_available: Math.floor(Math.random() * 100) + 50,
        available: Math.floor(Math.random() * 50) + 10,
        booked: Math.floor(Math.random() * 30),
        provisional: Math.floor(Math.random() * 5),
        utilization_percentage: Math.random() * 100,
        is_closed: Math.random() < 0.1,
        is_released: Math.random() < 0.05,
        is_weekend: date.getDay() === 0 || date.getDay() === 6,
        is_blackout: Math.random() < 0.05
      }))
    }

    setCalendarData(generateMockData())
  }, [currentMonth])

  const handleDateClick = (dayData: AvailabilityCalendarDay) => {
    onDateClick?.(dayData)
  }

  const handleDateSelect = (dayData: AvailabilityCalendarDay) => {
    const dateStr = dayData.date
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    )
  }

  const handleSelectAll = () => {
    const allDates = calendarData.map(day => day.date)
    setSelectedDates(allDates)
  }

  const handleSelectNone = () => {
    setSelectedDates([])
  }

  const handleSelectWeekends = () => {
    const weekendDates = calendarData
      .filter(day => day.is_weekend)
      .map(day => day.date)
    setSelectedDates(weekendDates)
  }

  const handleBulkUpdate = () => {
    if (selectedDates.length > 0) {
      onBulkUpdate?.(selectedDates)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getFilteredData = () => {
    if (filterStatus === 'all') return calendarData
    
    return calendarData.filter(day => {
      switch (filterStatus) {
        case 'available':
          return day.available > 0 && !day.is_closed
        case 'sold_out':
          return day.available === 0 && !day.is_closed
        case 'low_availability':
          return day.utilization_percentage >= 90 && !day.is_closed
        case 'closed':
          return day.is_closed
        case 'released':
          return day.is_released
        default:
          return true
      }
    })
  }

  const filteredData = getFilteredData()

  const getLegendItems = () => [
    { color: 'bg-green-100 border-green-300', label: 'High Availability (>50%)', icon: CheckCircle },
    { color: 'bg-yellow-100 border-yellow-300', label: 'Medium (10-50%)', icon: AlertTriangle },
    { color: 'bg-orange-100 border-orange-300', label: 'Low (<10%)', icon: AlertTriangle },
    { color: 'bg-red-100 border-red-300', label: 'Sold Out', icon: AlertTriangle },
    { color: 'bg-gray-100 border-gray-300', label: 'Closed', icon: Lock },
    { color: 'bg-blue-100 border-blue-300', label: 'Released', icon: Clock },
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold_out">Sold Out</SelectItem>
              <SelectItem value="low_availability">Low Availability</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
              <SelectItem value="released">Released</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Selection Actions */}
      {selectedDates.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectNone}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectWeekends}
                >
                  Weekends
                </Button>
              </div>
              <Button
                onClick={handleBulkUpdate}
                disabled={selectedDates.length === 0}
              >
                <Settings className="h-4 w-4 mr-2" />
                Bulk Update
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {filteredData.map((dayData) => {
                const date = new Date(dayData.date)
                const isCurrentMonth = isSameMonth(date, currentMonth)
                const isToday = isSameDay(date, new Date())
                const isSelected = selectedDates.includes(dayData.date)

                return (
                  <DateCell
                    key={dayData.date}
                    dayData={dayData}
                    isSelected={isSelected}
                    isToday={isToday}
                    onClick={handleDateSelect}
                    onToggleClosed={(day) => {
                      // Handle toggle closed
                      console.log('Toggle closed for:', day.date)
                    }}
                    className={!isCurrentMonth ? 'opacity-30' : ''}
                  />
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {getLegendItems().map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${item.color}`} />
                <div className="flex items-center gap-1">
                  <item.icon className="h-3 w-3" />
                  <span className="text-sm">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Available Days</div>
                <div className="text-lg font-semibold">
                  {filteredData.filter(d => d.available > 0 && !d.is_closed).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm text-muted-foreground">Sold Out Days</div>
                <div className="text-lg font-semibold">
                  {filteredData.filter(d => d.available === 0 && !d.is_closed).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <div>
                <div className="text-sm text-muted-foreground">Closed Days</div>
                <div className="text-lg font-semibold">
                  {filteredData.filter(d => d.is_closed).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Released Days</div>
                <div className="text-lg font-semibold">
                  {filteredData.filter(d => d.is_released).length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
