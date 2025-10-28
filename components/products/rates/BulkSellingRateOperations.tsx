'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'

interface BulkSellingRateOperationsProps {
  rateIds: string[]
  onClose: () => void
  onComplete: () => void
}

export function BulkSellingRateOperations({ rateIds, onClose, onComplete }: BulkSellingRateOperationsProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Manage {rateIds.length} selected selling rates
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-8 text-center space-y-4">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">Bulk Operations Coming Soon</h3>
            <p className="text-sm text-muted-foreground">
              Bulk activate, deactivate, duplicate, and update selling rates
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={onComplete}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
