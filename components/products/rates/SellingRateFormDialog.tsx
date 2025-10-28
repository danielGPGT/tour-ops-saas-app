'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/common/DatePicker'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, DollarSign, Info, Target, TrendingUp } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { useCreateSellingRate } from '@/lib/hooks/useSellingRates'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Product } from '@/lib/types/product'
import type { ProductOption } from '@/lib/types/product-option'

// Validation schema
const sellingRateSchema = z.object({
  rate_name: z.string()
    .min(1, 'Rate name is required')
    .max(255, 'Rate name must be less than 255 characters'),
  
  rate_basis: z.enum(['per_night', 'per_person', 'per_unit', 'per_booking'], {
    required_error: 'Please select a rate basis',
  }),
  
  valid_from: z.date({
    required_error: 'Start date is required',
  }),
  
  valid_to: z.date({
    required_error: 'End date is required',
  }),
  
  base_price: z.number()
    .positive('Base price must be greater than 0')
    .max(9999999, 'Base price cannot exceed 9,999,999'),
    
  currency: z.string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g., USD, EUR, GBP)'),
  
  // Markup options
  markup_type: z.enum(['fixed_amount', 'percentage']).optional(),
  markup_amount: z.number().min(0).optional(),
  
  // Target cost for margin calculation
  target_cost: z.number().positive().optional(),
  
  // Advanced pricing
  has_dynamic_pricing: z.boolean().default(false),
  has_seasonal_markup: z.boolean().default(false),
  has_volume_pricing: z.boolean().default(false),
  minimum_quantity: z.number().optional(),
  
  is_active: z.boolean().default(true),
  
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
    if (data.markup_type && !data.markup_amount) {
      return false
    }
    return true
  },
  {
    message: 'Markup amount is required when markup type is selected',
    path: ['markup_amount'],
  }
)

type SellingRateFormData = z.infer<typeof sellingRateSchema>

interface SellingRateFormDialogProps {
  product: Product
  productOption: ProductOption
  rate?: any
  onClose: () => void
  onSuccess?: () => void
}

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
] as const

const RATE_BASIS_OPTIONS = [
  {
    value: 'per_night' as const,
    label: 'Per Night',
    description: 'Hotel rooms, accommodation',
    icon: '🏨',
    suitable: ['accommodation', 'hotel']
  },
  {
    value: 'per_person' as const,
    label: 'Per Person',
    description: 'Tours, activities, meals',
    icon: '👤',
    suitable: ['tour', 'activity', 'dining']
  },
  {
    value: 'per_unit' as const,
    label: 'Per Unit',
    description: 'Tickets, products',
    icon: '🎫',
    suitable: ['event_ticket', 'product']
  },
  {
    value: 'per_booking' as const,
    label: 'Per Booking',
    description: 'Transfers, services',
    icon: '🚗',
    suitable: ['transfer', 'service']
  },
] as const

