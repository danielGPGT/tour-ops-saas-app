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
import { useProduct, useDeleteProduct } from '@/lib/hooks/useProducts'
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

  const getProductTypeIcon = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'hotel':
        return <Star className="h-5 w-5" />
      case 'event_ticket':
        return <Ticket className="h-5 w-5" />
      case 'tour':
        return <Clock className="h-5 w-5" />
      case 'transfer':
        return <Car className="h-5 w-5" />
      default:
        return <Package className="h-5 w-5" />
    }
  }

  const getProductTypeColor = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800'
      case 'event_ticket':
        return 'bg-purple-100 text-purple-800'
      case 'tour':
        return 'bg-green-100 text-green-800'
      case 'transfer':
        return 'bg-orange-100 text-orange-800'
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
          <TabsTrigger value="seo">SEO</TabsTrigger>
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
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Name</span>
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Code</span>
                  <span className="text-sm">{product.code}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Product Type</span>
                  <div className="flex items-center gap-2">
                    {getProductTypeIcon(product.product_type?.name || '')}
                    <Badge className={getProductTypeColor(product.product_type?.name || '')}>
                      {product.product_type?.name || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <Badge className={product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
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
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Address</span>
                  <span className="text-sm">{product.location?.address || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">City</span>
                  <span className="text-sm">{product.location?.city || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Country</span>
                  <span className="text-sm">{product.location?.country || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Postal Code</span>
                  <span className="text-sm">{product.location?.postal_code || 'Not specified'}</span>
                </div>
                {product.location?.venue_name && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-muted-foreground">Venue</span>
                    <span className="text-sm">{product.location.venue_name}</span>
                  </div>
                )}
              </div>
            </InfoCard>
          </div>

          {/* Product Attributes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getProductTypeIcon(product.product_type?.name || '')}
                Product Attributes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Hotel specific attributes */}
                {product.product_type?.name?.toLowerCase() === 'hotel' && (
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
                {product.product_type?.name?.toLowerCase() === 'event_ticket' && (
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

                {/* Tour specific attributes */}
                {product.product_type?.name?.toLowerCase() === 'tour' && (
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
                {product.product_type?.name?.toLowerCase() === 'transfer' && (
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

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="font-medium">SEO Title:</span>
                <p className="text-muted-foreground mt-1">
                  {product.attributes?.seo_title || 'Not set'}
                </p>
              </div>
              <div>
                <span className="font-medium">SEO Description:</span>
                <p className="text-muted-foreground mt-1">
                  {product.attributes?.seo_description || 'Not set'}
                </p>
              </div>
              <div>
                <span className="font-medium">URL Slug:</span>
                <p className="text-muted-foreground mt-1">
                  {product.attributes?.slug || 'Not set'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
