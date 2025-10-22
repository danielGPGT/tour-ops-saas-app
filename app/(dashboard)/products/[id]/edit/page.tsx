"use client"

import React, { use } from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/products/product-form'
import { useProduct, useUpdateProduct } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { PageHeader } from '@/components/common/PageHeader'
import type { ProductFormData } from '@/lib/validations/product.schema'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter()
  const { id } = use(params)
  const { data: product, isLoading } = useProduct(id)
  const updateProduct = useUpdateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await updateProduct.mutateAsync({ id, data })
      showSuccess('Product updated successfully')
      router.push(`/products/${id}`)
    } catch (error) {
      showError(
        error instanceof Error ? error.message : 'Failed to update product'
      )
    }
  }

  const handleCancel = () => {
    router.push(`/products/${id}`)
  }

  if (isLoading) {
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
        title={`Edit ${product.name}`}
        description="Update product information"
        backButton={{
          onClick: () => router.push(`/products/${id}`),
          label: 'Back to Product'
        }}
      />

      <ProductForm
        product={product}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateProduct.isPending}
      />
    </div>
  )
}
