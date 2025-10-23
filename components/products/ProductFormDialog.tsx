"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { productSchema, type ProductFormData } from '@/lib/validations/product.schema'
import { useProductTypes } from '@/lib/hooks/useProducts'
import { 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  Car, 
  Ticket, 
  Tag, 
  Package,
  Building,
  Users,
  Utensils,
  Wifi,
  Waves,
  Dumbbell,
  Coffee
} from 'lucide-react'
import type { Product } from '@/lib/types/product'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
}

const amenityOptions = [
  { value: 'wifi', label: 'WiFi', icon: Wifi },
  { value: 'pool', label: 'Pool', icon: Waves },
  { value: 'gym', label: 'Gym', icon: Dumbbell },
  { value: 'restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'coffee', label: 'Coffee Shop', icon: Coffee },
  { value: 'spa', label: 'Spa', icon: Star },
  { value: 'parking', label: 'Parking', icon: Car },
  { value: 'concierge', label: 'Concierge', icon: Users },
  { value: 'room_service', label: 'Room Service', icon: Package },
  { value: 'business_center', label: 'Business Center', icon: Building }
]

export function ProductFormDialog({ 
  open, 
  onOpenChange, 
  product, 
  onSubmit, 
  isLoading 
}: ProductFormDialogProps) {
  const { data: productTypes, isLoading: typesLoading } = useProductTypes()
  const [activeTab, setActiveTab] = useState('basic')
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      code: product?.code || '',
      product_type_id: product?.product_type_id || '',
      description: product?.description || '',
      location: {
        city: product?.location?.city || '',
        country: product?.location?.country || '',
        lat: product?.location?.lat || undefined,
        lng: product?.location?.lng || undefined,
        address: product?.location?.address || ''
      },
      attributes: product?.attributes || {},
      tags: product?.tags || [],
      images: product?.images || [],
      is_active: product?.is_active ?? true
    }
  })

  const selectedProductType = productTypes?.find(type => type.id === form.watch('product_type_id'))
  const productTypeName = selectedProductType?.type_name?.toLowerCase()

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data)
  }

  const addTag = () => {
    const input = document.getElementById('tag-input') as HTMLInputElement
    const newTag = input.value.trim()
    if (newTag && !form.watch('tags')?.includes(newTag)) {
      form.setValue('tags', [...(form.watch('tags') || []), newTag])
      input.value = ''
    }
  }

  const removeTag = (tagToRemove: string) => {
    form.setValue('tags', form.watch('tags')?.filter(tag => tag !== tagToRemove) || [])
  }

  const handleAmenityChange = (amenityValue: string, checked: boolean) => {
    const currentAmenities = form.watch('attributes.amenities') || []
    if (checked) {
      form.setValue('attributes.amenities', [...currentAmenities, amenityValue])
    } else {
      form.setValue('attributes.amenities', currentAmenities.filter(a => a !== amenityValue))
    }
  }

  const renderHotelAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Star className="h-5 w-5" />
        <h3 className="text-lg font-medium">Hotel Details</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="star_rating">Star Rating</Label>
          <Select
            value={form.watch('attributes.star_rating')?.toString() || ''}
            onValueChange={(value) => form.setValue('attributes.star_rating', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} Star{rating !== 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_in_time">Check-in Time</Label>
          <Input
            id="check_in_time"
            {...form.register('attributes.check_in_time')}
            placeholder="14:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="check_out_time">Check-out Time</Label>
          <Input
            id="check_out_time"
            {...form.register('attributes.check_out_time')}
            placeholder="11:00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_type">Property Type</Label>
        <Select
          value={form.watch('attributes.property_type') || ''}
          onValueChange={(value) => form.setValue('attributes.property_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select property type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hotel">Hotel</SelectItem>
            <SelectItem value="resort">Resort</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="villa">Villa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="grid grid-cols-2 gap-2">
          {amenityOptions.map((amenity) => {
            const IconComponent = amenity.icon
            const isSelected = form.watch('attributes.amenities')?.includes(amenity.value) || false
            
            return (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={amenity.value}
                  checked={isSelected}
                  onCheckedChange={(checked) => handleAmenityChange(amenity.value, checked as boolean)}
                />
                <Label htmlFor={amenity.value} className="flex items-center gap-2 text-sm">
                  <IconComponent className="h-4 w-4" />
                  {amenity.label}
                </Label>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderEventTicketAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Ticket className="h-5 w-5" />
        <h3 className="text-lg font-medium">Event Details</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event_name">Event Name</Label>
          <Input
            id="event_name"
            {...form.register('attributes.event_name')}
            placeholder="Event name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_date">Event Date</Label>
          <Input
            id="event_date"
            type="date"
            {...form.register('attributes.event_date')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue_name">Venue Name</Label>
          <Input
            id="venue_name"
            {...form.register('attributes.venue_name')}
            placeholder="Venue name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue_capacity">Venue Capacity</Label>
          <Input
            id="venue_capacity"
            type="number"
            {...form.register('attributes.venue_capacity', { valueAsNumber: true })}
            placeholder="Capacity"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gates_open_time">Gates Open Time</Label>
          <Input
            id="gates_open_time"
            {...form.register('attributes.gates_open_time')}
            placeholder="18:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event_start_time">Event Start Time</Label>
          <Input
            id="event_start_time"
            {...form.register('attributes.event_start_time')}
            placeholder="20:00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type">Event Type</Label>
        <Select
          value={form.watch('attributes.event_type') || ''}
          onValueChange={(value) => form.setValue('attributes.event_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="concert">Concert</SelectItem>
            <SelectItem value="exhibition">Exhibition</SelectItem>
            <SelectItem value="theater">Theater</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderTourAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="text-lg font-medium">Tour Details</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_hours">Duration (hours)</Label>
          <Input
            id="duration_hours"
            type="number"
            {...form.register('attributes.duration_hours', { valueAsNumber: true })}
            placeholder="4"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_days">Duration (days)</Label>
          <Input
            id="duration_days"
            type="number"
            {...form.register('attributes.duration_days', { valueAsNumber: true })}
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="meeting_point">Meeting Point</Label>
          <Input
            id="meeting_point"
            {...form.register('attributes.meeting_point')}
            placeholder="Meeting point address"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="meeting_time">Meeting Time</Label>
          <Input
            id="meeting_time"
            {...form.register('attributes.meeting_time')}
            placeholder="09:00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="end_point">End Point</Label>
        <Input
          id="end_point"
          {...form.register('attributes.end_point')}
          placeholder="End point address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max_group_size">Max Group Size</Label>
          <Input
            id="max_group_size"
            type="number"
            {...form.register('attributes.max_group_size', { valueAsNumber: true })}
            placeholder="20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tour_type">Tour Type</Label>
          <Select
            value={form.watch('attributes.tour_type') || ''}
            onValueChange={(value) => form.setValue('attributes.tour_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tour type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group">Group Tour</SelectItem>
              <SelectItem value="private">Private Tour</SelectItem>
              <SelectItem value="self_guided">Self-Guided</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inclusions">Inclusions (one per line)</Label>
        <Textarea
          id="inclusions"
          {...form.register('attributes.inclusions')}
          placeholder="Included items..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exclusions">Exclusions (one per line)</Label>
        <Textarea
          id="exclusions"
          {...form.register('attributes.exclusions')}
          placeholder="Excluded items..."
          rows={3}
        />
      </div>
    </div>
  )

  const renderTransferAttributes = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5" />
        <h3 className="text-lg font-medium">Transfer Details</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Vehicle Type</Label>
          <Select
            value={form.watch('attributes.vehicle_type') || ''}
            onValueChange={(value) => form.setValue('attributes.vehicle_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sedan">Sedan</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_passengers">Max Passengers</Label>
          <Input
            id="max_passengers"
            type="number"
            {...form.register('attributes.max_passengers', { valueAsNumber: true })}
            placeholder="4"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from_location">From Location</Label>
          <Input
            id="from_location"
            {...form.register('attributes.from_location')}
            placeholder="Airport, Hotel, etc."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to_location">To Location</Label>
          <Input
            id="to_location"
            {...form.register('attributes.to_location')}
            placeholder="Hotel, Airport, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="distance_km">Distance (km)</Label>
          <Input
            id="distance_km"
            type="number"
            step="0.1"
            {...form.register('attributes.distance_km', { valueAsNumber: true })}
            placeholder="25.5"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            {...form.register('attributes.duration_minutes', { valueAsNumber: true })}
            placeholder="45"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="transfer_type">Transfer Type</Label>
        <Select
          value={form.watch('attributes.transfer_type') || ''}
          onValueChange={(value) => form.setValue('attributes.transfer_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select transfer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="airport">Airport Transfer</SelectItem>
            <SelectItem value="hotel">Hotel Transfer</SelectItem>
            <SelectItem value="point_to_point">Point to Point</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  const renderAttributes = () => {
    if (!selectedProductType) {
      return (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please select a product type first</p>
        </div>
      )
    }

    switch (productTypeName) {
      case 'hotel':
        return renderHotelAttributes()
      case 'event_ticket':
        return renderEventTicketAttributes()
      case 'tour':
        return renderTourAttributes()
      case 'transfer':
        return renderTransferAttributes()
      default:
        return (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No specific attributes for this product type</p>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="attributes">Attributes</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="Enter product name"
                    className={form.formState.errors.name && 'border-red-500'}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Product Code *</Label>
                  <Input
                    id="code"
                    {...form.register('code')}
                    placeholder="Enter product code"
                    className={form.formState.errors.code && 'border-red-500'}
                  />
                  {form.formState.errors.code && (
                    <p className="text-sm text-red-500">{form.formState.errors.code.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product_type_id">Product Type *</Label>
                <Select
                  value={form.watch('product_type_id')}
                  onValueChange={(value) => form.setValue('product_type_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.type_name} ({type.type_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.product_type_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.product_type_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('tags')?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="tag-input"
                    placeholder="Add a tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Tag className="h-4 w-4 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked as boolean)}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        {...form.register('location.city')}
                        placeholder="City"
                        className={form.formState.errors.location?.city && 'border-red-500'}
                      />
                      {form.formState.errors.location?.city && (
                        <p className="text-sm text-red-500">{form.formState.errors.location.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        {...form.register('location.country')}
                        placeholder="Country"
                        className={form.formState.errors.location?.country && 'border-red-500'}
                      />
                      {form.formState.errors.location?.country && (
                        <p className="text-sm text-red-500">{form.formState.errors.location.country.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude</Label>
                      <Input
                        id="lat"
                        type="number"
                        step="any"
                        {...form.register('location.lat', { valueAsNumber: true })}
                        placeholder="Latitude"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude</Label>
                      <Input
                        id="lng"
                        type="number"
                        step="any"
                        {...form.register('location.lng', { valueAsNumber: true })}
                        placeholder="Longitude"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        {...form.register('location.address')}
                        placeholder="Street address"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attributes Tab */}
            <TabsContent value="attributes" className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  {renderAttributes()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
