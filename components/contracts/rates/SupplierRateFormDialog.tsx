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
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DatePicker } from '@/components/common/DatePicker'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, DollarSign, Info, Sparkles } from 'lucide-react'
import { format, addMonths } from 'date-fns'
import { useProducts, useProductOptions } from '@/lib/hooks/useProducts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useCreateSupplierRate } from '@/lib/hooks/useContracts'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Validation schema
const supplierRateSchema = z.object({
  rate_name: z.string()
    .min(1, 'Rate name is required')
    .max(255, 'Rate name must be less than 255 characters'),
  
  product_id: z.string()
    .uuid('Please select a valid product'),
  
  product_option_id: z.string().optional(),
  
  supplier_id: z.string().optional(),
  
  rate_basis: z.enum(['per_night', 'per_person', 'per_unit'], {
    required_error: 'Please select a rate basis',
  }),
  
  valid_from: z.date({
    required_error: 'Start date is required',
  }),
  
  valid_to: z.date({
    required_error: 'End date is required',
  }),
  
  base_cost: z.number()
    .positive('Base cost must be greater than 0')
    .max(9999999, 'Base cost cannot exceed 9,999,999'),
    
  currency: z.string()
    .length(3, 'Currency must be a 3-letter code')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g., USD, EUR, GBP)'),
  
  // Advanced pricing options
  has_seasonal_rates: z.boolean().default(false),
  has_volume_discounts: z.boolean().default(false),
  has_early_booking: z.boolean().default(false),
  minimum_stay: z.number().optional(),
  
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
)

type SupplierRateFormData = z.infer<typeof supplierRateSchema>

interface SupplierRateFormDialogProps {
  contractId: string
  contract?: any
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
    icon: '🏨'
  },
  {
    value: 'per_person' as const,
    label: 'Per Person',
    description: 'Tours, activities, meals',
    icon: '👤'
  },
  {
    value: 'per_unit' as const,
    label: 'Per Unit',
    description: 'Tickets, transfers, packages',
    icon: '🎫'
  },
] as const

