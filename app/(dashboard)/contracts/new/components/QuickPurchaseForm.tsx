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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calculator, Package, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'

const purchaseSchema = z.object({
  supplier_id: z.string().min(1, 'Please select a supplier'),
  order_reference: z.string().min(1, 'Order reference is required'),
  product_id: z.string().min(1, 'Please select a product'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  cost_per_unit: z.number().min(0.01, 'Cost per unit must be greater than 0'),
  currency: z.string().min(1, 'Currency is required'),
  valid_from: z.string().min(1, 'Available from date is required'),
  valid_to: z.string().min(1, 'Available to date is required'),
  payment_status: z.enum(['paid', 'pending']),
  notes: z.string().optional()
})

type PurchaseFormData = z.infer<typeof purchaseSchema>

interface QuickPurchaseFormProps {
  onSave: (data: any) => void
  onCancel: () => void
}

export function QuickPurchaseForm({ onSave, onCancel }: QuickPurchaseFormProps) {
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      currency: 'USD',
      payment_status: 'paid',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }
  })

  const watchedValues = form.watch(['quantity', 'cost_per_unit'])
  const totalCost = watchedValues[0] * watchedValues[1]

  // Load suppliers and products
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load suppliers
        const suppliersResponse = await fetch('/api/suppliers')
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json()
          const loadedSuppliers = suppliersData.data || []
          
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

        // Load products
        const productsResponse = await fetch('/api/products')
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          const loadedProducts = productsData.data || []
          
          // If no products in database, add some mock data for testing
          if (loadedProducts.length === 0) {
            const mockProducts = [
              { id: 'mock-product-1', name: 'F1 Grandstand Tickets', code: 'F1-GRANDSTAND' },
              { id: 'mock-product-2', name: 'Hotel Room Block', code: 'HOTEL-BLOCK' },
              { id: 'mock-product-3', name: 'City Tour', code: 'CITY-TOUR' }
            ]
            setProducts(mockProducts)
          } else {
            setProducts(loadedProducts)
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load suppliers and products')
      }
    }

    loadData()
  }, [])

  const onSubmit = async (data: PurchaseFormData) => {
    try {
      setIsLoading(true)

      // Create contract data
      const contractData = {
        contract: {
          supplier_id: data.supplier_id,
          contract_number: data.order_reference,
          contract_name: `${data.order_reference} - Purchase Order`,
          contract_type: 'batch_purchase',
          valid_from: data.valid_from,
          valid_to: data.valid_to,
          currency: data.currency,
          total_value: totalCost,
          payment_terms: data.payment_status === 'paid' ? 'Paid in full' : 'Payment pending',
          status: 'active',
          is_quick_entry: true
        },
        allocations: [{
          product_id: data.product_id,
          allocation_name: `Purchase - ${data.order_reference}`,
          allocation_type: 'batch',
          total_quantity: data.quantity,
          valid_from: data.valid_from,
          valid_to: data.valid_to,
          total_cost: totalCost,
          cost_per_unit: data.cost_per_unit,
          notes: data.notes || `Batch purchase: ${data.quantity} units at ${data.cost_per_unit} ${data.currency} each`
        }],
        payments: data.payment_status === 'paid' ? [{
          payment_number: 1,
          due_date: data.valid_from,
          amount_due: totalCost,
          percentage: 100,
          description: 'Paid in full',
          status: 'paid'
        }] : [{
          payment_number: 1,
          due_date: data.valid_to,
          amount_due: totalCost,
          percentage: 100,
          description: 'Payment pending',
          status: 'pending'
        }]
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

      toast.success('Purchase order created successfully!')
      onSave(contractData)
    } catch (error) {
      console.error('Failed to create purchase order:', error)
      toast.error('Failed to create purchase order')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Quick Purchase Entry
        </h2>
        <p className="text-muted-foreground">
          Enter your purchase details in 30 seconds
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Details
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
                <Label htmlFor="order_reference">Order Reference *</Label>
                <Input
                  id="order_reference"
                  placeholder="e.g., TM-2025-F1-001"
                  {...form.register('order_reference')}
                />
                {form.formState.errors.order_reference && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.order_reference.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product_id">Product *</Label>
                <Select
                  value={form.watch('product_id')}
                  onValueChange={(value) => form.setValue('product_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.product_id && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.product_id.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  {...form.register('quantity', { valueAsNumber: true })}
                />
                {form.formState.errors.quantity && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.quantity.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost_per_unit">Cost per Unit *</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...form.register('cost_per_unit', { valueAsNumber: true })}
                />
                {form.formState.errors.cost_per_unit && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.cost_per_unit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={form.watch('currency')}
                  onValueChange={(value) => form.setValue('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="SGD">SGD</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {totalCost.toLocaleString()} {form.watch('currency')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Availability & Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Available From *</Label>
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
                <Label htmlFor="valid_to">Available To *</Label>
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

            <div className="space-y-3">
              <Label>Payment Status</Label>
              <RadioGroup
                value={form.watch('payment_status')}
                onValueChange={(value) => form.setValue('payment_status', value as 'paid' | 'pending')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paid" id="paid" />
                  <Label htmlFor="paid" className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Paid in full
                    </Badge>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pending" id="pending" />
                  <Label htmlFor="pending" className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Payment pending
                    </Badge>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Batch purchase for F1 Singapore Grand Prix"
                {...form.register('notes')}
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
                <Package className="h-4 w-4" />
                Save & Close
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
