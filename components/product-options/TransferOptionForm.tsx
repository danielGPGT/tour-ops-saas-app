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
import { transferOptionSchema, type TransferOptionFormData } from '@/lib/validations/product-option.schema'
import type { ProductOption } from '@/lib/types/product-option'
import { StorageService } from '@/lib/storage'

// Configuration data
const VEHICLE_TYPES = [
  'sedan',
  'suv', 
  'MPV',
  'van',
  'minibus',
  'bus',
  'Coach',
  'luxury',
  'limousine'
]

const VEHICLE_CLASSES = [
  'economy',
  'business',
  'luxury',
  'premium'
]

const VEHICLE_FEATURES = [
  'WiFi',
  'Child Seat',
  'Wheelchair Accessible',
  'Air Conditioning',
  'USB Charging',
  'Water Bottles',
  'Phone Charger',
  'Refreshments',
  'Newspaper',
  'Magazine',
  'Bluetooth',
  'GPS Navigation',
  'Leather Seats',
  'Climate Control',
  'Privacy Partition',
  'Entertainment System'
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'CAD', 'AUD']

interface TransferOptionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  option?: ProductOption | null
}

export function TransferOptionForm({
  open,
  onOpenChange,
  productId,
  option
}: TransferOptionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
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
    resolver: zodResolver(transferOptionSchema),
    defaultValues: {
      option_name: '',
      option_code: '',
      description: '',
      vehicle_type: 'sedan',
      max_passengers: 4,
      vehicle_features: [],
      vehicle_class: 'economy',
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
        vehicle_type: (option.attributes as any)?.vehicle_type || 'sedan',
        max_passengers: (option.attributes as any)?.max_passengers || 4,
        vehicle_features: (option.attributes as any)?.vehicle_features || [],
        vehicle_class: (option.attributes as any)?.vehicle_class || 'economy',
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
        vehicle_type: 'sedan',
        max_passengers: 4,
        vehicle_features: [],
        vehicle_class: 'economy',
        base_price_hint: 0,
        currency: 'USD',
        is_active: true
      })
      
      // Clear images for new option
      setImages([])
    }
  }, [option, form])

  // Initialize features
  useEffect(() => {
    const initialFeatures = (option?.attributes as any)?.vehicle_features || []
    setSelectedFeatures(initialFeatures)
    form.setValue('vehicle_features', initialFeatures)
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

  const toggleFeature = (feature: string) => {
    const newFeatures = selectedFeatures.includes(feature)
      ? selectedFeatures.filter(f => f !== feature)
      : [...selectedFeatures, feature]
    
    setSelectedFeatures(newFeatures)
    form.setValue('vehicle_features', newFeatures)
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
        vehicle_type: data.vehicle_type,
        max_passengers: data.max_passengers,
        vehicle_features: data.vehicle_features,
        vehicle_class: data.vehicle_class,
        base_price_hint: data.base_price_hint,
        currency: data.currency,
        images: images // Store images in attributes
      }

      // Remove attributes from root data
      const { vehicle_type, max_passengers, vehicle_features, vehicle_class, base_price_hint, currency, ...baseData } = data
      
      // Submit data without images (they're in attributes now)
      const submitData = {
        ...baseData,
        attributes
      }
      
      if (isEditing) {
        await updateOption.mutateAsync({
          id: option.id,
          data: submitData
        })
      } else {
        await createOption.mutateAsync({
          ...submitData,
          product_id: productId,
          sort_order: 0
        })
      }
      
      form.reset()
      setSelectedFeatures([])
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
      <DialogContent className="!max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Transfer Option' : 'Add Transfer Option'}
          </DialogTitle>
          <DialogDescription>
            Configure a vehicle type or transfer option for this service.
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
                          placeholder="e.g., Private Luxury SUV"
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
                          placeholder="SUV-LUX"
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
                          placeholder="Optional description of this transfer option..."
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

            {/* Vehicle Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Vehicle Configuration</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vehicle_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vehicle type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_TYPES.map((type) => (
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
                  name="vehicle_class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VEHICLE_CLASSES.map((classType) => (
                            <SelectItem key={classType} value={classType}>
                              {classType.charAt(0).toUpperCase() + classType.slice(1)}
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

            {/* Capacity */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Capacity</h4>
              <div className="grid gap-4 sm:grid-cols-1">
                <FormField
                  control={form.control}
                  name="max_passengers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Passengers *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          max={60}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Maximum number of passengers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Vehicle Features */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Vehicle Features</h4>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_FEATURES.map((feature) => (
                  <Badge
                    key={feature}
                    variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleFeature(feature)}
                  >
                    {feature}
                    {selectedFeatures.includes(feature) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              <FormDescription className="text-xs">
                Click features to add/remove them
              </FormDescription>
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
                          placeholder="75.00"
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
