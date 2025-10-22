"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DatePicker } from '@/components/ui/date-picker'
import { 
  Calendar,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogFormProps {
  schema: z.ZodSchema<any>
  defaultValues?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
  submitLabel?: string
  cancelLabel?: string
  className?: string
}

export function DialogForm({
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  className
}: DialogFormProps) {
  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues
  })

  const handleSubmit = (data: any) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-6", className)}>
      <div className="space-y-4">
        {/* Basic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter name"
                  className={cn(form.formState.errors.name && 'border-red-500')}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">
                    {String(form.formState.errors.name.message)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select onValueChange={(value) => form.setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="interim">Interim Payment</SelectItem>
                    <SelectItem value="final">Final Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...form.register('amount', { valueAsNumber: true })}
                  placeholder="0.00"
                  className={cn(form.formState.errors.amount && 'border-red-500')}
                />
                {form.formState.errors.amount && (
                  <p className="text-xs text-red-500">
                    {String(form.formState.errors.amount.message)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select onValueChange={(value) => form.setValue('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <DatePicker
                  date={form.watch('dueDate')}
                  onDateChange={(date) => form.setValue('dueDate', date)}
                  placeholder="Select due date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="daysBefore">Days Before Arrival</Label>
                <Input
                  id="daysBefore"
                  type="number"
                  {...form.register('daysBefore', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4" />
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mandatory"
                {...form.register('mandatory')}
              />
              <Label htmlFor="mandatory" className="text-sm">
                This payment is mandatory
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

// Specialized form components for different contract entities
export function PaymentScheduleForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading
}: {
  defaultValues?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const schema = z.object({
    payment_stage: z.string().min(1, 'Payment stage is required'),
    payment_type: z.enum(['percentage', 'fixed_amount']),
    percentage: z.number().min(0).max(100).optional(),
    fixed_amount: z.number().min(0).optional(),
    due_type: z.enum(['days_before_arrival', 'days_after_booking', 'fixed_date']),
    days_before: z.number().min(0).optional(),
    days_after: z.number().min(0).optional(),
    due_date: z.string().optional(),
    description: z.string().optional(),
    is_mandatory: z.boolean().default(true)
  })

  return (
    <DialogForm
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitLabel="Save Schedule"
    />
  )
}

// Buttonless version for use inside EditDialog
export const PaymentScheduleFormContent = React.memo(React.forwardRef<HTMLFormElement, {
  defaultValues?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}>(({ defaultValues, onSubmit, isLoading }, ref) => {
  console.log('🎨 PaymentScheduleFormContent rendering with:', { defaultValues, isLoading })
  const schema = z.object({
    payment_stage: z.string().min(1, 'Payment stage is required'),
    payment_type: z.enum(['percentage', 'fixed_amount']),
    percentage: z.number().min(0).max(100).optional().nullable(),
    fixed_amount: z.number().min(0).optional().nullable(),
    due_type: z.enum(['days_before_arrival', 'days_after_booking', 'fixed_date']),
    days_before: z.number().min(0).optional().nullable(),
    days_after: z.number().min(0).optional().nullable(),
    due_date: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    is_mandatory: z.boolean().default(true)
  }) as any

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues
  })

  // Debug form state (optimized to prevent excessive re-renders)
  React.useEffect(() => {
    const hasErrors = Object.keys(form.formState.errors).length > 0
    if (hasErrors || !form.formState.isValid) {
      console.log('📊 PaymentScheduleFormContent form state:', {
        isValid: form.formState.isValid,
        errors: form.formState.errors,
        values: form.getValues()
      })
      console.log('🔍 Detailed validation errors:', form.formState.errors)
    }
  }, [form.formState.isValid, form.formState.errors])

  const handleSubmit = (data: any) => {
    console.log('📝 PaymentScheduleFormContent handleSubmit called with:', data)
    console.log('📤 Calling onSubmit with data:', data)
    onSubmit(data)
  }

  return (
    <form ref={ref} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Payment Stage */}
        <div className="space-y-2">
          <Label htmlFor="payment_stage">Payment Stage *</Label>
          <Input
            id="payment_stage"
            {...form.register('payment_stage')}
            placeholder="e.g., Deposit, Interim, Final"
          />
        </div>

        {/* Payment Type and Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type</Label>
            <Select onValueChange={(value) => form.setValue('payment_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {form.watch('payment_type') === 'percentage' ? (
              <>
                <Label htmlFor="percentage">Percentage (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...form.register('percentage', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                  })}
                  placeholder="0.00"
                />
              </>
            ) : (
              <>
                <Label htmlFor="fixed_amount">Fixed Amount</Label>
                <Input
                  id="fixed_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('fixed_amount', { 
                    valueAsNumber: true,
                    setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                  })}
                  placeholder="0.00"
                />
              </>
            )}
          </div>
        </div>

        {/* Due Type and Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="due_type">Due Type</Label>
            <Select onValueChange={(value) => form.setValue('due_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select due type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days_before_arrival">Days Before Arrival</SelectItem>
                <SelectItem value="days_after_booking">Days After Booking</SelectItem>
                <SelectItem value="fixed_date">Fixed Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Conditional fields based on due type */}
          {form.watch('due_type') === 'days_before_arrival' && (
            <div className="space-y-2">
              <Label htmlFor="days_before">Days Before Arrival</Label>
              <Input
                id="days_before"
                type="number"
                min="0"
                {...form.register('days_before', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="e.g., 30"
              />
            </div>
          )}
          
          {form.watch('due_type') === 'days_after_booking' && (
            <div className="space-y-2">
              <Label htmlFor="days_after">Days After Booking</Label>
              <Input
                id="days_after"
                type="number"
                min="0"
                {...form.register('days_after', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? null : Number(value)
                })}
                placeholder="e.g., 7"
              />
            </div>
          )}
          
          {form.watch('due_type') === 'fixed_date' && (
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                {...form.register('due_date')}
              />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Additional details about this payment schedule."
            rows={3}
          />
        </div>

        {/* Mandatory */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_mandatory"
            checked={form.watch('is_mandatory')}
            onCheckedChange={(checked) => form.setValue('is_mandatory', !!checked)}
          />
          <Label htmlFor="is_mandatory" className="text-sm">
            This payment is mandatory
          </Label>
        </div>
      </div>
    </form>
  )
}))

