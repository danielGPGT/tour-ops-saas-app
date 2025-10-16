'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowRight, ArrowLeft, Package2, Building2, Ticket, Car, Calendar, Ship, Train, Plane, Shield, Utensils, Snowflake } from 'lucide-react';

// Product type profiles with smart defaults
interface ProductTypeProfile {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  examples: string[];
  popular?: boolean;
  badge?: string;
  wizardProfile: {
    variantExamples: string[];
    keyAttributes: string[];
    pricingModel: string;
    occupancyRules: 'critical' | 'simple' | 'capacity_based' | 'none' | 'complex' | 'seat_based';
    allocationModel: string[];
    seasonalPricing: boolean;
    multiNight: boolean;
    slotBased?: boolean;
    singleEvent?: boolean;
    departureBased?: boolean;
    routeBased?: boolean;
  };
}

const PRODUCT_TYPE_PROFILES: ProductTypeProfile[] = [
  {
    id: 'accommodation',
    title: 'Accommodation',
    icon: <Building2 className="w-6 h-6" />,
    description: 'Hotels, apartments, hostels, villas',
    examples: ['Room types', 'bed configurations'],
    popular: true,
    wizardProfile: {
      variantExamples: ['Standard Room', 'Deluxe Room', 'Suite', 'Family Room'],
      keyAttributes: ['room_type', 'bedding', 'max_occupancy', 'view'],
      pricingModel: 'per_night_per_room',
      occupancyRules: 'critical',
      allocationModel: ['committed', 'freesale'],
      seasonalPricing: true,
      multiNight: true
    }
  },
  {
    id: 'activity',
    title: 'Activity / Experience',
    icon: <Ticket className="w-6 h-6" />,
    description: 'Tours, attractions, excursions, classes',
    examples: ['Ticket types', 'time slots'],
    popular: true,
    wizardProfile: {
      variantExamples: ['Adult', 'Child (3-12)', 'Senior (65+)', 'Family Pass'],
      keyAttributes: ['duration', 'difficulty', 'min_age', 'group_size'],
      pricingModel: 'per_person',
      occupancyRules: 'simple',
      allocationModel: ['committed', 'freesale'],
      seasonalPricing: true,
      multiNight: false,
      slotBased: true
    }
  },
  {
    id: 'transfer',
    title: 'Transfer / Transport',
    icon: <Car className="w-6 h-6" />,
    description: 'Airport transfers, shuttles, private cars',
    examples: ['Vehicle types', 'routes'],
    popular: true,
    wizardProfile: {
      variantExamples: ['Sedan', 'SUV', 'Van', 'Minibus'],
      keyAttributes: ['vehicle_type', 'max_passengers', 'max_luggage'],
      pricingModel: 'per_vehicle',
      occupancyRules: 'capacity_based',
      allocationModel: ['freesale', 'committed'],
      seasonalPricing: false,
      multiNight: false,
      routeBased: true
    }
  },
  {
    id: 'cruise',
    title: 'Cruise',
    icon: <Ship className="w-6 h-6" />,
    description: 'Cruise cabins and packages',
    examples: ['Cabin types', 'deck levels'],
    wizardProfile: {
      variantExamples: ['Inside Cabin', 'Ocean View', 'Balcony', 'Suite'],
      keyAttributes: ['cabin_type', 'deck', 'occupancy', 'cabin_number'],
      pricingModel: 'per_cabin_per_cruise',
      occupancyRules: 'critical',
      allocationModel: ['committed'],
      seasonalPricing: false,
      multiNight: true,
      departureBased: true
    }
  },
  {
    id: 'event',
    title: 'Event Ticket',
    icon: <Calendar className="w-6 h-6" />,
    description: 'Concerts, sports, theater, attractions',
    examples: ['Ticket types', 'seating sections'],
    wizardProfile: {
      variantExamples: ['General Admission', 'VIP', 'Premium', 'Box'],
      keyAttributes: ['ticket_type', 'section', 'row', 'seat'],
      pricingModel: 'per_ticket',
      occupancyRules: 'none',
      allocationModel: ['committed'],
      seasonalPricing: false,
      multiNight: false,
      singleEvent: true
    }
  },
  {
    id: 'car_rental',
    title: 'Car Rental',
    icon: <Car className="w-6 h-6" />,
    description: 'Vehicle rentals by day/week',
    examples: ['Vehicle categories', 'extras'],
    wizardProfile: {
      variantExamples: ['Economy', 'Compact', 'SUV', 'Luxury'],
      keyAttributes: ['vehicle_category', 'transmission', 'fuel_type', 'passengers'],
      pricingModel: 'per_day',
      occupancyRules: 'none',
      allocationModel: ['committed', 'freesale'],
      seasonalPricing: true,
      multiNight: true,
      routeBased: true
    }
  },
  {
    id: 'rail',
    title: 'Rail / Train',
    icon: <Train className="w-6 h-6" />,
    description: 'Train tickets and passes',
    examples: ['Class types', 'routes'],
    wizardProfile: {
      variantExamples: ['Standard Class', 'First Class', 'Sleeper'],
      keyAttributes: ['class', 'seat_type', 'flexibility'],
      pricingModel: 'per_person',
      occupancyRules: 'seat_based',
      allocationModel: ['freesale'],
      seasonalPricing: true,
      multiNight: false,
      slotBased: true
    }
  },
  {
    id: 'package',
    title: 'Multi-Day Package',
    icon: <Package2 className="w-6 h-6" />,
    description: 'Complete tours with multiple components',
    examples: ['7-day Italy', 'Weekend Getaway'],
    badge: 'Advanced',
    wizardProfile: {
      variantExamples: ['Standard Package', 'Deluxe Package', 'Budget Option'],
      keyAttributes: ['duration', 'accommodation_level', 'inclusions'],
      pricingModel: 'per_person',
      occupancyRules: 'complex',
      allocationModel: ['committed', 'hybrid'],
      seasonalPricing: false,
      multiNight: true,
      departureBased: true
    }
  },
  {
    id: 'flight',
    title: 'Flight',
    icon: <Plane className="w-6 h-6" />,
    description: 'Airline tickets and flights',
    examples: ['Class types', 'routes'],
    wizardProfile: {
      variantExamples: ['Economy', 'Business', 'First Class'],
      keyAttributes: ['class', 'baggage_allowance', 'meal_included'],
      pricingModel: 'per_person',
      occupancyRules: 'seat_based',
      allocationModel: ['freesale'],
      seasonalPricing: true,
      multiNight: false,
      slotBased: true
    }
  },
  {
    id: 'equipment',
    title: 'Equipment Rental',
    icon: <Snowflake className="w-6 h-6" />,
    description: 'Ski gear, bikes, water sports',
    examples: ['Equipment types', 'sizes'],
    wizardProfile: {
      variantExamples: ['Basic Package', 'Premium Package', 'Professional'],
      keyAttributes: ['equipment_type', 'size', 'brand', 'condition'],
      pricingModel: 'per_day',
      occupancyRules: 'none',
      allocationModel: ['committed', 'freesale'],
      seasonalPricing: true,
      multiNight: true
    }
  },
  {
    id: 'meal',
    title: 'Restaurant / Meal',
    icon: <Utensils className="w-6 h-6" />,
    description: 'Restaurant bookings, meal plans',
    examples: ['Table types', 'meal times'],
    wizardProfile: {
      variantExamples: ['Standard Menu', 'Premium Menu', 'Set Menu'],
      keyAttributes: ['meal_type', 'dietary_options', 'time_slot'],
      pricingModel: 'per_person',
      occupancyRules: 'none',
      allocationModel: ['committed', 'freesale'],
      seasonalPricing: false,
      multiNight: false,
      slotBased: true
    }
  },
  {
    id: 'insurance',
    title: 'Travel Insurance',
    icon: <Shield className="w-6 h-6" />,
    description: 'Travel insurance policies',
    examples: ['Coverage levels'],
    wizardProfile: {
      variantExamples: ['Basic', 'Standard', 'Premium', 'Comprehensive'],
      keyAttributes: ['coverage_type', 'duration', 'age_group'],
      pricingModel: 'per_person',
      occupancyRules: 'none',
      allocationModel: ['freesale'],
      seasonalPricing: false,
      multiNight: false
    }
  }
];

