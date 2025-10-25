'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useProduct } from '@/lib/hooks/useProducts'
import { useProductOptions } from '@/lib/hooks/useProductOptions'
import { Button } from '@/components/ui/button'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { OptionsTable } from '@/components/product-options/OptionsTable'
import { AccommodationOptionForm } from '@/components/product-options/AccommodationOptionForm'
import { EventOptionForm } from '@/components/product-options/EventOptionForm'
import { TransferOptionForm } from '@/components/product-options/TransferOptionForm'
import { ActivityOptionForm } from '@/components/product-options/ActivityOptionForm'
import { ExtraOptionForm } from '@/components/product-options/ExtraOptionForm'

export default function ProductOptionsPage() {
  const params = useParams()
  const productId = params.id as string
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<any>(null)
  
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId)
  const { data: options, isLoading: isLoadingOptions } = useProductOptions(productId)
  
  if (isLoadingProduct || isLoadingOptions) {
    return <PageSkeleton />
  }
  
  if (!product) {
    return <div>Product not found</div>
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Options"
        description={`Manage options for ${product.name}`}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name, href: `/products/${productId}` },
          { label: 'Options' }
        ]}
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        }
      />
      
      <OptionsTable
        options={options || []}
        productType={product.product_type?.type_name?.toLowerCase() || 'accommodation'}
        onEdit={setEditingOption}
      />
      
      {/* Render appropriate form based on product type */}
      {product.product_type?.type_name?.toLowerCase() === 'accommodation' && (
        <AccommodationOptionForm
          open={isAddDialogOpen || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption}
        />
      )}
      
      {product.product_type?.type_name?.toLowerCase() === 'event' && (
        <EventOptionForm
          open={isAddDialogOpen || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption}
        />
      )}
      
      {product.product_type?.type_name?.toLowerCase() === 'transfers' && (
        <TransferOptionForm
          open={isAddDialogOpen || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption}
        />
      )}
      
      {product.product_type?.type_name?.toLowerCase() === 'activity' && (
        <ActivityOptionForm
          open={isAddDialogOpen || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption}
        />
      )}
      
      {product.product_type?.type_name?.toLowerCase() === 'extra' && (
        <ExtraOptionForm
          open={isAddDialogOpen || !!editingOption}
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false)
              setEditingOption(null)
            }
          }}
          productId={productId}
          option={editingOption}
        />
      )}
    </div>
  )
}