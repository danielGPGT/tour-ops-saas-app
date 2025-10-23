"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Check, X, Edit2, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnterpriseInlineEditProps {
  value: any
  type?: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'tags'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
  onSave: (value: any) => Promise<void> | void
  onCancel?: () => void
  disabled?: boolean
  multiline?: boolean
  rows?: number
  validation?: (value: any) => string | null
  formatValue?: (value: any) => string
  editIcon?: React.ReactNode
  saveIcon?: React.ReactNode
  cancelIcon?: React.ReactNode
}

export function EnterpriseInlineEdit({
  value,
  type = 'text',
  options = [],
  placeholder = 'Click to edit',
  className,
  onSave,
  onCancel,
  disabled = false,
  multiline = false,
  rows = 3,
  validation,
  formatValue,
  editIcon = <Edit2 className="h-3 w-3" />,
  saveIcon = <Save className="h-3 w-3" />,
  cancelIcon = <X className="h-3 w-3" />
}: EnterpriseInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing) {
      if (type === 'textarea' && textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.select()
      } else if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
    setError(null)
  }

  const handleSave = async () => {
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    setIsLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
    onCancel?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  const renderDisplayValue = () => {
    if (formatValue) {
      return formatValue(value)
    }

    if (type === 'tags' && Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground">No tags</span>
      }
      return (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {value.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 3} more
            </Badge>
          )}
        </div>
      )
    }

    if (type === 'select' && options.length > 0) {
      const option = options.find(opt => opt.value === value)
      return option ? option.label : value
    }

    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">{placeholder}</span>
    }

    return String(value)
  }

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={rows}
            className={cn('min-h-[80px]', error && 'border-red-500')}
          />
        )
      case 'select':
        return (
          <Select
            value={editValue}
            onValueChange={setEditValue}
          >
            <SelectTrigger className={cn(error && 'border-red-500')}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(error && 'border-red-500')}
          />
        )
      case 'date':
        return (
          <Input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(error && 'border-red-500')}
          />
        )
      default:
        return (
          <Input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(error && 'border-red-500')}
          />
        )
    }
  }

  if (isEditing) {
    return (
      <div className={cn('space-y-2', className)}>
        {renderInput()}
          {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
            className="h-8 px-2"
          >
            {saveIcon}
            <span className="sr-only">Save</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-8 px-2"
          >
            {cancelIcon}
            <span className="sr-only">Cancel</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        'group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      onClick={handleEdit}
    >
      <div className="flex-1 min-w-0">
        {renderDisplayValue()}
      </div>
      {!disabled && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            {editIcon}
            <span className="sr-only">Edit</span>
          </Button>
      </div>
      )}
    </div>
  )
}

// Specialized components for common use cases
export function InlineTextEdit({ value, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="text" value={value} onSave={onSave} {...props} />
}

export function InlineTextareaEdit({ value, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="textarea" value={value} onSave={onSave} {...props} />
}

export function InlineSelectEdit({ value, options, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="select" value={value} options={options} onSave={onSave} {...props} />
}

export function InlineNumberEdit({ value, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="number" value={value} onSave={onSave} {...props} />
}

export function InlineDateEdit({ value, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="date" value={value} onSave={onSave} {...props} />
}

export function InlineTagsEdit({ value, onSave, ...props }: Omit<EnterpriseInlineEditProps, 'type'>) {
  return <EnterpriseInlineEdit type="tags" value={value} onSave={onSave} {...props} />
}