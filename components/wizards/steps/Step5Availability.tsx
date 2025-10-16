'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  ArrowLeft,
  Calendar,
  CalendarCheck,
  Info,
  Link,
  Package,
  Users
} from 'lucide-react';

interface Step5Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function Step5Availability({ data, onNext, onBack }: Step5Props) {
  const [allocationMode, setAllocationMode] = useState<'inherit' | 'separate' | 'new'>(
    data.cloneFrom ? 'inherit' : 'new'
  );
  const [allocationModel, setAllocationModel] = useState<'committed' | 'freesale' | 'on_request'>('committed');
  const [quantity, setQuantity] = useState('100');
  const [separateQuantity, setSeparateQuantity] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Mock cloned allocation data
  const clonedAllocation = data.cloneFrom ? {
    variant: { name: data.clonedVariant?.name || 'Source Variant' },
    quantity: 100,
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    inventoryPool: { name: 'Grand Hotel Paris Pool' }
  } : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalQuantity = allocationMode === 'separate' ? parseInt(separateQuantity) : parseInt(quantity);
    
    if (allocationModel === 'committed' && (!finalQuantity || finalQuantity <= 0)) {
      return;
    }

    onNext({
      availability: {
        allocationModel,
        quantity: allocationModel === 'committed' ? finalQuantity : undefined,
        dateFrom,
        dateTo,
        mode: allocationMode,
        inventoryPoolId: allocationMode === 'inherit' ? 123 : undefined, // Mock ID
        inventoryPool: allocationMode === 'inherit' ? clonedAllocation?.inventoryPool : undefined
      }
    });
  };

  const dateCount = Math.ceil(
    (new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Availability & Allocation</h2>
        {data.cloneFrom && (
          <p className="text-muted-foreground">
            {clonedAllocation?.inventoryPool 
              ? `Currently using shared pool: ${clonedAllocation.inventoryPool.name}`
              : `Currently using dedicated allocation`
            }
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {data.cloneFrom ? (
          /* Cloning Mode - Inherit or Separate */
          <div className="space-y-4">
            <RadioGroup 
              value={allocationMode} 
              onValueChange={(val) => setAllocationMode(val as any)}
            >
              {/* Option 1: Share same pool (recommended) */}
              <Card className={allocationMode === 'inherit' ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="inherit" id="inherit" className="mt-1" />
                    <label htmlFor="inherit" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Share same inventory</span>
                        <Badge variant="secondary">Recommended</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Both {clonedAllocation?.variant.name} and {data.variantName} share 
                        the {clonedAllocation?.quantity}-unit pool. Booking either type reduces the shared count.
                      </p>
                      
                      {allocationMode === 'inherit' && (
                        <Alert className="mt-3">
                          <Info className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>How it works:</strong> If you have 10 units available and someone books 
                            a {data.variantName}, both {clonedAllocation?.variant.name} and {data.variantName} 
                            will show 9 available.
                          </AlertDescription>
                        </Alert>
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Option 2: Separate allocation */}
              <Card className={allocationMode === 'separate' ? 'border-primary' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <RadioGroupItem value="separate" id="separate" className="mt-1" />
                    <label htmlFor="separate" className="flex-1 cursor-pointer">
                      <div className="font-semibold mb-1">
                        Separate inventory
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Create dedicated inventory for {data.variantName}. 
                        Won't affect {clonedAllocation?.variant.name} availability.
                      </p>
                      
                      {allocationMode === 'separate' && (
                        <div className="mt-3">
                          <Label className="text-sm">How many {data.variantName} units?</Label>
                          <Input
                            type="number"
                            min="1"
                            value={separateQuantity}
                            onChange={(e) => setSeparateQuantity(e.target.value)}
                            placeholder="e.g., 20"
                            className="mt-1 max-w-xs"
                          />
                        </div>
                      )}
                    </label>
                  </div>
                </CardContent>
              </Card>
            </RadioGroup>

            {/* Date Range - inherit or adjust */}
            <div className="space-y-3">
              <h3 className="font-semibold">Availability Dates</h3>
              
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Will use same dates as {clonedAllocation?.variant.name}: 
                  <strong className="ml-1">
                    {new Date(clonedAllocation?.dateFrom || dateFrom).toLocaleDateString()} - 
                    {new Date(clonedAllocation?.dateTo || dateTo).toLocaleDateString()}
                  </strong>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        ) : (
          /* New Product - Full Allocation Setup */
          <div className="space-y-6">
            {/* Allocation Model Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Inventory Management</Label>
              
              <RadioGroup 
                value={allocationModel} 
                onValueChange={(val) => setAllocationModel(val as any)}
              >
                {/* Fixed Quantity */}
                <Card className={allocationModel === 'committed' ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="committed" id="committed" className="mt-1" />
                      <label htmlFor="committed" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">Fixed Quantity</span>
                          <Badge variant="secondary">Most Common</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          You have a set number available each day (e.g., 50 units)
                        </p>
                      </label>
                    </div>
                    
                    {allocationModel === 'committed' && (
                      <div className="mt-4 pl-8 space-y-3">
                        <div>
                          <Label className="text-sm">Quantity per day</Label>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="100"
                            className="mt-1 max-w-xs"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Reduces automatically as bookings come in
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Freesale */}
                <Card className={allocationModel === 'freesale' ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="freesale" id="freesale" className="mt-1" />
                      <label htmlFor="freesale" className="flex-1 cursor-pointer">
                        <div className="font-semibold mb-1">
                          Unlimited (Freesale)
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Supplier has unlimited availability - no need to track quantity
                        </p>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* On Request */}
                <Card className={allocationModel === 'on_request' ? 'border-primary' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <RadioGroupItem value="on_request" id="on_request" className="mt-1" />
                      <label htmlFor="on_request" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">On Request</span>
                          <Badge variant="outline">Manual</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Check with supplier for each booking
                        </p>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </RadioGroup>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Available Dates</Label>
              
              {/* Quick Selectors */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const sixMonths = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000);
                    setDateFrom(today.toISOString().split('T')[0]);
                    setDateTo(sixMonths.toISOString().split('T')[0]);
                  }}
                >
                  Next 6 months
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const year = new Date().getFullYear();
                    setDateFrom(`${year}-01-01`);
                    setDateTo(`${year}-12-31`);
                  }}
                >
                  This year
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextYear = new Date().getFullYear() + 1;
                    setDateFrom(`${nextYear}-01-01`);
                    setDateTo(`${nextYear}-12-31`);
                  }}
                >
                  Next year
                </Button>
              </div>
              
              {/* Custom Date Range */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="dateFrom">From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {dateFrom && dateTo && (
          <Alert>
            <CalendarCheck className="h-4 w-4" />
            <AlertDescription>
              Will create {dateCount} days of availability
              {allocationModel === 'committed' && 
                ` with ${allocationMode === 'separate' ? separateQuantity : quantity} units per day`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Review & Create
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </form>
    </div>
  );
}
