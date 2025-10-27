'use client'

import { UseFormReturn } from 'react-hook-form'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { Product } from '@/lib/types/product'
import type { AccommodationOptionFormData } from '@/lib/validations/product-option.schema'
import { ProductOptionAttributesForm } from '@/components/products/ProductOptionAttributesForm'

interface OptionDetailsStepProps {
  form: UseFormReturn<AccommodationOptionFormData>
  product: Product
  onSubmit: (data: AccommodationOptionFormData) => void | Promise<void>
  isSubmitting: boolean
}

export function OptionDetailsStep({ form, product, onSubmit, isSubmitting }: OptionDetailsStepProps) {
  // Generate code from name
  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9-]/g, '')
      .substring(0, 50)
  }

  const productTypeCode = product.product_type?.type_code || ''
  
  // Watch attributes for debugging
  const attributes = form.watch('attributes')
  console.log('👀 Current form attributes:', attributes)

  const handleFormSubmit = (data: any) => {
    console.log('🎯 Form submit handler - received data:', data)
    onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          
          <FormField
            control={form.control}
            name="option_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Standard Room - 3 nights"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      // Auto-generate code if not set
                      if (!form.getValues('option_code')) {
                        const generatedCode = generateCode(e.target.value)
                        form.setValue('option_code', generatedCode)
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  A descriptive name for this product option
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="option_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option Code *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., STD-3N"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  A unique code for this option (auto-generated from name)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional details about this option..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional description to help identify this option
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Product Option Attributes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Option Details</h3>
          <p className="text-sm text-muted-foreground">
            Configure specific details for this product option
          </p>
          
          <ProductOptionAttributesForm
            productType={productTypeCode}
            form={form}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  When disabled, this option won't be available for selection
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Next: Configure Pricing'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
