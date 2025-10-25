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
import { Checkbox } from '@/components/ui/checkbox'
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
import { extraOptionSchema, type ExtraOptionFormData } from '@/lib/validations/product-option.schema'
import type { ProductOption } from '@/lib/types/product-option'
import { StorageService } from '@/lib/storage'

// Configuration data
const EXTRA_TYPES = [
  'insurance',
  'visa',
  'equipment',
  'service',
  'upgrade',
  'other'
]

const UNIT_TYPES = [
  'per_person',
  'per_booking',
  'per_day',
  'per_item'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD']

interface ExtraOptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  option?: ProductOption | null
}

export function ExtraOptionForm({
  open,
  onOpenChange,
  productId,
  option
}: ExtraOptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<Array<{
    url: string
    alt: string
    is_primary: boolean
  }>>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  
  const isEditing = !!option?.id

  const form = useForm<ExtraOptionFormData>({
    resolver: zodResolver(extraOptionSchema),
    defaultValues: {
      option_name: '',
      option_code: '',
      description: '',
      extra_type: 'service',
      unit_type: 'per_person',
      is_mandatory: false,
      coverage_details: '',
      validity_days: 30,
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
        extra_type: (option.attributes as any)?.extra_type || 'service',
        unit_type: (option.attributes as any)?.unit_type || 'per_person',
        is_mandatory: (option.attributes as any)?.is_mandatory || false,
        coverage_details: (option.attributes as any)?.coverage_details || '',
        validity_days: (option.attributes as any)?.validity_days || 30,
        base_price_hint: (option.attributes as any)?.base_price_hint || 0,
        currency: (option.attributes as any)?.currency || 'USD',
        is_active: option.is_active ?? true
      })
      
      // Set images from option attributes
      setImages((option.attributes as any)?.images || [])
    } else {
      form.reset({
        option_name: '',
        option_code: '',
        description: '',
        extra_type: 'service',
        unit_type: 'per_person',
        is_mandatory: false,
        coverage_details: '',
        validity_days: 30,
        base_price_hint: 0,
        currency: 'USD',
        is_active: true
      })
      
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

  const onSubmit = async (data: ExtraOptionFormData) => {
    setIsSubmitting(true)
    try {
      // Build attributes object (including images)
      const attributes: any = {
        extra_type: data.extra_type,
        unit_type: data.unit_type,
        is_mandatory: data.is_mandatory,
        coverage_details: data.coverage_details,
        validity_days: data.validity_days,
        base_price_hint: data.base_price_hint,
        currency: data.currency,
        images: images // Store images in attributes
      }

      // Remove attributes from root data
      const { extra_type, unit_type, is_mandatory, coverage_details, validity_days, base_price_hint, currency, ...baseData } = data
      
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
      setImages([])
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving option:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedExtraType = form.watch('extra_type')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Extra Option' : 'Add Extra Option'}
          </DialogTitle>
          <DialogDescription>
            Configure an extra service or add-on for this product.
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
                          placeholder="e.g., Comprehensive Travel Insurance"
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
                          placeholder="INS-COMP"
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
                          placeholder="Optional description of this extra service..."
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

            {/* Extra Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Extra Configuration</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="extra_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extra Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select extra type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {EXTRA_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
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
                  name="unit_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {UNIT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
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
                  name="validity_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validity Days</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          placeholder="30"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        How many days this extra is valid for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_mandatory"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Mandatory</FormLabel>
                        <FormDescription className="text-xs">
                          Automatically added to bookings
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Coverage Details (for insurance) */}
            {selectedExtraType === 'insurance' && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Coverage Details</h4>
                <FormField
                  control={form.control}
                  name="coverage_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coverage Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Covers medical expenses up to $50,000, trip cancellation, lost luggage, emergency evacuation..."
                          className="resize-none"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Describe what this insurance covers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

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
                          placeholder="25.00"
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
