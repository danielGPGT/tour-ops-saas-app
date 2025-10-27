'use client'

import { useState, useCallback } from 'react'
import { Plus, X, Star, Upload, Image as ImageIcon, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { StorageService } from '@/lib/storage'

interface ProductOptionImagesInlineEditProps {
  images: Array<{
    url: string
    alt?: string
    is_primary?: boolean
  }>
  onImagesChange: (images: Array<{
    url: string
    alt?: string
    is_primary?: boolean
  }>) => void
  productId: string
  className?: string
}

export function ProductOptionImagesInlineEdit({
  images = [],
  onImagesChange,
  productId,
  className
}: ProductOptionImagesInlineEditProps) {
  const [uploading, setUploading] = useState(false)
  const [editingAlt, setEditingAlt] = useState<number | null>(null)
  const [altText, setAltText] = useState('')

  const saveImages = (newImages: typeof images) => {
    onImagesChange(newImages)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    try {
      // Upload files to Supabase Storage
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        try {
          const uploadedImage = await StorageService.uploadImage(
            file,
            productId,
            images.length === 0 && index === 0
          )
          return {
            url: uploadedImage.url,
            alt: uploadedImage.alt,
            is_primary: uploadedImage.is_primary
          }
        } catch (error) {
          console.error(`Error uploading image ${file.name}:`, error)
          throw error
        }
      })

      const uploadedImages = await Promise.all(uploadPromises)
      const updatedImages = [...images, ...uploadedImages]
      
      saveImages(updatedImages)
      toast.success(`${acceptedFiles.length} image(s) uploaded`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }, [images, productId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 5 - images.length,
    disabled: uploading || images.length >= 5,
    noClick: false,
    noKeyboard: false
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    
    if (images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    saveImages(newImages)
    toast.success('Image removed')
  }

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }))
    saveImages(newImages)
    toast.success('Primary image updated')
  }

  const saveAlt = (index: number) => {
    const newImages = [...images]
    newImages[index].alt = altText
    saveImages(newImages)
    setEditingAlt(null)
    setAltText('')
    toast.success('Alt text updated')
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Image Grid */}
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div key={index} className="group relative aspect-video rounded-md overflow-hidden bg-muted border border-transparent hover:border-primary/50 transition-all">
            <img
              src={image.url}
              alt={image.alt || `Option image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs font-medium flex items-center gap-0.5">
                <Star className="h-2.5 w-2.5 fill-current" />
                <span className="hidden sm:inline">Primary</span>
              </div>
            )}
            
            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Action Icons */}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {/* Alt Text */}
                <Popover open={editingAlt === index} onOpenChange={(open) => {
                  if (!open) {
                    setEditingAlt(null)
                    setAltText('')
                  }
                }}>
                  <PopoverTrigger asChild>
                    <button
                      className="rounded px-2 bg-primary/90 backdrop-blur-sm hover:bg-primary flex items-center justify-center transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingAlt(index)
                        setAltText(image.alt || '')
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-primary-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end" side="top">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Alt Text</h4>
                      <Input
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Describe image..."
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            saveAlt(index)
                          }
                          if (e.key === 'Escape') {
                            setEditingAlt(null)
                            setAltText('')
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setEditingAlt(null)
                            setAltText('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => saveAlt(index)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Delete */}
                <button
                  className="h-6 w-6 rounded bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-colors"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3 text-gray-700" />
                </button>
              </div>

              {/* Set Primary - Bottom Left */}
              {!image.is_primary && (
                <div className="absolute bottom-1.5 left-1.5">
                  <button
                    className="h-6 px-2 rounded bg-primary/90 backdrop-blur-sm hover:bg-primary flex items-center gap-1 transition-colors"
                    onClick={() => setPrimaryImage(index)}
                  >
                    <Star className="h-2.5 w-2.5 text-primary-foreground" />
                    <span className="text-xs text-primary-foreground font-medium">Set as primary</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Upload Box */}
        {images.length < 5 && (
          <div
            {...getRootProps()}
            className={cn(
              "aspect-video rounded-md border-2 border-dashed border-gray-300 hover:border-primary/50 cursor-pointer transition-colors flex items-center justify-center bg-muted/50",
              isDragActive && "border-primary bg-primary/5",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            <div className="text-center p-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
              <p className="text-xs font-medium text-muted-foreground">
                {uploading ? 'Uploading...' : 'Drop or click'}
              </p>
              <p className="text-xs text-muted-foreground">
                Max 5 images
              </p>
            </div>
          </div>
        )}
      </div>
      
      {images.length === 0 && (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-lg border-2 border-dashed border-gray-300 hover:border-primary/50 cursor-pointer transition-colors flex items-center justify-center bg-muted/50 p-8",
            isDragActive && "border-primary bg-primary/5",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              {uploading ? 'Uploading images...' : 'Drop images here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WebP (max 5MB each, up to 5 images)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
