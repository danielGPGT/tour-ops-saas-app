'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCreateInventoryItem, useUpdateInventoryItem } from '@/lib/hooks/useAllocationInventory'
import { getProductOptions } from '@/lib/queries/allocation-inventory'
import { allocationInventorySchema, AllocationInventoryFormData } from '@/lib/validations/inventory.schema'
import type { AllocationInventory } from '@/lib/types/inventory'
import { Package, AlertCircle } from 'lucide-react'

interface InventoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allocationId: string
  productId: string
  inventory?: AllocationInventory
  onSuccess?: () => void
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  allocationId,
  productId,
  inventory,
  onSuccess
}: InventoryFormDialogProps) {
  const [productOptions, setProductOptions] = useState<any[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])

  const createInventoryItem = useCreateInventoryItem()
  const updateInventoryItem = useUpdateInventoryItem()

  const form = useForm<AllocationInventoryFormData>({
    resolver: zodResolver(allocationInventorySchema),
    defaultValues: {
      product_option_id: '',
      total_quantity: 1,
      flexible_configuration: false,
      alternate_option_ids: [],
      min_quantity_per_booking: 1,
      max_quantity_per_booking: undefined,
      is_active: true,
      notes: ''
    }
  })

  // Load product options when dialog opens
  useEffect(() => {
    if (open && productId) {
      console.log('Loading product options for product ID:', productId)
      setLoadingOptions(true)
      getProductOptions(productId)
        .then(options => {
          console.log('Loaded product options:', options)
          setProductOptions(options)
          if (options.length === 0) {
            toast.warning('No product options found for this product. Please create product options first.')
          }
        })
        .catch(error => {
          console.error('Failed to load product options:', error)
          toast.error('Failed to load product options: ' + error.message)
        })
        .finally(() => {
          setLoadingOptions(false)
        })
    }
  }, [open, productId])

  // Set form values when editing
  useEffect(() => {
    if (open) {
      if (inventory) {
        form.reset({
          product_option_id: inventory.product_option_id,
          total_quantity: inventory.total_quantity,
          flexible_configuration: inventory.flexible_configuration,
          alternate_option_ids: inventory.alternate_option_ids || [],
          min_quantity_per_booking: inventory.min_quantity_per_booking,
          max_quantity_per_booking: inventory.max_quantity_per_booking,
          is_active: inventory.is_active,
          notes: inventory.notes || ''
        })
        setSelectedOptionIds(inventory.alternate_option_ids || [])
      } else {
        // Reset to default values when not editing
        form.reset({
          product_option_id: '',
          total_quantity: 1,
          flexible_configuration: false,
          alternate_option_ids: [],
          min_quantity_per_booking: 1,
          max_quantity_per_booking: undefined,
          is_active: true,
          notes: ''
        })
        setSelectedOptionIds([])
      }
    }
  }, [open, inventory])

  const onSubmit = async (data: AllocationInventoryFormData) => {
    try {
      console.log('Form submission data:', data)
      console.log('Current form values:', form.getValues())
      console.log('Form errors:', form.formState.errors)
      
      const inventoryData = {
        ...data,
        contract_allocation_id: allocationId
      }

      if (inventory) {
        await updateInventoryItem.mutateAsync({ 
          id: inventory.id, 
          data: inventoryData 
        })
      } else {
        await createInventoryItem.mutateAsync(inventoryData)
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to save inventory item:', error)
    }
  }

  const handleOptionToggle = (optionId: string) => {
    const newSelectedIds = selectedOptionIds.includes(optionId) 
      ? selectedOptionIds.filter(id => id !== optionId)
      : [...selectedOptionIds, optionId]
    
    setSelectedOptionIds(newSelectedIds)
    // Update the form field as well
    form.setValue('alternate_option_ids', newSelectedIds)
  }

  const isSubmitting = createInventoryItem.isPending || updateInventoryItem.isPending
  
  // Debug: Watch the form values
  const watchedValues = form.watch()
  console.log('Current form values:', watchedValues)
  console.log('Form is valid:', form.formState.isValid)
  console.log('Form errors:', form.formState.errors)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {inventory ? 'Edit Inventory Item' : 'Add Inventory Item'}
          </DialogTitle>
          <DialogDescription>
            Configure product options and quantities for this allocation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="product_option_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Option *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        console.log('Product option selected:', value)
                        field.onChange(value)
                      }} 
                      value={field.value}
                      disabled={loadingOptions}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingOptions ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm">Loading product options...</p>
                          </div>
                        ) : productOptions.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">No product options available</p>
                            <p className="text-xs">Please create product options for this product first</p>
                          </div>
                        ) : (
                          productOptions.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              <div className="flex flex-col">
                                <span>{option.option_name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {option.option_code}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose which product option to include in this allocation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="total_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        value={field.value || ''}
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of units available for this option.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="min_quantity_per_booking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Quantity per Booking</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        value={field.value || ''}
                        onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum units required per booking.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_quantity_per_booking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Quantity per Booking</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum units allowed per booking (optional).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="flexible_configuration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Flexible Configuration
                    </FormLabel>
                    <FormDescription>
                      Enable flexible configuration to allow customers to book alternate product options 
                      (e.g., different room types, vehicle types) that share the same inventory pool.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('flexible_configuration') && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="space-y-1">
                  <FormLabel className="text-base font-medium">Alternate Options</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Select which other product options can be substituted for the primary option. 
                    All options will share the same inventory pool of <strong>{form.watch('total_quantity') || 0}</strong> units.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {productOptions
                    .filter(option => option.id !== form.watch('product_option_id'))
                    .map(option => (
                      <div
                        key={option.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedOptionIds.includes(option.id) 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleOptionToggle(option.id)}
                      >
                        <div className="font-medium text-sm">{option.option_name}</div>
                        <div className="text-xs text-muted-foreground">{option.option_code}</div>
                      </div>
                    ))}
                </div>
                
                {selectedOptionIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-700 dark:text-green-400">
                      ✓ Selected Alternate Options:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedOptionIds.map(optionId => {
                        const option = productOptions.find(o => o.id === optionId)
                        return (
                          <Badge key={optionId} variant="secondary" className="text-xs">
                            {option?.option_name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
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
                      placeholder="Additional notes for this inventory item..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about this inventory configuration.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (inventory ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}