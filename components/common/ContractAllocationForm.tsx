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

const contractAllocationSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  allocation_name: z.string().optional(),
  allocation_type: z.enum(['room_block', 'inventory', 'quota', 'allocation']),
  valid_from: z.date(),
  valid_to: z.date(),
  min_nights: z.number().min(0).optional(),
  max_nights: z.number().min(0).optional(),
  min_advance_booking: z.number().min(0).optional(),
  max_advance_booking: z.number().min(0).optional(),
  release_days: z.number().min(0).optional(),
  dow_arrival: z.array(z.string()).optional(),
  dow_checkout: z.array(z.string()).optional(),
  allow_overbooking: z.boolean().default(false),
  overbooking_limit: z.number().min(0).optional(),
  terms: z.record(z.any()).optional(),
  is_active: z.boolean().default(true)
})

type ContractAllocationFormData = z.infer<typeof contractAllocationSchema>

interface ContractAllocationFormProps {
  defaultValues?: Partial<ContractAllocationFormData>
  onSubmit: (data: ContractAllocationFormData) => void
  onCancel: () => void
  isLoading?: boolean
  products?: Array<{ id: string; name: string; code: string }>
}

export function ContractAllocationForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  products = []
}: ContractAllocationFormProps) {
  const form = useForm<ContractAllocationFormData>({
    resolver: zodResolver(contractAllocationSchema),
    defaultValues: {
      product_id: '',
      allocation_name: '',
      allocation_type: 'room_block',
      valid_from: new Date(),
      valid_to: new Date(),
      min_nights: undefined,
      max_nights: undefined,
      min_advance_booking: undefined,
      max_advance_booking: undefined,
      release_days: undefined,
      dow_arrival: [],
      dow_checkout: [],
      allow_overbooking: false,
      overbooking_limit: undefined,
      terms: {},
      is_active: true,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const allowOverbooking = watch('allow_overbooking')

  const handleSubmit = (data: ContractAllocationFormData) => {
    onSubmit(data)
  }

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_id">Product *</Label>
        <Select
          value={form.watch('product_id')}
          onValueChange={(value) => setValue('product_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.product_id && (
          <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="allocation_name">Allocation Name</Label>
          <Input
            id="allocation_name"
            {...form.register('allocation_name')}
            placeholder="e.g., Summer 2025 Block"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allocation_type">Allocation Type *</Label>
          <Select
            value={form.watch('allocation_type')}
            onValueChange={(value) => setValue('allocation_type', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select allocation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room_block">Room Block</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="quota">Quota</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valid_from">Valid From *</Label>
          <DatePicker
            date={form.watch('valid_from')}
            onDateChange={(date) => setValue('valid_from', date)}
            placeholder="Select start date"
          />
          {form.formState.errors.valid_from && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_to">Valid To *</Label>
          <DatePicker
            date={form.watch('valid_to')}
            onDateChange={(date) => setValue('valid_to', date)}
            placeholder="Select end date"
          />
          {form.formState.errors.valid_to && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_to.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_nights">Minimum Nights</Label>
          <Input
            id="min_nights"
            type="number"
            min="0"
            {...form.register('min_nights', { valueAsNumber: true })}
            placeholder="e.g., 2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_nights">Maximum Nights</Label>
          <Input
            id="max_nights"
            type="number"
            min="0"
            {...form.register('max_nights', { valueAsNumber: true })}
            placeholder="e.g., 14"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_advance_booking">Min Advance Booking (days)</Label>
          <Input
            id="min_advance_booking"
            type="number"
            min="0"
            {...form.register('min_advance_booking', { valueAsNumber: true })}
            placeholder="e.g., 7"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_advance_booking">Max Advance Booking (days)</Label>
          <Input
            id="max_advance_booking"
            type="number"
            min="0"
            {...form.register('max_advance_booking', { valueAsNumber: true })}
            placeholder="e.g., 365"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="release_days">Release Days</Label>
        <Input
          id="release_days"
          type="number"
          min="0"
          {...form.register('release_days', { valueAsNumber: true })}
          placeholder="e.g., 30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Arrival Days</Label>
          <div className="space-y-2">
            {dayOptions.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`dow_arrival_${day.value}`}
                  checked={form.watch('dow_arrival')?.includes(day.value) || false}
                  onCheckedChange={(checked) => {
                    const current = form.watch('dow_arrival') || []
                    if (checked) {
                      setValue('dow_arrival', [...current, day.value])
                    } else {
                      setValue('dow_arrival', current.filter(d => d !== day.value))
                    }
                  }}
                />
                <Label htmlFor={`dow_arrival_${day.value}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Checkout Days</Label>
          <div className="space-y-2">
            {dayOptions.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`dow_checkout_${day.value}`}
                  checked={form.watch('dow_checkout')?.includes(day.value) || false}
                  onCheckedChange={(checked) => {
                    const current = form.watch('dow_checkout') || []
                    if (checked) {
                      setValue('dow_checkout', [...current, day.value])
                    } else {
                      setValue('dow_checkout', current.filter(d => d !== day.value))
                    }
                  }}
                />
                <Label htmlFor={`dow_checkout_${day.value}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_overbooking"
            checked={allowOverbooking}
            onCheckedChange={(checked) => setValue('allow_overbooking', checked as boolean)}
          />
          <Label htmlFor="allow_overbooking">Allow Overbooking</Label>
        </div>

        {allowOverbooking && (
          <div className="space-y-2">
            <Label htmlFor="overbooking_limit">Overbooking Limit</Label>
            <Input
              id="overbooking_limit"
              type="number"
              min="0"
              {...form.register('overbooking_limit', { valueAsNumber: true })}
              placeholder="e.g., 10"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={form.watch('is_active')}
          onCheckedChange={(checked) => setValue('is_active', checked as boolean)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? 'Update' : 'Create'} Allocation
        </Button>
      </div>
    </form>
  )
}

// Buttonless version for use inside EditDialog
export function ContractAllocationFormContent({ 
  defaultValues, 
  onSubmit, 
  isLoading = false,
  products = []
}: Omit<ContractAllocationFormProps, 'onCancel'>) {
  const form = useForm<ContractAllocationFormData>({
    resolver: zodResolver(contractAllocationSchema),
    defaultValues: {
      product_id: '',
      allocation_name: '',
      allocation_type: 'room_block',
      valid_from: new Date(),
      valid_to: new Date(),
      min_nights: undefined,
      max_nights: undefined,
      min_advance_booking: undefined,
      max_advance_booking: undefined,
      release_days: undefined,
      dow_arrival: [],
      dow_checkout: [],
      allow_overbooking: false,
      overbooking_limit: undefined,
      terms: {},
      is_active: true,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const allowOverbooking = watch('allow_overbooking')

  const handleSubmit = (data: ContractAllocationFormData) => {
    onSubmit(data)
  }

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_id">Product *</Label>
        <Select
          value={form.watch('product_id')}
          onValueChange={(value) => setValue('product_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} ({product.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.product_id && (
          <p className="text-sm text-red-600">{form.formState.errors.product_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="allocation_name">Allocation Name</Label>
          <Input
            id="allocation_name"
            {...form.register('allocation_name')}
            placeholder="e.g., Summer 2025 Block"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="allocation_type">Allocation Type *</Label>
          <Select
            value={form.watch('allocation_type')}
            onValueChange={(value) => setValue('allocation_type', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select allocation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="room_block">Room Block</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="quota">Quota</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valid_from">Valid From *</Label>
          <DatePicker
            date={form.watch('valid_from')}
            onDateChange={(date) => setValue('valid_from', date)}
            placeholder="Select start date"
          />
          {form.formState.errors.valid_from && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_to">Valid To *</Label>
          <DatePicker
            date={form.watch('valid_to')}
            onDateChange={(date) => setValue('valid_to', date)}
            placeholder="Select end date"
          />
          {form.formState.errors.valid_to && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_to.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_nights">Minimum Nights</Label>
          <Input
            id="min_nights"
            type="number"
            min="0"
            {...form.register('min_nights', { valueAsNumber: true })}
            placeholder="e.g., 2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_nights">Maximum Nights</Label>
          <Input
            id="max_nights"
            type="number"
            min="0"
            {...form.register('max_nights', { valueAsNumber: true })}
            placeholder="e.g., 14"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_advance_booking">Min Advance Booking (days)</Label>
          <Input
            id="min_advance_booking"
            type="number"
            min="0"
            {...form.register('min_advance_booking', { valueAsNumber: true })}
            placeholder="e.g., 7"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_advance_booking">Max Advance Booking (days)</Label>
          <Input
            id="max_advance_booking"
            type="number"
            min="0"
            {...form.register('max_advance_booking', { valueAsNumber: true })}
            placeholder="e.g., 365"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="release_days">Release Days</Label>
        <Input
          id="release_days"
          type="number"
          min="0"
          {...form.register('release_days', { valueAsNumber: true })}
          placeholder="e.g., 30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Arrival Days</Label>
          <div className="space-y-2">
            {dayOptions.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`dow_arrival_${day.value}`}
                  checked={form.watch('dow_arrival')?.includes(day.value) || false}
                  onCheckedChange={(checked) => {
                    const current = form.watch('dow_arrival') || []
                    if (checked) {
                      setValue('dow_arrival', [...current, day.value])
                    } else {
                      setValue('dow_arrival', current.filter(d => d !== day.value))
                    }
                  }}
                />
                <Label htmlFor={`dow_arrival_${day.value}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Checkout Days</Label>
          <div className="space-y-2">
            {dayOptions.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`dow_checkout_${day.value}`}
                  checked={form.watch('dow_checkout')?.includes(day.value) || false}
                  onCheckedChange={(checked) => {
                    const current = form.watch('dow_checkout') || []
                    if (checked) {
                      setValue('dow_checkout', [...current, day.value])
                    } else {
                      setValue('dow_checkout', current.filter(d => d !== day.value))
                    }
                  }}
                />
                <Label htmlFor={`dow_checkout_${day.value}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_overbooking"
            checked={allowOverbooking}
            onCheckedChange={(checked) => setValue('allow_overbooking', checked as boolean)}
          />
          <Label htmlFor="allow_overbooking">Allow Overbooking</Label>
        </div>

        {allowOverbooking && (
          <div className="space-y-2">
            <Label htmlFor="overbooking_limit">Overbooking Limit</Label>
            <Input
              id="overbooking_limit"
              type="number"
              min="0"
              {...form.register('overbooking_limit', { valueAsNumber: true })}
              placeholder="e.g., 10"
            />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={form.watch('is_active')}
          onCheckedChange={(checked) => setValue('is_active', checked as boolean)}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </form>
  )
}
