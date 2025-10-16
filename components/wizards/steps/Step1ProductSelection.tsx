'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronRight, 
  Plus, 
  Info,
  Package2,
  Building2,
  Ticket,
  Car,
  Calendar
} from 'lucide-react';

interface Product {
  id: number;
  name: string;
  type: string;
  supplier?: {
    name: string;
  };
  variants?: Array<{
    id: number;
    name: string;
  }>;
}

interface Step1Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function Step1ProductSelection({ data, onNext, onBack }: Step1Props) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductType, setSelectedProductType] = useState<string>('accommodation');

  useEffect(() => {
    loadExistingProducts();
  }, []);

  const loadExistingProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const result = await response.json();
        setExistingProducts(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onNext({
      mode: 'existing',
      product: product
    });
  };

  const handleNewProduct = (productData: any) => {
    onNext({
      mode: 'new',
      product: productData
    });
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <Building2 className="w-5 h-5" />;
      case 'activity': return <Ticket className="w-5 h-5" />;
      case 'transfer': return <Car className="w-5 h-5" />;
      default: return <Package2 className="w-5 h-5" />;
    }
  };

  const getProductTypeColor = (type: string) => {
    switch (type) {
      case 'accommodation': return 'bg-blue-100 text-blue-800';
      case 'activity': return 'bg-green-100 text-green-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Let's add your variant</h2>
        <p className="text-muted-foreground">
          Add to existing product or create new?
        </p>
      </div>
      
      <Tabs value={mode} onValueChange={(value) => setMode(value as 'existing' | 'new')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="existing">
            Add to Existing
            <Badge variant="secondary" className="ml-2">Faster</Badge>
          </TabsTrigger>
          <TabsTrigger value="new">Create New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="existing" className="space-y-3 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : existingProducts.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You don't have any products yet. Create your first one!
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Select a product to add a new variant
              </p>
              
              <div className="grid gap-3">
                {existingProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full p-4 border-2 rounded-lg hover:border-primary transition text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getProductTypeIcon(product.type)}
                          <h3 className="font-semibold">{product.name}</h3>
                          <Badge className={getProductTypeColor(product.type)}>
                            {product.type}
                          </Badge>
                        </div>
                        
                        {product.supplier && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Supplier: {product.supplier.name}
                          </p>
                        )}
                        
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {product.variants?.length || 0} variants
                          </Badge>
                          {product.variants?.slice(0, 3).map(v => (
                            <Badge key={v.id} variant="secondary" className="text-xs">
                              {v.name}
                            </Badge>
                          ))}
                          {product.variants && product.variants.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{product.variants.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <QuickProductForm
            onSubmit={handleNewProduct}
            defaultProductType={selectedProductType}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Quick Product Form Component
function QuickProductForm({ onSubmit, defaultProductType }: { 
  onSubmit: (data: any) => void;
  defaultProductType: string;
}) {
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState(defaultProductType);
  const [supplierName, setSupplierName] = useState('');

  const productTypes = [
    { value: 'accommodation', label: 'Accommodation', icon: <Building2 className="w-4 h-4" /> },
    { value: 'activity', label: 'Activity', icon: <Ticket className="w-4 h-4" /> },
    { value: 'transfer', label: 'Transfer', icon: <Car className="w-4 h-4" /> },
    { value: 'package', label: 'Package', icon: <Package2 className="w-4 h-4" /> },
    { value: 'flight', label: 'Flight', icon: <Calendar className="w-4 h-4" /> },
    { value: 'cruise', label: 'Cruise', icon: <Package2 className="w-4 h-4" /> },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !productType || !supplierName.trim()) {
      return;
    }
    
    onSubmit({
      name: productName,
      type: productType,
      supplier: {
        name: supplierName
      }
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Grand Hotel Paris"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Product Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {productTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setProductType(type.value)}
                  className={`p-3 border rounded-lg text-left transition ${
                    productType === type.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {type.icon}
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Supplier Name
            </label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g., Paris Hotels Ltd"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create New Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
