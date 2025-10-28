'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  MoreVertical,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Save,
  X
} from 'lucide-react'
import { useProductOptions } from '@/lib/hooks/useProducts'
import { 
  useCreateAllocationInventory, 
  useUpdateAllocationInventory, 
  useDeleteAllocationInventory 
} from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AllocationInventoryManagerProps {
  allocationId: string
  allocation: any
  inventorySummary: any
}

interface InventoryFormData {
  product_option_id: string
  total_quantity: number
  batch_cost_per_unit: number
  notes?: string
}

export function AllocationInventoryManager({ 
  allocationId, 
  allocation, 
  inventorySummary 
}: AllocationInventoryManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingInventory, setEditingInventory] = useState<any>(null)
  
  const { data: productOptions = [] } = useProductOptions(allocation?.product_id)
  const createInventory = useCreateAllocationInventory()
  const updateInventory = useUpdateAllocationInventory()
  const deleteInventory = useDeleteAllocationInventory()

  // Get available product options (not already assigned)
  const availableOptions = useMemo(() => {
    if (!productOptions || !allocation?.allocation_inventory) return productOptions || []
    
    const assignedOptionIds = allocation.allocation_inventory.map((inv: any) => inv.product_option_id)
    return productOptions.filter((option: any) => !assignedOptionIds.includes(option.id))
  }, [productOptions, allocation?.allocation_inventory])

  const handleCreateInventory = async (data: InventoryFormData) => {
    try {
      await createInventory.mutateAsync({
        contract_allocation_id: allocationId,
        product_option_id: data.product_option_id,
        total_quantity: data.total_quantity,
        available_quantity: data.total_quantity, // Start with all available
        sold_quantity: 0, // Start with none sold
        batch_cost_per_unit: data.batch_cost_per_unit,
        currency: allocation.currency,
        notes: data.notes,
        is_active: true
      })
      
      setIsAddingNew(false)
      toast.success('Inventory distribution created successfully')
      
    } catch (error) {
      console.error('Error creating inventory:', error)
      toast.error('Failed to create inventory distribution')
    }
  }

  const handleUpdateInventory = async (inventoryId: string, data: Partial<InventoryFormData>) => {
    try {
      await updateInventory.mutateAsync({
        id: inventoryId,
        updates: data
      })
      
      setEditingInventory(null)
      toast.success('Inventory distribution updated successfully')
      
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast.error('Failed to update inventory distribution')
    }
  }

  const handleDeleteInventory = async (inventoryId: string) => {
    if (!confirm('Are you sure you want to delete this inventory distribution?')) {
      return
    }

    try {
      await deleteInventory.mutateAsync(inventoryId)
      toast.success('Inventory distribution deleted successfully')
      
    } catch (error) {
      console.error('Error deleting inventory:', error)
      toast.error('Failed to delete inventory distribution')
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Distributions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Inventory Distribution</CardTitle>
              <CardDescription>
                How this allocation is distributed across product options
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddingNew(true)} disabled={!availableOptions.length}>
              <Plus className="h-4 w-4 mr-2" />
              Add Distribution
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!allocation?.allocation_inventory?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Inventory Distributions</h3>
              <p className="text-sm">
                Add distributions to assign this allocation to specific product options
              </p>
              {availableOptions.length > 0 && (
                <Button className="mt-4" onClick={() => setIsAddingNew(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Distribution
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {allocation.allocation_inventory.map((inventory: any) => (
                <InventoryDistributionCard
                  key={inventory.id}
                  inventory={inventory}
                  allocation={allocation}
                  onEdit={() => setEditingInventory(inventory)}
                  onDelete={() => handleDeleteInventory(inventory.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add New Distribution Dialog */}
      {isAddingNew && (
        <InventoryDistributionDialog
          title="Add New Distribution"
          availableOptions={availableOptions}
          allocation={allocation}
          inventorySummary={inventorySummary}
          onSave={handleCreateInventory}
          onCancel={() => setIsAddingNew(false)}
          isSubmitting={createInventory.isPending}
        />
      )}

      {/* Edit Distribution Dialog */}
      {editingInventory && (
        <InventoryDistributionDialog
          title="Edit Distribution"
          initialData={editingInventory}
          availableOptions={[]} // Don't show options when editing
          allocation={allocation}
          inventorySummary={inventorySummary}
          onSave={(data) => handleUpdateInventory(editingInventory.id, data)}
          onCancel={() => setEditingInventory(null)}
          isSubmitting={updateInventory.isPending}
        />
      )}
    </div>
  )
}

// Individual inventory distribution card
function InventoryDistributionCard({ 
  inventory, 
  allocation, 
  onEdit, 
  onDelete 
}: {
  inventory: any
  allocation: any
  onEdit: () => void
  onDelete: () => void
}) {
  const utilizationRate = inventory.total_quantity > 0 
    ? (inventory.sold_quantity / inventory.total_quantity) * 100 
    : 0

  return (
    <Card className="relative">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">{inventory.product_option?.option_name}</h4>
              <Badge variant="outline" className="text-xs">
                {inventory.product_option?.option_code}
              </Badge>
            </div>

            <div className="grid gap-3 md:grid-cols-4 text-sm">
              <div>
                <label className="text-muted-foreground">Total</label>
                <p className="font-medium">{inventory.total_quantity}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Sold</label>
                <p className="font-medium text-orange-600">{inventory.sold_quantity}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Available</label>
                <p className="font-medium text-green-600">{inventory.available_quantity}</p>
              </div>
              <div>
                <label className="text-muted-foreground">Unit Cost</label>
                <p className="font-medium">
                  {allocation.currency} {inventory.batch_cost_per_unit?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>

            {utilizationRate > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Utilization</span>
                  <span>{utilizationRate.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {inventory.notes && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {inventory.notes}
                </p>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// Dialog for adding/editing inventory distributions
function InventoryDistributionDialog({
  title,
  initialData,
  availableOptions = [],
  allocation,
  inventorySummary,
  onSave,
  onCancel,
  isSubmitting = false
}: {
  title: string
  initialData?: any
  availableOptions: any[]
  allocation: any
  inventorySummary: any
  onSave: (data: InventoryFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
}) {
  const [formData, setFormData] = useState<InventoryFormData>({
    product_option_id: initialData?.product_option_id || '',
    total_quantity: initialData?.total_quantity || 1,
    batch_cost_per_unit: initialData?.batch_cost_per_unit || allocation?.cost_per_unit || 0,
    notes: initialData?.notes || ''
  })

  const isEdit = !!initialData
  
  // Calculate remaining capacity
  const remainingCapacity = (allocation?.total_quantity || 0) - (inventorySummary?.totalDistributed || 0)
  const wouldExceedCapacity = !isEdit && formData.total_quantity > remainingCapacity

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.product_option_id && !isEdit) {
      toast.error('Please select a product option')
      return
    }
    
    if (formData.total_quantity <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }
    
    if (wouldExceedCapacity) {
      toast.error('Quantity exceeds remaining allocation capacity')
      return
    }

    onSave(formData)
  }

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the distribution details' : 'Add a new inventory distribution'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <Label htmlFor="product_option_id">Product Option *</Label>
              <Select
                value={formData.product_option_id}
                onValueChange={(value) => setFormData({ ...formData, product_option_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product option" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.map((option: any) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.option_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="total_quantity">Quantity *</Label>
            <Input
              id="total_quantity"
              type="number"
              min="1"
              value={formData.total_quantity}
              onChange={(e) => setFormData({ 
                ...formData, 
                total_quantity: parseInt(e.target.value) || 0 
              })}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground mt-1">
                Remaining capacity: {remainingCapacity} units
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="batch_cost_per_unit">Cost Per Unit</Label>
            <div className="relative">
              <Input
                id="batch_cost_per_unit"
                type="number"
                step="0.01"
                min="0"
                value={formData.batch_cost_per_unit}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  batch_cost_per_unit: parseFloat(e.target.value) || 0 
                })}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {allocation.currency}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about this distribution..."
              rows={3}
            />
          </div>

          {wouldExceedCapacity && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This quantity ({formData.total_quantity}) exceeds the remaining allocation capacity ({remainingCapacity}).
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || wouldExceedCapacity || (!formData.product_option_id && !isEdit)}
            >
              {isSubmitting ? 'Saving...' : 'Save Distribution'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
