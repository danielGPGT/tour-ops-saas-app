"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Settings, Type, Tag, Building2, Activity, Calendar, Car, Gift, Bed, Users, Clock, Package, Edit, Trash2, MoreHorizontal, Copy } from "lucide-react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { SummaryCard } from "@/components/common/SummaryCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { ProductTypeSheet } from "./ProductTypeSheet";


type ProductType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  product_subtypes?: Array<{
    id: number;
    name: string;
    description: string;
    icon: string;
    is_default: boolean;
    created_at: string;
  }>;
};

type ProductSubtype = {
  id: number;
  org_id: number;
  product_type_id: number;
  name: string;
  description: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  product_types?: {
    id: number;
    name: string;
  };
};

type ProductTypeStats = {
  totalCount: number;
  defaultCount: number;
  customCount: number;
};

interface ProductTypesPageClientProps {
  productTypes: ProductType[];
  productSubtypes: ProductSubtype[];
  totalCount: number;
  stats: ProductTypeStats;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
}

export function ProductTypesPageClient({
  productTypes,
  productSubtypes,
  totalCount,
  stats,
  searchQuery,
  currentPage,
  itemsPerPage
}: ProductTypesPageClientProps) {
  const router = useRouter();
  const [selectedTypes, setSelectedTypes] = React.useState<ProductType[]>([]);
  const [createTypeModalOpen, setCreateTypeModalOpen] = React.useState(false);
  const [editTypeId, setEditTypeId] = React.useState<number | null>(null);
  const [editTypeModalOpen, setEditTypeModalOpen] = React.useState(false);

  // Dynamic icon resolver function
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      Building2,
      Activity,
      Calendar,
      Car,
      Gift,
      Bed,
      Users,
      Clock,
      Package,
      Type,
      Tag,
      Settings
    };
    return iconMap[iconName] || Type;
  };

  // Summary cards
  const summaryCards: SummaryCard[] = [
    {
      id: "total-types",
      title: "Total Types",
      value: stats.totalCount.toString(),
      icon: <Type className="h-4 w-4" />,
      trend: undefined,
      description: "Product types in your catalog"
    },
    {
      id: "default-types",
      title: "Default Types",
      value: stats.defaultCount.toString(),
      icon: <Settings className="h-4 w-4" />,
      trend: undefined,
      description: "System-provided types"
    },
    {
      id: "custom-types",
      title: "Custom Types",
      value: stats.customCount.toString(),
      icon: <Plus className="h-4 w-4" />,
      trend: undefined,
      description: "Your custom product types"
    }
  ];

  // Bulk actions for product types
  const bulkActions = [
    {
      label: "Delete Types",
      icon: <Settings className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: async () => {
        if (selectedTypes.length === 0) return;
        
        const ids = selectedTypes.map(type => type.id);
        try {
          const response = await fetch('/api/product-types/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          
          if (response.ok) {
            toast.success(`Deleted ${selectedTypes.length} product type(s)`);
            setSelectedTypes([]);
            router.refresh();
          } else {
            const error = await response.text();
            toast.error(error);
          }
        } catch (error) {
          toast.error("Failed to delete product types");
        }
      }
    }
  ];

  // Product Types table columns
  const typeColumns: DataTableColumn<ProductType>[] = [
    {
      key: "name",
      header: "Product Type",
      width: "w-[250px]",
      render: (type) => {
        const TypeIcon = getIcon(type.icon);
        return (
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">{type.name}</div>
              <div className="text-xs text-muted-foreground">
                {type.product_subtypes?.length || 0} subtype{(type.product_subtypes?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: "description",
      header: "Description",
      width: "w-[200px]",
      render: (type) => (
        <div className="text-sm text-muted-foreground">
          {type.description || "No description"}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      width: "w-[140px]",
      render: (type) => (
        <div className="flex flex-col gap-1">
          <Badge 
            variant={type.is_default ? "secondary" : "default"}
            className="text-xs"
          >
            {type.is_default ? "System Default" : "Custom"}
          </Badge>
          {type.is_default && (
            <span className="text-xs text-muted-foreground">Protected</span>
          )}
        </div>
      )
    },
    {
      key: "color",
      header: "Color Theme",
      width: "w-[140px]",
      render: (type) => (
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full border"
            style={{ backgroundColor: type.color.includes('bg-') ? '' : type.color }}
          />
          <span className="text-xs text-muted-foreground">
            {type.color}
          </span>
        </div>
      )
    },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]",
      render: (type) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(type.created_at), "MMM d, yyyy")}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[80px]",
      render: (type) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                setEditTypeId(type.id);
                setEditTypeModalOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Product Type
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => router.push(`/product-types/subtypes?type=${type.id}`)}
            >
              <Tag className="mr-2 h-4 w-4" />
              Manage Subtypes
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={async () => {
                // Duplicate functionality - create a copy of the product type
                try {
                  const response = await fetch('/api/product-types/duplicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      id: type.id,
                      name: `${type.name} (Copy)`,
                      description: type.description,
                      icon: type.icon,
                      color: type.color
                    })
                  });
                  
                  if (response.ok) {
                    toast.success(`Duplicated "${type.name}"`);
                    router.refresh();
                  } else {
                    const error = await response.text();
                    toast.error(error);
                  }
                } catch (error) {
                  toast.error("Failed to duplicate product type");
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                if (type.is_default) {
                  toast.error(`Cannot delete default product type: "${type.name}"`);
                  return;
                }
                
                if (confirm(`Are you sure you want to delete "${type.name}"? This action cannot be undone.\n\nNote: This will only work if no products are using this type.`)) {
                  try {
                    const response = await fetch('/api/product-types/bulk-delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ids: [type.id] })
                    });
                    
                    if (response.ok) {
                      toast.success(`Deleted "${type.name}"`);
                      router.refresh();
                    } else {
                      const error = await response.text();
                      toast.error(`Failed to delete: ${error}`);
                    }
                  } catch (error) {
                    toast.error("Failed to delete product type");
                  }
                }
              }}
              disabled={type.is_default}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {type.is_default ? "Delete (System Default)" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', newPage.toString());
    router.push(`/product-types?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/product-types?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <EntityPageLayout
        title="Product Types"
        subtitle="Manage your custom product types and subtypes for organizing your catalog"
        searchPlaceholder="Search product types..."
        searchParam="q"
        data={productTypes}
        columns={typeColumns}
        selectedItems={selectedTypes}
        onSelectionChange={(items) => setSelectedTypes(items as ProductType[])}
        getId={(type) => (type as ProductType).id}
        getItemId={(type) => (type as ProductType).id}
        getItemName={(type) => (type as ProductType).name}
        entityName="product type"
        bulkActions={bulkActions}
        onSelectionClear={() => setSelectedTypes([])}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        emptyState={{
          icon: <Type className="h-8 w-8 text-muted-foreground" />,
          title: "No Product Types",
          description: "Create your first custom product type to organize your catalog."
        }}
        summaryCards={summaryCards}
        primaryAction={{
          label: "Add Product Type",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateTypeModalOpen(true)
        }}
      />

      {/* Modals */}
      <ProductTypeSheet
        isOpen={createTypeModalOpen || editTypeModalOpen}
        onClose={() => {
          setCreateTypeModalOpen(false);
          setEditTypeModalOpen(false);
          setEditTypeId(null);
        }}
        productType={editTypeId ? productTypes.find(t => t.id === editTypeId) : undefined}
      />

    </>
  );
}
