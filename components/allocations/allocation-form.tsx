'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { allocationSchema, type AllocationFormData } from '@/lib/validations/allocation.schema'
import { useCreateAllocation, useUpdateAllocation } from '@/lib/hooks/useAllocations'
import { useContracts } from '@/lib/hooks/useContracts'
import { useProducts } from '@/lib/hooks/useProducts'
import { generateAllocationCode } from '@/lib/queries/allocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/common/DatePicker'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  ArrowRight, 
  Check,
  Package,
  Calendar,
  Settings,
  AlertTriangle,
  Clock
} from 'lucide-react'
import type { ContractAllocation } from '@/lib/types/allocation'

interface AllocationFormProps {
  allocation?: ContractAllocation
  contractId?: string
  productId?: string
  onSuccess?: () => void
}

const STEPS = [
  { id: 'contract-product', title: 'Contract & Product', icon: Package },
  { id: 'type-dates', title: 'Type & Dates', icon: Calendar },
  { id: 'restrictions', title: 'Restrictions', icon: Settings },
  { id: 'dow-restrictions', title: 'Day Restrictions', icon: Clock },
  { id: 'blackouts', title: 'Blackout Dates', icon: AlertTriangle },
  { id: 'overbooking', title: 'Overbooking', icon: AlertTriangle },
  { id: 'review', title: 'Review', icon: Check },
]

const ALLOCATION_TYPES = [
  {
    value: 'allotment',
    label: 'Allotment',
    description: 'Fixed inventory block from supplier',
    details: 'Best for: Limited inventory, event tickets',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    value: 'free_sell',
    label: 'Free Sell',
    description: 'Unlimited availability (or very high limit)',
    details: 'Best for: Large hotels, always-available products',
    color: 'bg-green-100 text-green-800'
  },
  {
    value: 'on_request',
    label: 'On Request',
    description: 'Must check with supplier for each booking',
    details: 'Best for: Special requests, custom products',
    color: 'bg-orange-100 text-orange-800'
  }
]

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
]

