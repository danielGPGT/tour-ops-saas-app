'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface InlineDropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface InlineDropdownProps {
  value: string
  onValueChange: (value: string) => Promise<void> | void
  options: InlineDropdownOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  loading?: boolean
  successMessage?: string
  errorMessage?: string
}

export function InlineDropdown({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  triggerClassName,
  loading = false,
  successMessage = "Updated successfully",
  errorMessage = "Failed to update"
}: InlineDropdownProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleValueChange = async (newValue: string) => {
    if (newValue === value) return // No change needed
    
    try {
      setIsSaving(true)
      setIsLoading(true)
      
      await onValueChange(newValue)
      
      if (successMessage) {
        toast.success(successMessage)
      }
    } catch (error) {
      console.error('InlineDropdown error:', error)
      if (errorMessage) {
        toast.error(errorMessage)
      }
    } finally {
      setIsSaving(false)
      setIsLoading(false)
    }
  }

  const selectedOption = options.find(option => option.value === value)

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled || loading || isSaving}
        
      >
        <SelectTrigger className={cn(
          "w-full py-0",
          triggerClassName,
          (loading || isSaving) && "opacity-50 cursor-not-allowed"
        )}>
          <SelectValue placeholder={placeholder}>
            {selectedOption && (
              <div className="flex items-center space-x-2">
                {selectedOption.icon}
                <span>{selectedOption.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center space-x-2 ">
                {option.icon}
                <div className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(loading || isSaving) && (
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          <div className="animate-spin h-3 w-3 border border-current border-t-transparent rounded-full" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  )
}

// Preset components for common use cases
export function StatusDropdown({
  value,
  onValueChange,
  disabled = false,
  className,
  successMessage = "Status updated successfully"
}: {
  value: string
  onValueChange: (value: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  successMessage?: string
}) {
  const statusOptions: InlineDropdownOption[] = [
    {
      value: 'pending',
      label: 'Pending',
      icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />
    },
    {
      value: 'active',
      label: 'Active',
      icon: <div className="w-2 h-2 bg-green-500 rounded-full" />
    },
    {
      value: 'inactive',
      label: 'Inactive',
      icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />
    },
    {
      value: 'completed',
      label: 'Completed',
      icon: <div className="w-2 h-2 bg-blue-500 rounded-full" />
    }
  ]

  return (
    <InlineDropdown
      value={value}
      onValueChange={onValueChange}
      options={statusOptions}
      disabled={disabled}
      className={className}
      successMessage={successMessage}
    />
  )
}

export function ContractStatusDropdown({
  value,
  onValueChange,
  disabled = false,
  className,
  successMessage = "Contract status updated successfully"
}: {
  value: string
  onValueChange: (value: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  successMessage?: string
}) {
  const statusOptions: InlineDropdownOption[] = [
    {
      value: 'active',
      label: 'Active',
      icon: <div className="w-2 h-2 bg-green-500 rounded-full" />
    },
    {
      value: 'inactive',
      label: 'Inactive',
      icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />
    },
    {
      value: 'draft',
      label: 'Draft',
      icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />
    },
    {
      value: 'expired',
      label: 'Expired',
      icon: <div className="w-2 h-2 bg-red-500 rounded-full" />
    }
  ]

  return (
    <InlineDropdown
      value={value}
      onValueChange={onValueChange}
      options={statusOptions}
      disabled={disabled}
      className={className}
      successMessage={successMessage}
    />
  )
}

export function ContractTypeDropdown({
  value,
  onValueChange,
  disabled = false,
  className,
  successMessage = "Contract type updated successfully"
}: {
  value: string
  onValueChange: (value: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  successMessage?: string
}) {
  const typeOptions: InlineDropdownOption[] = [
    {
      value: 'net_rate',
      label: 'Net Rate',
      description: 'Fixed net rate pricing'
    },
    {
      value: 'commissionable',
      label: 'Commissionable',
      description: 'Commission-based pricing'
    },
    {
      value: 'allocation',
      label: 'Allocation',
      description: 'Allocation-based pricing'
    }
  ]

  return (
    <InlineDropdown
      value={value}
      onValueChange={onValueChange}
      options={typeOptions}
      disabled={disabled}
      className={className}
      successMessage={successMessage}
    />
  )
}

export function DeadlineStatusDropdown({
  value,
  onValueChange,
  disabled = false,
  className,
  successMessage = "Deadline status updated successfully"
}: {
  value: string
  onValueChange: (value: string) => Promise<void> | void
  disabled?: boolean
  className?: string
  successMessage?: string
}) {
  const statusOptions: InlineDropdownOption[] = [
    {
      value: 'pending',
      label: 'Pending',
      icon: <div className="w-2 h-2 bg-yellow-500 rounded-full" />
    },
    {
      value: 'met',
      label: 'Met',
      icon: <div className="w-2 h-2 bg-green-500 rounded-full" />
    },
    {
      value: 'missed',
      label: 'Missed',
      icon: <div className="w-2 h-2 bg-red-500 rounded-full" />
    },
    {
      value: 'waived',
      label: 'Waived',
      icon: <div className="w-2 h-2 bg-gray-500 rounded-full" />
    }
  ]

  return (
    <InlineDropdown
      value={value}
      onValueChange={onValueChange}
      options={statusOptions}
      disabled={disabled}
      className={className}
      successMessage={successMessage}
    />
  )
}
