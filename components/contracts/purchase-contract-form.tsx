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
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useCreateContract } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { FileText, Building, DollarSign, Calendar, Package } from 'lucide-react'

const purchaseContractSchema = z.object({
  supplier_id: z.string().min(1, 'Supplier is required'),
  purchase_order_number: z.string().min(1, 'PO/Invoice number is required'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  total_cost: z.number().min(0, 'Total cost must be positive'),
  notes: z.string().optional()
})

interface PurchaseContractFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function PurchaseContractForm({ onSuccess, onCancel }: PurchaseContractFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: suppliers } = useSuppliers()
  const createContract = useCreateContract()

  const form = useForm({
    resolver: zodResolver(purchaseContractSchema),
    defaultValues: {
      supplier_id: '',
      purchase_order_number: '',
      purchase_date: '',
      total_cost: 0,
      notes: ''
    }
  })

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      
      const contractData = {
        ...data,
        contract_type: 'purchase',
        contract_number: data.purchase_order_number,
        contract_name: `Purchase ${data.purchase_order_number}`,
        currency: 'USD',
        is_active: true
      }

      await createContract.mutateAsync(contractData)
      toast.success('Purchase contract created successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create purchase contract')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          New Purchase Contract
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map(supplier => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              <span>{supplier.name}</span>
                              <span className="text-sm text-muted-foreground">
                                ({supplier.code})
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

              <FormField
                control={form.control}
                name="purchase_order_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO/Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PO-2025-001 or INV-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        placeholder="Select purchase date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="50000.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this purchase..." 
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
                {isSubmitting ? 'Creating...' : 'Create Purchase Contract'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
