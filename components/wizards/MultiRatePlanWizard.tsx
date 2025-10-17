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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { 
  Hotel, 
  MapPin, 
  Calendar as CalendarIcon, 
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
  ChevronRight,
  Trash2,
  Copy
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

interface Product {
  id: number;
  name: string;
  type: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface MultiRatePlanWizardProps {
  isOpen: boolean;
  onCancel: () => void;
  onComplete: (data: any) => void;
  preselectedProduct?: Product;
  existingVariant?: any;
}

interface RateOccupancy {
  id: string;
  minOccupancy: number;
  maxOccupancy: number;
  pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
  baseAmount: number;
  perPersonAmount?: number;
}

interface RatePlan {
  id: string;
  name: string;
  type: 'main' | 'pre_night' | 'post_night';
  dates: {
    from: string;
    to: string;
  };
  pricing: {
    cost: number;
    markupPercentage: number;
    sellingPrice: number;
    currency: string;
  };
  occupancies: RateOccupancy[];
  channels: string[];
  markets: string[];
  preferred: boolean;
}

interface WizardData {
  mode: 'new' | 'existing';
  productId?: number;
  productType: string;
  variantName: string;
  variantDescription: string;
  customAttributes: Array<{ name: string; type: string; value: string }>;
  supplier: Supplier;
  contractReference: string;
  inventoryPool: {
    name: string;
    totalCapacity: number;
    capacityUnit: string;
  };
  ratePlans: RatePlan[];
}

const STEPS = [
  { id: 'variant', title: 'Product Details', description: 'Basic product information' },
  { id: 'supplier', title: 'Supplier & Contract', description: 'Supplier and contract details' },
  { id: 'inventory', title: 'Inventory Pool', description: 'Shared inventory configuration' },
  { id: 'rates', title: 'Rate Plans', description: 'Configure pricing for different periods' },
  { id: 'review', title: 'Review & Create', description: 'Review and create product' }
];

export function MultiRatePlanWizard({ 
  isOpen, 
  onCancel, 
  onComplete, 
  preselectedProduct,
  existingVariant 
}: MultiRatePlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<WizardData>({
    mode: preselectedProduct ? 'existing' : 'new',
    productId: preselectedProduct?.id,
    productType: preselectedProduct?.type || 'accommodation',
    variantName: '',
    variantDescription: '',
    customAttributes: [],
    supplier: { id: '', name: '' },
    contractReference: '',
    inventoryPool: {
      name: '',
      totalCapacity: 100,
      capacityUnit: 'rooms'
    },
    ratePlans: [
      {
        id: 'main',
        name: 'Main Package Rate',
        type: 'main',
        dates: { from: '', to: '' },
        pricing: {
          cost: 800,
          markupPercentage: 60,
          sellingPrice: 1280,
          currency: 'EUR'
        },
        occupancies: [
          {
            id: 'single',
            minOccupancy: 1,
            maxOccupancy: 1,
            pricingModel: 'fixed',
            baseAmount: 290
          },
          {
            id: 'double',
            minOccupancy: 2,
            maxOccupancy: 2,
            pricingModel: 'fixed',
            baseAmount: 310
          }
        ],
        channels: ['b2c', 'b2b'],
        markets: ['UK', 'US'],
        preferred: true
      }
    ]
  });

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/wizard/suppliers');
      const result = await response.json();
      if (result.success) {
        setSuppliers(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    }
  };

  const addRatePlan = (type: 'pre_night' | 'post_night') => {
    const newRatePlan: RatePlan = {
      id: `${type}_${Date.now()}`,
      name: type === 'pre_night' ? 'Pre-Night Add-on' : 'Post-Night Add-on',
      type,
      dates: { from: '', to: '' },
      pricing: {
        cost: 800,
        markupPercentage: 30, // Lower markup for extra nights
        sellingPrice: 1040,
        currency: 'EUR'
      },
      occupancies: [
        {
          id: 'single',
          minOccupancy: 1,
          maxOccupancy: 1,
          pricingModel: 'fixed',
          baseAmount: 290
        },
        {
          id: 'double',
          minOccupancy: 2,
          maxOccupancy: 2,
          pricingModel: 'fixed',
          baseAmount: 310
        }
      ],
      channels: ['b2c', 'b2b'],
      markets: ['UK', 'US'],
      preferred: false
    };

    setData(prev => ({
      ...prev,
      ratePlans: [...prev.ratePlans, newRatePlan]
    }));
  };

  const updateRatePlan = (id: string, updates: Partial<RatePlan>) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.map(rp => 
        rp.id === id ? { ...rp, ...updates } : rp
      )
    }));
  };

  const removeRatePlan = (id: string) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.filter(rp => rp.id !== id)
    }));
  };

  const addOccupancy = (ratePlanId: string) => {
    const newOccupancy: RateOccupancy = {
      id: `occ_${Date.now()}`,
      minOccupancy: 1,
      maxOccupancy: 2,
      pricingModel: 'fixed',
      baseAmount: 300
    };

    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.map(rp => 
        rp.id === ratePlanId 
          ? { ...rp, occupancies: [...rp.occupancies, newOccupancy] }
          : rp
      )
    }));
  };

  const updateOccupancy = (ratePlanId: string, occupancyId: string, updates: Partial<RateOccupancy>) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.map(rp => 
        rp.id === ratePlanId 
          ? { 
              ...rp, 
              occupancies: rp.occupancies.map(occ => 
                occ.id === occupancyId ? { ...occ, ...updates } : occ
              )
            }
          : rp
      )
    }));
  };

  const removeOccupancy = (ratePlanId: string, occupancyId: string) => {
    setData(prev => ({
      ...prev,
      ratePlans: prev.ratePlans.map(rp => 
        rp.id === ratePlanId 
          ? { 
              ...rp, 
              occupancies: rp.occupancies.filter(occ => occ.id !== occupancyId)
            }
          : rp
      )
    }));
  };

  const calculateSellingPrice = (cost: number, markupPercentage: number) => {
    return cost * (1 + markupPercentage / 100);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(data);
    } catch (error) {
      console.error('Failed to create variant:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ProductDetailsStep data={data} setData={setData} preselectedProduct={preselectedProduct} />;
      case 1:
        return <SupplierContractStep data={data} setData={setData} suppliers={suppliers} setSuppliers={setSuppliers} />;
      case 2:
        return <InventoryPoolStep data={data} setData={setData} />;
      case 3:
        return <RatePlansStep data={data} setData={setData} addRatePlan={addRatePlan} updateRatePlan={updateRatePlan} removeRatePlan={removeRatePlan} addOccupancy={addOccupancy} updateOccupancy={updateOccupancy} removeOccupancy={removeOccupancy} calculateSellingPrice={calculateSellingPrice} />;
      case 4:
        return <ReviewStep data={data} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full !max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Product Creation Wizard</h2>
            <p className="text-gray-600 text-xs">Add products to product collection with multiple rate plans</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ✕
          </Button>
        </div>

        <div className="flex">
          {/* Steps Sidebar */}
          <div className="w-48 bg-gray-50 p-4 border-r">
            <div className="space-y-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    index === currentStep
                      ? 'bg-blue-100 text-blue-700'
                      : index < currentStep
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === currentStep
                      ? 'bg-blue-600 text-white'
                      : index < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="text-sm text-gray-600">
            Step {currentStep + 1} of {STEPS.length}
          </div>

          {currentStep === STEPS.length - 1 ? (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
function ProductDetailsStep({ data, setData, preselectedProduct }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold mb-2">Product Details</h3>
        {preselectedProduct && (
          <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
            Adding product to collection: <strong>{preselectedProduct.name}</strong>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="variantName">Product Name</Label>
          <Input
            id="variantName"
            value={data.variantName}
            onChange={(e) => setData((prev: any) => ({ ...prev, variantName: e.target.value }))}
            placeholder="e.g., Standard Double Room"
          />
        </div>
        <div>
          <Label htmlFor="productType">Product Type</Label>
          <Input
            id="productType"
            value={data.productType}
            readOnly
            className="bg-gray-100"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="variantDescription">Product Description</Label>
        <Textarea
          id="variantDescription"
          value={data.variantDescription}
          onChange={(e) => setData((prev: any) => ({ ...prev, variantDescription: e.target.value }))}
          placeholder="Describe this product..."
          rows={3}
        />
      </div>

      <div>
        <Label>Custom Attributes</Label>
        <div className="space-y-2">
          {data.customAttributes.map((attr: any, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Attribute name"
                value={attr.name}
                onChange={(e) => {
                  const newAttrs = [...data.customAttributes];
                  newAttrs[index].name = e.target.value;
                  setData((prev: any) => ({ ...prev, customAttributes: newAttrs }));
                }}
              />
              <Select
                value={attr.type}
                onValueChange={(value) => {
                  const newAttrs = [...data.customAttributes];
                  newAttrs[index].type = value;
                  setData((prev: any) => ({ ...prev, customAttributes: newAttrs }));
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={attr.value}
                onChange={(e) => {
                  const newAttrs = [...data.customAttributes];
                  newAttrs[index].value = e.target.value;
                  setData((prev: any) => ({ ...prev, customAttributes: newAttrs }));
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newAttrs = data.customAttributes.filter((_: any, i: number) => i !== index);
                  setData((prev: any) => ({ ...prev, customAttributes: newAttrs }));
                }}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setData((prev: any) => ({
                ...prev,
                customAttributes: [...prev.customAttributes, { name: '', type: 'text', value: '' }]
              }));
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Attribute
          </Button>
        </div>
      </div>
    </div>
  );
}

function SupplierContractStep({ data, setData, suppliers, setSuppliers }: any) {
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  const handleSupplierSelect = (supplierId: string) => {
    if (supplierId === 'new') {
      setShowNewSupplier(true);
    } else {
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      setData((prev: any) => ({
        ...prev,
        supplier: { id: supplierId, name: supplier?.name || '' }
      }));
    }
  };

  const handleCreateSupplier = async () => {
    if (!newSupplierName.trim()) return;

    try {
      const response = await fetch('/api/wizard/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupplierName })
      });

      const result = await response.json();
      if (result.success) {
        setSuppliers((prev: any) => [...prev, result.data]);
        setData((prev: any) => ({
          ...prev,
          supplier: { id: result.data.id, name: result.data.name }
        }));
        setShowNewSupplier(false);
        setNewSupplierName('');
      }
    } catch (error) {
      console.error('Failed to create supplier:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Supplier & Contract</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="supplier">Supplier</Label>
          <Select value={data.supplier.id} onValueChange={handleSupplierSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((supplier: any) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
              <SelectItem value="new">+ Create New Supplier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contractReference">Contract Reference</Label>
          <Input
            id="contractReference"
            value={data.contractReference}
            onChange={(e) => setData((prev: any) => ({ ...prev, contractReference: e.target.value }))}
            placeholder="e.g., F1-2024-METROPOLE-001"
          />
        </div>
      </div>

      {showNewSupplier && (
        <div className="p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium mb-2">Create New Supplier</h4>
          <div className="flex gap-2">
            <Input
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder="Supplier name"
            />
            <Button onClick={handleCreateSupplier}>Create</Button>
            <Button variant="outline" onClick={() => setShowNewSupplier(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {data.supplier.name && (
        <div className="p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            Selected: <strong>{data.supplier.name}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

function InventoryPoolStep({ data, setData }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Inventory Pool</h3>
      <p className="text-gray-600 mb-4">
        Define the shared inventory pool that all rate plans will use
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="poolName">Pool Name</Label>
          <Input
            id="poolName"
            value={data.inventoryPool.name}
            onChange={(e) => setData((prev: any) => ({
              ...prev,
              inventoryPool: { ...prev.inventoryPool, name: e.target.value }
            }))}
            placeholder="e.g., F1 2024 - Hotel Metropole"
          />
        </div>
        <div>
          <Label htmlFor="capacityUnit">Capacity Unit</Label>
          <Select
            value={data.inventoryPool.capacityUnit}
            onValueChange={(value) => setData((prev: any) => ({
              ...prev,
              inventoryPool: { ...prev.inventoryPool, capacityUnit: value }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rooms">Rooms</SelectItem>
              <SelectItem value="seats">Seats</SelectItem>
              <SelectItem value="units">Units</SelectItem>
              <SelectItem value="people">People</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="totalCapacity">Total Capacity</Label>
        <Input
          id="totalCapacity"
          type="number"
          value={data.inventoryPool.totalCapacity}
          onChange={(e) => setData((prev: any) => ({
            ...prev,
            inventoryPool: { ...prev.inventoryPool, totalCapacity: parseInt(e.target.value) || 0 }
          }))}
          placeholder="100"
        />
        <p className="text-sm text-gray-600 mt-1">
          Total {data.inventoryPool.capacityUnit} available across all rate plans
        </p>
      </div>
    </div>
  );
}

function RatePlansStep({ data, setData, addRatePlan, updateRatePlan, removeRatePlan, addOccupancy, updateOccupancy, removeOccupancy, calculateSellingPrice }: any) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Rate Plans</h3>
          <p className="text-gray-600 text-sm">Configure pricing for different periods</p>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={() => addRatePlan('pre_night')}>
            <Plus className="w-3 h-3 mr-1" />
            Pre-Night
          </Button>
          <Button variant="outline" size="sm" onClick={() => addRatePlan('post_night')}>
            <Plus className="w-3 h-3 mr-1" />
            Post-Night
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {data.ratePlans.map((ratePlan: any) => (
           <RatePlanCard
             key={ratePlan.id}
             ratePlan={ratePlan}
             updateRatePlan={updateRatePlan}
             removeRatePlan={removeRatePlan}
             addOccupancy={addOccupancy}
             updateOccupancy={updateOccupancy}
             removeOccupancy={removeOccupancy}
             calculateSellingPrice={calculateSellingPrice}
             canRemove={ratePlan.type !== 'main'}
           />
        ))}
      </div>
    </div>
  );
}

function RatePlanCard({ ratePlan, updateRatePlan, removeRatePlan, addOccupancy, updateOccupancy, removeOccupancy, calculateSellingPrice, canRemove }: any) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handlePricingChange = (field: string, value: number) => {
    const updates: any = {};
    if (field === 'cost' || field === 'markupPercentage') {
      updates.pricing = {
        ...ratePlan.pricing,
        [field]: value,
        sellingPrice: field === 'cost' 
          ? calculateSellingPrice(value, ratePlan.pricing.markupPercentage)
          : calculateSellingPrice(ratePlan.pricing.cost, value)
      };
    } else {
      updates.pricing = {
        ...ratePlan.pricing,
        [field]: value
      };
    }
    updateRatePlan(ratePlan.id, updates);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={ratePlan.type === 'main' ? 'default' : 'secondary'}>
              {ratePlan.type === 'main' ? 'Main Package' : 
               ratePlan.type === 'pre_night' ? 'Pre-Night' : 'Post-Night'}
            </Badge>
            <Input
              value={ratePlan.name}
              onChange={(e) => updateRatePlan(ratePlan.id, { name: e.target.value })}
              className="font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={ratePlan.preferred}
              onCheckedChange={(checked) => updateRatePlan(ratePlan.id, { preferred: checked })}
            />
            <Label className="text-sm">Preferred</Label>
            {canRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeRatePlan(ratePlan.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <DateRangePicker
            label="Date Range"
            placeholder="Select date range"
            value={ratePlan.dates.from && ratePlan.dates.to ? {
              from: new Date(ratePlan.dates.from),
              to: new Date(ratePlan.dates.to)
            } : undefined}
            onChange={(range) => updateRatePlan(ratePlan.id, {
              dates: {
                from: range?.from ? range.from.toISOString().split('T')[0] : '',
                to: range?.to ? range.to.toISOString().split('T')[0] : ''
              }
            })}
          />
          <div>
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
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Supplier Cost</Label>
            <Input
              type="number"
              value={ratePlan.pricing.cost}
              onChange={(e) => handlePricingChange('cost', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Markup %</Label>
            <Input
              type="number"
              value={ratePlan.pricing.markupPercentage}
              onChange={(e) => handlePricingChange('markupPercentage', parseFloat(e.target.value) || 0)}
            />
          </div>
          <div>
            <Label>Selling Price</Label>
            <Input
              type="number"
              value={ratePlan.pricing.sellingPrice}
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>

         <div>
           <div className="flex items-center justify-between mb-2">
             <Label className="text-sm font-medium">Room Occupancies</Label>
             <Button
               variant="outline"
               size="sm"
               onClick={() => addOccupancy(ratePlan.id)}
             >
               <Plus className="w-4 h-4 mr-2" />
               Add Occupancy
             </Button>
           </div>
           
           <div className="space-y-2">
             {ratePlan.occupancies.map((occupancy: any) => (
               <OccupancyCard
                 key={occupancy.id}
                 occupancy={occupancy}
                 ratePlanId={ratePlan.id}
                 updateOccupancy={updateOccupancy}
                 removeOccupancy={removeOccupancy}
               />
             ))}
           </div>
         </div>

         <div className="flex items-center justify-between">
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowAdvanced(!showAdvanced)}
           >
             {showAdvanced ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
             Advanced Options
           </Button>
         </div>

        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <Label>Channels</Label>
              <div className="flex gap-4 mt-2">
                {['b2c', 'b2b'].map(channel => (
                  <div key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={ratePlan.channels.includes(channel)}
                      onChange={(e) => {
                        const newChannels = e.target.checked
                          ? [...ratePlan.channels, channel]
                          : ratePlan.channels.filter((c: string) => c !== channel);
                        updateRatePlan(ratePlan.id, { channels: newChannels });
                      }}
                    />
                    <Label className="text-sm">{channel.toUpperCase()}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Markets</Label>
              <div className="flex gap-4 mt-2">
                {['UK', 'US', 'DE', 'FR'].map(market => (
                  <div key={market} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={ratePlan.markets.includes(market)}
                      onChange={(e) => {
                        const newMarkets = e.target.checked
                          ? [...ratePlan.markets, market]
                          : ratePlan.markets.filter((m: string) => m !== market);
                        updateRatePlan(ratePlan.id, { markets: newMarkets });
                      }}
                    />
                    <Label className="text-sm">{market}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewStep({ data }: any) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Review & Create</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Name:</strong> {data.variantName}</div>
            <div><strong>Type:</strong> {data.productType}</div>
            <div><strong>Description:</strong> {data.variantDescription}</div>
            <div><strong>Supplier:</strong> {data.supplier.name}</div>
            <div><strong>Contract:</strong> {data.contractReference}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><strong>Name:</strong> {data.inventoryPool.name}</div>
            <div><strong>Capacity:</strong> {data.inventoryPool.totalCapacity} {data.inventoryPool.capacityUnit}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate Plans ({data.ratePlans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.ratePlans.map((ratePlan: any) => (
              <div key={ratePlan.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{ratePlan.name}</div>
                  <div className="text-sm text-gray-600">
                    {ratePlan.dates.from} - {ratePlan.dates.to}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {ratePlan.pricing.currency} {ratePlan.pricing.sellingPrice}
                  </div>
                  <div className="text-sm text-gray-600">
                    {ratePlan.pricing.markupPercentage}% markup
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OccupancyCard({ occupancy, ratePlanId, updateOccupancy, removeOccupancy }: any) {
  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2">
        <Badge variant="outline">
          {occupancy.minOccupancy === occupancy.maxOccupancy 
            ? `${occupancy.minOccupancy} person${occupancy.minOccupancy > 1 ? 's' : ''}`
            : `${occupancy.minOccupancy}-${occupancy.maxOccupancy} people`
          }
        </Badge>
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Min Occupancy</Label>
          <Input
            type="number"
            value={occupancy.minOccupancy}
            onChange={(e) => updateOccupancy(ratePlanId, occupancy.id, { 
              minOccupancy: parseInt(e.target.value) || 1 
            })}
            className="h-7 text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs">Max Occupancy</Label>
          <Input
            type="number"
            value={occupancy.maxOccupancy}
            onChange={(e) => updateOccupancy(ratePlanId, occupancy.id, { 
              maxOccupancy: parseInt(e.target.value) || 2 
            })}
            className="h-7 text-sm"
          />
        </div>
        
        <div>
          <Label className="text-xs">Pricing Model</Label>
          <Select
            value={occupancy.pricingModel}
            onValueChange={(value) => updateOccupancy(ratePlanId, occupancy.id, { 
              pricingModel: value 
            })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="base_plus_pax">Base + Per Person</SelectItem>
              <SelectItem value="per_person">Per Person</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div>
          <Label className="text-xs">Base Amount</Label>
          <Input
            type="number"
            value={occupancy.baseAmount}
            onChange={(e) => updateOccupancy(ratePlanId, occupancy.id, { 
              baseAmount: parseFloat(e.target.value) || 0 
            })}
            className="h-8 text-sm w-20"
          />
        </div>
        
        {occupancy.pricingModel === 'base_plus_pax' && (
          <div>
            <Label className="text-xs">Per Person</Label>
            <Input
              type="number"
              value={occupancy.perPersonAmount || 0}
              onChange={(e) => updateOccupancy(ratePlanId, occupancy.id, { 
                perPersonAmount: parseFloat(e.target.value) || 0 
              })}
              className="h-8 text-sm w-20"
            />
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => removeOccupancy(ratePlanId, occupancy.id)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}