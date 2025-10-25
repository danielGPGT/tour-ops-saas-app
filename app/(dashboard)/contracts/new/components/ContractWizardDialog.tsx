'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ContractWizard } from './ContractWizard'

interface ContractWizardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ContractWizardDialog({ open, onOpenChange, onSuccess }: ContractWizardDialogProps) {
  const [creationMethod, setCreationMethod] = useState<'pdf' | 'manual' | null>(null)

  const handleClose = () => {
    setCreationMethod(null)
    onOpenChange(false)
  }

  const handleSuccess = () => {
    setCreationMethod(null)
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
        
        {!creationMethod ? (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Choose Creation Method
              </h2>
              <p className="text-muted-foreground">
                How would you like to create your contract?
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* PDF Upload Option */}
              <div 
                className="p-6 border-2 border-dashed border-primary/20 rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/40 hover:bg-primary/5"
                onClick={() => setCreationMethod('pdf')}
              >
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">📄</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Upload Contract PDF
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Let AI extract information automatically
                  </p>
                  <div className="text-xs text-primary/80 space-y-1">
                    <div>✨ Extracts: supplier, dates, rates</div>
                    <div>⚡ 92% faster than manual entry</div>
                  </div>
                </div>
              </div>

              {/* Manual Entry Option */}
              <div 
                className="p-6 border-2 border-dashed border-secondary/20 rounded-xl cursor-pointer transition-all duration-200 hover:border-secondary/40 hover:bg-secondary/5"
                onClick={() => setCreationMethod('manual')}
              >
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">✏️</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Enter Details Manually
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fill out the 3-step wizard
                  </p>
                  <div className="text-xs text-secondary/80 space-y-1">
                    <div>📝 Step-by-step form</div>
                    <div>⚡ 80% faster than before</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <ContractWizard 
            method={creationMethod}
            onClose={handleClose}
            onSuccess={handleSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
