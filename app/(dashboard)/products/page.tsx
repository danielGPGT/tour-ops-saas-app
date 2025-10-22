"use client"

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SearchBar } from '@/components/common/SearchBar'
import { BulkActions } from '@/components/common/BulkActions'
import { SummaryCards } from '@/components/common/SummaryCards'
import { DataTable } from '@/components/common/DataTable'
import { ProductList } from '@/components/products/product-list'
import { useProducts, useProductStats, useDeleteProduct } from '@/lib/hooks/useProducts'
import { useProductTypes } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { Plus, Package, Star, MapPin, TrendingUp } from 'lucide-react'
import type { Product, ProductFilters, ProductSort } from '@/lib/types/product'

export default function ProductsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'inactive'>('all')
  const [productTypeFilter, setProductTypeFilter] = useState<string>('')
  const [sortField, setSortField] = useState<ProductSort['field']>('name')
  const [sortDirection, setSortDirection] = useState<ProductSort['direction']>('asc')

  // Filters
  const filters: ProductFilters = useMemo(() => ({
    search: searchTerm || undefined,
    product_type_id: productTypeFilter || undefined,
    is_active: viewMode === 'all' ? undefined : viewMode === 'active'
  }), [searchTerm, productTypeFilter, viewMode])

  const sort: ProductSort = useMemo(() => ({
    field: sortField,
    direction: sortDirection
  }), [sortField, sortDirection])

  // Data fetching
  const { data: products = [], isLoading, error } = useProducts(filters, sort)
  const { data: stats } = useProductStats()
  const { data: productTypes } = useProductTypes()
  const deleteProduct = useDeleteProduct()

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
    router.push('/products/new')
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
          <h1 className="text-3xl font-bold">Products</h1>
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
            <CardTitle>Products</CardTitle>
            <div className="flex items-center gap-4">
              <SearchBar
                placeholder="Search products..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Types</option>
                {productTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
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
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
