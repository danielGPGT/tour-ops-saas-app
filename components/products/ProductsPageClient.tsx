"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package, Package2, Plus, Search, Filter, Building2, Activity, Calendar, Car, Gift, Bed, Users, Clock, Edit, Trash2, Eye, MoreHorizontal, Copy, Settings } from "lucide-react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { BulkAction } from "@/components/common/BulkActions";
import { SummaryCard } from "@/components/common/SummaryCards";
import { ProductSheet } from "@/components/product-collections/ProductSheet";
import { ProductVariantSheet } from "@/components/product-collections/ProductVariantSheet";
import { ProductVariantsModal } from "@/components/product-collections/ProductVariantsModal";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

type Product = {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  product_types?: {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_default: boolean;
  };
  product_variants?: Array<{
    id: number;
    name: string;
    subtype: string;
    status: string;
  }>;
};

type ProductType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
};

type ProductStats = {
  totalCount: number;
  activeCount: number;
  typeCounts: Record<string, number>;
};

type ProductSubtype = {
  id: number;
  org_id: number;
  product_type_id: number;
  name: string;
  description: string;
  icon: string;
  is_default: boolean;
};

interface ProductsPageClientProps {
  products: Product[];
  totalCount: number;
  stats: ProductStats;
  productTypes: ProductType[];
  searchQuery: string;
  currentPage: number;
  currentType: string;
  itemsPerPage: number;
}

