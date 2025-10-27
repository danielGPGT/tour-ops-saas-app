'use client'

import { UseFormReturn } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { DailyRatesEditor } from './daily-rates-editor'
import type { DailyRate } from './daily-rates-editor'
import type { Product } from '@/lib/types/product'
import type { SellingRateFormData } from '@/lib/validations/selling-rate.schema'
import { useRef } from 'react'
import { useFieldArray } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'

interface SellingRateStepProps {
  form: UseFormReturn<SellingRateFormData>
  product: Product
  onSubmit: (data: SellingRateFormData) => void | Promise<void>
  onBack: () => void
  isSubmitting: boolean
}

const RATE_BASIS_OPTIONS = [
  { value: 'per_night', label: 'Per Night' },
  { value: 'per_person', label: 'Per Person' },
  { value: 'per_booking', label: 'Per Booking' },
  { value: 'per_unit', label: 'Per Unit' },
  { value: 'per_vehicle', label: 'Per Vehicle' }
]

const CURRENCIES = [
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'CAD', label: 'CAD (C$)' }
]

export function SellingRateStep({ form, product, onSubmit, onBack, isSubmitting }: SellingRateStepProps) {
  const basePrice = form.watch('base_price') || 0
  const targetCost = form.watch('target_cost') || 0
  const currency = form.watch('currency') || 'GBP'
  const rateBasis = form.watch('rate_basis') || 'per_night'
  const validFrom = form.watch('valid_from')
  const validTo = form.watch('valid_to')
  
  const isAccommodation = product.product_type?.type_code === 'accommodation'
  const isPerNight = rateBasis === 'per_night'
  const showDailyRates = isAccommodation && isPerNight
  
  const dailyRatesEditorRef = useRef<{ save: () => Record<string, DailyRate> }>(null)

  // Calculate margin
  const marginAmount = basePrice - targetCost
  const marginPercentage = targetCost > 0 ? (marginAmount / targetCost) * 100 : 0

  // Handle form submission
  const handleSubmit = async (data: SellingRateFormData) => {
    // Save daily rates if editor exists
    if (showDailyRates && dailyRatesEditorRef.current) {
      const rates = dailyRatesEditorRef.current.save()
      data.pricing_details = {
        ...data.pricing_details,
        daily_rates: rates
      }
    }
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Rate Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Rate Information</h3>
          
          <FormField
            control={form.control}
            name="rate_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rate Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Fairmont Standard - GP Weekend"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional custom name for this rate (auto-generated if not provided)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="valid_from"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Valid From *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valid_to"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Valid To *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Duration Rules - For accommodation per-night pricing */}
          {isAccommodation && isPerNight && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricing_details.minimum_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Nights *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 3"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum stay duration in nights
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricing_details.maximum_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Nights *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 14"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum stay duration in nights
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Set the customer price and target cost</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rate_basis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Basis *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate basis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RATE_BASIS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((curr) => (
                          <SelectItem key={curr.value} value={curr.value}>
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="base_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Price *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{currency}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Cost (Optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{currency}</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? null : parseFloat(value) || null)
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Expected supplier cost for margin tracking
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Margin Display */}
            {basePrice > 0 && targetCost > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expected Margin</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {currency} {marginAmount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {marginPercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Daily Rates Configuration (for accommodation per-night pricing) */}
        {showDailyRates && validFrom && validTo && (
          <DailyRatesEditor
            ref={dailyRatesEditorRef}
            validFrom={validFrom}
            validTo={validTo}
            basePrice={basePrice}
            onChange={() => {}} // Not used anymore
            existingRates={form.watch('pricing_details')?.daily_rates}
          />
        )}

        {/* Advanced Options - Only for accommodation */}
        {isAccommodation && isPerNight && (
          <Accordion type="multiple" className="w-full">
            {/* Occupancy Pricing */}
            <AccordionItem value="occupancy">
              <AccordionTrigger className="text-sm font-medium">
                Occupancy Pricing (Optional)
              </AccordionTrigger>
              <AccordionContent>
                <OccupancyPricingSection form={form} />
              </AccordionContent>
            </AccordionItem>

            {/* Extras */}
            <AccordionItem value="extras">
              <AccordionTrigger className="text-sm font-medium">
                Extras & Add-ons (Optional)
              </AccordionTrigger>
              <AccordionContent>
                <ExtrasSection form={form} />
              </AccordionContent>
            </AccordionItem>

            {/* Policies */}
            <AccordionItem value="policies">
              <AccordionTrigger className="text-sm font-medium">
                Policies & Terms
              </AccordionTrigger>
              <AccordionContent>
                <PoliciesSection form={form} />
              </AccordionContent>
            </AccordionItem>

            {/* Inclusions */}
            <AccordionItem value="inclusions">
              <AccordionTrigger className="text-sm font-medium">
                Inclusions
              </AccordionTrigger>
              <AccordionContent>
                <InclusionsSection form={form} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Option & Rate'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Occupancy Pricing Section
function OccupancyPricingSection({ form }: { form: UseFormReturn<SellingRateFormData> }) {
  // Initialize pricing_details if it doesn't exist
  if (!form.getValues('pricing_details')) {
    form.setValue('pricing_details', {})
  }

  const occupancyPricing = form.watch('pricing_details')?.occupancy_pricing || []

  const addOccupancy = () => {
    const current = form.getValues('pricing_details') || {}
    const currentPricing = current.occupancy_pricing || []
    
    form.setValue('pricing_details', {
      ...current,
      occupancy_pricing: [
        ...currentPricing,
        {
          config_name: '',
          adults: 2,
          children: 0,
          multiplier: 1.0,
          description: ''
        }
      ]
    })
  }

  const removeOccupancy = (index: number) => {
    const current = form.getValues('pricing_details') || {}
    const currentPricing = current.occupancy_pricing || []
    
    form.setValue('pricing_details', {
      ...current,
      occupancy_pricing: currentPricing.filter((_: any, i: number) => i !== index)
    })
  }

  const updateOccupancy = (index: number, field: string, value: any) => {
    const current = form.getValues('pricing_details') || {}
    const currentPricing = current.occupancy_pricing || []
    
    form.setValue('pricing_details', {
      ...current,
      occupancy_pricing: currentPricing.map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    })
  }

  return (
    <div className="space-y-3">
      {occupancyPricing.length > 0 && (
        <div className="space-y-3">
          {occupancyPricing.map((item: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    placeholder="e.g., Double"
                    value={item.config_name || ''}
                    onChange={(e) => updateOccupancy(index, 'config_name', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Adults"
                    value={item.adults || 2}
                    onChange={(e) => updateOccupancy(index, 'adults', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Multiplier"
                    value={item.multiplier || 1.0}
                    onChange={(e) => updateOccupancy(index, 'multiplier', parseFloat(e.target.value) || 1.0)}
                  />
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={(e) => updateOccupancy(index, 'description', e.target.value)}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOccupancy(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addOccupancy}>
        <Plus className="h-4 w-4 mr-2" />
        Add Occupancy Config
      </Button>
    </div>
  )
}

// Extras Section
function ExtrasSection({ form }: { form: UseFormReturn<SellingRateFormData> }) {
  const extras = form.watch('pricing_details')?.extras || []

  const addExtra = () => {
    const current = form.getValues('pricing_details') || {}
    const currentExtras = current.extras || []
    
    form.setValue('pricing_details', {
      ...current,
      extras: [
        ...currentExtras,
        {
          key: '',
          name: '',
          available: true,
          price: 0,
          description: ''
        }
      ]
    })
  }

  const removeExtra = (index: number) => {
    const current = form.getValues('pricing_details') || {}
    const currentExtras = current.extras || []
    
    form.setValue('pricing_details', {
      ...current,
      extras: currentExtras.filter((_: any, i: number) => i !== index)
    })
  }

  const updateExtra = (index: number, field: string, value: any) => {
    const current = form.getValues('pricing_details') || {}
    const currentExtras = current.extras || []
    
    form.setValue('pricing_details', {
      ...current,
      extras: currentExtras.map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    })
  }

  return (
    <div className="space-y-3">
      {extras.length > 0 && (
        <div className="space-y-3">
          {extras.map((item: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="e.g., Early Check-in"
                    value={item.name || ''}
                    onChange={(e) => {
                      updateExtra(index, 'name', e.target.value)
                      updateExtra(index, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))
                    }}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.price || 0}
                    onChange={(e) => updateExtra(index, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="mt-3">
                  <Input
                    placeholder="Description"
                    value={item.description || ''}
                    onChange={(e) => updateExtra(index, 'description', e.target.value)}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExtra(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addExtra}>
        <Plus className="h-4 w-4 mr-2" />
        Add Extra
      </Button>
    </div>
  )
}

// Policies Section
function PoliciesSection({ form }: { form: UseFormReturn<SellingRateFormData> }) {
  const updatePolicy = (field: string, value: string) => {
    const current = form.getValues('pricing_details') || {}
    
    form.setValue('pricing_details', {
      ...current,
      [field]: value
    })
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="e.g., Free cancellation up to 30 days before arrival"
        value={form.watch('pricing_details')?.cancellation_policy || ''}
        onChange={(e) => updatePolicy('cancellation_policy', e.target.value)}
        rows={3}
      />
      <Separator />
      <Textarea
        placeholder="e.g., 30% deposit at booking, balance due 30 days before arrival"
        value={form.watch('pricing_details')?.payment_terms || ''}
        onChange={(e) => updatePolicy('payment_terms', e.target.value)}
        rows={3}
      />
    </div>
  )
}

// Inclusions Section
function InclusionsSection({ form }: { form: UseFormReturn<SellingRateFormData> }) {
  const inclusions = form.watch('pricing_details')?.inclusions || []

  const addInclusion = () => {
    const current = form.getValues('pricing_details') || {}
    const currentInclusions = current.inclusions || []
    
    form.setValue('pricing_details', {
      ...current,
      inclusions: [...currentInclusions, '']
    })
  }

  const removeInclusion = (index: number) => {
    const current = form.getValues('pricing_details') || {}
    const currentInclusions = current.inclusions || []
    
    form.setValue('pricing_details', {
      ...current,
      inclusions: currentInclusions.filter((_: any, i: number) => i !== index)
    })
  }

  const updateInclusion = (index: number, value: string) => {
    const current = form.getValues('pricing_details') || {}
    const currentInclusions = current.inclusions || []
    
    form.setValue('pricing_details', {
      ...current,
      inclusions: currentInclusions.map((item: any, i: number) => 
        i === index ? value : item
      )
    })
  }

  return (
    <div className="space-y-3">
      {inclusions.map((item: any, index: number) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="e.g., Daily breakfast"
            value={item}
            onChange={(e) => updateInclusion(index, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeInclusion(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
        <Plus className="h-4 w-4 mr-2" />
        Add Inclusion
      </Button>
    </div>
  )
}
