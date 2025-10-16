'use client';

import React, { useState } from 'react';
import { Check, Loader2, Calendar, DollarSign, Package, Building2, Ticket, Car, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// Type for variant wizard data
type VariantWizardData = {
  productId: string;
  variantName: string;
  description?: string;
  serviceDates: {
    startDate: string;
    endDate: string;
  };
  pricing: {
    cost: string;
    price: string;
    currency: string;
  };
  availability: {
    quantity: string;
    model: 'fixed' | 'unlimited' | 'on-request';
  };
};

interface Product {
  id: string;
  name: string;
  type: string;
  variants: Array<{
    id: string;
    name: string;
  }>;
}

interface StepProps {
  data: Partial<VariantWizardData>;
  onNext: (data: any) => void;
  onBack?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  preselectedProductId?: string;
}

// Step 1: Select Product
function Step1SelectProduct({ data, onNext, preselectedProductId }: StepProps) {
  const [selectedProduct, setSelectedProduct] = useState<string | null>(data.productId || null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [preselectedProduct, setPreselectedProduct] = useState<Product | null>(null);

  // Load products on mount
  React.useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      const result = await response.json();
      
      if (result.success) {
        const productsData = result.data || [];
        setProducts(productsData);
        
        // If we have a preselected product, find it and set it
        if (preselectedProductId) {
          const preselected = productsData.find((p: Product) => p.id === preselectedProductId);
          if (preselected) {
            setPreselectedProduct(preselected);
            setSelectedProduct(preselectedProductId);
          }
        }
      } else {
        toast.error('Failed to load products');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Selected product not found');
      return;
    }
    
    onNext({
      productId: selectedProduct,
      productName: product.name,
      productType: product.type,
      existingVariants: product.variants
    });
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <Building2 className="w-6 h-6 text-primary" />;
      case 'activity': return <Ticket className="w-6 h-6 text-primary" />;
      case 'transfer': return <Car className="w-6 h-6 text-primary" />;
      default: return <Package className="w-6 h-6 text-primary" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add New Variant</h1>
        <p className="text-muted-foreground mt-2">
          {preselectedProductId ? 
            `Adding a variant to ${preselectedProduct?.name || 'selected product'}` :
            'Select the product you want to add a variant to'
          }
        </p>
      </div>

      {preselectedProductId && preselectedProduct && (
        <Alert>
          <AlertDescription>
            You're adding a variant to <strong>{preselectedProduct.name}</strong>. 
            This product currently has {preselectedProduct.variants.length} variant(s).
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {products.map(product => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(product.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedProduct === product.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12">
                {getProductIcon(product.type)}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground capitalize mb-2">
                  {product.type}
                </p>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Existing variants:
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {product.variants.map(variant => (
                      <Badge key={variant.id} variant="secondary" className="text-xs">
                        {variant.name}
                      </Badge>
                    ))}
                    {product.variants.length === 0 && (
                      <Badge variant="outline" className="text-xs">
                        No variants yet
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedProduct === product.id && (
                <Check className="w-6 h-6 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>

      {products.length === 0 && (
        <Alert>
          <AlertDescription>
            No products found. Create a product first before adding variants.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleNext}
          disabled={!selectedProduct || products.length === 0}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

// Step 2: Variant Details
function Step2VariantDetails({ data, onNext, onBack }: StepProps) {
  const [formData, setFormData] = useState({
    variantName: data.variantName || '',
    description: data.description || '',
    serviceDates: {
      startDate: data.serviceDates?.startDate || '',
      endDate: data.serviceDates?.endDate || ''
    },
    pricing: {
      cost: data.pricing?.cost || '',
      price: data.pricing?.price || '',
      currency: data.pricing?.currency || 'GBP'
    }
  });

  const margin = formData.pricing.price && formData.pricing.cost && parseFloat(formData.pricing.price) > parseFloat(formData.pricing.cost)
    ? ((parseFloat(formData.pricing.price) - parseFloat(formData.pricing.cost)) / parseFloat(formData.pricing.price) * 100).toFixed(1)
    : '0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.variantName || !formData.serviceDates.startDate || !formData.serviceDates.endDate || !formData.pricing.cost || !formData.pricing.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Variant Details</h1>
          <p className="text-muted-foreground mt-2">
            Add details for your new variant
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Variant Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variantName">Variant Name</Label>
              <Input
                id="variantName"
                placeholder="e.g., 3-Day Weekend Pass, Deluxe Room, Private Transfer"
                value={formData.variantName}
                onChange={(e) => setFormData({...formData, variantName: e.target.value})}
              />
              <p className="text-sm text-muted-foreground">
                Clear name for this variant option
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Valid Friday, Saturday & Sunday. Includes paddock access."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <p className="text-sm text-muted-foreground">
                Additional details about this variant
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Service Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.serviceDates.startDate}
                  onChange={(e) => setFormData({...formData, serviceDates: {...formData.serviceDates, startDate: e.target.value}})}
                />
                <p className="text-sm text-muted-foreground">
                  When this variant becomes valid
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.serviceDates.endDate}
                  onChange={(e) => setFormData({...formData, serviceDates: {...formData.serviceDates, endDate: e.target.value}})}
                />
                <p className="text-sm text-muted-foreground">
                  When this variant expires
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cost">Your Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="100.00"
                  value={formData.pricing.cost}
                  onChange={(e) => setFormData({...formData, pricing: {...formData.pricing, cost: e.target.value}})}
                />
                <p className="text-sm text-muted-foreground">
                  What this costs you
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Customer Price</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="150.00"
                  value={formData.pricing.price}
                  onChange={(e) => setFormData({...formData, pricing: {...formData.pricing, price: e.target.value}})}
                />
                <p className="text-sm text-muted-foreground">
                  What customers pay
                </p>
              </div>
            </div>

            {formData.pricing.price && formData.pricing.cost && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Margin: £{(parseFloat(formData.pricing.price) - parseFloat(formData.pricing.cost)).toFixed(2)} ({margin}%)
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button type="submit">
            Continue →
          </Button>
        </div>
      </form>
  );
}

// Step 3: Availability
function Step3Availability({ data, onNext, onBack }: StepProps) {
  const [availabilityData, setAvailabilityData] = useState({
    quantity: data.availability?.quantity || '',
    model: data.availability?.model || 'fixed'
  });

  const availabilityModels = [
    {
      id: 'fixed',
      title: 'Fixed Quantity',
      description: 'Set a specific number available',
      example: 'Perfect for: Limited tickets, fixed room types',
      recommended: true
    },
    {
      id: 'unlimited',
      title: 'Unlimited (Freesale)',
      description: 'No quantity limit',
      example: 'Perfect for: Open capacity events, flexible services',
    },
    {
      id: 'on-request',
      title: 'On Request',
      description: 'Check availability with supplier',
      example: 'Perfect for: Custom experiences, private services',
    }
  ];

  const handleSubmit = () => {
    onNext({
      ...data,
      availability: availabilityData
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Availability</h1>
        <p className="text-muted-foreground mt-2">
          Set how many of this variant you can sell
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability Model</CardTitle>
          <CardDescription>
            Choose how availability works for this variant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availabilityModels.map(model => (
            <button
              key={model.id}
              onClick={() => setAvailabilityData({...availabilityData, model: model.id as 'fixed' | 'unlimited' | 'on-request'})}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                availabilityData.model === model.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8">
                  {availabilityData.model === model.id ? (
                    <Check className="w-6 h-6 text-primary" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-muted-foreground rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{model.title}</h3>
                    {model.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {model.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {model.example}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {availabilityData.model === 'fixed' && (
        <Card>
          <CardHeader>
            <CardTitle>Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="quantity">Available Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="50"
                value={availabilityData.quantity}
                onChange={(e) => setAvailabilityData({...availabilityData, quantity: e.target.value})}
              />
              <p className="text-sm text-muted-foreground">
                How many of this variant you can sell
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleSubmit}>
          Create Variant →
        </Button>
      </div>
    </div>
  );
}

// Main Variant Wizard Component
export function VariantWizard({ 
  onComplete, 
  preselectedProductId 
}: { 
  onComplete: (data: any) => void;
  preselectedProductId?: string;
}) {
  const [step, setStep] = useState(preselectedProductId ? 2 : 1);
  const [wizardData, setWizardData] = useState<Partial<VariantWizardData>>({
    productId: preselectedProductId || undefined
  });
  
  const steps = [
    { number: 1, title: 'Select Product', component: Step1SelectProduct },
    { number: 2, title: 'Variant Details', component: Step2VariantDetails },
    { number: 3, title: 'Availability', component: Step3Availability }
  ];
  
  const CurrentStepComponent = steps[step - 1].component;
  
  const nextStep = (data: any) => {
    const newData = { ...wizardData, ...data };
    setWizardData(newData);
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      // Last step - create the variant
      handleCreateVariant(newData);
    }
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreateVariant = async (data: VariantWizardData) => {
    try {
      const response = await fetch('/api/products/variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('✅ Variant created successfully!');
        onComplete(result);
      } else {
        toast.error(result.error || 'Failed to create variant');
      }
    } catch (error) {
      console.error('Error creating variant:', error);
      toast.error('Failed to create variant');
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Progress Indicator */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold">Add New Variant</h2>
            </div>
            <div className="flex items-center gap-2">
              {steps.map((stepItem, index) => (
                <div key={stepItem.number} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepItem.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > stepItem.number ? '✓' : stepItem.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      step > stepItem.number ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Step Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <CurrentStepComponent
            data={wizardData}
            onNext={nextStep}
            onBack={prevStep}
            isFirstStep={step === 1}
            isLastStep={step === steps.length}
            preselectedProductId={preselectedProductId}
          />
        </div>
      </div>
    </div>
  );
}
