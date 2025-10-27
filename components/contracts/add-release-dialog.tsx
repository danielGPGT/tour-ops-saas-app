'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'

interface AddReleaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  allocationId: string
  existingRelease?: any
}

export function AddReleaseDialog({
  open,
  onOpenChange,
  onSubmit,
  allocationId,
  existingRelease
}: AddReleaseDialogProps) {
  const [releaseDate, setReleaseDate] = useState<Date | undefined>(undefined)
  const [releasePercentage, setReleasePercentage] = useState<string>('')
  const [releaseQuantity, setReleaseQuantity] = useState<string>('')
  const [penaltyApplies, setPenaltyApplies] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form when existingRelease changes
  useEffect(() => {
    if (existingRelease) {
      setReleaseDate(existingRelease.release_date ? new Date(existingRelease.release_date) : undefined)
      setReleasePercentage(existingRelease.release_percentage?.toString() || '')
      setReleaseQuantity(existingRelease.release_quantity?.toString() || '')
      setPenaltyApplies(existingRelease.penalty_applies || false)
      setNotes(existingRelease.notes || '')
    } else {
      // Reset form when adding new release
      setReleaseDate(undefined)
      setReleasePercentage('')
      setReleaseQuantity('')
      setPenaltyApplies(false)
      setNotes('')
    }
  }, [existingRelease, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await onSubmit({
        contract_allocation_id: allocationId,
        release_date: releaseDate?.toISOString().split('T')[0],
        release_percentage: releasePercentage ? parseFloat(releasePercentage) : null,
        release_quantity: releaseQuantity ? parseInt(releaseQuantity) : null,
        penalty_applies: penaltyApplies,
        notes: notes || null
      })
      
      // Reset form
      setReleaseDate(undefined)
      setReleasePercentage('')
      setReleaseQuantity('')
      setPenaltyApplies(false)
      setNotes('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting release:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {existingRelease ? 'Edit Release Date' : 'Add Release Date'}
            </DialogTitle>
            <DialogDescription>
              {existingRelease 
                ? 'Update the release date details' 
                : 'Schedule a release date to manage allocation attrition'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Release Date */}
            <div className="grid gap-2">
              <Label htmlFor="release-date">
                Release Date <span className="text-destructive">*</span>
              </Label>
              <DatePicker
                date={releaseDate}
                onDateChange={setReleaseDate}
                placeholder="Select release date"
              />
            </div>

            {/* Release Percentage */}
            <div className="grid gap-2">
              <Label htmlFor="release-percentage">Release Percentage (%)</Label>
              <Input
                id="release-percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={releasePercentage}
                onChange={(e) => setReleasePercentage(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>

            {/* Release Quantity */}
            <div className="grid gap-2">
              <Label htmlFor="release-quantity">Release Quantity</Label>
              <Input
                id="release-quantity"
                type="number"
                min="0"
                value={releaseQuantity}
                onChange={(e) => setReleaseQuantity(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>

            {/* Penalty Applies */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="penalty-applies"
                checked={penaltyApplies}
                onCheckedChange={(checked) => setPenaltyApplies(checked as boolean)}
              />
              <Label htmlFor="penalty-applies" className="cursor-pointer">
                Penalty applies after this date
              </Label>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!releaseDate || isSubmitting}>
              {isSubmitting ? 'Saving...' : existingRelease ? 'Update' : 'Add Release Date'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
