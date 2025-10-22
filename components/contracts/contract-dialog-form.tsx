'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { EditDialog } from '@/components/common/EditDialog'
import { useCreateContract, useUpdateContract } from '@/lib/hooks/useContracts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import type { Contract, ContractFormData } from '@/lib/types/contract'

const contractSchema = z.object({
  contract_name: z.string().min(1, 'Contract name is required'),
  contract_number: z.string().min(1, 'Contract number is required'),
  supplier_id: z.string().min(1, 'Supplier is required'),
  valid_from: z.date(),
  valid_to: z.date(),
  currency: z.string().min(1, 'Currency is required'),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'suspended']),
  contract_type: z.enum(['net_rate', 'commissionable', 'allocation', 'on_request']),
  commission_rate: z.number().min(0).max(100).optional(),
  commission_type: z.enum(['percentage', 'fixed_amount', 'tiered', 'none']),
  booking_cutoff_days: z.number().min(0).optional(),
  signed_date: z.date().optional(),
  signed_document_url: z.string().url().optional().or(z.literal('')),
  terms_and_conditions: z.string().optional(),
  special_terms: z.string().optional(),
  notes: z.string().optional()
})

interface ContractDialogFormProps {
  contract?: Contract
  trigger: React.ReactNode
  afterSubmit?: () => void
}

