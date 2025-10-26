'use client'

import { useState, useEffect } from 'react'
import { WizardProgress } from './WizardProgress'
import { WizardNavigation } from './WizardNavigation'
import { ContractTypeSelector } from './ContractTypeSelector'
import { QuickPurchaseForm } from './QuickPurchaseForm'
import { QuickOnRequestForm } from './QuickOnRequestForm'
import { Step0Upload } from './Step0Upload'
import { Step1Basics } from './Step1Basics'
import { Step2Allocations } from './Step2Allocations'
import { Step3Rates } from './Step3Rates'
import { useContractWizard } from '../hooks/useContractWizard'
import { useAutoSave } from '../hooks/useAutoSave'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'

type ContractType = 'hotel_allocation' | 'batch_purchase' | 'series' | 'on_request'

interface ContractWizardProps {
  method?: 'pdf' | 'manual'
  onClose: () => void
  onSuccess?: () => void
}

export function ContractWizard({ method, onClose, onSuccess }: ContractWizardProps) {
  const [contractType, setContractType] = useState<ContractType | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { user } = useAuth()
  const {
    wizardData,
    updateWizardData,
    resetWizard,
    extractedData,
    setExtractedData,
    isDirty,
    hasUnsavedChanges
  } = useContractWizard()

  // Auto-save functionality
  useAutoSave({
    wizardData,
    currentStep,
    isDirty,
    onSave: (draftData) => {
      console.log('Auto-saving draft:', draftData)
      // TODO: Implement auto-save API call
    }
  })

  const steps = [
    { id: 0, title: 'Upload & Extract', description: 'Upload PDF or start manually' },
    { id: 1, title: 'Contract Basics', description: 'Supplier, dates, and policies' },
    { id: 2, title: 'Allocations', description: 'Inventory and release schedule' },
    { id: 3, title: 'Rates', description: 'Optional rate setup' }
  ]

  const handleContractTypeSelect = (type: ContractType) => {
    setContractType(type)
    
    // For quick entry forms, skip the multi-step wizard
    if (type === 'batch_purchase' || type === 'on_request') {
      setCurrentStep(0) // Will render the quick form
    } else {
      // For complex contracts, start with step 0 (upload/extract)
      setCurrentStep(0)
    }
  }

  const handleQuickFormSave = (data: any) => {
    toast.success('Contract created successfully!')
    onSuccess?.()
    onClose()
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepChange = (step: number) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to navigate away?'
      )
      if (!confirmed) return
    }
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate all required data
      if (!wizardData.contract?.supplier_id) {
        toast.error('Please select a supplier')
        return
      }
      
      if (!wizardData.contract?.contract_number) {
        toast.error('Please enter a contract number')
        return
      }

      // Call real contract creation API
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify(wizardData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contract')
      }

      const result = await response.json()
      console.log('Contract created successfully:', result)
      
      toast.success('Contract created successfully!')
      resetWizard()
      onSuccess?.()
      onClose()
      
    } catch (error) {
      console.error('Failed to create contract:', error)
      toast.error('Failed to create contract. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    // Show contract type selector first
    if (!contractType) {
      return (
        <ContractTypeSelector
          onSelectType={handleContractTypeSelect}
          onClose={onClose}
        />
      )
    }

    // Show quick entry forms
    if (contractType === 'batch_purchase') {
      return (
        <QuickPurchaseForm
          onSave={handleQuickFormSave}
          onCancel={onClose}
        />
      )
    }

    if (contractType === 'on_request') {
      return (
        <QuickOnRequestForm
          onSave={handleQuickFormSave}
          onCancel={onClose}
        />
      )
    }

    // Show multi-step wizard for complex contracts
    switch (currentStep) {
      case 0:
        return (
          <Step0Upload
            method={method || 'manual'}
            extractedData={extractedData}
            onExtractedData={setExtractedData}
            onNext={handleNext}
            onDataUpdate={updateWizardData}
          />
        )
      case 1:
        return (
          <Step1Basics
            data={wizardData.contract}
            extractedData={extractedData}
            onDataUpdate={(data) => updateWizardData('contract', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 2:
        return (
          <Step2Allocations
            data={wizardData.allocations}
            extractedData={extractedData}
            onDataUpdate={(data) => updateWizardData('allocations', data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 3:
        return (
          <Step3Rates
            data={wizardData.rates}
            extractedData={extractedData}
            onDataUpdate={(data) => updateWizardData('rates', data)}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Indicator - only for complex contracts */}
      {contractType && contractType !== 'batch_purchase' && contractType !== 'on_request' && (
        <WizardProgress 
          steps={steps}
          currentStep={currentStep}
          onStepChange={handleStepChange}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderCurrentStep()}
      </div>

      {/* Navigation - only for complex contracts */}
      {contractType && contractType !== 'batch_purchase' && contractType !== 'on_request' && (
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={steps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          canNext={currentStep < steps.length - 1}
          canSubmit={currentStep === steps.length - 1}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      )}
    </div>
  )
}
