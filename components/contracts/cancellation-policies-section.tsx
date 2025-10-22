"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CancellationPolicyDialog } from '@/components/common/EditDialog'
import { CancellationPolicyFormContent } from '@/components/common/DialogForm'
import { useCancellationPolicies, useCreateCancellationPolicy, useUpdateCancellationPolicy, useDeleteCancellationPolicy } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Calendar,
  AlertCircle
} from 'lucide-react'

interface CancellationPoliciesSectionProps {
  contractId: string
  currency?: string
}

export function CancellationPoliciesSection({ contractId, currency = 'USD' }: CancellationPoliciesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<any>(null)
  const [selectedPolicies, setSelectedPolicies] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [policyToDelete, setPolicyToDelete] = useState<string | null>(null)

  const { data: policies = [], isLoading, error } = useCancellationPolicies(contractId)
  const createPolicy = useCreateCancellationPolicy()
  const updatePolicy = useUpdateCancellationPolicy()
  const deletePolicy = useDeleteCancellationPolicy()

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy)
    setShowForm(true)
  }

  const handleDelete = (policyId: string) => {
    setPolicyToDelete(policyId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!policyToDelete) return

    try {
      await deletePolicy.mutateAsync(policyId)
      toast.success('Cancellation policy deleted successfully')
      setDeleteDialogOpen(false)
      setPolicyToDelete(null)
    } catch (error) {
      toast.error('Failed to delete cancellation policy')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPolicy(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingPolicy) {
        await updatePolicy.mutateAsync({
          id: editingPolicy.id,
          data: { ...data, contract_id: contractId }
        })
        toast.success('Cancellation policy updated successfully')
      } else {
        await createPolicy.mutateAsync({
          ...data,
          contract_id: contractId
        })
        toast.success('Cancellation policy created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save cancellation policy')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingPolicy(null)
  }

  const getPenaltyDisplay = (policy: any) => {
    switch (policy.penalty_type) {
      case 'none':
        return <Badge variant="outline">No Penalty</Badge>
      case 'percentage':
        return <Badge variant="secondary">{policy.penalty_percentage}%</Badge>
      case 'fixed_amount':
        return <Badge variant="secondary">{currency}{policy.penalty_amount}</Badge>
      case 'forfeit_deposit':
        return <Badge variant="destructive">Forfeit Deposit</Badge>
      case 'forfeit_all':
        return <Badge variant="destructive">Forfeit All</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getDaysRangeDisplay = (policy: any) => {
    if (policy.days_before_from && policy.days_before_to) {
      return `${policy.days_before_to}-${policy.days_before_from} days`
    } else if (policy.days_before_from) {
      return `${policy.days_before_from}+ days`
    } else if (policy.days_before_to) {
      return `0-${policy.days_before_to} days`
    }
    return 'Not specified'
  }

  const columns = [
    {
      key: 'days_range',
      header: 'Days Before',
      render: (policy: any) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-4 w-4 mr-1" />
          {getDaysRangeDisplay(policy)}
        </div>
      )
    },
    {
      key: 'penalty',
      header: 'Penalty',
      render: (policy: any) => getPenaltyDisplay(policy)
    },
    {
      key: 'applies_to',
      header: 'Applies To',
      render: (policy: any) => (
        <Badge variant="outline">
          {policy.applies_to === 'all' ? 'All Payments' : 
           policy.applies_to === 'deposit_only' ? 'Deposit Only' : 'Balance Only'}
        </Badge>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (policy: any) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {policy.description || '—'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(policy)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(policy.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <TableSkeleton rows={5} columns={5} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading cancellation policies: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <CancellationPolicyDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          // Handle save logic here
          handleFormSuccess()
        }}
        onCancel={handleFormCancel}
        isLoading={false}
        showDelete={!!editingPolicy}
        onDelete={editingPolicy ? () => handleDelete(editingPolicy.id) : undefined}
      >
        <CancellationPolicyFormContent
          defaultValues={editingPolicy}
          onSubmit={handleFormSubmit}
          isLoading={createPolicy.isPending || updatePolicy.isPending}
        />
      </CancellationPolicyDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cancellation Policies</h3>
          <p className="text-sm text-muted-foreground">
            Set cancellation terms and penalty structures
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Policy
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={policies}
        selectedItems={selectedPolicies}
        onSelectionChange={setSelectedPolicies}
        getId={(policy) => policy.id}
        isLoading={isLoading}
        emptyState={{
          icon: <AlertTriangle className="h-8 w-8" />,
          title: 'No Cancellation Policies',
          description: 'Add cancellation policies to define penalty structures for this contract.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Cancellation Policy"
        description="Are you sure you want to delete this cancellation policy? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deletePolicy.isPending}
      />
    </div>
  )
}