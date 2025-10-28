'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Calendar, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Percent,
  Save,
  X
} from 'lucide-react'
import { format, differenceInDays, addDays, subDays } from 'date-fns'
import { toast } from 'sonner'
import { 
  useAllocationReleases, 
  useCreateAllocationRelease, 
  useUpdateAllocationRelease, 
  useDeleteAllocationRelease 
} from '@/lib/hooks/useContracts'
import { cn } from '@/lib/utils'

interface ReleaseScheduleManagerProps {
  allocationId: string
  allocation: any
  onClose?: () => void
}

interface ReleaseSchedule {
  id?: string
  release_date: string
  release_percentage?: number
  release_quantity?: number
  penalty_applies: boolean
  penalty_percentage?: number
  penalty_amount?: number
  notes?: string
  is_completed?: boolean
}

export function ReleaseScheduleManager({ 
  allocationId, 
  allocation, 
  onClose 
}: ReleaseScheduleManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingRelease, setEditingRelease] = useState<ReleaseSchedule | null>(null)
  
  const { data: releases = [], isLoading } = useAllocationReleases(allocationId)
  const createRelease = useCreateAllocationRelease()
  const updateRelease = useUpdateAllocationRelease()
  const deleteRelease = useDeleteAllocationRelease()

  const handleCreateRelease = async (releaseData: ReleaseSchedule) => {
    try {
      await createRelease.mutateAsync({
        contract_allocation_id: allocationId,
        release_date: releaseData.release_date,
        release_percentage: releaseData.release_percentage,
        release_quantity: releaseData.release_quantity,
        penalty_applies: releaseData.penalty_applies,
        penalty_percentage: releaseData.penalty_percentage,
        penalty_amount: releaseData.penalty_amount,
        notes: releaseData.notes
      })
      
      toast.success('Release schedule created')
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating release:', error)
      toast.error('Failed to create release schedule')
    }
  }

  const handleUpdateRelease = async (id: string, releaseData: Partial<ReleaseSchedule>) => {
    try {
      await updateRelease.mutateAsync({ id, data: releaseData })
      toast.success('Release schedule updated')
      setEditingRelease(null)
    } catch (error) {
      console.error('Error updating release:', error)
      toast.error('Failed to update release schedule')
    }
  }

  const handleDeleteRelease = async (id: string) => {
    try {
      await deleteRelease.mutateAsync(id)
      toast.success('Release schedule deleted')
    } catch (error) {
      console.error('Error deleting release:', error)
      toast.error('Failed to delete release schedule')
    }
  }

  const handleCompleteRelease = async (release: any) => {
    try {
      await updateRelease.mutateAsync({ 
        id: release.id, 
        data: { is_completed: true, completed_at: new Date().toISOString() }
      })
      toast.success('Release marked as completed')
    } catch (error) {
      console.error('Error completing release:', error)
      toast.error('Failed to complete release')
    }
  }

  // Calculate next release date and urgency
  const now = new Date()
  const upcomingReleases = releases
    .filter((release: any) => !release.is_completed && new Date(release.release_date) >= now)
    .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
  
  const nextRelease = upcomingReleases[0]
  const daysUntilNext = nextRelease ? differenceInDays(new Date(nextRelease.release_date), now) : null

  // Calculate total potential penalty
  const totalPenaltyRisk = releases
    .filter((release: any) => !release.is_completed && release.penalty_applies)
    .reduce((sum: number, release: any) => {
      const amount = release.penalty_amount || 
        (release.penalty_percentage && allocation.total_cost ? 
          (allocation.total_cost * release.penalty_percentage / 100) : 0)
      return sum + amount
    }, 0)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Release Schedule</CardTitle>
          <CardDescription>Loading release dates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Release Schedule
              </CardTitle>
              <CardDescription>
                Manage staged release dates and penalties for {allocation?.allocation_name}
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Release
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Alert */}
          {nextRelease && (
            <Alert className={cn(
              "mb-6",
              daysUntilNext && daysUntilNext <= 7 ? "border-destructive bg-destructive/10" :
              daysUntilNext && daysUntilNext <= 14 ? "border-orange-200 bg-orange-50" :
              "border-yellow-200 bg-yellow-50"
            )}>
              <AlertTriangle className={cn(
                "h-4 w-4",
                daysUntilNext && daysUntilNext <= 7 ? "text-destructive" :
                daysUntilNext && daysUntilNext <= 14 ? "text-orange-500" :
                "text-yellow-600"
              )} />
              <AlertTitle>
                Next Release: {format(new Date(nextRelease.release_date), 'MMM d, yyyy')}
              </AlertTitle>
              <AlertDescription>
                <div className="flex items-center justify-between mt-2">
                  <span>
                    {daysUntilNext === 0 ? 'Due TODAY' :
                      daysUntilNext === 1 ? 'Due tomorrow' :
                      `${daysUntilNext} days remaining`}
                  </span>
                  {nextRelease.penalty_applies && (
                    <span className="text-sm">
                      Penalty risk: {allocation.currency} {Math.round(nextRelease.penalty_amount || 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Release Statistics */}
          {releases.length > 0 && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold">{releases.length}</div>
                <div className="text-xs text-muted-foreground">Total Releases</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-green-600">
                  {releases.filter((r: any) => r.is_completed).length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {upcomingReleases.length}
                </div>
                <div className="text-xs text-muted-foreground">Upcoming</div>
              </div>
              <div className="text-center p-3 border rounded">
                <div className="text-2xl font-bold text-destructive">
                  {allocation.currency} {Math.round(totalPenaltyRisk).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Penalty Risk</div>
              </div>
            </div>
          )}

          {/* Release Timeline */}
          {releases.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Release Schedule</h3>
              <p className="text-muted-foreground mb-4">
                Add release dates to track when inventory must be returned to suppliers
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Release
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {releases
                .sort((a: any, b: any) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime())
                .map((release: any, index: number) => (
                <ReleaseCard
                  key={release.id}
                  release={release}
                  allocation={allocation}
                  index={index}
                  isLast={index === releases.length - 1}
                  onEdit={() => setEditingRelease(release)}
                  onDelete={() => handleDeleteRelease(release.id)}
                  onComplete={() => handleCompleteRelease(release)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Release Dialog */}
      {isCreating && (
        <ReleaseFormDialog
          allocation={allocation}
          onSubmit={handleCreateRelease}
          onCancel={() => setIsCreating(false)}
          isLoading={createRelease.isPending}
        />
      )}

      {/* Edit Release Dialog */}
      {editingRelease && (
        <ReleaseFormDialog
          allocation={allocation}
          existingRelease={editingRelease}
          onSubmit={(data) => handleUpdateRelease(editingRelease.id!, data)}
          onCancel={() => setEditingRelease(null)}
          isLoading={updateRelease.isPending}
        />
      )}
    </div>
  )
}

interface ReleaseCardProps {
  release: any
  allocation: any
  index: number
  isLast: boolean
  onEdit: () => void
  onDelete: () => void
  onComplete: () => void
}

function ReleaseCard({ 
  release, 
  allocation, 
  index, 
  isLast, 
  onEdit, 
  onDelete, 
  onComplete 
}: ReleaseCardProps) {
  const now = new Date()
  const releaseDate = new Date(release.release_date)
  const daysUntil = differenceInDays(releaseDate, now)
  const isPast = releaseDate < now
  const isToday = daysUntil === 0
  const isCompleted = release.is_completed

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-600'
    if (isPast && !isCompleted) return 'text-destructive'
    if (isToday) return 'text-destructive'
    if (daysUntil <= 7) return 'text-orange-500'
    return 'text-muted-foreground'
  }

  const getStatusBadge = () => {
    if (isCompleted) return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>
    if (isPast && !isCompleted) return <Badge variant="destructive">Overdue</Badge>
    if (isToday) return <Badge variant="destructive">Due Today</Badge>
    if (daysUntil <= 3) return <Badge variant="destructive">{daysUntil} days</Badge>
    if (daysUntil <= 7) return <Badge variant="secondary" className="bg-orange-100 text-orange-700">{daysUntil} days</Badge>
    return <Badge variant="outline">{daysUntil} days</Badge>
  }

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-12 w-0.5 h-8 bg-border" />
      )}
      
      <div className="flex items-start gap-4 p-4 border rounded-lg">
        {/* Timeline dot */}
        <div className={cn(
          "w-3 h-3 rounded-full border-2 bg-background",
          isCompleted ? "border-green-500" :
          isPast && !isCompleted ? "border-destructive" :
          isToday ? "border-destructive" :
          daysUntil <= 7 ? "border-orange-500" :
          "border-muted-foreground"
        )} />
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={cn("font-medium", getStatusColor())}>
                Release #{index + 1}
              </span>
              {getStatusBadge()}
              {release.penalty_applies && (
                <Badge variant="outline" className="text-xs">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Penalty
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isCompleted && !isPast && (
                <Button size="sm" variant="ghost" onClick={onComplete}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              {!isCompleted && (
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {format(releaseDate, 'EEEE, MMM d, yyyy')}
              </span>
              <span className={getStatusColor()}>
                {isCompleted ? 'Released' :
                  isPast ? 'Overdue' :
                  isToday ? 'Due today' :
                  `${daysUntil} days remaining`}
              </span>
            </div>
            
            {(release.release_quantity || release.release_percentage) && (
              <div className="text-muted-foreground">
                Release: {release.release_quantity ? 
                  `${release.release_quantity} units` : 
                  `${release.release_percentage}% of allocation`}
              </div>
            )}
            
            {release.penalty_applies && (release.penalty_amount || release.penalty_percentage) && (
              <div className="text-destructive text-xs">
                Penalty: {release.penalty_amount ? 
                  `${allocation.currency} ${release.penalty_amount.toLocaleString()}` :
                  `${release.penalty_percentage}% of allocation cost`}
              </div>
            )}
            
            {release.notes && (
              <div className="text-muted-foreground text-xs mt-2 p-2 bg-muted/50 rounded">
                {release.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ReleaseFormDialogProps {
  allocation: any
  existingRelease?: ReleaseSchedule
  onSubmit: (data: ReleaseSchedule) => void
  onCancel: () => void
  isLoading: boolean
}

function ReleaseFormDialog({ 
  allocation, 
  existingRelease, 
  onSubmit, 
  onCancel, 
  isLoading 
}: ReleaseFormDialogProps) {
  const [formData, setFormData] = useState<ReleaseSchedule>({
    release_date: existingRelease?.release_date || format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    release_percentage: existingRelease?.release_percentage || undefined,
    release_quantity: existingRelease?.release_quantity || undefined,
    penalty_applies: existingRelease?.penalty_applies || false,
    penalty_percentage: existingRelease?.penalty_percentage || undefined,
    penalty_amount: existingRelease?.penalty_amount || undefined,
    notes: existingRelease?.notes || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.release_date) {
      toast.error('Please select a release date')
      return
    }
    
    if (!formData.release_quantity && !formData.release_percentage) {
      toast.error('Please specify either quantity or percentage to release')
      return
    }
    
    onSubmit(formData)
  }

  const calculatedQuantity = formData.release_percentage && allocation.total_quantity ? 
    Math.round(allocation.total_quantity * formData.release_percentage / 100) : 0

  const calculatedPenalty = formData.penalty_percentage && allocation.total_cost ?
    Math.round(allocation.total_cost * formData.penalty_percentage / 100) : 0

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRelease ? 'Edit Release' : 'Add Release Date'}
          </DialogTitle>
          <DialogDescription>
            Configure when inventory must be released back to the supplier
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="release_date">Release Date *</Label>
            <Input
              id="release_date"
              type="date"
              value={formData.release_date}
              onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="release_quantity">Quantity</Label>
              <Input
                id="release_quantity"
                type="number"
                value={formData.release_quantity || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  release_quantity: e.target.value ? parseInt(e.target.value) : undefined,
                  release_percentage: undefined // Clear percentage when quantity is set
                }))}
                placeholder="Units to release"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="release_percentage">Percentage</Label>
              <Input
                id="release_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.release_percentage || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  release_percentage: e.target.value ? parseFloat(e.target.value) : undefined,
                  release_quantity: undefined // Clear quantity when percentage is set
                }))}
                placeholder="% of total"
              />
            </div>
          </div>

          {formData.release_percentage && calculatedQuantity > 0 && (
            <div className="text-sm text-muted-foreground">
              = {calculatedQuantity} units (out of {allocation.total_quantity} total)
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="penalty_applies"
              checked={formData.penalty_applies}
              onChange={(e) => setFormData(prev => ({ ...prev, penalty_applies: e.target.checked }))}
            />
            <Label htmlFor="penalty_applies">Penalty applies if not released</Label>
          </div>
          
          {formData.penalty_applies && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="penalty_amount">Penalty Amount</Label>
                <Input
                  id="penalty_amount"
                  type="number"
                  step="0.01"
                  value={formData.penalty_amount || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    penalty_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    penalty_percentage: undefined
                  }))}
                  placeholder={`${allocation.currency} amount`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penalty_percentage">Penalty %</Label>
                <Input
                  id="penalty_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.penalty_percentage || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    penalty_percentage: e.target.value ? parseFloat(e.target.value) : undefined,
                    penalty_amount: undefined
                  }))}
                  placeholder="% of cost"
                />
              </div>
            </div>
          )}

          {formData.penalty_percentage && calculatedPenalty > 0 && (
            <div className="text-sm text-muted-foreground">
              = {allocation.currency} {calculatedPenalty.toLocaleString()} penalty
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this release..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : existingRelease ? 'Update Release' : 'Add Release'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
