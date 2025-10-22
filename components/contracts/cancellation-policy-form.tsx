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
import { useCreateCancellationPolicy, useUpdateCancellationPolicy } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

const cancellationPolicySchema = z.object({
  days_before_from: z.number().int().min(0).optional(),
  days_before_to: z.number().int().min(0).optional(),
  penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']),
  penalty_percentage: z.number().min(0).max(100).optional(),
  penalty_amount: z.number().min(0).optional(),
  description: z.string().optional(),
  applies_to: z.enum(['all', 'deposit_only', 'balance_only']).default('all'),
  sort_order: z.number().int().default(0)
}).refine(data => {
  if (data.penalty_type === 'percentage' && !data.penalty_percentage) {
    return false
  }
  if (data.penalty_type === 'fixed_amount' && !data.penalty_amount) {
    return false
  }
  if (!data.days_before_from && !data.days_before_to) {
    return false
  }
  return true
}, {
  message: 'Please fill in all required fields',
  path: ['penalty_type']
})

type CancellationPolicyFormData = z.infer<typeof cancellationPolicySchema>

interface CancellationPolicyFormProps {
  contractId: string
  policy?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function CancellationPolicyForm({ 
  contractId, 
  policy, 
  onSuccess, 
  onCancel 
}: CancellationPolicyFormProps) {
  const isEditing = !!policy
  const createPolicy = useCreateCancellationPolicy()
  const updatePolicy = useUpdateCancellationPolicy()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<CancellationPolicyFormData>({
    resolver: zodResolver(cancellationPolicySchema),
    defaultValues: policy ? {
      days_before_from: policy.days_before_from || undefined,
      days_before_to: policy.days_before_to || undefined,
      penalty_type: policy.penalty_type || 'none',
      penalty_percentage: policy.penalty_percentage || undefined,
      penalty_amount: policy.penalty_amount || undefined,
      description: policy.description || '',
      applies_to: policy.applies_to || 'all',
      sort_order: policy.sort_order || 0
    } : {
      penalty_type: 'none',
      applies_to: 'all',
      sort_order: 0
    }
  })

  const penaltyType = watch('penalty_type')

  const onSubmit = async (data: CancellationPolicyFormData) => {
    try {
      const policyData = {
        ...data,
        contract_id: contractId
      }

      if (isEditing) {
        await updatePolicy.mutateAsync({ id: policy.id, data: policyData })
      } else {
        await createPolicy.mutateAsync(policyData)
      }

      toast.success(`Cancellation policy ${isEditing ? 'updated' : 'created'} successfully`)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} cancellation policy`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Cancellation Policy' : 'Add Cancellation Policy'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Days Before From */}
            <div className="space-y-2">
              <Label htmlFor="days_before_from">Days Before From</Label>
              <Input
                id="days_before_from"
                type="number"
                min="0"
                {...register('days_before_from', { valueAsNumber: true })}
                placeholder="e.g., 60"
              />
              {errors.days_before_from && (
                <p className="text-sm text-red-500">{errors.days_before_from.message}</p>
              )}
            </div>

            {/* Days Before To */}
            <div className="space-y-2">
              <Label htmlFor="days_before_to">Days Before To</Label>
              <Input
                id="days_before_to"
                type="number"
                min="0"
                {...register('days_before_to', { valueAsNumber: true })}
                placeholder="e.g., 30"
              />
              {errors.days_before_to && (
                <p className="text-sm text-red-500">{errors.days_before_to.message}</p>
              )}
            </div>

            {/* Penalty Type */}
            <div className="space-y-2">
              <Label htmlFor="penalty_type">Penalty Type *</Label>
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

            {/* Applies To */}
            <div className="space-y-2">
              <Label htmlFor="applies_to">Applies To</Label>
              <Select
                value={watch('applies_to')}
                onValueChange={(value) => setValue('applies_to', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select applies to" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="deposit_only">Deposit Only</SelectItem>
                  <SelectItem value="balance_only">Balance Only</SelectItem>
                </SelectContent>
              </Select>
              {errors.applies_to && (
                <p className="text-sm text-red-500">{errors.applies_to.message}</p>
              )}
            </div>

            {/* Penalty Percentage */}
            {penaltyType === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="penalty_percentage">Penalty Percentage *</Label>
                <Input
                  id="penalty_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register('penalty_percentage', { valueAsNumber: true })}
                  placeholder="e.g., 25"
                />
                {errors.penalty_percentage && (
                  <p className="text-sm text-red-500">{errors.penalty_percentage.message}</p>
                )}
              </div>
            )}

            {/* Penalty Amount */}
            {penaltyType === 'fixed_amount' && (
              <div className="space-y-2">
                <Label htmlFor="penalty_amount">Penalty Amount *</Label>
                <Input
                  id="penalty_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('penalty_amount', { valueAsNumber: true })}
                  placeholder="e.g., 500"
                />
                {errors.penalty_amount && (
                  <p className="text-sm text-red-500">{errors.penalty_amount.message}</p>
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
              placeholder="Additional details about this cancellation policy"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
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
              {isEditing ? 'Update' : 'Create'} Policy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
