"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  images: Array<{
    url: string
    alt: string
    is_primary: boolean
    file?: File // Store the actual file object
  }>
  onImagesChange: (images: Array<{
    url: string
    alt: string
    is_primary: boolean
    file?: File
  }>) => void
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    try {
      // Create preview URLs and store the actual file objects
      const newImages = acceptedFiles.map((file, index) => ({
        url: URL.createObjectURL(file),
        alt: file.name,
        is_primary: images.length === 0 && index === 0,
        file: file // Store the actual file object
      }))

      // Update the first image to be primary if it's the first one
      if (images.length === 0 && newImages.length > 0) {
        newImages[0].is_primary = true
      }

      onImagesChange([...images, ...newImages].slice(0, maxImages))
    } catch (error) {
      console.error('Error handling dropped files:', error)
    } finally {
      setUploading(false)
    }
  }, [images, onImagesChange, maxImages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: maxImages - images.length,
    disabled: disabled || uploading || images.length >= maxImages
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    
    // If we removed the primary image, make the first remaining image primary
    if (images[index]?.is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }
    
    onImagesChange(newImages)
  }

  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index
    }))
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              disabled || uploading || images.length >= maxImages ? "cursor-not-allowed opacity-50" : ""
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <Upload className="h-8 w-8 text-gray-400" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">
                  {uploading ? 'Uploading...' : 'Upload Product Images'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {images.length >= maxImages 
                    ? `Maximum ${maxImages} images reached`
                    : isDragActive 
                      ? 'Drop images here...' 
                      : `Drag and drop images here, or click to select files (${images.length}/${maxImages})`
                  }
                </p>
                
                {images.length < maxImages && !uploading && (
                  <Button type="button" variant="outline" disabled={disabled}>
                    <Plus className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>• Supported formats: JPG, PNG, WebP, AVIF</p>
            <p>• Maximum file size: 5MB per image</p>
            <p>• Recommended size: 1200x800 pixels</p>
            <p>• Maximum {maxImages} images</p>
          </div>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Badge */}
                  {image.is_primary && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      Primary
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryImage(index)}
                      disabled={image.is_primary}
                    >
                      {image.is_primary ? 'Primary' : 'Set Primary'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
