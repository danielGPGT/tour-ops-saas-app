"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ContractAllocationDialog } from '@/components/common/EditDialog'
import { ContractAllocationFormContent } from '@/components/common/ContractAllocationForm'
import { useContractAllocations, useCreateContractAllocation, useUpdateContractAllocation, useDeleteContractAllocation } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Calendar,
  AlertCircle
} from 'lucide-react'

interface ContractAllocationsSectionProps {
  contractId: string
}

export function ContractAllocationsSection({ contractId }: ContractAllocationsSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingAllocation, setEditingAllocation] = useState<any>(null)
  const [selectedAllocations, setSelectedAllocations] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [allocationToDelete, setAllocationToDelete] = useState<string | null>(null)

  const { data: allocations = [], isLoading, error } = useContractAllocations(contractId)
  const createAllocation = useCreateContractAllocation()
  const updateAllocation = useUpdateContractAllocation()
  const deleteAllocation = useDeleteContractAllocation()

  const handleEdit = (allocation: any) => {
    setEditingAllocation(allocation)
    setShowForm(true)
  }

  const handleDelete = (allocationId: string) => {
    setAllocationToDelete(allocationId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!allocationToDelete) return

    try {
      await deleteAllocation.mutateAsync(allocationToDelete)
      toast.success('Contract allocation deleted successfully')
      setDeleteDialogOpen(false)
      setAllocationToDelete(null)
    } catch (error) {
      toast.error('Failed to delete contract allocation')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingAllocation(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingAllocation) {
        await updateAllocation.mutateAsync({
          id: editingAllocation.id,
          data: { ...data, contract_id: contractId }
        })
        toast.success('Contract allocation updated successfully')
      } else {
        await createAllocation.mutateAsync({
          ...data,
          contract_id: contractId
        })
        toast.success('Contract allocation created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save contract allocation')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingAllocation(null)
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  const getDaysRange = (allocation: any) => {
    if (allocation.min_nights && allocation.max_nights) {
      return `${allocation.min_nights}-${allocation.max_nights} nights`
    } else if (allocation.min_nights) {
      return `${allocation.min_nights}+ nights`
    } else if (allocation.max_nights) {
      return `Up to ${allocation.max_nights} nights`
    }
    return 'No restrictions'
  }

  const columns = [
    {
      key: 'allocation_name',
      header: 'Allocation Name',
      render: (allocation: any) => (
        <div className="font-medium">
          {allocation.allocation_name || 'Unnamed Allocation'}
        </div>
      )
    },
    {
      key: 'product',
      header: 'Product',
      render: (allocation: any) => (
        <div>
          <div className="font-medium">{allocation.product?.name || 'Unknown Product'}</div>
          <div className="text-sm text-muted-foreground">{allocation.product?.code || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'allocation_type',
      header: 'Type',
      render: (allocation: any) => (
        <Badge variant="outline">
          {allocation.allocation_type?.replace('_', ' ').toUpperCase() || 'Unknown'}
        </Badge>
      )
    },
    {
      key: 'valid_period',
      header: 'Valid Period',
      render: (allocation: any) => (
        <div className="text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(allocation.valid_from), 'MMM dd, yyyy')} - {format(new Date(allocation.valid_to), 'MMM dd, yyyy')}
          </div>
        </div>
      )
    },
    {
      key: 'nights',
      header: 'Nights',
      render: (allocation: any) => (
        <div className="text-sm">{getDaysRange(allocation)}</div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (allocation: any) => getStatusBadge(allocation.is_active)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (allocation: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(allocation)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(allocation.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading contract allocations: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <ContractAllocationDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          // Handle save logic here
          handleFormSuccess()
        }}
        onCancel={handleFormCancel}
        isLoading={false}
        showDelete={!!editingAllocation}
        onDelete={editingAllocation ? () => handleDelete(editingAllocation.id) : undefined}
      >
        <ContractAllocationFormContent
          defaultValues={editingAllocation}
          onSubmit={handleFormSubmit}
          isLoading={createAllocation.isPending || updateAllocation.isPending}
          products={[]} // TODO: Load products from API
        />
      </ContractAllocationDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contract Allocations</h3>
          <p className="text-sm text-muted-foreground">
            Manage product allocations and inventory blocks for this contract
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Allocation
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={allocations}
        selectedItems={selectedAllocations}
        onSelectionChange={setSelectedAllocations}
        getId={(allocation) => allocation.id}
        isLoading={isLoading}
        emptyState={{
          icon: <Package className="h-8 w-8" />,
          title: 'No Contract Allocations',
          description: 'Add allocations to define product inventory blocks for this contract.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract Allocation"
        description="Are you sure you want to delete this contract allocation? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteAllocation.isPending}
      />
    </div>
  )
}
