"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

const commissionTierSchema = z.object({
  revenue_from: z.number().min(0, 'Revenue from must be at least 0'),
  revenue_to: z.number().min(0).optional(),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  sort_order: z.number().min(0).default(0)
})

type CommissionTierFormData = z.infer<typeof commissionTierSchema>

interface CommissionTierFormProps {
  defaultValues?: Partial<CommissionTierFormData>
  onSubmit: (data: CommissionTierFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CommissionTierForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CommissionTierFormProps) {
  const form = useForm<CommissionTierFormData>({
    resolver: zodResolver(commissionTierSchema),
    defaultValues: {
      revenue_from: 0,
      revenue_to: undefined,
      commission_rate: 0,
      sort_order: 0,
      ...defaultValues
    }
  })

  const handleSubmit = (data: CommissionTierFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="revenue_from">Revenue From *</Label>
          <Input
            id="revenue_from"
            type="number"
            min="0"
            step="0.01"
            {...form.register('revenue_from', { valueAsNumber: true })}
            placeholder="e.g., 0"
          />
          {form.formState.errors.revenue_from && (
            <p className="text-sm text-red-600">{form.formState.errors.revenue_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue_to">Revenue To</Label>
          <Input
            id="revenue_to"
            type="number"
            min="0"
            step="0.01"
            {...form.register('revenue_to', { valueAsNumber: true })}
            placeholder="e.g., 10000 (leave empty for unlimited)"
          />
          {form.formState.errors.revenue_to && (
            <p className="text-sm text-red-600">{form.formState.errors.revenue_to.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
        <Input
          id="commission_rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          {...form.register('commission_rate', { valueAsNumber: true })}
          placeholder="e.g., 10"
        />
        {form.formState.errors.commission_rate && (
          <p className="text-sm text-red-600">{form.formState.errors.commission_rate.message}</p>
        )}
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

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? 'Update' : 'Create'} Commission Tier
        </Button>
      </div>
    </form>
  )
}

// Buttonless version for use inside EditDialog
export function CommissionTierFormContent({ 
  defaultValues, 
  onSubmit, 
  isLoading = false 
}: Omit<CommissionTierFormProps, 'onCancel'>) {
  const form = useForm<CommissionTierFormData>({
    resolver: zodResolver(commissionTierSchema),
    defaultValues: {
      revenue_from: 0,
      revenue_to: undefined,
      commission_rate: 0,
      sort_order: 0,
      ...defaultValues
    }
  })

  const handleSubmit = (data: CommissionTierFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="revenue_from">Revenue From *</Label>
          <Input
            id="revenue_from"
            type="number"
            min="0"
            step="0.01"
            {...form.register('revenue_from', { valueAsNumber: true })}
            placeholder="e.g., 0"
          />
          {form.formState.errors.revenue_from && (
            <p className="text-sm text-red-600">{form.formState.errors.revenue_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue_to">Revenue To</Label>
          <Input
            id="revenue_to"
            type="number"
            min="0"
            step="0.01"
            {...form.register('revenue_to', { valueAsNumber: true })}
            placeholder="e.g., 10000 (leave empty for unlimited)"
          />
          {form.formState.errors.revenue_to && (
            <p className="text-sm text-red-600">{form.formState.errors.revenue_to.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
        <Input
          id="commission_rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          {...form.register('commission_rate', { valueAsNumber: true })}
          placeholder="e.g., 10"
        />
        {form.formState.errors.commission_rate && (
          <p className="text-sm text-red-600">{form.formState.errors.commission_rate.message}</p>
        )}
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
    </form>
  )
}
