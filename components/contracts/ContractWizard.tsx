'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Circle, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractWizardProps {
  onComplete: (contractData: any) => void
  onCancel: () => void
  initialData?: any
}

const steps = [
  { id: 'supplier', title: 'Supplier Selection', description: 'Choose supplier and basic contract info' },
  { id: 'terms', title: 'Contract Terms', description: 'Define commission, payment terms, and conditions' },
  { id: 'policies', title: 'Policies', description: 'Cancellation and payment policies' },
  { id: 'allocation', title: 'Allocation & Inventory', description: 'Product allocation and inventory limits' },
  { id: 'review', title: 'Review & Create', description: 'Review all details before creating contract' }
]

export function ContractWizard({ onComplete, onCancel, initialData }: ContractWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    supplier_id: '',
    reference: '',
    status: 'active',
    commission: '',
    payment_terms: '',
    cancellation_policy: {},
    payment_policy: {},
    allocation: {},
    ...initialData
  })

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    onComplete(formData)
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Create New Contract</h1>
        <p className="text-muted-foreground">
          Set up a comprehensive contract with your supplier
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
        
        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-2">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                index <= currentStep 
                  ? "border-primary text-primary-foreground" 
                  : "border-muted-foreground text-muted-foreground"
              )}
              style={{
                backgroundColor: index <= currentStep ? 'var(--color-primary)' : 'var(--color-background)',
                borderColor: index <= currentStep ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                color: index <= currentStep ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)'
              }}>
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{steps[currentStep].title}</span>
            <Badge variant="secondary">{steps[currentStep].id}</Badge>
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <SupplierSelectionStep 
              data={formData} 
              onUpdate={updateFormData} 
            />
          )}
          {currentStep === 1 && (
            <ContractTermsStep 
              data={formData} 
              onUpdate={updateFormData} 
            />
          )}
          {currentStep === 2 && (
            <PoliciesStep 
              data={formData} 
              onUpdate={updateFormData} 
            />
          )}
          {currentStep === 3 && (
            <AllocationStep 
              data={formData} 
              onUpdate={updateFormData} 
            />
          )}
          {currentStep === 4 && (
            <ReviewStep 
              data={formData} 
              onUpdate={updateFormData} 
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex items-center space-x-2">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete}>
              Create Contract
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Step Components
function SupplierSelectionStep({ data, onUpdate }: { data: any, onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Supplier</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={data.supplier_id}
            onChange={(e) => onUpdate('supplier_id', e.target.value)}
          >
            <option value="">Select a supplier</option>
            <option value="100">Fairmont Palm Dubai</option>
            <option value="101">F1 Official Tickets</option>
            <option value="102">Abu Dhabi Circuit</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Contract Reference</label>
          <input 
            type="text"
            className="w-full p-2 border rounded-md"
            placeholder="CONTRACT-F1-2024-001"
            value={data.reference}
            onChange={(e) => onUpdate('reference', e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              name="status" 
              value="active"
              checked={data.status === 'active'}
              onChange={(e) => onUpdate('status', e.target.value)}
            />
            <span>Active</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="radio" 
              name="status" 
              value="inactive"
              checked={data.status === 'inactive'}
              onChange={(e) => onUpdate('status', e.target.value)}
            />
            <span>Inactive</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function ContractTermsStep({ data, onUpdate }: { data: any, onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Commission Rate</label>
          <div className="flex items-center space-x-2">
            <input 
              type="number"
              className="flex-1 p-2 border rounded-md"
              placeholder="15"
              value={data.commission}
              onChange={(e) => onUpdate('commission', e.target.value)}
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Terms</label>
          <select 
            className="w-full p-2 border rounded-md"
            value={data.payment_terms}
            onChange={(e) => onUpdate('payment_terms', e.target.value)}
          >
            <option value="">Select payment terms</option>
            <option value="7 days">7 days</option>
            <option value="14 days">14 days</option>
            <option value="21 days">21 days</option>
            <option value="30 days">30 days</option>
            <option value="45 days">45 days</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Additional Terms</label>
        <textarea 
          className="w-full p-2 border rounded-md h-24"
          placeholder="Enter any additional contract terms..."
          value={data.additional_terms || ''}
          onChange={(e) => onUpdate('additional_terms', e.target.value)}
        />
      </div>
    </div>
  )
}

function PoliciesStep({ data, onUpdate }: { data: any, onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Free Cancellation</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="48 hours"
                value={data.cancellation_policy?.free_cancellation || ''}
                onChange={(e) => onUpdate('cancellation_policy', {
                  ...data.cancellation_policy,
                  free_cancellation: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Late Cancellation</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="24 hours"
                value={data.cancellation_policy?.late_cancellation || ''}
                onChange={(e) => onUpdate('cancellation_policy', {
                  ...data.cancellation_policy,
                  late_cancellation: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">No Show Charge</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="100% charge"
                value={data.cancellation_policy?.no_show || ''}
                onChange={(e) => onUpdate('cancellation_policy', {
                  ...data.cancellation_policy,
                  no_show: e.target.value
                })}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit Required</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="50% on booking"
                value={data.payment_policy?.deposit || ''}
                onChange={(e) => onUpdate('payment_policy', {
                  ...data.payment_policy,
                  deposit: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Balance Due</label>
              <input 
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="30 days before arrival"
                value={data.payment_policy?.balance || ''}
                onChange={(e) => onUpdate('payment_policy', {
                  ...data.payment_policy,
                  balance: e.target.value
                })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={data.payment_policy?.currency || 'GBP'}
                onChange={(e) => onUpdate('payment_policy', {
                  ...data.payment_policy,
                  currency: e.target.value
                })}
              >
                <option value="GBP">GBP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AllocationStep({ data, onUpdate }: { data: any, onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Product Allocation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Allocation Type</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={data.allocation?.type || ''}
              onChange={(e) => onUpdate('allocation', {
                ...data.allocation,
                type: e.target.value
              })}
            >
              <option value="">Select allocation type</option>
              <option value="committed">Committed</option>
              <option value="freesale">Freesale</option>
              <option value="on_request">On Request</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Allocation Quantity</label>
            <input 
              type="number"
              className="w-full p-2 border rounded-md"
              placeholder="100"
              value={data.allocation?.quantity || ''}
              onChange={(e) => onUpdate('allocation', {
                ...data.allocation,
                quantity: e.target.value
              })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Allocation Notes</label>
          <textarea 
            className="w-full p-2 border rounded-md h-20"
            placeholder="Enter allocation details..."
            value={data.allocation?.notes || ''}
            onChange={(e) => onUpdate('allocation', {
              ...data.allocation,
              notes: e.target.value
            })}
          />
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ data, onUpdate }: { data: any, onUpdate: (field: string, value: any) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Review Contract Details</h3>
        <p className="text-muted-foreground">Please review all information before creating the contract</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Supplier:</span>
              <span>{data.supplier_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference:</span>
              <span>{data.reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
                {data.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission:</span>
              <span>{data.commission}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Terms:</span>
              <span>{data.payment_terms}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