export function AllocationForm({ allocation, contractId, productId, onSuccess }: AllocationFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  
  const createAllocation = useCreateAllocation()
  const updateAllocation = useUpdateAllocation()
  const { data: contracts } = useContracts()
  const { data: products } = useProducts()

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      contract_id: contractId || allocation?.contract_id || '',
      product_id: productId || allocation?.product_id || '',
      allocation_name: allocation?.allocation_name || '',
      allocation_code: allocation?.allocation_code || '',
      allocation_type: allocation?.allocation_type || 'allotment',
      valid_from: allocation?.valid_from || '',
      valid_to: allocation?.valid_to || '',
      min_nights: allocation?.min_nights || undefined,
      max_nights: allocation?.max_nights || undefined,
      release_days: allocation?.release_days || 0,
      release_type: allocation?.release_type || 'days_before_arrival',
      dow_arrival: allocation?.dow_arrival || [],
      dow_departure: allocation?.dow_departure || [],
      blackout_dates: allocation?.blackout_dates || [],
      allow_overbooking: allocation?.allow_overbooking || false,
      overbooking_limit: allocation?.overbooking_limit || undefined,
      is_active: allocation?.is_active ?? true,
      notes: allocation?.notes || '',
    }
  })

  const watchedValues = form.watch()
  const isEditing = !!allocation

  // Auto-generate allocation code when contract and product change
  useEffect(() => {
    if (watchedValues.contract_id && watchedValues.product_id && !isEditing) {
      setIsGeneratingCode(true)
      generateAllocationCode(watchedValues.contract_id, watchedValues.product_id)
        .then(code => {
          form.setValue('allocation_code', code)
          setIsGeneratingCode(false)
        })
        .catch(() => setIsGeneratingCode(false))
    }
  }, [watchedValues.contract_id, watchedValues.product_id, isEditing, form])

  // Auto-suggest allocation name
  useEffect(() => {
    if (watchedValues.contract_id && watchedValues.product_id && !isEditing) {
      const contract = contracts?.find(c => c.id === watchedValues.contract_id)
      const product = products?.find(p => p.id === watchedValues.product_id)
      if (contract && product) {
        form.setValue('allocation_name', `${contract.contract_name} - ${product.name}`)
      }
    }
  }, [watchedValues.contract_id, watchedValues.product_id, contracts, products, isEditing, form])

  const onSubmit = async (data: AllocationFormData) => {
    try {
      if (isEditing) {
        await updateAllocation.mutateAsync({
          id: allocation.id,
          data
        })
      } else {
        await createAllocation.mutateAsync(data)
      }
      onSuccess?.()
      router.push(`/allocations/${allocation?.id || 'new'}`)
    } catch (error) {
      console.error('Error saving allocation:', error)
    }
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Contract & Product
        return watchedValues.contract_id && watchedValues.product_id && watchedValues.allocation_name
      case 1: // Type & Dates
        return watchedValues.allocation_type && watchedValues.valid_from && watchedValues.valid_to
      default:
        return true
    }
  }

  const getProgress = () => {
    return ((currentStep + 1) / STEPS.length) * 100
  }

  const getDuration = () => {
    if (watchedValues.valid_from && watchedValues.valid_to) {
      const from = new Date(watchedValues.valid_from)
      const to = new Date(watchedValues.valid_to)
      const diffTime = Math.abs(to.getTime() - from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    return 0
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="contract_id">Contract *</Label>
              <Select
                value={watchedValues.contract_id}
                onValueChange={(value) => form.setValue('contract_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contract.contract_name}</span>
                        <Badge variant="outline">{contract.contract_number}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={watchedValues.product_id}
                onValueChange={(value) => form.setValue('product_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.name}</span>
                        <Badge variant="outline">{product.code}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="allocation_name">Allocation Name *</Label>
              <Input
                {...form.register('allocation_name')}
                placeholder="e.g., F1 Main Grandstand Block"
              />
            </div>

            <div>
              <Label htmlFor="allocation_code">Allocation Code *</Label>
              <div className="flex items-center gap-2">
                <Input
                  {...form.register('allocation_code')}
                  placeholder="e.g., F1-MAIN-2025"
                  className="font-mono"
                />
                {isGeneratingCode && (
                  <div className="text-sm text-muted-foreground">Generating...</div>
                )}
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label>Allocation Type *</Label>
              <RadioGroup
                value={watchedValues.allocation_type}
                onValueChange={(value) => form.setValue('allocation_type', value as any)}
                className="space-y-4"
              >
                {ALLOCATION_TYPES.map((type) => (
                  <div key={type.value} className="flex items-start space-x-3">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <div className="flex-1">
                      <Label htmlFor={type.value} className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={type.color}>{type.label}</Badge>
                        </div>
                        <div className="font-medium">{type.description}</div>
                        <div className="text-sm text-muted-foreground">{type.details}</div>
                      </Label>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From *</Label>
                <DatePicker
                  date={watchedValues.valid_from ? new Date(watchedValues.valid_from) : undefined}
                  onDateChange={(date) => form.setValue('valid_from', date?.toISOString().split('T')[0] || '')}
                />
              </div>
              <div>
                <Label htmlFor="valid_to">Valid To *</Label>
                <DatePicker
                  date={watchedValues.valid_to ? new Date(watchedValues.valid_to) : undefined}
                  onDateChange={(date) => form.setValue('valid_to', date?.toISOString().split('T')[0] || '')}
                />
              </div>
            </div>

            {getDuration() > 0 && (
              <div className="text-sm text-muted-foreground">
                Duration: {getDuration()} days
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_nights">Min Nights</Label>
                <Input
                  type="number"
                  {...form.register('min_nights', { valueAsNumber: true })}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <Label htmlFor="max_nights">Max Nights</Label>
                <Input
                  type="number"
                  {...form.register('max_nights', { valueAsNumber: true })}
                  placeholder="e.g., 7"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="release_days">Release Days</Label>
              <Input
                type="number"
                {...form.register('release_days', { valueAsNumber: true })}
                placeholder="e.g., 7"
              />
              <div className="text-sm text-muted-foreground mt-1">
                Inventory released X days before arrival
              </div>
            </div>

            <div>
              <Label htmlFor="release_type">Release Type</Label>
              <Select
                value={watchedValues.release_type}
                onValueChange={(value) => form.setValue('release_type', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="days_before_arrival">Days before arrival</SelectItem>
                  <SelectItem value="fixed_date">Fixed date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label>Arrival Days Allowed</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Which days can customers arrive?
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`arrival-${day.value}`}
                      checked={watchedValues.dow_arrival.includes(day.value as any)}
                      onCheckedChange={(checked) => {
                        const current = watchedValues.dow_arrival
                        if (checked) {
                          form.setValue('dow_arrival', [...current, day.value as any])
                        } else {
                          form.setValue('dow_arrival', current.filter(d => d !== day.value))
                        }
                      }}
                    />
                    <Label htmlFor={`arrival-${day.value}`} className="text-sm">
                      {day.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Departure Days Allowed</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Which days can customers depart?
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`departure-${day.value}`}
                      checked={watchedValues.dow_departure.includes(day.value as any)}
                      onCheckedChange={(checked) => {
                        const current = watchedValues.dow_departure
                        if (checked) {
                          form.setValue('dow_departure', [...current, day.value as any])
                        } else {
                          form.setValue('dow_departure', current.filter(d => d !== day.value))
                        }
                      }}
                    />
                    <Label htmlFor={`departure-${day.value}`} className="text-sm">
                      {day.label.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Blackout Dates</Label>
              <div className="text-sm text-muted-foreground mb-3">
                Select dates when this allocation is not available
              </div>
              <DatePicker
                mode="multiple"
                selected={watchedValues.blackout_dates.map(d => new Date(d))}
                onSelect={(dates) => {
                  form.setValue('blackout_dates', dates?.map(d => d.toISOString().split('T')[0]) || [])
                }}
              />
            </div>

            {watchedValues.blackout_dates.length > 0 && (
              <div>
                <Label>Selected Blackout Dates</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedValues.blackout_dates.map((date) => (
                    <Badge key={date} variant="outline">
                      {format(new Date(date), 'MMM d, yyyy')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                checked={watchedValues.allow_overbooking}
                onCheckedChange={(checked) => form.setValue('allow_overbooking', checked)}
              />
              <Label>Allow Overbooking</Label>
            </div>

            {watchedValues.allow_overbooking && (
              <div>
                <Label htmlFor="overbooking_limit">Overbooking Limit</Label>
                <Input
                  type="number"
                  {...form.register('overbooking_limit', { valueAsNumber: true })}
                  placeholder="e.g., 10"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  How many units over capacity can be booked?
                </div>
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                {...form.register('notes')}
                placeholder="Additional notes about this allocation..."
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={watchedValues.is_active}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
              <Label>Active</Label>
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Allocation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{watchedValues.allocation_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono">{watchedValues.allocation_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge className={ALLOCATION_TYPES.find(t => t.value === watchedValues.allocation_type)?.color}>
                    {watchedValues.allocation_type?.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valid Period:</span>
                  <span>
                    {watchedValues.valid_from && watchedValues.valid_to
                      ? `${format(new Date(watchedValues.valid_from), 'MMM d')} - ${format(new Date(watchedValues.valid_to), 'MMM d, yyyy')}`
                      : 'Not set'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Release Days:</span>
                  <span>{watchedValues.release_days} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={watchedValues.is_active ? 'default' : 'secondary'}>
                    {watchedValues.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Step {currentStep + 1} of {STEPS.length}</span>
          <span>{Math.round(getProgress())}%</span>
        </div>
        <Progress value={getProgress()} />
      </div>

      {/* Step Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground">
          {React.createElement(STEPS[currentStep].icon, { className: 'h-5 w-5' })}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{STEPS[currentStep].title}</h2>
          <p className="text-muted-foreground">
            {currentStep === 0 && 'Select the contract and product for this allocation'}
            {currentStep === 1 && 'Choose the allocation type and set the valid period'}
            {currentStep === 2 && 'Configure minimum/maximum nights and release settings'}
            {currentStep === 3 && 'Set which days of the week are allowed for arrival/departure'}
            {currentStep === 4 && 'Select blackout dates when this allocation is not available'}
            {currentStep === 5 && 'Configure overbooking settings'}
            {currentStep === 6 && 'Review and finalize the allocation'}
          </p>
        </div>
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Saving...' : isEditing ? 'Update Allocation' : 'Create Allocation'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