export function SupplierRateFormDialog({
  contractId,
  contract,
  rate,
  onClose,
  onSuccess
}: SupplierRateFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  
  const { profile } = useAuth()
  const { data: products } = useProducts()
  const { data: suppliers } = useSuppliers()
  const { data: productOptions } = useProductOptions(selectedProduct)
  const createRate = useCreateSupplierRate()
  
  const isEdit = !!rate

  const form = useForm<SupplierRateFormData>({
    resolver: zodResolver(supplierRateSchema),
    defaultValues: {
      rate_name: rate?.rate_name || '',
      product_id: rate?.product_id || '',
      product_option_id: rate?.product_option_id || '',
      supplier_id: rate?.supplier_id || contract?.supplier_id || '',
      rate_basis: rate?.rate_basis || 'per_night',
      valid_from: rate?.valid_from ? new Date(rate.valid_from) : new Date(),
      valid_to: rate?.valid_to ? new Date(rate.valid_to) : addMonths(new Date(), 12),
      base_cost: rate?.base_cost || 0,
      currency: rate?.currency || contract?.currency || 'GBP',
      has_seasonal_rates: false,
      has_volume_discounts: false,
      has_early_booking: false,
      minimum_stay: undefined,
      is_active: rate?.is_active !== undefined ? rate.is_active : true,
      notes: rate?.notes || '',
    },
  })

  // Watch form values for dynamic UI
  const productId = form.watch('product_id')
  const rateBasis = form.watch('rate_basis')
  const validFrom = form.watch('valid_from')
  const validTo = form.watch('valid_to')
  const baseCost = form.watch('base_cost')
  const currency = form.watch('currency')
  const hasSeasonalRates = form.watch('has_seasonal_rates')
  const hasVolumeDiscounts = form.watch('has_volume_discounts')
  const hasEarlyBooking = form.watch('has_early_booking')

  // Update selected product when form changes
  useEffect(() => {
    if (productId && productId !== selectedProduct) {
      setSelectedProduct(productId)
    }
  }, [productId, selectedProduct])

  const handleSubmit = async (data: SupplierRateFormData) => {
    if (!profile?.organization_id) {
      toast.error('Organization not found')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Build pricing details object
      const pricingDetails: any = {}
      
      if (data.has_seasonal_rates) {
        pricingDetails.seasonal_rates = {
          enabled: true,
          seasons: [] // Will be configured later
        }
      }
      
      if (data.has_volume_discounts) {
        pricingDetails.volume_discounts = {
          enabled: true,
          tiers: [] // Will be configured later
        }
      }
      
      if (data.has_early_booking) {
        pricingDetails.early_booking = {
          enabled: true,
          discounts: [] // Will be configured later
        }
      }
      
      if (data.minimum_stay) {
        pricingDetails.minimum_stay = data.minimum_stay
      }

      const rateData = {
        organization_id: profile.organization_id,
        product_id: data.product_id,
        product_option_id: data.product_option_id && data.product_option_id !== 'all' ? data.product_option_id : undefined,
        contract_id: contractId,
        supplier_id: data.supplier_id && data.supplier_id !== 'none' ? data.supplier_id : undefined,
        rate_name: data.rate_name,
        rate_basis: data.rate_basis,
        valid_from: format(data.valid_from, 'yyyy-MM-dd'),
        valid_to: format(data.valid_to, 'yyyy-MM-dd'),
        base_cost: data.base_cost,
        currency: data.currency,
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

  const selectedRateBasis = RATE_BASIS_OPTIONS.find(option => option.value === rateBasis)

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Supplier Rate' : 'Create New Supplier Rate'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the supplier rate details and pricing structure'
              : 'Add a new supplier rate with pricing details'
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
                <div className="grid gap-4 md:grid-cols-2">
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
                          A descriptive name for this rate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No specific supplier</SelectItem>
                            {suppliers?.map((supplier: any) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Link to specific supplier
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products?.data?.map((product: any) => (
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
                          The product this rate applies to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="product_option_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Option</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={!productId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All options</SelectItem>
                            {productOptions?.map((option: any) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.option_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Specific product option
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rate Basis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rate Type & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="rate_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Basis *</FormLabel>
                      <FormControl>
                        <div className="grid gap-3 md:grid-cols-3">
                          {RATE_BASIS_OPTIONS.map((option) => (
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

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="base_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Cost *</FormLabel>
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
                          Base cost {selectedRateBasis?.label.toLowerCase()}
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

                  {rateBasis === 'per_night' && (
                    <FormField
                      control={form.control}
                      name="minimum_stay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Stay</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                nights
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Minimum nights required
                          </FormDescription>
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

                {validFrom && validTo && (
                  <Alert>
                    <CalendarIcon className="h-4 w-4" />
                    <AlertDescription>
                      Rate valid for <strong>
                        {Math.ceil((validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))} days
                      </strong> from {format(validFrom, 'MMM d, yyyy')} to {format(validTo, 'MMM d, yyyy')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Advanced Pricing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Advanced Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Seasonal Rates</div>
                      <div className="text-sm text-muted-foreground">Different rates by season</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_seasonal_rates"
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
                      <div className="font-medium">Volume Discounts</div>
                      <div className="text-sm text-muted-foreground">Discounts for large bookings</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_volume_discounts"
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
                      <div className="font-medium">Early Booking</div>
                      <div className="text-sm text-muted-foreground">Discounts for advance bookings</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_early_booking"
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
                </div>

                {(hasSeasonalRates || hasVolumeDiscounts || hasEarlyBooking) && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Advanced pricing options will be configured after creating the rate. 
                      You can set up detailed pricing rules in the rate details page.
                    </AlertDescription>
                  </Alert>
                )}
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
                    <div className="text-sm text-muted-foreground">Whether this rate is currently active</div>
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
