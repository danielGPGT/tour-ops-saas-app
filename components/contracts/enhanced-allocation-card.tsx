'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, ChevronDown, ChevronUp, Package, DollarSign, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ReleaseScheduleSection } from './release-schedule-section'
import { InventoryTrackingSection } from './inventory-tracking-section'
import { cn } from '@/lib/utils'

interface EnhancedAllocationCardProps {
  allocation: any
  onEdit?: (allocation: any) => void
  onDelete?: (allocationId: string) => void
}

export function EnhancedAllocationCard({ allocation, onEdit, onDelete }: EnhancedAllocationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getAllocationTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      'allotment': 'default',
      'batch': 'secondary',
      'free_sell': 'success',
      'on_request': 'warning'
    }
    
    return (
      <Badge variant={variants[type] || 'outline'}>
        {type?.replace('_', ' ').toUpperCase() || 'Unknown'}
      </Badge>
    )
  }

  return (
    <Card className="border hover:border-primary/50 transition-colors">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-1.5 mb-0.5 text-base">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{allocation.allocation_name || 'Unnamed Allocation'}</span>
              {getAllocationTypeBadge(allocation.allocation_type)}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-0.5">
                <DollarSign className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">{allocation.cost_per_unit || 'N/A'}</span>
                <span>{allocation.currency}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap text-xs">
                  {format(new Date(allocation.valid_from), 'MMM dd')} - {format(new Date(allocation.valid_to), 'MMM dd, yyyy')}
                </span>
              </div>
              {allocation.total_quantity && (
                <div>
                  <span className="font-medium">{allocation.total_quantity}</span> units
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2 pt-0">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-muted/50 rounded">
            <div>
              <p className="text-[10px] text-muted-foreground mb-0">Quantity</p>
              <p className="text-base font-bold">{allocation.total_quantity || '∞'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0">Cost/Unit</p>
              <p className="text-sm font-bold leading-tight">
                {allocation.cost_per_unit || 'N/A'} {allocation.currency}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0">Total Cost</p>
              <p className="text-sm font-bold leading-tight">
                {allocation.total_cost || 'N/A'} {allocation.currency}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-0">Release Days</p>
              <p className="text-base font-bold">{allocation.release_days || 'N/A'}</p>
            </div>
          </div>

          {/* Release Schedule */}
          <ReleaseScheduleSection allocationId={allocation.id} />

          {/* Inventory Tracking */}
          <InventoryTrackingSection allocationId={allocation.id} />

          {/* Actions */}
          <div className="flex justify-end gap-1.5 pt-1 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(allocation)
              }}
              className="h-7 px-2 text-xs"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(allocation.id)
              }}
              className="h-7 px-2 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
