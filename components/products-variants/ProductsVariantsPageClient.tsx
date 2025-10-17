"use client";

import React from "react";
import { DataTable } from '@/components/common/DataTable';
import { BulkActions } from '@/components/common/BulkActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductVariantActions } from './ProductVariantActions';
import { SmartProductWizard } from '@/components/wizards/SmartProductWizard';
import { toast } from 'sonner';

type ProductVariant = {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  product_id?: number;
  attributes?: any;
  images?: any[];
  products: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  rate_plans: Array<{
    id: number;
    preferred: boolean;
    rate_doc: any;
    channels: string[];
    markets: string[];
    valid_from: string;
    valid_to: string;
  }>;
};

type Props = {
  variants: ProductVariant[];
  children: React.ReactNode; // For pagination and other server components
};

export function ProductsVariantsPageClient({ variants, children }: Props) {
  const [selectedVariants, setSelectedVariants] = React.useState<ProductVariant[]>([]);
  const [editingVariant, setEditingVariant] = React.useState<ProductVariant | null>(null);
  const [showEditWizard, setShowEditWizard] = React.useState(false);

  const handleBulkEdit = () => {
    console.log("Bulk edit:", selectedVariants);
  };

  const handleBulkDelete = () => {
    console.log("Bulk delete:", selectedVariants);
  };

  const handleBulkDuplicate = () => {
    console.log("Bulk duplicate:", selectedVariants);
  };

  const handleSelectionClear = () => {
    setSelectedVariants([]);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    console.log('ProductsVariantsPageClient - handleEditVariant called with:', variant);
    setEditingVariant(variant);
    setShowEditWizard(true);
  };

  const handleEditComplete = (data: any) => {
    setShowEditWizard(false);
    setEditingVariant(null);
    // Refresh the page or update the variant in state
    window.location.reload();
  };

  const handleEditCancel = () => {
    setShowEditWizard(false);
    setEditingVariant(null);
  };

  // Define columns for the DataTable
  const variantColumns = [
    {
      key: 'name',
      header: 'Product Name',
      render: (variant: ProductVariant) => (
        <div className="space-y-1">
          <div className="font-medium">{variant.name}</div>
          <div className="text-sm text-muted-foreground">{variant.products?.name}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (variant: ProductVariant) => (
        <Badge variant="outline" className="capitalize">
          {variant.products?.type || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (variant: ProductVariant) => (
        <Badge variant={variant.status === 'active' ? 'default' : 'secondary'}>
          {variant.status}
        </Badge>
      )
    },
    {
      key: 'images',
      header: 'Images',
      render: (variant: ProductVariant) => {
        const images = variant.images || [];
        if (images.length === 0) {
          return <span className="text-muted-foreground text-sm">No images</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {images.slice(0, 3).map((image: any, index: number) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full border-2 border-background overflow-hidden"
                >
                  <img
                    src={image.url || image.preview}
                    alt={image.alt_text || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {images.length > 3 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{images.length - 3}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'attributes',
      header: 'Attributes',
      render: (variant: ProductVariant) => {
        const attributes = variant.attributes || {};
        const attributeCount = Object.keys(attributes).length;
        
        if (attributeCount === 0) {
          return <span className="text-muted-foreground text-sm">No attributes</span>;
        }
        
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              {attributeCount} {attributeCount === 1 ? 'attribute' : 'attributes'}
            </Badge>
          </div>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (variant: ProductVariant) => (
        <span className="text-sm text-muted-foreground">
          {new Date(variant.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (variant: ProductVariant) => (
        <ProductVariantActions variant={variant} onEdit={handleEditVariant} />
      )
    }
  ];

  return (
    <>
      <BulkActions
        selectedItems={selectedVariants}
        actions={[
          {
            id: 'edit',
            label: 'Edit',
            icon: <span>✏️</span>,
            onClick: handleBulkEdit
          },
          {
            id: 'delete',
            label: 'Delete',
            icon: <span>🗑️</span>,
            variant: 'destructive' as const,
            onClick: handleBulkDelete,
            requiresConfirmation: true,
            confirmationTitle: 'Delete Products',
            confirmationDescription: (items) => `Are you sure you want to delete ${items.length} product${items.length > 1 ? 's' : ''}?`
          },
          {
            id: 'duplicate',
            label: 'Duplicate',
            icon: <span>📋</span>,
            onClick: handleBulkDuplicate
          }
        ]}
        getItemName={(variant) => variant.name}
        getItemId={(variant) => variant.id}
        entityName="product"
        onSelectionClear={handleSelectionClear}
      />
      
      <DataTable
        columns={variantColumns}
        data={variants}
        selectedItems={selectedVariants}
        onSelectionChange={setSelectedVariants}
        getId={(variant) => variant.id}
        emptyState={{
          icon: <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
            📦
          </div>,
          title: "No products found",
          description: "Get started by adding your first product."
        }}
      />
      
      {children}

      {/* Edit Wizard */}
      <SmartProductWizard
        isOpen={showEditWizard}
        onCancel={handleEditCancel}
        onComplete={handleEditComplete}
        existingVariant={editingVariant}
      />
    </>
  );
}