PaymentScheduleFormContent.displayName = 'PaymentScheduleFormContent'

export function CancellationPolicyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading
}: {
  defaultValues?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const schema = z.object({
    days_before_from: z.number().min(0).optional(),
    days_before_to: z.number().min(0).optional(),
    penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']),
    penalty_percentage: z.number().min(0).max(100).optional(),
    penalty_amount: z.number().min(0).optional(),
    description: z.string().optional(),
    applies_to: z.enum(['all', 'deposit_only', 'balance_only']).default('all')
  })

  return (
    <DialogForm
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitLabel="Save Policy"
    />
  )
}

// Buttonless version for use inside EditDialog
export function CancellationPolicyFormContent({
  defaultValues,
  onSubmit,
  isLoading
}: {
  defaultValues?: any
  onSubmit: (data: any) => void
  isLoading?: boolean
}) {
  const schema = z.object({
    days_before_from: z.number().min(0).optional(),
    days_before_to: z.number().min(0).optional(),
    penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']),
    penalty_percentage: z.number().min(0).max(100).optional(),
    penalty_amount: z.number().min(0).optional(),
    description: z.string().optional(),
    applies_to: z.enum(['all', 'deposit_only', 'balance_only']).default('all')
  })

  const form = useForm({
    resolver: zodResolver(schema) as any,
    defaultValues
  })

  const handleSubmit = (data: any) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="space-y-4">
        {/* Days Before Range */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days_before_from">Days Before From</Label>
            <Input
              id="days_before_from"
              type="number"
              {...form.register('days_before_from', { valueAsNumber: true })}
              placeholder="e.g., 60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="days_before_to">Days Before To</Label>
            <Input
              id="days_before_to"
              type="number"
              {...form.register('days_before_to', { valueAsNumber: true })}
              placeholder="e.g., 30"
            />
          </div>
        </div>

        {/* Penalty Type */}
        <div className="space-y-2">
          <Label htmlFor="penalty_type">Penalty Type *</Label>
          <Select onValueChange={(value) => form.setValue('penalty_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select penalty type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Penalty</SelectItem>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              <SelectItem value="forfeit_deposit">Forfeit Deposit</SelectItem>
              <SelectItem value="forfeit_all">Forfeit All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Penalty Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="penalty_percentage">Penalty Percentage</Label>
            <Input
              id="penalty_percentage"
              type="number"
              step="0.01"
              {...form.register('penalty_percentage', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="penalty_amount">Penalty Amount</Label>
            <Input
              id="penalty_amount"
              type="number"
              step="0.01"
              {...form.register('penalty_amount', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Applies To */}
        <div className="space-y-2">
          <Label htmlFor="applies_to">Applies To *</Label>
          <Select onValueChange={(value) => form.setValue('applies_to', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select what this applies to" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="deposit_only">Deposit Only</SelectItem>
              <SelectItem value="balance_only">Balance Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Additional details about this cancellation policy."
            rows={3}
          />
        </div>
      </div>
    </form>
  )
}

export function DeadlineForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading
}: {
  defaultValues?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const schema = z.object({
    deadline_type: z.string().min(1, 'Deadline type is required'),
    deadline_date: z.string().optional(),
    days_before_arrival: z.number().min(0).optional(),
    calculate_from: z.enum(['arrival', 'departure', 'booking_date']).optional(),
    penalty_type: z.enum(['none', 'percentage', 'fixed_amount', 'forfeit_deposit', 'forfeit_all']).optional(),
    penalty_value: z.number().min(0).optional(),
    penalty_description: z.string().optional(),
    notification_days_before: z.number().min(0).default(7),
    notes: z.string().optional()
  })

  return (
    <DialogForm
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitLabel="Save Deadline"
    />
  )
}

export function CommissionTierForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading
}: {
  defaultValues?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const schema = z.object({
    revenue_from: z.number().min(0, 'Revenue from must be positive'),
    revenue_to: z.number().min(0).optional(),
    commission_rate: z.number().min(0).max(100),
    sort_order: z.number().min(0).default(0)
  })

  return (
    <DialogForm
      schema={schema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isLoading={isLoading}
      submitLabel="Save Tier"
    />
  )
}
