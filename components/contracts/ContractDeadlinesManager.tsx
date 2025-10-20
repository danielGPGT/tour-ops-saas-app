'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractDeadlinesManagerProps {
  contractId: bigint
  deadlines: any[]
  onCreateDeadline: (data: any) => void
  onEditDeadline: (id: bigint, data: any) => void
  onDeleteDeadline: (id: bigint) => void
  onMarkComplete: (id: bigint) => void
}

export function ContractDeadlinesManager({
  contractId,
  deadlines,
  onCreateDeadline,
  onEditDeadline,
  onDeleteDeadline,
  onMarkComplete
}: ContractDeadlinesManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'met': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'waived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getDeadlineTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="h-4 w-4" />
      case 'cancellation': return <X className="h-4 w-4" />
      case 'attrition': return <AlertTriangle className="h-4 w-4" />
      case 'release': return <CheckCircle className="h-4 w-4" />
      case 'final_numbers': return <Calendar className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (deadlineDate: string, status: string) => {
    if (status !== 'pending') return false
    return new Date(deadlineDate) < new Date()
  }

  if (deadlines.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No deadlines set</h3>
          <p className="text-muted-foreground mb-4">
            This contract doesn't have any important deadlines or key dates.
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Contract Deadlines</h3>
          <p className="text-sm text-muted-foreground">
            {deadlines.length} deadline{deadlines.length !== 1 ? 's' : ''} set for this contract
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Deadline
        </Button>
      </div>

      {/* Deadlines List */}
      <div className="grid gap-4">
        {deadlines.map((deadline) => (
          <Card key={deadline.id} className={cn(
            "transition-colors",
            isOverdue(deadline.deadline_date, deadline.status) && "border-red-200 bg-red-50"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    isOverdue(deadline.deadline_date, deadline.status) 
                      ? "bg-red-100 text-red-600" 
                      : "bg-blue-100 text-blue-600"
                  )}>
                    {getDeadlineTypeIcon(deadline.deadline_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium capitalize">
                        {deadline.deadline_type.replace('_', ' ')}
                      </h4>
                      <Badge className={getStatusColor(deadline.status)}>
                        {getStatusIcon(deadline.status)}
                        <span className="ml-1">{deadline.status}</span>
                      </Badge>
                      {isOverdue(deadline.deadline_date, deadline.status) && (
                        <Badge variant="destructive">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Due: {formatDate(deadline.deadline_date)}
                    </p>
                    {deadline.notes && (
                      <p className="text-sm text-muted-foreground">
                        {deadline.notes}
                      </p>
                    )}
                    {deadline.penalty_type !== 'none' && (
                      <div className="mt-2">
                        <span className="text-xs text-muted-foreground">Penalty: </span>
                        <span className="text-xs font-medium">
                          {deadline.penalty_type === 'percentage' 
                            ? `${deadline.penalty_value}%`
                            : deadline.penalty_type === 'fixed_amount'
                            ? `$${deadline.penalty_value}`
                            : deadline.penalty_type
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {deadline.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkComplete(deadline.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditDeadline(deadline.id, deadline)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteDeadline(deadline.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Form Modal - TODO: Implement */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Deadline</CardTitle>
              <CardDescription>
                Set an important deadline for this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Deadline creation form will be implemented here.
              </p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  onCreateDeadline({})
                  setShowCreateForm(false)
                }}>
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
