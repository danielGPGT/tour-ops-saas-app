'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Hotel, 
  MapPin, 
  Calendar, 
  Car, 
  DollarSign, 
  Users, 
  Percent, 
  Plus, 
  Minus,
  Check,
  ArrowRight,
  ArrowLeft,
  FileText,
  Settings,
  CalendarDays,
  Baby,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Smart Templates for Different Product Types
const RATE_PLAN_TEMPLATES = {
  accommodation: {
    name: 'Hotel Room Rate',
    icon: Hotel,
    description: 'Perfect for hotels, B&Bs, and accommodation providers',
    fields: {
      basePrice: { label: 'Base Price per Night', required: true, type: 'currency' },
      singleOccupancy: { label: 'Single Occupancy Price', required: false, type: 'currency' },
      extraPerson: { label: 'Extra Person Charge', required: false, type: 'currency' },
      cityTax: { label: 'City Tax (per person per night)', required: false, type: 'currency' },
      minStay: { label: 'Minimum Stay (nights)', required: false, type: 'number' },
      maxStay: { label: 'Maximum Stay (nights)', required: false, type: 'number' }
    },
    defaults: {
      pricingModel: 'base_plus_pax',
      channels: ['b2c', 'b2b'],
      occupancy: { min: 1, max: 4 }
    }
  },
  activity: {
    name: 'Activity Rate',
    icon: MapPin,
    description: 'Great for tours, excursions, and activities',
    fields: {
      price: { label: 'Price per Person', required: true, type: 'currency' },
      duration: { label: 'Duration (hours)', required: false, type: 'number' },
      minPax: { label: 'Minimum Group Size', required: false, type: 'number' },
      maxPax: { label: 'Maximum Group Size', required: false, type: 'number' },
      meetingPoint: { label: 'Meeting Point', required: false, type: 'text' }
    },
    defaults: {
      pricingModel: 'per_person',
      channels: ['b2c'],
      occupancy: { min: 1, max: 50 }
    }
  },
  event: {
    name: 'Event Ticket Rate',
    icon: Calendar,
    description: 'Ideal for concerts, festivals, and events',
    fields: {
      price: { label: 'Ticket Price', required: true, type: 'currency' },
      eventDate: { label: 'Event Date', required: true, type: 'date' },
      eventEndDate: { label: 'Event End Date', required: false, type: 'date' },
      venue: { label: 'Venue', required: false, type: 'text' },
      ageRestriction: { label: 'Age Restriction', required: false, type: 'text' }
    },
    defaults: {
      pricingModel: 'fixed',
      channels: ['b2c', 'b2b'],
      occupancy: { min: 1, max: 1 }
    }
  },
  transfer: {
    name: 'Transfer Rate',
    icon: Car,
    description: 'Perfect for airport transfers and transportation',
    fields: {
      price: { label: 'Price per Vehicle', required: true, type: 'currency' },
      capacity: { label: 'Vehicle Capacity (people)', required: true, type: 'number' },
      duration: { label: 'Journey Time (minutes)', required: false, type: 'number' },
      pickupPoints: { label: 'Pickup Points', required: false, type: 'text' }
    },
    defaults: {
      pricingModel: 'fixed',
      channels: ['b2c', 'b2b'],
      occupancy: { min: 1, max: 8 }
    }
  }
};

interface SimpleRatePlan {
  id: string;
  name: string;
  template: keyof typeof RATE_PLAN_TEMPLATES;
  supplier: { id: string; name: string };
  contractReference: string;
  pricing: {
    currency: string;
    cost: number;
    markupPercentage: number;
    sellingPrice: number;
    fields: Record<string, any>;
  };
  channels: string[];
  markets: string[];
  validity: {
    from: string;
    to: string;
  };
  occupancy: {
    min: number;
    max: number;
  };
  seasons: Array<{
    id: string;
    seasonFrom: string;
    seasonTo: string;
    dowMask: number;
    minStay?: number;
    maxStay?: number;
    minPax?: number;
    maxPax?: number;
  }>;
  occupancies: Array<{
    id: string;
    minOccupancy: number;
    maxOccupancy: number;
    pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
    baseAmount: number;
    perPersonAmount?: number;
  }>;
  ageBands: Array<{
    id: string;
    label: string;
    minAge: number;
    maxAge: number;
    priceType: string;
    value: number;
  }>;
  taxes: Array<{
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    inclusive: boolean;
  }>;
  customAttributes: Record<string, any>;
  notes: string;
  preferred: boolean;
}

