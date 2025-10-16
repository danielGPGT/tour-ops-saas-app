'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2,
  Calendar,
  Plus,
  Eye,
  ArrowRight
} from 'lucide-react';

interface CreationResult {
  success: boolean;
  product: any;
  variant: any;
  ratePlan: any;
  message: string;
  nextSteps: {
    viewVariant: string;
    addAnother: string;
    createBooking: string;
  };
  stats: {
    allocationDays: number;
    totalUnits: number;
    margin: number;
  };
}

interface SuccessScreenProps {
  result: CreationResult;
  onClose: () => void;
}

export function SuccessScreen({ result, onClose }: SuccessScreenProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-background p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="pt-12 pb-8 text-center">
          {/* Success Animation */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-primary animate-in zoom-in duration-300" />
              </div>
              <div className="absolute inset-0 w-20 h-20 bg-primary/20 rounded-full animate-ping" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            All set! 🎉
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8">
            <strong>{result.variant?.name}</strong> is now ready to sell
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{result.stats?.allocationDays || 0}</div>
              <div className="text-xs text-muted-foreground">Days available</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{result.stats?.totalUnits || 0}</div>
              <div className="text-xs text-muted-foreground">Total units</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{result.stats?.margin || 0}%</div>
              <div className="text-xs text-muted-foreground">Margin</div>
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-left mb-4">What would you like to do next?</h3>
            
            <Button
              size="lg"
              className="w-full justify-between"
              onClick={() => router.push(result.nextSteps?.createBooking || '/bookings/new')}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Create your first booking
              </span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push(result.nextSteps?.addAnother || '/products')}
            >
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add another variant
              </span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push(result.nextSteps?.viewVariant || '/products')}
            >
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                View variant details
              </span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Back to products
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
