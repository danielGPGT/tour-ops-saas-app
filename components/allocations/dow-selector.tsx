'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { DayOfWeek } from '@/lib/types/allocation'

interface DowSelectorProps {
  selectedDays: DayOfWeek[]
  onDaysChange: (days: DayOfWeek[]) => void
  label?: string
  description?: string
  showCount?: boolean
  className?: string
}

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday', short: 'Mon' },
  { value: 'tue', label: 'Tuesday', short: 'Tue' },
  { value: 'wed', label: 'Wednesday', short: 'Wed' },
  { value: 'thu', label: 'Thursday', short: 'Thu' },
  { value: 'fri', label: 'Friday', short: 'Fri' },
  { value: 'sat', label: 'Saturday', short: 'Sat' },
  { value: 'sun', label: 'Sunday', short: 'Sun' },
] as const

export function DowSelector({ 
  selectedDays, 
  onDaysChange, 
  label = "Days of Week",
  description,
  showCount = true,
  className 
}: DowSelectorProps) {
  const handleDayToggle = (day: DayOfWeek, checked: boolean) => {
    if (checked) {
      onDaysChange([...selectedDays, day])
    } else {
      onDaysChange(selectedDays.filter(d => d !== day))
    }
  }

  const handleSelectAll = () => {
    onDaysChange(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
  }

  const handleSelectNone = () => {
    onDaysChange([])
  }

  const handleSelectWeekdays = () => {
    onDaysChange(['mon', 'tue', 'wed', 'thu', 'fri'])
  }

  const handleSelectWeekends = () => {
    onDaysChange(['sat', 'sun'])
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <div>
          <Label className="text-base font-medium">{label}</Label>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs px-2 py-1 rounded border hover:bg-muted"
        >
          All
        </button>
        <button
          type="button"
          onClick={handleSelectNone}
          className="text-xs px-2 py-1 rounded border hover:bg-muted"
        >
          None
        </button>
        <button
          type="button"
          onClick={handleSelectWeekdays}
          className="text-xs px-2 py-1 rounded border hover:bg-muted"
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={handleSelectWeekends}
          className="text-xs px-2 py-1 rounded border hover:bg-muted"
        >
          Weekends
        </button>
      </div>

      {/* Day Checkboxes */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex flex-col items-center space-y-2">
            <Checkbox
              id={`dow-${day.value}`}
              checked={selectedDays.includes(day.value)}
              onCheckedChange={(checked) => handleDayToggle(day.value, checked as boolean)}
            />
            <Label 
              htmlFor={`dow-${day.value}`} 
              className="text-sm font-medium cursor-pointer"
            >
              {day.short}
            </Label>
          </div>
        ))}
      </div>

      {/* Selection Summary */}
      {showCount && (
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
          </Badge>
          {selectedDays.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedDays.map(day => 
                DAYS_OF_WEEK.find(d => d.value === day)?.short
              ).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
