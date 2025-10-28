'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/common/DatePicker'
import { CalendarIcon, Calculator, AlertTriangle, Info } from 'lucide-react'
import { format, differenceInDays, addDays, subDays } from 'date-fns'
import { useProducts } from '@/lib/hooks/useProducts'
import { cn } from '@/lib/utils'
import type { ContractAllocationFormData } from '@/lib/types/contract'

// Validation schema
const allocationSchema = z.object({
  allocation_name: z.string()
    .min(1, 'Allocation name is required')
    .max(255, 'Allocation name must be less than 255 characters'),
  
  product_id: z.string()
    .uuid('Please select a valid product'),
  
  allocation_type: z.enum(['allotment', 'batch', 'free_sell', 'on_request'], {
    required_error: 'Please select an allocation type',
  }),
  
  total_quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(999999, 'Quantity cannot exceed 999,999')
    .optional(),
    
  valid_from: z.date({
    required_error: 'Start date is required',
  }),
  
  valid_to: z.date({
    required_error: 'End date is required',
  }),
  
  total_cost: z.number()
    .positive('Total cost must be greater than 0')
    .max(99999999, 'Total cost cannot exceed 99,999,999')
    .optional(),
    
  cost_per_unit: z.number()
    .positive('Cost per unit must be greater than 0')
    .max(999999, 'Cost per unit cannot exceed 999,999')
    .optional(),
    
  currency: z.string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g., USD, EUR, GBP)'),
    
  release_days: z.number()
    .int('Release days must be a whole number')
    .min(0, 'Release days cannot be negative')
    .max(365, 'Release days cannot exceed 365')
    .optional(),
    
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
}).refine(
  (data) => data.valid_to > data.valid_from,
  {
    message: 'End date must be after start date',
    path: ['valid_to'],
  }
).refine(
  (data) => {
    // If both total_cost and total_quantity are provided, cost_per_unit should be calculated automatically
    if (data.total_cost && data.total_quantity && data.cost_per_unit) {
      const calculatedCostPerUnit = data.total_cost / data.total_quantity
      const diff = Math.abs(calculatedCostPerUnit - data.cost_per_unit)
      return diff < 0.01 // Allow small rounding differences
    }
    return true
  },
  {
    message: 'Cost per unit should match total cost divided by quantity',
    path: ['cost_per_unit'],
  }
)

type AllocationFormData = z.infer<typeof allocationSchema>

