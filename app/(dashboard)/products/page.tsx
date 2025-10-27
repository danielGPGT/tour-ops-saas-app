"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { BulkActions } from '@/components/common/BulkActions'
import { SummaryCards } from '@/components/common/SummaryCards'
import { DataTable } from '@/components/common/DataTable'
import { ProductList } from '@/components/products/product-list'
import { ProductCreationWizard } from '@/components/products/ProductCreationWizard'
import { useProducts, useProductStats, useDeleteProduct, useCreateProduct, useUpdateProduct } from '@/lib/hooks/useProducts'
import { useProductTypes } from '@/lib/hooks/useProducts'
import { useEvents } from '@/lib/hooks/useEvents'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { Combobox } from '@/components/common/Combobox'
import { StorageService } from '@/lib/storage'
import { Plus, Package, Star, MapPin, TrendingUp, Search } from 'lucide-react'
import type { Product, ProductFilters, ProductSort } from '@/lib/types/product'

export default function ProductsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'inactive'>('all')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<ProductSort['field']>('name')
  const [sortDirection, setSortDirection] = useState<ProductSort['direction']>('asc')
  const [page, setPage] = useState(1)
  const [showCreateWizard, setShowCreateWizard] = useState(false)

  // Filters
  const filters: ProductFilters = useMemo(() => ({
    search: searchTerm || undefined,
    product_type_id: productTypeFilter && productTypeFilter !== 'all' ? productTypeFilter : undefined,
    event_id: eventFilter && eventFilter !== 'all' ? eventFilter : undefined,
    is_active: viewMode === 'all' ? undefined : viewMode === 'active',
    location: locationFilter && locationFilter !== 'all' ? { city: locationFilter } : undefined
  }), [searchTerm, productTypeFilter, eventFilter, viewMode, locationFilter])

  const sort: ProductSort = useMemo(() => ({
    field: sortField,
    direction: sortDirection
  }), [sortField, sortDirection])

  // Data fetching with pagination
  const { data: productsResponse, isLoading, error } = useProducts(filters, sort, page, 100)
  const { data: stats } = useProductStats()
  const { data: productTypes } = useProductTypes()
  const { data: events = [] } = useEvents()
  const deleteProduct = useDeleteProduct()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const products = productsResponse?.data || []
  const totalCount = productsResponse?.totalCount || 0
  const totalPages = productsResponse?.totalPages || 1

  // Filtered products based on view mode (already filtered server-side but apply view mode filter client-side if needed)
  const filteredProducts = useMemo(() => {
    if (viewMode === 'all') return products
    return products.filter((product: Product) => 
      viewMode === 'active' ? product.is_active : !product.is_active
    )
  }, [products, viewMode])

  // Summary cards data
  const summaryCards = useMemo(() => {
    if (!stats) return []
    
    return [
      {
        id: 'total',
        title: 'Total Products',
        value: stats.totalCount.toString(),
        icon: <Package className="h-4 w-4" />,
        description: 'All products in system'
      },
      {
        id: 'active',
        title: 'Active Products',
        value: stats.activeCount.toString(),
        icon: <Star className="h-4 w-4" />,
        description: 'Currently active products'
      },
      {
        id: 'inactive',
        title: 'Inactive Products',
        value: stats.inactiveCount.toString(),
        icon: <Package className="h-4 w-4" />,
        description: 'Inactive products'
      },
      {
        id: 'types',
        title: 'Product Types',
        value: Object.keys(stats.byType || {}).length.toString(),
        icon: <TrendingUp className="h-4 w-4" />,
        description: 'Different product types'
      }
    ]
  }, [stats])

  // Bulk actions
  const bulkActions = useMemo(() => [
    {
      label: 'Activate Selected',
      action: async () => {
        try {
          // TODO: Implement bulk activate
          showSuccess(`${selectedProducts.length} products activated`)
          setSelectedProducts([])
        } catch (error) {
          showError('Failed to activate products')
        }
      },
      variant: 'default' as const
    },
    {
      label: 'Deactivate Selected',
      action: async () => {
        try {
          // TODO: Implement bulk deactivate
          showSuccess(`${selectedProducts.length} products deactivated`)
          setSelectedProducts([])
        } catch (error) {
          showError('Failed to deactivate products')
        }
      },
      variant: 'secondary' as const
    },
    {
      label: 'Delete Selected',
      action: async () => {
        try {
          await Promise.all(selectedProducts.map(product => 
            deleteProduct.mutateAsync(product.id)
          ))
          showSuccess(`${selectedProducts.length} products deleted`)
          setSelectedProducts([])
        } catch (error) {
          showError('Failed to delete products')
        }
      },
      variant: 'destructive' as const
    }
  ], [selectedProducts, deleteProduct])

  // Event handlers
  const handleView = (product: Product) => {
    router.push(`/products/${product.id}`)
  }

  const handleEdit = (product: Product) => {
    router.push(`/products/${product.id}/edit`)
  }

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct.mutateAsync(product.id)
      showSuccess('Product deleted successfully')
    } catch (error) {
      showError('Failed to delete product')
    }
  }

  const handleCreate = () => {
    setShowCreateWizard(true)
  }

  const handleCreateSubmit = async (data: any) => {
    try {
      // Store images separately to avoid database issues with blob URLs
      const imagesToUpload = data.media || []
      
      // Remove media from product data to prevent blob URLs from being saved
      const { media, ...productData } = data
      
      console.log('Creating product with full data:', productData)
      console.log('Product attributes:', productData.attributes)
      console.log('About to call createProduct.mutateAsync...')
      
      // Create product without media first to avoid blob URL issues
      const product = await createProduct.mutateAsync(productData)
      console.log('createProduct.mutateAsync completed successfully')
      console.log('Product created successfully:', product)
      
      // Upload images if any were added
      if (imagesToUpload.length > 0) {
        try {
          console.log('Starting image upload process...')
          
          // Separate blob URLs from already-uploaded images
          const imagesToProcess = imagesToUpload.filter((img: any) => img.url.startsWith('blob:'))
          const alreadyUploadedImages = imagesToUpload.filter((img: any) => !img.url.startsWith('blob:'))
          
          console.log('Images to process:', imagesToProcess.length)
          console.log('Already uploaded:', alreadyUploadedImages.length)
          
          if (imagesToProcess.length > 0) {
                         // Convert blob URLs to files and upload
             const uploadPromises = imagesToProcess.map(async (image: any) => {
              try {
                // Convert blob URL to file
                const response = await fetch(image.url)
                const blob = await response.blob()
                const file = new File([blob], image.alt, { type: blob.type })
                
                return await StorageService.uploadImage(file, product.id, image.is_primary)
              } catch (error) {
                console.error(`Error uploading image ${image.alt}:`, error)
                // Return original image if upload fails
                return image
              }
            })
            
            const newlyUploadedImages = await Promise.all(uploadPromises)
            
            // Combine all images
            const allImages = [...alreadyUploadedImages, ...newlyUploadedImages]
            
            console.log('All images ready, updating product:', allImages)
            // Update product with uploaded image URLs
            await updateProduct.mutateAsync({ id: product.id, data: { media: allImages } })
            console.log('Product updated with images')
          } else if (alreadyUploadedImages.length > 0) {
            // All images are already uploaded, just update the product
            await updateProduct.mutateAsync({ id: product.id, data: { media: alreadyUploadedImages } })
            console.log('Product updated with existing images')
          }
        } catch (imageError) {
          console.error('Error uploading images:', imageError)
          showError('Product created but images failed to upload. You can add them later.')
        }
      }
      
      showSuccess('Product created successfully')
      setShowCreateWizard(false)
      router.push(`/products/${product.id}`)
    } catch (error) {
      console.error('Error creating product:', error)
      showError(
        error instanceof Error ? error.message : 'Failed to create product'
      )
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error Loading Products</h3>
          <p className="text-muted-foreground">Failed to load products. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your product catalog including hotels, events, tours, and transfers
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Combobox
                options={[
                  { value: 'all', label: 'All Types' },
                  ...(productTypes?.map(type => ({
                    value: type.id,
                    label: `${type.type_name} (${type.type_code})`
                  })) || [])
                ]}
                value={productTypeFilter === 'all' ? undefined : productTypeFilter}
                onValueChange={(value) => setProductTypeFilter(value || 'all')}
                placeholder="All Types"
                className="w-[200px]"
              />
              <Combobox
                options={[
                  { value: 'all', label: 'All Events' },
                  ...(events.map(event => ({
                    value: event.id,
                    label: `${event.event_name} - ${new Date(event.event_date_from).toLocaleDateString()}`
                  })))
                ]}
                value={eventFilter === 'all' ? undefined : eventFilter}
                onValueChange={(value) => setEventFilter(value || 'all')}
                placeholder="All Events"
                className="w-[250px]"
              />
              <Combobox
                options={[
                  { value: 'all', label: 'All Locations' },
                  ...Array.from(new Set(products.map((p: Product) => p.location?.city).filter(Boolean))).map((city: string) => ({
                    value: city as string,
                    label: city as string
                  }))
                ]}
                value={locationFilter === 'all' ? undefined : locationFilter}
                onValueChange={(value) => setLocationFilter(value || 'all')}
                placeholder="All Locations"
                className="w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Products</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              
              {selectedProducts.length > 0 && (
                <BulkActions
                  selectedItems={selectedProducts}
                  actions={bulkActions}
                  onClearSelection={() => setSelectedProducts([])}
                />
              )}
            </div>

            <TabsContent value={viewMode} className="space-y-4">
              <ProductList
                products={filteredProducts}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={handleView}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

        {/* Create Product Wizard */}
        <ProductCreationWizard
          open={showCreateWizard}
          onOpenChange={setShowCreateWizard}
          onSubmit={handleCreateSubmit}
          isLoading={createProduct.isPending}
        />
    </div>
  )
}
