'use client'

import { ProductComboBox } from '@/components/contracts/product-combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface AllocationFormProps {
  allocation: any
  onUpdate: (field: string, value: any) => void
}

export function AllocationForm({ allocation, onUpdate }: AllocationFormProps) {
  
  const calculateCostPerUnit = () => {
    if (allocation.total_cost && allocation.total_quantity) {
      return allocation.total_cost / allocation.total_quantity
    }
    return 0
  }

  const handleCostChange = (field: 'total_cost' | 'cost_per_unit', value: number) => {
    onUpdate(field, value)
    
    if (field === 'total_cost' && allocation.total_quantity) {
      onUpdate('cost_per_unit', value / allocation.total_quantity)
    } else if (field === 'cost_per_unit' && allocation.total_quantity) {
      onUpdate('total_cost', value * allocation.total_quantity)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="product_id" className="text-sm">Product *</Label>
          <ProductComboBox
            value={allocation.product_id || ''}
            onValueChange={(value) => onUpdate('product_id', value)}
            placeholder="Search product..."
            className="w-full"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="allocation_type" className="text-sm">Type</Label>
          <Select 
            value={allocation.allocation_type || 'allotment'} 
            onValueChange={(value) => onUpdate('allocation_type', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allotment">Allotment</SelectItem>
              <SelectItem value="batch">Batch Purchase</SelectItem>
              <SelectItem value="free_sell">Free Sell</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="allocation_name" className="text-sm">Name</Label>
        <Input
          id="allocation_name"
          className="w-full"
          value={allocation.allocation_name || ''}
          onChange={(e) => onUpdate('allocation_name', e.target.value)}
          placeholder="e.g., F1 Singapore 2025 - Standard Rooms"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="total_quantity" className="text-sm">Quantity *</Label>
          <Input
            id="total_quantity"
            type="number"
            className="w-full"
            value={allocation.total_quantity || ''}
            onChange={(e) => onUpdate('total_quantity', parseInt(e.target.value) || 0)}
            placeholder="30"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="valid_from" className="text-sm">Valid From</Label>
          <Input
            id="valid_from"
            type="date"
            className="w-full"
            value={allocation.valid_from || ''}
            onChange={(e) => onUpdate('valid_from', e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="valid_to" className="text-sm">Valid To</Label>
          <Input
            id="valid_to"
            type="date"
            className="w-full"
            value={allocation.valid_to || ''}
            onChange={(e) => onUpdate('valid_to', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="min_nights" className="text-sm">Min Nights</Label>
          <Input
            id="min_nights"
            type="number"
            className="w-full"
            value={allocation.min_nights || ''}
            onChange={(e) => onUpdate('min_nights', parseInt(e.target.value) || null)}
            placeholder="1"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="max_nights" className="text-sm">Max Nights</Label>
          <Input
            id="max_nights"
            type="number"
            className="w-full"
            value={allocation.max_nights || ''}
            onChange={(e) => onUpdate('max_nights', parseInt(e.target.value) || null)}
            placeholder="7"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="total_cost" className="text-sm">Total Cost</Label>
          <Input
            id="total_cost"
            type="number"
            className="w-full"
            value={allocation.total_cost || ''}
            onChange={(e) => handleCostChange('total_cost', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="cost_per_unit" className="text-sm">Cost Per Unit</Label>
        <Input
          id="cost_per_unit"
          type="number"
          className="w-full"
          value={allocation.cost_per_unit || calculateCostPerUnit()}
          onChange={(e) => handleCostChange('cost_per_unit', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Auto-calculated from total cost ÷ quantity
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes" className="text-sm">Notes</Label>
        <Textarea
          id="notes"
          className="w-full"
          value={allocation.notes || ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
          placeholder="Any additional notes about this allocation..."
          rows={2}
        />
      </div>
    </div>
  )
}