interface AllocationFormProps {
  contractId: string
  initialData?: Partial<ContractAllocationFormData>
  onSubmit: (data: ContractAllocationFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const ALLOCATION_TYPES = [
  {
    value: 'allotment' as const,
    label: 'Allotment',
    description: 'Room/seat blocks with release dates',
    requiresQuantity: true,
    requiresReleaseDate: true,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
  },
  {
    value: 'batch' as const,
    label: 'Batch',
    description: 'Pre-purchased inventory (tickets, tours)',
    requiresQuantity: true,
    requiresReleaseDate: false,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
  },
  {
    value: 'free_sell' as const,
    label: 'Free Sell',
    description: 'Unlimited availability',
    requiresQuantity: false,
    requiresReleaseDate: false,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
  },
  {
    value: 'on_request' as const,
    label: 'On Request',
    description: 'Book first, source later',
    requiresQuantity: false,
    requiresReleaseDate: false,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
  },
] as const

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
] as const

export function AllocationForm({
  contractId,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false
}: AllocationFormProps) {
  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      allocation_name: initialData?.allocation_name || '',
      product_id: initialData?.product_id || '',
      allocation_type: initialData?.allocation_type || 'allotment',
      total_quantity: initialData?.total_quantity || undefined,
      valid_from: initialData?.valid_from ? new Date(initialData.valid_from) : new Date(),
      valid_to: initialData?.valid_to ? new Date(initialData.valid_to) : addDays(new Date(), 30),
      total_cost: initialData?.total_cost || undefined,
      cost_per_unit: initialData?.cost_per_unit || undefined,
      currency: initialData?.currency || 'GBP',
      release_days: initialData?.release_days || undefined,
      notes: initialData?.notes || '',
    },
  })

  const { data: products, isLoading: productsLoading } = useProducts()
  
  // Watch form values for calculations
  const allocationType = form.watch('allocation_type')
  const totalQuantity = form.watch('total_quantity')
  const totalCost = form.watch('total_cost')
  const costPerUnit = form.watch('cost_per_unit')
  const validFrom = form.watch('valid_from')
  const validTo = form.watch('valid_to')
  const releaseDate = form.watch('release_days')
  
  // Get allocation type config
  const allocationTypeConfig = ALLOCATION_TYPES.find(t => t.value === allocationType)
  
  // Calculate derived values
  const daysDuration = validFrom && validTo ? differenceInDays(validTo, validFrom) : 0
  const calculatedReleaseDate = validFrom && releaseDate ? subDays(validFrom, releaseDate) : null
  const daysUntilRelease = calculatedReleaseDate ? differenceInDays(calculatedReleaseDate, new Date()) : null

  // Auto-calculate cost per unit when total cost or quantity changes
  useEffect(() => {
    if (totalCost && totalQuantity && totalCost > 0 && totalQuantity > 0) {
      const calculated = totalCost / totalQuantity
      if (Math.abs((costPerUnit || 0) - calculated) > 0.01) {
        form.setValue('cost_per_unit', Number(calculated.toFixed(2)))
      }
    }
  }, [totalCost, totalQuantity, form, costPerUnit])

  // Auto-calculate total cost when cost per unit or quantity changes
  useEffect(() => {
    if (costPerUnit && totalQuantity && costPerUnit > 0 && totalQuantity > 0) {
      const calculated = costPerUnit * totalQuantity
      if (Math.abs((totalCost || 0) - calculated) > 0.01) {
        form.setValue('total_cost', Number(calculated.toFixed(2)))
      }
    }
  }, [costPerUnit, totalQuantity, form, totalCost])

  const handleSubmit = async (data: AllocationFormData) => {
    try {
      await onSubmit({
        allocation_name: data.allocation_name,
        product_id: data.product_id,
        allocation_type: data.allocation_type,
        total_quantity: data.total_quantity || null,
        valid_from: data.valid_from.toISOString().split('T')[0],
        valid_to: data.valid_to.toISOString().split('T')[0],
        total_cost: data.total_cost || null,
        cost_per_unit: data.cost_per_unit || null,
        currency: data.currency,
        release_days: data.release_days || null,
        notes: data.notes || null,
      })
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="allocation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allocation Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Standard Rooms - Monaco GP"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this allocation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={productsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.data?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              <span>{product.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {product.code}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The product this allocation applies to
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="allocation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocation Type *</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 md:grid-cols-2">
                      {ALLOCATION_TYPES.map((type) => (
                        <div
                          key={type.value}
                          className={cn(
                            'border rounded-lg p-3 cursor-pointer transition-colors',
                            field.value === type.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )}
                          onClick={() => field.onChange(type.value)}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              checked={field.value === type.value}
                              onChange={() => field.onChange(type.value)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{type.label}</span>
                                <Badge className={type.color}>
                                  {type.value}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Quantity & Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quantity & Duration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allocationTypeConfig?.requiresQuantity && (
              <FormField
                control={form.control}
                name="total_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Quantity *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="e.g., 50"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          units
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Number of units in this allocation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="valid_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {validFrom && validTo && daysDuration > 0 && (
              <Alert>
                <CalendarIcon className="h-4 w-4" />
                <AlertDescription>
                  Duration: <strong>{daysDuration} days</strong> 
                  {' '}({format(validFrom, 'MMM d')} - {format(validTo, 'MMM d, yyyy')})
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Pricing & Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="total_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 125000.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {form.watch('currency')}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Total cost of this allocation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Per Unit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 2500.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          {form.watch('currency')}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Cost per individual unit
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {totalCost && totalQuantity && (
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <strong>Calculated:</strong> {form.watch('currency')} {totalCost.toLocaleString()} ÷ {totalQuantity} units = {form.watch('currency')} {(totalCost / totalQuantity).toFixed(2)} per unit
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Release Schedule */}
        {allocationTypeConfig?.requiresReleaseDate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Release Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="release_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Days Before Start</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="e.g., 60"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          days
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Number of days before the start date when unsold inventory must be released
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {calculatedReleaseDate && (
                <Alert variant={daysUntilRelease !== null && daysUntilRelease <= 30 ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div>
                        <strong>Release Date:</strong> {format(calculatedReleaseDate, 'MMMM d, yyyy')}
                      </div>
                      {daysUntilRelease !== null && (
                        <div>
                          <strong>Days Until Release:</strong> {daysUntilRelease} days
                          {daysUntilRelease <= 7 && <span className="text-destructive font-medium ml-1">(URGENT)</span>}
                          {daysUntilRelease > 7 && daysUntilRelease <= 30 && <span className="text-orange-600 font-medium ml-1">(WARNING)</span>}
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details, terms, or conditions..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this allocation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? 'Saving...' : 'Create Allocation'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
