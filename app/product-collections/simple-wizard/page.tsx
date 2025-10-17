'use client';

import { useState } from 'react';
import { SimpleRatePlanWizard } from '@/components/wizards/SimpleRatePlanWizard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SimpleWizardTestPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardResult, setWizardResult] = useState<any>(null);

  const handleWizardComplete = (data: any) => {
    setWizardResult(data);
    setShowWizard(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Create Product Variant Wizard Test</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Test the new simplified variant creation wizard designed specifically for small-mid tour operators. 
          This wizard creates a new product variant with its first rate plan, focusing on the 80% use case with smart templates and progressive disclosure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New Product</CardTitle>
            <CardDescription>
              Create a completely new product with rate plans from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowWizard(true)} 
              className="w-full"
              disabled={showWizard}
            >
              Start New Product Wizard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Product</CardTitle>
            <CardDescription>
              Add a new variant to an existing product (simulates product management page)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowWizard(true)} 
              variant="outline"
              className="w-full"
              disabled={showWizard}
            >
              Add Variant to Existing Product
            </Button>
          </CardContent>
        </Card>
      </div>

      {wizardResult && (
        <Card>
          <CardHeader>
            <CardTitle>Wizard Result</CardTitle>
            <CardDescription>
              The variant creation wizard completed successfully! Here's what was created:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(wizardResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <SimpleRatePlanWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
