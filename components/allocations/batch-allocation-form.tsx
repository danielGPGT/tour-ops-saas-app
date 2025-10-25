'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { useProducts } from '@/lib/hooks/useProducts'
import { useCreateAllocation } from '@/lib/hooks/useAllocations'
import { toast } from 'sonner'
import { Package, DollarSign, Calendar, Info } from 'lucide-react'

const batchAllocationSchema = z.object({
  contract_id: z.string().min(1, 'Contract is required'),
  product_id: z.string().min(1, 'Product is required'),
  allocation_name: z.string().min(1, 'Allocation name is required'),
  batch_code: z.string().min(1, 'Batch code is required'),
  batch_quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  cost_per_unit: z.number().min(0, 'Cost must be positive'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  notes: z.string().optional()
})

interface BatchAllocationFormProps {
  contractId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function BatchAllocationForm({ contractId, onSuccess, onCancel }: BatchAllocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: products } = useProducts()
  const createAllocation = useCreateAllocation()

  const form = useForm({
    resolver: zodResolver(batchAllocationSchema),
    defaultValues: {
      contract_id: contractId || '',
      product_id: '',
      allocation_name: '',
      batch_code: '',
      batch_quantity: 1,
      cost_per_unit: 0,
      purchase_date: '',
      notes: ''
    }
  })

  const watchedQuantity = form.watch('batch_quantity')
  const watchedCostPerUnit = form.watch('cost_per_unit')
  const totalCost = watchedQuantity * watchedCostPerUnit

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      const allocationData = {
        ...data,
        allocation_type: 'batch',
        total_cost: totalCost,
        valid_from: data.purchase_date,
        valid_to: data.purchase_date, // Same day for simple batches
        is_active: true
      }

      await createAllocation.mutateAsync(allocationData)
      toast.success('Batch allocation created successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create batch allocation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          New Batch Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            <span className="text-sm text-muted-foreground">
                              ({product.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="allocation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., January VIP Batch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batch_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., F1-VIP-JAN-2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="batch_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
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
                name="cost_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Unit</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="500.00" 
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
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                        placeholder="Select date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {totalCost > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-medium">Purchase Summary</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Quantity: {watchedQuantity} units</div>
                  <div>Cost per Unit: ${watchedCostPerUnit.toFixed(2)}</div>
                  <div className="font-semibold text-primary">
                    Total Cost: ${totalCost.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this batch..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Batch Allocation'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
