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
import { Loader2 } from 'lucide-react'

const cancellationPolicySchema = z.object({
  days_before_from: z.number().min(0).optional(),
  days_before_to: z.number().min(0).optional(),
  penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']),
  penalty_percentage: z.number().min(0).max(100).optional(),
  penalty_amount: z.number().min(0).optional(),
  description: z.string().optional(),
  applies_to: z.enum(['all', 'deposit_only', 'balance_only']).default('all'),
  sort_order: z.number().min(0).default(0)
})

type CancellationPolicyFormData = z.infer<typeof cancellationPolicySchema>

interface CancellationPolicyFormProps {
  defaultValues?: Partial<CancellationPolicyFormData>
  onSubmit: (data: CancellationPolicyFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function CancellationPolicyForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false 
}: CancellationPolicyFormProps) {
  const form = useForm<CancellationPolicyFormData>({
    resolver: zodResolver(cancellationPolicySchema),
    defaultValues: {
      days_before_from: undefined,
      days_before_to: undefined,
      penalty_type: 'none',
      penalty_percentage: 0,
      penalty_amount: 0,
      description: '',
      applies_to: 'all',
      sort_order: 0,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const penaltyType = watch('penalty_type')

  const handleSubmit = (data: CancellationPolicyFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="days_before_from">Days Before From</Label>
          <Input
            id="days_before_from"
            type="number"
            min="0"
            {...form.register('days_before_from', { valueAsNumber: true })}
            placeholder="e.g., 60"
          />
          {form.formState.errors.days_before_from && (
            <p className="text-sm text-red-600">{form.formState.errors.days_before_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="days_before_to">Days Before To</Label>
          <Input
            id="days_before_to"
            type="number"
            min="0"
            {...form.register('days_before_to', { valueAsNumber: true })}
            placeholder="e.g., 30"
          />
          {form.formState.errors.days_before_to && (
            <p className="text-sm text-red-600">{form.formState.errors.days_before_to.message}</p>
          )}
        </div>
      </div>

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
      </div>

      {penaltyType === 'percentage' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_percentage">Penalty Percentage *</Label>
          <Input
            id="penalty_percentage"
            type="number"
            min="0"
            max="100"
            step="0.01"
            {...form.register('penalty_percentage', { valueAsNumber: true })}
            placeholder="e.g., 25"
          />
          {form.formState.errors.penalty_percentage && (
            <p className="text-sm text-red-600">{form.formState.errors.penalty_percentage.message}</p>
          )}
        </div>
      )}

      {penaltyType === 'fixed_amount' && (
        <div className="space-y-2">
          <Label htmlFor="penalty_amount">Penalty Amount *</Label>
          <Input
            id="penalty_amount"
            type="number"
            min="0"
            step="0.01"
            {...form.register('penalty_amount', { valueAsNumber: true })}
            placeholder="e.g., 500"
          />
          {form.formState.errors.penalty_amount && (
            <p className="text-sm text-red-600">{form.formState.errors.penalty_amount.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="applies_to">Applies To *</Label>
        <Select
          value={form.watch('applies_to')}
          onValueChange={(value) => setValue('applies_to', value as any)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select what this applies to" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="deposit_only">Deposit Only</SelectItem>
            <SelectItem value="balance_only">Balance Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...form.register('description')}
          placeholder="Additional details about this cancellation policy"
          rows={3}
        />
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
          {defaultValues ? 'Update' : 'Create'} Cancellation Policy
        </Button>
      </div>
    </form>
  )
}
