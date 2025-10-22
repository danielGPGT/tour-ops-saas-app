"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2 } from 'lucide-react'

const deadlineSchema = z.object({
  deadline_type: z.string().min(1, 'Deadline type is required'),
  deadline_date: z.date().optional(),
  days_before_arrival: z.number().min(0).optional(),
  calculate_from: z.enum(['arrival', 'departure', 'booking_date']).optional(),
  penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']).optional(),
  penalty_value: z.number().min(0).optional(),
  penalty_description: z.string().optional(),
  status: z.enum(['pending', 'met', 'missed', 'waived', 'not_applicable']).default('pending'),
  notification_days_before: z.number().min(0).default(7),
  notes: z.string().optional()
})

type DeadlineFormData = z.infer<typeof deadlineSchema>

interface DeadlineFormProps {
  defaultValues?: Partial<DeadlineFormData>
  onSubmit: (data: DeadlineFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function DeadlineForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: DeadlineFormProps) {
  const form = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      deadline_type: '',
      deadline_date: undefined,
      days_before_arrival: undefined,
      calculate_from: 'arrival',
      penalty_type: 'none',
      penalty_value: 0,
      penalty_description: '',
      status: 'pending',
      notification_days_before: 7,
      notes: '',
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const penaltyType = watch('penalty_type')

  const handleSubmit = (data: DeadlineFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="deadline_type">Deadline Type *</Label>
        <Input
          id="deadline_type"
          {...form.register('deadline_type')}
          placeholder="e.g., Rooming List, Final Payment, Cancellation"
        />
        {form.formState.errors.deadline_type && (
          <p className="text-sm text-red-600">{form.formState.errors.deadline_type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deadline_date">Fixed Deadline Date</Label>
          <DatePicker
            date={form.watch('deadline_date')}
            onDateChange={(date) => setValue('deadline_date', date)}
            placeholder="Select deadline date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="days_before_arrival">Days Before Arrival</Label>
          <Input
            id="days_before_arrival"
            type="number"
            min="0"
            {...form.register('days_before_arrival', { valueAsNumber: true })}
            placeholder="e.g., 30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calculate_from">Calculate From</Label>
        <Select
          value={form.watch('calculate_from')}
          onValueChange={(value) => setValue('calculate_from', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select calculation base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arrival">Arrival Date</SelectItem>
            <SelectItem value="departure">Departure Date</SelectItem>
            <SelectItem value="booking_date">Booking Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="penalty_type">Penalty Type</Label>
        <Select
          value={penaltyType}
          onValueChange={(value) => setValue('penalty_type', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select penalty type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Penalty</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            <SelectItem value="forfeit_deposit">Forfeit Deposit</SelectItem>
            <SelectItem value="forfeit_all">Forfeit All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {penaltyType === 'percentage' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_value">Penalty Percentage</Label>
          <Input
            id="penalty_value"
            type="number"
            min="0"
            max="100"
            step="0.01"
            {...form.register('penalty_value', { valueAsNumber: true })}
            placeholder="e.g., 25"
          />
        </div>
      )}

      {penaltyType === 'fixed_amount' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_value">Penalty Amount</Label>
          <Input
            id="penalty_value"
            type="number"
            min="0"
            step="0.01"
            {...form.register('penalty_value', { valueAsNumber: true })}
            placeholder="e.g., 500"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="penalty_description">Penalty Description</Label>
        <Textarea
          id="penalty_description"
          {...form.register('penalty_description')}
          placeholder="Additional details about the penalty"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="met">Met</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification_days_before">Notification Days Before</Label>
          <Input
            id="notification_days_before"
            type="number"
            min="0"
            {...form.register('notification_days_before', { valueAsNumber: true })}
            placeholder="7"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register('notes')}
          placeholder="Additional notes about this deadline"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? 'Update' : 'Create'} Deadline
        </Button>
      </div>
    </form>
  )
}

// Buttonless version for use inside EditDialog
export function DeadlineFormContent({ 
  defaultValues, 
  onSubmit, 
  isLoading = false 
}: Omit<DeadlineFormProps, 'onCancel'>) {
  const form = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: {
      deadline_type: '',
      deadline_date: undefined,
      days_before_arrival: undefined,
      calculate_from: 'arrival',
      penalty_type: 'none',
      penalty_value: 0,
      penalty_description: '',
      status: 'pending',
      notification_days_before: 7,
      notes: '',
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const penaltyType = watch('penalty_type')

  const handleSubmit = (data: DeadlineFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="deadline_type">Deadline Type *</Label>
        <Input
          id="deadline_type"
          {...form.register('deadline_type')}
          placeholder="e.g., Rooming List, Final Payment, Cancellation"
        />
        {form.formState.errors.deadline_type && (
          <p className="text-sm text-red-600">{form.formState.errors.deadline_type.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deadline_date">Fixed Deadline Date</Label>
          <DatePicker
            date={form.watch('deadline_date')}
            onDateChange={(date) => setValue('deadline_date', date)}
            placeholder="Select deadline date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="days_before_arrival">Days Before Arrival</Label>
          <Input
            id="days_before_arrival"
            type="number"
            min="0"
            {...form.register('days_before_arrival', { valueAsNumber: true })}
            placeholder="e.g., 30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calculate_from">Calculate From</Label>
        <Select
          value={form.watch('calculate_from')}
          onValueChange={(value) => setValue('calculate_from', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select calculation base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="arrival">Arrival Date</SelectItem>
            <SelectItem value="departure">Departure Date</SelectItem>
            <SelectItem value="booking_date">Booking Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="penalty_type">Penalty Type</Label>
        <Select
          value={penaltyType}
          onValueChange={(value) => setValue('penalty_type', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select penalty type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Penalty</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            <SelectItem value="forfeit_deposit">Forfeit Deposit</SelectItem>
            <SelectItem value="forfeit_all">Forfeit All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {penaltyType === 'percentage' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_value">Penalty Percentage</Label>
          <Input
            id="penalty_value"
            type="number"
            min="0"
            max="100"
            step="0.01"
            {...form.register('penalty_value', { valueAsNumber: true })}
            placeholder="e.g., 25"
          />
        </div>
      )}

      {penaltyType === 'fixed_amount' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_value">Penalty Amount</Label>
          <Input
            id="penalty_value"
            type="number"
            min="0"
            step="0.01"
            {...form.register('penalty_value', { valueAsNumber: true })}
            placeholder="e.g., 500"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="penalty_description">Penalty Description</Label>
        <Textarea
          id="penalty_description"
          {...form.register('penalty_description')}
          placeholder="Additional details about the penalty"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="met">Met</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
              <SelectItem value="waived">Waived</SelectItem>
              <SelectItem value="not_applicable">Not Applicable</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notification_days_before">Notification Days Before</Label>
          <Input
            id="notification_days_before"
            type="number"
            min="0"
            {...form.register('notification_days_before', { valueAsNumber: true })}
            placeholder="7"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register('notes')}
          placeholder="Additional notes about this deadline"
          rows={3}
        />
      </div>
    </form>
  )
}
