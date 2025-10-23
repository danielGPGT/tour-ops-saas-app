"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProductCreationWizard } from '@/components/products/ProductCreationWizard'
import { useCreateProduct } from '@/lib/hooks/useProducts'
import { EventToast, showSuccess, showError } from '@/components/common/EventToast'
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

  const handleClose = (open: boolean) => {
    if (!open) {
      router.push('/products')
    }
  }

  return (
    <ProductCreationWizard
      open={true}
      onOpenChange={handleClose}
      onSubmit={handleSubmit}
      isLoading={createProduct.isPending}
    />
  )
}
