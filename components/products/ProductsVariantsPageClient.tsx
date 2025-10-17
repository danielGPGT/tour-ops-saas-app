"use client";

import React from "react";
import { DataTable } from '@/components/common/DataTable';
import { BulkActions } from '@/components/common/BulkActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ProductVariant = {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
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
      key: 'channels',
      header: 'Channels',
      render: (variant: ProductVariant) => {
        const channels = variant.rate_plans?.[0]?.channels || [];
        return (
          <div className="flex flex-wrap gap-1">
            {channels.slice(0, 2).map((channel, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {channel}
              </Badge>
            ))}
            {channels.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{channels.length - 2}
              </Badge>
            )}
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
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            Duplicate
          </Button>
        </div>
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
    </>
  );
}