export function ContractDialogForm({ contract, trigger, afterSubmit }: ContractDialogFormProps) {
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  const initialData: ContractFormData = contract ? {
    contract_name: contract.contract_name || '',
    contract_number: contract.contract_number || '',
    supplier_id: contract.supplier_id || '',
    valid_from: contract.valid_from ? new Date(contract.valid_from) : new Date(),
    valid_to: contract.valid_to ? new Date(contract.valid_to) : new Date(),
    currency: contract.currency || 'USD',
    status: contract.status || 'draft',
    contract_type: contract.contract_type || 'net_rate',
    commission_rate: contract.commission_rate || 0,
    commission_type: contract.commission_type || 'percentage',
    booking_cutoff_days: contract.booking_cutoff_days || undefined,
    signed_date: contract.signed_date ? new Date(contract.signed_date) : undefined,
    signed_document_url: contract.signed_document_url || '',
    terms_and_conditions: contract.terms_and_conditions || '',
    special_terms: contract.special_terms || '',
    notes: contract.notes || ''
  } : {
    contract_name: '',
    contract_number: '',
    supplier_id: '',
    valid_from: new Date(),
    valid_to: new Date(),
    currency: 'USD',
    status: 'draft',
    contract_type: 'net_rate',
    commission_rate: 0,
    commission_type: 'percentage',
    booking_cutoff_days: undefined,
    signed_date: undefined,
    signed_document_url: '',
    terms_and_conditions: '',
    special_terms: '',
    notes: ''
  }

  const handleSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true)
    try {
      if (contract) {
        await updateContract.mutateAsync({ id: contract.id, data })
      } else {
        await createContract.mutateAsync(data)
      }
      setOpen(false)
      afterSubmit?.()
    } catch (error) {
      console.error('Error saving contract:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger}
      </div>
      <EditDialog
        open={open}
        onOpenChange={setOpen}
        title={contract ? 'Edit Contract' : 'Create New Contract'}
        description={contract ? 'Update contract information' : 'Add a new contract to your system'}
        onSave={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        showDelete={!!contract}
        onDelete={contract ? () => {} : undefined}
      >
        <ContractFormContent
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </EditDialog>
    </>
  )
}

// Buttonless version for use inside EditDialog
function ContractFormContent({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: {
  initialData: ContractFormData
  onSubmit: (data: ContractFormData) => void
  isLoading?: boolean
}) {
  const { data: suppliers = [] } = useSuppliers()
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: initialData
  })

  const { watch, setValue } = form
  const contractType = watch('contract_type')
  const commissionType = watch('commission_type')

  const handleSubmit = (data: ContractFormData) => {
    onSubmit(data)
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contract_name">Contract Name *</Label>
          <Input
            id="contract_name"
            {...form.register('contract_name')}
            placeholder="e.g., Marriott F1 2025"
          />
          {form.formState.errors.contract_name && (
            <p className="text-sm text-red-600">{form.formState.errors.contract_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contract_number">Contract Number *</Label>
          <Input
            id="contract_number"
            {...form.register('contract_number')}
            placeholder="e.g., CTR-2025-0001"
          />
          {form.formState.errors.contract_number && (
            <p className="text-sm text-red-600">{form.formState.errors.contract_number.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier_id">Supplier *</Label>
        <Select
          value={form.watch('supplier_id')}
          onValueChange={(value) => setValue('supplier_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a supplier" />
          </SelectTrigger>
          <SelectContent>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name} ({supplier.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.supplier_id && (
          <p className="text-sm text-red-600">{form.formState.errors.supplier_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valid_from">Valid From *</Label>
          <DatePicker
            date={form.watch('valid_from')}
            onDateChange={(date) => setValue('valid_from', date)}
            placeholder="Select start date"
          />
          {form.formState.errors.valid_from && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_from.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="valid_to">Valid To *</Label>
          <DatePicker
            date={form.watch('valid_to')}
            onDateChange={(date) => setValue('valid_to', date)}
            placeholder="Select end date"
          />
          {form.formState.errors.valid_to && (
            <p className="text-sm text-red-600">{form.formState.errors.valid_to.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contract_type">Contract Type *</Label>
          <Select
            value={contractType}
            onValueChange={(value) => setValue('contract_type', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="net_rate">Net Rate</SelectItem>
              <SelectItem value="commissionable">Commissionable</SelectItem>
              <SelectItem value="allocation">Allocation</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.contract_type && (
            <p className="text-sm text-red-600">{form.formState.errors.contract_type.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.status && (
            <p className="text-sm text-red-600">{form.formState.errors.status.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="AED">AED</SelectItem>
              <SelectItem value="CAD">CAD</SelectItem>
              <SelectItem value="AUD">AUD</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.currency && (
            <p className="text-sm text-red-600">{form.formState.errors.currency.message}</p>
          )}
        </div>
      </div>

      {(contractType === 'commissionable' || contractType === 'net_rate') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              {...form.register('commission_rate', { valueAsNumber: true })}
              placeholder="e.g., 10"
            />
            {form.formState.errors.commission_rate && (
              <p className="text-sm text-red-600">{form.formState.errors.commission_rate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission_type">Commission Type</Label>
            <Select
              value={commissionType}
              onValueChange={(value) => setValue('commission_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select commission type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                <SelectItem value="tiered">Tiered</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.commission_type && (
              <p className="text-sm text-red-600">{form.formState.errors.commission_type.message}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking_cutoff_days">Booking Cutoff Days</Label>
          <Input
            id="booking_cutoff_days"
            type="number"
            min="0"
            {...form.register('booking_cutoff_days', { valueAsNumber: true })}
            placeholder="e.g., 7"
          />
          {form.formState.errors.booking_cutoff_days && (
            <p className="text-sm text-red-600">{form.formState.errors.booking_cutoff_days.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="signed_date">Signed Date</Label>
          <DatePicker
            date={form.watch('signed_date')}
            onDateChange={(date) => setValue('signed_date', date)}
            placeholder="Select signed date"
          />
          {form.formState.errors.signed_date && (
            <p className="text-sm text-red-600">{form.formState.errors.signed_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signed_document_url">Signed Document URL</Label>
        <Input
          id="signed_document_url"
          {...form.register('signed_document_url')}
          placeholder="https://example.com/contract.pdf"
        />
        {form.formState.errors.signed_document_url && (
          <p className="text-sm text-red-600">{form.formState.errors.signed_document_url.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
        <Textarea
          id="terms_and_conditions"
          {...form.register('terms_and_conditions')}
          placeholder="Enter contract terms and conditions..."
          rows={4}
        />
        {form.formState.errors.terms_and_conditions && (
          <p className="text-sm text-red-600">{form.formState.errors.terms_and_conditions.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="special_terms">Special Terms</Label>
        <Textarea
          id="special_terms"
          {...form.register('special_terms')}
          placeholder="Enter any special terms or conditions..."
          rows={3}
        />
        {form.formState.errors.special_terms && (
          <p className="text-sm text-red-600">{form.formState.errors.special_terms.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...form.register('notes')}
          placeholder="Additional notes about this contract..."
          rows={2}
        />
        {form.formState.errors.notes && (
          <p className="text-sm text-red-600">{form.formState.errors.notes.message}</p>
        )}
      </div>
    </form>
  )
}
