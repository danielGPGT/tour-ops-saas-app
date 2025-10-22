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
    contact_info: {
      primary_contact: supplier.contact_info?.primary_contact || '',
      email: supplier.contact_info?.email || '',
      phone: supplier.contact_info?.phone || '',
      address: {
        street: supplier.contact_info?.address?.street || '',
        city: supplier.contact_info?.address?.city || '',
        country: supplier.contact_info?.address?.country || '',
        postal_code: supplier.contact_info?.address?.postal_code || ''
      },
      website: supplier.contact_info?.website || ''
    },
    payment_terms: {
      payment_method: supplier.payment_terms?.payment_method || '',
      credit_days: supplier.payment_terms?.credit_days || 0,
      terms: supplier.payment_terms?.terms || ''
    },
    commission_rate: supplier.commission_rate || undefined,
    rating: supplier.rating || undefined,
    is_active: supplier.is_active ?? true
  } : {
    name: '',
    code: '',
    supplier_type: 'hotel',
    contact_info: {
      primary_contact: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        country: '',
        postal_code: ''
      },
      website: ''
    },
    payment_terms: {
      payment_method: '',
      credit_days: 0,
      terms: ''
    },
    commission_rate: undefined,
    rating: undefined,
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={values.commission_rate || ''}
                      onChange={(e) => set('commission_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Enter commission rate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating (1-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={values.rating || ''}
                      onChange={(e) => set('rating', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Enter rating"
                    />
                  </div>
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
                <CardDescription>Enter contact details and address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_contact">Primary Contact *</Label>
                  <Input
                    id="primary_contact"
                    value={values.contact_info.primary_contact}
                    onChange={(e) => set('contact_info', { ...values.contact_info, primary_contact: e.target.value })}
                    placeholder="Enter primary contact name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={values.contact_info.email}
                      onChange={(e) => set('contact_info', { ...values.contact_info, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={values.contact_info.phone}
                      onChange={(e) => set('contact_info', { ...values.contact_info, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={values.contact_info.website}
                    onChange={(e) => set('contact_info', { ...values.contact_info, website: e.target.value })}
                    placeholder="Enter website URL"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Address</h4>
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={values.contact_info.address.street}
                      onChange={(e) => set('contact_info', { 
                        ...values.contact_info, 
                        address: { ...values.contact_info.address, street: e.target.value }
                      })}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={values.contact_info.address.city}
                        onChange={(e) => set('contact_info', { 
                          ...values.contact_info, 
                          address: { ...values.contact_info.address, city: e.target.value }
                        })}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={values.contact_info.address.country}
                        onChange={(e) => set('contact_info', { 
                          ...values.contact_info, 
                          address: { ...values.contact_info.address, country: e.target.value }
                        })}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={values.contact_info.address.postal_code}
                      onChange={(e) => set('contact_info', { 
                        ...values.contact_info, 
                        address: { ...values.contact_info.address, postal_code: e.target.value }
                      })}
                      placeholder="Enter postal code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Terms</CardTitle>
                <CardDescription>Configure payment terms and conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={values.payment_terms.payment_method}
                    onValueChange={(value) => set('payment_terms', { ...values.payment_terms, payment_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_days">Credit Days</Label>
                  <Input
                    id="credit_days"
                    type="number"
                    min="0"
                    value={values.payment_terms.credit_days}
                    onChange={(e) => set('payment_terms', { ...values.payment_terms, credit_days: parseInt(e.target.value) || 0 })}
                    placeholder="Enter credit days"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Payment Terms</Label>
                  <Textarea
                    id="terms"
                    value={values.payment_terms.terms}
                    onChange={(e) => set('payment_terms', { ...values.payment_terms, terms: e.target.value })}
                    placeholder="Enter payment terms and conditions"
                    rows={3}
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
