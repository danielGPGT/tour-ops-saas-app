'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { useCreateProductOption } from '@/lib/hooks/useProducts'
import type { Product, ProductOption } from '@/lib/types/product'
import { ProductImagesInlineEdit } from '@/components/products/ProductImagesInlineEdit'

// Product option validation schema
const productOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name is required'),
  option_code: z.string().min(2, 'Option code is required').max(20),
  description: z.string().optional(),
  standard_occupancy: z.number().int().min(1, 'Must be at least 1'),
  max_occupancy: z.number().int().min(1, 'Must be at least 1'),
  min_occupancy: z.number().int().min(1).default(1),
  bed_configuration: z.string().optional(),
  is_active: z.boolean().default(true),
  // Type-specific attributes
  size_sqm: z.number().positive().optional(),
  view_type: z.string().optional(),
  floor_range: z.string().optional(),
  seat_section: z.string().optional(),
  seat_category: z.string().optional(),
  // Media
  images: z.array(z.object({
    url: z.string(),
    alt: z.string(),
    is_primary: z.boolean()
  })).optional(),
}).refine(data => data.max_occupancy >= data.standard_occupancy, {
  message: 'Max occupancy must be >= standard occupancy',
  path: ['max_occupancy']
})

type ProductOptionFormData = z.infer<typeof productOptionSchema>

interface ProductOptionDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  editOption?: ProductOption | null
}

export function ProductOptionDialog({
  product,
  open,
  onOpenChange,
  editOption
}: ProductOptionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const createOption = useCreateProductOption()
  
  const productTypeName = product.product_type?.type_name?.toLowerCase() || ''
  const isHotelType = productTypeName === 'accommodation' || productTypeName.includes('hotel')
  const isEventType = productTypeName === 'event' || productTypeName.includes('ticket')
  const isActivityType = productTypeName === 'activity' || productTypeName.includes('activity')
  const isTransferType = productTypeName === 'transfer' || productTypeName.includes('transfer')

  const form = useForm<ProductOptionFormData>({
    resolver: zodResolver(productOptionSchema),
    defaultValues: {
      option_name: editOption?.option_name || '',
      option_code: editOption?.option_code || '',
      description: editOption?.description || '',
      standard_occupancy: editOption?.standard_occupancy || 2,
      max_occupancy: editOption?.max_occupancy || 2,
      min_occupancy: (editOption as any)?.min_occupancy || 1,
      bed_configuration: editOption?.bed_configuration || '',
      is_active: editOption?.is_active ?? true,
      // Type-specific attributes
      size_sqm: (editOption?.attributes as any)?.size_sqm || undefined,
      view_type: (editOption?.attributes as any)?.view_type || '',
      floor_range: (editOption?.attributes as any)?.floor_range || '',
      seat_section: (editOption?.attributes as any)?.seat_section || '',
      seat_category: (editOption?.attributes as any)?.seat_category || '',
      images: (editOption?.attributes as any)?.images || []
    }
  })

  // Auto-generate option code from name
  const watchOptionName = form.watch('option_name')
  useEffect(() => {
    if (!editOption && watchOptionName) {
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
  }, [watchOptionName, editOption, form])

  const onSubmit = async (data: ProductOptionFormData) => {
    setIsSubmitting(true)
    try {
      // Build attributes object from type-specific fields
      const attributes: any = {}
      
      if (isHotelType) {
        if (data.size_sqm) attributes.size_sqm = data.size_sqm
        if (data.view_type) attributes.view_type = data.view_type
        if (data.floor_range) attributes.floor_range = data.floor_range
      }
      
      if (isEventType) {
        if (data.seat_section) attributes.seat_section = data.seat_section
        if (data.seat_category) attributes.seat_category = data.seat_category
      }

      // Add images if provided
      if (data.images && data.images.length > 0) {
        attributes.images = data.images
      }

      // Remove type-specific fields from root
      const { size_sqm, view_type, floor_range, seat_section, seat_category, images, ...baseData } = data
      
      await createOption.mutateAsync({
        ...baseData,
        product_id: product.id,
        attributes,
        sort_order: 0,
        inclusions: []
      })
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating option:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editOption ? 'Edit Product Option' : 'Add Product Option'}
          </DialogTitle>
          <DialogDescription>
            {isHotelType 
              ? 'Add a room type or accommodation option for this product.'
              : 'Add a variant or option for this product.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Option Name */}
              <FormField
                control={form.control}
                name="option_name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Option Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={isHotelType ? "e.g., Deluxe Room Double" : "e.g., Standard Ticket"}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Option Code */}
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

              {/* Status */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription className="text-xs">
                        Available for sale
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

              {/* Standard Occupancy */}
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

              {/* Max Occupancy */}
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

              {/* Bed Configuration (Hotels only) */}
              {isHotelType && (
                <FormField
                  control={form.control}
                  name="bed_configuration"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Bed Configuration</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 1 King Bed or 2 Twin Beds"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Optional description of this option..."
                        className="resize-none"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type-Specific Attributes */}
              {(isHotelType || isEventType) && (
                <div className="sm:col-span-2 border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Type-Specific Attributes</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Hotel Attributes */}
                    {isHotelType && (
                      <>
                        <FormField
                          control={form.control}
                          name="size_sqm"
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
                              <FormControl>
                                <Input 
                                  placeholder="City, Sea, Garden..."
                                  {...field} 
                                />
                              </FormControl>
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
                              <FormControl>
                                <Input 
                                  placeholder="2-5, Ground, High..."
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                    
                    {/* Event Attributes */}
                    {isEventType && (
                      <>
                        <FormField
                          control={form.control}
                          name="seat_section"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seat Section</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="VIP, General, etc."
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="seat_category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seat Category</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Gold, Silver, Bronze"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Images Section */}
              <div className="sm:col-span-2 border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Option Images</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Add photos specific to this option (e.g., room photos, ticket view photos)
                </p>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="border rounded-lg p-3 bg-muted/20">
                          {/* Placeholder for now - we'll use a simplified image uploader */}
                          <div className="text-sm text-muted-foreground text-center py-4">
                            Images can be managed after creating the option
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
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
                {isSubmitting ? 'Creating...' : editOption ? 'Update Option' : 'Create Option'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
