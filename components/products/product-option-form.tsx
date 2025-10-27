"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { productOptionSchema, type ProductOptionFormData } from '@/lib/validations/product.schema'
import { Hash, DollarSign } from 'lucide-react'
import type { ProductOption } from '@/lib/types/product'

interface ProductOptionFormProps {
  option?: ProductOption
  onSubmit: (data: ProductOptionFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProductOptionForm({ option, onSubmit, onCancel, isLoading }: ProductOptionFormProps) {
  const form = useForm<ProductOptionFormData>({
    resolver: zodResolver(productOptionSchema),
    defaultValues: {
      option_name: option?.option_name || '',
      option_code: option?.option_code || '',
      description: option?.description || '',
      base_price: option?.base_price || undefined,
      base_cost: option?.base_cost || undefined,
      currency: option?.currency || 'USD',
      attributes: option?.attributes || {},
      is_active: option?.is_active ?? true
    }
  })

  const handleSubmit = (data: ProductOptionFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {option ? 'Edit Product Option' : 'Create Product Option'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="option_name">Option Name *</Label>
              <Input
                id="option_name"
                {...form.register('option_name')}
                placeholder="e.g., Deluxe Room Double, VIP Ticket, Private Tour"
                className={form.formState.errors.option_name && 'border-red-500'}
              />
              {form.formState.errors.option_name && (
                <p className="text-sm text-red-500">{form.formState.errors.option_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="option_code">Option Code *</Label>
              <Input
                id="option_code"
                {...form.register('option_code')}
                placeholder="e.g., DELUXE-DBL, VIP, PRIVATE"
                className={form.formState.errors.option_code && 'border-red-500'}
              />
              {form.formState.errors.option_code && (
                <p className="text-sm text-red-500">{form.formState.errors.option_code.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter option description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Base Price
              </Label>
              <Input
                id="base_price"
                type="number"
                step="0.01"
                {...form.register('base_price', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_cost" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Base Cost
              </Label>
              <Input
                id="base_cost"
                type="number"
                step="0.01"
                {...form.register('base_cost', { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                {...form.register('currency')}
                placeholder="USD"
                maxLength={3}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              {...form.register('is_active')}
              className="rounded"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : option ? 'Update Option' : 'Create Option'}
        </Button>
      </div>
    </form>
  )
}
