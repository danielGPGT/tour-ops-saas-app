'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Building2, 
  Ticket, 
  Car, 
  Plane,
  Calendar,
  DollarSign,
  Users,
  Globe,
  Clock
} from 'lucide-react';

// Types
interface RatePlan {
  id: string;
  name: string;
  supplier: {
    id: string;
    name: string;
  };
  contract: {
    id?: string;
    reference: string;
  };
  pricing: {
    currency: string;
    baseCost: number;
    basePrice: number;
    markupPercentage?: number;
    useMarkup: boolean;
  };
  channels: string[];
  markets: string[];
  seasons: {
    seasonFrom: string;
    seasonTo: string;
    dowMask?: number;
    minStay?: number;
    maxStay?: number;
    minPax?: number;
    maxPax?: number;
  }[];
  occupancies: {
    minOccupancy: number;
    maxOccupancy: number;
    pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
    baseAmount: number;
    perPersonAmount?: number;
  }[];
  ageBands?: {
    label: string;
    minAge: number;
    maxAge: number;
    priceType: string;
    value: number;
  }[];
  preferred: boolean;
  notes?: string;
}

interface WizardData {
  mode: 'new' | 'existing';
  productType: string;
  product?: {
    id: number;
    name: string;
  };
  variant: {
    id?: number;
    name: string;
    description?: string;
    attributes?: Record<string, any>;
  };
  ratePlans: RatePlan[];
  availability: {
    allocationModel: 'committed' | 'on_request' | 'unlimited';
    dateFrom: string;
    dateTo: string;
    quantity: number;
    timeSlots?: {
      time: string;
      name?: string;
      duration?: number;
    }[];
    allowOverbooking: boolean;
    overbookingLimit?: number;
  };
}

// Product Type Profiles
const PRODUCT_TYPE_PROFILES = {
  accommodation: {
    icon: Building2,
    name: 'Accommodation',
    color: 'bg-blue-500',
    examples: ['Hotel', 'Apartment', 'Villa', 'Hostel'],
    popular: true,
    ratePlanDefaults: {
      channels: ['b2c', 'b2b'],
      markets: ['uk', 'europe', 'worldwide'],
      occupancies: [
        { minOccupancy: 1, maxOccupancy: 2, pricingModel: 'fixed', baseAmount: 0 },
        { minOccupancy: 3, maxOccupancy: 4, pricingModel: 'base_plus_pax', baseAmount: 0, perPersonAmount: 0 }
      ]
    }
  },
  events: {
    icon: Ticket,
    name: 'Events',
    color: 'bg-purple-500',
    examples: ['Concert', 'Sports Event', 'Festival', 'Theater'],
    popular: true,
    ratePlanDefaults: {
      channels: ['b2c', 'b2b'],
      markets: ['uk', 'europe', 'worldwide'],
      occupancies: [
        { minOccupancy: 1, maxOccupancy: 1, pricingModel: 'per_person', baseAmount: 0 }
      ],
      ageBands: [
        { label: 'Adult', minAge: 18, maxAge: 64, priceType: 'full_price', value: 1.0 },
        { label: 'Child', minAge: 3, maxAge: 17, priceType: 'discount', value: 0.5 },
        { label: 'Senior', minAge: 65, maxAge: 99, priceType: 'discount', value: 0.75 }
      ]
    }
  },
  transport: {
    icon: Car,
    name: 'Transport',
    color: 'bg-green-500',
    examples: ['Airport Transfer', 'Bus Tour', 'Private Car', 'Shared Shuttle'],
    popular: false,
    ratePlanDefaults: {
      channels: ['b2c', 'b2b'],
      markets: ['uk', 'europe'],
      occupancies: [
        { minOccupancy: 1, maxOccupancy: 4, pricingModel: 'fixed', baseAmount: 0 },
        { minOccupancy: 5, maxOccupancy: 8, pricingModel: 'base_plus_pax', baseAmount: 0, perPersonAmount: 0 }
      ]
    }
  },
  flights: {
    icon: Plane,
    name: 'Flights',
    color: 'bg-red-500',
    examples: ['Scheduled Flight', 'Charter', 'Private Jet'],
    popular: false,
    ratePlanDefaults: {
      channels: ['b2c', 'b2b'],
      markets: ['worldwide'],
      occupancies: [
        { minOccupancy: 1, maxOccupancy: 1, pricingModel: 'per_person', baseAmount: 0 }
      ],
      ageBands: [
        { label: 'Adult', minAge: 12, maxAge: 99, priceType: 'full_price', value: 1.0 },
        { label: 'Child', minAge: 2, maxAge: 11, priceType: 'discount', value: 0.75 },
        { label: 'Infant', minAge: 0, maxAge: 1, priceType: 'discount', value: 0.1 }
      ]
    }
  }
};

