'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Loader2, TrendingUp, Calculator, Info, Calendar, Sparkles, Trash2, Building2, Ticket, Car, Package, BarChart3, Infinity, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useWizardData } from '@/lib/hooks/useWizardData';

// Schema for the complete wizard data
const productWizardSchema = z.object({
  productType: z.enum(['accommodation', 'activity', 'transfer', 'package']),
  productName: z.string().min(2, 'Product name is required'),
  supplier: z.object({
    id: z.number().optional(),
    name: z.string().optional()
  }).refine(data => data.id || data.name, 'Supplier is required'),
  location: z.string().optional(),
  roomType: z.string().optional(),
  pricing: z.object({
    cost: z.string().min(1, 'Cost is required'),
    price: z.string().min(1, 'Price is required'),
    occupancy: z.object({
      single: z.string().optional(),
      additional: z.string().optional()
    }).optional(),
    taxes: z.array(z.object({
      name: z.string(),
      amount: z.string(),
      type: z.string()
    })).optional()
  }),
  availability: z.object({
    model: z.enum(['fixed', 'unlimited', 'on-request']),
    quantity: z.number().optional(),
    sharedPool: z.boolean().optional(),
    releaseTime: z.string().optional(),
    dateFrom: z.string(),
    dateTo: z.string()
  })
});

type ProductWizardData = z.infer<typeof productWizardSchema>;

interface StepProps {
  data: Partial<ProductWizardData>;
  onNext: (data: any) => void;
  onBack: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  form?: any;
}