export function SellingRateFormDialog({
  product,
  productOption,
  rate,
  onClose,
  onSuccess
}: SellingRateFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calculatedMargin, setCalculatedMargin] = useState<number | null>(null)
  
  const { profile } = useAuth()
  const createRate = useCreateSellingRate()
  
  const isEdit = !!rate
  const productType = product.product_type?.type_name?.toLowerCase()

  const form = useForm<SellingRateFormData>({
    resolver: zodResolver(sellingRateSchema),
    defaultValues: {
      rate_name: rate?.rate_name || '',
      rate_basis: rate?.rate_basis || 'per_night',
      valid_from: rate?.valid_from ? new Date(rate.valid_from) : new Date(),
      valid_to: rate?.valid_to ? new Date(rate.valid_to) : addMonths(new Date(), 12),
      base_price: rate?.base_price || 0,
      currency: rate?.currency || 'GBP',
      markup_type: rate?.markup_type || undefined,
      markup_amount: rate?.markup_amount || undefined,
      target_cost: rate?.target_cost || undefined,
      has_dynamic_pricing: false,
      has_seasonal_markup: false,
      has_volume_pricing: false,
      minimum_quantity: undefined,
      is_active: rate?.is_active !== undefined ? rate.is_active : true,
      notes: rate?.notes || '',
    },
  })

  // Watch form values for dynamic calculations
  const basePrice = form.watch('base_price')
  const targetCost = form.watch('target_cost')
  const markupType = form.watch('markup_type')
  const markupAmount = form.watch('markup_amount')
  const currency = form.watch('currency')

  // Calculate margin when values change
  useEffect(() => {
    if (basePrice && targetCost && basePrice > targetCost) {
      const margin = ((basePrice - targetCost) / targetCost) * 100
      setCalculatedMargin(margin)
    } else {
      setCalculatedMargin(null)
    }
  }, [basePrice, targetCost])

  const handleSubmit = async (data: SellingRateFormData) => {
    if (!profile?.organization_id) {
      toast.error('Organization not found')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Build pricing details object
      const pricingDetails: any = {}
      
      if (data.has_dynamic_pricing) {
        pricingDetails.dynamic_pricing = { enabled: true }
      }
      
      if (data.has_seasonal_markup) {
        pricingDetails.seasonal_markup = { enabled: true, seasons: [] }
      }
      
      if (data.has_volume_pricing) {
        pricingDetails.volume_pricing = { enabled: true, tiers: [] }
      }
      
      if (data.minimum_quantity) {
        pricingDetails.minimum_quantity = data.minimum_quantity
      }

      const rateData = {
        organization_id: profile.organization_id,
        product_id: product.id,
        product_option_id: productOption.id,
        rate_name: data.rate_name,
        rate_basis: data.rate_basis,
        valid_from: format(data.valid_from, 'yyyy-MM-dd'),
        valid_to: format(data.valid_to, 'yyyy-MM-dd'),
        base_price: data.base_price,
        currency: data.currency,
        markup_type: data.markup_type && data.markup_type !== 'none' ? data.markup_type : undefined,
        markup_amount: data.markup_amount || undefined,
        target_cost: data.target_cost || undefined,
        pricing_details: Object.keys(pricingDetails).length > 0 ? pricingDetails : undefined,
        is_active: data.is_active
      }

      await createRate.mutateAsync(rateData)
      
      toast.success(isEdit ? 'Rate updated successfully' : 'Rate created successfully')
      onSuccess?.()
      
    } catch (error) {
      console.error('Error saving rate:', error)
      toast.error(isEdit ? 'Failed to update rate' : 'Failed to create rate')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get suitable rate basis options for the product type
  const suitableRateBasisOptions = RATE_BASIS_OPTIONS.filter(option =>
    !productType || option.suitable.includes(productType)
  )

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Selling Rate' : 'Create New Selling Rate'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the customer-facing rate and pricing structure'
              : `Add a new selling rate for ${productOption.option_name}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="rate_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Standard Rate - High Season"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this customer rate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rate Basis Selection */}
                <FormField
                  control={form.control}
                  name="rate_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Basis *</FormLabel>
                      <FormControl>
                        <div className="grid gap-3 md:grid-cols-2">
                          {(suitableRateBasisOptions.length > 0 ? suitableRateBasisOptions : RATE_BASIS_OPTIONS).map((option) => (
                            <div
                              key={option.value}
                              className={cn(
                                'border rounded-lg p-4 cursor-pointer transition-colors',
                                field.value === option.value
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              )}
                              onClick={() => field.onChange(option.value)}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">{option.icon}</span>
                                <input
                                  type="radio"
                                  checked={field.value === option.value}
                                  onChange={() => field.onChange(option.value)}
                                />
                              </div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
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

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing & Margins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selling Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currency}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Price charged to customers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name="target_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Cost</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                              {currency}
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Expected cost for margin calculation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Margin Display */}
                {calculatedMargin !== null && (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>Calculated Margin:</span>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            calculatedMargin > 30 ? "bg-green-100 text-green-800" :
                            calculatedMargin > 15 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {calculatedMargin.toFixed(1)}%
                          </Badge>
                          <span className="text-sm">
                            ({currency} {(basePrice - (targetCost || 0)).toLocaleString()} profit)
                          </span>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Markup Configuration */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="markup_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markup Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No markup" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No markup</SelectItem>
                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                            <SelectItem value="percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Additional markup on base cost
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {markupType && (
                    <FormField
                      control={form.control}
                      name="markup_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Markup Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {markupType === 'percentage' ? '%' : currency}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Validity Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From *</FormLabel>
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
                        <FormLabel>Valid To *</FormLabel>
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
              </CardContent>
            </Card>

            {/* Advanced Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Advanced Pricing Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Dynamic Pricing</div>
                      <div className="text-sm text-muted-foreground">Price adjusts based on demand</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_dynamic_pricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Seasonal Markup</div>
                      <div className="text-sm text-muted-foreground">Different prices by season</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_seasonal_markup"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Volume Pricing</div>
                      <div className="text-sm text-muted-foreground">Discounts for larger quantities</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_volume_pricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="minimum_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum quantity for this rate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Active Status</div>
                    <div className="text-sm text-muted-foreground">Whether this rate is available to customers</div>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

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
                        Optional notes about this rate
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
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? 'Saving...' : isEdit ? 'Update Rate' : 'Create Rate'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
