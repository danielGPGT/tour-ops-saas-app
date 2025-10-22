"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CommissionTierDialog } from '@/components/common/EditDialog'
import { CommissionTierFormContent } from '@/components/common/CommissionTierForm'
import { useCommissionTiers, useCreateCommissionTier, useUpdateCommissionTier, useDeleteCommissionTier } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp, 
  DollarSign,
  AlertCircle
} from 'lucide-react'

interface CommissionTiersSectionProps {
  contractId: string
}

export function CommissionTiersSection({ contractId }: CommissionTiersSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingTier, setEditingTier] = useState<any>(null)
  const [selectedTiers, setSelectedTiers] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tierToDelete, setTierToDelete] = useState<string | null>(null)

  const { data: tiers = [], isLoading, error } = useCommissionTiers(contractId)
  const createTier = useCreateCommissionTier()
  const updateTier = useUpdateCommissionTier()
  const deleteTier = useDeleteCommissionTier()

  const handleEdit = (tier: any) => {
    setEditingTier(tier)
    setShowForm(true)
  }

  const handleDelete = (tierId: string) => {
    setTierToDelete(tierId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!tierToDelete) return

    try {
      await deleteTier.mutateAsync(tierToDelete)
      toast.success('Commission tier deleted successfully')
      setDeleteDialogOpen(false)
      setTierToDelete(null)
    } catch (error) {
      toast.error('Failed to delete commission tier')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingTier(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingTier) {
        await updateTier.mutateAsync({
          id: editingTier.id,
          data: { ...data, contract_id: contractId }
        })
        toast.success('Commission tier updated successfully')
      } else {
        await createTier.mutateAsync({
          ...data,
          contract_id: contractId
        })
        toast.success('Commission tier created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save commission tier')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingTier(null)
  }

  const getRevenueRangeDisplay = (tier: any) => {
    if (tier.revenue_to) {
      return `$${tier.revenue_from.toLocaleString()} - $${tier.revenue_to.toLocaleString()}`
    } else {
      return `$${tier.revenue_from.toLocaleString()}+`
    }
  }

  const columns = [
    {
      key: 'revenue_range',
      header: 'Revenue Range',
      render: (tier: any) => (
        <div className="font-medium">{getRevenueRangeDisplay(tier)}</div>
      )
    },
    {
      key: 'commission_rate',
      header: 'Commission Rate',
      render: (tier: any) => (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          {tier.commission_rate}%
        </Badge>
      )
    },
    {
      key: 'sort_order',
      header: 'Priority',
      render: (tier: any) => (
        <div className="text-sm text-muted-foreground">
          Priority {tier.sort_order + 1}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tier: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(tier)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(tier.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <TableSkeleton rows={5} columns={4} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading commission tiers: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <CommissionTierDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          // Handle save logic here
          handleFormSuccess()
        }}
        onCancel={handleFormCancel}
        isLoading={false}
        showDelete={!!editingTier}
        onDelete={editingTier ? () => handleDelete(editingTier.id) : undefined}
      >
        <CommissionTierFormContent
          defaultValues={editingTier}
          onSubmit={handleFormSubmit}
          isLoading={createTier.isPending || updateTier.isPending}
        />
      </CommissionTierDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Commission Tiers</h3>
          <p className="text-sm text-muted-foreground">
            Configure commission rates based on revenue thresholds
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={tiers}
        selectedItems={selectedTiers}
        onSelectionChange={setSelectedTiers}
        getId={(tier) => tier.id}
        isLoading={isLoading}
        emptyState={{
          icon: <TrendingUp className="h-8 w-8" />,
          title: 'No Commission Tiers',
          description: 'Add commission tiers to define different rates based on revenue levels.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Commission Tier"
        description="Are you sure you want to delete this commission tier? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteTier.isPending}
      />
    </div>
  )
}