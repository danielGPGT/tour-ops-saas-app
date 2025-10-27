'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Trash2, 
  Package,
  MapPin, 
  Tag, 
  Building, 
  Ticket, 
  Map, 
  Car,
  Image as ImageIcon,
  Layers,
  Plus,
  Edit,
  MoreHorizontal,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/common/PageHeader'
import { ActionButtons } from '@/components/common/ActionButtons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DataTable, DataTableColumn } from '@/components/common/DataTable'
import { SideCard } from '@/components/common/SideCard'
import { DetailRow } from '@/components/common/DetailRow'
import { StatsGrid } from '@/components/common/StatsGrid'
import { Badge } from '@/components/ui/badge'
import { 
  useProduct, 
  useDeleteProduct, 
  useProductOptions 
} from '@/lib/hooks/useProducts'
import { formatDate } from '@/lib/utils/formatting'
import { 
  ProductInlineEdit, 
  ProductLocationEdit, 
  ProductAttributeEdit,
  ProductStatusEdit 
} from '@/components/products/ProductInlineEditWrapper'
import {
  ProductAttributeSelect,
  ProductAttributeNumber,
  ProductAttributeMultiSelect,
  ProductStarRatingEdit
} from '@/components/products/ProductAttributeInlineEdit'
import { ProductTagsEdit } from '@/components/products/ProductTagsEdit'
import { ProductImagesInlineEdit } from '@/components/products/ProductImagesInlineEdit'
// import { ProductOptionDialog } from '@/components/products/ProductOptionDialog' // REMOVED - Using type-specific forms
import { OptionsTable } from '@/components/product-options/OptionsTable'
import { AccommodationOptionForm } from '@/components/product-options/AccommodationOptionForm'
import { EventOptionForm } from '@/components/product-options/EventOptionForm'
import { 
  ACCOMMODATION_PROPERTY_TYPES,
  ACCOMMODATION_AMENITIES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  AGE_RESTRICTIONS_EVENT,
  ACTIVITY_DURATION_TYPES,
  ACTIVITY_DIFFICULTY_LEVELS,
  ACTIVITY_GROUP_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_SEASONALITY,
  AGE_RESTRICTIONS_ACTIVITY,
  TRANSFER_TYPES
} from '@/lib/config/product-attributes'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import type { ProductOption } from '@/lib/types/product'

// Product type icons
const getProductTypeIcon = (typeName: string) => {
  const type = typeName?.toLowerCase()
  if (type === 'accommodation' || type?.includes('hotel')) {
    return <Building className="h-4 w-4" />
  }
  if (type === 'event' || type?.includes('ticket') || type?.includes('event')) {
    return <Ticket className="h-4 w-4" />
  }
  if (type === 'activity' || type?.includes('activity') || type?.includes('experience')) {
    return <Map className="h-4 w-4" />
  }
  if (type === 'transfer' || type?.includes('transfer') || type?.includes('transport')) {
    return <Car className="h-4 w-4" />
  }
  return <Package className="h-4 w-4" />
}

