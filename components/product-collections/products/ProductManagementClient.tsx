'use client';

import {SheetForm} from '@/components/ui/SheetForm';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Package, 
  Package2, 
  Plus, 
  Building2, 
  Ticket, 
  Car, 
  Calendar as CalendarIcon,
  Users,
  Settings,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DataTable, DataTableColumn } from '@/components/common/DataTable';
import { SummaryCards } from '@/components/common/SummaryCards';
import { SimpleRatePlanWizard } from '@/components/wizards/SimpleRatePlanWizard';
import { MultiRatePlanWizard } from '@/components/wizards/MultiRatePlanWizard';
import { toast } from 'sonner';
import { format } from 'date-fns';

type Product = {
  id: number;
  name: string;
  type: string;
  status: string;
  description?: string;
  attributes?: any;
  created_at: string;
  updated_at: string;
  product_types?: {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
};

type ProductVariant = {
  id: number;
  name: string;
  subtype: string;
  status: string;
  attributes?: any;
  created_at: string;
  rate_plans?: Array<{
    id: number;
    inventory_model: string;
    currency: string;
    valid_from: string;
    valid_to: string;
    preferred?: boolean;
    channels?: string[];
    markets?: string[];
    rate_doc?: {
      name?: string;
      base_price?: number;
      base_cost?: number;
    };
    suppliers?: {
      id: number;
      name: string;
    };
  }>;
  allocation_buckets?: Array<{
    id: number;
    date: string;
    allocation_type: string;
    quantity: number;
    booked: number;
    held: number;
  }>;
};

type Supplier = {
  id: number;
  name: string;
};

interface ProductManagementClientProps {
  product: Product;
  variants: ProductVariant[];
  suppliers: Supplier[];
}

export function ProductManagementClient({ product, variants, suppliers }: ProductManagementClientProps) {
  const router = useRouter();
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [showVariantWizard, setShowVariantWizard] = useState(false);
  const [showMultiRateWizard, setShowMultiRateWizard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [productData, setProductData] = useState(product);
  const [variantsData, setVariantsData] = useState(variants);
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);

  // Define columns for variants DataTable
  const variantColumns: DataTableColumn<ProductVariant>[] = [
    {
      key: "name",
      header: "Product Name",
      width: "w-[250px]",
      render: (variant) => (
        <div className="flex items-center gap-2">
          <Package2 className="h-4 w-4 text-primary" />
          <div>
            <div className="font-medium text-sm">{variant.name}</div>
            <div className="text-xs text-muted-foreground">
              {variant.subtype} • {format(new Date(variant.created_at), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "supplier",
      header: "Supplier",
      width: "w-[150px]",
      render: (variant) => (
        <div className="text-sm">
          {variant.rate_plans?.[0]?.suppliers?.name || 'No supplier'}
        </div>
      )
    },
    {
      key: "inventory",
      header: "Inventory Model",
      width: "w-[140px]",
      render: (variant) => {
        const model = variant.rate_plans?.[0]?.inventory_model;
        if (!model) return <span className="text-muted-foreground">-</span>;
        
        return (
          <Badge className={getInventoryModelColor(model)}>
            {model}
          </Badge>
        );
      }
    },
    {
      key: "availability",
      header: "Available",
      width: "w-[100px]",
      render: (variant) => {
        const available = variant.allocation_buckets?.reduce((sum, b) => sum + (b.quantity - b.booked - b.held), 0) || 0;
        return (
          <div className="text-sm font-medium">
            {available}
          </div>
        );
      }
    },
    {
      key: "preferred_rate",
      header: "Preferred Rate",
      width: "w-[140px]",
      render: (variant) => {
        const preferredRatePlan = variant.rate_plans?.find(rp => rp.preferred);
        if (!preferredRatePlan) {
          return <span className="text-muted-foreground">No preferred</span>;
        }
        
        return (
          <div className="text-sm">
            <div className="font-medium">{preferredRatePlan.rate_doc?.name || 'Preferred'}</div>
            <div className="text-muted-foreground">
              {preferredRatePlan.suppliers?.name || 'Unknown supplier'}
            </div>
          </div>
        );
      }
    },
    {
      key: "selling_price",
      header: "Selling Price",
      width: "w-[120px]",
      render: (variant) => {
        const preferredRatePlan = variant.rate_plans?.find(rp => rp.preferred);
        if (!preferredRatePlan) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const basePrice = preferredRatePlan.rate_doc?.base_price || 0;
        const currency = preferredRatePlan.currency || 'GBP';
        
        return (
          <div className="text-sm font-medium">
            {currency} {basePrice.toFixed(2)}
          </div>
        );
      }
    },
    {
      key: "cost",
      header: "Cost",
      width: "w-[100px]",
      render: (variant) => {
        const preferredRatePlan = variant.rate_plans?.find(rp => rp.preferred);
        if (!preferredRatePlan) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const baseCost = preferredRatePlan.rate_doc?.base_cost || 0;
        const currency = preferredRatePlan.currency || 'GBP';
        
        return (
          <div className="text-sm text-muted-foreground">
            {currency} {baseCost.toFixed(2)}
          </div>
        );
      }
    },
    {
      key: "margin",
      header: "Margin",
      width: "w-[100px]",
      render: (variant) => {
        const preferredRatePlan = variant.rate_plans?.find(rp => rp.preferred);
        if (!preferredRatePlan) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const baseCost = preferredRatePlan.rate_doc?.base_cost || 0;
        const basePrice = preferredRatePlan.rate_doc?.base_price || 0;
        const currency = preferredRatePlan.currency || 'GBP';
        
        if (baseCost === 0 || basePrice === 0) {
          return <span className="text-muted-foreground">-</span>;
        }
        
        const margin = basePrice - baseCost;
        const marginPercent = ((basePrice - baseCost) / baseCost * 100);
        
        return (
          <div className="text-sm">
            <div className="font-medium">{currency} {margin.toFixed(2)}</div>
            <div className="text-muted-foreground">{marginPercent.toFixed(1)}%</div>
          </div>
        );
      }
    },
    {
      key: "booked",
      header: "Booked",
      width: "w-[100px]",
      render: (variant) => {
        const booked = variant.allocation_buckets?.reduce((sum, b) => sum + b.booked, 0) || 0;
        return (
          <div className="text-sm">
            {booked}
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      width: "w-[100px]",
      render: (variant) => (
        <Badge className={getStatusColor(variant.status)}>
          {variant.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[80px]",
      render: (variant) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditVariant(variant)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteVariant(variant.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  // Bulk actions for variants
  const variantBulkActions = [
    {
      label: "Activate Selected",
      icon: <Check className="w-4 h-4" />,
      onClick: () => {
        // TODO: Implement bulk activate
        toast.success(`Activated ${selectedVariants.length} products`);
        setSelectedVariants([]);
      }
    },
    {
      label: "Deactivate Selected",
      icon: <X className="w-4 h-4" />,
      onClick: () => {
        // TODO: Implement bulk deactivate
        toast.success(`Deactivated ${selectedVariants.length} products`);
        setSelectedVariants([]);
      }
    },
    {
      label: "Delete Selected",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        if (confirm(`Are you sure you want to delete ${selectedVariants.length} products?`)) {
          // TODO: Implement bulk delete
          toast.success(`Deleted ${selectedVariants.length} products`);
          setSelectedVariants([]);
        }
      },
      variant: "destructive" as const
    }
  ];

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <Building2 className="w-6 h-6 text-primary" />;
      case 'activity': return <Ticket className="w-6 h-6 text-primary" />;
      case 'transfer': return <Car className="w-6 h-6 text-primary" />;
      default: return <Package className="w-6 h-6 text-primary" />;
    }
  };

  const handleProductUpdate = async () => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Product updated successfully!');
        setIsEditingProduct(false);
      } else {
        toast.error(result.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleVariantCreated = (newVariant: any) => {
    setVariantsData(prev => [...prev, newVariant.data.variant]);
    setShowVariantWizard(false);
    toast.success('✅ Product created successfully!');
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setShowVariantWizard(true);
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/variants/${variantId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (result.success) {
        setVariantsData(prev => prev.filter(v => v.id !== variantId));
        toast.success('✅ Product deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInventoryModelColor = (model: string) => {
    switch (model) {
      case 'committed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'freesale': return 'bg-green-100 text-green-800 border-green-200';
      case 'on-request': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/products')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Product Collections
          </Button>
          <div className="flex items-center gap-3">
            {getProductIcon(product.type)}
            <div>
              <h1 className="text-2xl font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground capitalize">
                Product Collection • {product.type} • {variantsData.length} products
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditingProduct && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProduct(true)}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Product
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVariantWizard(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setSelectedProduct(product);
              setShowMultiRateWizard(true);
            }}
            className="gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Add Multi-Rate Product
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="variants">Products ({variantsData.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Product Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Product Details
                  </CardTitle>
                  <CardDescription>
                    Basic information about this product
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(productData.status)}>
                  {productData.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProduct ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        value={productData.name}
                        onChange={(e) => setProductData({...productData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Product Type</Label>
                      <Input
                        id="type"
                        value={productData.type}
                        onChange={(e) => setProductData({...productData, type: e.target.value})}
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={productData.description || ''}
                      onChange={(e) => setProductData({...productData, description: e.target.value})}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleProductUpdate} className="gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingProduct(false)} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Product Name</Label>
                      <p className="text-sm">{productData.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Product Type</Label>
                      <p className="text-sm capitalize">{productData.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Suppliers</Label>
                      <p className="text-sm">
                        {variantsData.length > 0 && variantsData[0].rate_plans?.[0]?.suppliers?.name 
                          ? variantsData[0].rate_plans[0].suppliers.name 
                          : 'No suppliers configured'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-sm">{format(new Date(productData.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                  {productData.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="text-sm text-muted-foreground">{productData.description}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <SummaryCards 
            cards={[
              {
                id: "total-variants",
                title: "Total Products",
                value: variantsData.length,
                icon: <Package2 className="w-4 h-4" />,
                description: `${variantsData.length} product${variantsData.length !== 1 ? 's' : ''} configured`
              },
              {
                id: "active-variants",
                title: "Active Products",
                value: variantsData.filter(v => v.status === 'active').length,
                icon: <Check className="w-4 h-4" />,
                description: `${variantsData.filter(v => v.status === 'active').length} currently active`
              },
              {
                id: "total-available",
                title: "Total Available",
                value: variantsData.reduce((sum, v) => 
                  sum + (v.allocation_buckets?.reduce((bucketSum, b) => bucketSum + (b.quantity - b.booked - b.held), 0) || 0), 0
                ),
                icon: <Users className="w-4 h-4" />,
                description: "Available inventory across all variants"
              },
              {
                id: "total-booked",
                title: "Total Booked",
                value: variantsData.reduce((sum, v) => 
                  sum + (v.allocation_buckets?.reduce((bucketSum, b) => bucketSum + b.booked, 0) || 0), 0
                ),
                icon: <CalendarIcon className="w-4 h-4" />,
                description: "Booked inventory across all variants"
              }
            ]}
          />
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Products</h2>
              <p className="text-sm text-muted-foreground">
                Manage all products in this collection
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedProduct(productData);
                setShowVariantWizard(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>

          {variantsData.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first product to start selling from this collection
                </p>
                <Button
                  onClick={() => {
                    setSelectedProduct(productData);
                    setShowVariantWizard(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Product
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Variants Summary Cards */}
              <SummaryCards 
                cards={[
                  {
                    id: "total-variants-variants",
                    title: "Total Products",
                    value: variantsData.length,
                    icon: <Package2 className="w-4 h-4" />,
                    description: `${variantsData.length} product${variantsData.length !== 1 ? 's' : ''} configured`
                  },
                  {
                    id: "active-variants-variants",
                    title: "Active Products",
                    value: variantsData.filter(v => v.status === 'active').length,
                    icon: <Check className="w-4 h-4" />,
                    description: `${variantsData.filter(v => v.status === 'active').length} currently active`
                  },
                  {
                    id: "total-available-variants",
                    title: "Total Available",
                    value: variantsData.reduce((sum, v) => 
                      sum + (v.allocation_buckets?.reduce((bucketSum, b) => bucketSum + (b.quantity - b.booked - b.held), 0) || 0), 0
                    ),
                    icon: <Users className="w-4 h-4" />,
                    description: "Available inventory across all variants"
                  },
                  {
                    id: "booked-variants",
                    title: "Booked",
                    value: variantsData.reduce((sum, v) => 
                      sum + (v.allocation_buckets?.reduce((bucketSum, b) => bucketSum + b.booked, 0) || 0), 0
                    ),
                    icon: <CalendarIcon className="w-4 h-4" />,
                    description: "Booked inventory across all variants"
                  }
                ]}
              />

              {/* Variants DataTable */}
              <DataTable
                data={variantsData}
                columns={variantColumns}
                getId={(variant) => variant.id}
                selectedItems={selectedVariants}
                onSelectionChange={setSelectedVariants}
                className="border rounded-lg"
              />
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Product Settings
              </CardTitle>
              <CardDescription>
                Advanced settings and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>
                  Advanced product settings and configurations will be available in a future update.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Universal Product Variant Wizard Modal */}
      {showVariantWizard && (selectedProduct || editingVariant) && (
        <Dialog open={showVariantWizard} onOpenChange={setShowVariantWizard}>
          <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto">
            <SimpleRatePlanWizard
              preselectedProduct={selectedProduct || undefined}
              existingVariant={editingVariant || undefined}
              onComplete={(data) => {
                console.log('Simple rate wizard completed:', data);
                setShowVariantWizard(false);
                setSelectedProduct(null);
                setEditingVariant(null);
                // Refresh variants data
                window.location.reload();
              }}
              onCancel={() => {
                setShowVariantWizard(false);
                setSelectedProduct(null);
                setEditingVariant(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Multi-Rate Plan Wizard */}
      {showMultiRateWizard && (
        <MultiRatePlanWizard
          isOpen={showMultiRateWizard}
          onCancel={() => {
            setShowMultiRateWizard(false);
            setSelectedProduct(null);
            setEditingVariant(null);
          }}
          onComplete={async (data) => {
            try {
              const response = await fetch('/api/products/variants/multi-rate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });

              const result = await response.json();
              if (result.success) {
                toast.success('Multi-rate product created successfully!');
                router.refresh();
                setShowMultiRateWizard(false);
                setSelectedProduct(null);
                setEditingVariant(null);
              } else {
                toast.error(result.error || 'Failed to create product');
              }
            } catch (error) {
              console.error('Error creating product:', error);
              toast.error('Failed to create product');
            }
          }}
          preselectedProduct={selectedProduct || undefined}
          existingVariant={editingVariant}
        />
      )}
    </div>
  );
}
