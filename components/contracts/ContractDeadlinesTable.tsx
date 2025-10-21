'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable } from '@/components/common/DataTable'
import { DeadlineStatusDropdown } from '@/components/common/InlineDropdown'
import { DeadlineActions } from './DeadlineActions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  DollarSign,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Deadline {
  id: bigint
  deadline_type: string
  deadline_date: string
  penalty_type?: string
  penalty_value?: number
  status: 'pending' | 'met' | 'missed' | 'waived'
  notes?: string
  created_at: string
  updated_at: string
}

interface ContractDeadlinesTableProps {
  contractId: bigint
  deadlines: Deadline[]
  onCreateDeadline: (data: any) => void
  onEditDeadline: (id: bigint, data: any) => void
  onDeleteDeadline: (id: bigint) => void
  onMarkComplete: (id: bigint) => void
}

export function ContractDeadlinesTable({
  contractId,
  deadlines,
  onCreateDeadline,
  onEditDeadline,
  onDeleteDeadline,
  onMarkComplete
}: ContractDeadlinesTableProps) {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<Deadline[]>([])
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null)
  const [deletingDeadline, setDeletingDeadline] = useState<Deadline | null>(null)
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  const [newDeadline, setNewDeadline] = useState({
    deadline_type: '',
    deadline_date: '',
    penalty_type: 'none',
    penalty_value: 0,
    notes: ''
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'met': return 'bg-green-100 text-green-800 border-green-200'
      case 'missed': return 'bg-red-100 text-red-800 border-red-200'
      case 'waived': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
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

  const getDeadlineTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-800'
      case 'cancellation': return 'bg-red-100 text-red-800'
      case 'attrition': return 'bg-orange-100 text-orange-800'
      case 'release': return 'bg-blue-100 text-blue-800'
      case 'final_numbers': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (date: string, status: string) => {
    return status === 'pending' && new Date(date) < new Date()
  }

  const handleCreateDeadline = () => {
    if (!newDeadline.deadline_type || !newDeadline.deadline_date) {
      toast.error('Please fill in all required fields')
      return
    }

    onCreateDeadline(newDeadline)
    setNewDeadline({
      deadline_type: '',
      deadline_date: '',
      penalty_type: 'none',
      penalty_value: 0,
      notes: ''
    })
    setCreateDialogOpen(false)
    toast.success('Deadline created successfully')
  }

  const handleEditDeadline = (deadline: Deadline) => {
    setEditingDeadline(deadline)
    setEditDialogOpen(true)
  }

  const handleUpdateDeadline = () => {
    if (!editingDeadline) return

    onEditDeadline(editingDeadline.id, editingDeadline)
    setEditDialogOpen(false)
    setEditingDeadline(null)
    toast.success('Deadline updated successfully')
  }

  const handleDeleteDeadline = (deadline: Deadline) => {
    setDeletingDeadline(deadline)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteDeadline = () => {
    if (!deletingDeadline) return

    onDeleteDeadline(deletingDeadline.id)
    setDeleteDialogOpen(false)
    setDeletingDeadline(null)
    toast.success('Deadline deleted successfully')
  }

  const handleMarkComplete = (deadline: Deadline) => {
    onMarkComplete(deadline.id)
    toast.success('Deadline marked as complete')
  }

  const handleStatusChange = async (deadlineId: bigint, newStatus: string) => {
    try {
      setIsSavingStatus(true)
      
      // Find the deadline and update its status
      const deadline = deadlines.find(d => d.id === deadlineId)
      if (!deadline) return
      
      const updatedDeadline = { ...deadline, status: newStatus as 'pending' | 'met' | 'missed' | 'waived' }
      
      // Call the edit handler with the updated deadline
      onEditDeadline(deadlineId, updatedDeadline)
      
      toast.success('Status updated successfully')
    } catch (error) {
      toast.error('Failed to update status')
      console.error('Status update error:', error)
    } finally {
      setIsSavingStatus(false)
    }
  }

  // Table columns
  const columns = [
    {
      key: 'deadline_type',
      header: 'Type',
      render: (deadline: Deadline) => (
        <div className="flex items-center space-x-2">
          <Badge className={getDeadlineTypeColor(deadline.deadline_type)}>
            {deadline.deadline_type.replace('_', ' ')}
          </Badge>
        </div>
      )
    },
    {
      key: 'deadline_date',
      header: 'Date',
      render: (deadline: Deadline) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={cn(
            "text-sm font-medium",
            isOverdue(deadline.deadline_date, deadline.status) && "text-red-600"
          )}>
            {formatDate(deadline.deadline_date)}
          </span>
          {isOverdue(deadline.deadline_date, deadline.status) && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'penalty',
      header: 'Penalty',
      render: (deadline: Deadline) => (
        <div className="text-sm">
          {deadline.penalty_type === 'none' ? (
            <span className="text-muted-foreground">None</span>
          ) : (
            <div className="flex items-center space-x-1">
              <span>
                {deadline.penalty_type === 'percentage' 
                  ? `${deadline.penalty_value}%` 
                  : `$${deadline.penalty_value}`
                }
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (deadline: Deadline) => (
        <DeadlineStatusDropdown
          value={deadline.status}
          onValueChange={(value) => handleStatusChange(deadline.id, value)}
          className="w-32"
        />
      )
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (deadline: Deadline) => (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          {deadline.notes || 'No notes'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (deadline: Deadline) => (
        <DeadlineActions
          deadline={deadline}
          onEdit={handleEditDeadline}
          onDelete={handleDeleteDeadline}
          onMarkComplete={handleMarkComplete}
        />
      )
    }
  ]

  // Bulk actions
  const bulkActions = [
    {
      label: 'Mark Complete',
      icon: <CheckCircle className="w-4 h-4" />,
      onClick: (items: Deadline[]) => {
        items.forEach(item => {
          if (item.status === 'pending') {
            handleMarkComplete(item)
          }
        })
        setSelectedItems([])
      }
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (items: Deadline[]) => {
        items.forEach(item => onDeleteDeadline(item.id))
        setSelectedItems([])
      }
    }
  ]

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Deadlines',
      value: deadlines.length.toString(),
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Pending',
      value: deadlines.filter(d => d.status === 'pending').length.toString(),
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-800'
    },
    {
      title: 'Completed',
      value: deadlines.filter(d => d.status === 'met').length.toString(),
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'bg-green-100 text-green-800'
    },
    {
      title: 'Overdue',
      value: deadlines.filter(d => isOverdue(d.deadline_date, d.status)).length.toString(),
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'bg-red-100 text-red-800'
    }
  ]

  return (
    <>
      <DataTable
        data={deadlines}
        columns={columns}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        getId={(deadline) => deadline.id.toString()}
        bulkActions={bulkActions}
        getItemName={(deadline) => `${deadline.deadline_type} - ${formatDate(deadline.deadline_date)}`}
        getItemId={(deadline) => deadline.id.toString()}
        entityName="deadline"
        onSelectionClear={() => setSelectedItems([])}
        summaryCards={summaryCards}
        primaryAction={{
          label: 'Add Deadline',
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateDialogOpen(true)
        }}
        emptyState={{
          icon: <Calendar className="h-12 w-12" />,
          title: 'No deadlines found',
          description: 'Add important deadlines to track contract milestones'
        }}
      />

      {/* Create Deadline Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deadline</DialogTitle>
            <DialogDescription>
              Create a new deadline for this contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Deadline Type *</Label>
              <Select value={newDeadline.deadline_type} onValueChange={(value) => setNewDeadline(prev => ({ ...prev, deadline_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select deadline type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="cancellation">Cancellation</SelectItem>
                  <SelectItem value="attrition">Attrition</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                  <SelectItem value="final_numbers">Final Numbers</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Deadline Date *</Label>
              <Input
                type="date"
                value={newDeadline.deadline_date}
                onChange={(e) => setNewDeadline(prev => ({ ...prev, deadline_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Penalty Type</Label>
              <Select value={newDeadline.penalty_type} onValueChange={(value) => setNewDeadline(prev => ({ ...prev, penalty_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  <SelectItem value="forfeit_deposit">Forfeit Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newDeadline.penalty_type !== 'none' && (
              <div>
                <Label>Penalty Value</Label>
                <Input
                  type="number"
                  value={newDeadline.penalty_value}
                  onChange={(e) => setNewDeadline(prev => ({ ...prev, penalty_value: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea
                value={newDeadline.notes}
                onChange={(e) => setNewDeadline(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional details..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeadline}>
              Create Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Deadline Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deadline</DialogTitle>
            <DialogDescription>
              Update deadline information
            </DialogDescription>
          </DialogHeader>
          {editingDeadline && (
            <div className="space-y-4">
              <div>
                <Label>Deadline Type</Label>
                <Select value={editingDeadline.deadline_type} onValueChange={(value) => setEditingDeadline(prev => prev ? { ...prev, deadline_type: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="cancellation">Cancellation</SelectItem>
                    <SelectItem value="attrition">Attrition</SelectItem>
                    <SelectItem value="release">Release</SelectItem>
                    <SelectItem value="final_numbers">Final Numbers</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline Date</Label>
                <Input
                  type="date"
                  value={editingDeadline.deadline_date}
                  onChange={(e) => setEditingDeadline(prev => prev ? { ...prev, deadline_date: e.target.value } : null)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editingDeadline.status} onValueChange={(value) => setEditingDeadline(prev => prev ? { ...prev, status: value as any } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="met">Met</SelectItem>
                    <SelectItem value="missed">Missed</SelectItem>
                    <SelectItem value="waived">Waived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingDeadline.notes || ''}
                  onChange={(e) => setEditingDeadline(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Additional details..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDeadline}>
              Update Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deadline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this deadline? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteDeadline}>
              Delete Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}