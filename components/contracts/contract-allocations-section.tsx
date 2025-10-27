"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EnhancedAllocationCard } from './enhanced-allocation-card'
import { useContractAllocations, useDeleteContractAllocation } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { Plus, Package } from 'lucide-react'

interface ContractAllocationsSectionProps {
  contractId: string
}

export function ContractAllocationsSection({ contractId }: ContractAllocationsSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [allocationToDelete, setAllocationToDelete] = useState<string | null>(null)

  const { data: allocations = [], isLoading } = useContractAllocations(contractId)
  const deleteAllocation = useDeleteContractAllocation()

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

  const handleEdit = (allocation: any) => {
    toast.info('Edit functionality coming soon')
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Allocations ({allocations.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage product allocations, release schedules, and inventory tracking
          </p>
        </div>
        <Button onClick={() => toast.info('Add allocation functionality coming soon')} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Allocation
        </Button>
      </div>

      {allocations.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          title="No Allocations"
          description="Add allocations to define product inventory blocks for this contract"
          action={
            <Button onClick={() => toast.info('Add allocation functionality coming soon')}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Allocation
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {allocations.map((allocation) => (
            <EnhancedAllocationCard
              key={allocation.id}
              allocation={allocation}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Allocation"
        description="Are you sure you want to delete this allocation? This will also remove all associated releases and inventory."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}
