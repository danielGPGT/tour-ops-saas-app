'use client'

import { useState } from 'react'
import { format, isWeekend } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Calendar
} from 'lucide-react'
import type { AvailabilityCalendarDay } from '@/lib/types/availability'

interface DateCellProps {
  dayData: AvailabilityCalendarDay
  isSelected?: boolean
  isToday?: boolean
  onClick?: (dayData: AvailabilityCalendarDay) => void
  onToggleClosed?: (dayData: AvailabilityCalendarDay) => void
  className?: string
}

export function DateCell({ 
  dayData, 
  isSelected = false, 
  isToday = false,
  onClick,
  onToggleClosed,
  className = ''
}: DateCellProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getAvailabilityColor = () => {
    if (dayData.is_closed) return 'bg-gray-100 border-gray-300 text-gray-600'
    if (dayData.is_released) return 'bg-blue-100 border-blue-300 text-blue-800'
    if (dayData.available === 0) return 'bg-red-100 border-red-300 text-red-800'
    if (dayData.utilization_percentage >= 90) return 'bg-orange-100 border-orange-300 text-orange-800'
    if (dayData.utilization_percentage >= 50) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    return 'bg-green-100 border-green-300 text-green-800'
  }

  const getStatusIcon = () => {
    if (dayData.is_closed) return <Lock className="h-3 w-3" />
    if (dayData.is_released) return <Clock className="h-3 w-3" />
    if (dayData.available === 0) return <AlertTriangle className="h-3 w-3" />
    if (dayData.utilization_percentage >= 90) return <AlertTriangle className="h-3 w-3" />
    return <CheckCircle className="h-3 w-3" />
  }

  const getStatusText = () => {
    if (dayData.is_closed) return 'Closed'
    if (dayData.is_released) return 'Released'
    if (dayData.available === 0) return 'Sold Out'
    if (dayData.utilization_percentage >= 90) return 'Low Availability'
    return 'Available'
  }

  const getUtilizationBarColor = () => {
    if (dayData.is_closed || dayData.is_released) return 'bg-gray-300'
    if (dayData.utilization_percentage >= 90) return 'bg-red-500'
    if (dayData.utilization_percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleClick = () => {
    onClick?.(dayData)
  }

  const handleToggleClosed = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleClosed?.(dayData)
  }

  const cellContent = (
    <div
      className={`
        relative p-2 h-20 border rounded-lg cursor-pointer transition-all duration-200
        hover:shadow-md hover:scale-105
        ${getAvailabilityColor()}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isToday ? 'ring-2 ring-blue-300' : ''}
        ${className}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Date Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">
            {format(new Date(dayData.date), 'd')}
          </span>
          {isToday && (
            <div className="w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          {isHovered && (
            <Button
              size="sm"
              variant="ghost"
              className="h-4 w-4 p-0"
              onClick={handleToggleClosed}
            >
              {dayData.is_closed ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
            </Button>
          )}
        </div>
      </div>

      {/* Availability Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">
            {dayData.available}/{dayData.total_available}
          </span>
          <span className="text-muted-foreground">
            {Math.round(dayData.utilization_percentage)}%
          </span>
        </div>

        {/* Utilization Bar */}
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${getUtilizationBarColor()}`}
            style={{ width: `${Math.min(dayData.utilization_percentage, 100)}%` }}
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant="outline" 
            className="text-xs px-1 py-0 h-4"
          >
            {getStatusText()}
          </Badge>
          {dayData.booked > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {dayData.booked}
            </div>
          )}
        </div>
      </div>

      {/* Weekend Indicator */}
      {isWeekend(new Date(dayData.date)) && (
        <div className="absolute top-1 right-1">
          <div className="w-1 h-1 bg-blue-400 rounded-full" />
        </div>
      )}
    </div>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-medium">
              {format(new Date(dayData.date), 'EEEE, MMMM d, yyyy')}
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Available:</span>
                <span className="font-medium">{dayData.total_available}</span>
              </div>
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="font-medium">{dayData.available}</span>
              </div>
              <div className="flex justify-between">
                <span>Booked:</span>
                <span className="font-medium">{dayData.booked}</span>
              </div>
              {dayData.provisional > 0 && (
                <div className="flex justify-between">
                  <span>Provisional:</span>
                  <span className="font-medium">{dayData.provisional}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span className="font-medium">{Math.round(dayData.utilization_percentage)}%</span>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-3 w-3" />
                <span>Status: {getStatusText()}</span>
              </div>
              {dayData.is_weekend && (
                <div className="text-xs text-blue-600 mt-1">
                  Weekend
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
