'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronRight } from 'lucide-react'
import { useCreateProductOption, useUpdateProductOption } from '@/lib/hooks/useProductOptions'
import { useCreateSellingRate } from '@/lib/hooks/useProducts'
import { useAuth } from '@/lib/hooks/useAuth'
import { StorageService } from '@/lib/storage'
import { accommodationOptionSchema } from '@/lib/validations/product-option.schema'
import { sellingRateSchema, getDefaultRateBasis } from '@/lib/validations/selling-rate.schema'
import type { Product, ProductOption } from '@/lib/types/product'
import type { AccommodationOptionFormData } from '@/lib/validations/product-option.schema'
import type { SellingRateFormData } from '@/lib/validations/selling-rate.schema'
import { OptionDetailsStep } from './forms/option-details-step'
import { SellingRateStep } from './forms/selling-rate-step'

interface ProductOptionSellingRateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  option?: ProductOption | null
  onSuccess?: () => void
}

type FormStep = 'option' | 'rate'

export function ProductOptionSellingRateForm({
  open,
  onOpenChange,
  product,
  option,
  onSuccess
}: ProductOptionSellingRateFormProps) {
  const { profile } = useAuth()
  const [currentStep, setCurrentStep] = useState<FormStep>('option')
  const [createdOptionId, setCreatedOptionId] = useState<string | null>(null)
  
  const createOption = useCreateProductOption()
  const updateOption = useUpdateProductOption()
  const createSellingRate = useCreateSellingRate()
  
  const isEditing = !!option?.id
  const isEditingRate = currentStep === 'rate' && !!createdOptionId

  // Form for product option
  const optionForm = useForm<AccommodationOptionFormData>({
    resolver: zodResolver(accommodationOptionSchema),
    defaultValues: {
      option_name: '',
      option_code: '',
      description: '',
      attributes: {},
      is_active: true
    }
  })

  // Reset form when dialog opens or option changes
  useEffect(() => {
    if (open) {
      if (option) {
        // Editing mode - load existing data
        console.log('📋 Loading option data for editing:', option)
        optionForm.reset({
          option_name: option.option_name,
          option_code: option.option_code,
          description: option.description || '',
          attributes: option.attributes || {},
          is_active: option.is_active ?? true
        })
        console.log('✅ Form reset with option data')
      } else {
        // Create mode - reset to defaults
        console.log('📝 Reset form for new option')
        optionForm.reset({
          option_name: '',
          option_code: '',
          description: '',
          attributes: {},
          is_active: true
        })
      }
      setCurrentStep('option')
      setCreatedOptionId(null)
    }
  }, [open, option?.id, optionForm])

  // Form for selling rate
  const rateForm = useForm<SellingRateFormData>({
    resolver: zodResolver(sellingRateSchema),
    defaultValues: {
      rate_name: '',
      rate_basis: getDefaultRateBasis(product.product_type?.type_code || ''),
      valid_from: new Date(),
      valid_to: new Date(),
      base_price: 0,
      currency: 'GBP',
      markup_type: null,
      markup_amount: 0,
      target_cost: null,
      pricing_details: {
        minimum_nights: 3,
        maximum_nights: 14,
        daily_rates: {}
      },
      is_active: true
    }
  })

  // Handle option submission
  const onSubmitOption = async (data: AccommodationOptionFormData) => {
    try {
      // Get the latest form values to ensure we have the most up-to-date data
      const latestData = optionForm.getValues()
      console.log('📝 Submitting option data (from handler):', data)
      console.log('📝 Latest form values:', latestData)
      
      // Use latest form values instead of the handler data
      const dataToSubmit = { ...latestData }
      
      // Handle image uploads if there are images in attributes
      if (dataToSubmit.attributes?.images && Array.isArray(dataToSubmit.attributes.images)) {
        const images = dataToSubmit.attributes.images
        const imagesWithFiles = images.filter((img: any) => img.file) // Images that need uploading
        
        if (imagesWithFiles.length > 0) {
          console.log('📤 Uploading', imagesWithFiles.length, 'image(s) to storage...')
          
          // Upload images to Supabase Storage
          const uploadPromises = imagesWithFiles.map(async (image: any, index: number) => {
            try {
              const uploadedImage = await StorageService.uploadImage(
                image.file,
                product.id, // Use product ID for the storage path
                index === 0 // First image is primary
              )
              return uploadedImage
            } catch (error) {
              console.error(`Error uploading image ${image.alt}:`, error)
              return image // Return original on error
            }
          })
          
          const uploadedImages = await Promise.all(uploadPromises)
          
          // Combine uploaded images with already-uploaded images
          const alreadyUploadedImages = images.filter((img: any) => !img.file)
          dataToSubmit.attributes = {
            ...dataToSubmit.attributes,
            images: [...alreadyUploadedImages, ...uploadedImages]
          }
          
          console.log('✅ Images uploaded successfully')
        }
      }
      
      let savedOption: ProductOption

      if (isEditing) {
        console.log('✏️ Updating option:', option!.id)
        savedOption = await updateOption.mutateAsync({
          id: option!.id,
          data: dataToSubmit
        })
      } else {
        console.log('➕ Creating new option')
        savedOption = await createOption.mutateAsync({
          product_id: product.id,
          ...dataToSubmit
        })
      }

      console.log('✅ Saved option:', savedOption)
      setCreatedOptionId(savedOption.id)
      setCurrentStep('rate')
    } catch (error) {
      console.error('❌ Error saving option:', error)
    }
  }

  // Handle rate submission
  const onSubmitRate = async (data: SellingRateFormData) => {
    if (!profile?.organization_id) {
      console.error('No organization ID')
      return
    }

    if (!createdOptionId && !option?.id) {
      console.error('No product option ID')
      return
    }

    try {
      await createSellingRate.mutateAsync({
        organization_id: profile.organization_id,
        product_id: product.id,
        product_option_id: createdOptionId || option!.id,
        rate_name: data.rate_name || undefined,
        rate_basis: data.rate_basis,
        valid_from: data.valid_from.toISOString().split('T')[0],
        valid_to: data.valid_to.toISOString().split('T')[0],
        base_price: data.base_price,
        currency: data.currency,
        markup_type: data.markup_type || undefined,
        markup_amount: data.markup_amount || undefined,
        target_cost: data.target_cost || undefined,
        pricing_details: data.pricing_details || undefined,
        is_active: data.is_active
      })

      // Success
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving rate:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit' : 'Create'} Product Option & Selling Rate
          </DialogTitle>
          <DialogDescription>
            Configure the product option details and its pricing structure
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'option' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-primary/10 text-primary'
            }`}>
              {currentStep === 'option' ? '1' : <Check className="h-4 w-4" />}
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'option' ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Option Details
            </span>
          </div>
          
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'rate' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              2
            </div>
            <span className={`text-sm font-medium ${
              currentStep === 'rate' ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              Selling Rate
            </span>
          </div>
        </div>

        {/* Step content */}
        {currentStep === 'option' && (
          <OptionDetailsStep
            form={optionForm}
            product={product}
            onSubmit={onSubmitOption}
            isSubmitting={createOption.isPending || updateOption.isPending}
          />
        )}

        {currentStep === 'rate' && (
          <SellingRateStep
            form={rateForm}
            product={product}
            onSubmit={onSubmitRate}
            onBack={() => setCurrentStep('option')}
            isSubmitting={createSellingRate.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
