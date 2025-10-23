'use client'

import { useState, useCallback } from 'react'
import { Plus, X, Star, Upload, Image as ImageIcon, Edit2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useUpdateProduct } from '@/lib/hooks/useProducts'
import type { Product } from '@/lib/types/product'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

interface ProductImagesInlineEditProps {
  product: Product
  className?: string
}

interface ImageData {
  url: string
  alt: string
  is_primary: boolean
}

export function ProductImagesInlineEdit({
  product,
  className
}: ProductImagesInlineEditProps) {
  const [images, setImages] = useState<ImageData[]>(product.media || [])
  const [uploading, setUploading] = useState(false)
  const [editingAlt, setEditingAlt] = useState<number | null>(null)
  const [altText, setAltText] = useState('')
  const updateProduct = useUpdateProduct()

  const saveImages = async (newImages: ImageData[]) => {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          media: newImages
        }
      })
      setImages(newImages)
    } catch (error) {
      console.error('Error updating images:', error)
      toast.error('Failed to update images')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    try {
      const newImageData = acceptedFiles.map((file, index) => ({
        url: URL.createObjectURL(file),
        alt: file.name.replace(/\.[^/.]+$/, ''),
        is_primary: images.length === 0 && index === 0
      }))

      const updatedImages = [...images, ...newImageData]
      await saveImages(updatedImages)
      toast.success(`${acceptedFiles.length} image(s) added`)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }, [images])

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

  const removeImage = async (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    
    if (images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    await saveImages(newImages)
    toast.success('Image removed')
  }

  const setPrimaryImage = async (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }))
    await saveImages(newImages)
    toast.success('Primary image updated')
  }

  const saveAlt = async (index: number) => {
    const newImages = [...images]
    newImages[index].alt = altText
    await saveImages(newImages)
    setEditingAlt(null)
    setAltText('')
    toast.success('Alt text updated')
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-2">
        {images.map((image, index) => (
          <div key={index} className="group relative aspect-square rounded-md overflow-hidden bg-muted border border-transparent hover:border-primary/50 transition-all">
            <img
              src={image.url}
              alt={image.alt || `Product image ${index + 1}`}
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
                        setAltText(image.alt)
                      }}
                    >
                      <Edit2 className="h-3 w-3 text-primary-foreground" /> <span className="ml-1 text-xs text-primary-foreground font-medium">Edit alt text</span>
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
              "aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-xs text-muted-foreground">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 p-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">Add</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {isDragActive ? 'Drop' : 'Click'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Info & Stats */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>{images.length} / 5 images</span>
          <span className="text-right">Max 5MB • JPG, PNG, WebP</span>
        </div>
      )}
      
      {/* Empty State */}
      {images.length === 0 && (
        <div
          {...getRootProps()}
          className={cn(
            "rounded-md border-2 border-dashed p-6 text-center cursor-pointer transition-all",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5">
                {uploading ? 'Uploading...' : 'Add Images'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isDragActive 
                  ? 'Drop here' 
                  : 'Drag & drop or click to browse'
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

