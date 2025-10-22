"use client"

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/common/DataTable'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PaymentScheduleDialog } from '@/components/common/EditDialog'
import { PaymentScheduleFormContent } from '@/components/common/DialogForm'
import { usePaymentSchedules, useCreatePaymentSchedule, useUpdatePaymentSchedule, useDeletePaymentSchedule } from '@/lib/hooks/useContracts'
import { EventToast, showError, showSuccess, showLoading } from '@/components/common/EventToast'
import { format } from 'date-fns'
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Clock,
  AlertCircle
} from 'lucide-react'

interface PaymentSchedulesSectionProps {
  contractId: string
  currency?: string
}

export function PaymentSchedulesSection({ contractId, currency = 'USD' }: PaymentSchedulesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [selectedSchedules, setSelectedSchedules] = useState<any[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: schedules = [], isLoading, error } = usePaymentSchedules(contractId)
  const createSchedule = useCreatePaymentSchedule()
  const updateSchedule = useUpdatePaymentSchedule()
  const deleteSchedule = useDeletePaymentSchedule()

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule)
    setShowForm(true)
    setIsSubmitting(false) // Reset submitting state when opening dialog
  }

  const handleDelete = (scheduleId: string) => {
    setScheduleToDelete(scheduleId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!scheduleToDelete) return

    try {
      await deleteSchedule.mutateAsync(scheduleToDelete)
      toast.success('Payment schedule deleted successfully')
      setDeleteDialogOpen(false)
      setScheduleToDelete(null)
    } catch (error) {
      toast.error('Failed to delete payment schedule')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingSchedule(null)
    setIsSubmitting(false)
  }

  const handleFormSubmit = async (data: any) => {
    console.log('🔄 handleFormSubmit called with data:', data)
    console.log('🔍 Current isSubmitting state:', isSubmitting)
    
    try {
      if (editingSchedule) {
        console.log('📝 Updating payment schedule:', editingSchedule.id)
        await updateSchedule.mutateAsync({
          id: editingSchedule.id,
          data: { ...data, contract_id: contractId }
        })
        showSuccess('Payment schedule updated successfully', 'Update Complete')
      } else {
        console.log('➕ Creating new payment schedule')
        await createSchedule.mutateAsync({
          ...data,
          contract_id: contractId
        })
        showSuccess('Payment schedule created successfully', 'Creation Complete')
      }
      
      console.log('✅ Form submission successful')
      handleFormSuccess()
    } catch (error) {
      console.error('❌ Form submission failed:', error)
      showError(
        error instanceof Error ? error.message : 'Failed to save payment schedule',
        'Save Failed'
      )
    } finally {
      // Force reset submitting state
      console.log('🔄 Resetting isSubmitting state')
      setIsSubmitting(false)
    }
  }

  const handleDialogSave = React.useCallback(() => {
    console.log('🔘 Dialog save button clicked')
    console.log('🔍 formRef.current:', formRef.current)
    console.log('🔍 isSubmitting:', isSubmitting)
    
    // Force reset if stuck
    if (isSubmitting) {
      console.log('🔄 Force resetting stuck isSubmitting state')
      setIsSubmitting(false)
      // Small delay to ensure state update
      setTimeout(() => {
        console.log('🔄 Retrying form submission after reset')
        if (formRef.current) {
          setIsSubmitting(true)
          formRef.current.requestSubmit()
        }
      }, 100)
      return
    }
    
    if (formRef.current) {
      console.log('📤 Triggering form submission via requestSubmit()')
      setIsSubmitting(true)
      
      // Force submit even if validation fails (for debugging)
      const formData = new FormData(formRef.current)
      const data = Object.fromEntries(formData.entries())
      console.log('🔍 Form data extracted:', data)
      
      // Try normal submission first
      formRef.current.requestSubmit()
      
      // If that fails, try direct submission after a delay
      setTimeout(() => {
        if (isSubmitting) {
          console.log('🔄 Normal submission failed, trying direct submission')
          handleFormSubmit(data)
        }
      }, 1000)
    } else {
      console.error('❌ formRef.current is null - form not found')
      showError('Form not found. Please try again.', 'Form Error')
    }
  }, [isSubmitting])

  // Alternative save mechanism using form data (removed - primary method works)
  // const handleDirectSave = () => {
  //   console.log('🔄 Direct save triggered with formData:', formData)
  //   if (formData) {
  //     handleFormSubmit(formData)
  //   } else {
  //     showError('No form data available. Please fill out the form.', 'No Data')
  //   }
  // }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingSchedule(null)
    setIsSubmitting(false)
  }

  const columns = [
    {
      key: 'payment_stage',
      header: 'Payment Stage',
      render: (schedule: any) => (
        <div className="font-medium">{schedule.payment_stage}</div>
      )
    },
    {
      key: 'payment_type',
      header: 'Type',
      render: (schedule: any) => (
        <Badge variant={schedule.payment_type === 'percentage' ? 'default' : 'secondary'}>
          {schedule.payment_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
        </Badge>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (schedule: any) => (
        <div className="font-mono">
          {schedule.payment_type === 'percentage' 
            ? `${schedule.percentage}%`
            : `${currency}${schedule.fixed_amount?.toLocaleString()}`
          }
        </div>
      )
    },
    {
      key: 'due_info',
      header: 'Due',
      render: (schedule: any) => {
        if (schedule.due_type === 'days_before_arrival') {
          return (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {schedule.days_before} days before arrival
            </div>
          )
        } else if (schedule.due_type === 'days_after_booking') {
          return (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {schedule.days_after} days after booking
            </div>
          )
        } else {
          return (
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {format(new Date(schedule.due_date), 'MMM dd, yyyy')}
            </div>
          )
        }
      }
    },
    {
      key: 'description',
      header: 'Description',
      render: (schedule: any) => (
        <div className="text-sm text-muted-foreground">
          {schedule.description || '—'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (schedule: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(schedule)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(schedule.id)}
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
            <p>Error loading payment schedules: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PaymentScheduleDialog
        open={showForm}
        onOpenChange={setShowForm}
        onSave={() => {
          console.log('🎯 Dialog onSave called - trying primary method only')
          handleDialogSave()
        }}
        onCancel={handleFormCancel}
        isLoading={createSchedule.isPending || updateSchedule.isPending}
        showDelete={!!editingSchedule}
        onDelete={editingSchedule ? () => handleDelete(editingSchedule.id) : undefined}
      >
        <PaymentScheduleFormContent
          ref={formRef}
          defaultValues={editingSchedule}
          onSubmit={handleFormSubmit}
          isLoading={createSchedule.isPending || updateSchedule.isPending}
        />
      </PaymentScheduleDialog>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Payment Schedules</h3>
          <p className="text-sm text-muted-foreground">
            Configure payment terms and due dates for this contract
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setEditingSchedule(null)
            setShowForm(true)
            setIsSubmitting(false)
          }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Schedule
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('🔄 Force resetting isSubmitting state')
              setIsSubmitting(false)
            }}
            className="text-xs"
          >
            Reset State
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={schedules}
        selectedItems={selectedSchedules}
        onSelectionChange={setSelectedSchedules}
        getId={(schedule) => schedule.id}
        isLoading={isLoading}
        emptyState={{
          icon: <Calendar className="h-8 w-8" />,
          title: 'No Payment Schedules',
          description: 'Add payment schedules to define when payments are due for this contract.'
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Payment Schedule"
        description="Are you sure you want to delete this payment schedule? This action cannot be undone."
        onConfirm={confirmDelete}
        isLoading={deleteSchedule.isPending}
      />
    </div>
  )
}