'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCreateCommissionTier, useUpdateCommissionTier } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { Loader2, Save, X } from 'lucide-react'

const commissionTierSchema = z.object({
  revenue_from: z.number().min(0, 'Revenue from must be positive'),
  revenue_to: z.number().min(0).optional(),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  sort_order: z.number().int().default(0)
}).refine(data => {
  if (data.revenue_to && data.revenue_to <= data.revenue_from) {
    return false
  }
  return true
}, {
  message: 'Revenue to must be greater than revenue from',
  path: ['revenue_to']
})

type CommissionTierFormData = z.infer<typeof commissionTierSchema>

interface CommissionTierFormProps {
  contractId: string
  tier?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function CommissionTierForm({ 
  contractId, 
  tier, 
  onSuccess, 
  onCancel 
}: CommissionTierFormProps) {
  const isEditing = !!tier
  const createTier = useCreateCommissionTier()
  const updateTier = useUpdateCommissionTier()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<CommissionTierFormData>({
    resolver: zodResolver(commissionTierSchema),
    defaultValues: tier ? {
      revenue_from: tier.revenue_from || 0,
      revenue_to: tier.revenue_to || undefined,
      commission_rate: tier.commission_rate || 0,
      sort_order: tier.sort_order || 0
    } : {
      revenue_from: 0,
      commission_rate: 0,
      sort_order: 0
    }
  })

  const onSubmit = async (data: CommissionTierFormData) => {
    try {
      const tierData = {
        ...data,
        contract_id: contractId
      }

      if (isEditing) {
        await updateTier.mutateAsync({ id: tier.id, data: tierData })
      } else {
        await createTier.mutateAsync(tierData)
      }

      toast.success(`Commission tier ${isEditing ? 'updated' : 'created'} successfully`)
      onSuccess?.()
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} commission tier`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Commission Tier' : 'Add Commission Tier'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revenue From */}
            <div className="space-y-2">
              <Label htmlFor="revenue_from">Revenue From *</Label>
              <Input
                id="revenue_from"
                type="number"
                min="0"
                step="0.01"
                {...register('revenue_from', { valueAsNumber: true })}
                placeholder="e.g., 0"
              />
              {errors.revenue_from && (
                <p className="text-sm text-red-500">{errors.revenue_from.message}</p>
              )}
            </div>

            {/* Revenue To */}
            <div className="space-y-2">
              <Label htmlFor="revenue_to">Revenue To</Label>
              <Input
                id="revenue_to"
                type="number"
                min="0"
                step="0.01"
                {...register('revenue_to', { valueAsNumber: true })}
                placeholder="e.g., 10000 (leave empty for unlimited)"
              />
              {errors.revenue_to && (
                <p className="text-sm text-red-500">{errors.revenue_to.message}</p>
              )}
            </div>

            {/* Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                {...register('commission_rate', { valueAsNumber: true })}
                placeholder="e.g., 5.5"
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500">{errors.commission_rate.message}</p>
              )}
            </div>

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
              {isEditing ? 'Update' : 'Create'} Tier
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
