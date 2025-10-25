'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Save, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
  canNext: boolean
  canSubmit: boolean
  hasUnsavedChanges: boolean
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
  canNext,
  canSubmit,
  hasUnsavedChanges
}: WizardNavigationProps) {
  const handleNext = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to continue?'
      )
      if (!confirmed) return
    }
    onNext()
  }

  const handleSubmit = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to submit?'
      )
      if (!confirmed) return
    }
    onSubmit()
  }

  return (
    <div className="border-t border-border bg-muted/30 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side - Previous Button */}
        <div>
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
          )}
        </div>

        {/* Center - Save Draft */}
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Unsaved changes</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
        </div>

        {/* Right Side - Next/Submit Button */}
        <div>
          {canNext && (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "flex items-center gap-2",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                  Creating Contract...
                </>
              ) : (
                <>
                  Create Contract
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Auto-save indicator */}
      <div className="mt-2 text-center">
        <div className="text-xs text-muted-foreground">
          Auto-saves every 30 seconds
        </div>
      </div>
    </div>
  )
}
