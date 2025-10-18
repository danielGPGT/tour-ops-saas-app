'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Save, 
  Undo, 
  Plus, 
  Trash2, 
  Edit,
  DollarSign,
  AlertTriangle,
  Clock,
  FileText,
  CheckCircle
} from 'lucide-react'

interface ContractTermsEditorProps {
  contractId: number
  terms: any
  onSave: (terms: any) => void
  onCancel: () => void
}

export function ContractTermsEditor({ 
  contractId, 
  terms, 
  onSave, 
  onCancel 
}: ContractTermsEditorProps) {
  const [editedTerms, setEditedTerms] = useState(terms || {})
  const [hasChanges, setHasChanges] = useState(false)

  const updateTerm = (section: string, field: string, value: any) => {
    setEditedTerms(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const addTerm = (section: string, field: string, value: any) => {
    setEditedTerms(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
  }

  const removeTerm = (section: string, field: string) => {
    setEditedTerms(prev => {
      const newSection = { ...prev[section] }
      delete newSection[field]
      return {
        ...prev,
        [section]: newSection
      }
    })
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(editedTerms)
    setHasChanges(false)
  }

  const handleCancel = () => {
    setEditedTerms(terms)
    setHasChanges(false)
    onCancel()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Terms Editor</h2>
          <p className="text-muted-foreground">
            Edit detailed terms and conditions for this contract
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleCancel}>
            <Undo className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Terms Editor */}
      <Tabs defaultValue="financial" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Financial Terms</span>
              </CardTitle>
              <CardDescription>
                Commission rates, payment terms, and financial conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission Rate</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="commission"
                        type="number"
                        placeholder="15"
                        value={editedTerms.commission || ''}
                        onChange={(e) => updateTerm('', 'commission', e.target.value)}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <select
                      id="payment_terms"
                      className="w-full p-2 border rounded-md"
                      value={editedTerms.payment_terms || ''}
                      onChange={(e) => updateTerm('', 'payment_terms', e.target.value)}
                    >
                      <option value="">Select payment terms</option>
                      <option value="7 days">7 days</option>
                      <option value="14 days">14 days</option>
                      <option value="21 days">21 days</option>
                      <option value="30 days">30 days</option>
                      <option value="45 days">45 days</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className="w-full p-2 border rounded-md"
                      value={editedTerms.currency || 'GBP'}
                      onChange={(e) => updateTerm('', 'currency', e.target.value)}
                    >
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimum_booking">Minimum Booking Value</Label>
                    <Input
                      id="minimum_booking"
                      type="number"
                      placeholder="1000"
                      value={editedTerms.minimum_booking || ''}
                      onChange={(e) => updateTerm('', 'minimum_booking', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="credit_limit">Credit Limit</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      placeholder="50000"
                      value={editedTerms.credit_limit || ''}
                      onChange={(e) => updateTerm('', 'credit_limit', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="late_payment_fee">Late Payment Fee</Label>
                    <Input
                      id="late_payment_fee"
                      type="number"
                      placeholder="2.5"
                      value={editedTerms.late_payment_fee || ''}
                      onChange={(e) => updateTerm('', 'late_payment_fee', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Operational Terms</span>
              </CardTitle>
              <CardDescription>
                Booking procedures, allocation management, and operational requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="booking_lead_time">Minimum Booking Lead Time</Label>
                    <Input
                      id="booking_lead_time"
                      placeholder="24 hours"
                      value={editedTerms.booking_lead_time || ''}
                      onChange={(e) => updateTerm('', 'booking_lead_time', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="allocation_type">Allocation Type</Label>
                    <select
                      id="allocation_type"
                      className="w-full p-2 border rounded-md"
                      value={editedTerms.allocation_type || ''}
                      onChange={(e) => updateTerm('', 'allocation_type', e.target.value)}
                    >
                      <option value="">Select allocation type</option>
                      <option value="committed">Committed</option>
                      <option value="freesale">Freesale</option>
                      <option value="on_request">On Request</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="allocation_quantity">Allocation Quantity</Label>
                    <Input
                      id="allocation_quantity"
                      type="number"
                      placeholder="100"
                      value={editedTerms.allocation_quantity || ''}
                      onChange={(e) => updateTerm('', 'allocation_quantity', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirmation_time">Confirmation Time</Label>
                    <Input
                      id="confirmation_time"
                      placeholder="2 hours"
                      value={editedTerms.confirmation_time || ''}
                      onChange={(e) => updateTerm('', 'confirmation_time', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cutoff_time">Booking Cutoff Time</Label>
                    <Input
                      id="cutoff_time"
                      placeholder="18:00"
                      value={editedTerms.cutoff_time || ''}
                      onChange={(e) => updateTerm('', 'cutoff_time', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="operational_notes">Operational Notes</Label>
                    <Textarea
                      id="operational_notes"
                      placeholder="Any special operational requirements..."
                      value={editedTerms.operational_notes || ''}
                      onChange={(e) => updateTerm('', 'operational_notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Legal Terms</span>
              </CardTitle>
              <CardDescription>
                Legal requirements, compliance, and regulatory terms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="governing_law">Governing Law</Label>
                  <select
                    id="governing_law"
                    className="w-full p-2 border rounded-md"
                    value={editedTerms.governing_law || ''}
                    onChange={(e) => updateTerm('', 'governing_law', e.target.value)}
                  >
                    <option value="">Select governing law</option>
                    <option value="English Law">English Law</option>
                    <option value="US Law">US Law</option>
                    <option value="EU Law">EU Law</option>
                    <option value="UAE Law">UAE Law</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction</Label>
                  <Input
                    id="jurisdiction"
                    placeholder="London, UK"
                    value={editedTerms.jurisdiction || ''}
                    onChange={(e) => updateTerm('', 'jurisdiction', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dispute_resolution">Dispute Resolution</Label>
                  <select
                    id="dispute_resolution"
                    className="w-full p-2 border rounded-md"
                    value={editedTerms.dispute_resolution || ''}
                    onChange={(e) => updateTerm('', 'dispute_resolution', e.target.value)}
                  >
                    <option value="">Select dispute resolution</option>
                    <option value="Arbitration">Arbitration</option>
                    <option value="Mediation">Mediation</option>
                    <option value="Court">Court</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="liability_limit">Liability Limit</Label>
                  <Input
                    id="liability_limit"
                    placeholder="£1,000,000"
                    value={editedTerms.liability_limit || ''}
                    onChange={(e) => updateTerm('', 'liability_limit', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="legal_notes">Legal Notes</Label>
                  <Textarea
                    id="legal_notes"
                    placeholder="Any additional legal terms or requirements..."
                    value={editedTerms.legal_notes || ''}
                    onChange={(e) => updateTerm('', 'legal_notes', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Custom Terms</span>
              </CardTitle>
              <CardDescription>
                Add custom terms and conditions specific to this contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom_terms">Custom Terms</Label>
                  <Textarea
                    id="custom_terms"
                    placeholder="Enter any custom terms and conditions..."
                    className="min-h-32"
                    value={editedTerms.custom_terms || ''}
                    onChange={(e) => updateTerm('', 'custom_terms', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="special_conditions">Special Conditions</Label>
                  <Textarea
                    id="special_conditions"
                    placeholder="Any special conditions or requirements..."
                    className="min-h-24"
                    value={editedTerms.special_conditions || ''}
                    onChange={(e) => updateTerm('', 'special_conditions', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additional_notes">Additional Notes</Label>
                  <Textarea
                    id="additional_notes"
                    placeholder="Any additional notes or comments..."
                    className="min-h-24"
                    value={editedTerms.additional_notes || ''}
                    onChange={(e) => updateTerm('', 'additional_notes', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
