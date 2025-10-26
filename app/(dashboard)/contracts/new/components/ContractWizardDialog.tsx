'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContractWizard } from './ContractWizard'

interface ContractWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ContractWizardDialog({ open, onOpenChange, onSuccess }: ContractWizardDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  const handleSuccess = () => {
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Create New Contract</span>
          </DialogTitle>
        </DialogHeader>
        
        <ContractWizard
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}