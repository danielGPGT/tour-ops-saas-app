"use client"

import React from 'react'
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
import { productSchema, type ProductFormData } from '@/lib/validations/product.schema'
import { useProductTypes } from '@/lib/hooks/useProducts'
import { MapPin, Star, Calendar, Clock, Car, Ticket } from 'lucide-react'
import type { Product } from '@/lib/types/product'

interface ProductFormProps {
  product?: Product
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const { data: productTypes, isLoading: typesLoading } = useProductTypes()
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || '',
      code: product?.code || '',
      product_type_id: product?.product_type_id || '',
      description: product?.description || '',
      supplier_id: product?.supplier_id || undefined,
      venue_name: product?.venue_name || undefined,
      event_id: product?.event_id || undefined,
      location: {
        city: product?.location?.city || '',
        country: product?.location?.country || '',
        lat: product?.location?.lat || undefined,
        lng: product?.location?.lng || undefined,
        address: product?.location?.address || ''
      },
      attributes: product?.attributes || {},
      is_active: product?.is_active ?? true
    }
  })

  const selectedProductType = productTypes?.find(type => type.id === form.watch('product_type_id'))
  const productTypeName = selectedProductType?.type_name?.toLowerCase()

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data)
  }



  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="venue_name">Venue Name</Label>
                <Input
                  id="venue_name"
                  {...form.register('venue_name')}
                  placeholder="Enter venue name"
                />
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  {...form.register('is_active')}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </CardContent>
          </Card>
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
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register('location.city')}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    {...form.register('location.country')}
                    placeholder="Country"
                  />
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
            <CardHeader>
              <CardTitle>Product Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Hotel-specific attributes */}
              {productTypeName === 'hotel' && (
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
                    <Label>Amenities</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.watch('attributes.amenities')?.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeAmenity(amenity)}>
                          {amenity} ×
                        </Badge>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addAmenity}>
                      Add Amenity
                    </Button>
                  </div>
                </div>
              )}

              {/* Event-specific attributes */}
              {productTypeName === 'event_ticket' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Event Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Event Date</Label>
                      <Input
                        id="event_date"
                        type="date"
                        {...form.register('attributes.event_date')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gates_open_time">Gates Open Time</Label>
                      <Input
                        id="gates_open_time"
                        {...form.register('attributes.gates_open_time')}
                        placeholder="18:00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        {...form.register('attributes.venue')}
                        placeholder="Venue name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="event_type">Event Type</Label>
                      <Input
                        id="event_type"
                        {...form.register('attributes.event_type')}
                        placeholder="Concert, Sports, etc."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tour-specific attributes */}
              {productTypeName === 'tour' && (
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
                      <Label htmlFor="difficulty_level">Difficulty Level</Label>
                      <Select
                        value={form.watch('attributes.difficulty_level') || ''}
                        onValueChange={(value) => form.setValue('attributes.difficulty_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="difficult">Difficult</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting_point">Meeting Point</Label>
                    <Input
                      id="meeting_point"
                      {...form.register('attributes.meeting_point')}
                      placeholder="Meeting point address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Inclusions</Label>
                    <Textarea
                      {...form.register('attributes.inclusions')}
                      placeholder="What's included in the tour"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Exclusions</Label>
                    <Textarea
                      {...form.register('attributes.exclusions')}
                      placeholder="What's not included in the tour"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Transfer-specific attributes */}
              {productTypeName === 'transfer' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Car className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Transfer Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_type">Vehicle Type</Label>
                      <Input
                        id="vehicle_type"
                        {...form.register('attributes.vehicle_type')}
                        placeholder="Sedan, SUV, Bus, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="luggage_allowance">Luggage Allowance</Label>
                      <Input
                        id="luggage_allowance"
                        {...form.register('attributes.luggage_allowance')}
                        placeholder="1 suitcase per person"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="route">Route</Label>
                    <Input
                      id="route"
                      {...form.register('attributes.route')}
                      placeholder="Airport to Hotel, Hotel to Airport, etc."
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
