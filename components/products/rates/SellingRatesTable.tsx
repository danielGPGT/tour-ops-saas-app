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
  Clock,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore } from 'date-fns'
import { useUpdateSellingRate, useDeleteSellingRate, useDuplicateSellingRate } from '@/lib/hooks/useSellingRates'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'

interface SellingRatesTableProps {
  rates: any[]
  isLoading: boolean
  selectedRates: string[]
  onRateSelect: (rateId: string) => void
  onBulkSelect: (rateIds: string[]) => void
  comparison?: any[]
}

export function SellingRatesTable({ 
  rates, 
  isLoading, 
  selectedRates,
  onRateSelect,
  onBulkSelect,
  comparison = []
}: SellingRatesTableProps) {
  const updateRate = useUpdateSellingRate()
  const deleteRate = useDeleteSellingRate()
  const duplicateRate = useDuplicateSellingRate()

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
      case 'per_booking':
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
      case 'per_booking':
        return 'Per Booking'
      default:
        return basis
    }
  }

  const getMarginInfo = (rateId: string) => {
    const comp = comparison.find(c => c.selling_rate?.id === rateId)
    if (!comp || comp.margin === null) {
      return null
    }

    return {
      margin: comp.margin,
      percentage: comp.margin_percentage,
      hasSupplierRate: !!comp.supplier_rate
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
        const marginInfo = getMarginInfo(rate.id)
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-medium">{rate.rate_name}</div>
              <div className="text-sm text-muted-foreground">
                {rate.product_option?.option_name}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge className={status.color}>
                {status.label}
              </Badge>
              {marginInfo && (
                <Badge variant="outline" className={cn(
                  "text-xs",
                  marginInfo.percentage > 20 ? "text-green-600" : 
                  marginInfo.percentage > 10 ? "text-yellow-600" : 
                  "text-red-600"
                )}>
                  {marginInfo.percentage > 0 ? '+' : ''}{marginInfo.percentage.toFixed(0)}%
                </Badge>
              )}
            </div>
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
      accessorKey: 'base_price',
      header: 'Selling Price',
      cell: ({ row }) => {
        const marginInfo = getMarginInfo(row.original.id)
        
        return (
          <div className="text-right">
            <div className="font-medium">
              {row.original.currency} {row.original.base_price?.toLocaleString()}
            </div>
            {marginInfo && (
              <div className="text-xs text-muted-foreground">
                Margin: {row.original.currency} {marginInfo.margin.toLocaleString()}
              </div>
            )}
          </div>
        )
      }
    },
    {
      id: 'margin_analysis',
      header: 'Margin',
      cell: ({ row }) => {
        const marginInfo = getMarginInfo(row.original.id)
        
        if (!marginInfo) {
          return (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                No Cost Data
              </Badge>
            </div>
          )
        }
        
        return (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {marginInfo.percentage > 0 ? (
                <TrendingUp className={cn(
                  "h-3 w-3",
                  marginInfo.percentage > 20 ? "text-green-600" : 
                  marginInfo.percentage > 10 ? "text-yellow-600" : 
                  "text-red-600"
                )} />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                marginInfo.percentage > 20 ? "text-green-600" : 
                marginInfo.percentage > 10 ? "text-yellow-600" : 
                "text-red-600"
              )}>
                {marginInfo.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.currency} {marginInfo.margin.toLocaleString()}
            </div>
          </div>
        )
      }
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
      id: 'markup',
      header: 'Markup',
      cell: ({ row }) => {
        const rate = row.original
        
        if (!rate.markup_type) {
          return <span className="text-xs text-muted-foreground">None</span>
        }
        
        return (
          <div className="text-sm">
            <div className="font-medium">
              {rate.markup_type === 'percentage' ? `${rate.markup_amount}%` : 
               `${rate.currency} ${rate.markup_amount}`}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {rate.markup_type}
            </div>
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
        icon: <DollarSign className="h-8 w-8" />,
        title: "No selling rates found",
        description: "Add rates to manage customer pricing"
      }}
    />
  )
}
