'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { AddReleaseDialog } from './add-release-dialog'
import { 
  useAllocationReleases,
  useCreateAllocationRelease,
  useUpdateAllocationRelease,
  useDeleteAllocationRelease
} from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Plus, Calendar, AlertTriangle, Trash2, Edit } from 'lucide-react'

interface ReleaseScheduleSectionProps {
  allocationId: string
}

export function ReleaseScheduleSection({ allocationId }: ReleaseScheduleSectionProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [releaseToDelete, setReleaseToDelete] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingRelease, setEditingRelease] = useState<any>(null)

  const { data: releases = [], isLoading } = useAllocationReleases(allocationId)
  const createRelease = useCreateAllocationRelease()
  const updateRelease = useUpdateAllocationRelease()
  const deleteRelease = useDeleteAllocationRelease()

  const handleDelete = (releaseId: string) => {
    setReleaseToDelete(releaseId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!releaseToDelete) return

    try {
      await deleteRelease.mutateAsync(releaseToDelete)
      toast.success('Release date deleted successfully')
      setDeleteDialogOpen(false)
      setReleaseToDelete(null)
    } catch (error) {
      toast.error('Failed to delete release date')
    }
  }

  const handleSubmitRelease = async (data: any) => {
    try {
      if (editingRelease) {
        await updateRelease.mutateAsync({ id: editingRelease.id, data })
        toast.success('Release date updated successfully')
        setEditingRelease(null)
      } else {
        await createRelease.mutateAsync(data)
        toast.success('Release date added successfully')
      }
    } catch (error) {
      toast.error('Failed to save release date')
      throw error
    }
  }

  const handleEdit = (release: any) => {
    setEditingRelease(release)
    setAddDialogOpen(true)
  }

  const handleAddClick = () => {
    setEditingRelease(null)
    setAddDialogOpen(true)
  }

  const getDaysUntilRelease = (releaseDate: string) => {
    const today = new Date()
    const release = new Date(releaseDate)
    const diffTime = release.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="py-1">
        <div className="text-xs font-semibold mb-1">Release Schedule</div>
        <div className="text-[10px] text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <div className="py-1">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Release Schedule</div>
          <Button size="sm" onClick={handleAddClick} className="h-7 px-2 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
        {releases.length === 0 ? (
          <div className="text-center py-2">
            <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground mb-1">No release dates</p>
            <Button size="sm" onClick={handleAddClick} className="h-7 px-2 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {releases.map((release) => {
              const daysUntil = getDaysUntilRelease(release.release_date)
              const isUpcoming = daysUntil > 0 && daysUntil <= 30
              const isPast = daysUntil < 0

              return (
                <div
                  key={release.id}
                  className={`border rounded-md p-2 ${
                    release.penalty_applies ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-xs">
                          {format(new Date(release.release_date), 'MMM dd, yyyy')}
                        </span>
                                                  {release.penalty_applies && (
                            <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Penalty
                            </Badge>
                          )}
                        {isUpcoming && !isPast && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            In {daysUntil}d
                          </Badge>
                        )}
                        {isPast && (
                          <Badge variant="outline" className="h-4 px-1 text-[10px]">
                            Past
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {release.release_percentage && (
                          <div>
                            <span className="text-muted-foreground">Release:</span>{' '}
                            <span className="font-medium">{release.release_percentage}%</span>
                          </div>
                        )}
                        {release.release_quantity && (
                          <div>
                            <span className="text-muted-foreground">Qty:</span>{' '}
                            <span className="font-medium">{release.release_quantity}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Penalty:</span>{' '}
                          <span className="font-medium">
                            {release.penalty_applies ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                                              {release.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{release.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-0 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(release)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(release.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Release Date"
        description="Are you sure you want to delete this release date? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <AddReleaseDialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open)
          if (!open) {
            setEditingRelease(null)
          }
        }}
        onSubmit={handleSubmitRelease}
        allocationId={allocationId}
        existingRelease={editingRelease}
      />
    </>
  )
}
