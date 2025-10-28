'use client'

import React from 'react'
import { DataTable } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore } from 'date-fns'
import { useUpdateSupplierRate, useDeleteSupplierRate, useDuplicateSupplierRate } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

interface SupplierRatesTableProps {
  rates: any[]
  isLoading: boolean
  selectedRates: string[]
  onRateSelect: (rateId: string) => void
  onBulkSelect: (rateIds: string[]) => void
}

export function SupplierRatesTable({ 
  rates, 
  isLoading, 
  selectedRates,
  onRateSelect,
  onBulkSelect 
}: SupplierRatesTableProps) {
  const updateRate = useUpdateSupplierRate()
  const deleteRate = useDeleteSupplierRate()
  const duplicateRate = useDuplicateSupplierRate()

  const handleToggleStatus = async (rateId: string, currentStatus: boolean) => {
    try {
      await updateRate.mutateAsync({
        id: rateId,
        updates: { is_active: !currentStatus }
      })
      toast.success(`Rate ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update rate status')
    }
  }

  const handleDelete = async (rateId: string, rateName: string) => {
    if (!confirm(`Are you sure you want to delete "${rateName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteRate.mutateAsync(rateId)
      toast.success('Rate deleted successfully')
    } catch (error) {
      toast.error('Failed to delete rate')
    }
  }

  const handleDuplicate = async (rateId: string, rateName: string) => {
    try {
      const currentDate = new Date()
      const nextYear = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), currentDate.getDate())
      
      await duplicateRate.mutateAsync({
        id: rateId,
        updates: {
          rate_name: `${rateName} (Copy)`,
          valid_from: format(currentDate, 'yyyy-MM-dd'),
          valid_to: format(nextYear, 'yyyy-MM-dd')
        }
      })
      toast.success('Rate duplicated successfully')
    } catch (error) {
      toast.error('Failed to duplicate rate')
    }
  }

  const getRateStatus = (rate: any) => {
    const now = new Date()
    const validFrom = parseISO(rate.valid_from)
    const validTo = parseISO(rate.valid_to)

    if (!rate.is_active) {
      return { status: 'inactive', color: 'bg-gray-100 text-gray-600', label: 'Inactive' }
    }

    if (isAfter(now, validTo)) {
      return { status: 'expired', color: 'bg-red-100 text-red-600', label: 'Expired' }
    }

    if (isBefore(now, validFrom)) {
      return { status: 'future', color: 'bg-blue-100 text-blue-600', label: 'Future' }
    }

    return { status: 'active', color: 'bg-green-100 text-green-600', label: 'Active' }
  }

  const getRateBasisIcon = (basis: string) => {
    switch (basis) {
      case 'per_night':
        return <Calendar className="h-3 w-3" />
      case 'per_person':
        return <Package className="h-3 w-3" />
      case 'per_unit':
        return <DollarSign className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  const getRateBasisLabel = (basis: string) => {
    switch (basis) {
      case 'per_night':
        return 'Per Night'
      case 'per_person':
        return 'Per Person'
      case 'per_unit':
        return 'Per Unit'
      default:
        return basis
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (value) {
              onBulkSelect(rates.map(r => r.id))
            } else {
              onBulkSelect([])
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedRates.includes(row.original.id)}
          onCheckedChange={(value) => {
            if (value) {
              onBulkSelect([...selectedRates, row.original.id])
            } else {
              onBulkSelect(selectedRates.filter(id => id !== row.original.id))
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'rate_name',
      header: 'Rate Name',
      cell: ({ row }) => {
        const rate = row.original
        const status = getRateStatus(rate)
        
        return (
          <div className="flex items-center gap-2">
            <div>
              <div className="font-medium">{rate.rate_name}</div>
              <div className="text-sm text-muted-foreground">
                {rate.product?.name}
                {rate.product_option && (
                  <span> • {rate.product_option.option_name}</span>
                )}
              </div>
            </div>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </div>
        )
      }
    },
    {
      accessorKey: 'rate_basis',
      header: 'Rate Type',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getRateBasisIcon(row.original.rate_basis)}
          <span className="text-sm">{getRateBasisLabel(row.original.rate_basis)}</span>
        </div>
      )
    },
    {
      accessorKey: 'base_cost',
      header: 'Cost',
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.currency} {row.original.base_cost?.toLocaleString()}
        </div>
      )
    },
    {
      id: 'validity',
      header: 'Valid Period',
      cell: ({ row }) => {
        const rate = row.original
        const validFrom = parseISO(rate.valid_from)
        const validTo = parseISO(rate.valid_to)
        
        return (
          <div className="text-sm">
            <div>{format(validFrom, 'MMM d, yyyy')}</div>
            <div className="text-muted-foreground">
              to {format(validTo, 'MMM d, yyyy')}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.supplier?.name || 'N/A'}
          {row.original.supplier?.code && (
            <div className="text-xs text-muted-foreground">
              {row.original.supplier.code}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'complex_pricing',
      header: 'Pricing',
      cell: ({ row }) => {
        const hasPricingDetails = row.original.pricing_details && 
          Object.keys(row.original.pricing_details).length > 0
        
        return (
          <div className="flex items-center gap-2">
            {hasPricingDetails ? (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Complex
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Simple
              </Badge>
            )}
          </div>
        )
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const rate = row.original
        const status = getRateStatus(rate)
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem onClick={() => onRateSelect(rate.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Edit rate', rate.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Rate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(rate.id, rate.rate_name)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleToggleStatus(rate.id, rate.is_active)}>
                {rate.is_active ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(rate.id, rate.rate_name)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={rates}
      searchKey="rate_name"
      isLoading={isLoading}
      onRowClick={(row) => onRateSelect(row.id)}
      getId={(rate) => rate.id}
      emptyState={{
        icon: <Package className="h-8 w-8" />,
        title: "No supplier rates found",
        description: "Add rates to manage supplier pricing"
      }}
    />
  )
}
