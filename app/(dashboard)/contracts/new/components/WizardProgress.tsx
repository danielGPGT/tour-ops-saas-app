'use client'

import { cn } from '@/lib/utils'
import { Check, FileText, PenTool, Package, DollarSign } from 'lucide-react'

interface Step {
  id: number
  title: string
  description: string
}

interface WizardProgressProps {
  steps: Step[]
  currentStep: number
  onStepChange: (step: number) => void
}

const stepIcons = [
  FileText,
  PenTool,
  Package,
  DollarSign
]

export function WizardProgress({ steps, currentStep, onStepChange }: WizardProgressProps) {
  return (
    <div className="border-b border-border bg-muted/30 px-6 py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = stepIcons[index]
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isClickable = index <= currentStep || isCompleted

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center space-x-3 cursor-pointer transition-all duration-200",
                isClickable ? "hover:opacity-80" : "cursor-not-allowed opacity-50"
              )}
              onClick={() => isClickable && onStepChange(index)}
            >
              {/* Step Icon */}
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200",
                isCompleted && "bg-primary border-primary text-primary-foreground",
                isCurrent && "border-primary bg-primary/10 text-primary",
                !isCompleted && !isCurrent && "border-muted-foreground/30 text-muted-foreground"
              )}>
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm font-medium transition-colors",
                  isCurrent && "text-primary",
                  isCompleted && "text-foreground",
                  !isCompleted && !isCurrent && "text-muted-foreground"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-2 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-muted-foreground/20 rounded-full h-1">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% complete</span>
        </div>
      </div>
    </div>
  )
}
