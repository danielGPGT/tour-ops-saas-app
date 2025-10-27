import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface UploadedImage {
  url: string
  alt: string
  is_primary: boolean
}

export class StorageService {
  private static bucketName = 'product_images'

  // Upload a single image file
  static async uploadImage(
    file: File, 
    productId: string, 
    isPrimary: boolean = false
  ): Promise<UploadedImage> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      // Upload file to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName)

      return {
        url: urlData.publicUrl,
        alt: file.name,
        is_primary: isPrimary
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  // Upload multiple images from File objects
  static async uploadImages(
    files: File[], 
    productId: string
  ): Promise<UploadedImage[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, productId, index === 0) // First image is primary
      )
      
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images:', error)
      throw error
    }
  }

  // Upload images from preview URLs (used after product creation)
  static async uploadImagesFromPreview(
    images: Array<{ url: string; alt: string; is_primary: boolean }>, 
    productId: string
  ): Promise<UploadedImage[]> {
    try {
      // Filter out images that are already uploaded (have http/https URLs)
      const previewImages = images.filter(img => img.url.startsWith('blob:'))
      
      if (previewImages.length === 0) {
        return images // Return original images if no preview URLs
      }

      // Convert blob URLs back to files and upload
      const uploadPromises = previewImages.map(async (image, index) => {
        try {
          // Convert blob URL to file
          const response = await fetch(image.url)
          const blob = await response.blob()
          const file = new File([blob], image.alt, { type: blob.type })
          
          return await this.uploadImage(file, productId, image.is_primary)
        } catch (error) {
          console.error(`Error uploading image ${image.alt}:`, error)
          // Return original image if upload fails
          return image
        }
      })
      
      const uploadedImages = await Promise.all(uploadPromises)
      
      // Combine uploaded images with existing images
      return images.map(img => {
        if (img.url.startsWith('blob:')) {
          const uploaded = uploadedImages.find(uploaded => uploaded.alt === img.alt)
          return uploaded || img
        }
        return img
      })
    } catch (error) {
      console.error('Error uploading images from preview:', error)
      throw error
    }
  }

  // Upload images directly from File objects and return storage paths
  static async uploadImagesToStorage(
    files: File[], 
    productId: string
  ): Promise<UploadedImage[]> {
    try {
      await this.ensureBucketExists()
      
      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, productId, index === 0) // First image is primary
      )
      
      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images to storage:', error)
      throw error
    }
  }

  // Delete an image
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const productId = urlParts[urlParts.length - 2]
      const filePath = `${productId}/${fileName}`

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath])

      if (error) {
        throw new Error(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  // Check if storage bucket exists and create if needed
  static async ensureBucketExists(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName)
      
      if (!bucketExists) {
        console.log(`Bucket "${this.bucketName}" not found. Please create it manually in Supabase dashboard.`)
        console.log('Skipping bucket creation due to RLS policy restrictions.')
        // Don't throw error - just continue without creating bucket
      }
    } catch (error) {
      console.error('Error checking bucket existence:', error)
      // Don't throw error - just log and continue
    }
  }
}
