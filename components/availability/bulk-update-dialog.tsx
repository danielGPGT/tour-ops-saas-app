'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  Lock,
  Unlock,
  Plus,
  Minus,
  Equal
} from 'lucide-react'

interface BulkUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDates: string[]
  onUpdate: (updates: BulkUpdateData) => void
}

interface BulkUpdateData {
  action: 'close' | 'open' | 'adjust_quantity' | 'set_quantity' | 'add_notes'
  quantity?: number
  adjustment?: number
  notes?: string
  closeDates?: boolean
}

export function BulkUpdateDialog({
  open,
  onOpenChange,
  selectedDates,
  onUpdate
}: BulkUpdateDialogProps) {
  const [action, setAction] = useState<string>('close')
  const [quantity, setQuantity] = useState<number>(0)
  const [adjustment, setAdjustment] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [closeDates, setCloseDates] = useState<boolean>(false)

  const handleSubmit = () => {
    const updateData: BulkUpdateData = {
      action: action as any,
      quantity: action === 'set_quantity' ? quantity : undefined,
      adjustment: action === 'adjust_quantity' ? adjustment : undefined,
      notes: action === 'add_notes' ? notes : undefined,
      closeDates: action === 'close' ? true : false
    }

    onUpdate(updateData)
    onOpenChange(false)
  }

  const getActionDescription = () => {
    switch (action) {
      case 'close':
        return 'Close selected dates for sales'
      case 'open':
        return 'Open selected dates for sales'
      case 'adjust_quantity':
        return 'Adjust quantity by a fixed amount'
      case 'set_quantity':
        return 'Set quantity to a specific value'
      case 'add_notes':
        return 'Add notes to selected dates'
      default:
        return ''
    }
  }

  const getPreviewText = () => {
    const dateCount = selectedDates.length
    const dateRange = selectedDates.length > 0 
      ? `${format(new Date(selectedDates[0]), 'MMM d')} - ${format(new Date(selectedDates[selectedDates.length - 1]), 'MMM d')}`
      : 'No dates selected'

    return `Updating ${dateCount} date${dateCount !== 1 ? 's' : ''} (${dateRange})`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Bulk Update Availability
          </DialogTitle>
          <DialogDescription>
            Update multiple dates at once. This will affect all selected dates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Dates Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Selected Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {getPreviewText()}
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.slice(0, 10).map((date) => (
                    <Badge key={date} variant="outline" className="text-xs">
                      {format(new Date(date), 'MMM d')}
                    </Badge>
                  ))}
                  {selectedDates.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedDates.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div className="space-y-4">
            <Label>Update Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="close">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Close Dates
                  </div>
                </SelectItem>
                <SelectItem value="open">
                  <div className="flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    Open Dates
                  </div>
                </SelectItem>
                <SelectItem value="adjust_quantity">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adjust Quantity
                  </div>
                </SelectItem>
                <SelectItem value="set_quantity">
                  <div className="flex items-center gap-2">
                    <Equal className="h-4 w-4" />
                    Set Quantity
                  </div>
                </SelectItem>
                <SelectItem value="add_notes">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Add Notes
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getActionDescription()}
            </p>
          </div>

          {/* Action-specific Fields */}
          {action === 'adjust_quantity' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustment">Adjustment Amount</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdjustment(prev => prev - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={adjustment}
                      onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAdjustment(prev => prev + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Positive numbers increase, negative numbers decrease
                  </p>
                </div>
                <div>
                  <Label>Preview</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="text-sm">
                      Current: 50 units
                    </div>
                    <div className="text-sm">
                      After: {50 + adjustment} units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {action === 'set_quantity' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity">Set Quantity To</Label>
                <Input
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter new quantity"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Set all selected dates to this exact quantity
                </p>
              </div>
            </div>
          )}

          {action === 'add_notes' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for these dates..."
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  These notes will be added to all selected dates
                </p>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium">Confirmation Required</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                This action will update {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''}. 
                This cannot be undone.
              </p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedDates.length === 0}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Update {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
