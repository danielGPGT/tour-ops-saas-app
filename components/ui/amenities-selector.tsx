'use client'

import { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AmenitiesSelectorProps {
  selectedAmenities: string[]
  onAmenitiesChange: (amenities: string[]) => void
  availableAmenities: string[]
  maxAmenities?: number
  className?: string
}

export function AmenitiesSelector({
  selectedAmenities = [],
  onAmenitiesChange,
  availableAmenities = [],
  maxAmenities = 20,
  className
}: AmenitiesSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close popover when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onAmenitiesChange(selectedAmenities.filter(a => a !== amenity))
    } else {
      if (selectedAmenities.length < maxAmenities) {
        onAmenitiesChange([...selectedAmenities, amenity])
      }
    }
  }

  const removeAmenity = (amenity: string) => {
    onAmenitiesChange(selectedAmenities.filter(a => a !== amenity))
  }

  const unselectedAmenities = availableAmenities.filter(
    amenity => !selectedAmenities.includes(amenity)
  )

  return (
    <div ref={containerRef} className={cn('space-y-2', className)}>
      {/* Selected Amenities */}
      {selectedAmenities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedAmenities.map((amenity) => (
            <Badge
              key={amenity}
              variant="secondary"
              className="text-xs px-2 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={() => removeAmenity(amenity)}
            >
              {amenity}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Add Amenities Button */}
      {unselectedAmenities.length > 0 && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 text-xs px-2"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Amenities
          </Button>

          {/* Amenities Grid */}
          {isOpen && (
            <div className="absolute top-8 left-0 z-10 bg-background border rounded-md shadow-lg p-2 max-w-xs">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-muted-foreground">Select amenities</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-4 w-4 p-0 hover:bg-muted"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {unselectedAmenities.slice(0, 12).map((amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleAmenity(amenity)
                      if (selectedAmenities.length + 1 >= maxAmenities) {
                        setIsOpen(false)
                      }
                    }}
                    className="h-6 text-xs px-2 justify-start hover:bg-primary hover:text-primary-foreground"
                    disabled={selectedAmenities.length >= maxAmenities}
                  >
                    {amenity}
                  </Button>
                ))}
              </div>
              {unselectedAmenities.length > 12 && (
                <p className="text-xs text-muted-foreground mt-1">
                  +{unselectedAmenities.length - 12} more
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Counter */}
      <p className="text-xs text-muted-foreground">
        {selectedAmenities.length}/{maxAmenities} amenities selected
      </p>
    </div>
  )
}