interface WizardData {
  mode: 'new' | 'existing';
  productType: string;
  productName: string;
  variantName: string;
  customAttributes?: Record<string, any>;
  ratePlans: SimpleRatePlan[];
  availability: {
    allocationModel: string;
    dateFrom: string;
    dateTo: string;
    quantity: number;
    allowOverbooking: boolean;
    overbookingLimit?: number;
  };
}

interface SimpleRatePlanWizardProps {
  preselectedProduct?: {
    id: number;
    name: string;
    type: string;
  };
  existingVariant?: any;
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export function SimpleRatePlanWizard({ preselectedProduct, existingVariant, onComplete, onCancel }: SimpleRatePlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    mode: preselectedProduct ? 'existing' : 'new',
    productType: preselectedProduct?.type || '',
    productName: preselectedProduct?.name || '',
    variantName: '',
    ratePlans: [],
    availability: {
      allocationModel: 'committed',
      dateFrom: '',
      dateTo: '',
      quantity: 1,
      allowOverbooking: false
    }
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await fetch('/api/wizard/suppliers');
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const steps = preselectedProduct ? [
    { title: 'Variant Details', description: 'Set variant name and details' },
    { title: 'Rate Plan Template', description: 'Choose your rate plan type' },
    { title: 'Pricing & Details', description: 'Set pricing and basic information' },
    { title: 'Availability', description: 'Configure inventory and availability' }
  ] : [
    { title: 'Product Type', description: 'Choose your product type' },
    { title: 'Variant Details', description: 'Set variant name and details' },
    { title: 'Rate Plan Template', description: 'Choose your rate plan type' },
    { title: 'Pricing & Details', description: 'Set pricing and basic information' },
    { title: 'Availability', description: 'Configure inventory and availability' }
  ];

  const createNewRatePlan = (template: keyof typeof RATE_PLAN_TEMPLATES): SimpleRatePlan => {
    const templateConfig = RATE_PLAN_TEMPLATES[template];
    return {
      id: `plan_${Date.now()}`,
      name: templateConfig.name,
      template,
      supplier: { id: '', name: '' },
      contractReference: '',
      pricing: {
        currency: 'GBP',
        cost: 0,
        markupPercentage: 20,
        sellingPrice: 0,
        fields: Object.keys(templateConfig.fields).reduce((acc, key) => {
          acc[key] = (templateConfig.fields as any)[key].type === 'number' ? 0 : '';
          return acc;
        }, {} as Record<string, any>)
      },
      channels: [...templateConfig.defaults.channels],
      markets: ['uk'],
      validity: {
        from: data.availability.dateFrom || '',
        to: data.availability.dateTo || ''
      },
      occupancy: { ...templateConfig.defaults.occupancy },
      seasons: [{
        id: `season_${Date.now()}`,
        seasonFrom: data.availability.dateFrom || '',
        seasonTo: data.availability.dateTo || '',
        dowMask: 127, // All days of week
        minStay: undefined,
        maxStay: undefined,
        minPax: undefined,
        maxPax: undefined
      }],
      occupancies: [{
        id: `occupancy_${Date.now()}`,
        minOccupancy: templateConfig.defaults.occupancy.min,
        maxOccupancy: templateConfig.defaults.occupancy.max,
        pricingModel: templateConfig.defaults.pricingModel as 'fixed' | 'base_plus_pax' | 'per_person',
        baseAmount: 0,
        perPersonAmount: undefined
      }],
      ageBands: [],
      taxes: [],
      customAttributes: {},
      notes: '',
      preferred: true
    };
  };

  const addRatePlan = (template: keyof typeof RATE_PLAN_TEMPLATES) => {
    const newPlan = createNewRatePlan(template);
    setData(prev => ({
      ...prev,
      ratePlans: [...prev.ratePlans, newPlan]
    }));
  };

  const updateRatePlan = (planId: string, updates: Partial<SimpleRatePlan>) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      )
    }));
  };

  const removeRatePlan = (planId: string) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.filter(plan => plan.id !== planId)
    }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create the rate plan
      try {
        const response = await fetch('/api/products/variants/simple-rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create rate plan');
        }

        const result = await response.json();
        console.log('Rate plan created successfully:', result);
        onComplete(data);
      } catch (error) {
        console.error('Error creating rate plan:', error);
        alert(`Failed to create rate plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        if (preselectedProduct) {
          return <VariantDetailsStep data={data} onUpdate={setData} onNext={handleNext} preselectedProduct={preselectedProduct} />;
        } else {
          return <ProductTypeStep data={data} onUpdate={setData} onNext={handleNext} />;
        }
      case 1:
        if (preselectedProduct) {
          return <RatePlanTemplateStep data={data} onUpdate={setData} onNext={handleNext} />;
        } else {
          return <VariantDetailsStep data={data} onUpdate={setData} onNext={handleNext} preselectedProduct={preselectedProduct} />;
        }
      case 2:
        if (preselectedProduct) {
          return <PricingDetailsStep 
            data={data} 
            onUpdate={setData} 
            suppliers={suppliers}
            loadingSuppliers={loadingSuppliers}
            onNext={handleNext} 
          />;
        } else {
          return <RatePlanTemplateStep data={data} onUpdate={setData} onNext={handleNext} />;
        }
      case 3:
        if (preselectedProduct) {
          return <AvailabilityStep data={data} onUpdate={setData} onNext={handleNext} />;
        } else {
          return <PricingDetailsStep 
            data={data} 
            onUpdate={setData} 
            suppliers={suppliers}
            loadingSuppliers={loadingSuppliers}
            onNext={handleNext} 
          />;
        }
      case 4:
        return <AvailabilityStep data={data} onUpdate={setData} onNext={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <div className="inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
            <h2 className="text-2xl font-bold">
              {existingVariant ? 'Edit Variant' : 'Create Product Variant'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {existingVariant ? 'Update your variant settings' : 'Create a new product variant with its first rate plan'}
            </p>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              ✕
            </Button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-between">
          <Button variant="outline" onClick={currentStep === 0 ? onCancel : handlePrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </Button>
          <Button onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Create Variant' : 'Continue'}
            {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Step 1: Product Type Selection (only if no preselected product)
function ProductTypeStep({ data, onUpdate, onNext }: {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
  onNext: () => void;
}) {
  const handleProductTypeSelect = (type: string) => {
    onUpdate({ ...data, productType: type });
  };

  const productTypes = [
    { key: 'accommodation', name: 'Accommodation', icon: Hotel, description: 'Hotels, B&Bs, apartments' },
    { key: 'activity', name: 'Activity', icon: MapPin, description: 'Tours, excursions, experiences' },
    { key: 'event', name: 'Event', icon: Calendar, description: 'Concerts, festivals, shows' },
    { key: 'transfer', name: 'Transfer', icon: Car, description: 'Airport transfers, transport' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">What type of product are you creating?</h3>
        <p className="text-muted-foreground">Choose the category that best fits your product</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {productTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                data.productType === type.key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleProductTypeSelect(type.key)}
            >
              <CardContent className="p-6 text-center space-y-3">
                <Icon className="w-8 h-8 mx-auto text-primary" />
                <h4 className="font-semibold">{type.name}</h4>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center">
        <Button 
          onClick={onNext} 
          disabled={!data.productType}
          className="min-w-[200px]"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

// Step 2: Rate Plan Template Selection
function RatePlanTemplateStep({ data, onUpdate, onNext }: {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
  onNext: () => void;
}) {
  const productType = data.productType || 'accommodation';
  const template = RATE_PLAN_TEMPLATES[productType as keyof typeof RATE_PLAN_TEMPLATES];

  const handleTemplateSelect = () => {
    addRatePlan(productType as keyof typeof RATE_PLAN_TEMPLATES);
    onNext();
  };

  const addRatePlan = (templateKey: keyof typeof RATE_PLAN_TEMPLATES) => {
    const newPlan = createNewRatePlan(templateKey);
    onUpdate({ ...data, ratePlans: [...data.ratePlans, newPlan] });
  };

  const createNewRatePlan = (template: keyof typeof RATE_PLAN_TEMPLATES): SimpleRatePlan => {
    const templateConfig = RATE_PLAN_TEMPLATES[template];
    return {
      id: `plan_${Date.now()}`,
      name: templateConfig.name,
      template,
      supplier: { id: '', name: '' },
      contractReference: '',
      pricing: {
        currency: 'GBP',
        cost: 0,
        markupPercentage: 20,
        sellingPrice: 0,
        fields: Object.keys(templateConfig.fields).reduce((acc, key) => {
          acc[key] = (templateConfig.fields as any)[key].type === 'number' ? 0 : '';
          return acc;
        }, {} as Record<string, any>)
      },
      channels: [...templateConfig.defaults.channels],
      markets: ['uk'],
      validity: {
        from: data.availability.dateFrom || '',
        to: data.availability.dateTo || ''
      },
      occupancy: { ...templateConfig.defaults.occupancy },
      seasons: [{
        id: `season_${Date.now()}`,
        seasonFrom: data.availability.dateFrom || '',
        seasonTo: data.availability.dateTo || '',
        dowMask: 127, // All days of week
        minStay: undefined,
        maxStay: undefined,
        minPax: undefined,
        maxPax: undefined
      }],
      occupancies: [{
        id: `occupancy_${Date.now()}`,
        minOccupancy: templateConfig.defaults.occupancy.min,
        maxOccupancy: templateConfig.defaults.occupancy.max,
        pricingModel: templateConfig.defaults.pricingModel as 'fixed' | 'base_plus_pax' | 'per_person',
        baseAmount: 0,
        perPersonAmount: undefined
      }],
      ageBands: [],
      taxes: [],
      customAttributes: {},
      notes: '',
      preferred: true
    };
  };

  const Icon = template.icon;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Choose Your Rate Plan Template</h3>
        <p className="text-muted-foreground">We'll pre-configure the pricing fields for you</p>
      </div>

      <Card className="border-2 border-primary">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Icon className="w-12 h-12 text-primary mt-1" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="text-lg font-semibold">{template.name}</h4>
                <p className="text-muted-foreground">{template.description}</p>
              </div>
              
              <div className="space-y-2">
                <h5 className="font-medium">This template includes:</h5>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {Object.entries(template.fields).map(([key, field]) => (
                    <li key={key} className="flex items-center">
                      <Check className="w-3 h-3 mr-2 text-green-600" />
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Capacity: {template.defaults.occupancy.min}-{template.defaults.occupancy.max} people
                </div>
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pricing: {template.defaults.pricingModel}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={handleTemplateSelect} className="min-w-[200px]">
          Use This Template
        </Button>
      </div>
    </div>
  );
}

// Step 3: Pricing & Details
function PricingDetailsStep({ data, onUpdate, suppliers, loadingSuppliers, onNext }: {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
  suppliers: any[];
  loadingSuppliers: boolean;
  onNext: () => void;
}) {
  const ratePlan = data.ratePlans[0];
  if (!ratePlan) return null;

  const template = RATE_PLAN_TEMPLATES[ratePlan.template];

  const updatePricingField = (fieldKey: string, value: any) => {
    const updatedPlan = {
      ...ratePlan,
      pricing: {
        ...ratePlan.pricing,
        fields: {
          ...ratePlan.pricing.fields,
          [fieldKey]: value
        }
      }
    };
    updateRatePlan(ratePlan.id, updatedPlan);
  };

  const updateRatePlan = (planId: string, updates: Partial<SimpleRatePlan>) => {
    onUpdate({
      ...data,
      ratePlans: data.ratePlans.map(plan => 
        plan.id === planId ? { ...plan, ...updates } : plan
      )
    });
  };

  const calculateSellingPrice = () => {
    const cost = ratePlan.pricing.cost;
    const markup = ratePlan.pricing.markupPercentage / 100;
    return cost + (cost * markup);
  };

  const addTax = () => {
    const newTax = {
      name: '',
      type: 'percentage' as const,
      value: 0,
      inclusive: false
    };
    updateRatePlan(ratePlan.id, {
      taxes: [...ratePlan.taxes, newTax]
    });
  };

  const updateTax = (index: number, updates: Partial<typeof ratePlan.taxes[0]>) => {
    const updatedTaxes = [...ratePlan.taxes];
    updatedTaxes[index] = { ...updatedTaxes[index], ...updates };
    updateRatePlan(ratePlan.id, { taxes: updatedTaxes });
  };

  const removeTax = (index: number) => {
    const updatedTaxes = ratePlan.taxes.filter((_, i) => i !== index);
    updateRatePlan(ratePlan.id, { taxes: updatedTaxes });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Set Your Pricing & Details</h3>
        <p className="text-muted-foreground">Configure the pricing structure for your rate plan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rate Plan Name</Label>
              <Input
                value={ratePlan.name}
                onChange={(e) => updateRatePlan(ratePlan.id, { name: e.target.value })}
                placeholder="e.g., Standard Rate, Early Bird"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={ratePlan.pricing.currency}
                  onValueChange={(value) => updateRatePlan(ratePlan.id, {
                    pricing: { ...ratePlan.pricing, currency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  value={ratePlan.pricing.cost}
                  onChange={(e) => updateRatePlan(ratePlan.id, {
                    pricing: { ...ratePlan.pricing, cost: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Markup %</Label>
                <Input
                  type="number"
                  value={ratePlan.pricing.markupPercentage}
                  onChange={(e) => updateRatePlan(ratePlan.id, {
                    pricing: { ...ratePlan.pricing, markupPercentage: parseFloat(e.target.value) || 0 }
                  })}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label>Selling Price</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                  {ratePlan.pricing.currency} {calculateSellingPrice().toFixed(2)}
                </div>
              </div>
            </div>

            {/* Template-specific fields */}
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium">Pricing Details</h4>
              {Object.entries(template.fields).map(([key, field]) => (
                <div key={key} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === 'currency' ? (
                    <Input
                      type="number"
                      value={ratePlan.pricing.fields[key] || ''}
                      onChange={(e) => updatePricingField(key, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  ) : field.type === 'number' ? (
                    <Input
                      type="number"
                      value={ratePlan.pricing.fields[key] || ''}
                      onChange={(e) => updatePricingField(key, parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  ) : field.type === 'date' ? (
                    <Input
                      type="date"
                      value={ratePlan.pricing.fields[key] || ''}
                      onChange={(e) => updatePricingField(key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={ratePlan.pricing.fields[key] || ''}
                      onChange={(e) => updatePricingField(key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Supplier & Advanced */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Supplier & Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={ratePlan.supplier.id}
                onValueChange={(value) => {
                  const supplier = suppliers.find(s => s.id.toString() === value);
                  updateRatePlan(ratePlan.id, {
                    supplier: { id: value, name: supplier?.name || '' }
                  });
                }}
                disabled={loadingSuppliers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSuppliers ? 'Loading suppliers...' : 'Select supplier'} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contract Reference</Label>
              <Input
                value={ratePlan.contractReference}
                onChange={(e) => updateRatePlan(ratePlan.id, { contractReference: e.target.value })}
                placeholder="e.g., CON-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Channels</Label>
              <div className="space-y-2">
                {['b2c', 'b2b'].map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={ratePlan.channels.includes(channel)}
                      onChange={(e) => {
                        const channels = e.target.checked
                          ? [...ratePlan.channels, channel]
                          : ratePlan.channels.filter(c => c !== channel);
                        updateRatePlan(ratePlan.id, { channels });
                      }}
                      className="rounded"
                    />
                    <Label className="text-sm font-normal">
                      {channel === 'b2c' ? 'B2C (Direct to customers)' : 'B2B (Travel agents)'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Occupancy</Label>
                <Input
                  type="number"
                  value={ratePlan.occupancy.min}
                  onChange={(e) => updateRatePlan(ratePlan.id, {
                    occupancy: { ...ratePlan.occupancy, min: parseInt(e.target.value) || 1 }
                  })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Occupancy</Label>
                <Input
                  type="number"
                  value={ratePlan.occupancy.max}
                  onChange={(e) => updateRatePlan(ratePlan.id, {
                    occupancy: { ...ratePlan.occupancy, max: parseInt(e.target.value) || 1 }
                  })}
                  min="1"
                />
              </div>
            </div>

            <Separator />

            {/* Taxes & Fees */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Taxes & Fees</Label>
                <Button size="sm" variant="outline" onClick={addTax}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Tax/Fee
                </Button>
              </div>

              {ratePlan.taxes.map((tax, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                  <Input
                    placeholder="Tax name"
                    value={tax.name}
                    onChange={(e) => updateTax(index, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Select
                    value={tax.type}
                    onValueChange={(value: 'percentage' | 'fixed') => updateTax(index, { type: value })}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="fixed">£</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0"
                    value={tax.value}
                    onChange={(e) => updateTax(index, { value: parseFloat(e.target.value) || 0 })}
                    className="w-20"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeTax(index)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={ratePlan.notes}
                onChange={(e) => updateRatePlan(ratePlan.id, { notes: e.target.value })}
                placeholder="Any additional notes about this rate plan..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Configuration Accordion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Advanced Configuration
          </CardTitle>
          <CardDescription>
            Optional advanced settings for complex pricing scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={[]}>
            <AccordionItem value="seasons">
              <AccordionTrigger>
                <div className="flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Rate Seasons ({ratePlan.seasons.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <RateSeasonsEditor
                  seasons={ratePlan.seasons}
                  onUpdate={(seasons) => updateRatePlan(ratePlan.id, { seasons })}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="occupancies">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Occupancies ({ratePlan.occupancies.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <OccupanciesEditor
                  occupancies={ratePlan.occupancies}
                  onUpdate={(occupancies) => updateRatePlan(ratePlan.id, { occupancies })}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="age-bands">
              <AccordionTrigger>
                <div className="flex items-center">
                  <Baby className="w-4 h-4 mr-2" />
                  Age Bands ({ratePlan.ageBands?.length || 0})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <AgeBandsEditor
                  ageBands={ratePlan.ageBands || []}
                  onUpdate={(ageBands) => updateRatePlan(ratePlan.id, { ageBands })}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onNext} className="min-w-[200px]">
          Continue to Availability
        </Button>
      </div>
    </div>
  );
}

// Step: Variant Details
function VariantDetailsStep({ data, onUpdate, onNext, preselectedProduct }: {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
  onNext: () => void;
  preselectedProduct?: { id: number; name: string; type: string };
}) {
  const [customAttributes, setCustomAttributes] = useState<Record<string, any>>({});

  const addCustomAttribute = () => {
    const key = `attribute_${Date.now()}`;
    setCustomAttributes(prev => ({
      ...prev,
      [key]: { name: '', value: '', type: 'text' }
    }));
  };

  const updateCustomAttribute = (key: string, field: 'name' | 'value' | 'type', value: string) => {
    setCustomAttributes(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const removeCustomAttribute = (key: string) => {
    setCustomAttributes(prev => {
      const newAttrs = { ...prev };
      delete newAttrs[key];
      return newAttrs;
    });
  };

  const handleNext = () => {
    // Store custom attributes in the data
    onUpdate({
      ...data,
      customAttributes
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Variant Details</h3>
        <p className="text-muted-foreground">
          {preselectedProduct 
            ? `Adding a variant to: ${preselectedProduct.name}`
            : 'Set the basic information for your product variant'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!preselectedProduct && (
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={data.productName}
                  onChange={(e) => onUpdate({ ...data, productName: e.target.value })}
                  placeholder="e.g., London City Tours"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Variant Name</Label>
              <Input
                value={data.variantName}
                onChange={(e) => onUpdate({ ...data, variantName: e.target.value })}
                placeholder="e.g., Standard Room, Morning Tour, Economy Class"
              />
              <p className="text-xs text-muted-foreground">
                A specific variant of your product (e.g., room type, tour time, ticket class)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Brief description of this variant..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Custom Attributes
            </CardTitle>
            <CardDescription>
              Add any specific attributes for this variant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {Object.entries(customAttributes).map(([key, attr]) => (
                <div key={key} className="flex items-center space-x-2 p-3 border rounded-md">
                  <Input
                    placeholder="Attribute name"
                    value={attr.name}
                    onChange={(e) => updateCustomAttribute(key, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Select
                    value={attr.type}
                    onValueChange={(value) => updateCustomAttribute(key, 'type', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Yes/No</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => updateCustomAttribute(key, 'value', e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeCustomAttribute(key)}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={addCustomAttribute}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Custom Attribute
            </Button>

            <div className="text-xs text-muted-foreground">
              <p><strong>Examples:</strong></p>
              <p>• Room size: 25m²</p>
              <p>• Tour duration: 3 hours</p>
              <p>• Includes breakfast: Yes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button 
          onClick={handleNext} 
          disabled={!data.variantName || (!preselectedProduct && !data.productName)}
          className="min-w-[200px]"
        >
          Continue to Template
        </Button>
      </div>
    </div>
  );
}

// Step: Availability
function AvailabilityStep({ data, onUpdate, onNext }: {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
  onNext: () => void;
}) {
  const updateAvailability = (updates: Partial<WizardData['availability']>) => {
    onUpdate({
      ...data,
      availability: { ...data.availability, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Set Availability</h3>
        <p className="text-muted-foreground">Configure when and how much inventory is available</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valid From</Label>
                <Input
                  type="date"
                  value={data.availability.dateFrom}
                  onChange={(e) => updateAvailability({ dateFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valid To</Label>
                <Input
                  type="date"
                  value={data.availability.dateTo}
                  onChange={(e) => updateAvailability({ dateTo: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Total Quantity Available</Label>
              <Input
                type="number"
                value={data.availability.quantity}
                onChange={(e) => updateAvailability({ quantity: parseInt(e.target.value) || 1 })}
                min="1"
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">
                Total number of units available for booking
              </p>
            </div>

            <div className="space-y-2">
              <Label>Allocation Model</Label>
              <Select
                value={data.availability.allocationModel}
                onValueChange={(value) => updateAvailability({ allocationModel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="committed">Committed - You guarantee availability</SelectItem>
                  <SelectItem value="on_request">On Request - Check with supplier first</SelectItem>
                  <SelectItem value="freesale">Freesale - Always available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={data.availability.allowOverbooking}
                onCheckedChange={(checked) => updateAvailability({ allowOverbooking: checked })}
              />
              <Label>Allow Overbooking</Label>
            </div>

            {data.availability.allowOverbooking && (
              <div className="space-y-2">
                <Label>Overbooking Limit (%)</Label>
                <Input
                  type="number"
                  value={data.availability.overbookingLimit || 10}
                  onChange={(e) => updateAvailability({ 
                    overbookingLimit: parseInt(e.target.value) || 10 
                  })}
                  min="1"
                  max="50"
                  placeholder="10"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum percentage you can overbook (e.g., 10% = 110 units when you have 100)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={onNext} className="min-w-[200px]">
          Create Variant
        </Button>
      </div>
    </div>
  );
}

// Rate Seasons Editor Component
function RateSeasonsEditor({ seasons, onUpdate }: {
  seasons: SimpleRatePlan['seasons'];
  onUpdate: (seasons: SimpleRatePlan['seasons']) => void;
}) {
  const addSeason = () => {
    const newSeason = {
      id: `season_${Date.now()}`,
      seasonFrom: '',
      seasonTo: '',
      dowMask: 127,
      minStay: undefined,
      maxStay: undefined,
      minPax: undefined,
      maxPax: undefined
    };
    onUpdate([...seasons, newSeason]);
  };

  const updateSeason = (index: number, updates: Partial<SimpleRatePlan['seasons'][0]>) => {
    const updatedSeasons = [...seasons];
    updatedSeasons[index] = { ...updatedSeasons[index], ...updates };
    onUpdate(updatedSeasons);
  };

  const removeSeason = (index: number) => {
    onUpdate(seasons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Rate Seasons</Label>
        <Button size="sm" variant="outline" onClick={addSeason}>
          <Plus className="w-4 h-4 mr-1" />
          Add Season
        </Button>
      </div>

      {seasons.map((season, index) => (
        <div key={season.id} className="p-4 border rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Season From</Label>
              <Input
                type="date"
                value={season.seasonFrom}
                onChange={(e) => updateSeason(index, { seasonFrom: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Season To</Label>
              <Input
                type="date"
                value={season.seasonTo}
                onChange={(e) => updateSeason(index, { seasonTo: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Stay (optional)</Label>
              <Input
                type="number"
                value={season.minStay || ''}
                onChange={(e) => updateSeason(index, { minStay: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 2"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stay (optional)</Label>
              <Input
                type="number"
                value={season.maxStay || ''}
                onChange={(e) => updateSeason(index, { maxStay: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 7"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => removeSeason(index)}>
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Occupancies Editor Component
function OccupanciesEditor({ occupancies, onUpdate }: {
  occupancies: SimpleRatePlan['occupancies'];
  onUpdate: (occupancies: SimpleRatePlan['occupancies']) => void;
}) {
  const addOccupancy = () => {
    const newOccupancy = {
      id: `occupancy_${Date.now()}`,
      minOccupancy: 1,
      maxOccupancy: 2,
      pricingModel: 'fixed' as const,
      baseAmount: 0,
      perPersonAmount: undefined
    };
    onUpdate([...occupancies, newOccupancy]);
  };

  const updateOccupancy = (index: number, updates: Partial<SimpleRatePlan['occupancies'][0]>) => {
    const updatedOccupancies = [...occupancies];
    updatedOccupancies[index] = { ...updatedOccupancies[index], ...updates };
    onUpdate(updatedOccupancies);
  };

  const removeOccupancy = (index: number) => {
    onUpdate(occupancies.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Occupancy Pricing</Label>
        <Button size="sm" variant="outline" onClick={addOccupancy}>
          <Plus className="w-4 h-4 mr-1" />
          Add Occupancy
        </Button>
      </div>

      {occupancies.map((occupancy, index) => (
        <div key={occupancy.id} className="p-4 border rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Occupancy</Label>
              <Input
                type="number"
                value={occupancy.minOccupancy}
                onChange={(e) => updateOccupancy(index, { minOccupancy: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Occupancy</Label>
              <Input
                type="number"
                value={occupancy.maxOccupancy}
                onChange={(e) => updateOccupancy(index, { maxOccupancy: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pricing Model</Label>
            <Select
              value={occupancy.pricingModel}
              onValueChange={(value: 'fixed' | 'base_plus_pax' | 'per_person') => 
                updateOccupancy(index, { pricingModel: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="base_plus_pax">Base + Per Person</SelectItem>
                <SelectItem value="per_person">Per Person Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Amount</Label>
              <Input
                type="number"
                value={occupancy.baseAmount}
                onChange={(e) => updateOccupancy(index, { baseAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            {(occupancy.pricingModel === 'base_plus_pax' || occupancy.pricingModel === 'per_person') && (
              <div className="space-y-2">
                <Label>Per Person Amount</Label>
                <Input
                  type="number"
                  value={occupancy.perPersonAmount || ''}
                  onChange={(e) => updateOccupancy(index, { 
                    perPersonAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => removeOccupancy(index)}>
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Age Bands Editor Component
function AgeBandsEditor({ ageBands, onUpdate }: {
  ageBands: SimpleRatePlan['ageBands'];
  onUpdate: (ageBands: SimpleRatePlan['ageBands']) => void;
}) {
  const addAgeBand = () => {
    const newAgeBand = {
      id: `ageband_${Date.now()}`,
      label: '',
      minAge: 0,
      maxAge: 100,
      priceType: 'discount',
      value: 0
    };
    onUpdate([...ageBands, newAgeBand]);
  };

  const updateAgeBand = (index: number, updates: Partial<SimpleRatePlan['ageBands'][0]>) => {
    const updatedAgeBands = [...ageBands];
    updatedAgeBands[index] = { ...updatedAgeBands[index], ...updates };
    onUpdate(updatedAgeBands);
  };

  const removeAgeBand = (index: number) => {
    onUpdate(ageBands.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Age Band Pricing</Label>
        <Button size="sm" variant="outline" onClick={addAgeBand}>
          <Plus className="w-4 h-4 mr-1" />
          Add Age Band
        </Button>
      </div>

      {ageBands.map((ageBand, index) => (
        <div key={ageBand.id} className="p-4 border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label>Age Band Label</Label>
            <Input
              value={ageBand.label}
              onChange={(e) => updateAgeBand(index, { label: e.target.value })}
              placeholder="e.g., Child, Senior, Infant"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Age</Label>
              <Input
                type="number"
                value={ageBand.minAge}
                onChange={(e) => updateAgeBand(index, { minAge: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Age</Label>
              <Input
                type="number"
                value={ageBand.maxAge}
                onChange={(e) => updateAgeBand(index, { maxAge: parseInt(e.target.value) || 100 })}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select
                value={ageBand.priceType}
                onValueChange={(value) => updateAgeBand(index, { priceType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount">Discount %</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="multiplier">Multiplier</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={ageBand.value}
                onChange={(e) => updateAgeBand(index, { value: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => removeAgeBand(index)}>
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
