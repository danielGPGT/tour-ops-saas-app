"use client"

import React, { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ProductOptionsList } from '@/components/products/product-options-list'
import { ProductOptionForm } from '@/components/products/product-option-form'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useProduct, useProductOptions, useCreateProductOption, useUpdateProductOption, useDeleteProductOption } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Star, Ticket, Clock, Car } from 'lucide-react'
import type { ProductOption, ProductOptionFormData } from '@/lib/types/product'

interface ProductOptionsPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProductOptionsPage({ params }: ProductOptionsPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const [showForm, setShowForm] = useState(false)
  const [editingOption, setEditingOption] = useState<ProductOption | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [optionToDelete, setOptionToDelete] = useState<ProductOption | null>(null)

  // Data fetching
  const { data: product, isLoading: productLoading } = useProduct(id)
  const { data: options = [], isLoading: optionsLoading } = useProductOptions(id)
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  const deleteOption = useDeleteProductOption()

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

  // Event handlers
  const handleAdd = () => {
    setEditingOption(null)
    setShowForm(true)
  }

  const handleEdit = (option: ProductOption) => {
    setEditingOption(option)
    setShowForm(true)
  }

  const handleDelete = (option: ProductOption) => {
    setOptionToDelete(option)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: ProductOptionFormData) => {
    try {
      if (editingOption) {
        await updateOption.mutateAsync({ id: editingOption.id, data })
        showSuccess('Product option updated successfully')
      } else {
        await createOption.mutateAsync({ ...data, product_id: id })
        showSuccess('Product option created successfully')
      }
      setShowForm(false)
      setEditingOption(null)
    } catch (error) {
      showError(
        error instanceof Error ? error.message : 'Failed to save product option'
      )
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingOption(null)
  }

  const handleConfirmDelete = async () => {
    if (!optionToDelete) return

    try {
      await deleteOption.mutateAsync(optionToDelete.id)
      showSuccess('Product option deleted successfully')
    } catch (error) {
      showError('Failed to delete product option')
    } finally {
      setDeleteDialogOpen(false)
      setOptionToDelete(null)
    }
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Product Not Found</h3>
          <p className="text-muted-foreground">The requested product could not be found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${product.name} - Options`}
        description={`Manage product options for ${product.name}`}
        backButton={{
          onClick: () => router.push(`/products/${id}`),
          label: 'Back to Product'
        }}
      />

      {/* Product Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getProductTypeIcon(product.product_type?.name || '')}
            Product Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Product Name</span>
              <p className="font-medium">{product.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Product Type</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getProductTypeColor(product.product_type?.name || '')}>
                  {product.product_type?.name || 'Unknown'}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Current Options</span>
              <p className="font-medium">{options.length} option{options.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options Management */}
      {showForm ? (
        <ProductOptionForm
          option={editingOption || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isLoading={createOption.isPending || updateOption.isPending}
        />
      ) : (
        <ProductOptionsList
          options={options}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
          isLoading={optionsLoading}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Product Option"
        description={`Are you sure you want to delete "${optionToDelete?.option_name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  )
}
