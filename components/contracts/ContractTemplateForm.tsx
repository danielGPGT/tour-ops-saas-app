'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, X, Clock, DollarSign, FileText, AlertCircle } from 'lucide-react'
import { ContractTemplate } from '@/lib/contract-templates'
import { createContract } from '@/app/contracts/actions'
import { toast } from 'sonner'

const contractSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  supplier_id: z.string().min(1, 'Supplier is required'),
  contract_type: z.enum(['net_rate', 'commissionable', 'allocation']),
  currency: z.string().min(3, 'Currency is required'),
  commission_rate: z.number().min(0).max(100),
  payment_terms: z.string().min(1, 'Payment terms are required'),
  cancellation_policy: z.string().min(1, 'Cancellation policy is required'),
  special_terms: z.string().optional(),
  booking_cutoff_days: z.number().min(0),
  notes: z.string().optional(),
  deadlines: z.array(z.object({
    type: z.enum(['payment', 'cancellation', 'attrition', 'booking']),
    name: z.string().min(1, 'Deadline name is required'),
    days_before_event: z.number().min(0),
    penalty: z.string().optional()
  }))
})

type ContractFormData = z.infer<typeof contractSchema>

interface ContractTemplateFormProps {
  template: ContractTemplate
  suppliers: any[]
  onSuccess: () => void
  onCancel: () => void
}

export function ContractTemplateForm({ 
  template, 
  suppliers, 
  onSuccess, 
  onCancel 
}: ContractTemplateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      reference: '',
      supplier_id: '',
      contract_type: template.contractType,
      currency: template.defaultTerms.currency || 'USD',
      commission_rate: template.defaultTerms.commissionRate || 0,
      payment_terms: template.defaultTerms.paymentTerms || '',
      cancellation_policy: template.defaultTerms.cancellationPolicy || '',
      special_terms: template.defaultTerms.specialTerms || '',
      booking_cutoff_days: template.defaultTerms.bookingCutoffDays || 7,
      notes: '',
      deadlines: template.defaultDeadlines.map(deadline => ({
        type: deadline.type,
        name: deadline.name,
        days_before_event: deadline.daysBeforeEvent,
        penalty: deadline.penalty || ''
      }))
    }
  })

  const onSubmit = async (data: ContractFormData) => {
    try {
      setIsSubmitting(true)
      
      // Create contract with template data
      const contractData = {
        reference: data.reference,
        supplier_id: parseInt(data.supplier_id),
        contract_type: data.contract_type,
        currency: data.currency,
        commission_rate: data.commission_rate,
        payment_terms: data.payment_terms,
        cancellation_policy: data.cancellation_policy,
        special_terms: data.special_terms,
        booking_cutoff_days: data.booking_cutoff_days,
        notes: data.notes,
        status: 'draft' as const
      }

      const result = await createContract(contractData)
      
      if (result.success) {
        toast.success('Contract created successfully from template!')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to create contract')
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      toast.error('Failed to create contract')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addDeadline = () => {
    const currentDeadlines = form.getValues('deadlines')
    form.setValue('deadlines', [
      ...currentDeadlines,
      {
        type: 'payment',
        name: '',
        days_before_event: 30,
        penalty: ''
      }
    ])
  }

  const removeDeadline = (index: number) => {
    const currentDeadlines = form.getValues('deadlines')
    form.setValue('deadlines', currentDeadlines.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
            <Badge className={template.color}>
              {template.contractType.replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., HTL-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contract Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="net_rate">Net Rate</SelectItem>
                          <SelectItem value="commissionable">Commissionable</SelectItem>
                          <SelectItem value="allocation">Allocation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="booking_cutoff_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Cutoff (Days)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Terms & Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cancellation_policy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Policy</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="special_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Terms</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Deadlines */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Contract Deadlines</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addDeadline}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deadline
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {form.watch('deadlines').map((deadline, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Deadline {index + 1}</h4>
                      {form.watch('deadlines').length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDeadline(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`deadlines.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="payment">Payment</SelectItem>
                                <SelectItem value="cancellation">Cancellation</SelectItem>
                                <SelectItem value="attrition">Attrition</SelectItem>
                                <SelectItem value="booking">Booking</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`deadlines.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`deadlines.${index}.days_before_event`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Days Before Event</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`deadlines.${index}.penalty`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
