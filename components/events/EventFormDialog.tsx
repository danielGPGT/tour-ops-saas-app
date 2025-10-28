'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateEvent, useUpdateEvent } from '@/lib/hooks/useEvents'
import { toast } from 'sonner'
import { CalendarIcon } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { cn } from '@/lib/utils'

const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  event_type: z.string().min(1, 'Event type is required'),
  start_date: z.date({
    required_error: 'Start date is required'
  }),
  end_date: z.date({
    required_error: 'End date is required'
  }),
  location: z.string().min(1, 'Location is required'),
  venue: z.string().optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'cancelled']).optional()
}).refine(data => data.end_date >= data.start_date, {
  message: 'End date must be on or after start date',
  path: ['end_date']
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormDialogProps {
  organizationId: string
  existingEvent?: any
  onClose: () => void
  onSuccess: () => void
}

const EVENT_TYPES = [
  'Formula 1',
  'MotoGP', 
  'Tennis',
  'Golf',
  'Olympics',
  'Football',
  'Rugby',
  'Cricket',
  'Basketball',
  'Other Sports',
  'Concert',
  'Festival',
  'Conference',
  'Exhibition',
  'Other'
]

export function EventFormDialog({ 
  organizationId, 
  existingEvent, 
  onClose, 
  onSuccess 
}: EventFormDialogProps) {
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const isEditing = !!existingEvent
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: existingEvent ? {
      name: existingEvent.name,
      code: existingEvent.code,
      description: existingEvent.description || '',
      event_type: existingEvent.event_type,
      start_date: new Date(existingEvent.start_date),
      end_date: new Date(existingEvent.end_date),
      location: existingEvent.location,
      venue: existingEvent.venue || '',
      status: existingEvent.status
    } : {
      name: '',
      code: '',
      description: '',
      event_type: '',
      start_date: addDays(new Date(), 30), // Default to 30 days from now
      end_date: addDays(new Date(), 33), // Default to 3-day event
      location: '',
      venue: '',
      status: 'upcoming'
    }
  })

  const { handleSubmit, register, setValue, watch, formState: { errors, isSubmitting } } = form
  
  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const eventName = watch('name')

  // Auto-generate code when name changes (if not editing)
  React.useEffect(() => {
    if (!isEditing && eventName && !watch('code')) {
      const baseCode = eventName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 10)
      const year = startDate ? startDate.getFullYear() : new Date().getFullYear()
      setValue('code', `${baseCode}-${year}`)
    }
  }, [eventName, startDate, isEditing, setValue, watch])

  const onSubmit = async (data: EventFormData) => {
    try {
      if (isEditing) {
        await updateEvent.mutateAsync({
          id: existingEvent.id,
          data: {
            ...data,
            start_date: data.start_date.toISOString(),
            end_date: data.end_date.toISOString()
          }
        })
        toast.success('Event updated successfully')
      } else {
        await createEvent.mutateAsync({
          organization_id: organizationId,
          ...data,
          start_date: data.start_date.toISOString(),
          end_date: data.end_date.toISOString()
        })
        toast.success('Event created successfully')
      }
      onSuccess()
    } catch (error: any) {
      console.error('Error saving event:', error)
      toast.error('Failed to save event: ' + (error.message || 'Unknown error'))
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the event details below'
              : 'Create a new event to link with your products and contracts'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., Monaco Grand Prix 2025"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Event Code</Label>
              <Input
                id="code"
                {...register('code')}
                placeholder="e.g., MONACO-2025"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name if left blank
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the event..."
              rows={3}
            />
          </div>

          {/* Event Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select 
                value={watch('event_type')} 
                onValueChange={(value) => setValue('event_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.event_type && (
                <p className="text-sm text-destructive">{errors.event_type.message}</p>
              )}
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue('start_date', date)
                        // Auto-adjust end date if it's before start date
                        if (endDate && date > endDate) {
                          setValue('end_date', addDays(date, 2))
                        }
                      }
                      setStartDateOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      if (date) setValue('end_date', date)
                      setEndDateOpen(false)
                    }}
                    disabled={(date) => startDate ? date < startDate : date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., Monaco, France"
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                {...register('venue')}
                placeholder="e.g., Circuit de Monaco"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-24"
            >
              {isSubmitting 
                ? 'Saving...' 
                : isEditing 
                  ? 'Update Event' 
                  : 'Create Event'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
