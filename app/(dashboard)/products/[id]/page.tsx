"use client"

import React, { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InfoCard } from '@/components/common/InfoCard'
import { StatsGrid } from '@/components/common/StatsGrid'
import { PageHeader } from '@/components/common/PageHeader'
import { EnterpriseInlineEdit, InlineTextEdit, InlineTextareaEdit, InlineSelectEdit } from '@/components/common/EnterpriseInlineEdit'
import { TagsEditor } from '@/components/common/TagsEditor'
import { ActivityLog } from '@/components/common/ActivityLog'
import { useProduct, useDeleteProduct, useUpdateProduct } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { 
  MapPin, 
  Star, 
  Calendar, 
  Clock, 
  Car, 
  Ticket, 
  Edit, 
  Trash2, 
  Package,
  Tag,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'

interface ProductDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { data: product, isLoading, error } = useProduct(id)
  const deleteProduct = useDeleteProduct()
  const updateProduct = useUpdateProduct()

  const handleEdit = () => {
    router.push(`/products/${id}/edit`)
  }

  const handleDelete = async () => {
    try {
      await deleteProduct.mutateAsync(id)
      showSuccess('Product deleted successfully')
      router.push('/products')
    } catch (error) {
      showError('Failed to delete product')
    }
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      await updateProduct.mutateAsync({
        id,
        data: { [field]: value }
      })
      showSuccess('Product updated successfully')
    } catch (error) {
      showError('Failed to update product')
      throw error
    }
  }

  const handleLocationUpdate = async (locationField: string, value: any) => {
    try {
      const updatedLocation = {
        ...product?.location,
        [locationField]: value
      }
      await updateProduct.mutateAsync({
        id,
        data: { location: updatedLocation }
      })
      showSuccess('Location updated successfully')
    } catch (error) {
      showError('Failed to update location')
      throw error
    }
  }

  const handleTagsUpdate = async (tags: string[]) => {
    try {
      await updateProduct.mutateAsync({
        id,
        data: { tags }
      })
      showSuccess('Tags updated successfully')
    } catch (error) {
      showError('Failed to update tags')
      throw error
    }
  }

  const handleAttributeUpdate = async (attributeField: string, value: any) => {
    try {
      const updatedAttributes = {
        ...product?.attributes,
        [attributeField]: value
      }
      await updateProduct.mutateAsync({
        id,
        data: { attributes: updatedAttributes }
      })
      showSuccess('Attribute updated successfully')
    } catch (error) {
      showError('Failed to update attribute')
      throw error
    }
  }

  const getProductTypeIcon = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'accommodation':
        return <Star className="h-5 w-5" />
      case 'event':
      case 'tickets & passes':
        return <Ticket className="h-5 w-5" />
      case 'activity':
      case 'activities & experiences':
        return <Clock className="h-5 w-5" />
      case 'transfer':
      case 'transfers':
        return <Car className="h-5 w-5" />
      case 'package':
        return <Package className="h-5 w-5" />
      case 'extras & add-ons':
        return <Package className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getProductTypeColor = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'accommodation':
        return 'bg-blue-100 text-blue-800'
      case 'event':
      case 'tickets & passes':
        return 'bg-purple-100 text-purple-800'
      case 'activity':
      case 'activities & experiences':
        return 'bg-green-100 text-green-800'
      case 'transfer':
      case 'transfers':
        return 'bg-orange-100 text-orange-800'
      case 'package':
        return 'bg-pink-100 text-pink-800'
      case 'extras & add-ons':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Product Not Found</h3>
          <p className="text-muted-foreground">The requested product could not be found.</p>
          <Button onClick={() => router.push('/products')} className="mt-4">
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const stats = [
    {
      id: 'options',
      label: 'Product Options',
      value: product.product_options?.length || 0,
      icon: <Package className="h-4 w-4" />
    },
    {
      id: 'rates',
      label: 'Selling Rates',
      value: product.selling_rates?.length || 0,
      icon: <Star className="h-4 w-4" />
    },
    {
      id: 'tags',
      label: 'Tags',
      value: product.attributes?.tags?.length || 0,
      icon: <Tag className="h-4 w-4" />
    },
    {
      id: 'status',
      label: 'Status',
      value: product.is_active ? 'Active' : 'Inactive',
      icon: <Globe className="h-4 w-4" />
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.description || 'Product details'}
        backButton={{
          onClick: () => router.push('/products'),
          label: 'Back to Products'
        }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="rates">Selling Rates</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <InfoCard
              title="Basic Information"
              icon={<Package className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Name</span>
                  <InlineTextEdit
                    value={product.name}
                    onSave={(value) => handleFieldUpdate('name', value)}
                    placeholder="Enter product name"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Code</span>
                  <InlineTextEdit
                    value={product.code}
                    onSave={(value) => handleFieldUpdate('code', value)}
                    placeholder="Enter product code"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Type</span>
                  <div className="flex items-center gap-2">
                    {getProductTypeIcon(product.product_type?.type_name || '')}
                    <Badge className={getProductTypeColor(product.product_type?.type_name || '')}>
                      {product.product_type?.type_name || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Description</span>
                  <InlineTextareaEdit
                    value={product.description || ''}
                    onSave={(value) => handleFieldUpdate('description', value)}
                    placeholder="Enter product description"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <InlineSelectEdit
                    value={product.is_active ? 'active' : 'inactive'}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' }
                    ]}
                    onSave={(value) => handleFieldUpdate('is_active', value === 'active')}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Created</span>
                  <span className="text-sm">{format(new Date(product.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </InfoCard>

            {/* Location Information */}
            <InfoCard
              title="Location"
              icon={<MapPin className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">City</span>
                  <InlineTextEdit
                    value={product.location?.city || ''}
                    onSave={(value) => handleLocationUpdate('city', value)}
                    placeholder="Enter city"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Country</span>
                  <InlineTextEdit
                    value={product.location?.country || ''}
                    onSave={(value) => handleLocationUpdate('country', value)}
                    placeholder="Enter country"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">Address</span>
                  <InlineTextEdit
                    value={product.location?.address || ''}
                    onSave={(value) => handleLocationUpdate('address', value)}
                    placeholder="Enter address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Latitude</span>
                    <InlineTextEdit
                      value={product.location?.lat?.toString() || ''}
                      onSave={(value) => handleLocationUpdate('lat', parseFloat(value) || null)}
                      placeholder="Latitude"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">Longitude</span>
                    <InlineTextEdit
                      value={product.location?.lng?.toString() || ''}
                      onSave={(value) => handleLocationUpdate('lng', parseFloat(value) || null)}
                      placeholder="Longitude"
                    />
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Product Attributes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getProductTypeIcon(product.product_type?.type_name || '')}
                Product Attributes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Accommodation specific attributes */}
                {product.product_type?.type_name?.toLowerCase() === 'accommodation' && (
                  <>
                    {product.attributes?.star_rating && (
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span className="font-medium">Star Rating:</span>
                        <span>{product.attributes.star_rating} stars</span>
                      </div>
                    )}
                    {product.attributes?.check_in_time && (
                      <div>
                        <span className="font-medium">Check-in:</span>
                        <span className="ml-2">{product.attributes.check_in_time}</span>
                      </div>
                    )}
                    {product.attributes?.check_out_time && (
                      <div>
                        <span className="font-medium">Check-out:</span>
                        <span className="ml-2">{product.attributes.check_out_time}</span>
                      </div>
                    )}
                    {product.attributes?.amenities && product.attributes.amenities.length > 0 && (
                      <div className="col-span-full">
                        <span className="font-medium">Amenities:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {product.attributes.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Event specific attributes */}
                {(product.product_type?.type_name?.toLowerCase() === 'event' || product.product_type?.type_name?.toLowerCase() === 'tickets & passes') && (
                  <>
                    {product.attributes?.event_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Event Date:</span>
                        <span>{format(new Date(product.attributes.event_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {product.attributes?.venue && (
                      <div>
                        <span className="font-medium">Venue:</span>
                        <span className="ml-2">{product.attributes.venue}</span>
                      </div>
                    )}
                    {product.attributes?.gates_open_time && (
                      <div>
                        <span className="font-medium">Gates Open:</span>
                        <span className="ml-2">{product.attributes.gates_open_time}</span>
                      </div>
                    )}
                    {product.attributes?.event_type && (
                      <div>
                        <span className="font-medium">Event Type:</span>
                        <span className="ml-2">{product.attributes.event_type}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Activity specific attributes */}
                {(product.product_type?.type_name?.toLowerCase() === 'activity' || product.product_type?.type_name?.toLowerCase() === 'activities & experiences') && (
                  <>
                    {product.attributes?.duration_hours && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Duration:</span>
                        <span>{product.attributes.duration_hours} hours</span>
                      </div>
                    )}
                    {product.attributes?.meeting_point && (
                      <div>
                        <span className="font-medium">Meeting Point:</span>
                        <span className="ml-2">{product.attributes.meeting_point}</span>
                      </div>
                    )}
                    {product.attributes?.difficulty_level && (
                      <div>
                        <span className="font-medium">Difficulty:</span>
                        <span className="ml-2 capitalize">{product.attributes.difficulty_level}</span>
                      </div>
                    )}
                    {product.attributes?.inclusions && product.attributes.inclusions.length > 0 && (
                      <div className="col-span-full">
                        <span className="font-medium">Inclusions:</span>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          {product.attributes.inclusions.map((inclusion, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              {inclusion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Transfer specific attributes */}
                {(product.product_type?.type_name?.toLowerCase() === 'transfer' || product.product_type?.type_name?.toLowerCase() === 'transfers') && (
                  <>
                    {product.attributes?.vehicle_type && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span className="font-medium">Vehicle:</span>
                        <span>{product.attributes.vehicle_type}</span>
                      </div>
                    )}
                    {product.attributes?.route && (
                      <div>
                        <span className="font-medium">Route:</span>
                        <span className="ml-2">{product.attributes.route}</span>
                      </div>
                    )}
                    {product.attributes?.luggage_allowance && (
                      <div>
                        <span className="font-medium">Luggage:</span>
                        <span className="ml-2">{product.attributes.luggage_allowance}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Package specific attributes */}
                {product.product_type?.type_name?.toLowerCase() === 'package' && (
                  <>
                    {product.attributes?.package_type && (
                      <div>
                        <span className="font-medium">Package Type:</span>
                        <span className="ml-2">{product.attributes.package_type}</span>
                      </div>
                    )}
                    {product.attributes?.duration_nights && (
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2">{product.attributes.duration_nights} nights</span>
                      </div>
                    )}
                    {product.attributes?.min_guests && (
                      <div>
                        <span className="font-medium">Min Guests:</span>
                        <span className="ml-2">{product.attributes.min_guests}</span>
                      </div>
                    )}
                    {product.attributes?.max_guests && (
                      <div>
                        <span className="font-medium">Max Guests:</span>
                        <span className="ml-2">{product.attributes.max_guests}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Extras & Add-ons specific attributes */}
                {product.product_type?.type_name?.toLowerCase() === 'extras & add-ons' && (
                  <>
                    {product.attributes?.extra_category && (
                      <div>
                        <span className="font-medium">Category:</span>
                        <span className="ml-2">{product.attributes.extra_category}</span>
                      </div>
                    )}
                    {product.attributes?.description && (
                      <div className="col-span-full">
                        <span className="font-medium">Description:</span>
                        <p className="ml-2 text-sm text-muted-foreground">{product.attributes.description}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Common attributes */}
                {product.attributes?.tags && product.attributes.tags.length > 0 && (
                  <div className="col-span-full">
                    <span className="font-medium">Tags:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {product.attributes.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TagsEditor
                tags={product.tags || []}
                onChange={handleTagsUpdate}
                placeholder="Add a tag"
                maxTags={20}
              />
            </CardContent>
          </Card>

          {/* Activity Log */}
          <ActivityLog
            activities={[]} // TODO: Implement activity log data
            maxHeight="300px"
          />
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Options</CardTitle>
                <Button onClick={() => router.push(`/products/${id}/options`)}>
                  Manage Options
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {product.product_options && product.product_options.length > 0 ? (
                <div className="space-y-4">
                  {product.product_options.map((option) => (
                    <div key={option.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{option.option_name}</h4>
                          <p className="text-sm text-muted-foreground">{option.option_code}</p>
                        </div>
                        <Badge variant={option.is_active ? 'default' : 'secondary'}>
                          {option.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Standard Occupancy:</span>
                          <span className="ml-2">{option.standard_occupancy}</span>
                        </div>
                        <div>
                          <span className="font-medium">Max Occupancy:</span>
                          <span className="ml-2">{option.max_occupancy}</span>
                        </div>
                        {option.bed_configuration && (
                          <div className="col-span-2">
                            <span className="font-medium">Bed Configuration:</span>
                            <span className="ml-2">{option.bed_configuration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Product Options</h3>
                  <p className="text-muted-foreground">This product doesn't have any options yet.</p>
                  <Button 
                    onClick={() => router.push(`/products/${id}/options`)}
                    className="mt-4"
                  >
                    Add Options
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Selling Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Selling Rates</CardTitle>
            </CardHeader>
            <CardContent>
              {product.selling_rates && product.selling_rates.length > 0 ? (
                <div className="space-y-4">
                  {product.selling_rates.map((rate) => (
                    <div key={rate.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{rate.rate_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rate.valid_from} - {rate.valid_to}
                          </p>
                        </div>
                        <Badge variant={rate.is_active ? 'default' : 'secondary'}>
                          {rate.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Rate Basis:</span>
                          <span className="ml-2">{rate.rate_basis}</span>
                        </div>
                        <div>
                          <span className="font-medium">Customer Type:</span>
                          <span className="ml-2">{rate.customer_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Markup Type:</span>
                          <span className="ml-2">{rate.markup_type}</span>
                        </div>
                        <div>
                          <span className="font-medium">Markup Value:</span>
                          <span className="ml-2">{rate.markup_value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Selling Rates</h3>
                  <p className="text-muted-foreground">This product doesn't have any selling rates yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Allocations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Allocations Yet</h3>
                <p className="text-muted-foreground">
                  Contract allocations will appear here when contracts are linked to this product.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
