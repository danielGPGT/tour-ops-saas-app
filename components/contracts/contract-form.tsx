'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { contractSchema, type ContractFormData } from '@/lib/validations/contract.schema'
import { useCreateContract, useUpdateContract } from '@/lib/hooks/useContracts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  Settings,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import type { Contract } from '@/lib/types/contract'

interface ContractFormProps {
  contract?: Contract
  onSuccess?: () => void
  onCancel?: () => void
}

export function ContractForm({ contract, onSuccess, onCancel }: ContractFormProps) {
  const router = useRouter()
  const isEditing = !!contract

  const { data: suppliers } = useSuppliers()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: contract ? {
      supplier_id: contract.supplier_id,
      contract_name: contract.contract_name || '',
      contract_type: contract.contract_type,
      valid_from: contract.valid_from,
      valid_to: contract.valid_to,
      signed_date: contract.signed_date || '',
      currency: contract.currency,
      commission_rate: contract.commission_rate,
      commission_type: contract.commission_type,
      booking_cutoff_days: contract.booking_cutoff_days,
      signed_document_url: contract.signed_document_url || '',
      terms_and_conditions: contract.terms_and_conditions || '',
      special_terms: contract.special_terms || '',
      notes: contract.notes || '',
      status: contract.status
    } : {
      contract_type: 'net_rate',
      currency: 'USD',
      commission_type: 'percentage',
      status: 'draft'
    }
  })

  const onSubmit = async (data: ContractFormData) => {
    try {
      if (isEditing) {
        await updateContract.mutateAsync({
          id: contract.id,
          ...data
        })
        toast.success('Contract updated successfully')
      } else {
        await createContract.mutateAsync(data)
        toast.success('Contract created successfully')
      }
      
      onSuccess?.()
      if (!onSuccess) {
        router.push('/contracts')
      }
    } catch {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} contract`)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push('/contracts')
    }
  }

  const contractTypeOptions = [
    { value: 'net_rate', label: 'Net Rate', description: 'You buy at cost, sell at your price' },
    { value: 'commissionable', label: 'Commissionable', description: 'Supplier sets price, you get commission' },
    { value: 'allocation', label: 'Allocation', description: 'Bulk purchase agreement' },
    { value: 'on_request', label: 'On Request', description: 'Per-booking confirmation required' }
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'suspended', label: 'Suspended' }
  ]

  const commissionTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed_amount', label: 'Fixed Amount' },
    { value: 'tiered', label: 'Tiered' },
    { value: 'none', label: 'None' }
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={watch('supplier_id')}
                onValueChange={(value) => setValue('supplier_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span>{supplier.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {supplier.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.supplier_id && (
                <p className="text-sm text-red-500">{errors.supplier_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_name">Contract Name</Label>
              <Input
                id="contract_name"
                {...register('contract_name')}
                placeholder="Enter contract name"
              />
              {errors.contract_name && (
                <p className="text-sm text-red-500">{errors.contract_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type">Contract Type *</Label>
              <Select
                value={watch('contract_type')}
                onValueChange={(value) => setValue('contract_type', value as ContractFormData['contract_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contract_type && (
                <p className="text-sm text-red-500">{errors.contract_type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as ContractFormData['status'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Contract Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Valid From *</Label>
              <DatePicker
                date={watch('valid_from') ? new Date(watch('valid_from')) : undefined}
                onDateChange={(date) => setValue('valid_from', date?.toISOString().split('T')[0] || '')}
                placeholder="Select start date"
              />
              {errors.valid_from && (
                <p className="text-sm text-red-500">{errors.valid_from.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_to">Valid To *</Label>
              <DatePicker
                date={watch('valid_to') ? new Date(watch('valid_to')) : undefined}
                onDateChange={(date) => setValue('valid_to', date?.toISOString().split('T')[0] || '')}
                placeholder="Select end date"
              />
              {errors.valid_to && (
                <p className="text-sm text-red-500">{errors.valid_to.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="signed_date">Signed Date</Label>
              <DatePicker
                date={watch('signed_date') ? new Date(watch('signed_date')) : undefined}
                onDateChange={(date) => setValue('signed_date', date?.toISOString().split('T')[0] || '')}
                placeholder="Select signed date"
              />
              {errors.signed_date && (
                <p className="text-sm text-red-500">{errors.signed_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking_cutoff_days">Booking Cutoff Days</Label>
            <Input
              id="booking_cutoff_days"
              type="number"
              {...register('booking_cutoff_days', { valueAsNumber: true })}
              placeholder="Days before arrival"
            />
            {errors.booking_cutoff_days && (
              <p className="text-sm text-red-500">{errors.booking_cutoff_days.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={watch('currency')}
                onValueChange={(value) => setValue('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currency && (
                <p className="text-sm text-red-500">{errors.currency.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('commission_rate', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.commission_rate && (
                <p className="text-sm text-red-500">{errors.commission_rate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_type">Commission Type</Label>
              <Select
                value={watch('commission_type')}
                onValueChange={(value) => setValue('commission_type', value as ContractFormData['commission_type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select commission type" />
                </SelectTrigger>
                <SelectContent>
                  {commissionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.commission_type && (
                <p className="text-sm text-red-500">{errors.commission_type.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signed_document_url">Signed Document URL</Label>
            <Input
              id="signed_document_url"
              type="url"
              {...register('signed_document_url')}
              placeholder="https://example.com/contract.pdf"
            />
            {errors.signed_document_url && (
              <p className="text-sm text-red-500">{errors.signed_document_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
            <Textarea
              id="terms_and_conditions"
              {...register('terms_and_conditions')}
              placeholder="Enter terms and conditions"
              rows={4}
            />
            {errors.terms_and_conditions && (
              <p className="text-sm text-red-500">{errors.terms_and_conditions.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="special_terms">Special Terms</Label>
            <Textarea
              id="special_terms"
              {...register('special_terms')}
              placeholder="Enter special terms"
              rows={3}
            />
            {errors.special_terms && (
              <p className="text-sm text-red-500">{errors.special_terms.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter additional notes"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500">{errors.notes.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Saving...' : isEditing ? 'Update Contract' : 'Create Contract'}
        </Button>
      </div>
    </form>
  )
}