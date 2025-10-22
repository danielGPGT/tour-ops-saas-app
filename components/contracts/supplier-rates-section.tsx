"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SupplierRateDialog } from '@/components/common/EditDialog'
import { SupplierRateFormContent } from '@/components/common/SupplierRateForm'
import { useSupplierRates, useCreateSupplierRate, useUpdateSupplierRate, useDeleteSupplierRate } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  AlertCircle
} from 'lucide-react'

interface SupplierRatesSectionProps {
  contractId: string
}

export function SupplierRatesSection({ contractId }: SupplierRatesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingRate, setEditingRate] = useState<any>(null)
  const [selectedRates, setSelectedRates] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rateToDelete, setRateToDelete] = useState<string | null>(null)

  const { data: rates = [], isLoading, error } = useSupplierRates(contractId)
  const createRate = useCreateSupplierRate()
  const updateRate = useUpdateSupplierRate()
  const deleteRate = useDeleteSupplierRate()

  const handleEdit = (rate: any) => {
    setEditingRate(rate)
    setShowForm(true)
  }

  const handleDelete = (rateId: string) => {
    setRateToDelete(rateId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!rateToDelete) return

    try {
      await deleteRate.mutateAsync(rateToDelete)
      toast.success('Supplier rate deleted successfully')
      setDeleteDialogOpen(false)
      setRateToDelete(null)
    } catch (error) {
      toast.error('Failed to delete supplier rate')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingRate(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingRate) {
        await updateRate.mutateAsync({
          id: editingRate.id,
          data: { ...data, contract_id: contractId }
        })
        toast.success('Supplier rate updated successfully')
      } else {
        await createRate.mutateAsync({
          ...data,
          contract_id: contractId
        })
        toast.success('Supplier rate created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save supplier rate')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingRate(null)
  }

  const getRateBasisBadge = (rateBasis: string) => {
    const variants = {
      per_person: 'default',
      per_room: 'secondary',
      per_booking: 'outline',
      per_night: 'destructive'
    } as const

    return (
      <Badge variant={variants[rateBasis as keyof typeof variants] || 'outline'}>
        {rateBasis?.replace('_', ' ').toUpperCase() || 'Unknown'}
      </Badge>
    )
  }

  const getStatusBadges = (rate: any) => (
    <div className="flex flex-wrap gap-1">
      {rate.is_default && <Badge variant="default" className="text-xs">Default</Badge>}
      {rate.is_included_in_package && <Badge variant="secondary" className="text-xs">In Package</Badge>}
      {rate.is_extra_night_rate && <Badge variant="outline" className="text-xs">Extra Night</Badge>}
    </div>
  )

  const columns = [
    {
      key: 'rate_name',
      header: 'Rate Name',
      render: (rate: any) => (
        <div className="font-medium">
          {rate.rate_name || 'Unnamed Rate'}
        </div>
      )
    },
    {
      key: 'product',
      header: 'Product',
      render: (rate: any) => (
        <div>
          <div className="font-medium">{rate.product?.name || 'Unknown Product'}</div>
          <div className="text-sm text-muted-foreground">
            {rate.product?.code || 'N/A'}
            {rate.product_option && ` • ${rate.product_option.option_name}`}
          </div>
        </div>
      )
    },
    {
      key: 'rate_basis',
      header: 'Rate Basis',
      render: (rate: any) => getRateBasisBadge(rate.rate_basis)
    },
    {
      key: 'valid_period',
      header: 'Valid Period',
      render: (rate: any) => (
        <div className="text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {format(new Date(rate.valid_from), 'MMM dd, yyyy')} - {format(new Date(rate.valid_to), 'MMM dd, yyyy')}
          </div>
        </div>
      )
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (rate: any) => (
        <Badge variant="outline">{rate.currency || 'USD'}</Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (rate: any) => getStatusBadges(rate)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rate: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(rate)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(rate.id)}
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
            <p>Error loading supplier rates: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <SupplierRateDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          // Handle save logic here
          handleFormSuccess()
        }}
        onCancel={handleFormCancel}
        isLoading={false}
        showDelete={!!editingRate}
        onDelete={editingRate ? () => handleDelete(editingRate.id) : undefined}
      >
        <SupplierRateFormContent
          defaultValues={editingRate}
          onSubmit={handleFormSubmit}
          isLoading={createRate.isPending || updateRate.isPending}
          products={[]} // TODO: Load products from API
          productOptions={[]} // TODO: Load product options from API
        />
      </SupplierRateDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Rates</h3>
          <p className="text-sm text-muted-foreground">
            Manage supplier rates and pricing for products in this contract
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rate
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rates}
        selectedItems={selectedRates}
        onSelectionChange={setSelectedRates}
        getId={(rate) => rate.id}
        isLoading={isLoading}
        emptyState={{
          icon: <DollarSign className="h-8 w-8" />,
          title: 'No Supplier Rates',
          description: 'Add supplier rates to define pricing for products in this contract.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier Rate"
        description="Are you sure you want to delete this supplier rate? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteRate.isPending}
      />
    </div>
  )
}
