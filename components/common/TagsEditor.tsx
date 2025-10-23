"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tag, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagsEditorProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
  label?: string
  error?: string
}

export function TagsEditor({
  tags = [],
  onChange,
  placeholder = "Add a tag",
  maxTags = 50,
  className,
  disabled = false,
  label,
  error
}: TagsEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      setInputValue('')
      setIsAdding(false)
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setInputValue('')
      setIsAdding(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Prevent adding commas and semicolons as they can break tag parsing
    const cleanValue = value.replace(/[,;]/g, '')
    setInputValue(cleanValue)
  }

  const handleAddClick = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    } else {
      setIsAdding(true)
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    } else {
      setIsAdding(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="secondary" 
            className="flex items-center gap-1 px-2 py-1"
          >
            <Tag className="h-3 w-3" />
            <span>{tag}</span>
            {!disabled && (
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5 transition-colors"
                type="button"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag}</span>
              </button>
            )}
          </Badge>
        ))}
        
        {/* Add Tag Input/Button */}
        {!disabled && tags.length < maxTags && (
          <div className="flex items-center gap-1">
            {isAdding ? (
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                placeholder={placeholder}
                className="w-24 h-6 text-xs"
                autoFocus
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddClick}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Tag
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{tags.length} of {maxTags} tags</span>
        {tags.length >= maxTags && (
          <span className="text-amber-600">Maximum tags reached</span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}

// Preset tag suggestions component
interface TagSuggestionsProps {
  suggestions: string[]
  onSelect: (tag: string) => void
  disabled?: boolean
}

export function TagSuggestions({ suggestions, onSelect, disabled }: TagSuggestionsProps) {
  if (suggestions.length === 0 || disabled) return null

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">Suggestions</Label>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(suggestion)}
            className="h-6 px-2 text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Common tag suggestions for different product types
export const PRODUCT_TAG_SUGGESTIONS = {
  hotel: [
    'luxury', 'budget', 'boutique', 'resort', 'business', 'family-friendly',
    'beachfront', 'city-center', 'airport', 'spa', 'gym', 'pool', 'restaurant'
  ],
  event_ticket: [
    'concert', 'sports', 'theater', 'festival', 'exhibition', 'conference',
    'vip', 'general-admission', 'season-ticket', 'group-discount'
  ],
  tour: [
    'guided', 'self-guided', 'private', 'group', 'half-day', 'full-day',
    'cultural', 'adventure', 'food', 'historical', 'nature', 'city'
  ],
  transfer: [
    'airport', 'hotel', 'station', 'private', 'shared', 'luxury',
    'standard', 'express', 'scheduled', 'on-demand'
  ]
}

// Combined component with suggestions
interface TagsEditorWithSuggestionsProps extends TagsEditorProps {
  productType?: keyof typeof PRODUCT_TAG_SUGGESTIONS
  showSuggestions?: boolean
}

export function TagsEditorWithSuggestions({
  productType,
  showSuggestions = true,
  ...props
}: TagsEditorWithSuggestionsProps) {
  const suggestions = productType ? PRODUCT_TAG_SUGGESTIONS[productType] : []
  const [localTags, setLocalTags] = useState(props.tags)

  const handleTagSelect = (tag: string) => {
    if (!localTags.includes(tag) && localTags.length < (props.maxTags || 50)) {
      const newTags = [...localTags, tag]
      setLocalTags(newTags)
      props.onChange(newTags)
    }
  }

  const handleTagsChange = (tags: string[]) => {
    setLocalTags(tags)
    props.onChange(tags)
  }

  return (
    <div className="space-y-4">
      <TagsEditor
        {...props}
        tags={localTags}
        onChange={handleTagsChange}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <TagSuggestions
          suggestions={suggestions.filter(suggestion => !localTags.includes(suggestion))}
          onSelect={handleTagSelect}
          disabled={props.disabled}
        />
      )}
    </div>
  )
}
