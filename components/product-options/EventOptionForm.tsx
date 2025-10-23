'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { useCreateProductOption, useUpdateProductOption } from '@/lib/hooks/useProductOptions'
import { eventOptionSchema, type EventOptionFormData } from '@/lib/validations/product-option.schema'
import type { ProductOption } from '@/lib/types/product-option'

// Configuration data
const TICKET_TYPES = [
  'seated',
  'standing', 
  'vip_lounge',
  'hospitality',
  'general'
]

const ACCESS_LEVELS = [
  'general',
  'vip',
  'premium', 
  'hospitality',
  'backstage'
]

const EVENT_INCLUDES = [
  'Pit Lane Walk',
  'Team Radio',
  'Buffet Lunch',
  'Open Bar',
  'Paddock Access',
  'Meet & Greet',
  'Photo Opportunity',
  'Commemorative Gift',
  'Premium Seating',
  'VIP Parking',
  'Champagne Service',
  'Backstage Tour',
  'Sound Check Access',
  'Artist Meet & Greet',
  'Exclusive Merchandise'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD']

interface EventOptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  option?: ProductOption | null
}

export function EventOptionForm({
  open,
  onOpenChange,
  productId,
  option
}: EventOptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedIncludes, setSelectedIncludes] = useState<string[]>([])
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  
  const isEditing = !!option?.id

  const form = useForm<EventOptionFormData>({
    resolver: zodResolver(eventOptionSchema),
    defaultValues: {
      option_name: option?.option_name || '',
      option_code: option?.option_code || '',
      description: option?.description || '',
      ticket_type: (option?.attributes as any)?.ticket_type || 'seated',
      section: (option?.attributes as any)?.section || '',
      seat_details: (option?.attributes as any)?.seat_details || '',
      access_level: (option?.attributes as any)?.access_level || 'general',
      includes: (option?.attributes as any)?.includes || [],
      base_price_hint: (option?.attributes as any)?.base_price_hint || undefined,
      currency: (option?.attributes as any)?.currency || 'USD',
      is_active: option?.is_active ?? true
    }
  })

  // Reset form when option changes (for editing)
  useEffect(() => {
    if (option) {
      form.reset({
        option_name: option.option_name || '',
        option_code: option.option_code || '',
        description: option.description || '',
        ticket_type: (option.attributes as any)?.ticket_type || 'seated',
        section: (option.attributes as any)?.section || '',
        seat_details: (option.attributes as any)?.seat_details || '',
        access_level: (option.attributes as any)?.access_level || 'general',
        includes: (option.attributes as any)?.includes || [],
        base_price_hint: (option.attributes as any)?.base_price_hint || undefined,
        currency: (option.attributes as any)?.currency || 'USD',
        is_active: option.is_active ?? true
      })
      
      const initialIncludes = (option.attributes as any)?.includes || []
      setSelectedIncludes(initialIncludes)
    }
  }, [option, form])

  // Initialize includes for new options
  useEffect(() => {
    if (!option) {
      setSelectedIncludes([])
      form.setValue('includes', [])
    }
  }, [option, form])

  // Auto-generate option code from name
  const watchOptionName = form.watch('option_name')
  useEffect(() => {
    if (!isEditing && watchOptionName) {
      const code = watchOptionName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .split(/\s+/)
        .map(word => word.slice(0, 3))
        .join('-')
        .slice(0, 20)
      
      if (code) {
        form.setValue('option_code', code)
      }
    }
  }, [watchOptionName, isEditing, form])

  const toggleInclude = (include: string) => {
    const newIncludes = selectedIncludes.includes(include)
      ? selectedIncludes.filter(i => i !== include)
      : [...selectedIncludes, include]
    
    setSelectedIncludes(newIncludes)
    form.setValue('includes', newIncludes)
  }

  const onSubmit = async (data: EventOptionFormData) => {
    setIsSubmitting(true)
    try {
      // Build attributes object
      const attributes: any = {
        ticket_type: data.ticket_type,
        section: data.section,
        seat_details: data.seat_details,
        access_level: data.access_level,
        includes: data.includes,
        base_price_hint: data.base_price_hint,
        currency: data.currency
      }

      // Remove attributes from root data
      const { ticket_type, section, seat_details, access_level, includes, base_price_hint, currency, ...baseData } = data
      
      if (isEditing) {
        await updateOption.mutateAsync({
          id: option.id,
          data: {
            ...baseData,
            attributes
          }
        })
      } else {
        await createOption.mutateAsync({
          ...baseData,
          product_id: productId,
          attributes,
          sort_order: 0
        })
      }
      
      form.reset()
      setSelectedIncludes([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving option:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Ticket Option' : 'Add Ticket Option'}
          </DialogTitle>
          <DialogDescription>
            Configure a ticket category or access level for this event.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Basic Information</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="option_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., VIP Hospitality Suite"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="option_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Option Code *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="VIP-HOSP"
                          className="font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Auto-generated from name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional description of this ticket type..."
                          className="resize-none"
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Ticket Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Ticket Configuration</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="ticket_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ticket type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TICKET_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').toUpperCase()}
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
                  name="access_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Level *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACCESS_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level.toUpperCase()}
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
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Main Grandstand, North Stand"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seat_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seat Details</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Row 10, Seats 5-8"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Event Includes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Event Includes</h4>
              <div className="flex flex-wrap gap-2">
                {EVENT_INCLUDES.map((include) => (
                  <Badge
                    key={include}
                    variant={selectedIncludes.includes(include) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleInclude(include)}
                  >
                    {include}
                    {selectedIncludes.includes(include) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <FormDescription className="text-xs">
                Click includes to add/remove them
              </FormDescription>
            </div>

            {/* Pricing & Status */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Pricing & Status</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="base_price_hint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price Hint</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="250.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Reference price only
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
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
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
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Available for booking
                        </FormDescription>
                      </div>
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isEditing ? 'Updating...' : 'Creating...') 
                  : (isEditing ? 'Update Option' : 'Create Option')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
