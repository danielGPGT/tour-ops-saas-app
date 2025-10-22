"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { DeadlineDialog } from '@/components/common/EditDialog'
import { DeadlineFormContent } from '@/components/common/DeadlineForm'
import { useDeadlines, useCreateDeadline, useUpdateDeadline, useDeleteDeadline } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DeadlinesSectionProps {
  refType: string
  refId: string
}

export function DeadlinesSection({ refType, refId }: DeadlinesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<any>(null)
  const [selectedDeadlines, setSelectedDeadlines] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deadlineToDelete, setDeadlineToDelete] = useState<string | null>(null)

  const { data: deadlines = [], isLoading, error } = useDeadlines(refType, refId)
  const createDeadline = useCreateDeadline()
  const updateDeadline = useUpdateDeadline()
  const deleteDeadline = useDeleteDeadline()

  const handleEdit = (deadline: any) => {
    setEditingDeadline(deadline)
    setShowForm(true)
  }

  const handleDelete = (deadlineId: string) => {
    setDeadlineToDelete(deadlineId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deadlineToDelete) return

    try {
      await deleteDeadline.mutateAsync(deadlineToDelete)
      toast.success('Deadline deleted successfully')
      setDeleteDialogOpen(false)
      setDeadlineToDelete(null)
    } catch (error) {
      toast.error('Failed to delete deadline')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingDeadline(null)
  }

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingDeadline) {
        await updateDeadline.mutateAsync({
          id: editingDeadline.id,
          data: { ...data, ref_type: refType, ref_id: refId }
        })
        toast.success('Deadline updated successfully')
      } else {
        await createDeadline.mutateAsync({
          ...data,
          ref_type: refType,
          ref_id: refId
        })
        toast.success('Deadline created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save deadline')
    }
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingDeadline(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'met':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'missed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-600" />
      case 'waived':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      met: 'default',
      missed: 'destructive',
      waived: 'outline',
      not_applicable: 'outline'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPenaltyDisplay = (deadline: any) => {
    if (!deadline.penalty_type || deadline.penalty_type === 'none') {
      return <span className="text-sm text-muted-foreground">No penalty</span>
    }

    if (deadline.penalty_type === 'percentage') {
      return <span className="text-sm font-medium">{deadline.penalty_value}%</span>
    }

    if (deadline.penalty_type === 'fixed_amount') {
      return <span className="text-sm font-medium">${deadline.penalty_value}</span>
    }

    return <span className="text-sm font-medium">{deadline.penalty_type.replace('_', ' ')}</span>
  }

  const columns = [
    {
      key: 'deadline_type',
      header: 'Deadline Type',
      render: (deadline: any) => (
        <div className="font-medium">{deadline.deadline_type}</div>
      )
    },
    {
      key: 'deadline_info',
      header: 'Deadline',
      render: (deadline: any) => {
        if (deadline.deadline_date) {
          return (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(deadline.deadline_date), 'MMM dd, yyyy')}
            </div>
          )
        } else if (deadline.days_before_arrival) {
          return (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {deadline.days_before_arrival} days before arrival
            </div>
          )
        }
        return <span className="text-sm text-muted-foreground">Not specified</span>
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (deadline: any) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(deadline.status)}
          {getStatusBadge(deadline.status)}
        </div>
      )
    },
    {
      key: 'penalty',
      header: 'Penalty',
      render: (deadline: any) => getPenaltyDisplay(deadline)
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (deadline: any) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {deadline.notes || '—'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (deadline: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(deadline)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(deadline.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return <TableSkeleton rows={5} columns={6} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading deadlines: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <DeadlineDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          // Handle save logic here
          handleFormSuccess()
        }}
        onCancel={handleFormCancel}
        isLoading={false}
        showDelete={!!editingDeadline}
        onDelete={editingDeadline ? () => handleDelete(editingDeadline.id) : undefined}
      >
        <DeadlineFormContent
          defaultValues={editingDeadline}
          onSubmit={handleFormSubmit}
          isLoading={createDeadline.isPending || updateDeadline.isPending}
        />
      </DeadlineDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contract Deadlines</h3>
          <p className="text-sm text-muted-foreground">
            Set important deadlines and milestones for this contract
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Deadline
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={deadlines}
        selectedItems={selectedDeadlines}
        onSelectionChange={setSelectedDeadlines}
        getId={(deadline) => deadline.id}
        isLoading={isLoading}
        emptyState={{
          icon: <Clock className="h-8 w-8" />,
          title: 'No Deadlines',
          description: 'Add deadlines to track important milestones for this contract.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Deadline"
        description="Are you sure you want to delete this deadline? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteDeadline.isPending}
      />
    </div>
  )
}