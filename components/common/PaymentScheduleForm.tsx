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
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2 } from 'lucide-react'

const paymentScheduleSchema = z.object({
  payment_stage: z.string().min(1, 'Payment stage is required'),
  payment_type: z.enum(['percentage', 'fixed_amount']),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
  due_type: z.enum(['days_before_arrival', 'days_after_booking', 'fixed_date']),
  days_before: z.number().min(0).optional(),
  days_after: z.number().min(0).optional(),
  due_date: z.date().optional(),
  description: z.string().optional(),
  is_mandatory: z.boolean().default(true),
  sort_order: z.number().min(0).default(0)
})

type PaymentScheduleFormData = z.infer<typeof paymentScheduleSchema>

interface PaymentScheduleFormProps {
  defaultValues?: Partial<PaymentScheduleFormData>
  onSubmit: (data: PaymentScheduleFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function PaymentScheduleForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: PaymentScheduleFormProps) {
  const form = useForm<PaymentScheduleFormData>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: {
      payment_stage: '',
      payment_type: 'percentage',
      percentage: 0,
      fixed_amount: 0,
      due_type: 'days_before_arrival',
      days_before: 0,
      days_after: 0,
      description: '',
      is_mandatory: true,
      sort_order: 0,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const paymentType = watch('payment_type')
  const dueType = watch('due_type')

  const handleSubmit = (data: PaymentScheduleFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payment_stage">Payment Stage *</Label>
          <Input
            id="payment_stage"
            {...form.register('payment_stage')}
            placeholder="e.g., Deposit, Interim, Final"
          />
          {form.formState.errors.payment_stage && (
            <p className="text-sm text-red-600">{form.formState.errors.payment_stage.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_type">Payment Type *</Label>
          <Select
            value={paymentType}
            onValueChange={(value) => setValue('payment_type', value as 'percentage' | 'fixed_amount')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentType === 'percentage' ? (
          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage *</Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...form.register('percentage', { valueAsNumber: true })}
              placeholder="e.g., 50"
            />
            {form.formState.errors.percentage && (
              <p className="text-sm text-red-600">{form.formState.errors.percentage.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="fixed_amount">Fixed Amount *</Label>
            <Input
              id="fixed_amount"
              type="number"
              min="0"
              step="0.01"
              {...form.register('fixed_amount', { valueAsNumber: true })}
              placeholder="e.g., 1000"
            />
            {form.formState.errors.fixed_amount && (
              <p className="text-sm text-red-600">{form.formState.errors.fixed_amount.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="due_type">Due Type *</Label>
          <Select
            value={dueType}
            onValueChange={(value) => setValue('due_type', value as 'days_before_arrival' | 'days_after_booking' | 'fixed_date')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select due type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days_before_arrival">Days Before Arrival</SelectItem>
              <SelectItem value="days_after_booking">Days After Booking</SelectItem>
              <SelectItem value="fixed_date">Fixed Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {dueType === 'days_before_arrival' && (
        <div className="space-y-2">
          <Label htmlFor="days_before">Days Before Arrival *</Label>
          <Input
            id="days_before"
            type="number"
            min="0"
            {...form.register('days_before', { valueAsNumber: true })}
            placeholder="e.g., 30"
          />
          {form.formState.errors.days_before && (
            <p className="text-sm text-red-600">{form.formState.errors.days_before.message}</p>
          )}
        </div>
      )}

      {dueType === 'days_after_booking' && (
        <div className="space-y-2">
          <Label htmlFor="days_after">Days After Booking *</Label>
          <Input
            id="days_after"
            type="number"
            min="0"
            {...form.register('days_after', { valueAsNumber: true })}
            placeholder="e.g., 7"
          />
          {form.formState.errors.days_after && (
            <p className="text-sm text-red-600">{form.formState.errors.days_after.message}</p>
          )}
        </div>
      )}

      {dueType === 'fixed_date' && (
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date *</Label>
          <DatePicker
            date={form.watch('due_date')}
            onDateChange={(date) => setValue('due_date', date)}
            placeholder="Select due date"
          />
          {form.formState.errors.due_date && (
            <p className="text-sm text-red-600">{form.formState.errors.due_date.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Additional details about this payment stage"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_mandatory"
            checked={form.watch('is_mandatory')}
            onCheckedChange={(checked) => setValue('is_mandatory', checked as boolean)}
          />
          <Label htmlFor="is_mandatory">Mandatory Payment</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort_order">Sort Order</Label>
          <Input
            id="sort_order"
            type="number"
            min="0"
            {...form.register('sort_order', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? 'Update' : 'Create'} Payment Schedule
        </Button>
      </div>
    </form>
  )
}
