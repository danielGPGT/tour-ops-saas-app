'use client'

import { useState, useEffect } from 'react'
import { SupplierComboBox } from '@/components/contracts/supplier-combobox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PaymentTracker } from './PaymentTracker'
import { ContractPolicies } from './ContractPolicies'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step1BasicsProps {
  data: any
  extractedData: any
  onDataUpdate: (data: any) => void
  onNext: () => void
  onPrevious: () => void
}

export function Step1Basics({ data, extractedData, onDataUpdate, onNext, onPrevious }: Step1BasicsProps) {
  const [showPolicies, setShowPolicies] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPaymentTracker, setShowPaymentTracker] = useState(false)
  
  // Auto-populate form when extracted data is available
  useEffect(() => {
    if (extractedData?.extracted) {
      console.log('🔄 Auto-populating Step 1 with extracted data:', extractedData.extracted)
      console.log('📊 Current data state:', data)
      
      const extracted = extractedData.extracted
      const updates: any = {}
      
      // Map extracted data to form fields (skip supplier_name as requested)
      // Check if fields are different before updating to prevent infinite loops
      if (extracted.contract_name && data?.contract_name !== extracted.contract_name) {
        updates.contract_name = extracted.contract_name
      }
      if (extracted.contract_number && data?.contract_number !== extracted.contract_number) {
        updates.contract_number = extracted.contract_number
      }
      if (extracted.contract_type && data?.contract_type !== extracted.contract_type) {
        updates.contract_type = extracted.contract_type
      }
      if (extracted.currency && data?.currency !== extracted.currency) {
        updates.currency = extracted.currency
      }
      if (extracted.total_value && data?.total_value !== extracted.total_value) {
        updates.total_value = extracted.total_value
      }
      // Handle valid_from even if it's null (extracted data might have null values)
      console.log('📅 Valid from extracted:', extracted.contract_dates?.valid_from)
      console.log('📅 Valid from current data:', data?.valid_from)
      if (extracted.contract_dates?.valid_from !== undefined && data?.valid_from !== extracted.contract_dates.valid_from) {
        updates.valid_from = extracted.contract_dates.valid_from
        console.log('📅 Setting valid_from:', extracted.contract_dates.valid_from)
      }
      if (extracted.contract_dates?.valid_to && data?.valid_to !== extracted.contract_dates.valid_to) {
        updates.valid_to = extracted.contract_dates.valid_to
      }
      if (extracted.contract_dates?.signature_deadline && data?.signature_deadline !== extracted.contract_dates.signature_deadline) {
        updates.signature_deadline = extracted.contract_dates.signature_deadline
      }
      if (extracted.payment_terms && data?.payment_terms !== extracted.payment_terms) {
        updates.payment_terms = extracted.payment_terms
      }
      if (extracted.billing_instructions && data?.billing_instructions !== extracted.billing_instructions) {
        updates.billing_instructions = extracted.billing_instructions
      }
      if (extracted.cancellation_policy && data?.cancellation_policy !== extracted.cancellation_policy) {
        updates.cancellation_policy = extracted.cancellation_policy
      }
      if (extracted.attrition_policy && data?.attrition_policy !== extracted.attrition_policy) {
        updates.attrition_policy = extracted.attrition_policy
      }
      if (extracted.service_charge && data?.service_charge !== extracted.service_charge) {
        updates.service_charge = extracted.service_charge
      }
      if (extracted.tax_rate && data?.tax_rate !== extracted.tax_rate) {
        updates.tax_rate = extracted.tax_rate
      }
      if (extracted.commission_rate && data?.commission_rate !== extracted.commission_rate) {
        updates.commission_rate = extracted.commission_rate
      }
      
      // Update payment schedule if available and different
      if (extracted.payment_schedule && extracted.payment_schedule.length > 0) {
        console.log('💳 Payment schedule found in extracted data:', extracted.payment_schedule)
        const currentPaymentSchedule = data?.payment_schedule || []
        console.log('💳 Current payment schedule:', currentPaymentSchedule)
        const isDifferent = JSON.stringify(currentPaymentSchedule) !== JSON.stringify(extracted.payment_schedule)
        console.log('💳 Payment schedule is different:', isDifferent)
        if (isDifferent) {
          // Convert payment_schedule to payments format for PaymentTracker component
          const payments = extracted.payment_schedule.map((payment: any) => ({
            id: `payment-${payment.payment_number}`,
            payment_number: payment.payment_number,
            due_date: payment.due_date || '',
            amount_due: payment.amount,
            percentage: payment.percentage,
            description: payment.description,
            status: 'pending' as const
          }))
          
          updates.payments = payments
          setShowPaymentTracker(true)
          console.log('💳 Setting payments and showing tracker:', payments)
        }
      }
      
      // Update special terms if available and different
      if (extracted.special_terms && extracted.special_terms.length > 0) {
        const currentSpecialTerms = data?.special_terms || []
        const isDifferent = JSON.stringify(currentSpecialTerms) !== JSON.stringify(extracted.special_terms)
        if (isDifferent) {
          updates.special_terms = extracted.special_terms
        }
      }
      
      // Only update if there are actual changes
      console.log('📝 Updates to apply:', Object.keys(updates))
      console.log('📝 Updates content:', updates)
      if (Object.keys(updates).length > 0) {
        console.log('📝 Applying extracted data updates:', updates)
        onDataUpdate({
          ...data,
          ...updates
        })
      } else {
        console.log('📝 No updates to apply')
      }
    }
  }, [extractedData?.extracted]) // Remove data and onDataUpdate from dependencies to prevent infinite loops

  const handleInputChange = (field: string, value: any) => {
    onDataUpdate({
      ...data,
      [field]: value
    })
  }

  const handleNext = () => {
    // Basic validation
    if (!data?.supplier_id) {
      alert('Please select a supplier')
      return
    }
    if (!data?.contract_number) {
      alert('Please enter a contract number')
      return
    }
    if (!data?.contract_name) {
      alert('Please enter a contract name')
      return
    }
    if (!data?.valid_from) {
      alert('Please select valid from date')
      return
    }
    if (!data?.valid_to) {
      alert('Please select valid to date')
      return
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Contract Basics
        </h2>
        <p className="text-muted-foreground">
          Enter the essential contract information
        </p>
      </div>

      {/* Required Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Required Information</span>
            <Badge variant="destructive" className="text-xs">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="supplier" className="text-sm">Supplier *</Label>
              <SupplierComboBox
                value={data?.supplier_id || ''}
                onValueChange={(value) => handleInputChange('supplier_id', value)}
                placeholder="Search supplier..."
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contract_type" className="text-sm">Type *</Label>
              <Select 
                value={data?.contract_type || ''} 
                onValueChange={(value) => handleInputChange('contract_type', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allocation">Hotel Allocation</SelectItem>
                  <SelectItem value="purchase">Purchase Contract</SelectItem>
                  <SelectItem value="net_rate">Net Rate</SelectItem>
                  <SelectItem value="commissionable">Commissionable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="contract_number" className="text-sm">Contract Number *</Label>
              <Input
                id="contract_number"
                className="w-full"
                value={data?.contract_number || ''}
                onChange={(e) => handleInputChange('contract_number', e.target.value)}
                placeholder="e.g., HI-SGP-F1-2025"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contract_name" className="text-sm">Contract Name *</Label>
              <Input
                id="contract_name"
                className="w-full"
                value={data?.contract_name || ''}
                onChange={(e) => handleInputChange('contract_name', e.target.value)}
                placeholder="e.g., F1 Singapore 2025"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="valid_from" className="text-sm">Valid From *</Label>
              <Input
                id="valid_from"
                type="date"
                className="w-full"
                value={data?.valid_from || ''}
                onChange={(e) => handleInputChange('valid_from', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="valid_to" className="text-sm">Valid To *</Label>
              <Input
                id="valid_to"
                type="date"
                className="w-full"
                value={data?.valid_to || ''}
                onChange={(e) => handleInputChange('valid_to', e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="currency" className="text-sm">Currency</Label>
              <Select 
                value={data?.currency || 'USD'} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="total_value" className="text-sm">Total Value</Label>
              <Input
                id="total_value"
                type="number"
                className="w-full"
                value={data?.total_value || ''}
                onChange={(e) => handleInputChange('total_value', parseFloat(e.target.value) || null)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="commission_rate" className="text-sm">Commission (%)</Label>
              <Input
                id="commission_rate"
                type="number"
                className="w-full"
                value={data?.commission_rate || ''}
                onChange={(e) => handleInputChange('commission_rate', parseFloat(e.target.value) || null)}
                placeholder="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Tracking */}
      <Card>
        <Collapsible open={showPaymentTracker} onOpenChange={setShowPaymentTracker}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <span>Payment Tracking</span>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={showPaymentTracker}
                    onCheckedChange={setShowPaymentTracker}
                  />
                  <ChevronDown className={cn("h-4 w-4 transition-transform", showPaymentTracker && "rotate-180")} />
                </div>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <PaymentTracker
                payments={data?.payments || []}
                onPaymentsChange={(payments) => handleInputChange('payments', payments)}
                totalValue={data?.total_value}
                currency={data?.currency}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Policies */}
      <Card>
        <Collapsible open={showPolicies} onOpenChange={setShowPolicies}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <span>Policies & Terms</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showPolicies && "rotate-180")} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ContractPolicies
                data={data}
                onDataUpdate={handleInputChange}
              />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Advanced Options */}
      <Card>
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer">
              <CardTitle className="flex items-center justify-between">
                <span>Advanced Options</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-180")} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking_cutoff">Booking Cutoff Days</Label>
                <Input
                  id="booking_cutoff"
                  type="number"
                  value={data?.booking_cutoff_days || ''}
                  onChange={(e) => handleInputChange('booking_cutoff_days', parseInt(e.target.value) || null)}
                  placeholder="7"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="special_notes">Special Notes</Label>
                <Textarea
                  id="special_notes"
                  value={data?.special_notes || ''}
                  onChange={(e) => handleInputChange('special_notes', e.target.value)}
                  placeholder="Any additional notes or special requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleNext}>
          Next: Allocations
        </Button>
      </div>
    </div>
  )
}
