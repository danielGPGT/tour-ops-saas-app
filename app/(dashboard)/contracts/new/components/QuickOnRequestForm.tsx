'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Handshake, Percent } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'

const onRequestSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  agreement_name: z.string().min(1, 'Agreement name is required'),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  commission_rate: z.number().min(0).max(100, 'Commission rate must be between 0 and 100'),
  terms: z.string().optional()
})

type OnRequestFormData = z.infer<typeof onRequestSchema>

interface QuickOnRequestFormProps {
  onSave: (data: any) => void
  onCancel: () => void
}

export function QuickOnRequestForm({ onSave, onCancel }: QuickOnRequestFormProps) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<OnRequestFormData>({
    resolver: zodResolver(onRequestSchema),
    defaultValues: {
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      commission_rate: 15
    }
  })

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await fetch('/api/suppliers')
        if (response.ok) {
          const data = await response.json()
          const loadedSuppliers = data.data || []
          
          // If no suppliers in database, add some mock data for testing
          if (loadedSuppliers.length === 0) {
            const mockSuppliers = [
              { id: 'mock-1', name: 'Test Hotel', code: 'TEST', supplier_type: 'accommodation' },
              { id: 'mock-2', name: 'Event Tickets Co', code: 'EVENT', supplier_type: 'ticket' },
              { id: 'mock-3', name: 'Tour Operator', code: 'TOUR', supplier_type: 'tour' }
            ]
            setSuppliers(mockSuppliers)
          } else {
            setSuppliers(loadedSuppliers)
          }
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error)
        toast.error('Failed to load suppliers')
      }
    }

    loadSuppliers()
  }, [])

  const onSubmit = async (data: OnRequestFormData) => {
    try {
      setIsLoading(true)

      // Generate contract number
      const contractNumber = `OR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

      // Create contract data
      const contractData = {
        contract: {
          supplier_id: data.supplier_id,
          contract_number: contractNumber,
          contract_name: data.agreement_name,
          contract_type: 'on_request',
          valid_from: data.valid_from,
          valid_to: data.valid_to,
          currency: 'USD', // Default currency for on-request
          commission_rate: data.commission_rate,
          commission_type: 'percentage',
          payment_terms: data.terms || 'Standard terms apply',
          status: 'active',
          is_quick_entry: true
        },
        allocations: [], // No allocations for on-request
        payments: [] // No payments for on-request
      }

      // Save contract
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`
        },
        body: JSON.stringify(contractData)
      })

      if (!response.ok) {
        throw new Error('Failed to create contract')
      }

      toast.success('On-request agreement created successfully!')
      onSave(contractData)
    } catch (error) {
      console.error('Failed to create on-request agreement:', error)
      toast.error('Failed to create on-request agreement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          On Request Agreement
        </h2>
        <p className="text-muted-foreground">
          Quick setup for ad-hoc agreements - 20 seconds
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Agreement Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_id">Supplier *</Label>
                <Select
                  value={form.watch('supplier_id')}
                  onValueChange={(value) => form.setValue('supplier_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.supplier_id && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.supplier_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="agreement_name">Agreement Name *</Label>
                <Input
                  id="agreement_name"
                  placeholder="e.g., 2025 Rates Agreement"
                  {...form.register('agreement_name')}
                />
                {form.formState.errors.agreement_name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.agreement_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  {...form.register('valid_from')}
                />
                {form.formState.errors.valid_from && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.valid_from.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_to">Valid To *</Label>
                <Input
                  id="valid_to"
                  type="date"
                  {...form.register('valid_to')}
                />
                {form.formState.errors.valid_to && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.valid_to.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate" className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Commission Rate * (%)
              </Label>
              <Input
                id="commission_rate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                {...form.register('commission_rate', { valueAsNumber: true })}
              />
              {form.formState.errors.commission_rate && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.commission_rate.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Commission rate for bookings made through this agreement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms">Terms (optional)</Label>
              <Textarea
                id="terms"
                placeholder="e.g., 7 days advance booking required, standard cancellation policy applies"
                {...form.register('terms')}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Handshake className="h-4 w-4" />
                Save & Close
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
