'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  Settings,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface PoolVariant {
  id?: string;
  product_variant_id?: number;
  capacity_weight: number;
  cost_per_unit?: number;
  sell_price_per_unit?: number;
  priority: number;
  auto_allocate: boolean;
  product_variant?: {
    id: number;
    name: string;
    subtype: string;
  };
}

interface PoolData {
  // Basic Info
  name: string;
  reference?: string;
  pool_type: 'committed' | 'provisional' | 'on_request' | 'freesale';
  
  // Dates
  valid_from: string;
  valid_to: string;
  
  // Capacity
  total_capacity?: number;
  capacity_unit: string;
  min_commitment?: number;
  
  // Rules
  release_date?: string;
  cutoff_days?: number;
  
  // Financial
  currency: string;
  supplier_id?: number;
  
  // Variants
  pool_variants: PoolVariant[];
  
  // Notes
  notes?: string;
}

interface PoolWizardProps {
  initialData?: Partial<PoolData>;
  onSave: (data: PoolData) => void;
  onCancel: () => void;
  suppliers?: Array<{ id: number; name: string }>;
  productVariants?: Array<{ id: number; name: string; subtype: string }>;
}

export function PoolWizard({ 
  initialData, 
  onSave, 
  onCancel, 
  suppliers = [],
  productVariants = [] 
}: PoolWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<PoolData>({
    name: '',
    pool_type: 'committed',
    valid_from: '',
    valid_to: '',
    capacity_unit: 'rooms',
    currency: 'EUR',
    pool_variants: [],
    ...initialData
  });

  const steps = [
    { id: 'basic', title: 'Basic Information', icon: Building2 },
    { id: 'capacity', title: 'Capacity & Dates', icon: Calendar },
    { id: 'variants', title: 'Pool Variants', icon: Users },
    { id: 'rules', title: 'Booking Rules', icon: Settings },
    { id: 'review', title: 'Review & Create', icon: AlertTriangle }
  ];

  const updateData = (updates: Partial<PoolData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const addPoolVariant = () => {
    const newVariant: PoolVariant = {
      id: `variant_${Date.now()}`,
      capacity_weight: 1.0,
      priority: 100,
      auto_allocate: true,
      cost_per_unit: 0,
      sell_price_per_unit: 0
    };
    updateData({
      pool_variants: [...data.pool_variants, newVariant]
    });
  };

  const updatePoolVariant = (index: number, updates: Partial<PoolVariant>) => {
    const updatedVariants = [...data.pool_variants];
    updatedVariants[index] = { ...updatedVariants[index], ...updates };
    updateData({ pool_variants: updatedVariants });
  };

  const removePoolVariant = (index: number) => {
    updateData({
      pool_variants: data.pool_variants.filter((_, i) => i !== index)
    });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    onSave(data);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pool Name *</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => updateData({ name: e.target.value })}
                  placeholder="e.g., Monaco GP 2025 - Hotel Metropole"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reference">Supplier Reference</Label>
                <Input
                  id="reference"
                  value={data.reference || ''}
                  onChange={(e) => updateData({ reference: e.target.value })}
                  placeholder="e.g., CON-2025-001, F1-MON-2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pool_type">Pool Type *</Label>
                <Select 
                  value={data.pool_type} 
                  onValueChange={(value: any) => updateData({ pool_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="committed">Committed (Guaranteed allocation)</SelectItem>
                    <SelectItem value="provisional">Provisional (Tentative allocation)</SelectItem>
                    <SelectItem value="on_request">On Request (No allocation)</SelectItem>
                    <SelectItem value="freesale">Free Sale (Unlimited availability)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select 
                  value={data.supplier_id?.toString() || ''} 
                  onValueChange={(value) => updateData({ supplier_id: value ? parseInt(value) : undefined })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
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
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={data.valid_from}
                  onChange={(e) => updateData({ valid_from: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="valid_to">Valid To *</Label>
                <Input
                  id="valid_to"
                  type="date"
                  value={data.valid_to}
                  onChange={(e) => updateData({ valid_to: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity_unit">Capacity Unit</Label>
              <Select 
                value={data.capacity_unit} 
                onValueChange={(value) => updateData({ capacity_unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rooms">Rooms</SelectItem>
                  <SelectItem value="seats">Seats</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                  <SelectItem value="people">People</SelectItem>
                  <SelectItem value="tickets">Tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_capacity">Total Capacity</Label>
              <Input
                id="total_capacity"
                type="number"
                value={data.total_capacity || ''}
                onChange={(e) => updateData({ total_capacity: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 100 (leave empty for unlimited)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited capacity (freesale pools)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_commitment">Minimum Commitment</Label>
              <Input
                id="min_commitment"
                type="number"
                value={data.min_commitment || ''}
                onChange={(e) => updateData({ min_commitment: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 80 (minimum units to use)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={data.currency} 
                onValueChange={(value) => updateData({ currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="CHF">CHF (CHF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Pool Variants</h3>
                <p className="text-sm text-muted-foreground">
                  Define which product variants can be sold from this pool
                </p>
              </div>
              <Button onClick={addPoolVariant} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-4">
              {data.pool_variants.map((variant, index) => (
                <Card key={variant.id || index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Variant {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePoolVariant(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Variant</Label>
                      <Select 
                        value={variant.product_variant_id?.toString() || ''} 
                        onValueChange={(value) => {
                          const selectedVariant = productVariants.find(v => v.id.toString() === value);
                          updatePoolVariant(index, { 
                            product_variant_id: parseInt(value),
                            product_variant: selectedVariant
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select variant..." />
                        </SelectTrigger>
                        <SelectContent>
                          {productVariants.map((pv) => (
                            <SelectItem key={pv.id} value={pv.id.toString()}>
                              {pv.name} ({pv.subtype})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Capacity Weight</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={variant.capacity_weight}
                          onChange={(e) => updatePoolVariant(index, { 
                            capacity_weight: parseFloat(e.target.value) || 1.0 
                          })}
                          placeholder="1.0"
                        />
                        <p className="text-xs text-muted-foreground">
                          How much of the pool this consumes (Suite = 1.5x)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Input
                          type="number"
                          value={variant.priority}
                          onChange={(e) => updatePoolVariant(index, { 
                            priority: parseInt(e.target.value) || 100 
                          })}
                          placeholder="100"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lower number = higher priority for auto-allocation
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cost per Unit</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.cost_per_unit || ''}
                          onChange={(e) => updatePoolVariant(index, { 
                            cost_per_unit: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Sell Price per Unit</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={variant.sell_price_per_unit || ''}
                          onChange={(e) => updatePoolVariant(index, { 
                            sell_price_per_unit: e.target.value ? parseFloat(e.target.value) : undefined 
                          })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`auto_allocate_${index}`}
                        checked={variant.auto_allocate}
                        onCheckedChange={(checked) => updatePoolVariant(index, { 
                          auto_allocate: checked as boolean 
                        })}
                      />
                      <Label htmlFor={`auto_allocate_${index}`} className="text-sm">
                        Auto-allocate from this pool
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {data.pool_variants.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <Users className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      No variants added yet. Add variants to define what can be sold from this pool.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                value={data.release_date || ''}
                onChange={(e) => updateData({ release_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                When unused inventory releases back to supplier
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cutoff_days">Booking Cutoff (Days)</Label>
              <Input
                id="cutoff_days"
                type="number"
                value={data.cutoff_days || ''}
                onChange={(e) => updateData({ cutoff_days: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="e.g., 7 (7 days before service)"
              />
              <p className="text-xs text-muted-foreground">
                Days before service when bookings are cut off
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={data.notes || ''}
                onChange={(e) => updateData({ notes: e.target.value })}
                placeholder="Additional notes about this pool..."
                rows={4}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pool Summary</CardTitle>
                <CardDescription>Review your pool configuration before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {data.name}</div>
                      <div><strong>Reference:</strong> {data.reference || 'Not set'}</div>
                      <div><strong>Type:</strong> <Badge>{data.pool_type}</Badge></div>
                      <div><strong>Currency:</strong> {data.currency}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Capacity & Dates</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Valid:</strong> {data.valid_from} to {data.valid_to}</div>
                      <div><strong>Capacity:</strong> {data.total_capacity || 'Unlimited'} {data.capacity_unit}</div>
                      <div><strong>Min Commitment:</strong> {data.min_commitment || 'Not set'}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Pool Variants ({data.pool_variants.length})</h4>
                  <div className="space-y-2">
                    {data.pool_variants.map((variant, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">
                          {variant.product_variant?.name || `Variant ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{variant.capacity_weight}x weight</span>
                          <span>Priority {variant.priority}</span>
                          {variant.auto_allocate && <Badge variant="secondary" className="text-xs">Auto</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(data.release_date || data.cutoff_days || data.notes) && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Rules</h4>
                    <div className="space-y-1 text-sm">
                      {data.release_date && <div><strong>Release Date:</strong> {data.release_date}</div>}
                      {data.cutoff_days && <div><strong>Cutoff:</strong> {data.cutoff_days} days before</div>}
                      {data.notes && <div><strong>Notes:</strong> {data.notes}</div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            
            return (
              <div key={step.id} className="flex items-center space-x-2">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isActive ? 'border-primary bg-primary text-primary-foreground' :
                  isCompleted ? 'border-green-500 bg-green-500 text-white' :
                  'border-muted bg-background text-muted-foreground'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${
                  isActive ? 'text-primary' : 
                  isCompleted ? 'text-green-600' : 
                  'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
                )}
              </div>
            );
          })}
        </div>
        
        <div className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>
            {currentStep === 0 && "Basic pool information and type"}
            {currentStep === 1 && "Capacity, dates, and financial settings"}
            {currentStep === 2 && "Define which variants can be sold from this pool"}
            {currentStep === 3 && "Booking rules and additional settings"}
            {currentStep === 4 && "Review all settings before creating the pool"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button onClick={handleSave}>
              Create Pool
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
