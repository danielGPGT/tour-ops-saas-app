'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreatePaymentSchedule, useUpdatePaymentSchedule } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

const paymentScheduleSchema = z.object({
  payment_stage: z.string().min(1, 'Payment stage is required'),
  payment_type: z.enum(['percentage', 'fixed_amount']),
  percentage: z.number().min(0).max(100).optional(),
  fixed_amount: z.number().min(0).optional(),
  due_type: z.enum(['days_before_arrival', 'days_after_booking', 'fixed_date']),
  days_before: z.number().int().min(0).optional(),
  days_after: z.number().int().min(0).optional(),
  due_date: z.string().optional(),
  description: z.string().optional(),
  is_mandatory: z.boolean().default(true),
  sort_order: z.number().int().default(0)
}).refine(data => {
  if (data.payment_type === 'percentage' && !data.percentage) {
    return false
  }
  if (data.payment_type === 'fixed_amount' && !data.fixed_amount) {
    return false
  }
  if (data.due_type === 'days_before_arrival' && !data.days_before) {
    return false
  }
  if (data.due_type === 'days_after_booking' && !data.days_after) {
    return false
  }
  if (data.due_type === 'fixed_date' && !data.due_date) {
    return false
  }
  return true
}, {
  message: 'Please fill in all required fields',
  path: ['payment_type']
})

type PaymentScheduleFormData = z.infer<typeof paymentScheduleSchema>

interface PaymentScheduleFormProps {
  contractId: string
  schedule?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function PaymentScheduleForm({ 
  contractId, 
  schedule, 
  onSuccess, 
  onCancel 
}: PaymentScheduleFormProps) {
  const isEditing = !!schedule
  const createSchedule = useCreatePaymentSchedule()
  const updateSchedule = useUpdatePaymentSchedule()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<PaymentScheduleFormData>({
    resolver: zodResolver(paymentScheduleSchema),
    defaultValues: schedule ? {
      payment_stage: schedule.payment_stage || '',
      payment_type: schedule.payment_type || 'percentage',
      percentage: schedule.percentage || undefined,
      fixed_amount: schedule.fixed_amount || undefined,
      due_type: schedule.due_type || 'days_before_arrival',
      days_before: schedule.days_before || undefined,
      days_after: schedule.days_after || undefined,
      due_date: schedule.due_date || undefined,
      description: schedule.description || '',
      is_mandatory: schedule.is_mandatory ?? true,
      sort_order: schedule.sort_order || 0
    } : {
      payment_stage: '',
      payment_type: 'percentage',
      due_type: 'days_before_arrival',
      is_mandatory: true,
      sort_order: 0
    }
  })

  const paymentType = watch('payment_type')
  const dueType = watch('due_type')

  const onSubmit = async (data: PaymentScheduleFormData) => {
    try {
      const scheduleData = {
        ...data,
        contract_id: contractId
      }

      if (isEditing) {
        await updateSchedule.mutateAsync({ id: schedule.id, data: scheduleData })
      } else {
        await createSchedule.mutateAsync(scheduleData)
      }

      toast.success(`Payment schedule ${isEditing ? 'updated' : 'created'} successfully`)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} payment schedule`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Payment Schedule' : 'Add Payment Schedule'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Stage */}
            <div className="space-y-2">
              <Label htmlFor="payment_stage">Payment Stage *</Label>
              <Input
                id="payment_stage"
                {...register('payment_stage')}
                placeholder="e.g., Deposit, Interim Payment, Final Payment"
              />
              {errors.payment_stage && (
                <p className="text-sm text-red-500">{errors.payment_stage.message}</p>
              )}
            </div>

            {/* Payment Type */}
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
              {errors.payment_type && (
                <p className="text-sm text-red-500">{errors.payment_type.message}</p>
              )}
            </div>

            {/* Percentage or Fixed Amount */}
            {paymentType === 'percentage' ? (
              <div className="space-y-2">
                <Label htmlFor="percentage">Percentage *</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register('percentage', { valueAsNumber: true })}
                  placeholder="e.g., 50"
                />
                {errors.percentage && (
                  <p className="text-sm text-red-500">{errors.percentage.message}</p>
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
                  {...register('fixed_amount', { valueAsNumber: true })}
                  placeholder="e.g., 1000"
                />
                {errors.fixed_amount && (
                  <p className="text-sm text-red-500">{errors.fixed_amount.message}</p>
                )}
              </div>
            )}

            {/* Due Type */}
            <div className="space-y-2">
              <Label htmlFor="due_type">Due Type *</Label>
              <Select
                value={dueType}
                onValueChange={(value) => setValue('due_type', value as any)}
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
              {errors.due_type && (
                <p className="text-sm text-red-500">{errors.due_type.message}</p>
              )}
            </div>

            {/* Days Before/After or Due Date */}
            {dueType === 'days_before_arrival' && (
              <div className="space-y-2">
                <Label htmlFor="days_before">Days Before Arrival *</Label>
                <Input
                  id="days_before"
                  type="number"
                  min="0"
                  {...register('days_before', { valueAsNumber: true })}
                  placeholder="e.g., 30"
                />
                {errors.days_before && (
                  <p className="text-sm text-red-500">{errors.days_before.message}</p>
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
                  {...register('days_after', { valueAsNumber: true })}
                  placeholder="e.g., 7"
                />
                {errors.days_after && (
                  <p className="text-sm text-red-500">{errors.days_after.message}</p>
                )}
              </div>
            )}

            {dueType === 'fixed_date' && (
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register('due_date')}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-500">{errors.due_date.message}</p>
                )}
              </div>
            )}

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                min="0"
                {...register('sort_order', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.sort_order && (
                <p className="text-sm text-red-500">{errors.sort_order.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional details about this payment stage"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Mandatory Switch */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_mandatory"
              checked={watch('is_mandatory')}
              onCheckedChange={(checked) => setValue('is_mandatory', checked)}
            />
            <Label htmlFor="is_mandatory">This payment is mandatory</Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? 'Update' : 'Create'} Payment Schedule
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
