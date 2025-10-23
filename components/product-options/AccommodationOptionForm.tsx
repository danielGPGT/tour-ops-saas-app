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
import { accommodationOptionSchema, type AccommodationOptionFormData } from '@/lib/validations/product-option.schema'
import type { ProductOption } from '@/lib/types/product-option'

// Configuration data
const BED_CONFIGURATIONS = [
  '1 King Bed',
  '1 Queen Bed', 
  '2 Single Beds',
  '2 Queen Beds',
  '1 King + 1 Sofa Bed',
  '1 Queen + 1 Sofa Bed',
  '2 King Beds',
  '1 King + 2 Single Beds'
]

const VIEW_TYPES = [
  'Sea View',
  'City View', 
  'Garden View',
  'Pool View',
  'Mountain View',
  'No View'
]

const FLOOR_RANGES = [
  'Ground Floor',
  '1-5',
  '6-10', 
  '11-15',
  '16-20',
  'High Floor',
  'Penthouse'
]

const AMENITIES = [
  'Balcony',
  'Kitchenette',
  'Bathtub',
  'Walk-in Shower',
  'Coffee Machine',
  'Mini Bar',
  'Safe',
  'Air Conditioning',
  'WiFi',
  'TV',
  'Sea View',
  'City View',
  'Garden View',
  'Pool View'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD']

interface AccommodationOptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  option?: ProductOption | null
}

export function AccommodationOptionForm({
  open,
  onOpenChange,
  productId,
  option
}: AccommodationOptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  
  const isEditing = !!option?.id

  const form = useForm<AccommodationOptionFormData>({
    resolver: zodResolver(accommodationOptionSchema),
    defaultValues: {
      option_name: '',
      option_code: '',
      description: '',
      bed_configuration: '',
      room_size_sqm: 0,
      view_type: '',
      floor_range: '',
      standard_occupancy: 2,
      max_occupancy: 2,
      amenities: [],
      base_price_hint: 0,
      currency: 'USD',
      is_active: true
    }
  })

  // Update form when option changes (for editing)
  useEffect(() => {
    if (option) {
      form.reset({
        option_name: option.option_name || '',
        option_code: option.option_code || '',
        description: option.description || '',
        bed_configuration: (option.attributes as any)?.bed_configuration || '',
        room_size_sqm: (option.attributes as any)?.room_size_sqm || 0,
        view_type: (option.attributes as any)?.view_type || '',
        floor_range: (option.attributes as any)?.floor_range || '',
        standard_occupancy: option.standard_occupancy || 2,
        max_occupancy: option.max_occupancy || 2,
        amenities: (option.attributes as any)?.amenities || [],
        base_price_hint: (option.attributes as any)?.base_price_hint || 0,
        currency: (option.attributes as any)?.currency || 'USD',
        is_active: option.is_active ?? true
      })
    } else {
      form.reset({
        option_name: '',
        option_code: '',
        description: '',
        bed_configuration: '',
        room_size_sqm: 0,
        view_type: '',
        floor_range: '',
        standard_occupancy: 2,
        max_occupancy: 2,
        amenities: [],
        base_price_hint: 0,
        currency: 'USD',
        is_active: true
      })
    }
  }, [option, form])

  // Initialize amenities
  useEffect(() => {
    const initialAmenities = (option?.attributes as any)?.amenities || []
    setSelectedAmenities(initialAmenities)
    form.setValue('amenities', initialAmenities)
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

  const toggleAmenity = (amenity: string) => {
    const newAmenities = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity]
    
    setSelectedAmenities(newAmenities)
    form.setValue('amenities', newAmenities)
  }

  const onSubmit = async (data: AccommodationOptionFormData) => {
    setIsSubmitting(true)
    try {
      // Build attributes object
      const attributes: any = {
        bed_configuration: data.bed_configuration,
        room_size_sqm: data.room_size_sqm,
        view_type: data.view_type,
        floor_range: data.floor_range,
        amenities: data.amenities,
        base_price_hint: data.base_price_hint,
        currency: data.currency
      }

      // Remove attributes from root data
      const { bed_configuration, room_size_sqm, view_type, floor_range, amenities, base_price_hint, currency, ...baseData } = data
      
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
      setSelectedAmenities([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving option:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Room Option' : 'Add Room Option'}
          </DialogTitle>
          <DialogDescription>
            Configure a room type or accommodation option for this property.
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
                          placeholder="e.g., Deluxe Room Double"
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
                          placeholder="DLX-DBL"
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
                          placeholder="Optional description of this room type..."
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

            {/* Room Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Room Configuration</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bed_configuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bed Configuration *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bed type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BED_CONFIGURATIONS.map((config) => (
                            <SelectItem key={config} value={config}>
                              {config}
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
                  name="room_size_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Size (m²)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.1"
                          placeholder="35"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="view_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>View Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select view" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VIEW_TYPES.map((view) => (
                            <SelectItem key={view} value={view}>
                              {view}
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
                  name="floor_range"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Floor Range</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select floor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FLOOR_RANGES.map((floor) => (
                            <SelectItem key={floor} value={floor}>
                              {floor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Occupancy */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Occupancy</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="standard_occupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Occupancy *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Standard number of guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_occupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Occupancy *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Maximum number of guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                    {selectedAmenities.includes(amenity) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <FormDescription className="text-xs">
                Click amenities to add/remove them
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
                          placeholder="150.00"
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
