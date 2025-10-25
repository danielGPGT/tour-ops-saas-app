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
import { useUpdateInventoryItem, useDeleteInventoryItem } from '@/lib/hooks/useAllocationInventory'
import type { InventoryWithStats } from '@/lib/types/inventory'
import { MoreHorizontal, Edit, Trash2, Play, Package, Calendar, AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'

interface InventoryTableProps {
  inventory: InventoryWithStats[]
  allocationId: string
  isLoading?: boolean
  onEdit?: (inventory: InventoryWithStats) => void
  onGenerateAvailability?: (inventory: InventoryWithStats) => void
}

export function InventoryTable({ 
  inventory, 
  allocationId, 
  isLoading, 
  onEdit, 
  onGenerateAvailability 
}: InventoryTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inventoryToDelete, setInventoryToDelete] = useState<string | null>(null)

  const updateInventoryItem = useUpdateInventoryItem()
  const deleteInventoryItem = useDeleteInventoryItem()

  const handleDeleteClick = (inventoryId: string) => {
    setInventoryToDelete(inventoryId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (inventoryToDelete) {
      try {
        await deleteInventoryItem.mutateAsync({ 
          id: inventoryToDelete, 
          allocationId 
        })
      } catch (error: any) {
        console.error('Failed to delete inventory item:', error)
      } finally {
        setDeleteDialogOpen(false)
        setInventoryToDelete(null)
      }
    }
  }

  const handleUpdateField = async (inventoryId: string, field: string, value: any) => {
    try {
      await updateInventoryItem.mutateAsync({ 
        id: inventoryId, 
        data: { [field]: value } 
      })
    } catch (error: any) {
      console.error('Failed to update inventory item:', error)
    }
  }

  const getColumns = (): ColumnDef<InventoryWithStats>[] => [
    {
      accessorKey: 'product_option.option_name',
      header: 'Product Option',
      cell: ({ row }) => {
        const option = row.original.product_option
        const isFlexible = row.original.flexible_configuration
        const alternateOptions = row.original.alternate_options || []
        
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="font-medium">{option?.option_name} <span className="text-muted-foreground/70 text-xs">- ({option?.option_code})</span></div>
              {isFlexible && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  Flexible
                </Badge>
              )}
            </div>
            {isFlexible && alternateOptions.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-primary font-medium">
                  +{alternateOptions.length} alternate option{alternateOptions.length > 1 ? 's' : ''}:
                </div>
                <div className="space-y-0.5">
                  {alternateOptions.map((altOption) => (
                    <div key={altOption.id} className="text-muted-foreground">
                      {altOption.option_name} <span className="text-muted-foreground/70 text-xs">- ({altOption.option_code})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'product_option.product.name',
      header: 'Product',
      cell: ({ row }) => {
        const product = row.original.product_option?.product
        return (
          <div className="space-y-1">
            <div className="font-medium">{product?.name}</div>
            <div className="text-xs text-muted-foreground">
              {product?.code}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'total_quantity',
      header: 'Total Quantity',
      cell: ({ row }) => (
        <EnterpriseInlineEdit
          value={row.original.total_quantity}
          onSave={(value) => handleUpdateField(row.original.id, 'total_quantity', value)}
          field="total_quantity"
          type="number"
        />
      ),
    },
    {
      accessorKey: 'flexible_configuration',
      header: 'Flexible',
      cell: ({ row }) => (
        <Switch
          checked={row.original.flexible_configuration}
          onCheckedChange={(checked) => 
            handleUpdateField(row.original.id, 'flexible_configuration', checked)
          }
        />
      ),
    },
    {
      accessorKey: 'min_quantity_per_booking',
      header: 'Min/Booking',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div>Min: {row.original.min_quantity_per_booking}</div>
          {row.original.max_quantity_per_booking && (
            <div>Max: {row.original.max_quantity_per_booking}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'availability_generated',
      header: 'Availability',
      cell: ({ row }) => (
        <StatusBadge 
          status={row.original.availability_generated ? 'active' : 'inactive'} 
        />
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const inventory = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(inventory)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!inventory.availability_generated && (
                <DropdownMenuItem onClick={() => onGenerateAvailability?.(inventory)}>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Availability
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => handleDeleteClick(inventory.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: inventory,
    columns: getColumns(),
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
    return <div className="h-64 w-full animate-pulse rounded-lg bg-gray-100" />
  }

  if (inventory.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No Inventory Configured"
        description="Add product options to configure inventory for this allocation."
        buttonText="Add Inventory"
        onButtonClick={() => {/* This will be handled by the parent component */}}
      />
    )
  }

  return (
    <>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={getColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirm Deletion"
        description="Are you sure you want to delete this inventory item? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  )
}