"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProductForm } from '@/components/products/product-form'
import { useCreateProduct } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
import { PageHeader } from '@/components/common/PageHeader'
import type { ProductFormData } from '@/lib/validations/product.schema'

export default function NewProductPage() {
  const router = useRouter()
  const createProduct = useCreateProduct()

  const handleSubmit = async (data: ProductFormData) => {
    try {
      const product = await createProduct.mutateAsync(data)
      showSuccess('Product created successfully')
      router.push(`/products/${product.id}`)
    } catch (error) {
      showError(
        error instanceof Error ? error.message : 'Failed to create product'
      )
    }
  }

  const handleCancel = () => {
    router.push('/products')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Product"
        description="Add a new product to your catalog"
        backButton={{
          onClick: () => router.push('/products'),
          label: 'Back to Products'
        }}
      />

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createProduct.isPending}
      />
    </div>
  )
}
