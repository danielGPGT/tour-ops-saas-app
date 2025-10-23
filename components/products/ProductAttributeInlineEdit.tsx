'use client'

import { useState } from 'react'
import { Check, X, Edit2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useUpdateProduct } from '@/lib/hooks/useProducts'
import type { Product } from '@/lib/types/product'

interface SelectOption {
  value: string
  label: string
}

interface ProductAttributeSelectProps {
  product: Product
  attributeField: string
  label: string
  options: SelectOption[]
  emptyValue?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface ProductAttributeNumberProps {
  product: Product
  attributeField: string
  label: string
  min?: number
  max?: number
  step?: number
  suffix?: string
  emptyValue?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

interface ProductAttributeMultiSelectProps {
  product: Product
  attributeField: string
  label: string
  options: SelectOption[]
  emptyValue?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Inline Select Editor
export function ProductAttributeSelect({
  product,
  attributeField,
  label,
  options,
  emptyValue = 'Not set',
  size = 'sm',
  className
}: ProductAttributeSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const updateProduct = useUpdateProduct()

  const currentValue = product.attributes?.[attributeField] as string
  const currentOption = options.find(opt => opt.value === currentValue)

  const handleUpdate = async (value: string) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          attributes: {
            ...product.attributes,
            [attributeField]: value
          }
        }
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating attribute:', error)
    }
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group inline-flex items-center gap-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors',
            sizeClasses[size],
            className
          )}
        >
          {currentOption ? (
            <Badge variant="outline" className="capitalize">
              {currentOption.label}
            </Badge>
          ) : (
            <span className="text-muted-foreground italic">{emptyValue}</span>
          )}
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground">Select a value</p>
          </div>
          <Select value={currentValue || ''} onValueChange={handleUpdate}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Inline Number Editor
export function ProductAttributeNumber({
  product,
  attributeField,
  label,
  min,
  max,
  step = 1,
  suffix,
  emptyValue = 'Not set',
  size = 'sm',
  className
}: ProductAttributeNumberProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState<number | undefined>(product.attributes?.[attributeField] as number)
  const updateProduct = useUpdateProduct()

  const currentValue = product.attributes?.[attributeField] as number

  const handleUpdate = async () => {
    if (value === currentValue) {
      setIsOpen(false)
      return
    }

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          attributes: {
            ...product.attributes,
            [attributeField]: value
          }
        }
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating attribute:', error)
    }
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group inline-flex items-center gap-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors',
            sizeClasses[size],
            className
          )}
        >
          {currentValue !== undefined ? (
            <span className="font-medium">
              {currentValue}{suffix && ` ${suffix}`}
            </span>
          ) : (
            <span className="text-muted-foreground italic">{emptyValue}</span>
          )}
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground">Enter a number</p>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => setValue(e.target.value ? Number(e.target.value) : undefined)}
              min={min}
              max={max}
              step={step}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="flex-1"
            />
            {suffix && <span className="flex items-center text-sm text-muted-foreground">{suffix}</span>}
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateProduct.isPending}>
              <Check className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Inline Multi-Select Editor (for amenities, etc.)
export function ProductAttributeMultiSelect({
  product,
  attributeField,
  label,
  options,
  emptyValue = 'None selected',
  size = 'sm',
  className
}: ProductAttributeMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>((product.attributes?.[attributeField] as string[]) || [])
  const updateProduct = useUpdateProduct()

  const currentValues = (product.attributes?.[attributeField] as string[]) || []

  const handleToggle = (value: string) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleUpdate = async () => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          attributes: {
            ...product.attributes,
            [attributeField]: selected
          }
        }
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating attribute:', error)
    }
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group inline-flex items-center gap-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors',
            sizeClasses[size],
            className
          )}
        >
          {currentValues.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {currentValues.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {options.find(opt => opt.value === value)?.label || value}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground italic">{emptyValue}</span>
          )}
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">{label}</h4>
            <p className="text-xs text-muted-foreground">Select multiple options</p>
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${attributeField}-${option.value}`}
                  checked={selected.includes(option.value)}
                  onCheckedChange={() => handleToggle(option.value)}
                />
                <Label
                  htmlFor={`${attributeField}-${option.value}`}
                  className="text-sm cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end border-t pt-3">
            <Button size="sm" variant="outline" onClick={() => {
              setSelected(currentValues)
              setIsOpen(false)
            }}>
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={updateProduct.isPending}>
              <Check className="h-3 w-3 mr-1" />
              Save ({selected.length})
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Star Rating Inline Editor (special case for hotels)
export function ProductStarRatingEdit({
  product,
  size = 'sm',
  className
}: {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number>(product.attributes?.star_rating as number || 0)
  const updateProduct = useUpdateProduct()

  const currentRating = product.attributes?.star_rating as number || 0

  const handleUpdate = async (newRating: number) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          attributes: {
            ...product.attributes,
            star_rating: newRating
          }
        }
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating star rating:', error)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'group inline-flex items-center gap-2 hover:bg-muted/50 rounded px-2 py-1 transition-colors',
            className
          )}
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={cn(
                  'text-lg',
                  i < currentRating ? 'text-yellow-400' : 'text-gray-300'
                )}
              >
                ★
              </span>
            ))}
            <span className="ml-2 text-sm font-medium">{currentRating}/5</span>
          </div>
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Star Rating</h4>
            <p className="text-xs text-muted-foreground">Click to set rating</p>
          </div>
          <div className="flex gap-1 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleUpdate(star)}
                onMouseEnter={() => setRating(star)}
                onMouseLeave={() => setRating(currentRating)}
                className="text-3xl hover:scale-110 transition-transform"
              >
                <span
                  className={cn(
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  )}
                >
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

