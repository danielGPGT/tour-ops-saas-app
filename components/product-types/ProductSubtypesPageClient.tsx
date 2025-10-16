"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Plus, Tag, Edit, Trash2, Type, Settings, Bed, Users, Clock, Package, MoreHorizontal, Copy, ArrowLeft } from "lucide-react";
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
import { ProductSubtypeSheet } from "./ProductSubtypeSheet";

interface ProductType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface ProductSubtype {
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
    icon: string;
    color: string;
  };
}

type ProductSubtypeStats = {
  totalCount: number;
  defaultCount: number;
  customCount: number;
};

interface ProductSubtypesPageClientProps {
  productSubtypes: ProductSubtype[];
  productTypes: ProductType[];
  selectedProductType: ProductType | null;
  totalCount: number;
  stats: ProductSubtypeStats;
  searchQuery: string;
  currentPage: number;
  itemsPerPage: number;
}

export function ProductSubtypesPageClient({
  productSubtypes,
  productTypes,
  selectedProductType,
  totalCount,
  stats,
  searchQuery,
  currentPage,
  itemsPerPage
}: ProductSubtypesPageClientProps) {
  const router = useRouter();
  const [selectedSubtypes, setSelectedSubtypes] = React.useState<ProductSubtype[]>([]);
  const [createSubtypeModalOpen, setCreateSubtypeModalOpen] = React.useState(false);
  const [editSubtypeId, setEditSubtypeId] = React.useState<number | null>(null);
  const [editSubtypeModalOpen, setEditSubtypeModalOpen] = React.useState(false);

  // Icon resolver for subtypes
  const getIcon = (iconName: string): React.ComponentType<{ className?: string }> => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      Tag,
      Bed,
      Users,
      Clock,
      Package,
      Settings,
      Type
    };
    return iconMap[iconName] || Tag;
  };

  // Summary cards for subtypes
  const summaryCards: SummaryCard[] = [
    {
      id: "total-subtypes",
      title: "Total Subtypes",
      value: stats.totalCount.toString(),
      icon: <Tag className="h-4 w-4" />,
      trend: undefined,
      description: "Product subtypes in your catalog"
    },
    {
      id: "default-subtypes",
      title: "Default Subtypes",
      value: stats.defaultCount.toString(),
      icon: <Settings className="h-4 w-4" />,
      trend: undefined,
      description: "System-provided subtypes"
    },
    {
      id: "custom-subtypes",
      title: "Custom Subtypes",
      value: stats.customCount.toString(),
      icon: <Plus className="h-4 w-4" />,
      trend: undefined,
      description: "Your custom subtypes"
    }
  ];

  // Bulk actions for subtypes
  const bulkActions = [
    {
      label: "Delete Selected",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: async () => {
        if (selectedSubtypes.length === 0) return;
        
        const ids = selectedSubtypes.map(subtype => subtype.id);
        try {
          const response = await fetch('/api/product-subtypes/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          });
          
          if (response.ok) {
            toast.success(`Deleted ${selectedSubtypes.length} subtype(s)`);
            setSelectedSubtypes([]);
            router.refresh();
          } else {
            const error = await response.text();
            toast.error(error);
          }
        } catch (error) {
          toast.error("Failed to delete subtypes");
        }
      }
    }
  ];

  // Subtypes table columns
  const subtypeColumns: DataTableColumn<ProductSubtype>[] = [
    {
      key: "name",
      header: "Subtype Name",
      width: "w-[200px]",
      render: (subtype) => {
        const SubtypeIcon = getIcon(subtype.icon);
        return (
          <div className="flex items-center gap-2">
            <SubtypeIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm">{subtype.name}</div>
              <div className="text-xs text-muted-foreground">
                {subtype.product_types?.name || "Unknown Type"}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: "description",
      header: "Description",
      width: "w-[250px]",
      render: (subtype) => (
        <div className="text-sm text-muted-foreground">
          {subtype.description || "No description"}
        </div>
      )
    },
    {
      key: "product_type",
      header: "Product Type",
      width: "w-[150px]",
      render: (subtype) => {
        const productType = subtype.product_types;
        if (!productType) return <span className="text-xs text-muted-foreground">Unknown</span>;
        
        const TypeIcon = getIcon(productType.icon);
        return (
          <div className="flex items-center gap-2">
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{productType.name}</span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      width: "w-[100px]",
      render: (subtype) => (
        <Badge 
          variant={subtype.is_default ? "secondary" : "default"}
          className="text-xs"
        >
          {subtype.is_default ? "Default" : "Custom"}
        </Badge>
      )
    },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]",
      render: (subtype) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(subtype.created_at), "MMM d, yyyy")}
        </div>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[80px]",
      render: (subtype) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!subtype.is_default && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    setEditSubtypeId(subtype.id);
                    setEditSubtypeModalOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Subtype
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={async () => {
                    // Duplicate functionality for subtypes
                    try {
                      const response = await fetch('/api/product-subtypes/duplicate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          id: subtype.id,
                          name: `${subtype.name} (Copy)`,
                          description: subtype.description,
                          icon: subtype.icon,
                          product_type_id: subtype.product_type_id
                        })
                      });
                      
                      if (response.ok) {
                        toast.success(`Duplicated "${subtype.name}"`);
                        router.refresh();
                      } else {
                        const error = await response.text();
                        toast.error(error);
                      }
                    } catch (error) {
                      toast.error("Failed to duplicate subtype");
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    if (subtype.is_default) {
                      toast.error(`Cannot delete default subtype: "${subtype.name}"`);
                      return;
                    }
                    
                    if (confirm(`Are you sure you want to delete "${subtype.name}"? This action cannot be undone.\n\nNote: This will only work if no variants are using this subtype.`)) {
                      try {
                        const response = await fetch('/api/product-subtypes/bulk-delete', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ids: [subtype.id] })
                        });
                        
                        if (response.ok) {
                          toast.success(`Deleted "${subtype.name}"`);
                          router.refresh();
                        } else {
                          const error = await response.text();
                          toast.error(`Failed to delete: ${error}`);
                        }
                      } catch (error) {
                        toast.error("Failed to delete subtype");
                      }
                    }
                  }}
                  disabled={subtype.is_default}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {subtype.is_default ? "Delete (System Default)" : "Delete"}
                </DropdownMenuItem>
              </>
            )}
            {subtype.is_default && (
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                System Default
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    params.set('page', newPage.toString());
    router.push(`/product-types/subtypes?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    router.push(`/product-types/subtypes?${params.toString()}`);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      {/* Back to Product Types button */}
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/product-types')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Product Types
        </Button>
      </div>

      <EntityPageLayout
        title={selectedProductType ? `Subtypes for ${selectedProductType.name}` : "Product Subtypes"}
        subtitle={selectedProductType ? `Manage subtypes for ${selectedProductType.name} product type` : "Manage subtypes for organizing product variants"}
        searchPlaceholder="Search subtypes..."
        searchParam="q"
        data={productSubtypes}
        columns={subtypeColumns}
        selectedItems={selectedSubtypes}
        onSelectionChange={(items) => setSelectedSubtypes(items as ProductSubtype[])}
        getId={(subtype) => (subtype as ProductSubtype).id}
        getItemId={(subtype) => (subtype as ProductSubtype).id}
        getItemName={(subtype) => (subtype as ProductSubtype).name}
        entityName="subtype"
        bulkActions={bulkActions}
        onSelectionClear={() => setSelectedSubtypes([])}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        emptyState={{
          icon: <Tag className="h-8 w-8 text-muted-foreground" />,
          title: "No Product Subtypes",
          description: "Create your first product subtype to organize variants."
        }}
        summaryCards={summaryCards}
        primaryAction={{
          label: "Add Subtype",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateSubtypeModalOpen(true)
        }}
      />

      {/* Modals */}
      <ProductSubtypeSheet
        isOpen={createSubtypeModalOpen || editSubtypeModalOpen}
        onClose={() => {
          setCreateSubtypeModalOpen(false);
          setEditSubtypeModalOpen(false);
          setEditSubtypeId(null);
        }}
        productSubtype={editSubtypeId ? productSubtypes.find(s => s.id === editSubtypeId) : undefined}
        productTypes={productTypes}
        defaultProductTypeId={selectedProductType?.id}
      />
    </>
  );
}
