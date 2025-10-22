"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { productOptionSchema, type ProductOptionFormData } from '@/lib/validations/product.schema'
import { Users, Bed, Hash } from 'lucide-react'
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
      standard_occupancy: option?.standard_occupancy || 1,
      max_occupancy: option?.max_occupancy || 1,
      bed_configuration: option?.bed_configuration || '',
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="standard_occupancy" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Standard Occupancy *
              </Label>
              <Input
                id="standard_occupancy"
                type="number"
                min="1"
                {...form.register('standard_occupancy', { valueAsNumber: true })}
                placeholder="2"
                className={form.formState.errors.standard_occupancy && 'border-red-500'}
              />
              {form.formState.errors.standard_occupancy && (
                <p className="text-sm text-red-500">{form.formState.errors.standard_occupancy.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_occupancy" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Occupancy *
              </Label>
              <Input
                id="max_occupancy"
                type="number"
                min="1"
                {...form.register('max_occupancy', { valueAsNumber: true })}
                placeholder="4"
                className={form.formState.errors.max_occupancy && 'border-red-500'}
              />
              {form.formState.errors.max_occupancy && (
                <p className="text-sm text-red-500">{form.formState.errors.max_occupancy.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bed_configuration" className="flex items-center gap-2">
              <Bed className="h-4 w-4" />
              Bed Configuration
            </Label>
            <Input
              id="bed_configuration"
              {...form.register('bed_configuration')}
              placeholder="e.g., 1 King Bed, 2 Twin Beds, 1 Queen + 1 Sofa Bed"
            />
            <p className="text-sm text-muted-foreground">
              Describe the bed configuration for this option (mainly for hotels)
            </p>
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
