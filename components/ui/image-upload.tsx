'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

export interface ImageFile {
  id: string
  file?: File
  url?: string
  alt_text?: string
  is_primary?: boolean
  preview?: string
}

interface ImageUploadProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  maxImages?: number
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  images = [],
  onChange,
  maxImages = 5,
  maxSize = 5,
  className,
  disabled = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`)
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const newImages: ImageFile[] = []

      for (const file of acceptedFiles) {
        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `product-images/${fileName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          toast.error(`Failed to upload ${file.name}. Storage bucket may not be set up.`)
          continue
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        const imageFile: ImageFile = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          url: urlData.publicUrl,
          preview: URL.createObjectURL(file),
          alt_text: file.name.split('.')[0],
          is_primary: images.length === 0 // First image is primary by default
        }

        newImages.push(imageFile)
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
        toast.success(`${newImages.length} image(s) uploaded successfully`)
      }
    } catch (error) {
      toast.error('Failed to upload images. Please check storage setup.')
      console.error('Image upload error:', error)
    } finally {
      setUploading(false)
    }
  }, [images, maxImages, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    disabled: disabled || uploading || images.length >= maxImages
  })

  const removeImage = async (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    if (!imageToRemove) return

    // Clean up preview URL
    if (imageToRemove.preview) {
      URL.revokeObjectURL(imageToRemove.preview)
    }

    // Delete from Supabase Storage if it has a URL
    if (imageToRemove.url) {
      try {
        const supabase = createClient()
        const fileName = imageToRemove.url.split('/').pop()
        if (fileName) {
          const { error } = await supabase.storage
            .from('product-images')
            .remove([`product-images/${fileName}`])
          
          if (error) {
            console.error('Error deleting image from storage:', error)
          }
        }
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
    
    const newImages = images.filter(img => img.id !== id)
    
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    onChange(newImages)
  }

  const setPrimary = (id: string) => {
    const newImages = images.map(img => ({
      ...img,
      is_primary: img.id === id
    }))
    onChange(newImages)
  }

  const updateAltText = (id: string, alt_text: string) => {
    const newImages = images.map(img => 
      img.id === id ? { ...img, alt_text } : img
    )
    onChange(newImages)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive && 'border-primary bg-primary/5',
          disabled || uploading || images.length >= maxImages
            ? 'border-muted bg-muted/50 cursor-not-allowed'
            : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="text-sm">
            {isDragActive ? (
              <p className="text-primary">Drop images here...</p>
            ) : (
              <div>
                <p className="text-muted-foreground">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {maxSize}MB max per image • Up to {maxImages} images
                </p>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                  <img
                    src={image.url || image.preview}
                    alt={image.alt_text || `Image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Image failed to load:', image.url || image.preview)
                      // Try the other source if one fails
                      if (image.url && image.preview) {
                        e.currentTarget.src = image.preview
                      }
                    }}
                  />
                  
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <Badge className="absolute top-1 left-1 text-xs px-1 py-0">
                      Primary
                    </Badge>
                  )}
                  
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimary(image.id)}
                      disabled={image.is_primary}
                      className="h-7 w-7 p-0"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(image.id)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Alt Text Input */}
                <input
                  type="text"
                  value={image.alt_text || ''}
                  onChange={(e) => updateAltText(image.id, e.target.value)}
                  placeholder="Alt text..."
                  className="w-full mt-2 text-xs px-2 py-1 border rounded"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Info */}
      {images.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>
            {images.length}/{maxImages} images • Click the image icon to set as primary
          </span>
        </div>
      )}
    </div>
  )
}
