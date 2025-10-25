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
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useProducts } from '@/lib/hooks/useProducts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { useCreateAllocation } from '@/lib/hooks/useAllocations'
import { toast } from 'sonner'
import { Package, DollarSign, Calendar, Building, FileText, Info } from 'lucide-react'
import type { AllocationType } from '@/lib/types/allocation'

// Simplified schema based on allocation type
const createAllocationSchema = (allocationType: AllocationType) => {
  const baseSchema = z.object({
    allocation_name: z.string().min(1, 'Allocation name is required'),
    allocation_type: z.enum(['hotel_allocation', 'purchased_inventory', 'on_request', 'unlimited']),
    supplier_id: z.string().min(1, 'Supplier is required'),
    product_id: z.string().min(1, 'Product is required'),
    contract_id: z.string().optional(),
    valid_from: z.string().min(1, 'Valid from date is required'),
    valid_to: z.string().min(1, 'Valid to date is required'),
    is_active: z.boolean().default(true),
    notes: z.string().optional()
  })

  if (allocationType === 'purchased_inventory') {
    return baseSchema.extend({
      purchase_date: z.string().min(1, 'Purchase date is required'),
      purchase_reference: z.string().optional(),
      total_quantity: z.number().int().min(1, 'Quantity must be at least 1'),
      cost_per_unit: z.number().min(0, 'Cost must be positive'),
      currency: z.string().min(1, 'Currency is required')
    })
  }

  if (allocationType === 'hotel_allocation') {
    return baseSchema.extend({
      min_nights: z.number().int().min(1).optional(),
      max_nights: z.number().int().min(1).optional(),
      release_days: z.number().int().min(0).optional(),
      dow_arrival: z.array(z.number()).optional(),
      dow_checkout: z.array(z.number()).optional(),
      blackout_dates: z.array(z.string()).optional()
    })
  }

  return baseSchema
}

interface SimplifiedAllocationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  defaultContractId?: string
  defaultProductId?: string
}

export function SimplifiedAllocationForm({ 
  onSuccess, 
  onCancel, 
  defaultContractId, 
  defaultProductId 
}: SimplifiedAllocationFormProps) {
  const [allocationType, setAllocationType] = useState<AllocationType>('purchased_inventory')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  
  const { data: products } = useProducts()
  const { data: suppliers } = useSuppliers()
  const createAllocation = useCreateAllocation()

  const form = useForm({
    resolver: zodResolver(createAllocationSchema(allocationType)),
    defaultValues: {
      allocation_name: '',
      allocation_type: allocationType,
      supplier_id: '',
      product_id: defaultProductId || '',
      contract_id: defaultContractId || '',
      valid_from: '',
      valid_to: '',
      is_active: true,
      notes: '',
      // purchased_inventory defaults
      purchase_date: '',
      purchase_reference: '',
      total_quantity: 1,
      cost_per_unit: 0,
      currency: 'USD'
    }
  })

  const onSubmit = async (data: any) => {
    try {
      // Calculate total_cost for purchased_inventory
      if (allocationType === 'purchased_inventory' && data.total_quantity && data.cost_per_unit) {
        data.total_cost = data.total_quantity * data.cost_per_unit
        data.available_quantity = data.total_quantity
        data.sold_quantity = 0
      }

      await createAllocation.mutateAsync(data)
      toast.success('Allocation created successfully')
      onSuccess?.()
    } catch (error) {
      toast.error('Failed to create allocation')
    }
  }

  const handleAllocationTypeChange = (type: AllocationType) => {
    setAllocationType(type)
    form.setValue('allocation_type', type)
    
    // Reset form when changing type
    form.reset({
      ...form.getValues(),
      allocation_type: type,
      // Clear type-specific fields
      purchase_date: '',
      purchase_reference: '',
      total_quantity: 1,
      cost_per_unit: 0,
      min_nights: undefined,
      max_nights: undefined,
      release_days: undefined
    })
  }

  const handleProductChange = (productId: string) => {
    const product = products?.find(p => p.id === productId)
    setSelectedProduct(product)
    form.setValue('product_id', productId)
  }

  const getFormFields = () => {
    const baseFields = (
      <>
        <FormField
          control={form.control}
          name="allocation_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocation Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., F1 VIP - Jan 2025 Purchase" {...field} />
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
                        <Badge variant="outline" className="text-xs">
                          {supplier.code}
                        </Badge>
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
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value)
                handleProductChange(value)
              }} value={field.value}>
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
                        <Badge variant="outline" className="text-xs">
                          {product.code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valid_from"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid From</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    placeholder="Select start date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valid_to"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid To</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date?.toISOString().split('T')[0])}
                    placeholder="Select end date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </>
    )

    if (allocationType === 'purchased_inventory') {
      return (
        <>
          {baseFields}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Purchase Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
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
                name="purchase_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice number, PO, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="total_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50" 
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch('total_quantity') && form.watch('cost_per_unit') && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="font-medium">Purchase Summary</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Total Quantity: {form.watch('total_quantity')} units</div>
                  <div>Cost per Unit: {form.watch('currency')} {form.watch('cost_per_unit')}</div>
                  <div className="font-semibold text-primary">
                    Total Cost: {form.watch('currency')} {(form.watch('total_quantity') * form.watch('cost_per_unit')).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )
    }

    if (allocationType === 'hotel_allocation') {
      return (
        <>
          {baseFields}
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Hotel Restrictions</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Nights</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Nights</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="7" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="release_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Days</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="7" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )
    }

    return baseFields
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Create Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Allocation Type Selection */}
            <div className="space-y-4">
              <FormLabel>Allocation Type</FormLabel>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'purchased_inventory', label: 'Purchase Batch', desc: 'Tickets, tours, simple inventory', icon: Package },
                  { type: 'hotel_allocation', label: 'Hotel Allocation', desc: 'Complex hotel inventory', icon: Calendar },
                  { type: 'on_request', label: 'On Request', desc: 'No inventory tracking', icon: FileText },
                  { type: 'unlimited', label: 'Unlimited', desc: 'Always available', icon: Info }
                ].map(({ type, label, desc, icon: Icon }) => (
                  <div
                    key={type}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      allocationType === type 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleAllocationTypeChange(type as AllocationType)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">{label}</div>
                        <div className="text-sm text-muted-foreground">{desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {getFormFields()}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAllocation.isPending}>
                {createAllocation.isPending ? 'Creating...' : 'Create Allocation'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

