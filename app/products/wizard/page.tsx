'use client';

import { useState } from 'react';
import { ProductWizard } from '@/components/wizards/ProductWizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ProductWizardPage() {
  const [wizardComplete, setWizardComplete] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);

  const handleWizardComplete = (result: any) => {
    setCreatedProduct(result);
    setWizardComplete(true);
  };

  if (wizardComplete) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Product Created Successfully!</CardTitle>
                <CardDescription>
                  Your product has been added to your inventory and is ready to sell.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">What was created:</h3>
                  <ul className="space-y-1 text-sm">
                    <li>✓ Product: {createdProduct?.product?.name}</li>
                    <li>✓ Product variant with pricing rules</li>
                    <li>✓ Contract with supplier</li>
                    <li>✓ Rate plan with occupancy pricing</li>
                    <li>✓ Availability buckets for all dates</li>
                    <li>✓ Tax and fee configuration</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-blue-900">Next steps:</h3>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Your product is now available for booking searches</li>
                    <li>• You can add more room types or variants</li>
                    <li>• Set up seasonal pricing if needed</li>
                    <li>• Configure channel-specific rates</li>
                  </ul>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={() => {
                      setWizardComplete(false);
                      setCreatedProduct(null);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Create Another Product
                  </Button>
                  <Button className="flex-1">
                    View Product Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProductWizard onComplete={handleWizardComplete} />
    </div>
  );
}
