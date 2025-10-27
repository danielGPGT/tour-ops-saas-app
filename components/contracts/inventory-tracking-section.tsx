'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAllocationInventory } from '@/lib/hooks/useContracts'
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp
} from 'lucide-react'

interface InventoryTrackingSectionProps {
  allocationId: string
}

export function InventoryTrackingSection({ allocationId }: InventoryTrackingSectionProps) {
  const { data: inventory = [], isLoading } = useAllocationInventory(allocationId)

  if (isLoading) {
    return (
      <div className="py-1">
        <div className="text-xs font-semibold mb-1">Inventory Status</div>
        <div className="text-[10px] text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="py-1">
      <div className="text-sm font-semibold mb-1">Inventory Status</div>
      {inventory.length === 0 ? (
        <div className="text-center py-2">
          <Package className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">No inventory</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {inventory.map((inv) => {
            const soldPercentage = inv.total_quantity > 0 
              ? (inv.sold_quantity / inv.total_quantity) * 100 
              : 0
            
            const isLowStock = inv.available_quantity < 3 && inv.available_quantity > 0
            const isSoldOut = inv.available_quantity === 0

            return (
              <div key={inv.id} className="border rounded p-1.5">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h4 className="font-semibold text-xs">
                      {inv.product_option?.option_name || 'Product Option'}
                    </h4>
                    {inv.product_option?.option_code && (
                      <p className="text-[10px] text-muted-foreground">
                        Code: {inv.product_option.option_code}
                      </p>
                    )}
                    {inv.is_virtual_capacity && (
                      <Badge variant="secondary" className="mt-0 h-3.5 px-1 text-[10px]">
                        Virtual
                      </Badge>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  {isSoldOut ? (
                    <Badge variant="destructive" className="gap-0 h-5 px-1.5 text-[10px]">
                      <XCircle className="h-2.5 w-2.5" />
                      Sold Out
                    </Badge>
                  ) : isLowStock ? (
                    <Badge variant="secondary" className="gap-0 h-5 px-1.5 text-[10px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-0 h-5 px-1.5 text-[10px] bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20">
                      <CheckCircle className="h-2.5 w-2.5" />
                      Available
                    </Badge>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-1.5 mb-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="text-base font-bold">{inv.total_quantity}</p>
                  </div>
                  <div className={isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                    <p className="text-[10px] text-muted-foreground">Available</p>
                    <p className="text-base font-bold flex items-center gap-0">
                      {inv.available_quantity}
                      {!isSoldOut && !isLowStock && (
                        <TrendingUp className="h-3 w-3" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Sold</p>
                    <p className="text-base font-bold">{inv.sold_quantity}</p>
                    <p className="text-[10px] text-muted-foreground">
                      ({soldPercentage.toFixed(0)}%)
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span>{inv.total_quantity}</span>
                  </div>
                  <Progress 
                    value={soldPercentage} 
                    className="h-1.5"
                  />
                </div>

                {/* Warnings */}
                {isLowStock && (
                  <div className="mt-1 p-1.5 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                    <div className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0 shrink-0" />
                      <p className="text-yellow-900 dark:text-yellow-100">
                        ⚠️ Low stock - only <strong>{inv.available_quantity}</strong> remaining
                      </p>
                    </div>
                  </div>
                )}

                {isSoldOut && (
                  <div className="mt-1 p-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs">
                    <div className="flex items-start gap-1">
                      <XCircle className="h-3 w-3 text-red-600 mt-0 shrink-0" />
                      <p className="text-red-900 dark:text-red-100">
                        ❌ Sold out - no inventory available
                      </p>
                    </div>
                  </div>
                )}

                {/* Cost Info */}
                {inv.batch_cost_per_unit && (
                  <div className="mt-1 pt-1 border-t">
                    <p className="text-[10px] text-muted-foreground">
                      Cost per unit: {inv.batch_cost_per_unit} {inv.currency}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
