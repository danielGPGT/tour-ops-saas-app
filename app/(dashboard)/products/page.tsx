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
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { StorageService } from '@/lib/storage'
import { Plus, Package, Star, MapPin, TrendingUp, Search } from 'lucide-react'
import type { Product, ProductFilters, ProductSort } from '@/lib/types/product'

export default function ProductsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'inactive'>('all')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<ProductSort['field']>('name')
  const [sortDirection, setSortDirection] = useState<ProductSort['direction']>('asc')
  const [showCreateWizard, setShowCreateWizard] = useState(false)

  // Filters
  const filters: ProductFilters = useMemo(() => ({
    search: searchTerm || undefined,
    product_type_id: productTypeFilter && productTypeFilter !== 'all' ? productTypeFilter : undefined,
    is_active: viewMode === 'all' ? undefined : viewMode === 'active',
    location: locationFilter && locationFilter !== 'all' ? { city: locationFilter } : undefined
  }), [searchTerm, productTypeFilter, viewMode, locationFilter])

  const sort: ProductSort = useMemo(() => ({
    field: sortField,
    direction: sortDirection
  }), [sortField, sortDirection])

  // Data fetching
  const { data: products = [], isLoading, error } = useProducts(filters, sort)
  const { data: stats } = useProductStats()
  const { data: productTypes } = useProductTypes()
  const deleteProduct = useDeleteProduct()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  // Filtered products based on view mode
  const filteredProducts = useMemo(() => {
    if (viewMode === 'all') return products
    return products.filter(product => 
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
      
      console.log('Creating product with full data:', data)
      console.log('Product attributes:', data.attributes)
      console.log('About to call createProduct.mutateAsync...')
      
      // Create product without media first to avoid blob URL issues
      const product = await createProduct.mutateAsync(data)
      console.log('createProduct.mutateAsync completed successfully')
      console.log('Product created successfully:', product)
      
      // Upload images if any were added
      if (imagesToUpload.length > 0) {
        try {
          console.log('Starting image upload process...')
          
          // Extract File objects from the images
          const filesToUpload = imagesToUpload
            .filter(img => img.file) // Only images with file objects
            .map(img => img.file!)
          
          if (filesToUpload.length > 0) {
            const uploadedImages = await StorageService.uploadImagesToStorage(
              filesToUpload, 
              product.id
            )
            
            console.log('Images uploaded, updating product:', uploadedImages)
            // Update product with uploaded image URLs
            await updateProduct.mutateAsync({ id: product.id, data: { media: uploadedImages } })
            console.log('Product updated with images')
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
              <Select
                value={productTypeFilter}
                onValueChange={setProductTypeFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {productTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.type_name} ({type.type_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {Array.from(new Set(products.map(p => p.location?.city).filter(Boolean))).map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
