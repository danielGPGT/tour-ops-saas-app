'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUpdateAllocation, useDeleteAllocation } from '@/lib/hooks/useAllocations'
import type { ContractAllocation } from '@/lib/types/allocation'
import { 
  MoreHorizontal, 
  ExternalLink, 
  Package, 
  Calendar, 
  DollarSign,
  Building,
  FileText,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface SimplifiedAllocationsTableProps {
  allocations: ContractAllocation[]
  isLoading?: boolean
  onEdit?: (allocation: ContractAllocation) => void
}

export function SimplifiedAllocationsTable({ allocations, isLoading, onEdit }: SimplifiedAllocationsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const updateAllocation = useUpdateAllocation()
  const deleteAllocation = useDeleteAllocation()

  const handleUpdateField = async (id: string, field: string, value: any) => {
    try {
      await updateAllocation.mutateAsync({ id, data: { [field]: value } })
    } catch (error) {
      console.error('Failed to update allocation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      try {
        await deleteAllocation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete allocation:', error)
      }
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchased_inventory': return <Package className="h-4 w-4" />
      case 'hotel_allocation': return <Calendar className="h-4 w-4" />
      case 'on_request': return <FileText className="h-4 w-4" />
      case 'unlimited': return <Info className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchased_inventory': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'hotel_allocation': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'on_request': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'unlimited': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const columns: ColumnDef<ContractAllocation>[] = [
    {
      accessorKey: 'allocation_name',
      header: 'Allocation',
      cell: ({ row }) => {
        const allocation = row.original
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getTypeIcon(allocation.allocation_type)}
              <span className="font-medium">{allocation.allocation_name}</span>
              <Badge className={getTypeColor(allocation.allocation_type)}>
                {allocation.allocation_type.replace('_', ' ')}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {allocation.supplier?.name} • {allocation.product?.name}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'allocation_type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('allocation_type') as string
        return (
          <Badge className={getTypeColor(type)}>
            {type.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'inventory_info',
      header: 'Inventory',
      cell: ({ row }) => {
        const allocation = row.original
        
        if (allocation.allocation_type === 'purchased_inventory') {
          const available = allocation.available_quantity || 0
          const total = allocation.total_quantity || 0
          const sold = allocation.sold_quantity || 0
          const percentage = total > 0 ? Math.round((sold / total) * 100) : 0
          
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{available} available</span>
                <Badge variant={percentage > 80 ? 'destructive' : percentage > 50 ? 'warning' : 'secondary'}>
                  {percentage}% sold
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {sold} sold of {total} total
              </div>
            </div>
          )
        }
        
        if (allocation.allocation_type === 'hotel_allocation') {
          return (
            <div className="text-sm text-muted-foreground">
              Complex inventory
            </div>
          )
        }
        
        if (allocation.allocation_type === 'on_request') {
          return (
            <div className="text-sm text-muted-foreground">
              No inventory tracking
            </div>
          )
        }
        
        if (allocation.allocation_type === 'unlimited') {
          return (
            <div className="text-sm text-muted-foreground">
              Always available
            </div>
          )
        }
        
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: 'cost_info',
      header: 'Cost',
      cell: ({ row }) => {
        const allocation = row.original
        
        if (allocation.allocation_type === 'purchased_inventory' && allocation.cost_per_unit) {
          return (
            <div className="space-y-1">
              <div className="font-medium">
                {allocation.currency} {allocation.cost_per_unit.toLocaleString()}
              </div>
              {allocation.total_cost && (
                <div className="text-sm text-muted-foreground">
                  Total: {allocation.currency} {allocation.total_cost.toLocaleString()}
                </div>
              )}
            </div>
          )
        }
        
        return <span className="text-muted-foreground">-</span>
      },
    },
    {
      accessorKey: 'valid_from',
      header: 'Valid Period',
      cell: ({ row }) => {
        const allocation = row.original
        const from = format(new Date(allocation.valid_from), 'MMM dd, yyyy')
        const to = format(new Date(allocation.valid_to), 'MMM dd, yyyy')
        
        const isExpired = new Date(allocation.valid_to) < new Date()
        const isExpiringSoon = new Date(allocation.valid_to) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {from} - {to}
            </div>
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                Expired
              </Badge>
            )}
            {!isExpired && isExpiringSoon && (
              <Badge variant="warning" className="text-xs">
                Expiring Soon
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('is_active') as boolean
        return (
          <Switch
            checked={isActive}
            onCheckedChange={(checked) => 
              handleUpdateField(row.original.id, 'is_active', checked)
            }
          />
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const allocation = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/allocations/${allocation.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(allocation)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleDelete(allocation.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: allocations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search allocations..."
          value={(table.getColumn('allocation_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('allocation_name')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No allocations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

