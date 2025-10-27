'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, Edit, Trash2, Copy, MoreVertical, 
  Plus, DollarSign, ShoppingCart, TrendingUp, Activity,
  Hotel, Ticket, Car, Package, Info, Image as ImageIcon
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { DetailRow } from '@/components/common/DetailRow'
import { InlineEdit } from '@/components/common/InlineEdit'
import { SideCard } from '@/components/common/SideCard'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InlineDropdown } from '@/components/common/InlineDropdown'
import { ProductOptionImagesInlineEdit } from '@/components/products/ProductOptionImagesInlineEdit'
import { Checkbox } from '@/components/ui/checkbox'
import { ProductOptionSellingRatesManager } from '@/components/products/ProductOptionSellingRatesManager'
import { useProductOption, useUpdateProductOption } from '@/lib/hooks/useProductOptions'
import { useProduct } from '@/lib/hooks/useProducts'
import { formatDate } from '@/lib/utils/formatting'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Separator } from '@/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ActionButtons } from '@/components/common/ActionButtons'
import { InlineEditHint } from '@/components/common/InlineEditHint'
import { StatsGrid } from '@/components/common/StatsGrid'

export default function ProductOptionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const optionId = params.optionId as string
  const productId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')

  const { data: option, isLoading: isLoadingOption } = useProductOption(optionId)
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId)
  const updateOption = useUpdateProductOption()

  // Helper function to update attributes
  const updateAttribute = async (field: string, value: any) => {
    const currentAttributes = option?.attributes || {}
    const newAttributes = {
      ...currentAttributes,
      [field]: value
    }
    await updateOption.mutateAsync({
      id: option!.id,
      data: { attributes: newAttributes }
    })
  }

  // Helper function to update nested attributes
  const updateNestedAttribute = async (parent: string, field: string, value: any) => {
    const currentAttributes = option?.attributes || {}
    const current = currentAttributes[parent] || {}
    const newAttributes = {
      ...currentAttributes,
      [parent]: { ...current, [field]: value }
    }
    await updateOption.mutateAsync({
      id: option!.id,
      data: { attributes: newAttributes }
    })
  }

  // Helper function to update images in attributes
  const updateImages = async (newImages: any[]) => {
    await updateAttribute('images', newImages)
  }

  if (isLoadingOption || isLoadingProduct) {
    return <PageSkeleton />
  }

  if (!option) {
    return (
      <div className="text-center py-12">
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="Product Option Not Found"
          description="The product option you're looking for doesn't exist."
          action={{
            label: 'Back to Product',
            onClick: () => router.push(`/products/${productId}`),
            icon: <ArrowLeft className="h-4 w-4 mr-2" />
          }}
        />
      </div>
    )
  }

  const attributes = option.attributes as any
  
  // Determine product type from product type ID
  const productTypeId = product?.product_type_id
  
  // Fallback to inferring from attributes if product type is not available
  let productType = 'unknown'
  if (attributes?.room_type) {
    productType = 'accommodation'
  } else if (attributes?.ticket_type) {
    productType = 'event_tickets'
  } else if (attributes?.vehicle_type && attributes?.capacity) {
    productType = 'transfer'
  } else if (attributes?.service_class) {
    productType = 'transport'
  } else if (attributes?.duration_hours) {
    productType = 'experience'
  } else if (attributes?.access_type) {
    productType = 'extra'
  }
  
  // Type-specific icon mapping
  const typeIcons = {
    accommodation: Hotel,
    event_tickets: Ticket,
    transfer: Car,
    transport: Car,
    experience: Info,
    extra: Package
  }
  const TypeIcon = typeIcons[productType as keyof typeof typeIcons] || Package

  // Stats data (mock for now - would come from API)
  const stats = {
    totalRevenue: 45250,
    totalBookings: 23,
    avgBooking: 1967,
    utilizationRate: 87
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {option.option_name}
                </span>
                <StatusBadge 
                  status={option.is_active ? 'active' : 'inactive'}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {option.option_code}
              </p>
              {product && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Part of: <a href={`/products/${product.id}`} className="text-primary hover:underline">{product.name}</a>
                </p>
              )}
             </div>
           </div>
         }
         subtitle={`Product option for ${product?.name || 'product'}`}
        actions={
          <div className="flex items-center gap-2">
            <InlineEditHint />
            <ActionButtons
              onDelete={() => {/* TODO: Implement delete */}}
              onDuplicate={() => {/* TODO: Implement duplicate */}}
              onExport={() => {/* TODO: Implement export */}}
              onShare={() => {/* TODO: Implement share */}}
              variant="compact"
              showEdit={false}
              showDelete={true}
              showDuplicate={true}
              showExport={true}
              showShare={true}
            />
          </div>
        }
        backButton={{
          onClick: () => router.push(`/products/${productId}/options`),
          label: 'Back to Options'
        }}
      />

      {/* Stats Grid */}
      <StatsGrid
        columns={4}
        stats={[
          {
            id: 'total-revenue',
            label: 'Total Revenue',
            value: `£${stats.totalRevenue.toLocaleString()}`,
            description: 'All time',
            icon: <DollarSign className="h-4 w-4" />
          },
          {
            id: 'total-bookings',
            label: 'Total Bookings',
            value: stats.totalBookings,
            description: 'Confirmed',
            icon: <ShoppingCart className="h-4 w-4" />
          },
          {
            id: 'avg-booking',
            label: 'Avg. Booking',
            value: `£${stats.avgBooking.toLocaleString()}`,
            description: 'Per booking',
            icon: <TrendingUp className="h-4 w-4" />
          },
          {
            id: 'utilization',
            label: 'Utilization',
            value: `${stats.utilizationRate}%`,
            description: 'Last 30 days',
            icon: <Activity className="h-4 w-4" />
          }
        ]}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="selling-rates">Selling Rates</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Option Name</label>
                    <InlineEdit
                      value={option.option_name}
                      onSave={async (value) => {
                        await updateOption.mutateAsync({
                          id: option.id,
                          data: { option_name: value }
                        })
                      }}
                      placeholder="Enter option name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Option Code</label>
                    <InlineEdit
                      value={option.option_code}
                      onSave={async (value) => {
                        await updateOption.mutateAsync({
                          id: option.id,
                          data: { option_code: value }
                        })
                      }}
                      placeholder="Enter option code"
                      validation={(value) => {
                        if (!value || value.trim().length < 2) {
                          return 'Option code must be at least 2 characters'
                        }
                        return null
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <InlineEdit
                      value={option.description || ''}
                      onSave={async (value) => {
                        await updateOption.mutateAsync({
                          id: option.id,
                          data: { description: value || undefined }
                        })
                      }}
                      placeholder="Enter description"
                      multiline
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <StatusBadge status={option.is_active ? 'active' : 'inactive'} />
                  </div>
                  <Separator />
                  <DetailRow label="Created" value={formatDate(option.created_at)} />
                  <DetailRow label="Last Updated" value={formatDate(option.updated_at)} />
                </CardContent>
              </Card>

              {/* Type-Specific Attributes */}
              {/* Accommodation */}
              {productType === 'accommodation' && attributes && (
                 <Card>
                   <CardHeader>
                     <div className="flex items-center gap-2">
                       <TypeIcon className="h-5 w-5" />
                       <CardTitle>Accommodation Details</CardTitle>
                     </div>
                     <CardDescription>Room configuration and specifications</CardDescription>
                   </CardHeader>
                                     <CardContent className="space-y-4">
                     <div>
                       <label className="text-sm font-medium mb-2 block">Room Type</label>
                       <InlineDropdown
                         value={attributes.room_type || ''}
                         onValueChange={(value) => updateAttribute('room_type', value)}
                         options={[
                           { value: 'standard', label: 'Standard' },
                           { value: 'deluxe', label: 'Deluxe' },
                           { value: 'suite', label: 'Suite' },
                           { value: 'junior_suite', label: 'Junior Suite' }
                         ]}
                         placeholder="Select room type"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium mb-2 block">View Type</label>
                       <InlineDropdown
                         value={attributes.view_type || ''}
                         onValueChange={(value) => updateAttribute('view_type', value)}
                         options={[
                           { value: 'city', label: 'City View' },
                           { value: 'sea', label: 'Sea View' },
                           { value: 'garden', label: 'Garden View' },
                           { value: 'partial_sea', label: 'Partial Sea View' }
                         ]}
                         placeholder="Select view type"
                       />
                     </div>
                     
                                         <Separator />
                     <div>
                       <p className="text-sm font-medium mb-3">Bed Configurations Available</p>
                       <div className="space-y-2">
                         {['twin', 'double', 'queen', 'king'].map((bedType) => {
                           const isChecked = attributes.bed_configurations_available?.includes(bedType) || false
                           return (
                             <div key={bedType} className="flex items-center space-x-2">
                               <Checkbox
                                 id={`bed-${bedType}`}
                                 checked={isChecked}
                                 onCheckedChange={(checked) => {
                                   const currentBeds = attributes.bed_configurations_available || []
                                   const newBeds = checked
                                     ? [...currentBeds, bedType]
                                     : currentBeds.filter((bed: string) => bed !== bedType)
                                   updateAttribute('bed_configurations_available', newBeds)
                                 }}
                               />
                               <label
                                 htmlFor={`bed-${bedType}`}
                                 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                               >
                                 {bedType}
                               </label>
                             </div>
                           )
                         })}
                       </div>
                     </div>
                     <Separator />
                     <div>
                       <label className="text-sm font-medium mb-2 block">Default Bed Configuration</label>
                       <InlineDropdown
                         value={attributes.default_bed_configuration || ''}
                         onValueChange={(value) => updateAttribute('default_bed_configuration', value)}
                         options={[
                           { value: 'twin', label: 'Twin' },
                           { value: 'double', label: 'Double' },
                           { value: 'queen', label: 'Queen' },
                           { value: 'king', label: 'King' }
                         ]}
                         placeholder="Select default bed"
                       />
                     </div>
                                         <Separator />
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-sm font-medium mb-2 block">Standard Occupancy</label>
                         <InlineEdit
                           value={attributes.standard_occupancy?.toString() || ''}
                           onSave={async (value) => {
                             const numValue = value ? parseInt(value) : undefined
                             await updateAttribute('standard_occupancy', numValue)
                           }}
                           placeholder="Enter occupancy"
                           validation={(value) => {
                             if (value && (isNaN(parseInt(value)) || parseInt(value) < 1)) {
                               return 'Please enter a valid number (min 1)'
                             }
                             return null
                           }}
                         />
                       </div>
                       <div>
                         <label className="text-sm font-medium mb-2 block">Max Occupancy</label>
                         <InlineEdit
                           value={attributes.max_occupancy?.toString() || ''}
                           onSave={async (value) => {
                             const numValue = value ? parseInt(value) : undefined
                             await updateAttribute('max_occupancy', numValue)
                           }}
                           placeholder="Enter max occupancy"
                           validation={(value) => {
                             if (value && (isNaN(parseInt(value)) || parseInt(value) < 1)) {
                               return 'Please enter a valid number (min 1)'
                             }
                             return null
                           }}
                         />
                       </div>
                     </div>
                  </CardContent>
                </Card>
              )}

              {/* Event Tickets */}
              {productType === 'event_tickets' && attributes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle>Event Ticket Details</CardTitle>
                    </div>
                    <CardDescription>Ticket type and configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ticket Type</label>
                      <InlineDropdown
                        value={attributes.ticket_type || ''}
                        onValueChange={(value) => updateAttribute('ticket_type', value)}
                        options={[
                          { value: '3_day_pass', label: '3 Day Pass' },
                          { value: '2_day_pass', label: '2 Day Pass' },
                          { value: 'single_day', label: 'Single Day' },
                          { value: 'weekend', label: 'Weekend' }
                        ]}
                        placeholder="Select ticket type"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Age Category</label>
                      <InlineDropdown
                        value={attributes.age_category || ''}
                        onValueChange={(value) => updateAttribute('age_category', value)}
                        options={[
                          { value: 'adult', label: 'Adult' },
                          { value: 'child', label: 'Child' },
                          { value: 'senior', label: 'Senior' }
                        ]}
                        placeholder="Select age category"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transfers */}
              {productType === 'transfer' && attributes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle>Transfer Details</CardTitle>
                    </div>
                    <CardDescription>Vehicle and capacity specifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Vehicle Type</label>
                      <InlineEdit
                        value={attributes.vehicle_type || ''}
                        onSave={async (value) => await updateAttribute('vehicle_type', value)}
                        placeholder="e.g., Standard Car"
                      />
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Passenger Capacity</label>
                        <InlineEdit
                          value={attributes.capacity?.passengers?.toString() || ''}
                          onSave={async (value) => {
                            const currentCapacity = attributes.capacity || {}
                            await updateAttribute('capacity', {
                              ...currentCapacity,
                              passengers: value ? parseInt(value) : undefined
                            })
                          }}
                          placeholder="Enter capacity"
                          validation={(value) => {
                            if (value && (isNaN(parseInt(value)) || parseInt(value) < 1)) {
                              return 'Please enter a valid number (min 1)'
                            }
                            return null
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Luggage Capacity (Large)</label>
                        <InlineEdit
                          value={attributes.capacity?.luggage_large?.toString() || ''}
                          onSave={async (value) => {
                            const currentCapacity = attributes.capacity || {}
                            await updateAttribute('capacity', {
                              ...currentCapacity,
                              luggage_large: value ? parseInt(value) : undefined
                            })
                          }}
                          placeholder="Enter luggage"
                          validation={(value) => {
                            if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                              return 'Please enter a valid number'
                            }
                            return null
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transport */}
              {productType === 'transport' && attributes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle>Transport Details</CardTitle>
                    </div>
                    <CardDescription>Service class and ticket options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Service Class</label>
                      <InlineDropdown
                        value={attributes.service_class || ''}
                        onValueChange={(value) => updateAttribute('service_class', value)}
                        options={[
                          { value: 'economy', label: 'Economy' },
                          { value: 'business', label: 'Business' },
                          { value: 'first', label: 'First Class' }
                        ]}
                        placeholder="Select class"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Ticket Flexibility</label>
                      <InlineDropdown
                        value={attributes.ticket_flexibility || ''}
                        onValueChange={(value) => updateAttribute('ticket_flexibility', value)}
                        options={[
                          { value: 'flexible', label: 'Flexible' },
                          { value: 'semi_flexible', label: 'Semi-Flexible' },
                          { value: 'non_refundable', label: 'Non-Refundable' }
                        ]}
                        placeholder="Select flexibility"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Experiences */}
              {productType === 'experience' && attributes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle>Experience Details</CardTitle>
                    </div>
                    <CardDescription>Duration and capacity information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duration (hours)</label>
                      <InlineEdit
                        value={attributes.duration_hours?.toString() || ''}
                        onSave={async (value) => await updateAttribute('duration_hours', value ? parseInt(value) : undefined)}
                        placeholder="Enter duration"
                        validation={(value) => {
                          if (value && (isNaN(parseInt(value)) || parseInt(value) < 0.5)) {
                            return 'Please enter a valid duration (min 0.5 hours)'
                          }
                          return null
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Option Type</label>
                      <InlineEdit
                        value={attributes.option_type || ''}
                        onSave={async (value) => await updateAttribute('option_type', value)}
                        placeholder="e.g., Duration"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Max Guests</label>
                      <InlineEdit
                        value={attributes.capacity_details?.max_guests?.toString() || ''}
                        onSave={async (value) => {
                          const currentCapacity = attributes.capacity_details || {}
                          await updateAttribute('capacity_details', {
                            ...currentCapacity,
                            max_guests: value ? parseInt(value) : undefined
                          })
                        }}
                        placeholder="Enter max guests"
                        validation={(value) => {
                          if (value && (isNaN(parseInt(value)) || parseInt(value) < 1)) {
                            return 'Please enter a valid number (min 1)'
                          }
                          return null
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Extras */}
              {productType === 'extra' && attributes && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-5 w-5" />
                      <CardTitle>Extra Details</CardTitle>
                    </div>
                    <CardDescription>Access type and visit configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Access Type</label>
                      <InlineDropdown
                        value={attributes.access_type || ''}
                        onValueChange={(value) => updateAttribute('access_type', value)}
                        options={[
                          { value: 'departure', label: 'Departure' },
                          { value: 'arrival', label: 'Arrival' },
                          { value: 'both', label: 'Both' }
                        ]}
                        placeholder="Select access type"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Visit Count</label>
                      <InlineDropdown
                        value={attributes.visit_count || ''}
                        onValueChange={(value) => updateAttribute('visit_count', value)}
                        options={[
                          { value: 'single', label: 'Single' },
                          { value: 'multiple', label: 'Multiple' }
                        ]}
                        placeholder="Select visit count"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

                             {/* Images */}
               <Card>
                 <CardHeader>
                   <div className="flex items-center gap-2">
                     <ImageIcon className="h-5 w-5" />
                     <CardTitle>Option Images</CardTitle>
                   </div>
                   <CardDescription>Manage images for this product option</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <ProductOptionImagesInlineEdit
                     images={attributes?.images || []}
                     onImagesChange={updateImages}
                     productId={product?.id || ''}
                   />
                 </CardContent>
               </Card>

              {/* General Attributes */}
              {attributes && Object.keys(attributes).length > 0 && (() => {
                // Filter out already displayed fields and images
                const displayedFields = [
                  'room_type', 'view_type', 'room_size_sqm', 'bed_configurations_available', 'max_occupancy', 
                  'standard_occupancy', 'default_bed_configuration', 'images', 'ticket_type', 'age_category',
                  'vehicle_type', 'capacity', 'service_class', 'ticket_flexibility', 'duration_hours',
                  'option_type', 'capacity_details', 'access_type', 'visit_count'
                ]
                const filteredEntries = Object.entries(attributes).filter(([key]) => {
                  return !displayedFields.includes(key)
                })
                
                if (filteredEntries.length === 0) return null
                
                return (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Attributes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredEntries.map(([key, value]) => (
                          <DetailRow
                            key={key}
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            value={
                              Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-2">
                                  {(value as string[]).map((v, idx) => (
                                    <Badge key={idx} variant="secondary">{String(v)}</Badge>
                                  ))}
                                </div>
                              ) : typeof value === 'object' && value !== null ? (
                                <pre className="text-sm">{JSON.stringify(value, null, 2)}</pre>
                              ) : (
                                String(value)
                              )
                            }
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Option
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                  <Separator />
                  <Button variant="outline" className="w-full text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DetailRow label="Product ID" value={option.product_id} />
                  <DetailRow label="Option ID" value={option.id} />
                  {option.sort_order !== undefined && (
                    <DetailRow label="Sort Order" value={option.sort_order.toString()} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Selling Rates Tab */}
        <TabsContent value="selling-rates" className="space-y-6">
          {product && (
            <ProductOptionSellingRatesManager
              productId={productId}
              productOption={option}
              productType={product?.product_type_id}
              product={product}
            />
          )}
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Availability Management</h3>
              <p className="text-sm text-muted-foreground">
                Control inventory and allocations for this product option
              </p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Allocation
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Total Inventory</CardTitle>
              <CardDescription>
                Simple inventory management for this product option
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Availability management coming soon. Configure inventory, date-specific availability, and allocations.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Recent Bookings</h3>
              <p className="text-sm text-muted-foreground">
                All bookings for this product option
              </p>
            </div>
          </div>

          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            title="No bookings yet"
            description="Once customers book this product option, their bookings will appear here"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