// Main Wizard Component
export function ProductWizard({ onComplete }: { onComplete: (data: any) => void }) {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<ProductWizardData>>({});
  const { productTypes, suppliers, loading, error, fetchProductSubtypes, createSupplier } = useWizardData();
  
  const form = useForm<ProductWizardData>({
    resolver: zodResolver(productWizardSchema),
    defaultValues: wizardData as ProductWizardData
  });
  
  const steps = [
    { number: 1, title: 'Product Type', component: Step1ProductType },
    { number: 2, title: 'Basic Details', component: Step2BasicDetails },
    { number: 3, title: 'Pricing', component: Step3Pricing },
    { number: 4, title: 'Availability', component: Step4Availability },
    { number: 5, title: 'Review', component: Step5Review }
  ];
  
  const CurrentStepComponent = steps[step - 1].component;
  
  const nextStep = (data: any) => {
    const newData = { ...wizardData, ...data };
    setWizardData(newData);
    
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      // Last step - create the product
      onComplete(newData);
    }
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading wizard data...</p>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-500 text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold">Failed to Load Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Progress Indicator */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold
                    ${step > s.number ? 'bg-primary text-primary-foreground' : 
                      step === s.number ? 'bg-primary text-primary-foreground' : 
                      'bg-muted text-muted-foreground'}
                  `}>
                    {step > s.number ? '✓' : s.number}
                  </div>
                  <div className="mt-2 text-xs font-medium text-center">
                    {s.title}
                  </div>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    step > s.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
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
            form={form}
            productTypes={productTypes}
            suppliers={suppliers}
            fetchProductSubtypes={fetchProductSubtypes}
            createSupplier={createSupplier}
          />
        </div>
      </div>
    </div>
  );
}

// Step 1: Product Type Selection
function Step1ProductType({ onNext, ...props }: StepProps & { productTypes: any[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const { productTypes } = props;
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">What are you selling?</h1>
        <p className="text-muted-foreground mt-2">
          Choose the type of product you want to add
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {productTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelected(type.id)}
            className={`
              relative p-6 rounded-lg border-2 text-left transition-all
              hover:border-primary hover:shadow-md
              ${selected === type.id ? 'border-primary bg-primary/5' : 'border-border'}
            `}
          >
            {type.popular && (
              <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                Popular
              </span>
            )}
            {type.badge && (
              <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {type.badge}
              </span>
            )}
            
            <div className="mb-3 flex justify-center">
              {type.icon === 'Building2' && <Building2 className="w-12 h-12 text-primary" />}
              {type.icon === 'Ticket' && <Ticket className="w-12 h-12 text-primary" />}
              {type.icon === 'Car' && <Car className="w-12 h-12 text-primary" />}
              {type.icon === 'Package' && <Package className="w-12 h-12 text-primary" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">{type.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">
              {type.description}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Examples:</span> {type.examples}
            </p>
            
            {selected === type.id && (
              <div className="absolute bottom-4 right-4">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
      
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={() => onNext({ productType: selected })}
          disabled={!selected}
        >
          Continue →
        </Button>
      </div>
    </div>
  );
}

// Step 2: Basic Details (context-aware based on product type)
function Step2BasicDetails({ data, onNext, onBack, ...props }: StepProps & { 
  suppliers: any[], 
  fetchProductSubtypes: (type: string) => Promise<any[]>,
  createSupplier: (data: any) => Promise<any>
}) {
  const [showSupplierCreate, setShowSupplierCreate] = useState(false);
  const [subtypes, setSubtypes] = useState<any[]>([]);
  const [subtypesLoading, setSubtypesLoading] = useState(false);
  const { suppliers, fetchProductSubtypes, createSupplier } = props;
  
  const form = useForm({
    defaultValues: {
      productName: data.productName || '',
      supplier: data.supplier || null,
      location: data.location || '',
      roomType: data.roomType || ''
    }
  });

  // Load subtypes when product type changes
  useEffect(() => {
    if (data.productType) {
      setSubtypesLoading(true);
      fetchProductSubtypes(data.productType).then(fetchedSubtypes => {
        setSubtypes(fetchedSubtypes);
        setSubtypesLoading(false);
      }).catch(() => {
        setSubtypesLoading(false);
      });
    }
  }, [data.productType, fetchProductSubtypes]);
  
  // Context-aware labels based on product type
  const labelConfigs = {
    accommodation: {
      productName: 'Hotel or Property Name',
      placeholder: 'e.g., Grand Hotel Paris',
      variant: 'Room Type'
    },
    activity: {
      productName: 'Activity Name',
      placeholder: 'e.g., Eiffel Tower Skip-the-Line Tour',
      variant: 'Ticket Type'
    },
    transfer: {
      productName: 'Transfer Name',
      placeholder: 'e.g., Airport to City Center',
      variant: 'Vehicle Type'
    },
    package: {
      productName: 'Package Name',
      placeholder: 'e.g., 7-Day Italy Highlights Tour',
      variant: 'Package Type'
    }
  } as const;
  
  const labels = data.productType ? labelConfigs[data.productType] || labelConfigs.accommodation : labelConfigs.accommodation;
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Let's get the basics</h2>
          <p className="text-muted-foreground mt-1">
            Tell us about your {data.productType}
          </p>
        </div>
        
        {/* Product Name */}
        <FormField
          control={form.control}
          name="productName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.productName}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={labels.placeholder}
                  autoFocus
                  className="text-lg"
                />
              </FormControl>
              <FormDescription>
                This is what customers will see
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Supplier (Combobox with inline create) */}
        <FormField
          control={form.control}
          name="supplier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <Select onValueChange={(value) => {
                    const supplier = suppliers.find(s => s.id.toString() === value);
                    field.onChange(supplier || { name: value });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing supplier or create new..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="create-new">
                        ✏️ Create New Supplier
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {field.value?.name && !field.value?.id && (
                    <Input
                      placeholder="Enter supplier name"
                      value={field.value.name}
                      onChange={(e) => field.onChange({ name: e.target.value })}
                    />
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Who provides this product?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Location (for accommodation) */}
        {data.productType === 'accommodation' && (
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Search for city or address..."
                  />
                </FormControl>
                <FormDescription>
                  This helps with availability searches
                </FormDescription>
              </FormItem>
            )}
          />
        )}
        
        {/* Room/Variant Type */}
        <FormField
          control={form.control}
          name="roomType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels.variant}</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={subtypesLoading ? "Loading..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {subtypes.map(subtype => (
                      <SelectItem key={subtype.id} value={subtype.name}>
                        {subtype.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">
                      ✏️ Custom (enter your own)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                You can add more variants later
              </FormDescription>
            </FormItem>
          )}
        />
        
        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button type="submit" size="lg">
            Continue →
          </Button>
        </div>
      </form>
      
      {/* Quick Supplier Create Modal */}
      <Dialog open={showSupplierCreate} onOpenChange={setShowSupplierCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>
              Quick setup - you can add more details later
            </DialogDescription>
          </DialogHeader>
          <QuickSupplierForm
            onSuccess={async (supplierData) => {
              try {
                const newSupplier = await createSupplier(supplierData);
                form.setValue('supplier', newSupplier);
                setShowSupplierCreate(false);
                toast.success('Supplier created successfully!');
              } catch (error) {
                toast.error('Failed to create supplier');
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
}

// Step 3: Pricing (the most complex step - keep it simple!)
function Step3Pricing({ data, onNext, onBack }: StepProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  
  const form = useForm({
    defaultValues: {
      cost: data.pricing?.cost || '',
      price: data.pricing?.price || '',
      occupancy: data.pricing?.occupancy || {
        single: '',
        additional: ''
      },
      taxes: data.pricing?.taxes || []
    }
  });
  
  const cost = form.watch('cost');
  const price = form.watch('price');
  const margin = cost && price ? ((parseFloat(price) - parseFloat(cost)) / parseFloat(price) * 100).toFixed(1) : '0';
  const marginAmount = cost && price ? (parseFloat(price) - parseFloat(cost)).toFixed(2) : '0';
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Set your pricing</h2>
          <p className="text-muted-foreground mt-1">
            Simple pricing to get started
          </p>
        </div>
        
        {/* Cost & Price */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Cost</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="pl-7 text-lg"
                      placeholder="100.00"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  What the supplier charges you
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Price</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      £
                    </span>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="pl-7 text-lg"
                      placeholder="150.00"
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  What customers pay
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        {/* Live Margin Calculator */}
        {cost && price && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertTitle>Your Margin</AlertTitle>
            <AlertDescription>
              <span className="text-2xl font-bold">£{marginAmount}</span>
              <span className="text-muted-foreground ml-2">({margin}%)</span>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Occupancy Pricing (for accommodation) */}
        {data.productType === 'accommodation' && (
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <div>
              <h3 className="font-semibold">Guest Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Adjust prices based on number of guests
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Single Occupancy */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm">1 person</Label>
                  <p className="text-xs text-muted-foreground">Single occupancy</p>
                </div>
                <div className="w-32">
                  <FormField
                    control={form.control}
                    name="occupancy.single"
                    render={({ field }) => (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="pl-6"
                          placeholder="130"
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="w-24 text-xs text-muted-foreground">
                  {form.watch('occupancy.single') && price && (
                    `-£${(parseFloat(price) - parseFloat(form.watch('occupancy.single') || '0')).toFixed(0)}`
                  )}
                </div>
              </div>
              
              {/* Base (2 people) */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm">2 people (base)</Label>
                  <p className="text-xs text-muted-foreground">Double occupancy</p>
                </div>
                <div className="w-32">
                  <Input
                    value={price || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="w-24">
                  <Badge variant="secondary">Base price</Badge>
                </div>
              </div>
              
              {/* Additional Person */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label className="text-sm">Each additional person</Label>
                  <p className="text-xs text-muted-foreground">3rd, 4th person, etc.</p>
                </div>
                <div className="w-32">
                  <FormField
                    control={form.control}
                    name="occupancy.additional"
                    render={({ field }) => (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+£</span>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="pl-8"
                          placeholder="30"
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="w-24 text-xs text-muted-foreground">
                  per person
                </div>
              </div>
              
              {/* Live Preview */}
              {price && form.watch('occupancy.additional') && (
                <Alert className="mt-3">
                  <Calculator className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Example:</strong> 2 adults + 1 child = £{
                      (parseFloat(price) + parseFloat(form.watch('occupancy.additional') || '0')).toFixed(2)
                    }/night
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
        
        {/* Taxes & Fees */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Taxes & Fees</h3>
              <p className="text-sm text-muted-foreground">Optional - add if applicable</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const taxes = form.getValues('taxes');
                form.setValue('taxes', [
                  ...taxes,
                  { name: '', amount: '', type: 'per_person_per_night' }
                ]);
              }}
            >
              + Add Tax/Fee
            </Button>
          </div>
          
          {form.watch('taxes').map((tax, index) => (
            <div key={index} className="flex items-end gap-3 p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="text-sm">Name</Label>
                <Input
                  value={tax.name}
                  onChange={(e) => {
                    const taxes = form.getValues('taxes');
                    taxes[index].name = e.target.value;
                    form.setValue('taxes', taxes);
                  }}
                  placeholder="e.g., City Tax"
                />
              </div>
              
              <div className="w-32">
                <Label className="text-sm">Amount</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-6"
                    value={tax.amount}
                    onChange={(e) => {
                      const taxes = form.getValues('taxes');
                      taxes[index].amount = e.target.value;
                      form.setValue('taxes', taxes);
                    }}
                    placeholder="6.00"
                  />
                </div>
              </div>
              
              <div className="w-48">
                <Label className="text-sm">Applied per</Label>
                <Select
                  value={tax.type}
                  onValueChange={(value) => {
                    const taxes = form.getValues('taxes');
                    taxes[index].type = value;
                    form.setValue('taxes', taxes);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_person_per_night">Person per night</SelectItem>
                    <SelectItem value="per_booking">Booking</SelectItem>
                    <SelectItem value="per_night">Night</SelectItem>
                    <SelectItem value="percentage">% of total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const taxes = form.getValues('taxes');
                  form.setValue('taxes', taxes.filter((_, i) => i !== index));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {/* Advanced Mode Toggle */}
        <div className="p-4 border-t">
          <button
            type="button"
            onClick={() => setMode('advanced')}
            className="text-sm text-primary hover:underline"
          >
            Need seasonal pricing, channel-specific rates, or complex rules? 
            <span className="font-semibold ml-1">Switch to Advanced Mode →</span>
          </button>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button type="submit" size="lg">
            Continue →
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 4: Availability
function Step4Availability({ data, onNext, onBack }: StepProps) {
  const [selectedModel, setSelectedModel] = useState<string>(data.availability?.model || 'fixed');
  
  const form = useForm({
    defaultValues: {
      model: data.availability?.model || 'fixed',
      quantity: data.availability?.quantity || 100,
      sharedPool: data.availability?.sharedPool || false,
      releaseTime: data.availability?.releaseTime || '24',
      dateFrom: data.availability?.dateFrom || new Date().toISOString().split('T')[0],
      dateTo: data.availability?.dateTo || 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });
  
  const availabilityModels = [
    {
      id: 'fixed',
      title: 'Fixed Quantity',
      icon: 'BarChart3',
      description: 'You have a set number available each day',
      example: 'Perfect for: Hotels with 50 rooms, tours with 20 seats',
      recommended: true,
      fields: ['quantity', 'sharedPool']
    },
    {
      id: 'unlimited',
      title: 'Unlimited (Freesale)',
      icon: 'Infinity',
      description: 'Supplier has unlimited availability',
      example: 'Perfect for: Large hotels, attractions with no capacity limits',
      fields: ['releaseTime']
    },
    {
      id: 'on-request',
      title: 'On Request',
      icon: 'Phone',
      description: 'Check with supplier for each booking',
      example: 'Perfect for: Private tours, custom experiences',
      badge: 'Manual',
      fields: []
    }
  ];
  
  const quickDateRanges = [
    {
      label: 'Next 6 months',
      getValue: () => ({
        from: new Date().toISOString().split('T')[0],
        to: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    },
    {
      label: 'This year',
      getValue: () => ({
        from: new Date().toISOString().split('T')[0],
        to: `${new Date().getFullYear()}-12-31`
      })
    },
    {
      label: 'Next year',
      getValue: () => {
        const nextYear = new Date().getFullYear() + 1;
        return {
          from: `${nextYear}-01-01`,
          to: `${nextYear}-12-31`
        };
      }
    }
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Set availability</h2>
          <p className="text-muted-foreground mt-1">
            How do you manage inventory for this product?
          </p>
        </div>
        
        {/* Availability Model Selection */}
        <div className="space-y-3">
          {availabilityModels.map(model => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                setSelectedModel(model.id);
                form.setValue('model', model.id as 'fixed' | 'unlimited' | 'on-request');
              }}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-all
                hover:border-primary hover:shadow-md
                ${selectedModel === model.id ? 'border-primary bg-primary/5' : 'border-border'}
              `}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12">
                  {model.icon === 'BarChart3' && <BarChart3 className="w-8 h-8 text-primary" />}
                  {model.icon === 'Infinity' && <Infinity className="w-8 h-8 text-primary" />}
                  {model.icon === 'Phone' && <Phone className="w-8 h-8 text-primary" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{model.title}</h3>
                    {model.recommended && (
                      <Badge variant="secondary" className="text-xs">Recommended</Badge>
                    )}
                    {model.badge && (
                      <Badge variant="outline" className="text-xs">{model.badge}</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {model.description}
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Example:</span> {model.example}
                  </p>
                </div>
                
                {selectedModel === model.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* Model-specific fields */}
        {selectedModel === 'fixed' && (
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How many per day?</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      className="text-lg"
                      placeholder="100"
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Available quantity per night (reduces automatically as bookings come in)
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {data.productType === 'accommodation' && (
              <FormField
                control={form.control}
                name="sharedPool"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel>Shared inventory pool</FormLabel>
                      <FormDescription className="text-xs">
                        Enable if double/twin/triple rooms share the same {form.watch('quantity')} allocation
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            
            {form.watch('sharedPool') && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  When enabled, booking any room type (double, twin, etc.) will reduce 
                  the shared pool of {form.watch('quantity')} rooms.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
        
        {selectedModel === 'unlimited' && (
          <div className="space-y-4 p-4 border rounded-lg bg-card">
            <FormField
              control={form.control}
              name="releaseTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier confirmation time</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Within 1 hour</SelectItem>
                        <SelectItem value="24">Within 24 hours</SelectItem>
                        <SelectItem value="48">Within 48 hours</SelectItem>
                        <SelectItem value="168">Within 1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    How quickly does the supplier typically confirm?
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        )}
        
        {selectedModel === 'on-request' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Manual confirmation required</AlertTitle>
            <AlertDescription>
              Each booking will require you to manually check availability with the supplier 
              before confirming to the customer.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Date Range */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Available dates</Label>
            <p className="text-sm text-muted-foreground mt-1">
              When is this product available for booking?
            </p>
          </div>
          
          {/* Quick Selectors */}
          <div className="flex gap-2">
            {quickDateRanges.map(range => (
              <Button
                key={range.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const dates = range.getValue();
                  form.setValue('dateFrom', dates.from);
                  form.setValue('dateTo', dates.to);
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          {/* Custom Date Pickers */}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dateFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dateTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription className="text-sm">
              You can add more date ranges, blackout dates, and seasonal variations later
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button type="submit" size="lg">
            Continue →
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Step 5: Review & Create
function Step5Review({ data, onNext, onBack, isLastStep }: StepProps) {
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreate = async () => {
    setIsCreating(true);
    try {
      // This would call the actual ProductService
      const result = await createProductFromWizard(data);
      onNext(result);
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  // Calculate summary stats
  const margin = data.pricing?.price && data.pricing?.cost
    ? ((parseFloat(data.pricing.price) - parseFloat(data.pricing.cost)) / parseFloat(data.pricing.price) * 100).toFixed(1)
    : '0';
  
  const dateCount = data.availability?.dateFrom && data.availability?.dateTo
    ? Math.ceil(
        (new Date(data.availability.dateTo).getTime() - new Date(data.availability.dateFrom).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    : 0;
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & create</h2>
        <p className="text-muted-foreground mt-1">
          Everything look good? You can edit details after creation.
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="space-y-4">
        {/* Product Details */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Product Details</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onBack()}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{data.productType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{data.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supplier</span>
              <span className="font-medium">{data.supplier?.name || 'New Supplier'}</span>
            </div>
            {data.roomType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Variant</span>
                <span className="font-medium">{data.roomType}</span>
              </div>
            )}
            {data.location && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{data.location}</span>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onBack()}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cost → Price</span>
              <div className="text-right">
                <div className="font-medium">
                  £{data.pricing?.cost} → £{data.pricing?.price}
                </div>
                <div className="text-sm text-muted-foreground">
                  £{(parseFloat(data.pricing?.price || '0') - parseFloat(data.pricing?.cost || '0')).toFixed(2)} ({margin}% margin)
                </div>
              </div>
            </div>
            
            {data.pricing?.occupancy?.single && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Single occupancy</span>
                <span className="font-medium">£{data.pricing.occupancy.single}</span>
              </div>
            )}
            
            {data.pricing?.occupancy?.additional && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional person</span>
                <span className="font-medium">+£{data.pricing.occupancy.additional}</span>
              </div>
            )}
            
            {data.pricing?.taxes && data.pricing.taxes.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-sm font-medium mb-2">Taxes & Fees</div>
                {data.pricing.taxes.map((tax, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tax.name}</span>
                    <span>£{tax.amount} {tax.type === 'per_person_per_night' && 'per person/night'}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Availability */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-lg">Availability</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onBack()}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium capitalize">
                {data.availability?.model === 'fixed' && `Fixed (${data.availability.quantity}/day)`}
                {data.availability?.model === 'unlimited' && 'Unlimited (Freesale)'}
                {data.availability?.model === 'on-request' && 'On Request'}
              </span>
            </div>
            
            {data.availability?.sharedPool && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inventory pool</span>
                <Badge variant="secondary">Shared across variants</Badge>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date range</span>
              <span className="font-medium">
                {data.availability?.dateFrom && new Date(data.availability.dateFrom).toLocaleDateString()} - 
                {data.availability?.dateTo && new Date(data.availability.dateTo).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total days</span>
              <span className="font-medium">{dateCount} days</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* What happens next */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>What happens when you create this?</AlertTitle>
        <AlertDescription className="mt-2 space-y-1 text-sm">
          <div>✓ Product added to your inventory</div>
          <div>✓ {dateCount} days of availability created</div>
          <div>✓ Ready to appear in booking searches</div>
          <div>✓ You can add more details later</div>
        </AlertDescription>
      </Alert>
      
      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button
          size="lg"
          onClick={handleCreate}
          disabled={isCreating}
          className="min-w-[200px]"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Product
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Supporting Components

// Quick Supplier Form Component
function QuickSupplierForm({ onSuccess }: { onSuccess: (supplier: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supplier = {
      id: Date.now(), // temporary ID
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    };
    onSuccess(supplier);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="supplier-name">Supplier Name</Label>
        <Input
          id="supplier-name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Hotel ABC Ltd"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="supplier-email">Email</Label>
        <Input
          id="supplier-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="contact@hotelabc.com"
        />
      </div>
      
      <div>
        <Label htmlFor="supplier-phone">Phone</Label>
        <Input
          id="supplier-phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="+44 20 1234 5678"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!formData.name}>
          Add Supplier
        </Button>
      </div>
    </form>
  );
}

// Function to create product from wizard data via API
async function createProductFromWizard(data: any) {
  const response = await fetch('/api/products/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create product');
  }

  return await response.json();
}
