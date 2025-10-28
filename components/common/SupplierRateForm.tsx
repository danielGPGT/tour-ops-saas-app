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

const supplierRateSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  product_option_id: z.string().optional(),
  rate_name: z.string().optional(),
  valid_from: z.date(),
  valid_to: z.date(),
  rate_basis: z.enum(['per_person', 'per_room', 'per_booking', 'per_night']),
  dow_mask: z.array(z.string()).optional(),
  is_default: z.boolean().default(false),
  is_included_in_package: z.boolean().default(true),
  is_extra_night_rate: z.boolean().default(false),
  currency: z.string().default('USD'),
  priority: z.number().min(0).default(0)
})

type SupplierRateFormData = z.infer<typeof supplierRateSchema>

interface SupplierRateFormProps {
  defaultValues?: Partial<SupplierRateFormData>
  onSubmit: (data: SupplierRateFormData) => void
  onCancel: () => void
  isLoading?: boolean
  products?: Array<{ id: string; name: string; code: string }>
  productOptions?: Array<{ id: string; option_name: string; option_code: string }>
}

export function SupplierRateForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  products = [],
  productOptions = []
}: SupplierRateFormProps) {
  const form = useForm<SupplierRateFormData>({
    resolver: zodResolver(supplierRateSchema),
    defaultValues: {
      product_id: '',
      product_option_id: '',
      rate_name: '',
      valid_from: new Date(),
      valid_to: new Date(),
      rate_basis: 'per_person',
      dow_mask: [],
      is_default: false,
      is_included_in_package: true,
      is_extra_night_rate: false,
      currency: 'USD',
      priority: 0,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const selectedProductId = watch('product_id')

  const handleSubmit = (data: SupplierRateFormData) => {
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

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ]

  // Filter product options based on selected product
  const filteredProductOptions = productOptions.filter(option => 
    products.find(p => p.id === selectedProductId)
  )

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_id">Product *</Label>
        <Select
          value={form.watch('product_id')}
          onValueChange={(value) => {
            setValue('product_id', value)
            setValue('product_option_id', '') // Reset product option when product changes
          }}
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

      {filteredProductOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="product_option_id">Product Option</Label>
          <Select
            value={form.watch('product_option_id')}
            onValueChange={(value) => setValue('product_option_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific option</SelectItem>
              {filteredProductOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.option_name} ({option.option_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rate_name">Rate Name</Label>
          <Input
            id="rate_name"
            {...form.register('rate_name')}
            placeholder="e.g., Standard Rate, Early Bird"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate_basis">Rate Basis *</Label>
          <Select
            value={form.watch('rate_basis')}
            onValueChange={(value) => setValue('rate_basis', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rate basis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_person">Per Person</SelectItem>
              <SelectItem value="per_room">Per Room</SelectItem>
              <SelectItem value="per_booking">Per Booking</SelectItem>
              <SelectItem value="per_night">Per Night</SelectItem>
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

      <div className="space-y-2">
        <Label>Days of Week</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {dayOptions.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`dow_${day.value}`}
                checked={form.watch('dow_mask')?.includes(day.value) || false}
                onCheckedChange={(checked) => {
                  const current = form.watch('dow_mask') || []
                  if (checked) {
                    setValue('dow_mask', [...current, day.value])
                  } else {
                    setValue('dow_mask', current.filter(d => d !== day.value))
                  }
                }}
              />
              <Label htmlFor={`dow_${day.value}`} className="text-sm">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            {...form.register('priority', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={form.watch('is_default')}
            onCheckedChange={(checked) => setValue('is_default', checked as boolean)}
          />
          <Label htmlFor="is_default">Default Rate</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_included_in_package"
            checked={form.watch('is_included_in_package')}
            onCheckedChange={(checked) => setValue('is_included_in_package', checked as boolean)}
          />
          <Label htmlFor="is_included_in_package">Included in Package</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_extra_night_rate"
            checked={form.watch('is_extra_night_rate')}
            onCheckedChange={(checked) => setValue('is_extra_night_rate', checked as boolean)}
          />
          <Label htmlFor="is_extra_night_rate">Extra Night Rate</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {defaultValues ? 'Update' : 'Create'} Supplier Rate
        </Button>
      </div>
    </form>
  )
}

// Buttonless version for use inside EditDialog
export function SupplierRateFormContent({ 
  defaultValues, 
  onSubmit, 
  isLoading = false,
  products = [],
  productOptions = []
}: Omit<SupplierRateFormProps, 'onCancel'>) {
  const form = useForm<SupplierRateFormData>({
    resolver: zodResolver(supplierRateSchema),
    defaultValues: {
      product_id: '',
      product_option_id: '',
      rate_name: '',
      valid_from: new Date(),
      valid_to: new Date(),
      rate_basis: 'per_person',
      dow_mask: [],
      is_default: false,
      is_included_in_package: true,
      is_extra_night_rate: false,
      currency: 'USD',
      priority: 0,
      ...defaultValues
    }
  })

  const { watch, setValue } = form
  const selectedProductId = watch('product_id')

  const handleSubmit = (data: SupplierRateFormData) => {
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

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ]

  // Filter product options based on selected product
  const filteredProductOptions = productOptions.filter(option => 
    products.find(p => p.id === selectedProductId)
  )

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product_id">Product *</Label>
        <Select
          value={form.watch('product_id')}
          onValueChange={(value) => {
            setValue('product_id', value)
            setValue('product_option_id', '') // Reset product option when product changes
          }}
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

      {filteredProductOptions.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="product_option_id">Product Option</Label>
          <Select
            value={form.watch('product_option_id')}
            onValueChange={(value) => setValue('product_option_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific option</SelectItem>
              {filteredProductOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.option_name} ({option.option_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rate_name">Rate Name</Label>
          <Input
            id="rate_name"
            {...form.register('rate_name')}
            placeholder="e.g., Standard Rate, Early Bird"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate_basis">Rate Basis *</Label>
          <Select
            value={form.watch('rate_basis')}
            onValueChange={(value) => setValue('rate_basis', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rate basis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_person">Per Person</SelectItem>
              <SelectItem value="per_room">Per Room</SelectItem>
              <SelectItem value="per_booking">Per Booking</SelectItem>
              <SelectItem value="per_night">Per Night</SelectItem>
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

      <div className="space-y-2">
        <Label>Days of Week</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {dayOptions.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`dow_${day.value}`}
                checked={form.watch('dow_mask')?.includes(day.value) || false}
                onCheckedChange={(checked) => {
                  const current = form.watch('dow_mask') || []
                  if (checked) {
                    setValue('dow_mask', [...current, day.value])
                  } else {
                    setValue('dow_mask', current.filter(d => d !== day.value))
                  }
                }}
              />
              <Label htmlFor={`dow_${day.value}`} className="text-sm">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="0"
            {...form.register('priority', { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_default"
            checked={form.watch('is_default')}
            onCheckedChange={(checked) => setValue('is_default', checked as boolean)}
          />
          <Label htmlFor="is_default">Default Rate</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_included_in_package"
            checked={form.watch('is_included_in_package')}
            onCheckedChange={(checked) => setValue('is_included_in_package', checked as boolean)}
          />
          <Label htmlFor="is_included_in_package">Included in Package</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_extra_night_rate"
            checked={form.watch('is_extra_night_rate')}
            onCheckedChange={(checked) => setValue('is_extra_night_rate', checked as boolean)}
          />
          <Label htmlFor="is_extra_night_rate">Extra Night Rate</Label>
        </div>
      </div>
    </form>
  )
}
