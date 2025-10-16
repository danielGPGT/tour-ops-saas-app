'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Ticket, Car, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SimpleProductWizardPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productType: '',
    productName: '',
    supplier: '',
    cost: '',
    price: '',
    quantity: '',
    dateFrom: '',
    dateTo: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const productTypes = [
    { id: 'accommodation', title: 'Hotel / Accommodation', icon: Building2, description: 'Hotels, hostels, apartments' },
    { id: 'activity', title: 'Activity / Experience', icon: Ticket, description: 'Tours, excursions, attractions' },
    { id: 'transfer', title: 'Transfer / Transport', icon: Car, description: 'Airport transfers, shuttles' },
    { id: 'package', title: 'Multi-Day Package', icon: Package, description: 'Complete tours with multiple components' }
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`✅ ${formData.productName} created successfully!`);
    setIsCreating(false);
    
    // Reset form
    setStep(1);
    setFormData({
      productType: '',
      productName: '',
      supplier: '',
      cost: '',
      price: '',
      quantity: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMargin = () => {
    const cost = parseFloat(formData.cost);
    const price = parseFloat(formData.price);
    if (cost && price && price > cost) {
      return ((price - cost) / price * 100).toFixed(1);
    }
    return '0';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > stepNum ? '✓' : stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      step > stepNum ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && 'What are you selling?'}
                {step === 2 && 'Basic Details'}
                {step === 3 && 'Pricing & Availability'}
                {step === 4 && 'Review & Create'}
              </CardTitle>
              <CardDescription>
                {step === 1 && 'Choose the type of product you want to add'}
                {step === 2 && 'Tell us about your product'}
                {step === 3 && 'Set your pricing and availability'}
                {step === 4 && 'Everything look good?'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Step 1: Product Type */}
              {step === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {productTypes.map(type => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => updateFormData('productType', type.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          formData.productType === type.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
                        }`}
                      >
                        <IconComponent className="w-8 h-8 text-primary mb-2" />
                        <h3 className="font-semibold">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 2: Basic Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => updateFormData('productName', e.target.value)}
                      placeholder="e.g., Grand Hotel Paris"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => updateFormData('supplier', e.target.value)}
                      placeholder="e.g., Hotel ABC Ltd"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing & Availability */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="cost">Your Cost (£)</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => updateFormData('cost', e.target.value)}
                        placeholder="100.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="price">Customer Price (£)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => updateFormData('price', e.target.value)}
                        placeholder="150.00"
                      />
                    </div>
                  </div>
                  
                  {formData.cost && formData.price && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Margin:</strong> £{(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)} ({getMargin()}%)
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="quantity">Available Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => updateFormData('quantity', e.target.value)}
                      placeholder="100"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="dateFrom">Available From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={formData.dateFrom}
                        onChange={(e) => updateFormData('dateFrom', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateTo">Available To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={formData.dateTo}
                        onChange={(e) => updateFormData('dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Product Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{productTypes.find(t => t.id === formData.productType)?.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span>{formData.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Supplier:</span>
                          <span>{formData.supplier}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost:</span>
                          <span>£{formData.cost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span>£{formData.price}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Margin:</span>
                          <span>{getMargin()}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity:</span>
                          <span>{formData.quantity} per day</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={step === 1}
                >
                  ← Back
                </Button>
                
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !formData.productType) ||
                    (step === 2 && (!formData.productName || !formData.supplier)) ||
                    (step === 3 && (!formData.cost || !formData.price || !formData.quantity)) ||
                    isCreating
                  }
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : step === 4 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Create Product
                    </>
                  ) : (
                    'Continue →'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
