'use client'

import React from 'react'
import { useContractAllocations } from '@/lib/hooks/useContracts'
import { DataTable } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Edit, Package, Calendar, XCircle } from 'lucide-react'
import { differenceInDays, subDays, format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

interface AllocationsTableProps {
  contractId: string
  onSelect?: (allocationId: string) => void
}

interface AllocationWithCalculations {
  id: string
  allocation_name: string
  product?: { name: string }
  allocation_type: string
  total_quantity: number
  sold_quantity: number
  valid_from: string
  valid_to: string
  total_cost?: number
  cost_per_unit?: number
  currency: string
  release_days?: number
  // Calculated fields
  available_quantity: number
  utilization_percentage: number
  days_span: number
  release_date?: Date
  days_until_release?: number
  is_release_urgent: boolean
  is_release_warning: boolean
  is_release_past: boolean
}

export function AllocationsTable({ contractId, onSelect }: AllocationsTableProps) {
  const { data: allocations, isLoading } = useContractAllocations(contractId)

  // Process allocations to add calculated fields
  const processedAllocations: AllocationWithCalculations[] = React.useMemo(() => {
    if (!allocations) return []

    return allocations.map(allocation => {
      const soldQuantity = allocation.sold_quantity || 0
      const totalQuantity = allocation.total_quantity || 0
      const availableQuantity = totalQuantity - soldQuantity
      const utilizationPercentage = totalQuantity > 0 ? (soldQuantity / totalQuantity) * 100 : 0
      
      const validFrom = new Date(allocation.valid_from)
      const validTo = new Date(allocation.valid_to)
      const daysSpan = differenceInDays(validTo, validFrom)

      let releaseDate: Date | undefined
      let daysUntilRelease: number | undefined
      let isReleaseUrgent = false
      let isReleaseWarning = false
      let isReleasePast = false

      if (allocation.release_days && allocation.valid_from) {
        releaseDate = subDays(validFrom, allocation.release_days)
        daysUntilRelease = differenceInDays(releaseDate, new Date())
        isReleasePast = daysUntilRelease < 0
        isReleaseUrgent = daysUntilRelease > 0 && daysUntilRelease <= 7
        isReleaseWarning = daysUntilRelease > 7 && daysUntilRelease <= 30
      }

      return {
        ...allocation,
        available_quantity: availableQuantity,
        utilization_percentage: utilizationPercentage,
        days_span: daysSpan,
        release_date: releaseDate,
        days_until_release: daysUntilRelease,
        is_release_urgent: isReleaseUrgent,
        is_release_warning: isReleaseWarning,
        is_release_past: isReleasePast
      }
    })
  }, [allocations])

  const columns: ColumnDef<AllocationWithCalculations>[] = [
    {
      accessorKey: 'allocation_name',
      header: 'Allocation',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant={
            row.original.allocation_type === 'committed' ? 'default' :
            row.original.allocation_type === 'on_request' ? 'secondary' : 'outline'
          }>
            {row.original.allocation_type}
          </Badge>
          <div>
            <div className="font-medium">{row.original.allocation_name}</div>
            {row.original.product?.name && (
              <div className="text-sm text-muted-foreground">
                {row.original.product.name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'period',
      header: 'Valid Period',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{format(new Date(row.original.valid_from), 'MMM d, yyyy')}</div>
          <div className="text-muted-foreground">
            to {format(new Date(row.original.valid_to), 'MMM d, yyyy')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {row.original.days_span} days
          </div>
        </div>
      )
    },
    {
      id: 'utilization',
      header: 'Utilization',
      cell: ({ row }) => {
        const { total_quantity, sold_quantity, available_quantity, utilization_percentage } = row.original
        
        return (
          <div className="space-y-1 min-w-[120px]">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium">{total_quantity}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">{sold_quantity}</div>
                <div className="text-xs text-muted-foreground">Sold</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{available_quantity}</div>
                <div className="text-xs text-muted-foreground">Avail</div>
              </div>
            </div>
            <Progress value={utilization_percentage} className="h-2" />
            <div className="text-xs text-center text-muted-foreground">
              {utilization_percentage.toFixed(0)}% utilized
            </div>
          </div>
        )
      }
    },
    {
      id: 'cost',
      header: 'Cost',
      cell: ({ row }) => {
        const { currency, total_cost, cost_per_unit } = row.original
        
        return (
          <div className="text-right">
            {total_cost && (
              <div className="font-medium">
                {currency} {total_cost.toLocaleString()}
              </div>
            )}
            {cost_per_unit && (
              <div className="text-sm text-muted-foreground">
                {currency} {cost_per_unit.toLocaleString()}/unit
              </div>
            )}
            {!total_cost && !cost_per_unit && (
              <span className="text-sm text-muted-foreground">No cost data</span>
            )}
          </div>
        )
      }
    },
    {
      id: 'release',
      header: 'Release',
      cell: ({ row }) => {
        const { 
          release_date, 
          days_until_release, 
          is_release_past, 
          is_release_urgent, 
          is_release_warning 
        } = row.original

        if (!release_date) {
          return <span className="text-sm text-muted-foreground">No deadline</span>
        }
        
        return (
          <div className="text-sm space-y-1">
            <div className={cn(
              is_release_past && "text-muted-foreground line-through",
              is_release_urgent && "text-destructive font-medium",
              is_release_warning && "text-orange-600"
            )}>
              {format(release_date, 'MMM d, yyyy')}
            </div>
            {!is_release_past && days_until_release !== undefined && (
              <Badge 
                variant={
                  is_release_urgent ? 'destructive' : 
                  is_release_warning ? 'secondary' : 'outline'
                }
                className={cn(
                  "text-xs",
                  is_release_urgent && "animate-pulse"
                )}
              >
                {days_until_release} day{days_until_release !== 1 ? 's' : ''}
              </Badge>
            )}
            {is_release_past && (
              <Badge variant="outline" className="text-xs">
                Expired
              </Badge>
            )}
          </div>
        )
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelect?.(row.original.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Edit allocation', row.original.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('Manage inventory', row.original.id)}>
              <Package className="h-4 w-4 mr-2" />
              Manage Inventory
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => console.log('View availability', row.original.id)}>
              <Calendar className="h-4 w-4 mr-2" />
              Availability
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => console.log('Deactivate', row.original.id)} className="text-destructive">
              <XCircle className="h-4 w-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={processedAllocations}
      searchKey="allocation_name"
      isLoading={isLoading}
      filterOptions={[
        {
          key: 'allocation_type',
          label: 'Type',
          options: [
            { label: 'Committed', value: 'committed' },
            { label: 'On Request', value: 'on_request' },
            { label: 'Free Sale', value: 'free_sale' }
          ]
        }
      ]}
      onRowClick={(row) => onSelect?.(row.id)}
    />
  )
}