// Channel and Market Options
const CHANNEL_OPTIONS = [
  { id: 'b2c', name: 'B2C', description: 'Business to Consumer (direct bookings)' },
  { id: 'b2b', name: 'B2B', description: 'Business to Business (agent/wholesaler)' }
];

const MARKET_OPTIONS = [
  { id: 'uk', name: 'UK', description: 'United Kingdom' },
  { id: 'europe', name: 'Europe', description: 'European markets' },
  { id: 'usa', name: 'USA', description: 'United States' },
  { id: 'worldwide', name: 'Worldwide', description: 'Global markets' }
];

interface MultiRatePlanWizardProps {
  preselectedProduct?: {
    id: number;
    name: string;
    type: string;
  };
  existingVariant?: {
    id: number;
    name: string;
    description?: string;
    attributes?: Record<string, any>;
    product_id?: number;
    product?: {
      id: number;
      name: string;
      type: string;
    };
    rate_plans?: any[];
    allocation_buckets?: any[];
  };
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export function MultiRatePlanWizard({ preselectedProduct, existingVariant, onComplete, onCancel }: MultiRatePlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Determine mode and initial data
  const isEditing = !!existingVariant;
  const product = existingVariant?.product || preselectedProduct;
  
  // For editing mode, we need to ensure we have product info
  // If existingVariant doesn't have product info, we'll need to get it from preselectedProduct
  const productInfo = existingVariant?.product || preselectedProduct;
  
  const [data, setData] = useState<WizardData>({
    mode: existingVariant ? 'edit' : (preselectedProduct ? 'existing' : 'new'),
    productType: productInfo?.type || '', // Get product type from existing product/variant
    product: productInfo,
    variant: {
      id: existingVariant?.id,
      name: existingVariant?.name || '',
      description: existingVariant?.description || '',
      attributes: existingVariant?.attributes || {}
    },
    ratePlans: existingVariant?.rate_plans?.map(plan => ({
      id: plan.id.toString(),
      name: plan.rate_doc?.name || 'Rate Plan',
      supplier: {
        id: plan.supplier_id?.toString() || '',
        name: plan.suppliers?.name || 'Unknown Supplier'
      },
      contract: {
        id: plan.contract_version_id?.toString() || '',
        reference: 'CON-REF' // TODO: Get actual contract reference from database
      },
      pricing: {
        currency: plan.currency || 'GBP',
        baseCost: plan.rate_doc?.base_cost || 0,
        basePrice: plan.rate_doc?.base_price || 0,
        useMarkup: false
      },
      channels: plan.rate_doc?.channels || ['direct'],
      markets: plan.rate_doc?.markets || ['uk'],
      seasons: [
        {
          name: 'Standard',
          validFrom: plan.valid_from || '',
          validTo: plan.valid_to || ''
        }
      ],
      occupancies: [
        { minPax: 1, maxPax: 2, pricingModel: 'fixed', baseAmount: 0 }
      ],
      ageBands: [],
      preferred: plan.rate_doc?.preferred || false,
      notes: plan.rate_doc?.notes || ''
    })) || [],
    availability: {
      allocationModel: existingVariant?.allocation_buckets?.[0]?.allocation_type || 'committed',
      dateFrom: existingVariant?.allocation_buckets?.[0]?.date || '',
      dateTo: existingVariant?.allocation_buckets?.[0]?.date || '',
      quantity: existingVariant?.allocation_buckets?.[0]?.quantity || 0,
      timeSlots: [],
      allowOverbooking: existingVariant?.allocation_buckets?.[0]?.allow_overbooking || false
    }
  });

  const steps = isEditing || preselectedProduct
    ? [
        { title: 'Variant Details', description: isEditing ? 'Edit variant details' : 'Define variant' },
        { title: 'Rate Plans', description: isEditing ? 'Edit pricing' : 'Configure pricing' },
        { title: 'Availability', description: isEditing ? 'Edit inventory' : 'Set inventory' },
        { title: 'Review', description: isEditing ? 'Confirm changes' : 'Confirm details' }
      ]
    : [
        { title: 'Product Type', description: 'Select product type' },
        { title: 'Variant Details', description: 'Define variant' },
        { title: 'Rate Plans', description: 'Configure pricing' },
        { title: 'Availability', description: 'Set inventory' },
        { title: 'Review', description: 'Confirm details' }
      ];

  const handleNext = (stepData: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...stepData }));
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = () => {
    onComplete(data);
  };

  const renderStep = () => {
    if (isEditing || preselectedProduct) {
      // Skip product type step when product is preselected or editing existing variant
      switch (currentStep) {
        case 0:
          return <VariantDetailsStep data={data} onNext={handleNext} onPrevious={handlePrevious} isEditing={isEditing} />;
        case 1:
          return <RatePlansStep data={data} onNext={handleNext} onPrevious={handlePrevious} isEditing={isEditing} />;
        case 2:
          return <AvailabilityStep data={data} onNext={handleNext} onPrevious={handlePrevious} isEditing={isEditing} />;
        case 3:
          return <ReviewStep data={data} onPrevious={handlePrevious} onComplete={handleComplete} isEditing={isEditing} />;
        default:
          return null;
      }
    } else {
      // Full flow when creating new product
      switch (currentStep) {
        case 0:
          return <ProductTypeStep data={data} onNext={handleNext} />;
        case 1:
          return <VariantDetailsStep data={data} onNext={handleNext} onPrevious={handlePrevious} />;
        case 2:
          return <RatePlansStep data={data} onNext={handleNext} onPrevious={handlePrevious} />;
        case 3:
          return <AvailabilityStep data={data} onNext={handleNext} onPrevious={handlePrevious} />;
        case 4:
          return <ReviewStep data={data} onPrevious={handlePrevious} onComplete={handleComplete} />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEditing ? 'Edit Product Variant' : 'Create Product Variant'}
          </h2>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              <div className="ml-2">
                <div className={`text-sm font-medium ${
                  index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px ml-4 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}

// Step 0: Product Type Selection
function ProductTypeStep({ data, onNext }: { data: WizardData; onNext: (data: Partial<WizardData>) => void }) {
  const [selectedType, setSelectedType] = useState(data.productType);

  const handleContinue = () => {
    if (!selectedType) return;
    onNext({ productType: selectedType });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Select Product Type</h3>
        <p className="text-muted-foreground">
          Choose the type of product you want to create
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PRODUCT_TYPE_PROFILES).map(([key, profile]) => {
          const Icon = profile.icon;
          return (
            <Card 
              key={key}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedType === key ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedType(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${profile.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{profile.name}</h4>
                      {profile.popular && (
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {profile.examples.join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleContinue} disabled={!selectedType}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Step 1: Variant Details
function VariantDetailsStep({ 
  data, 
  onNext, 
  onPrevious,
  isEditing = false
}: { 
  data: WizardData; 
  onNext: (data: Partial<WizardData>) => void;
  onPrevious: () => void;
  isEditing?: boolean;
}) {
  const [variantName, setVariantName] = useState(data.variant.name);
  const [description, setDescription] = useState(data.variant.description || '');
  const [customAttributes, setCustomAttributes] = useState(
    data.variant.attributes ? 
      Object.entries(data.variant.attributes).map(([key, value]) => `${key}: ${value}`).join('\n') : 
      ''
  );

  const productProfile = PRODUCT_TYPE_PROFILES[data.productType as keyof typeof PRODUCT_TYPE_PROFILES];

  const handleContinue = () => {
    if (!variantName.trim()) return;

    // Parse custom attributes
    const attributes: Record<string, any> = {};
    if (customAttributes.trim()) {
      customAttributes.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          attributes[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    onNext({
      variant: {
        name: variantName.trim(),
        description: description.trim() || undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {isEditing ? 'Edit Variant Details' : 'Variant Details'}
        </h3>
        <p className="text-muted-foreground">
          {isEditing 
            ? `Update the details for this ${productProfile?.name.toLowerCase()} variant`
            : `Define the specific variant of your ${productProfile?.name.toLowerCase()}`
          }
        </p>
        {data.product && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
            {isEditing ? 'Editing:' : 'Adding to:'} {data.product.name}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Variant Name *
          </label>
          <input
            type="text"
            placeholder={`e.g., ${productProfile?.examples[0] || 'Standard Option'}`}
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Description
          </label>
          <textarea
            placeholder="Optional description of this variant..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md h-20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Custom Attributes
          </label>
          <textarea
            placeholder="Enter key:value pairs, one per line&#10;e.g.,&#10;room_type: Standard&#10;bed_type: Double&#10;floor: Ground"
            value={customAttributes}
            onChange={(e) => setCustomAttributes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md h-24 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Optional: Add custom attributes as key:value pairs
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleContinue} disabled={!variantName.trim()}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Step 2: Rate Plans Builder
function RatePlansStep({ 
  data, 
  onNext, 
  onPrevious,
  isEditing = false
}: { 
  data: WizardData; 
  onNext: (data: Partial<WizardData>) => void;
  onPrevious: () => void;
  isEditing?: boolean;
}) {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>(data.ratePlans);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

  const productProfile = PRODUCT_TYPE_PROFILES[data.productType as keyof typeof PRODUCT_TYPE_PROFILES];

  const createNewRatePlan = (): RatePlan => ({
    id: `plan_${Date.now()}`,
    name: '',
    supplier: { id: '', name: '' },
    contract: { reference: '' },
    pricing: {
      currency: 'GBP',
      baseCost: 0,
      basePrice: 0,
      useMarkup: false
    },
    channels: productProfile?.ratePlanDefaults.channels || ['b2c'],
    markets: productProfile?.ratePlanDefaults.markets || ['uk'],
    seasons: [
      {
        seasonFrom: data.availability.dateFrom || '',
        seasonTo: data.availability.dateTo || '',
        dowMask: 127, // All days of week (binary: 1111111)
        minStay: undefined,
        maxStay: undefined,
        minPax: undefined,
        maxPax: undefined
      }
    ],
    occupancies: productProfile?.ratePlanDefaults.occupancies || [
      { minOccupancy: 1, maxOccupancy: 2, pricingModel: 'fixed', baseAmount: 0 }
    ],
    ageBands: productProfile?.ratePlanDefaults.ageBands || [],
    preferred: ratePlans.length === 0,
    notes: ''
  });

  const addRatePlan = () => {
    const newPlan = createNewRatePlan();
    setRatePlans(prev => [...prev, newPlan]);
    setEditingPlan(newPlan.id);
  };

  const updateRatePlan = (planId: string, updates: Partial<RatePlan>) => {
    setRatePlans(prev => prev.map(plan => 
      plan.id === planId ? { ...plan, ...updates } : plan
    ));
  };

  const deleteRatePlan = (planId: string) => {
    setRatePlans(prev => prev.filter(plan => plan.id !== planId));
    if (editingPlan === planId) {
      setEditingPlan(null);
    }
  };

  const duplicateRatePlan = (planId: string) => {
    const planToDuplicate = ratePlans.find(p => p.id === planId);
    if (planToDuplicate) {
      const duplicated = {
        ...planToDuplicate,
        id: `plan_${Date.now()}`,
        name: `${planToDuplicate.name} (Copy)`,
        preferred: false
      };
      setRatePlans(prev => [...prev, duplicated]);
    }
  };

  const handleContinue = () => {
    if (ratePlans.length === 0) {
      // Create a default rate plan
      const defaultPlan = createNewRatePlan();
      defaultPlan.name = 'Standard Rate';
      onNext({ ratePlans: [defaultPlan] });
    } else {
      onNext({ ratePlans });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {isEditing ? 'Edit Rate Plans' : 'Rate Plans'}
        </h3>
        <p className="text-muted-foreground">
          {isEditing 
            ? 'Update pricing and availability for different channels and suppliers'
            : 'Configure pricing and availability for different channels and suppliers'
          }
        </p>
      </div>

      {/* Rate Plans List */}
      <div className="space-y-4">
        {ratePlans.map((plan) => (
          <Card key={plan.id} className={plan.preferred ? 'ring-2 ring-primary' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div>
                    <CardTitle className="text-lg">{plan.name || 'Unnamed Rate Plan'}</CardTitle>
                    <CardDescription>
                      {plan.supplier.name || 'No supplier selected'}
                    </CardDescription>
                  </div>
                  {plan.preferred && (
                    <Badge variant="default">Preferred</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateRatePlan(plan.id)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRatePlan(plan.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {editingPlan === plan.id && (
              <CardContent>
                <RatePlanEditor
                  plan={plan}
                  onUpdate={(updates) => updateRatePlan(plan.id, updates)}
                  productType={data.productType}
                />
              </CardContent>
            )}

            {editingPlan !== plan.id && (
              <CardContent>
                <RatePlanSummary plan={plan} />
              </CardContent>
            )}
          </Card>
        ))}

        {/* Add Rate Plan Button */}
        <Button
          variant="outline"
          className="w-full h-16 border-dashed"
          onClick={addRatePlan}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Rate Plan
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Rate Plan Editor Component
function RatePlanEditor({ 
  plan, 
  onUpdate, 
  productType 
}: { 
  plan: RatePlan; 
  onUpdate: (updates: Partial<RatePlan>) => void;
  productType: string;
}) {
  const [localPlan, setLocalPlan] = useState(plan);
  const [suppliers, setSuppliers] = useState<Array<{id: number; name: string; channels?: string[]}>>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Fetch suppliers from API
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await fetch('/api/wizard/suppliers');
        const result = await response.json();
        if (result.success) {
          setSuppliers(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      } finally {
        setLoadingSuppliers(false);
      }
    };

    fetchSuppliers();
  }, []);

  const createNewSupplier = async () => {
    if (!newSupplierName.trim()) return;
    
    setCreatingSupplier(true);
    try {
      const response = await fetch('/api/wizard/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupplierName.trim() })
      });
      
      const result = await response.json();
      if (result.success) {
        setSuppliers(prev => [...prev, result.data]);
        handleUpdate({ 
          supplier: { id: result.data.id.toString(), name: result.data.name }
        });
        setNewSupplierName('');
        setShowNewSupplierForm(false);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleUpdate = (updates: Partial<RatePlan>) => {
    const newPlan = { ...localPlan, ...updates };
    setLocalPlan(newPlan);
    onUpdate(updates);
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Rate Plan Name *</label>
          <input
            type="text"
            value={localPlan.name}
            onChange={(e) => handleUpdate({ name: e.target.value })}
            placeholder="e.g., Standard Rate, Agent Rate"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Preferred Rate Plan</label>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localPlan.preferred}
              onChange={(e) => handleUpdate({ preferred: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Mark as preferred rate plan</span>
          </div>
        </div>
      </div>

      {/* Supplier & Contract */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier *</label>
          {!showNewSupplierForm ? (
            <div className="space-y-2">
              <select
                value={localPlan.supplier.id}
                onChange={(e) => {
                  if (e.target.value === 'new') {
                    setShowNewSupplierForm(true);
                    return;
                  }
                  const selectedSupplier = suppliers.find(s => s.id.toString() === e.target.value);
                  const supplier = { 
                    id: e.target.value, 
                    name: selectedSupplier?.name || e.target.options[e.target.selectedIndex].text 
                  };
                  handleUpdate({ supplier });
                }}
                className="w-full px-3 py-2 border rounded-md"
                disabled={loadingSuppliers}
              >
                <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select supplier...'}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </option>
                ))}
                <option value="new">+ Create New Supplier</option>
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Enter supplier name..."
                  className="flex-1 px-3 py-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && createNewSupplier()}
                />
                <Button
                  onClick={createNewSupplier}
                  disabled={!newSupplierName.trim() || creatingSupplier}
                  size="sm"
                >
                  {creatingSupplier ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewSupplierForm(false);
                    setNewSupplierName('');
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contract Reference *</label>
          <input
            type="text"
            value={localPlan.contract.reference}
            onChange={(e) => handleUpdate({ 
              contract: { ...localPlan.contract, reference: e.target.value }
            })}
            placeholder="e.g., CON-2025-001, F1-ABU-2025"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center">
          <DollarSign className="w-4 h-4 mr-2" />
          Pricing
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency</label>
            <select
              value={localPlan.pricing.currency}
              onChange={(e) => handleUpdate({
                pricing: { ...localPlan.pricing, currency: e.target.value }
              })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Cost</label>
            <input
              type="number"
              value={localPlan.pricing.baseCost}
              onChange={(e) => handleUpdate({
                pricing: { ...localPlan.pricing, baseCost: parseFloat(e.target.value) || 0 }
              })}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Base Price</label>
            <input
              type="number"
              value={localPlan.pricing.basePrice}
              onChange={(e) => handleUpdate({
                pricing: { ...localPlan.pricing, basePrice: parseFloat(e.target.value) || 0 }
              })}
              placeholder="0.00"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Channels & Markets */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center">
          <Globe className="w-4 h-4 mr-2" />
          Channels & Markets
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">Channels</label>
            <div className="space-y-2">
              {CHANNEL_OPTIONS.map((channel) => (
                <div key={channel.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPlan.channels.includes(channel.id)}
                    onChange={(e) => {
                      const channels = e.target.checked
                        ? [...localPlan.channels, channel.id]
                        : localPlan.channels.filter(c => c !== channel.id);
                      handleUpdate({ channels });
                    }}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">{channel.name}</span>
                    <p className="text-xs text-muted-foreground">{channel.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium">Markets</label>
            <div className="space-y-2">
              {MARKET_OPTIONS.map((market) => (
                <div key={market.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPlan.markets.includes(market.id)}
                    onChange={(e) => {
                      const markets = e.target.checked
                        ? [...localPlan.markets, market.id]
                        : localPlan.markets.filter(m => m !== market.id);
                      handleUpdate({ markets });
                    }}
                    className="rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">{market.name}</span>
                    <p className="text-xs text-muted-foreground">{market.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium">Advanced Configuration</h4>
        <Accordion type="multiple" className="w-full">
          {/* Rate Seasons */}
          <AccordionItem value="seasons">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Rate Seasons ({localPlan.seasons.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <RateSeasonsEditor
                seasons={localPlan.seasons}
                onUpdate={(seasons) => handleUpdate({ seasons })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Occupancies */}
          <AccordionItem value="occupancies">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Occupancies ({localPlan.occupancies.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <OccupanciesEditor
                occupancies={localPlan.occupancies}
                onUpdate={(occupancies) => handleUpdate({ occupancies })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Age Bands */}
          <AccordionItem value="ageBands">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Age Bands ({localPlan.ageBands?.length || 0})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <AgeBandsEditor
                ageBands={localPlan.ageBands || []}
                onUpdate={(ageBands) => handleUpdate({ ageBands })}
              />
            </AccordionContent>
          </AccordionItem>

          {/* Taxes & Fees */}
          <AccordionItem value="taxesFees">
            <AccordionTrigger className="text-sm">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Taxes & Fees (0)
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <TaxesFeesEditor
                taxesFees={[]}
                onUpdate={(taxesFees) => {
                  // TODO: Implement taxes & fees
                  console.log('Taxes & Fees not implemented yet');
                }}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          value={localPlan.notes || ''}
          onChange={(e) => handleUpdate({ notes: e.target.value })}
          placeholder="Optional notes about this rate plan..."
          className="w-full px-3 py-2 border rounded-md h-20"
        />
      </div>
    </div>
  );
}

// Rate Seasons Editor Component
function RateSeasonsEditor({ 
  seasons, 
  onUpdate 
}: { 
  seasons: RatePlan['seasons'];
  onUpdate: (seasons: RatePlan['seasons']) => void;
}) {
  const addSeason = () => {
    const newSeason = {
      seasonFrom: '',
      seasonTo: '',
      dowMask: 127, // All days
      minStay: undefined,
      maxStay: undefined,
      minPax: undefined,
      maxPax: undefined
    };
    onUpdate([...seasons, newSeason]);
  };

  const updateSeason = (index: number, updates: Partial<RatePlan['seasons'][0]>) => {
    const newSeasons = [...seasons];
    newSeasons[index] = { ...newSeasons[index], ...updates };
    onUpdate(newSeasons);
  };

  const removeSeason = (index: number) => {
    onUpdate(seasons.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Define seasonal pricing periods and restrictions
        </p>
        <Button onClick={addSeason} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Season
        </Button>
      </div>

      {seasons.map((season, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <Select
                value={season.dowMask?.toString() || '127'}
                onValueChange={(value) => updateSeason(index, { dowMask: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="127">All Days</SelectItem>
                  <SelectItem value="62">Weekdays (Mon-Fri)</SelectItem>
                  <SelectItem value="65">Weekends (Sat-Sun)</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="4">Wednesday</SelectItem>
                  <SelectItem value="8">Thursday</SelectItem>
                  <SelectItem value="16">Friday</SelectItem>
                  <SelectItem value="32">Saturday</SelectItem>
                  <SelectItem value="64">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Stay (nights)</Label>
              <Input
                type="number"
                value={season.minStay || ''}
                onChange={(e) => updateSeason(index, { 
                  minStay: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stay (nights)</Label>
              <Input
                type="number"
                value={season.maxStay || ''}
                onChange={(e) => updateSeason(index, { 
                  maxStay: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Min Pax</Label>
              <Input
                type="number"
                value={season.minPax || ''}
                onChange={(e) => updateSeason(index, { 
                  minPax: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Pax</Label>
              <Input
                type="number"
                value={season.maxPax || ''}
                onChange={(e) => updateSeason(index, { 
                  maxPax: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => removeSeason(index)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Occupancies Editor Component
function OccupanciesEditor({ 
  occupancies, 
  onUpdate 
}: { 
  occupancies: RatePlan['occupancies'];
  onUpdate: (occupancies: RatePlan['occupancies']) => void;
}) {
  const addOccupancy = () => {
    const newOccupancy = {
      minOccupancy: 1,
      maxOccupancy: 2,
      pricingModel: 'fixed' as const,
      baseAmount: 0,
      perPersonAmount: undefined
    };
    onUpdate([...occupancies, newOccupancy]);
  };

  const updateOccupancy = (index: number, updates: Partial<RatePlan['occupancies'][0]>) => {
    const newOccupancies = [...occupancies];
    newOccupancies[index] = { ...newOccupancies[index], ...updates };
    onUpdate(newOccupancies);
  };

  const removeOccupancy = (index: number) => {
    onUpdate(occupancies.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Define occupancy-based pricing rules
        </p>
        <Button onClick={addOccupancy} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Occupancy
        </Button>
      </div>

      {occupancies.map((occupancy, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Min Occupancy</Label>
              <Input
                type="number"
                value={occupancy.minOccupancy}
                onChange={(e) => updateOccupancy(index, { 
                  minOccupancy: parseInt(e.target.value) || 1 
                })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Occupancy</Label>
              <Input
                type="number"
                value={occupancy.maxOccupancy}
                onChange={(e) => updateOccupancy(index, { 
                  maxOccupancy: parseInt(e.target.value) || 1 
                })}
                min="1"
              />
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
                  <SelectItem value="per_person">Per Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Amount</Label>
              <Input
                type="number"
                value={occupancy.baseAmount}
                onChange={(e) => updateOccupancy(index, { 
                  baseAmount: parseFloat(e.target.value) || 0 
                })}
                step="0.01"
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
                  step="0.01"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => removeOccupancy(index)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Age Bands Editor Component
function AgeBandsEditor({ 
  ageBands, 
  onUpdate 
}: { 
  ageBands: RatePlan['ageBands'];
  onUpdate: (ageBands: RatePlan['ageBands']) => void;
}) {
  const addAgeBand = () => {
    const newAgeBand = {
      label: '',
      minAge: 0,
      maxAge: 99,
      priceType: 'full_price',
      value: 1.0
    };
    onUpdate([...ageBands, newAgeBand]);
  };

  const updateAgeBand = (index: number, updates: Partial<RatePlan['ageBands'][0]>) => {
    const newAgeBands = [...ageBands];
    newAgeBands[index] = { ...newAgeBands[index], ...updates };
    onUpdate(newAgeBands);
  };

  const removeAgeBand = (index: number) => {
    onUpdate(ageBands.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Define age-based pricing adjustments
        </p>
        <Button onClick={addAgeBand} size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          Add Age Band
        </Button>
      </div>

      {ageBands.map((ageBand, index) => (
        <Card key={index} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={ageBand.label}
                onChange={(e) => updateAgeBand(index, { label: e.target.value })}
                placeholder="e.g., Adult, Child, Senior"
              />
            </div>
            <div className="space-y-2">
              <Label>Min Age</Label>
              <Input
                type="number"
                value={ageBand.minAge}
                onChange={(e) => updateAgeBand(index, { 
                  minAge: parseInt(e.target.value) || 0 
                })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Age</Label>
              <Input
                type="number"
                value={ageBand.maxAge}
                onChange={(e) => updateAgeBand(index, { 
                  maxAge: parseInt(e.target.value) || 99 
                })}
                min="0"
              />
            </div>
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
                  <SelectItem value="full_price">Full Price</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="surcharge">Surcharge</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input
                type="number"
                value={ageBand.value}
                onChange={(e) => updateAgeBand(index, { 
                  value: parseFloat(e.target.value) || 0 
                })}
                step="0.01"
                placeholder={ageBand.priceType === 'full_price' ? '1.0' : '0.0'}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => removeAgeBand(index)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// Taxes & Fees Editor Component (Placeholder)
function TaxesFeesEditor({ 
  taxesFees, 
  onUpdate 
}: { 
  taxesFees: any[];
  onUpdate: (taxesFees: any[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <DollarSign className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Taxes & Fees configuration coming soon
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          This will allow you to configure VAT, city taxes, service fees, and other charges
        </p>
      </div>
    </div>
  );
}

// Rate Plan Summary Component
function RatePlanSummary({ plan }: { plan: RatePlan }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Supplier</div>
          <div className="font-medium">{plan.supplier.name || 'Not set'}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Currency</div>
          <div className="font-medium">{plan.pricing.currency}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Cost</div>
          <div className="font-medium">{plan.pricing.currency} {plan.pricing.baseCost}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Price</div>
          <div className="font-medium">{plan.pricing.currency} {plan.pricing.basePrice}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">Channels:</div>
        {plan.channels.map((channel) => (
          <Badge key={channel} variant="secondary" className="text-xs">
            {CHANNEL_OPTIONS.find(c => c.id === channel)?.name || channel}
          </Badge>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">Markets:</div>
        {plan.markets.map((market) => (
          <Badge key={market} variant="outline" className="text-xs">
            {MARKET_OPTIONS.find(m => m.id === market)?.name || market}
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Step 3: Availability (simplified for now)
function AvailabilityStep({ 
  data, 
  onNext, 
  onPrevious,
  isEditing = false
}: { 
  data: WizardData; 
  onNext: (data: Partial<WizardData>) => void;
  onPrevious: () => void;
  isEditing?: boolean;
}) {
  const [availability, setAvailability] = useState(data.availability);

  const handleContinue = () => {
    onNext({ availability });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {isEditing ? 'Edit Availability' : 'Availability'}
        </h3>
        <p className="text-muted-foreground">
          {isEditing 
            ? 'Update inventory and allocation for this variant'
            : 'Set inventory and allocation for this variant'
          }
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date From *</label>
            <input
              type="date"
              value={availability.dateFrom}
              onChange={(e) => setAvailability(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date To *</label>
            <input
              type="date"
              value={availability.dateTo}
              onChange={(e) => setAvailability(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Allocation Model</label>
            <select
              value={availability.allocationModel}
              onChange={(e) => setAvailability(prev => ({ 
                ...prev, 
                allocationModel: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="committed">Committed</option>
              <option value="on_request">On Request</option>
              <option value="unlimited">Unlimited</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <input
              type="number"
              value={availability.quantity}
              onChange={(e) => setAvailability(prev => ({ 
                ...prev, 
                quantity: parseInt(e.target.value) || 0 
              }))}
              placeholder="0"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleContinue} disabled={!availability.dateFrom || !availability.dateTo}>
          Continue
        </Button>
      </div>
    </div>
  );
}

// Step 4: Review
function ReviewStep({ 
  data, 
  onPrevious, 
  onComplete,
  isEditing = false
}: { 
  data: WizardData; 
  onPrevious: () => void;
  onComplete: () => void;
  isEditing?: boolean;
}) {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      console.log('Creating variant with data:', data);
      
      const response = await fetch('/api/products/variants/multi-rate', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create variant');
      }

      console.log('Variant created successfully:', result.data);
      onComplete();
    } catch (error) {
      console.error('Failed to create variant:', error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  };

  const productProfile = PRODUCT_TYPE_PROFILES[data.productType as keyof typeof PRODUCT_TYPE_PROFILES];
  const Icon = productProfile?.icon;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">
          {isEditing ? 'Review & Save Changes' : 'Review & Create'}
        </h3>
        <p className="text-muted-foreground">
          {isEditing 
            ? 'Review all changes before saving your variant'
            : 'Review all details before creating your variant'
          }
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Type & Variant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {Icon && <Icon className="w-5 h-5" />}
              <span>{productProfile?.name} - {data.variant.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.variant.description && (
              <p className="text-sm text-muted-foreground mb-2">{data.variant.description}</p>
            )}
            {data.variant.attributes && Object.keys(data.variant.attributes).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.variant.attributes).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rate Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Plans ({data.ratePlans.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.ratePlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{plan.name}</h4>
                  {plan.preferred && <Badge variant="default">Preferred</Badge>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Supplier</div>
                    <div className="font-medium">{plan.supplier.name}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Currency</div>
                    <div className="font-medium">{plan.pricing.currency}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Cost</div>
                    <div className="font-medium">{plan.pricing.currency} {plan.pricing.baseCost}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Price</div>
                    <div className="font-medium">{plan.pricing.currency} {plan.pricing.basePrice}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="text-sm text-muted-foreground">Channels:</div>
                  {plan.channels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="text-xs">
                      {CHANNEL_OPTIONS.find(c => c.id === channel)?.name || channel}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Date From</div>
                <div className="font-medium">{data.availability.dateFrom}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date To</div>
                <div className="font-medium">{data.availability.dateTo}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Allocation</div>
                <div className="font-medium capitalize">{data.availability.allocationModel}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Quantity</div>
                <div className="font-medium">{data.availability.quantity}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleCreate} disabled={isCreating}>
          {isCreating 
            ? (isEditing ? 'Saving...' : 'Creating...') 
            : (isEditing ? 'Save Changes' : 'Create Variant')
          }
        </Button>
      </div>
    </div>
  );
}
