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
import { X, Upload, Image as ImageIcon, Trash2 } from 'lucide-react'
import { useCreateProductOption, useUpdateProductOption } from '@/lib/hooks/useProductOptions'
import { eventOptionSchema, type EventOptionFormData } from '@/lib/validations/product-option.schema'
import type { ProductOption } from '@/lib/types/product-option'
import { StorageService } from '@/lib/storage'

// Configuration data
const TICKET_TYPES = [
  'seated',
  'standing', 
  'grandstand',
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
  const [images, setImages] = useState<Array<{
    url: string
    alt: string
    is_primary: boolean
  }>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  
  const isEditing = !!option?.id

  const form = useForm({
    resolver: zodResolver(eventOptionSchema),
    defaultValues: {
      option_name: option?.option_name || '',
      option_code: option?.option_code || '',
      description: option?.description || '',
      ticket_type: (option?.attributes as any)?.ticket_type || 'seated',
      section: (option?.attributes as any)?.section || '',
      seat_details: (option?.attributes as any)?.seat_details || '',
      access_level: (option?.attributes as any)?.access_level || 'general',
      valid_days: (option?.attributes as any)?.valid_days || 1,
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
        valid_days: (option.attributes as any)?.valid_days || 1,
        includes: (option.attributes as any)?.includes || [],
        base_price_hint: (option.attributes as any)?.base_price_hint || undefined,
        currency: (option.attributes as any)?.currency || 'USD',
        is_active: option.is_active ?? true
      })
      
      const initialIncludes = (option.attributes as any)?.includes || []
      setSelectedIncludes(initialIncludes)
      
      // Set images from option attributes
      setImages((option.attributes as any)?.images || [])
    }
  }, [option, form])

  // Initialize includes for new options
  useEffect(() => {
    if (!option) {
      setSelectedIncludes([])
      form.setValue('includes', [])
      // Clear images for new option
      setImages([])
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

  // Image upload functions
  const handleImageUpload = async (files: FileList) => {
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }

    setUploadingImages(true)
    try {
      // Convert FileList to File array
      const fileArray = Array.from(files)
      
      // Upload images using StorageService
      const uploadedImages = await StorageService.uploadImagesToStorage(
        fileArray, 
        productId
      )
      
      // Set primary image (first uploaded image becomes primary if no images exist)
      const imagesWithPrimary = uploadedImages.map((img, index) => ({
        ...img,
        is_primary: images.length === 0 && index === 0
      }))
      
      setImages(prev => [...prev, ...imagesWithPrimary])
    } catch (error) {
      console.error('Image upload failed:', error)
      alert('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = async (index: number) => {
    const imageToRemove = images[index]
    
    try {
      // Delete from storage if it's a real uploaded image (not blob URL)
      if (imageToRemove.url && !imageToRemove.url.startsWith('blob:')) {
        await StorageService.deleteImage(imageToRemove.url)
      }
      
      setImages(prev => {
        const newImages = prev.filter((_, i) => i !== index)
        // If we removed the primary image, make the first remaining image primary
        if (index === 0 && newImages.length > 0) {
          newImages[0].is_primary = true
        }
        return newImages
      })
    } catch (error) {
      console.error('Error deleting image:', error)
      // Still remove from UI even if storage deletion fails
      setImages(prev => {
        const newImages = prev.filter((_, i) => i !== index)
        if (index === 0 && newImages.length > 0) {
          newImages[0].is_primary = true
        }
        return newImages
      })
    }
  }

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })))
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Build attributes object (including images)
      const attributes: any = {
        ticket_type: data.ticket_type,
        section: data.section,
        seat_details: data.seat_details,
        access_level: data.access_level,
        valid_days: data.valid_days,
        includes: data.includes,
        base_price_hint: data.base_price_hint,
        currency: data.currency,
        images: images // Store images in attributes
      }

      // Remove attributes from root data
      const { ticket_type, section, seat_details, access_level, valid_days, includes, base_price_hint, currency, ...baseData } = data
      
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
      setImages([])
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
                              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                              {level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                          placeholder="e.g., Row 10, Seats 5-8 (if applicable)"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Only for events with assigned seating
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Days</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="30"
                          placeholder="1"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Number of days this ticket is valid (1-30)
                      </FormDescription>
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

            {/* Images */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Images</h4>
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages || images.length >= 5}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center gap-2 ${
                      uploadingImages || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-75'
                    }`}
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm">
                      {uploadingImages ? (
                        'Uploading...'
                      ) : images.length >= 5 ? (
                        'Maximum 5 images reached'
                      ) : (
                        `Upload images (${images.length}/5)`
                      )}
                    </div>
                  </label>
                </div>

                {/* Image Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Primary Badge */}
                        {image.is_primary && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="default" className="text-xs">
                              Primary
                            </Badge>
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            {!image.is_primary && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={() => setPrimaryImage(index)}
                              >
                                <ImageIcon className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 w-6 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
