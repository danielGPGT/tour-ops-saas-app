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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateDeadline, useUpdateDeadline } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

const deadlineSchema = z.object({
  deadline_type: z.string().min(1, 'Deadline type is required'),
  deadline_date: z.string().optional(),
  days_before_arrival: z.number().int().min(0).optional(),
  calculate_from: z.enum(['arrival', 'departure', 'booking_date']).optional(),
  penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']).optional(),
  penalty_value: z.number().min(0).optional(),
  penalty_description: z.string().optional(),
  notification_days_before: z.number().int().min(0).default(7),
  notes: z.string().optional()
}).refine(data => {
  if (data.penalty_type === 'percentage' && !data.penalty_value) {
    return false
  }
  if (data.penalty_type === 'fixed_amount' && !data.penalty_value) {
    return false
  }
  return true
}, {
  message: 'Please fill in all required fields',
  path: ['penalty_type']
})

type DeadlineFormData = z.infer<typeof deadlineSchema>

interface DeadlineFormProps {
  refType: string
  refId: string
  deadline?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function DeadlineForm({ 
  refType, 
  refId, 
  deadline, 
  onSuccess, 
  onCancel 
}: DeadlineFormProps) {
  const isEditing = !!deadline
  const createDeadline = useCreateDeadline()
  const updateDeadline = useUpdateDeadline()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<DeadlineFormData>({
    resolver: zodResolver(deadlineSchema),
    defaultValues: deadline ? {
      deadline_type: deadline.deadline_type || '',
      deadline_date: deadline.deadline_date || undefined,
      days_before_arrival: deadline.days_before_arrival || undefined,
      calculate_from: deadline.calculate_from || 'arrival',
      penalty_type: deadline.penalty_type || 'none',
      penalty_value: deadline.penalty_value || undefined,
      penalty_description: deadline.penalty_description || '',
      notification_days_before: deadline.notification_days_before || 7,
      notes: deadline.notes || ''
    } : {
      deadline_type: '',
      calculate_from: 'arrival',
      penalty_type: 'none',
      notification_days_before: 7
    }
  })

  const penaltyType = watch('penalty_type')

  const onSubmit = async (data: DeadlineFormData) => {
    try {
      const deadlineData = {
        ...data,
        ref_type: refType,
        ref_id: refId
      }

      if (isEditing) {
        await updateDeadline.mutateAsync({ id: deadline.id, data: deadlineData })
      } else {
        await createDeadline.mutateAsync(deadlineData)
      }

      toast.success(`Deadline ${isEditing ? 'updated' : 'created'} successfully`)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} deadline`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Deadline' : 'Add Deadline'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Deadline Type */}
            <div className="space-y-2">
              <Label htmlFor="deadline_type">Deadline Type *</Label>
              <Input
                id="deadline_type"
                {...register('deadline_type')}
                placeholder="e.g., Final Payment, Rooming List, Booking Cutoff"
              />
              {errors.deadline_type && (
                <p className="text-sm text-red-500">{errors.deadline_type.message}</p>
              )}
            </div>

            {/* Calculate From */}
            <div className="space-y-2">
              <Label htmlFor="calculate_from">Calculate From</Label>
              <Select
                value={watch('calculate_from')}
                onValueChange={(value) => setValue('calculate_from', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select calculate from" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="arrival">Arrival Date</SelectItem>
                  <SelectItem value="departure">Departure Date</SelectItem>
                  <SelectItem value="booking_date">Booking Date</SelectItem>
                </SelectContent>
              </Select>
              {errors.calculate_from && (
                <p className="text-sm text-red-500">{errors.calculate_from.message}</p>
              )}
            </div>

            {/* Days Before Arrival */}
            <div className="space-y-2">
              <Label htmlFor="days_before_arrival">Days Before Arrival</Label>
              <Input
                id="days_before_arrival"
                type="number"
                min="0"
                {...register('days_before_arrival', { valueAsNumber: true })}
                placeholder="e.g., 30"
              />
              {errors.days_before_arrival && (
                <p className="text-sm text-red-500">{errors.days_before_arrival.message}</p>
              )}
            </div>

            {/* Deadline Date */}
            <div className="space-y-2">
              <Label htmlFor="deadline_date">Deadline Date</Label>
              <Input
                id="deadline_date"
                type="date"
                {...register('deadline_date')}
              />
              {errors.deadline_date && (
                <p className="text-sm text-red-500">{errors.deadline_date.message}</p>
              )}
            </div>

            {/* Penalty Type */}
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
              {errors.penalty_type && (
                <p className="text-sm text-red-500">{errors.penalty_type.message}</p>
              )}
            </div>

            {/* Penalty Value */}
            {(penaltyType === 'percentage' || penaltyType === 'fixed_amount') && (
              <div className="space-y-2">
                <Label htmlFor="penalty_value">Penalty Value *</Label>
                <Input
                  id="penalty_value"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('penalty_value', { valueAsNumber: true })}
                  placeholder={penaltyType === 'percentage' ? 'e.g., 25' : 'e.g., 500'}
                />
                {errors.penalty_value && (
                  <p className="text-sm text-red-500">{errors.penalty_value.message}</p>
                )}
              </div>
            )}

            {/* Notification Days Before */}
            <div className="space-y-2">
              <Label htmlFor="notification_days_before">Notification Days Before</Label>
              <Input
                id="notification_days_before"
                type="number"
                min="0"
                {...register('notification_days_before', { valueAsNumber: true })}
                placeholder="7"
              />
              {errors.notification_days_before && (
                <p className="text-sm text-red-500">{errors.notification_days_before.message}</p>
              )}
            </div>
          </div>

          {/* Penalty Description */}
          <div className="space-y-2">
            <Label htmlFor="penalty_description">Penalty Description</Label>
            <Textarea
              id="penalty_description"
              {...register('penalty_description')}
              placeholder="Additional details about the penalty"
              rows={2}
            />
            {errors.penalty_description && (
              <p className="text-sm text-red-500">{errors.penalty_description.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this deadline"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
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
              {isEditing ? 'Update' : 'Create'} Deadline
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
