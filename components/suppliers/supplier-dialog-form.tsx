'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EditDialog } from '@/components/common/EditDialog'
import { supplierSchema, type SupplierFormData } from '@/lib/validations/supplier.schema'
import { useCreateSupplier, useUpdateSupplier } from '@/lib/hooks/useSuppliers'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierDialogFormProps {
  supplier?: Supplier
  trigger: React.ReactNode
  afterSubmit?: () => void
}

export function SupplierDialogForm({ supplier, trigger, afterSubmit }: SupplierDialogFormProps) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<SupplierFormData | null>(null)

  const initialData: SupplierFormData = supplier ? {
    name: supplier.name || '',
    code: supplier.code || '',
    supplier_type: supplier.supplier_type || 'hotel',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address_line1: supplier.address_line1 || '',
    city: supplier.city || '',
    country: supplier.country || '',
    default_currency: supplier.default_currency || 'USD',
    notes: supplier.notes || '',
    is_active: supplier.is_active ?? true
  } : {
    name: '',
    code: '',
    supplier_type: 'hotel',
    email: '',
    phone: '',
    address_line1: '',
    city: '',
    country: '',
    default_currency: 'USD',
    notes: '',
    is_active: true
  }

  const handleSubmitFromDialog = async () => {
    if (!formData) {
      console.error('No form data available')
      return
    }
    
    // Validate form data
    const validation = supplierSchema.safeParse(formData)
    if (!validation.success) {
      console.error('Validation failed:', validation.error)
      // TODO: Show validation errors to user
      return
    }
    
    setIsSubmitting(true)
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, data: formData })
      } else {
        await createSupplier.mutateAsync(formData)
      }
      setOpen(false)
      afterSubmit?.()
    } catch (error) {
      console.error('Error saving supplier:', error)
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
        title={supplier ? 'Edit Supplier' : 'Create New Supplier'}
        description={supplier ? 'Update supplier information' : 'Add a new supplier to your system'}
        onSave={handleSubmitFromDialog}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        showDelete={!!supplier}
        onDelete={supplier ? () => {} : undefined}
      >
        <SupplierFormContent
          initialData={initialData}
          onSubmit={(data) => setFormData(data)}
          isLoading={isSubmitting}
          onFormDataChange={setFormData}
        />
      </EditDialog>
    </>
  )
}

// Buttonless version for use inside EditDialog
function SupplierFormContent({ 
  initialData, 
  onSubmit, 
  onFormDataChange,
  isLoading = false 
}: {
  initialData: SupplierFormData
  onSubmit: (data: SupplierFormData) => void
  onFormDataChange?: (data: SupplierFormData) => void
  isLoading?: boolean
}) {
  const [formData, setFormData] = useState<SupplierFormData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    const updated = { ...formData, [field]: value }
    setFormData(updated)
    onFormDataChange?.(updated)
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Sync formData changes to parent
  React.useEffect(() => {
    onFormDataChange?.(formData)
  }, [formData, onFormDataChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validation = supplierSchema.safeParse(formData)
    if (!validation.success) {
      const newErrors: Record<string, string> = {}
      validation.error.errors.forEach(error => {
        const path = error.path.join('.')
        newErrors[path] = error.message
      })
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Marriott International"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Supplier Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="e.g., MAR"
              maxLength={50}
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="supplier_type">Supplier Type</Label>
          <Input
            id="supplier_type"
            value={formData.supplier_type || ''}
            onChange={(e) => handleInputChange('supplier_type', e.target.value)}
            placeholder="e.g., Hotel, Airline, Car Rental"
            maxLength={50}
            className={errors.supplier_type ? 'border-red-500' : ''}
          />
          {errors.supplier_type && (
            <p className="text-sm text-red-600">{errors.supplier_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_currency">Default Currency</Label>
          <Select
            value={formData.default_currency || 'USD'}
            onValueChange={(value) => handleInputChange('default_currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="contact@supplier.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address_line1">Address</Label>
          <Input
            id="address_line1"
            value={formData.address_line1 || ''}
            onChange={(e) => handleInputChange('address_line1', e.target.value)}
            placeholder="123 Main Street"
            className={errors.address_line1 ? 'border-red-500' : ''}
          />
          {errors.address_line1 && (
            <p className="text-sm text-red-600">{errors.address_line1}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="New York"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && (
              <p className="text-sm text-red-600">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country (ISO Code)</Label>
            <Input
              id="country"
              value={formData.country || ''}
              onChange={(e) => handleInputChange('country', e.target.value.toUpperCase())}
              placeholder="US, GB, FR, etc."
              maxLength={2}
              className={errors.country ? 'border-red-500' : ''}
            />
            {errors.country && (
              <p className="text-sm text-red-600">{errors.country}</p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Additional notes about this supplier..."
            rows={3}
            className={errors.notes ? 'border-red-500' : ''}
          />
          {errors.notes && (
            <p className="text-sm text-red-600">{errors.notes}</p>
          )}
        </div>
      </div>
    </form>
  )
}
