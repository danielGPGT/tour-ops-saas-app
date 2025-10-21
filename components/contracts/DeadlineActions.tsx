'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  MoreHorizontal,
  Edit,
  CheckCircle,
  Trash2,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react'
import { toast } from 'sonner'

type Deadline = {
  id: bigint
  deadline_type: string
  deadline_date: string
  penalty_type: string
  penalty_value: number
  status: 'pending' | 'met' | 'missed' | 'waived'
  notes?: string
}

type Props = {
  deadline: Deadline
  onEdit: (deadline: Deadline) => void
  onDelete: (deadlineId: bigint) => void
  onMarkComplete: (deadlineId: bigint) => void
}

export function DeadlineActions({ deadline, onEdit, onDelete, onMarkComplete }: Props) {
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const handleEdit = () => {
    onEdit(deadline)
  }

  const handleDelete = async () => {
    try {
      onDelete(deadline.id)
      setDeleteOpen(false)
      toast.success("Deadline deleted successfully")
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error("Failed to delete deadline")
    }
  }

  const handleMarkComplete = () => {
    onMarkComplete(deadline.id)
    toast.success("Deadline marked as complete")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'met': return <CheckCircle className="h-4 w-4" />
      case 'missed': return <AlertTriangle className="h-4 w-4" />
      case 'waived': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600'
      case 'met': return 'text-green-600'
      case 'missed': return 'text-red-600'
      case 'waived': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Deadline
          </DropdownMenuItem>
          
          {deadline.status === 'pending' && (
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleMarkComplete}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Deadline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deadline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deadline? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Deadline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
