'use client'

import { useState } from 'react'
import { Plus, X, Check, Tag as TagIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useUpdateProduct } from '@/lib/hooks/useProducts'
import type { Product } from '@/lib/types/product'

interface ProductTagsEditProps {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProductTagsEdit({
  product,
  size = 'sm',
  className
}: ProductTagsEditProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tags, setTags] = useState<string[]>(product.tags || [])
  const [newTag, setNewTag] = useState('')
  const updateProduct = useUpdateProduct()

  const currentTags = product.tags || []

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase()
    
    if (!trimmedTag) return
    
    // Don't add duplicates
    if (tags.includes(trimmedTag)) {
      setNewTag('')
      return
    }

    setTags([...tags, trimmedTag])
    setNewTag('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleUpdate = async () => {
    if (JSON.stringify(tags) === JSON.stringify(currentTags)) {
      setIsOpen(false)
      return
    }

    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          tags: tags
        }
      })
      setIsOpen(false)
    } catch (error) {
      console.error('Error updating tags:', error)
    }
  }

  const handleCancel = () => {
    setTags(currentTags)
    setNewTag('')
    setIsOpen(false)
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
            'group w-full text-left hover:bg-muted/50 rounded px-2 py-1 transition-colors',
            sizeClasses[size],
            className
          )}
        >
          {currentTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {currentTags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
              <Badge variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="h-3 w-3 mr-1" />
                Edit
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground italic text-sm">No tags - click to add</span>
              <Plus className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              <h4 className="font-medium text-sm">Product Tags</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Add tags to help categorize and search for this product
            </p>
          </div>

          {/* Tag input */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a tag and press Enter"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Current tags in editor */}
          {tags.length > 0 && (
            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="group cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:bg-destructive-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Click the × to remove a tag
              </p>
            </div>
          )}

          {tags.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground border rounded-md border-dashed">
              No tags yet. Add your first tag above.
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 justify-between items-center border-t pt-3">
            <div className="text-xs text-muted-foreground">
              {tags.length} {tags.length === 1 ? 'tag' : 'tags'}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={updateProduct.isPending || JSON.stringify(tags) === JSON.stringify(currentTags)}
              >
                <Check className="h-3 w-3 mr-1" />
                Save Tags
              </Button>
            </div>
          </div>

          {/* Suggestions (optional) */}
          <div className="border-t pt-3">
            <p className="text-xs font-medium mb-2">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {['popular', 'featured', 'seasonal', 'best-seller', 'new'].map((suggestion) => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => {
                    if (!tags.includes(suggestion)) {
                      setTags([...tags, suggestion])
                    }
                  }}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

