'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SheetForm } from '@/components/ui/SheetForm'
import { supplierSchema, type SupplierFormData } from '@/lib/validations/supplier.schema'
import { useCreateSupplier, useUpdateSupplier } from '@/lib/hooks/useSuppliers'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierSheetFormProps {
  supplier?: Supplier
  trigger: React.ReactNode
  afterSubmit?: () => void
}

export function SupplierSheetForm({ supplier, trigger, afterSubmit }: SupplierSheetFormProps) {
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true)
    
    try {
      // Validate the data
      const validatedData = supplierSchema.parse(data)
      
      if (supplier) {
        await updateSupplier.mutateAsync({ id: supplier.id, data: validatedData })
      } else {
        await createSupplier.mutateAsync(validatedData)
      }
      
      afterSubmit?.()
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SheetForm
      trigger={trigger}
      title={supplier ? 'Edit Supplier' : 'Add New Supplier'}
      description={supplier ? 'Update supplier information' : 'Create a new supplier'}
      initial={initialData}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? 'Saving...' : (supplier ? 'Update Supplier' : 'Create Supplier')}
      afterSubmit={afterSubmit}
    >
      {({ values, set }) => (
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Enter the basic supplier details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name *</Label>
                    <Input
                      id="name"
                      value={values.name}
                      onChange={(e) => set('name', e.target.value)}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Supplier Code *</Label>
                    <Input
                      id="code"
                      value={values.code}
                      onChange={(e) => set('code', e.target.value.toUpperCase())}
                      placeholder="Enter supplier code"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier_type">Supplier Type *</Label>
                  <Select
                    value={values.supplier_type}
                    onValueChange={(value) => set('supplier_type', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_currency">Default Currency</Label>
                  <Select
                    value={values.default_currency || 'USD'}
                    onValueChange={(value) => set('default_currency', value as any)}
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

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={values.is_active}
                    onChange={(e) => set('is_active', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="is_active">Active Supplier</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Enter supplier contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={values.email || ''}
                      onChange={(e) => set('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={values.phone || ''}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address</Label>
                  <Input
                    id="address_line1"
                    value={values.address_line1 || ''}
                    onChange={(e) => set('address_line1', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={values.city || ''}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country (ISO Code)</Label>
                    <Input
                      id="country"
                      value={values.country || ''}
                      onChange={(e) => set('country', e.target.value.toUpperCase())}
                      placeholder="US, GB, FR, etc."
                      maxLength={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Add any additional notes about this supplier</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={values.notes || ''}
                    onChange={(e) => set('notes', e.target.value)}
                    placeholder="Enter any additional notes about this supplier..."
                    rows={5}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </SheetForm>
  )
}