export function ProductsPageClient({
  products,
  totalCount,
  stats,
  productTypes,
  searchQuery,
  currentPage,
  currentType,
  itemsPerPage
}: ProductsPageClientProps) {
  const router = useRouter();
  const [selectedProducts, setSelectedProducts] = React.useState<Product[]>([]);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editProductId, setEditProductId] = React.useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [addVariantProductId, setAddVariantProductId] = React.useState<number | null>(null);
  const [addVariantModalOpen, setAddVariantModalOpen] = React.useState(false);
  const [variantsModalOpen, setVariantsModalOpen] = React.useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = React.useState<Product | null>(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [editVariantId, setEditVariantId] = React.useState<number | null>(null);
  const [editVariantModalOpen, setEditVariantModalOpen] = React.useState(false);

  // Dynamic icon resolver function
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Building2,
      Activity,
      Calendar,
      Car,
      Gift,
      Bed,
      Users,
      Clock,
      Package
    };
    return iconMap[iconName] || Package;
  };

  // Summary cards
  const summaryCards: SummaryCard[] = [
    {
      id: "total-products",
      title: "Total Collections",
      value: stats.totalCount,
      icon: <Package className="h-4 w-4" />,
      description: "All product types",
      trend: {
        value: "Product catalog",
        icon: <Package className="h-3 w-3" />
      },
      iconBackgroundColor: "bg-primary-100"
    },
    {
      id: "active-products",
      title: "Active Collections",
      value: stats.activeCount,
      icon: <Package2 className="h-4 w-4" />,
      description: `${stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}% active rate`,
      trend: {
        value: "Active catalog",
        icon: <Package2 className="h-3 w-3" />
      },
      iconBackgroundColor: "bg-primary-100"
    },
    {
      id: "accommodation",
      title: "Accommodation",
      value: stats.typeCounts.accommodation || 0,
      icon: <Building2 className="h-4 w-4 text-secondary-600" />,
      description: "Hotels, resorts, etc.",
      trend: {
        value: "Accommodation types",
        icon: <Building2 className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-secondary-100"
    },
    {
      id: "activities",
      title: "Activities",
      value: (stats.typeCounts.activity || 0) + (stats.typeCounts.event || 0),
      icon: <Activity className="h-4 w-4 text-secondary-600" />,
      description: "Tours, events, experiences",
      trend: {
        value: "Activity types",
        icon: <Activity className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-secondary-100"
    }
  ];

  // Bulk actions
  const bulkActions: BulkAction<Product>[] = [
    {
      id: "activate",
      label: "Activate",
      icon: <Package2 className="h-4 w-4" />,
      onClick: async (items: Product[]) => {
        // TODO: Implement bulk activate
        toast.success(`Activated ${items.length} product collections`);
      }
    },
    {
      id: "deactivate",
      label: "Deactivate",
      icon: <Package className="h-4 w-4" />,
      onClick: async (items: Product[]) => {
        // TODO: Implement bulk deactivate
        toast.success(`Deactivated ${items.length} product collections`);
      }
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Package className="h-4 w-4" />,
      variant: "destructive" as const,
      onClick: async (items: Product[]) => {
        // Check for products with variants
        const productsWithVariants = items.filter(p => (p.product_variants?.length || 0) > 0);
        const productsWithoutVariants = items.filter(p => (p.product_variants?.length || 0) === 0);
        
        if (productsWithVariants.length > 0) {
          toast.error(`Cannot delete ${productsWithVariants.length} product collection${productsWithVariants.length !== 1 ? 's' : ''} with products. Delete products first.`);
          return;
        }
        
        if (productsWithoutVariants.length === 0) {
          toast.error("No product collections can be deleted (all have products)");
          return;
        }
        
        if (confirm(`Are you sure you want to delete ${productsWithoutVariants.length} product collection${productsWithoutVariants.length !== 1 ? 's' : ''}? This action cannot be undone.`)) {
          try {
            const response = await fetch('/api/products/bulk-delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: productsWithoutVariants.map(p => p.id) })
            });
            
            if (response.ok) {
              const result = await response.json();
              toast.success(`Deleted ${result.deletedCount} product${result.deletedCount !== 1 ? 's' : ''} successfully`);
              router.refresh();
            } else {
              const errorData = await response.json();
              toast.error(errorData.error || 'Failed to delete products');
            }
          } catch (error) {
            toast.error('Failed to delete product collections');
          }
        }
      }
    }
  ];

  // Define table columns
  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Product Name",
      width: "w-[250px]",
      render: (product) => {
        const productType = product.product_types;
        const TypeIcon = productType ? getIcon(productType.icon) : Package;
        return (
          <button 
            onClick={() => router.push(`/products/${product.id}`)}
            className="flex items-center gap-2 hover:bg-muted/50 p-2 rounded-md -m-2 transition-colors w-full text-left"
          >
            <TypeIcon className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium text-sm hover:text-primary transition-colors">{product.name}</div>
              <div className="text-xs text-muted-foreground">
                {product.product_variants?.length || 0} variant{(product.product_variants?.length || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </button>
        );
      }
    },
    {
      key: "type",
      header: "Type",
      width: "w-[140px]",
      render: (product) => {
        const productType = product.product_types;
        const colorClass = productType?.color || "bg-gray-100 text-gray-800";
        const displayName = productType?.name || product.type;
        return (
          <Badge variant="outline" className={`text-xs ${colorClass}`}>
            {displayName}
          </Badge>
        );
      }
    },
    {
      key: "variants",
      header: "Variants",
      width: "w-[120px]",
      render: (product) => {
        const variants = product.product_variants || [];
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedProductForVariants(product);
              setVariantsModalOpen(true);
            }}
            className="h-7 px-3 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            View {variants.length}
          </Button>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (product) => {
        const isActive = product.status === 'active';
        return (
          <Badge 
            variant={isActive ? "default" : "secondary"} 
            className={`text-xs ${isActive ? 'bg-primary-100 text-primary-800 hover:bg-primary-100' : ''}`}
          >
            {product.status}
          </Badge>
        );
      }
    },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]",
      render: (product) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(product.created_at), "MMM d, yyyy")}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[80px]",
      render: (product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => {
                setAddVariantProductId(product.id);
                setAddVariantModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={() => {
                setSelectedProductForVariants(product);
                setVariantsModalOpen(true);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Manage Variants
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={() => {
                setEditProductId(product.id);
                setEditModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </DropdownMenuItem>
            
            <DropdownMenuItem
              onClick={async () => {
                try {
                  const response = await fetch('/api/products/duplicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      productId: product.id,
                      name: `${product.name} (Copy)`
                    })
                  });
                  
                  if (response.ok) {
                    toast.success('Product and variants duplicated successfully');
                    router.refresh();
                  } else {
                    const errorData = await response.json();
                    toast.error(errorData.error || 'Failed to duplicate product');
                  }
                } catch (error) {
                  toast.error('Failed to duplicate product');
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Product
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={async () => {
                const variantCount = product.product_variants?.length || 0;
                if (variantCount > 0) {
                  toast.error(`Cannot delete product with ${variantCount} variant${variantCount !== 1 ? 's' : ''}. Delete variants first.`);
                  return;
                }
                
                if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
                  try {
                    const response = await fetch('/api/products/bulk-delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ids: [product.id] })
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      toast.success(`Product deleted successfully`);
                      router.refresh();
                    } else {
                      const errorData = await response.json();
                      toast.error(errorData.error || 'Failed to delete product');
                    }
                  } catch (error) {
                    toast.error('Failed to delete product');
                  }
                }
              }}
              className={`${(product.product_variants?.length || 0) > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive focus:text-destructive'}`}
              disabled={(product.product_variants?.length || 0) > 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
              {(product.product_variants?.length || 0) > 0 && (
                <span className="ml-auto text-xs">(Has variants)</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (currentType) params.set('type', currentType);
    params.set('page', newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (currentType) params.set('type', currentType);
    router.push(`/products?${params.toString()}`);
  };

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (type) params.set('type', type);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <>
      <EntityPageLayout
        title="Product Collections"
        subtitle="Manage your product collections (venues/establishments) and their products"
        searchQuery={searchQuery}
        onClearSearch={() => handleSearch('')}
        selectedItems={selectedProducts}
        onSelectionChange={setSelectedProducts}
        bulkActions={bulkActions}
        summaryCards={summaryCards}
        primaryAction={{
          label: "Add Product",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateModalOpen(true)
        }}
        data={products}
        columns={columns}
        getId={(product) => product.id}
        onSelectionClear={() => setSelectedProducts([])}
        getItemName={(product) => product.name}
        getItemId={(product) => product.id}
        entityName="product"
        currentPage={currentPage}
        totalPages={Math.ceil(totalCount / itemsPerPage)}
        totalItems={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        emptyState={{
          icon: <Package className="h-12 w-12 opacity-50" />,
          title: "No product collections found",
          description: searchQuery 
            ? `No product collections match "${searchQuery}". Try adjusting your search.`
            : "Get started by creating your first product collection."
        }}
      />

      {/* Modals */}
      <ProductSheet
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setEditProductId(null);
        }}
        product={editProductId ? products.find(p => p.id === editProductId) : undefined}
        productTypes={productTypes}
      />

      <ProductVariantSheet
        isOpen={addVariantModalOpen}
        onClose={() => {
          setAddVariantModalOpen(false);
          setAddVariantProductId(null);
        }}
        productId={addVariantProductId}
        productName={addVariantProductId ? products.find(p => p.id === addVariantProductId)?.name : undefined}
        onVariantCreated={() => {
          // Trigger refresh of variants modal data
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      <ProductVariantsModal
        isOpen={variantsModalOpen}
        onClose={() => {
          setVariantsModalOpen(false);
          setSelectedProductForVariants(null);
        }}
        product={selectedProductForVariants}
        onAddVariant={(productId: number) => {
          setAddVariantProductId(productId);
          setAddVariantModalOpen(true);
          // Don't close the variants modal - let user manage both
        }}
        onEditVariant={(variantId: number) => {
          setEditVariantId(variantId);
          setEditVariantModalOpen(true);
        }}
        onDeleteVariant={(variantId: number) => {
          // TODO: Implement delete variant functionality
          toast.info("Delete variant functionality coming soon");
        }}
        onRefresh={() => {
          // Refresh the product data to get updated variants
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      {/* Edit Variant Modal */}
      <ProductVariantSheet
        isOpen={editVariantModalOpen}
        onClose={() => {
          setEditVariantModalOpen(false);
          setEditVariantId(null);
        }}
        productId={selectedProductForVariants?.id || null}
        productName={selectedProductForVariants?.name}
        variant={editVariantId ? selectedProductForVariants?.product_variants?.find(v => v.id === editVariantId) ? {
          ...selectedProductForVariants.product_variants.find(v => v.id === editVariantId)!,
          attributes: {}
        } : undefined : undefined}
        onVariantUpdated={() => {
          // Trigger refresh of variants modal data
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </>
  );
}
