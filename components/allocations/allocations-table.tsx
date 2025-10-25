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
import { EnterpriseInlineEdit } from '@/components/common/EnterpriseInlineEdit'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useUpdateAllocation, useDeleteAllocation } from '@/lib/hooks/useAllocations'
import type { ContractAllocation } from '@/lib/types/allocation'
import { MoreHorizontal, ExternalLink, Package, Calendar, Settings } from 'lucide-react'

interface AllocationsTableProps {
  allocations: ContractAllocation[]
  isLoading?: boolean
  onEdit?: (allocation: ContractAllocation) => void
}

export function AllocationsTable({ allocations, isLoading, onEdit }: AllocationsTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const updateAllocation = useUpdateAllocation()
  const deleteAllocation = useDeleteAllocation()

  const handleStatusToggle = async (allocation: ContractAllocation) => {
    await updateAllocation.mutateAsync({
      id: allocation.id,
      data: { is_active: !allocation.is_active }
    })
  }

  const handleDelete = async (allocation: ContractAllocation) => {
    if (confirm('Are you sure you want to delete this allocation?')) {
      await deleteAllocation.mutateAsync({
        id: allocation.id,
        contractId: allocation.contract_id
      })
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'allotment': return 'bg-blue-100 text-blue-800'
      case 'free_sell': return 'bg-green-100 text-green-800'
      case 'on_request': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateRange = (from: string, to: string) => {
    const fromDate = format(new Date(from), 'MMM d')
    const toDate = format(new Date(to), 'MMM d, yyyy')
    return `${fromDate} - ${toDate}`
  }

  const columns: ColumnDef<ContractAllocation>[] = [
    {
      accessorKey: 'allocation_code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="font-mono text-sm font-medium">
          {row.getValue('allocation_code')}
        </div>
      ),
    },
    {
      accessorKey: 'allocation_name',
      header: 'Allocation Name',
      cell: ({ row }) => (
        <EnterpriseInlineEdit
          value={row.getValue('allocation_name')}
          onSave={(value) => updateAllocation.mutateAsync({
            id: row.original.id,
            data: { allocation_name: value }
          })}
          className="font-medium"
        />
      ),
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original.product
        return (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{product?.name}</div>
              <div className="text-sm text-muted-foreground">{product?.code}</div>
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
            {type.replace('_', ' ').toUpperCase()}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'valid_from',
      header: 'Valid Period',
      cell: ({ row }) => {
        const from = row.getValue('valid_from') as string
        const to = row.original.valid_to
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {formatDateRange(from, to)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'release_days',
      header: 'Release',
      cell: ({ row }) => {
        const days = row.getValue('release_days') as number
        return (
          <div className="text-sm">
            {days === 0 ? 'Immediate' : `${days} days`}
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
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={() => handleStatusToggle(row.original)}
              disabled={updateAllocation.isPending}
            />
            <StatusBadge status={isActive ? 'active' : 'inactive'} />
          </div>
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
              <DropdownMenuItem
                onClick={() => router.push(`/allocations/${allocation.id}`)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/allocations/${allocation.id}/inventory`)}
              >
                <Package className="mr-2 h-4 w-4" />
                Setup Inventory
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(`/allocations/${allocation.id}/availability`)}
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Availability
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(allocation)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(allocation)}
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
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No allocations yet</h3>
        <p className="mt-2 text-muted-foreground">
          Create your first allocation to start managing inventory.
        </p>
      </div>
    )
  }

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
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/allocations/${row.original.id}`)}
                >
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
