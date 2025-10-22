'use client'

import { useState } from 'react'
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

  const initialData: SupplierFormData = supplier ? {
    name: supplier.name || '',
    code: supplier.code || '',
    supplier_type: supplier.supplier_type || 'hotel',
    contact_info: supplier.contact_info || {
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    },
    commission_rate: supplier.commission_rate || undefined,
    rating: supplier.rating || undefined,
    payment_terms: supplier.payment_terms || '',
    is_active: supplier.is_active ?? true
  } : {
    name: '',
    code: '',
    supplier_type: 'hotel',
    contact_info: {
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: ''
    },
    commission_rate: undefined,
    rating: undefined,
    payment_terms: '',
    is_active: true
  }

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true)
    try {
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, data })
      } else {
        await createSupplier.mutateAsync(data)
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
        onSave={handleSubmit}
        onCancel={handleCancel}
        isLoading={isSubmitting}
        showDelete={!!supplier}
        onDelete={supplier ? () => {} : undefined}
      >
        <SupplierFormContent
          initialData={initialData}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
        />
      </EditDialog>
    </>
  )
}

// Buttonless version for use inside EditDialog
function SupplierFormContent({ 
  initialData, 
  onSubmit, 
  isLoading = false 
}: {
  initialData: SupplierFormData
  onSubmit: (data: SupplierFormData) => void
  isLoading?: boolean
}) {
  const [formData, setFormData] = useState<SupplierFormData>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof SupplierFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleContactInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[`contact_info.${field}`]) {
      setErrors(prev => ({ ...prev, [`contact_info.${field}`]: '' }))
    }
  }

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              step="0.01"
              min="0"
              max="999.99"
              value={formData.commission_rate || ''}
              onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 10.5"
              className={errors.commission_rate ? 'border-red-500' : ''}
            />
            {errors.commission_rate && (
              <p className="text-sm text-red-600">{errors.commission_rate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Rating (0-9.99)</Label>
            <Input
              id="rating"
              type="number"
              step="0.01"
              min="0"
              max="9.99"
              value={formData.rating || ''}
              onChange={(e) => handleInputChange('rating', parseFloat(e.target.value) || 0)}
              placeholder="e.g., 4.5"
              className={errors.rating ? 'border-red-500' : ''}
            />
            {errors.rating && (
              <p className="text-sm text-red-600">{errors.rating}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.contact_info.email}
              onChange={(e) => handleContactInfoChange('email', e.target.value)}
              placeholder="contact@supplier.com"
              className={errors['contact_info.email'] ? 'border-red-500' : ''}
            />
            {errors['contact_info.email'] && (
              <p className="text-sm text-red-600">{errors['contact_info.email']}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.contact_info.phone}
              onChange={(e) => handleContactInfoChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={errors['contact_info.phone'] ? 'border-red-500' : ''}
            />
            {errors['contact_info.phone'] && (
              <p className="text-sm text-red-600">{errors['contact_info.phone']}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.contact_info.address}
            onChange={(e) => handleContactInfoChange('address', e.target.value)}
            placeholder="123 Main Street"
            rows={2}
            className={errors['contact_info.address'] ? 'border-red-500' : ''}
          />
          {errors['contact_info.address'] && (
            <p className="text-sm text-red-600">{errors['contact_info.address']}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.contact_info.city}
              onChange={(e) => handleContactInfoChange('city', e.target.value)}
              placeholder="New York"
              className={errors['contact_info.city'] ? 'border-red-500' : ''}
            />
            {errors['contact_info.city'] && (
              <p className="text-sm text-red-600">{errors['contact_info.city']}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State/Province</Label>
            <Input
              id="state"
              value={formData.contact_info.state}
              onChange={(e) => handleContactInfoChange('state', e.target.value)}
              placeholder="NY"
              className={errors['contact_info.state'] ? 'border-red-500' : ''}
            />
            {errors['contact_info.state'] && (
              <p className="text-sm text-red-600">{errors['contact_info.state']}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={formData.contact_info.postal_code}
              onChange={(e) => handleContactInfoChange('postal_code', e.target.value)}
              placeholder="10001"
              className={errors['contact_info.postal_code'] ? 'border-red-500' : ''}
            />
            {errors['contact_info.postal_code'] && (
              <p className="text-sm text-red-600">{errors['contact_info.postal_code']}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.contact_info.country}
            onChange={(e) => handleContactInfoChange('country', e.target.value)}
            placeholder="United States"
            className={errors['contact_info.country'] ? 'border-red-500' : ''}
          />
          {errors['contact_info.country'] && (
            <p className="text-sm text-red-600">{errors['contact_info.country']}</p>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Textarea
            id="payment_terms"
            value={formData.payment_terms || ''}
            onChange={(e) => handleInputChange('payment_terms', e.target.value)}
            placeholder="e.g., Net 30 days, 2% discount for payment within 10 days"
            rows={3}
            className={errors.payment_terms ? 'border-red-500' : ''}
          />
          {errors.payment_terms && (
            <p className="text-sm text-red-600">{errors.payment_terms}</p>
          )}
        </div>
      </div>
    </form>
  )
}
