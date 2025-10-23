'use client'

import { useState } from 'react'
import { EntityInlineEdit, EntityNestedFieldEdit, EntityBooleanEdit } from '@/components/common/EntityInlineEdit'
import { useUpdateProduct } from '@/lib/hooks/useProducts'
import type { Product } from '@/lib/types/product'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ProductInlineEditProps {
  product: Product
  field: keyof Product
  label: string
  placeholder?: string
  className?: string
  emptyValue?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'underline' | 'card' | 'default'
  multiline?: boolean
  validation?: (value: string) => string | null
}

interface ProductNestedEditProps {
  product: Product
  field: 'location' | 'attributes'
  nestedField: string
  label: string
  placeholder?: string
  className?: string
  emptyValue?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'underline' | 'card' | 'default'
  multiline?: boolean
  validation?: (value: string) => string | null
}

interface ProductStatusEditProps {
  product: Product
  size?: 'sm' | 'md' | 'lg'
  variant?: 'minimal' | 'underline' | 'card' | 'default'
}

// Direct product field editing
export function ProductInlineEdit({
  product,
  field,
  label,
  placeholder,
  className,
  emptyValue,
  size,
  variant,
  multiline,
  validation
}: ProductInlineEditProps) {
  const updateProduct = useUpdateProduct()

  const handleUpdate = async (id: string, data: Partial<Product>) => {
    try {
      await updateProduct.mutateAsync({ id, data })
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  return (
    <EntityInlineEdit
      entity={product}
      field={field}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
      multiline={multiline}
      validation={validation}
    />
  )
}

// Location field editing (product.location.city, etc.)
export function ProductLocationEdit({
  product,
  nestedField,
  label,
  placeholder,
  className,
  emptyValue,
  size,
  variant,
  multiline,
  validation
}: ProductNestedEditProps) {
  const updateProduct = useUpdateProduct()

  const handleUpdate = async (id: string, data: Partial<Product>) => {
    try {
      await updateProduct.mutateAsync({ id, data })
    } catch (error) {
      console.error('Error updating product location:', error)
      throw error
    }
  }

  return (
    <EntityNestedFieldEdit
      entity={product}
      field="location"
      nestedField={nestedField}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
      multiline={multiline}
      validation={validation}
    />
  )
}

// Attributes field editing (product.attributes.star_rating, etc.)
export function ProductAttributeEdit({
  product,
  nestedField,
  label,
  placeholder,
  className,
  emptyValue,
  size,
  variant,
  multiline,
  validation
}: ProductNestedEditProps) {
  const updateProduct = useUpdateProduct()

  const handleUpdate = async (id: string, data: Partial<Product>) => {
    try {
      await updateProduct.mutateAsync({ id, data })
    } catch (error) {
      console.error('Error updating product attributes:', error)
      throw error
    }
  }

  return (
    <EntityNestedFieldEdit
      entity={product}
      field="attributes"
      nestedField={nestedField}
      onUpdate={handleUpdate}
      label={label}
      placeholder={placeholder}
      className={className}
      emptyValue={emptyValue}
      size={size}
      variant={variant}
      multiline={multiline}
      validation={validation}
    />
  )
}

// Status select dropdown (is_active)
export function ProductStatusEdit({
  product,
  size,
  variant
}: ProductStatusEditProps) {
  const updateProduct = useUpdateProduct()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleStatusChange = async (value: string) => {
    setIsSaving(true)
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        data: {
          is_active: value === 'active'
        }
      })
    } catch (error) {
      console.error('Error updating product status:', error)
    } finally {
      setIsSaving(false)
      setIsOpen(false)
    }
  }

  const currentValue = product.is_active ? 'active' : 'inactive'

  return (
    <Select 
      value={currentValue} 
      onValueChange={handleStatusChange}
      open={isOpen}
      onOpenChange={setIsOpen}
      disabled={isSaving}
    >
      <SelectTrigger className="bg-primary/10 border-none">
        <SelectValue>
          <span className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              product.is_active ? "bg-primary" : "bg-gray-400"
            )}></div>
            <span className={product.is_active ? "text-primary" : "text-muted-foreground"}>
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="active">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Active</span>
          </div>
        </SelectItem>
        <SelectItem value="inactive">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
            <span>Inactive</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

