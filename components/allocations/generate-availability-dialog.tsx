'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, addDays } from 'date-fns'
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
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/common/DatePicker'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useGenerateAvailability } from '@/lib/hooks/useAllocationInventory'
import { generateAvailabilitySchema, GenerateAvailabilityFormData } from '@/lib/validations/inventory.schema'
import type { InventoryWithStats } from '@/lib/types/inventory'
import { Calendar, Package, AlertTriangle } from 'lucide-react'

interface GenerateAvailabilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventoryItems: InventoryWithStats[]
  allocationValidFrom: string
  allocationValidTo: string
  onSuccess?: () => void
}

export function GenerateAvailabilityDialog({
  open,
  onOpenChange,
  inventoryItems,
  allocationValidFrom,
  allocationValidTo,
  onSuccess
}: GenerateAvailabilityDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  const generateAvailability = useGenerateAvailability()

  // Helper function to safely format dates
  const safeFormatDate = (dateString: string, formatStr: string) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return format(date, formatStr)
    } catch {
      return ''
    }
  }

  const form = useForm<GenerateAvailabilityFormData>({
    resolver: zodResolver(generateAvailabilitySchema),
    defaultValues: {
      date_from: '',
      date_to: ''
    }
  })

  // Set form values when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        date_from: allocationValidFrom,
        date_to: allocationValidTo
      })
    } else {
      // Reset when dialog closes
      setSelectedItems([])
    }
  }, [open, allocationValidFrom, allocationValidTo])

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSelectAll = () => {
    setSelectedItems(inventoryItems.map(item => item.id))
  }

  const handleSelectNone = () => {
    setSelectedItems([])
  }

  const onSubmit = async (data: GenerateAvailabilityFormData) => {
    if (selectedItems.length === 0) {
      return
    }

    try {
      await generateAvailability.mutateAsync({
        inventoryIds: selectedItems,
        dateFrom: data.date_from,
        dateTo: data.date_to
      })
      
      onSuccess?.()
      onOpenChange(false)
      setSelectedItems([])
    } catch (error: any) {
      console.error('Failed to generate availability:', error)
    }
  }

  const isSubmitting = generateAvailability.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Availability</DialogTitle>
          <DialogDescription>
            Generate daily availability records for selected inventory items.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_from"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date *</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={false}
                    />
                    <FormDescription>
                      First date to generate availability for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_to"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                      disabled={false}
                    />
                    <FormDescription>
                      Last date to generate availability for.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inventory Items Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Select Inventory Items</FormLabel>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectNone}
                  >
                    Select None
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {inventoryItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedItems.includes(item.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleItemToggle(item.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <div className="font-medium">{item.product_option?.option_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.product_option?.product?.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Qty: {item.total_quantity}
                          </Badge>
                          {item.flexible_configuration && (
                            <Badge variant="secondary" className="text-xs">
                              Flexible
                            </Badge>
                          )}
                          {item.availability_generated && (
                            <Badge variant="default" className="text-xs">
                              Generated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItems.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedItems.map(itemId => {
                    const item = inventoryItems.find(i => i.id === itemId)
                    return (
                      <Badge key={itemId} variant="secondary" className="text-xs">
                        {item?.product_option?.option_name}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  Will generate availability for <strong>{selectedItems.length}</strong> inventory items
                  {form.watch('date_from') && form.watch('date_to') && (
                    <>
                      {' '}from <strong>{safeFormatDate(form.watch('date_from'), 'MMM d, yyyy')}</strong> to{' '}
                      <strong>{safeFormatDate(form.watch('date_to'), 'MMM d, yyyy')}</strong>
                    </>
                  )}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || selectedItems.length === 0}
              >
                {isSubmitting ? 'Generating...' : 'Generate Availability'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}