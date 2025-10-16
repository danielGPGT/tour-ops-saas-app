'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Zap,
  Copy,
  CheckCircle2
} from 'lucide-react';

interface Step4Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function Step4Pricing({ data, onNext, onBack }: Step4Props) {
  const [pricingMode, setPricingMode] = useState<'clone' | 'manual'>(
    data.cloneFrom ? 'clone' : 'manual'
  );
  const [cost, setCost] = useState('');
  const [price, setPrice] = useState('');
  const [adjustment, setAdjustment] = useState('none');
  const [clonedData, setClonedData] = useState<any>(null);
  const [inheritOccupancy, setInheritOccupancy] = useState(true);

  useEffect(() => {
    if (data.cloneFrom) {
      loadClonedData();
    }
  }, [data.cloneFrom]);

  const loadClonedData = async () => {
    try {
      // In a real app, this would fetch the actual rate plan data
      // For now, we'll use mock data
      setClonedData({
        variant: { name: data.clonedVariant?.name || 'Source Variant' },
        rate_doc: {
          base_cost: '100',
          base_price: '150'
        },
        occupancies: [
          { min_occupancy: 1, max_occupancy: 1, pricing_model: 'fixed', base_amount: '130' },
          { min_occupancy: 2, max_occupancy: 4, pricing_model: 'base_plus_pax', base_amount: '150', per_person_amount: '30' }
        ]
      });
      setCost('100');
      setPrice('150');
    } catch (error) {
      console.error('Failed to load cloned data:', error);
    }
  };

  const applyAdjustment = (type: string) => {
    if (!clonedData) return;
    
    const originalPrice = parseFloat(clonedData.rate_doc.base_price);
    const originalCost = parseFloat(clonedData.rate_doc.base_cost);
    
    switch (type) {
      case 'add_20':
        setPrice((originalPrice + 20).toString());
        setCost((originalCost + 20).toString());
        break;
      case 'add_10_percent':
        setPrice((originalPrice * 1.1).toFixed(2));
        setCost((originalCost * 1.1).toFixed(2));
        break;
      case 'add_30':
        setPrice((originalPrice + 30).toString());
        setCost((originalCost + 30).toString());
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cost || !price) {
      return;
    }

    const margin = parseFloat(price) - parseFloat(cost);
    const marginPercent = (margin / parseFloat(price)) * 100;

    onNext({
      pricing: {
        cost: parseFloat(cost),
        price: parseFloat(price),
        margin,
        marginPercent,
        inheritOccupancy: data.cloneFrom ? inheritOccupancy : true,
        occupancies: data.cloneFrom && inheritOccupancy ? clonedData?.occupancies : [
          {
            minOccupancy: 1,
            maxOccupancy: 1,
            pricingModel: 'fixed',
            baseAmount: parseFloat(price),
            perPersonAmount: null
          }
        ]
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Set pricing</h2>
        {data.cloneFrom && (
          <p className="text-muted-foreground">
            Cloning from: <strong>{clonedData?.variant.name}</strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {data.cloneFrom ? (
          <>
            {/* Quick Adjustment Options */}
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertTitle>Quick Price Adjustment</AlertTitle>
              <AlertDescription className="mt-3 space-y-2">
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyAdjustment('add_20')}
                  >
                    +£20 to all prices
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyAdjustment('add_10_percent')}
                  >
                    +10% to all prices
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyAdjustment('add_30')}
                  >
                    +£30 to all prices
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPricingMode('manual')}
                  >
                    Custom
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* Side-by-side comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Original ({clonedData?.variant.name})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-medium">£{clonedData?.rate_doc.base_cost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">£{clonedData?.rate_doc.base_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin</span>
                    <span className="font-medium">
                      £{(parseFloat(clonedData?.rate_doc.base_price || '0') - parseFloat(clonedData?.rate_doc.base_cost || '0')).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">New ({data.variantName})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Cost</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="pl-6"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Price</Label>
                    <div className="relative mt-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-6"
                        required
                      />
                    </div>
                  </div>

                  {cost && price && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Margin</span>
                        <span className="font-medium">
                          £{(parseFloat(price) - parseFloat(cost)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Occupancy - inherit or adjust */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Occupancy Pricing</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setInheritOccupancy(!inheritOccupancy)}
                >
                  {inheritOccupancy ? 'Customize' : 'Inherit from ' + clonedData?.variant.name}
                </Button>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    {inheritOccupancy 
                      ? `Will use same occupancy rules as ${clonedData?.variant.name}:`
                      : 'Custom occupancy rules will be created'
                    }
                  </p>
                  
                  {inheritOccupancy && clonedData?.occupancies && (
                    <div className="space-y-2 text-sm">
                      {clonedData.occupancies.map((occ: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {occ.min_occupancy === occ.max_occupancy 
                              ? `${occ.min_occupancy} person${occ.min_occupancy > 1 ? 's' : ''}`
                              : `${occ.min_occupancy}-${occ.max_occupancy} people`
                            }
                          </span>
                          <span className="font-medium">
                            {occ.pricing_model === 'fixed' && `£${occ.base_amount}`}
                            {occ.pricing_model === 'base_plus_pax' && 
                              `£${occ.base_amount} + £${occ.per_person_amount}/person`
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          /* New Product - Full Pricing Form */
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Cost per unit</Label>
                <div className="relative mt-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="pl-6"
                    placeholder="100.00"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  What this costs you from the supplier
                </p>
              </div>

              <div>
                <Label htmlFor="price">Price per unit</Label>
                <div className="relative mt-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-6"
                    placeholder="150.00"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  What you'll sell this for
                </p>
              </div>
            </div>

            {cost && price && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Margin:</strong> £{(parseFloat(price) - parseFloat(cost)).toFixed(2)} 
                  ({(parseFloat(price) - parseFloat(cost) / parseFloat(price) * 100).toFixed(1)}% profit margin)
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </form>
    </div>
  );
}