interface WizardData {
  mode: 'existing' | 'new';
  productType?: string;
  product?: any;
  variantName?: string;
  description?: string;
  attributes?: Record<string, any>;
  pricing?: any;
  availability?: any;
}

interface ProductVariantWizardProps {
  preselectedProduct?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductVariantWizard({ preselectedProduct, onClose, onSuccess }: ProductVariantWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>({
    mode: preselectedProduct ? 'existing' : 'new',
    product: preselectedProduct,
    productType: preselectedProduct?.type || 'accommodation'
  });

  const steps = [
    { id: 'product-type', title: 'Product Type', description: 'Choose or confirm product type' },
    { id: 'variant-details', title: 'Variant Details', description: 'Define variant attributes' },
    { id: 'pricing', title: 'Pricing', description: 'Set rates and pricing model' },
    { id: 'availability', title: 'Availability', description: 'Configure inventory and dates' },
    { id: 'review', title: 'Review', description: 'Review and create variant' }
  ];

  const handleNext = (stepData: Partial<WizardData>) => {
    console.log('handleNext called with stepData:', stepData);
    console.log('Previous data:', data);
    
    setData(prev => {
      const newData = { ...prev, ...stepData };
      console.log('New merged data:', newData);
      return newData;
    });
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleComplete = async () => {
    try {
      // Move to success screen
      setCurrentStep(5);
    } catch (error) {
      console.error('Error creating variant:', error);
    }
  };

  const handleSuccessClose = () => {
    onSuccess();
    onClose();
  };

  const renderStep = () => {
    console.log(`Rendering step ${currentStep} with data:`, data);
    
    switch (currentStep) {
      case 0:
        return <ProductTypeStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 1:
        return <VariantDetailsStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <PricingStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <AvailabilityStep data={data} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <ReviewStep data={data} onNext={handleComplete} onBack={handleBack} />;
      case 5:
        return <SuccessScreen onClose={handleSuccessClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header - Hide on success screen */}
      {currentStep < 5 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Product Variant</h2>
              <p className="text-muted-foreground">
                {data.mode === 'existing' 
                  ? `Adding variant to: ${data.product?.name}`
                  : 'Create a new product with variants'
                }
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {index < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-12 h-0.5 mx-2
                    ${index < currentStep ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Info */}
          <div className="text-center">
            <h3 className="font-semibold">{steps[currentStep].title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </div>
  );
}

// Step 1: Product Type Selection
function ProductTypeStep({ data, onNext, onBack }: { data: WizardData; onNext: (data: any) => void; onBack: () => void }) {
  const [selectedType, setSelectedType] = useState(data.productType || '');

  if (data.mode === 'existing') {
    return (
      <div className="text-center space-y-4">
        <Alert>
          <Package2 className="h-4 w-4" />
          <AlertDescription>
            Adding variant to existing product: <strong>{data.product?.name}</strong> ({data.productType})
          </AlertDescription>
        </Alert>
        <Button onClick={() => onNext({ productType: data.productType })} size="lg" className="w-full">
          Continue to Variant Details <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">What type of product?</h3>
        <p className="text-muted-foreground">
          This helps us show you the right fields and options
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_TYPE_PROFILES.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`
              relative p-4 rounded-lg border-2 text-left transition-all
              hover:border-primary hover:shadow-md
              ${selectedType === type.id ? 'border-primary bg-primary/5' : 'border-border'}
            `}
          >
            {type.popular && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                Popular
              </Badge>
            )}
            {type.badge && (
              <Badge className="absolute top-2 right-2" variant="outline">
                {type.badge}
              </Badge>
            )}

            <div className="mb-2">{type.icon}</div>
            <h4 className="font-semibold mb-1">{type.title}</h4>
            <p className="text-xs text-muted-foreground mb-2">
              {type.description}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">e.g.</span> {type.examples}
            </p>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="flex justify-end">
          <Button 
            onClick={() => onNext({ 
              productType: selectedType,
              wizardProfile: PRODUCT_TYPE_PROFILES.find(p => p.id === selectedType)?.wizardProfile
            })} 
            size="lg"
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Step 2: Variant Details (Simplified)
function VariantDetailsStep({ data, onNext, onBack }: { data: WizardData; onNext: (data: any) => void; onBack: () => void }) {
  const [variantName, setVariantName] = useState('');
  const [description, setDescription] = useState('');
  const [customAttributes, setCustomAttributes] = useState('');

  const profile = PRODUCT_TYPE_PROFILES.find(p => p.id === data.productType);
  const getVariantNameLabel = () => {
    switch (data.productType) {
      case 'accommodation': return 'Room Type';
      case 'event': return 'Ticket Type';
      case 'activity': return 'Ticket Type';
      case 'transfer': return 'Vehicle Type';
      case 'car_rental': return 'Vehicle Category';
      case 'flight': return 'Flight Class';
      case 'cruise': return 'Cabin Type';
      default: return 'Variant Name';
    }
  };

  const getVariantNamePlaceholder = () => {
    switch (data.productType) {
      case 'accommodation': return 'e.g., Deluxe Ocean View Room';
      case 'event': return 'e.g., VIP Front Row';
      case 'activity': return 'e.g., Adult Standard Ticket';
      case 'transfer': return 'e.g., Standard Sedan';
      case 'car_rental': return 'e.g., Compact SUV';
      case 'flight': return 'e.g., Economy Class';
      case 'cruise': return 'e.g., Ocean View Balcony Cabin';
      default: return 'Enter variant name';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantName.trim()) return;

    // Parse custom attributes from text area (simple key:value format)
    const attributes: Record<string, any> = {};
    if (customAttributes.trim()) {
      const lines = customAttributes.trim().split('\n');
      lines.forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          attributes[key.trim()] = valueParts.join(':').trim();
        }
      });
    }

    onNext({
      variantName: variantName.trim(),
      description: description.trim(),
      attributes
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Variant Details</h3>
        <p className="text-muted-foreground">
          Basic information for this {data.productType} variant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Variant Name */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {getVariantNameLabel()} *
          </label>
          <input
            type="text"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder={getVariantNamePlaceholder()}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this variant..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Custom Attributes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Custom Attributes (Optional)
          </label>
          <textarea
            value={customAttributes}
            onChange={(e) => setCustomAttributes(e.target.value)}
            placeholder={`Enter key:value pairs, one per line:
capacity: 4
view: ocean
amenities: wifi, pool`}
            rows={4}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: key:value (one per line). Examples: capacity:4, view:ocean, amenities:wifi
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!variantName.trim()}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step 3: Pricing (Adaptive by Product Type)
function PricingStep({ data, onNext, onBack }: { data: WizardData; onNext: (data: any) => void; onBack: () => void }) {
  console.log('PricingStep received data:', data);
  const [currency, setCurrency] = useState('GBP');
  const [pricingModel, setPricingModel] = useState('fixed');
  const [basePrice, setBasePrice] = useState('');
  const [baseCost, setBaseCost] = useState('');
  const [perPersonPrice, setPerPersonPrice] = useState('');
  const [minOccupancy, setMinOccupancy] = useState('1');
  const [maxOccupancy, setMaxOccupancy] = useState('4');
  const [hasAgeBands, setHasAgeBands] = useState(false);
  const [ageBands, setAgeBands] = useState<Array<{name: string, min: number, max: number, price: string, cost: string}>>([]);
  
  // Markup functionality
  const [useMarkup, setUseMarkup] = useState(false);
  const [markupPercentage, setMarkupPercentage] = useState('');

  const profile = PRODUCT_TYPE_PROFILES.find(p => p.id === data.productType);
  const isPerPerson = ['accommodation', 'activity', 'event', 'cruise'].includes(data.productType || '');

  const getPricingModels = () => {
    switch (data.productType) {
      case 'accommodation':
        return [
          { value: 'fixed', label: 'Fixed Rate (per room)', description: 'One price regardless of occupancy' },
          { value: 'base_plus_pax', label: 'Base + Per Person', description: 'Base rate + additional per person' },
          { value: 'per_person', label: 'Per Person', description: 'Price per person in the room' }
        ];
      case 'activity':
      case 'event':
        return [
          { value: 'per_person', label: 'Per Person', description: 'Price per ticket/person' },
          { value: 'fixed', label: 'Fixed Group Rate', description: 'One price for the group' }
        ];
      case 'transfer':
      case 'car_rental':
        return [
          { value: 'fixed', label: 'Fixed Rate', description: 'One price for the vehicle' },
          { value: 'base_plus_pax', label: 'Base + Per Person', description: 'Base rate + additional per person' }
        ];
      case 'flight':
        return [
          { value: 'per_person', label: 'Per Person', description: 'Price per passenger' }
        ];
      case 'cruise':
        return [
          { value: 'per_person', label: 'Per Person (per cabin)', description: 'Price per person sharing a cabin' },
          { value: 'fixed', label: 'Fixed Cabin Rate', description: 'One price for the entire cabin' }
        ];
      default:
        return [{ value: 'fixed', label: 'Fixed Rate', description: 'One price for the item' }];
    }
  };

  const addAgeBand = () => {
    setAgeBands([...ageBands, { name: '', min: 0, max: 100, price: basePrice, cost: baseCost }]);
  };

  const updateAgeBand = (index: number, field: string, value: any) => {
    const updated = [...ageBands];
    updated[index] = { ...updated[index], [field]: value };
    setAgeBands(updated);
  };

  const removeAgeBand = (index: number) => {
    setAgeBands(ageBands.filter((_, i) => i !== index));
  };

  // Markup calculation functions
  const calculatePriceFromMarkup = (cost: number, markupPercent: number) => {
    return cost * (1 + markupPercent / 100);
  };

  const calculateMarkupFromPrice = (cost: number, price: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
  };

  // Auto-calculate price when markup changes
  const handleMarkupChange = (markup: string) => {
    setMarkupPercentage(markup);
    if (useMarkup && baseCost && markup) {
      const cost = parseFloat(baseCost);
      const markupPercent = parseFloat(markup);
      if (!isNaN(cost) && !isNaN(markupPercent)) {
        const calculatedPrice = calculatePriceFromMarkup(cost, markupPercent);
        setBasePrice(calculatedPrice.toFixed(2));
      }
    }
  };

  // Auto-calculate markup when price changes
  const handlePriceChange = (price: string) => {
    setBasePrice(price);
    if (useMarkup && baseCost && price) {
      const cost = parseFloat(baseCost);
      const priceValue = parseFloat(price);
      if (!isNaN(cost) && !isNaN(priceValue)) {
        const calculatedMarkup = calculateMarkupFromPrice(cost, priceValue);
        setMarkupPercentage(calculatedMarkup.toFixed(1));
      }
    }
  };

  // Auto-calculate markup when cost changes
  const handleCostChange = (cost: string) => {
    setBaseCost(cost);
    if (useMarkup && basePrice && cost) {
      const costValue = parseFloat(cost);
      const price = parseFloat(basePrice);
      if (!isNaN(costValue) && !isNaN(price)) {
        const calculatedMarkup = calculateMarkupFromPrice(costValue, price);
        setMarkupPercentage(calculatedMarkup.toFixed(1));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!basePrice || !baseCost) return;

    const pricing = {
      currency,
      model: pricingModel,
      basePrice: parseFloat(basePrice),
      baseCost: parseFloat(baseCost),
      perPersonPrice: perPersonPrice ? parseFloat(perPersonPrice) : null,
      occupancy: {
        min: parseInt(minOccupancy),
        max: parseInt(maxOccupancy)
      },
      ageBands: hasAgeBands ? ageBands : [],
      markup: useMarkup ? {
        enabled: true,
        percentage: parseFloat(markupPercentage || '0'),
        calculated: true
      } : {
        enabled: false,
        percentage: 0,
        calculated: false
      }
    };

    console.log('PricingStep sending pricing data:', pricing);
    onNext({ pricing });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Pricing</h3>
        <p className="text-muted-foreground">
          Set pricing model and rates for {data.productType}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium mb-2">Currency *</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="GBP">GBP (£)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
          </select>
        </div>

        {/* Pricing Model */}
        <div>
          <label className="block text-sm font-medium mb-2">Pricing Model *</label>
          <div className="space-y-3">
            {getPricingModels().map(model => (
              <label key={model.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="pricingModel"
                  value={model.value}
                  checked={pricingModel === model.value}
                  onChange={(e) => setPricingModel(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{model.label}</div>
                  <div className="text-sm text-muted-foreground">{model.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Base Price */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {pricingModel === 'per_person' ? 'Price Per Person' : 'Base Price'} *
            {useMarkup && <span className="text-xs text-muted-foreground ml-2">(calculated from markup)</span>}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-muted-foreground">
              {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={basePrice}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="0.00"
              className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                useMarkup ? 'bg-muted cursor-not-allowed' : ''
              }`}
              disabled={useMarkup}
              required
            />
          </div>
          {useMarkup && (
            <p className="text-xs text-muted-foreground mt-1">
              Price is automatically calculated from cost + markup
            </p>
          )}
        </div>

        {/* Base Cost */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {pricingModel === 'per_person' ? 'Cost Per Person' : 'Base Cost'} *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-muted-foreground">
              {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={baseCost}
              onChange={(e) => handleCostChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your cost from the supplier
          </p>
        </div>

        {/* Markup Toggle */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useMarkup}
              onChange={(e) => setUseMarkup(e.target.checked)}
            />
            <span className="text-sm font-medium">Use percentage markup to calculate selling price</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Automatically calculate selling price based on cost + markup percentage
          </p>
        </div>

        {/* Markup Percentage */}
        {useMarkup && (
          <div>
            <label className="block text-sm font-medium mb-2">Markup Percentage</label>
            
            {/* Quick markup buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: '15%', value: '15' },
                { label: '20%', value: '20' },
                { label: '25%', value: '25' },
                { label: '30%', value: '30' },
                { label: '35%', value: '35' },
                { label: '50%', value: '50' }
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleMarkupChange(preset.value)}
                  className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                    markupPercentage === preset.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={markupPercentage}
                onChange={(e) => handleMarkupChange(e.target.value)}
                placeholder="25.0"
                className="w-full pl-3 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-2 text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Enter your desired markup percentage (e.g., 25% = 25% markup on cost)
            </p>
            {baseCost && markupPercentage && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-xs text-blue-800">
                  <strong>Example:</strong> Cost {currency} {parseFloat(baseCost).toFixed(2)} + {markupPercentage}% markup = 
                  <span className="font-semibold"> {currency} {calculatePriceFromMarkup(parseFloat(baseCost), parseFloat(markupPercentage)).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Per Person Price (for base_plus_pax model) */}
        {pricingModel === 'base_plus_pax' && (
          <div>
            <label className="block text-sm font-medium mb-2">Additional Price Per Person</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-muted-foreground">
                {currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={perPersonPrice}
                onChange={(e) => setPerPersonPrice(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Occupancy Range */}
        {isPerPerson && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Occupancy</label>
              <input
                type="number"
                min="1"
                value={minOccupancy}
                onChange={(e) => setMinOccupancy(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Occupancy</label>
              <input
                type="number"
                min="1"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}

        {/* Age Bands (for activities/events) */}
        {['activity', 'event'].includes(data.productType || '') && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Age Bands</label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasAgeBands}
                  onChange={(e) => setHasAgeBands(e.target.checked)}
                />
                <span className="text-sm">Use age-based pricing</span>
              </label>
            </div>

            {hasAgeBands && (
              <div className="space-y-3">
                {ageBands.map((band, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                    <input
                      type="text"
                      placeholder="Band name (e.g., Adult)"
                      value={band.name}
                      onChange={(e) => updateAgeBand(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Min age"
                      value={band.min}
                      onChange={(e) => updateAgeBand(index, 'min', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm">to</span>
                    <input
                      type="number"
                      placeholder="Max age"
                      value={band.max}
                      onChange={(e) => updateAgeBand(index, 'max', parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-xs text-muted-foreground">£</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={band.price}
                        onChange={(e) => updateAgeBand(index, 'price', e.target.value)}
                        className="w-20 pl-6 pr-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAgeBand(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addAgeBand}
                  className="w-full"
                >
                  + Add Age Band
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Margin Display */}
        {basePrice && baseCost && (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium mb-1">Pricing Summary</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>
                Margin: {currency} {(parseFloat(basePrice) - parseFloat(baseCost)).toFixed(2)} 
                ({(parseFloat(basePrice) > 0 ? ((parseFloat(basePrice) - parseFloat(baseCost)) / parseFloat(basePrice) * 100).toFixed(1) : 0)}%)
              </div>
              {useMarkup && markupPercentage && (
                <div>
                  Markup: {parseFloat(markupPercentage).toFixed(1)}% on cost
                </div>
              )}
              {useMarkup && baseCost && basePrice && (
                <div className="text-xs">
                  Cost: {currency} {parseFloat(baseCost).toFixed(2)} → Price: {currency} {parseFloat(basePrice).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!basePrice || !baseCost}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step 4: Availability (Product-Type Aware)
function AvailabilityStep({ data, onNext, onBack }: { data: WizardData; onNext: (data: any) => void; onBack: () => void }) {
  console.log('AvailabilityStep received data:', data);
  const [allocationModel, setAllocationModel] = useState('committed');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quantity, setQuantity] = useState('');
  const [hasTimeSlots, setHasTimeSlots] = useState(false);
  const [timeSlots, setTimeSlots] = useState<Array<{time: string, name: string, duration: number}>>([]);
  const [allowOverbooking, setAllowOverbooking] = useState(false);
  const [overbookingLimit, setOverbookingLimit] = useState('');

  const isEvent = data.productType === 'event';
  const isActivity = data.productType === 'activity';
  const needsTimeSlots = isActivity;

  const getAllocationModels = () => {
    switch (data.productType) {
      case 'accommodation':
        return [
          { value: 'committed', label: 'Committed Inventory', description: 'Fixed number of rooms available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' },
          { value: 'unlimited', label: 'Unlimited', description: 'No capacity restrictions' }
        ];
      case 'activity':
        return [
          { value: 'committed', label: 'Committed Slots', description: 'Fixed number of spots per time slot' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
      case 'event':
        return [
          { value: 'committed', label: 'Committed Tickets', description: 'Fixed number of tickets available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
      case 'transfer':
      case 'car_rental':
        return [
          { value: 'committed', label: 'Committed Vehicles', description: 'Fixed number of vehicles available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
      case 'flight':
        return [
          { value: 'committed', label: 'Committed Seats', description: 'Fixed number of seats available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
      case 'cruise':
        return [
          { value: 'committed', label: 'Committed Cabins', description: 'Fixed number of cabins available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
      default:
        return [
          { value: 'committed', label: 'Committed Inventory', description: 'Fixed quantity available' },
          { value: 'on_request', label: 'On Request', description: 'Check availability with supplier' }
        ];
    }
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { time: '', name: '', duration: 180 }]);
  };

  const updateTimeSlot = (index: number, field: string, value: any) => {
    const updated = [...timeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setTimeSlots(updated);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom || !dateTo) return;
    if (allocationModel === 'committed' && !quantity) return;

    const availability = {
      allocationModel,
      dateFrom,
      dateTo,
      quantity: allocationModel === 'committed' ? parseInt(quantity) : null,
      timeSlots: hasTimeSlots ? timeSlots : [],
      overbooking: {
        allowed: allowOverbooking,
        limit: allowOverbooking ? parseInt(overbookingLimit || '0') : 0
      },
      isEvent,
      isActivity
    };

    console.log('AvailabilityStep sending availability data:', availability);
    onNext({ availability });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Availability</h3>
        <p className="text-muted-foreground">
          Configure inventory and availability for {data.productType}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Allocation Model */}
        <div>
          <label className="block text-sm font-medium mb-2">Inventory Model *</label>
          <div className="space-y-3">
            {getAllocationModels().map(model => (
              <label key={model.value} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="allocationModel"
                  value={model.value}
                  checked={allocationModel === model.value}
                  onChange={(e) => setAllocationModel(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{model.label}</div>
                  <div className="text-sm text-muted-foreground">{model.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {isEvent ? 'Event Start Date' : 'Available From'} *
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {isEvent ? 'Event End Date' : 'Available To'} *
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        </div>

        {/* Quantity (for committed inventory) */}
        {allocationModel === 'committed' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {isEvent ? 'Total Tickets Available' : 
               isActivity ? 'Spots Per Time Slot' :
               data.productType === 'accommodation' ? 'Rooms Available' :
               data.productType === 'transfer' ? 'Vehicles Available' :
               data.productType === 'flight' ? 'Seats Available' :
               data.productType === 'cruise' ? 'Cabins Available' :
               'Units Available'} *
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
        )}

        {/* Time Slots (for activities) */}
        {needsTimeSlots && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Time Slots</label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasTimeSlots}
                  onChange={(e) => setHasTimeSlots(e.target.checked)}
                />
                <span className="text-sm">Use time slots</span>
              </label>
            </div>

            {hasTimeSlots && (
              <div className="space-y-3">
                {timeSlots.map((slot, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 border rounded-md">
                    <input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Slot name (e.g., Morning Tour)"
                      value={slot.name}
                      onChange={(e) => updateTimeSlot(index, 'name', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Duration (min)"
                      value={slot.duration}
                      onChange={(e) => updateTimeSlot(index, 'duration', parseInt(e.target.value))}
                      className="w-24 px-2 py-1 border rounded text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTimeSlot}
                  className="w-full"
                >
                  + Add Time Slot
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Overbooking */}
        {allocationModel === 'committed' && (
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowOverbooking}
                onChange={(e) => setAllowOverbooking(e.target.checked)}
              />
              <span className="text-sm font-medium">Allow overbooking</span>
            </label>
            
            {allowOverbooking && (
              <div className="mt-3">
                <label className="block text-sm font-medium mb-2">Overbooking Limit</label>
                <input
                  type="number"
                  min="0"
                  value={overbookingLimit}
                  onChange={(e) => setOverbookingLimit(e.target.value)}
                  placeholder="Additional units to allow"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Allow selling {quantity ? parseInt(quantity) + parseInt(overbookingLimit || '0') : '0'} total units
                </p>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {dateFrom && dateTo && (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium mb-1">Availability Summary</div>
            <div className="text-sm text-muted-foreground">
              {isEvent ? 'Event' : 'Available'} from {new Date(dateFrom).toLocaleDateString()} to {new Date(dateTo).toLocaleDateString()}
              {allocationModel === 'committed' && quantity && (
                <span> • {quantity} units {allowOverbooking && overbookingLimit ? `(+${overbookingLimit} overbooking)` : ''}</span>
              )}
              {hasTimeSlots && timeSlots.length > 0 && (
                <span> • {timeSlots.length} time slots</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!dateFrom || !dateTo || (allocationModel === 'committed' && !quantity)}>
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Step 5: Review & Create
function ReviewStep({ data, onNext, onBack }: { data: WizardData; onNext: () => void; onBack: () => void }) {
  const [isCreating, setIsCreating] = useState(false);

  // Debug logging to see what data we have
  console.log('ReviewStep received data:', {
    productType: data.productType,
    variantName: data.variantName,
    pricing: data.pricing,
    availability: data.availability,
    attributes: data.attributes
  });

  const handleCreate = async () => {
    setIsCreating(true);
    
    try {
      const requestData = {
        mode: data.mode, // Use the mode from wizard data
        product: data.mode === 'existing' ? data.product : {
          name: `New ${data.productType} Product`,
          type: data.productType
        },
        variantName: data.variantName,
        supplier: { id: 0, name: 'New Supplier' }, // Default for now
        pricing: data.pricing,
        availability: data.availability,
        attributes: data.attributes
      };

      // Debug logging
      console.log('Wizard sending data:', {
        ...requestData,
        availability: data.availability ? {
          dateFrom: data.availability.dateFrom,
          dateTo: data.availability.dateTo,
          allocationModel: data.availability.allocationModel
        } : 'undefined',
        pricing: data.pricing ? {
          currency: data.pricing.currency,
          basePrice: data.pricing.basePrice,
          baseCost: data.pricing.baseCost
        } : 'undefined'
      });

      // Call the API to create the variant
      const response = await fetch('/api/products/variants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      if (result.success) {
        onNext();
      } else {
        console.error('Failed to create variant:', result.error);
        // In a real app, show error message to user
        alert('Failed to create variant: ' + result.error);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating variant:', error);
      alert('Error creating variant. Please try again.');
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols = { GBP: '£', USD: '$', EUR: '€', CAD: 'C$', AUD: 'A$' };
    return `${symbols[currency as keyof typeof symbols] || currency}${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Create</h3>
        <p className="text-muted-foreground">
          Review your variant details before creating
        </p>
      </div>

      <div className="space-y-4">
        {/* Product Type */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Product Type</h4>
          <div className="flex items-center space-x-2">
            {PRODUCT_TYPE_PROFILES.find(p => p.id === data.productType)?.icon}
            <span className="capitalize">{data.productType}</span>
          </div>
        </div>

        {/* Variant Details */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-2">Variant Details</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Name:</span> {data.variantName}</div>
            {data.description && <div><span className="font-medium">Description:</span> {data.description}</div>}
            {data.attributes && Object.keys(data.attributes).length > 0 && (
              <div>
                <span className="font-medium">Attributes:</span>
                <div className="ml-4 mt-1">
                  {Object.entries(data.attributes).map(([key, value]) => (
                    <div key={key} className="text-muted-foreground">
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        {data.pricing && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Pricing</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Model:</span> {data.pricing.model}</div>
              <div><span className="font-medium">Base Price:</span> {formatCurrency(data.pricing.basePrice, data.pricing.currency)}</div>
              <div><span className="font-medium">Base Cost:</span> {formatCurrency(data.pricing.baseCost, data.pricing.currency)}</div>
              {data.pricing.perPersonPrice && (
                <div><span className="font-medium">Per Person:</span> {formatCurrency(data.pricing.perPersonPrice, data.pricing.currency)}</div>
              )}
              {data.pricing.occupancy && (
                <div><span className="font-medium">Occupancy:</span> {data.pricing.occupancy.min}-{data.pricing.occupancy.max} people</div>
              )}
              {data.pricing.ageBands && data.pricing.ageBands.length > 0 && (
                <div>
                  <span className="font-medium">Age Bands:</span>
                  <div className="ml-4 mt-1">
                    {data.pricing.ageBands.map((band: any, index: number) => (
                      <div key={index} className="text-muted-foreground">
                        {band.name}: {band.min}-{band.max} years, {formatCurrency(parseFloat(band.price), data.pricing.currency)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-green-600 font-medium">
                Margin: {formatCurrency(data.pricing.basePrice - data.pricing.baseCost, data.pricing.currency)} 
                ({(data.pricing.basePrice > 0 ? ((data.pricing.basePrice - data.pricing.baseCost) / data.pricing.basePrice * 100).toFixed(1) : 0)}%)
              </div>
              {data.pricing.markup?.enabled && (
                <div className="text-blue-600 font-medium">
                  Markup: {data.pricing.markup.percentage.toFixed(1)}% on cost
                </div>
              )}
            </div>
          </div>
        )}

        {/* Availability */}
        {data.availability && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2">Availability</h4>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Model:</span> {data.availability.allocationModel}</div>
              <div><span className="font-medium">Period:</span> {formatDate(data.availability.dateFrom)} to {formatDate(data.availability.dateTo)}</div>
              {data.availability.quantity && (
                <div><span className="font-medium">Quantity:</span> {data.availability.quantity} units</div>
              )}
              {data.availability.timeSlots && data.availability.timeSlots.length > 0 && (
                <div>
                  <span className="font-medium">Time Slots:</span>
                  <div className="ml-4 mt-1">
                    {data.availability.timeSlots.map((slot: any, index: number) => (
                      <div key={index} className="text-muted-foreground">
                        {slot.time} - {slot.name} ({slot.duration} min)
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.availability.overbooking.allowed && (
                <div className="text-orange-600">
                  <span className="font-medium">Overbooking:</span> +{data.availability.overbooking.limit} units
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Product Type:</span>
            <div className="capitalize">{data.productType}</div>
          </div>
          <div>
            <span className="font-medium">Variant:</span>
            <div>{data.variantName}</div>
          </div>
          {data.pricing && (
            <>
              <div>
                <span className="font-medium">Base Price:</span>
                <div>{formatCurrency(data.pricing.basePrice, data.pricing.currency)}</div>
              </div>
              <div>
                <span className="font-medium">Margin:</span>
                <div className="text-green-600 font-medium">
                  {((data.pricing.basePrice - data.pricing.baseCost) / data.pricing.basePrice * 100).toFixed(1)}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isCreating}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleCreate} size="lg" disabled={isCreating}>
          {isCreating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              Create Variant <CheckCircle className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Success Screen
function SuccessScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-green-900 mb-2">Variant Created Successfully!</h3>
        <p className="text-muted-foreground">
          Your product variant has been created and is ready for bookings.
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onClose}>
          View Product
        </Button>
      </div>
    </div>
  );
}