// Product type color
const getProductTypeColor = (typeName: string) => {
  const type = typeName?.toLowerCase()
  if (type === 'accommodation' || type?.includes('hotel')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  }
  if (type === 'event' || type?.includes('ticket') || type?.includes('event')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
  }
  if (type === 'activity' || type?.includes('activity') || type?.includes('experience')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }
  if (type === 'transfer' || type?.includes('transfer') || type?.includes('transport')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
}

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<ProductOption[]>([])
  const [showAddOptionDialog, setShowAddOptionDialog] = useState(false)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)

  // Fetch product and options data
  const { data: product, isLoading: productLoading } = useProduct(productId)
  const { data: options = [], isLoading: optionsLoading } = useProductOptions(productId)
  const deleteProduct = useDeleteProduct()

  // Stats data - always call hooks before any returns
  const stats = useMemo(() => {
    if (!product) return []
    

    const totalOptions = options?.length || 0
    const activeOptions = options?.filter(o => o.is_active).length || 0

    return [
    {
      id: 'options',
      label: 'Product Options',
        value: totalOptions.toString(),
        icon: <Layers className="h-4 w-4" />,
        trend: {
          value: `${activeOptions} active`,
          direction: 'neutral' as const
        }
      },
    {
        id: 'updated',
        label: 'Last Updated',
        value: formatDate(product.updated_at),
        icon: <Calendar className="h-4 w-4" />
      }
    ]
  }, [options, product])

  // Define DataTable columns for product options - always define before returns
  const optionColumns: DataTableColumn<ProductOption>[] = useMemo(() => [
    {
      key: 'image',
      header: 'Image',
      width: 'w-[80px]',
      render: (item) => {
        const images = (item.attributes as any)?.images || []
        const primaryImage = images.find((img: any) => img.is_primary) || images[0]
        
        return primaryImage ? (
          <div className="w-14 h-14 rounded overflow-hidden bg-muted">
            <img 
              src={primaryImage.url} 
              alt={primaryImage.alt || 'Option'} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
        )
      }
    },
    {
      key: 'option_name',
      header: 'Option Name',
      width: 'w-[250px]',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium">{item.option_name}</span>
          <span className="text-xs text-muted-foreground">{item.option_code}</span>
      </div>
    )
    },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <span className="text-sm line-clamp-2">{item.description || '—'}</span>
      )
    },
    // NOTE: Pricing columns removed - pricing is now managed through supplier_rates and selling_rates
    // TODO: Add columns to display rates from supplier_rates and selling_rates tables
    {
      key: 'is_active',
      header: 'Status',
      width: 'w-[100px]',
      render: (item) => (
        <div className="flex justify-center">
          {item.is_active ? (
            <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 'w-[100px]',
      render: (item) => (
        <div className="flex justify-end gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Open edit dialog
            }}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              // TODO: Open more options
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ], [])

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct.mutateAsync(productId)
      router.push('/products')
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  // Loading state - moved after all hooks
  if (productLoading) {
    return <PageSkeleton />
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-2">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Product not found</h2>
        <Button onClick={() => router.push('/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>
    )
  }

  const { product_type, location, attributes } = product

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <ProductInlineEdit
                product={product}
                field="name"
                label="Product Name"
                placeholder="Enter product name"
                className="text-2xl font-bold"
                emptyValue="Unnamed Product"
                size="sm"
              />
              
              {/* Product Type Badge */}
              {product_type && (
                <Badge>
                  <span className="flex items-center gap-1">
                    {getProductTypeIcon(product_type.type_name)}
                    {product_type.type_name}
                  </span>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium">Code:</span>
                <ProductInlineEdit
                  product={product}
                  field="code"
                  label="Product Code"
                  placeholder="Enter product code"
                  className="text-muted-foreground font-mono text-xs"
                  emptyValue="No code"
                  size="sm"
                  variant="minimal"
                />
              </div>
              
              {location?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location.city}, {location.country}</span>
                </div>
              )}
              
              <ProductStatusEdit product={product} />
            </div>
          </div>
        }
        backButton={{
          onClick: () => router.back(),
          label: "Back"
        }}
        actions={
          <ActionButtons
            onDelete={() => setShowDeleteDialog(true)}
            onDuplicate={() => {
              console.log("Duplicate product")
            }}
            onExport={() => {
              console.log("Export product data")
            }}
            onShare={() => {
              console.log("Share product")
            }}
            showEdit={false}
            showDelete={true}
            showDuplicate={true}
            showExport={true}
            showShare={true}
            size="sm"
            variant="compact"
          />
        }
      />

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Main Layout: Content + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        {/* Main Content Area */}
        <div className="space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="selling-rates">Selling Rates</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
        </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <div className="text-4xl mb-2">📊</div>
                  <h3 className="text-lg font-medium">Product Overview</h3>
                  <p className="text-sm">General product information and details</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="options" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Product Options
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Manage room types, ticket categories, and product variants
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddOptionDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>

                <OptionsTable
                  options={options as any}
                  productType={product.product_type?.type_name?.toLowerCase() || 'accommodation'}
                  onEdit={(option) => setEditingOption(option as any)}
                  />
                </div>
            </TabsContent>
            
            <TabsContent value="selling-rates" className="space-y-4">
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <div className="text-4xl mb-2">💰</div>
                  <h3 className="text-lg font-medium">Selling Rates</h3>
                  <p className="text-sm">Customer-facing pricing and rates</p>
                  </div>
                </div>
            </TabsContent>
            
            <TabsContent value="allocations" className="space-y-4">
              <div className="text-center py-8">
                <div className="text-muted-foreground">
                  <div className="text-4xl mb-2">📦</div>
                  <h3 className="text-lg font-medium">Contract Allocations</h3>
                  <p className="text-sm">Inventory and allocation management</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 h-fit">
          <SideCard
            sections={[
              // General Information Section
              {
                id: 'general-info',
                title: 'General Information',
                icon: <Package className="h-4 w-4" />,
                defaultOpen: true,
                content: (
                  <div className="space-y-2.5">
                    <DetailRow
                      label="Product Name"
                      value={
                        <ProductInlineEdit
                          product={product}
                          field="name"
                          label="Product Name"
                          placeholder="Enter product name"
                          className="text-sm font-medium"
                          emptyValue="No name"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />
                    
                    <DetailRow
                      label="Product Code"
                      value={
                        <ProductInlineEdit
                          product={product}
                          field="code"
                          label="Product Code"
                    placeholder="Enter product code"
                          className="text-sm font-medium font-mono"
                          emptyValue="No code"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />
                    
                    <DetailRow
                      label="Description"
                      value={
                        <ProductInlineEdit
                          product={product}
                          field="description"
                          label="Description"
                    placeholder="Enter product description"
                          className="text-sm"
                          multiline
                          emptyValue="No description"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />

                    

                    
                    <DetailRow
                      label="City"
                      value={
                        <ProductLocationEdit
                          product={product}
                          field="location"
                          nestedField="city"
                          label="City"
                    placeholder="Enter city"
                          className="text-sm font-medium"
                          emptyValue="Not specified"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />
                    
                    <DetailRow
                      label="Country"
                      value={
                        <ProductLocationEdit
                          product={product}
                          field="location"
                          nestedField="country"
                          label="Country"
                    placeholder="Enter country"
                          className="text-sm font-medium"
                          emptyValue="Not specified"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />
                    
                    <DetailRow
                      label="Address"
                      value={
                        <ProductLocationEdit
                          product={product}
                          field="location"
                          nestedField="address"
                          label="Address"
                          placeholder="Enter full address"
                          className="text-sm"
                          multiline
                          emptyValue="No address"
                          size="sm"
                          variant="underline"
                        />
                      }
                      variant="compact"
                    />
                  </div>
                )
              },
              
              // Product Details & Tags Section
              {
                id: 'product-details',
                title: 'Product Details',
                icon: getProductTypeIcon(product_type?.type_name || ''),
                defaultOpen: true,
                content: (
                  <div className="space-y-3">
                    {/* Tags */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1.5">Tags</div>
                      <ProductTagsEdit product={product} />
          </div>

                    {/* Attributes */}
                    {attributes && Object.keys(attributes).length > 0 && (
                      <>
                        <div className="border-t border-border"></div>
                        
                        <div className="space-y-2.5">
                          {/* Accommodation Attributes */}
                          {(product_type?.type_name?.toLowerCase() === 'accommodation' || product_type?.type_name?.toLowerCase().includes('hotel')) && (
                            <>
                              <DetailRow
                                label="Star Rating"
                                value={
                                  <ProductStarRatingEdit
                                    product={product}
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Property Type"
                                value={
                                  <ProductAttributeSelect
                                    product={product}
                                    attributeField="property_type"
                                    label="Property Type"
                                    options={ACCOMMODATION_PROPERTY_TYPES}
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Check-in"
                                value={
                                  <ProductAttributeEdit
                                    product={product}
                                    field="attributes"
                                    nestedField="check_in_time"
                                    label="Check-in Time"
                                    placeholder="e.g., 14:00"
                                    className="text-sm"
                                    emptyValue="Not set"
                                    size="sm"
                                    variant="underline"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Check-out"
                                value={
                                  <ProductAttributeEdit
                                    product={product}
                                    field="attributes"
                                    nestedField="check_out_time"
                                    label="Check-out Time"
                                    placeholder="e.g., 11:00"
                                    className="text-sm"
                                    emptyValue="Not set"
                                    size="sm"
                                    variant="underline"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Amenities"
                                value={
                                  <ProductAttributeMultiSelect
                                    product={product}
                                    attributeField="amenities"
                                    label="Amenities"
                                    options={ACCOMMODATION_AMENITIES}
                                    emptyValue="None selected"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                  </>
                )}

                          {/* Event/Tickets Attributes */}
                          {(product_type?.type_name?.toLowerCase() === 'event' || product_type?.type_name?.toLowerCase().includes('ticket')) && (
                            <>
                              <DetailRow
                                label="Event Name"
                                value={
                                  <ProductAttributeEdit
                                    product={product}
                                    field="attributes"
                                    nestedField="event_name"
                                    label="Event Name"
                                    placeholder="Enter event name"
                                    className="text-sm"
                                    emptyValue="Not set"
                                    size="sm"
                                    variant="underline"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Category"
                                value={
                                  <ProductAttributeSelect
                                    product={product}
                                    attributeField="event_category"
                                    label="Event Category"
                                    options={EVENT_CATEGORIES}
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Event Status"
                                value={
                                  <ProductAttributeSelect
                                    product={product}
                                    attributeField="event_status"
                                    label="Event Status"
                                    options={EVENT_STATUSES}
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                  </>
                )}

                          {/* Activity Attributes */}
                          {(product_type?.type_name?.toLowerCase() === 'activity' || product_type?.type_name?.toLowerCase().includes('activity')) && (
                            <>
                              <DetailRow
                                label="Duration"
                                value={
                                  <ProductAttributeNumber
                                    product={product}
                                    attributeField="duration_hours"
                                    label="Duration (hours)"
                                    min={0}
                                    max={240}
                                    step={0.5}
                                    suffix="hours"
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Difficulty"
                                value={
                                  <ProductAttributeSelect
                                    product={product}
                                    attributeField="difficulty_level"
                                    label="Difficulty Level"
                                    options={ACTIVITY_DIFFICULTY_LEVELS}
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                              
                              <DetailRow
                                label="Group Type"
                                value={
                                  <ProductAttributeSelect
                                    product={product}
                                    attributeField="group_type"
                                    label="Group Type"
                                    options={ACTIVITY_GROUP_TYPES}
                                    emptyValue="Not set"
                                    size="sm"
                                  />
                                }
                                variant="compact"
                              />
                  </>
                )}

                          {/* Transfer Attributes */}
                          {(product_type?.type_name?.toLowerCase() === 'transfer' || product_type?.type_name?.toLowerCase().includes('transfer')) && (
                            <DetailRow
                              label="Transfer Type"
                              value={
                                <ProductAttributeSelect
                                  product={product}
                                  attributeField="transfer_type"
                                  label="Transfer Type"
                                  options={TRANSFER_TYPES}
                                  emptyValue="Not set"
                                  size="sm"
                                />
                              }
                              variant="compact"
                            />
                )}
                      </div>
                  </>
                )}
                      </div>
                )
              },
              
              // Images Section
              {
                id: 'images',
                title: 'Images',
                icon: <ImageIcon className="h-4 w-4" />,
                defaultOpen: true,
                content: <ProductImagesInlineEdit product={product} />
              }
            ]}
          />
                    </div>
                  </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Product"
        description={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteProduct}
        variant="destructive"
      />

      {/* Add Product Option Dialog - REMOVED - Using type-specific forms instead */}

      {/* Type-specific option forms */}
      {product.product_type?.type_name?.toLowerCase() === 'accommodation' && (
        <AccommodationOptionForm
          open={showAddOptionDialog || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddOptionDialog(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption as any}
        />
      )}
      
      {product.product_type?.type_name?.toLowerCase() === 'event' && (
        <EventOptionForm
          open={showAddOptionDialog || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddOptionDialog(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption as any}
        />
      )}
    </div>
  )
}
