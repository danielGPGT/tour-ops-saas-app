'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useProducts } from '@/lib/hooks/useProducts'
import { toast } from 'sonner'
import { Package, DollarSign, TrendingUp, Info, AlertCircle } from 'lucide-react'

const bookingSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  product_option_id: z.string().min(1, 'Product option is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email('Valid email is required')
})

interface FIFOBookingFormProps {
  onSuccess?: (bookingData: any) => void
  onCancel?: () => void
}

export function FIFOBookingForm({ onSuccess, onCancel }: FIFOBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableBatches, setAvailableBatches] = useState<any[]>([])
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [totalAvailable, setTotalAvailable] = useState(0)
  const [weightedAvgCost, setWeightedAvgCost] = useState(0)
  
  const { data: products } = useProducts()

  const form = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      product_id: '',
      product_option_id: '',
      quantity: 1,
      selling_price: 0,
      customer_name: '',
      customer_email: ''
    }
  })

  const watchedProductId = form.watch('product_id')
  const watchedQuantity = form.watch('quantity')
  const watchedSellingPrice = form.watch('selling_price')
  const watchedProductOptionId = form.watch('product_option_id')

  // Load available batches when product option changes
  useEffect(() => {
    if (watchedProductOptionId) {
      loadAvailableBatches(watchedProductOptionId)
    }
  }, [watchedProductOptionId])

  const loadAvailableBatches = async (productOptionId: string) => {
    try {
      // This would call your API to get available batches
      // For now, we'll simulate the data
      const mockBatches = [
        {
          inventory_id: 'inv-1',
          allocation_id: 'alloc-1',
          batch_name: 'January VIP Batch',
          batch_code: 'F1-VIP-JAN-2025',
          available_quantity: 75,
          cost_per_unit: 500,
          purchase_date: '2025-01-15'
        },
        {
          inventory_id: 'inv-2',
          allocation_id: 'alloc-2',
          batch_name: 'March VIP Batch',
          batch_code: 'F1-VIP-MAR-2025',
          available_quantity: 50,
          cost_per_unit: 600,
          purchase_date: '2025-03-10'
        }
      ]
      
      setAvailableBatches(mockBatches)
      
      const total = mockBatches.reduce((sum, batch) => sum + batch.available_quantity, 0)
      setTotalAvailable(total)
      
      const weightedCost = mockBatches.reduce((sum, batch) => 
        sum + (batch.cost_per_unit * batch.available_quantity), 0
      ) / total
      setWeightedAvgCost(weightedCost)
      
    } catch (error) {
      console.error('Failed to load available batches:', error)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      // Simulate FIFO booking
      const bookingData = {
        ...data,
        // FIFO will select the oldest batch with availability
        batch_used: availableBatches[0], // Oldest batch (FIFO)
        cost_per_unit: availableBatches[0].cost_per_unit,
        margin: data.selling_price - availableBatches[0].cost_per_unit,
        margin_percentage: ((data.selling_price - availableBatches[0].cost_per_unit) / data.selling_price) * 100
      }

      // Here you would call your API to book the inventory using FIFO
      // await bookInventoryFIFO(data.product_option_id, data.quantity)
      
      toast.success('Booking created successfully with FIFO cost tracking')
      onSuccess?.(bookingData)
    } catch (error) {
      toast.error('Failed to create booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  const margin = watchedSellingPrice - weightedAvgCost
  const marginPercentage = watchedSellingPrice > 0 ? (margin / watchedSellingPrice) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Booking (FIFO Cost Tracking)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>{product.name}</span>
                            </div>
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
                name="product_option_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Option</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* This would be populated based on selected product */}
                        <SelectItem value="option-1">VIP Hospitality</SelectItem>
                        <SelectItem value="option-2">General Admission</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="selling_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selling Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="800.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Available Batches Display */}
            {availableBatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-medium">Available Inventory Batches</span>
                </div>
                
                <div className="grid gap-3">
                  {availableBatches.map((batch, index) => (
                    <div 
                      key={batch.inventory_id}
                      className={`p-3 border rounded-lg ${
                        index === 0 ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{batch.batch_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {batch.batch_code} • Purchased {batch.purchase_date}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${batch.cost_per_unit}</div>
                          <div className="text-sm text-muted-foreground">
                            {batch.available_quantity} available
                          </div>
                        </div>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="mt-2">
                          FIFO: Will use this batch first
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total Available</div>
                      <div className="font-medium">{totalAvailable} units</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Weighted Avg Cost</div>
                      <div className="font-medium">${weightedAvgCost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Margin Calculation */}
            {watchedSellingPrice > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">Margin Analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Selling Price</div>
                    <div className="font-medium">${watchedSellingPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Estimated Cost</div>
                    <div className="font-medium">${weightedAvgCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Margin</div>
                    <div className={`font-medium ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${margin.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Margin %</div>
                    <div className={`font-medium ${marginPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marginPercentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchedQuantity > totalAvailable && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">
                  Insufficient inventory. Available: {totalAvailable}, Requested: {watchedQuantity}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || watchedQuantity > totalAvailable}
              >
                {isSubmitting ? 'Creating...' : 'Create Booking'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
