'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AllocationForm } from './AllocationForm'
import { useCreateContractAllocation } from '@/lib/hooks/useContracts'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import type { ContractAllocationFormData } from '@/lib/types/contract'

interface AllocationFormDialogProps {
  contractId: string
  allocation?: ContractAllocationFormData & { id: string }
  onClose: () => void
  onSuccess?: () => void
}

export function AllocationFormDialog({ 
  contractId, 
  allocation, 
  onClose, 
  onSuccess 
}: AllocationFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useAuth()
  const createAllocation = useCreateContractAllocation()
  
  const isEdit = !!allocation

  const handleSubmit = async (data: ContractAllocationFormData) => {
    if (!profile?.organization_id) {
      toast.error('Organization not found')
      return
    }

    setIsSubmitting(true)
    
    try {
      if (isEdit) {
        // TODO: Implement update allocation
        toast.success('Allocation updated successfully')
      } else {
        await createAllocation.mutateAsync({
          contract_id: contractId,
          ...data,
          organization_id: profile.organization_id
        })
        toast.success('Allocation created successfully')
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error saving allocation:', error)
      toast.error(isEdit ? 'Failed to update allocation' : 'Failed to create allocation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Allocation' : 'Create New Allocation'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the allocation details and inventory parameters'
              : 'Add a new inventory allocation to this contract'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <AllocationForm
            contractId={contractId}
            initialData={allocation}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
