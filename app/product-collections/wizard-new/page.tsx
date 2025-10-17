'use client';

import React from 'react';
import { MultiRatePlanWizard } from '@/components/wizards/MultiRatePlanWizard';

export default function NewMultiRateWizardPage() {
  const handleComplete = (data: any) => {
    console.log('Wizard completed with data:', data);
    // Handle completion
  };

  const handleCancel = () => {
    console.log('Wizard cancelled');
    // Handle cancellation
  };

  return (
    <div className="min-h-screen bg-background">
      <MultiRatePlanWizard
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
