'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  Check,
  Info,
  Copy,
  Calendar,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Step6Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  isCreating: boolean;
}

export function Step6Review({ data, onNext, onBack, isCreating }: Step6Props) {
  const [progress, setProgress] = useState<string>('');

  const handleCreate = async () => {
    const finalData = {
      ...data,
      // Add any final processing here
    };
    
    onNext(finalData);
  };

  // Calculate totals
  const dateCount = Math.ceil(
    (new Date(data.availability?.dateTo || new Date()).getTime() - 
     new Date(data.availability?.dateFrom || new Date()).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  
  const allocationCount = data.availability?.allocationModel === 'committed' 
    ? dateCount * (data.availability?.quantity || 0)
    : 0;

  const margin = data.pricing?.price - data.pricing?.cost || 0;
  const marginPercent = data.pricing?.price ? (margin / data.pricing.price) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Review & create</h2>
        <p className="text-muted-foreground">
          {data.mode === 'existing' 
            ? `Adding new variant to ${data.product?.name}`
            : `Creating new product: ${data.product?.name}`
          }
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Product & Variant */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <CardTitle className="text-base">Product & Variant</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => {/* goToStep(1) */}}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{data.product?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Variant</span>
              <span className="font-medium">{data.variantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium capitalize">{data.product?.type}</span>
            </div>
            {data.mode === 'existing' && (
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Adding to existing product with {data.product?.variants?.length || 0} variants
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Supplier & Contract */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <CardTitle className="text-base">Supplier & Contract</CardTitle>
            {data.mode !== 'existing' && (
              <Button variant="ghost" size="sm" onClick={() => {/* goToStep(3) */}}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supplier</span>
              <span className="font-medium">{data.supplier?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract</span>
              <span className="font-medium">
                {data.mode === 'existing' ? 'Existing' : 'Auto-created'}
              </span>
            </div>
            {data.mode === 'existing' && (
              <Alert className="mt-3">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Using existing supplier contract
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <CardTitle className="text-base">Pricing</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => {/* goToStep(4) */}}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cost → Price</span>
              <div className="text-right">
                <div className="font-medium">
                  £{data.pricing?.cost} → £{data.pricing?.price}
                </div>
                <div className="text-xs text-muted-foreground">
                  £{margin.toFixed(2)} ({marginPercent.toFixed(1)}% margin)
                </div>
              </div>
            </div>
            
            {data.cloneFrom && (
              <Alert className="mt-3">
                <Copy className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Cloned from {data.clonedVariant?.name}
                </AlertDescription>
              </Alert>
            )}
            
            {data.pricing?.occupancies && data.pricing.occupancies.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs font-medium mb-1">Occupancy</div>
                {data.pricing.occupancies.slice(0, 2).map((occ: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {occ.min_occupancy === occ.max_occupancy 
                        ? `${occ.min_occupancy}p` 
                        : `${occ.min_occupancy}-${occ.max_occupancy}p`
                      }
                    </span>
                    <span>£{occ.base_amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Availability */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <CardTitle className="text-base">Availability</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => {/* goToStep(5) */}}>
              Edit
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium capitalize">
                {data.availability?.allocationModel === 'committed' && 'Fixed Quantity'}
                {data.availability?.allocationModel === 'freesale' && 'Unlimited'}
                {data.availability?.allocationModel === 'on_request' && 'On Request'}
              </span>
            </div>
            
            {data.availability?.allocationModel === 'committed' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity/day</span>
                  <span className="font-medium">{data.availability?.quantity}</span>
                </div>
                
                {data.availability?.mode === 'inherit' && data.availability?.inventoryPool && (
                  <Alert className="mt-3">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Shares pool: {data.availability.inventoryPool.name}
                    </AlertDescription>
                  </Alert>
                )}
                
                {data.availability?.mode === 'separate' && (
                  <Alert className="mt-3">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Dedicated inventory (not shared)
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date range</span>
              <span className="font-medium text-right">
                {new Date(data.availability?.dateFrom || new Date()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })} - {new Date(data.availability?.dateTo || new Date()).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total days</span>
              <span className="font-medium">{dateCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* What will be created */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            What happens when you create this?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {data.mode === 'new' && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Product "<strong>{data.product?.name}</strong>" will be created</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Supplier contract will be auto-generated</span>
                </div>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Variant "<strong>{data.variantName}</strong>" will be created</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Rate plan with {data.pricing?.occupancies?.length || 1} occupancy rules</span>
            </div>
            
            {data.availability?.allocationModel === 'committed' && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>
                  {allocationCount.toLocaleString()} allocation records 
                  ({dateCount} days × {data.availability?.quantity} units)
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Ready to appear in booking searches immediately</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Estimated creation time:</strong> {
                data.availability?.allocationModel === 'committed' && dateCount > 180
                  ? '~30-60 seconds'
                  : '~5 seconds'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isCreating}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
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
              {progress || 'Creating...'}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Create Variant
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
