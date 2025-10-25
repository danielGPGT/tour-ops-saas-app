# Cursor Prompt: Product Options CRUD System

## Context

I'm building a tour operator platform with Next.js 14, TypeScript, Supabase, and shadcn/ui. I need a complete CRUD system for **Product Options** - the variants/configurations of products that customers actually book.

For example:
- **Hotel** → Room types (Deluxe Double, Executive Suite)
- **Event** → Ticket categories (VIP, General Admission, Early Bird)
- **Transfer** → Vehicle types (Sedan, SUV, Minibus)
- **Activity** → Experience variants (Group Tour, Private Tour, Self-Guided)
- **Extra** → Service variants (Airport Meet & Greet, Travel Insurance)

---

## Product Types

We have 5 product types in the system:

1. **accommodation** - Hotels, resorts, apartments
2. **event** - Events, tickets, passes
3. **transfer** - Transfers, transportation
4. **activity** - Activities, experiences, tours
5. **extra** - Extras, add-ons, services

---

## Database Schema

### **products**
```typescript
{
  id: UUID
  organization_id: UUID
  product_type: 'accommodation' | 'event' | 'transfer' | 'activity' | 'extra'
  name: STRING
  code: STRING
  description: TEXT
  location: JSONB
  attributes: JSONB  // Type-specific
  is_active: BOOLEAN
}
```

### **product_options**
```typescript
{
  id: UUID
  product_id: UUID
  option_name: STRING           // "Deluxe Room Double", "VIP Ticket", "Private SUV"
  option_code: STRING           // "DLX-DBL", "VIP-TKT", "SUV-PRV"
  description: TEXT
  
  // Occupancy (for accommodation, transfer, activity)
  standard_occupancy: INTEGER   // Standard number of people
  max_occupancy: INTEGER        // Maximum people allowed
  
  // Accommodation-specific
  bed_configuration: STRING     // "1 King Bed", "2 Queen Beds"
  room_size_sqm: NUMERIC
  view_type: STRING            // "Sea View", "City View", "Garden View"
  floor_range: STRING          // "1-5", "6-10", "Penthouse"
  
  // Event-specific
  ticket_type: STRING          // "seated", "standing", "vip_lounge"
  section: STRING              // "Main Stand", "South Stand", "VIP Section"
  seat_details: STRING         // "Row 10, Seats 5-8"
  access_level: STRING         // "General", "VIP", "Backstage"
  
  // Transfer-specific
  vehicle_type: STRING         // "sedan", "suv", "van", "bus", "luxury"
  max_passengers: INTEGER
  max_luggage: INTEGER
  vehicle_features: STRING[]   // ["wifi", "child_seat", "wheelchair_accessible"]
  
  // Activity-specific
  experience_type: STRING      // "group", "private", "self_guided"
  min_group_size: INTEGER
  max_group_size: INTEGER
  duration_hours: NUMERIC
  difficulty_level: STRING     // "easy", "moderate", "challenging", "extreme"
  
  // Extra-specific
  extra_type: STRING           // "insurance", "visa", "equipment", "service"
  unit_type: STRING            // "per_person", "per_booking", "per_day"
  is_mandatory: BOOLEAN        // Some extras may be required
  
  // Pricing hints (informational only, actual rates in separate tables)
  base_price_hint: NUMERIC     // Optional display price
  currency: STRING
  
  // Common fields
  attributes: JSONB            // Additional flexible attributes
  images: JSONB                // Option-specific images
  sort_order: INTEGER
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

---

## Type-Specific Attributes

### **Accommodation Options**
```typescript
{
  bed_configuration: string      // "1 King Bed", "2 Single Beds"
  room_size_sqm: number
  view_type: string             // "Sea View", "City View"
  floor_range: string           // "1-5", "High Floor"
  standard_occupancy: number    // 2
  max_occupancy: number         // 3 (with extra bed)
  amenities: string[]           // ["balcony", "kitchenette", "bathtub"]
}
```

### **Event Options (Tickets/Passes)**
```typescript
{
  ticket_type: string           // "seated", "standing", "vip_lounge"
  section: string               // "Main Grandstand", "North Stand"
  seat_details: string          // "Row 10, Seats 5-8"
  access_level: string          // "General", "VIP", "Hospitality"
  includes: string[]            // ["pit_lane_walk", "team_radio", "buffet"]
  max_occupancy: number         // 1 (ticket is per person)
}
```

### **Transfer Options**
```typescript
{
  vehicle_type: string          // "sedan", "suv", "van", "luxury"
  max_passengers: number        // 4, 6, 12
  max_luggage: number          // 3, 6, 10
  vehicle_features: string[]    // ["wifi", "child_seat", "wheelchair"]
  standard_occupancy: number    // Typical passengers
  vehicle_class: string         // "economy", "business", "luxury"
}
```

### **Activity Options**
```typescript
{
  experience_type: string       // "group", "private", "self_guided"
  min_group_size: number        // 4
  max_group_size: number        // 20
  duration_hours: number        // 3.5
  difficulty_level: string      // "easy", "moderate", "challenging"
  standard_occupancy: number    // Typical group size
  max_occupancy: number         // Maximum participants
  includes: string[]            // ["guide", "equipment", "lunch"]
}
```

### **Extra Options**
```typescript
{
  extra_type: string            // "insurance", "visa", "equipment"
  unit_type: string             // "per_person", "per_booking", "per_day"
  is_mandatory: boolean         // Some extras required
  coverage_details: string      // For insurance
  validity_days: number         // How long it's valid
  standard_occupancy: number    // Usually 1 for per-person extras
}
```

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **Backend**: Supabase (PostgreSQL + RLS)
- **State**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table

---

## Existing Common Components

Use these from `src/components/common/`:
- **DataTable** - Table with sorting, filtering
- **InlineDropdown** - Dropdown with auto-save
- **EnterpriseInlineEdit** - Inline text editing
- **StatusBadge** - Colored badge
- **LoadingSkeleton** - Loading state
- **Dialog** - Modal dialogs
- **Sheet** - Slide-out panels
- **Button** - Buttons
- **Input** - Text inputs
- **Select** - Dropdowns
- **Textarea** - Multi-line text
- **Checkbox** - Checkboxes
- **Label** - Form labels
- **Card** - Content cards

---

## Project Structure

Create these files:

```
src/
├── app/(dashboard)/products/[id]/
│   └── options/
│       └── page.tsx                    // Options management page
├── components/product-options/
│   ├── options-table.tsx               // Table showing all options
│   ├── option-form-dialog.tsx          // Add/Edit dialog
│   ├── option-form-accommodation.tsx   // Accommodation-specific form
│   ├── option-form-event.tsx           // Event-specific form
│   ├── option-form-transfer.tsx        // Transfer-specific form
│   ├── option-form-activity.tsx        // Activity-specific form
│   ├── option-form-extra.tsx           // Extra-specific form
│   ├── option-card.tsx                 // Option display card
│   └── delete-option-dialog.tsx        // Delete confirmation
├── hooks/
│   └── useProductOptions.ts            // React Query hooks
├── lib/
│   ├── queries/
│   │   └── product-options.ts          // Database queries
│   └── validations/
│       └── product-option.schema.ts    // Zod schemas
└── types/
    └── product-option.ts               // TypeScript types
```

---

## TASK 1: Create TypeScript Types

**File: `src/types/product-option.ts`**

```typescript
export type ProductType = 'accommodation' | 'event' | 'transfer' | 'activity' | 'extra'

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  description?: string
  
  // Occupancy
  standard_occupancy: number
  max_occupancy: number
  
  // Accommodation
  bed_configuration?: string
  room_size_sqm?: number
  view_type?: string
  floor_range?: string
  
  // Event
  ticket_type?: string
  section?: string
  seat_details?: string
  access_level?: string
  
  // Transfer
  vehicle_type?: string
  max_passengers?: number
  max_luggage?: number
  vehicle_features?: string[]
  
  // Activity
  experience_type?: string
  min_group_size?: number
  max_group_size?: number
  duration_hours?: number
  difficulty_level?: string
  
  // Extra
  extra_type?: string
  unit_type?: string
  is_mandatory?: boolean
  
  // Common
  base_price_hint?: number
  currency?: string
  attributes?: any
  images?: Array<{
    url: string
    alt: string
    is_primary: boolean
  }>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form data types for each product type
export interface AccommodationOptionData {
  option_name: string
  option_code: string
  description?: string
  bed_configuration: string
  room_size_sqm?: number
  view_type?: string
  floor_range?: string
  standard_occupancy: number
  max_occupancy: number
  amenities?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

export interface EventOptionData {
  option_name: string
  option_code: string
  description?: string
  ticket_type: string
  section?: string
  seat_details?: string
  access_level: string
  includes?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

export interface TransferOptionData {
  option_name: string
  option_code: string
  description?: string
  vehicle_type: string
  max_passengers: number
  max_luggage: number
  vehicle_features?: string[]
  vehicle_class?: string
  standard_occupancy: number
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

export interface ActivityOptionData {
  option_name: string
  option_code: string
  description?: string
  experience_type: string
  min_group_size?: number
  max_group_size?: number
  duration_hours: number
  difficulty_level: string
  standard_occupancy: number
  max_occupancy: number
  includes?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

export interface ExtraOptionData {
  option_name: string
  option_code: string
  description?: string
  extra_type: string
  unit_type: string
  is_mandatory?: boolean
  coverage_details?: string
  validity_days?: number
  base_price_hint?: number
  currency?: string
  is_active: boolean
}
```

---

## TASK 2: Create Validation Schemas

**File: `src/lib/validations/product-option.schema.ts`**

```typescript
import { z } from 'zod'

// Base schema (common fields)
const baseOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name must be at least 2 characters'),
  option_code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  description: z.string().optional(),
  base_price_hint: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().default(true)
})

// Accommodation option schema
export const accommodationOptionSchema = baseOptionSchema.extend({
  bed_configuration: z.string().min(1, 'Bed configuration is required'),
  room_size_sqm: z.number().min(1).max(500).optional(),
  view_type: z.string().optional(),
  floor_range: z.string().optional(),
  standard_occupancy: z.number().int().min(1).max(20),
  max_occupancy: z.number().int().min(1).max(20),
  amenities: z.array(z.string()).optional()
}).refine(data => data.max_occupancy >= data.standard_occupancy, {
  message: 'Max occupancy must be >= standard occupancy',
  path: ['max_occupancy']
})

// Event option schema
export const eventOptionSchema = baseOptionSchema.extend({
  ticket_type: z.enum(['seated', 'standing', 'vip_lounge', 'hospitality', 'general']),
  section: z.string().optional(),
  seat_details: z.string().optional(),
  access_level: z.enum(['general', 'vip', 'premium', 'hospitality', 'backstage']),
  includes: z.array(z.string()).optional()
})

// Transfer option schema
export const transferOptionSchema = baseOptionSchema.extend({
  vehicle_type: z.enum(['sedan', 'suv', 'van', 'minibus', 'bus', 'luxury', 'limousine']),
  max_passengers: z.number().int().min(1).max(60),
  max_luggage: z.number().int().min(0).max(100),
  vehicle_features: z.array(z.string()).optional(),
  vehicle_class: z.enum(['economy', 'business', 'luxury', 'premium']).optional(),
  standard_occupancy: z.number().int().min(1).max(60)
}).refine(data => data.max_passengers >= data.standard_occupancy, {
  message: 'Max passengers must be >= standard occupancy',
  path: ['max_passengers']
})

// Activity option schema
export const activityOptionSchema = baseOptionSchema.extend({
  experience_type: z.enum(['group', 'private', 'self_guided', 'shared']),
  min_group_size: z.number().int().min(1).optional(),
  max_group_size: z.number().int().min(1).optional(),
  duration_hours: z.number().min(0.5).max(168), // Up to 7 days
  difficulty_level: z.enum(['easy', 'moderate', 'challenging', 'extreme']),
  standard_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  includes: z.array(z.string()).optional()
}).refine(data => {
  if (data.min_group_size && data.max_group_size) {
    return data.max_group_size >= data.min_group_size
  }
  return true
}, {
  message: 'Max group size must be >= min group size',
  path: ['max_group_size']
})

// Extra option schema
export const extraOptionSchema = baseOptionSchema.extend({
  extra_type: z.enum(['insurance', 'visa', 'equipment', 'service', 'upgrade', 'other']),
  unit_type: z.enum(['per_person', 'per_booking', 'per_day', 'per_item']),
  is_mandatory: z.boolean().default(false),
  coverage_details: z.string().optional(),
  validity_days: z.number().int().min(1).optional()
})

// Export types
export type AccommodationOptionFormData = z.infer<typeof accommodationOptionSchema>
export type EventOptionFormData = z.infer<typeof eventOptionSchema>
export type TransferOptionFormData = z.infer<typeof transferOptionSchema>
export type ActivityOptionFormData = z.infer<typeof activityOptionSchema>
export type ExtraOptionFormData = z.infer<typeof extraOptionSchema>
```

---

## TASK 3: Create Database Queries

**File: `src/lib/queries/product-options.ts`**

```typescript
import { createClient } from '@/lib/supabase/client'
import type { ProductOption } from '@/types/product-option'

// Get all options for a product
export async function getProductOptions(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('option_name', { ascending: true })
  
  if (error) throw error
  return data as ProductOption[]
}

// Get single option
export async function getProductOption(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Create option
export async function createProductOption(option: Partial<ProductOption>) {
  const supabase = createClient()
  
  // Get max sort_order for this product
  const { data: maxSort } = await supabase
    .from('product_options')
    .select('sort_order')
    .eq('product_id', option.product_id!)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  
  const nextSortOrder = maxSort ? maxSort.sort_order + 1 : 0
  
  const { data, error } = await supabase
    .from('product_options')
    .insert({
      ...option,
      sort_order: option.sort_order ?? nextSortOrder
    })
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Update option
export async function updateProductOption(id: string, updates: Partial<ProductOption>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Delete option
export async function deleteProductOption(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('product_options')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Reorder options
export async function reorderProductOptions(productId: string, optionIds: string[]) {
  const supabase = createClient()
  
  // Update sort_order for each option
  const updates = optionIds.map((id, index) => ({
    id,
    sort_order: index
  }))
  
  for (const update of updates) {
    await supabase
      .from('product_options')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
  }
}

// Duplicate option
export async function duplicateProductOption(id: string) {
  const supabase = createClient()
  
  // Get original option
  const original = await getProductOption(id)
  
  // Create duplicate with modified name
  const { id: _, created_at, updated_at, ...duplicateData } = original
  
  return createProductOption({
    ...duplicateData,
    option_name: `${original.option_name} (Copy)`,
    option_code: `${original.option_code}-COPY`
  })
}
```

---

## TASK 4: Create React Query Hooks

**File: `src/hooks/useProductOptions.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as productOptionQueries from '@/lib/queries/product-options'
import type { ProductOption } from '@/types/product-option'
import { toast } from 'sonner'

export function useProductOptions(productId: string) {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: () => productOptionQueries.getProductOptions(productId),
    enabled: !!productId
  })
}

export function useProductOption(id: string) {
  return useQuery({
    queryKey: ['product-options', id],
    queryFn: () => productOptionQueries.getProductOption(id),
    enabled: !!id
  })
}

export function useCreateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ProductOption>) => 
      productOptionQueries.createProductOption(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      toast.success('Option created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create option')
    }
  })
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductOption> }) =>
      productOptionQueries.updateProductOption(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.id] 
      })
      toast.success('Option updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update option')
    }
  })
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      productOptionQueries.deleteProductOption(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', variables.productId] 
      })
      toast.success('Option deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete option')
    }
  })
}

export function useReorderProductOptions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, optionIds }: { productId: string; optionIds: string[] }) =>
      productOptionQueries.reorderProductOptions(productId, optionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', variables.productId] 
      })
      toast.success('Options reordered')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder options')
    }
  })
}

export function useDuplicateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      productOptionQueries.duplicateProductOption(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      toast.success('Option duplicated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate option')
    }
  })
}
```

---

## TASK 5: Build Options Management Page

**File: `src/app/(dashboard)/products/[id]/options/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useProduct } from '@/hooks/useProducts'
import { useProductOptions } from '@/hooks/useProductOptions'
import { Button } from '@/components/ui/button'
import { LoadingSkeleton } from '@/components/common/loading-skeleton'
import { PageHeader } from '@/components/common/page-header'
import { OptionsTable } from '@/components/product-options/options-table'
import { OptionFormDialog } from '@/components/product-options/option-form-dialog'

export default function ProductOptionsPage() {
  const params = useParams()
  const productId = params.id as string
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<any>(null)
  
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId)
  const { data: options, isLoading: isLoadingOptions } = useProductOptions(productId)
  
  if (isLoadingProduct || isLoadingOptions) {
    return <LoadingSkeleton />
  }
  
  if (!product) {
    return <div>Product not found</div>
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Options"
        description={`Manage options for ${product.name}`}
        breadcrumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name, href: `/products/${productId}` },
          { label: 'Options' }
        ]}
        actions={
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Option
          </Button>
        }
      />
      
      <OptionsTable
        options={options || []}
        productType={product.product_type}
        onEdit={setEditingOption}
      />
      
      <OptionFormDialog
        open={isAddDialogOpen || !!editingOption}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingOption(null)
          }
        }}
        productId={productId}
        productType={product.product_type}
        option={editingOption}
      />
    </div>
  )
}
```

---

## TASK 6: Build Options Table Component

**File: `src/components/product-options/options-table.tsx`**

Requirements:
- Use **DataTable** from common components
- Display columns based on product type:
  - **All types**: Code, Name, Status, Actions
  - **Accommodation**: Bed Config, Occupancy (2-3), Room Size
  - **Event**: Ticket Type, Section, Access Level
  - **Transfer**: Vehicle Type, Max Passengers, Max Luggage
  - **Activity**: Experience Type, Group Size, Duration, Difficulty
  - **Extra**: Extra Type, Unit Type, Mandatory
- Inline editing for:
  - Option name (EnterpriseInlineEdit)
  - Status (InlineDropdown - active/inactive)
  - Occupancy numbers (for applicable types)
- Actions dropdown:
  - Edit (opens dialog)
  - Duplicate
  - Delete (with confirmation)
- Drag handles for reordering (updates sort_order)
- Empty state when no options

---

## TASK 7: Build Main Option Form Dialog

**File: `src/components/product-options/option-form-dialog.tsx`**

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { OptionFormAccommodation } from './option-form-accommodation'
import { OptionFormEvent } from './option-form-event'
import { OptionFormTransfer } from './option-form-transfer'
import { OptionFormActivity } from './option-form-activity'
import { OptionFormExtra } from './option-form-extra'

interface OptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productType: 'accommodation' | 'event' | 'transfer' | 'activity' | 'extra'
  option?: any // Existing option if editing
}

export function OptionFormDialog({
  open,
  onOpenChange,
  productId,
  productType,
  option
}: OptionFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {option ? 'Edit Option' : 'Add New Option'}
          </DialogTitle>
        </DialogHeader>
        
        {productType === 'accommodation' && (
          <OptionFormAccommodation
            productId={productId}
            option={option}
            onSuccess={() => onOpenChange(false)}
          />
        )}
        
        {productType === 'event' && (
          <OptionFormEvent
            productId={productId}
            option={option}
            onSuccess={() => onOpenChange(false)}
          />
        )}
        
        {productType === 'transfer' && (
          <OptionFormTransfer
            productId={productId}
            option={option}
            onSuccess={() => onOpenChange(false)}
          />
        )}
        
        {productType === 'activity' && (
          <OptionFormActivity
            productId={productId}
            option={option}
            onSuccess={() => onOpenChange(false)}
          />
        )}
        
        {productType === 'extra' && (
          <OptionFormExtra
            productId={productId}
            option={option}
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## TASK 8: Build Accommodation Option Form

**File: `src/components/product-options/option-form-accommodation.tsx`**

Requirements:
- Use React Hook Form + Zod validation
- Fields:
  - **Option Name** (text input) *required
  - **Option Code** (text input, uppercase, auto-suggest from name) *required
  - **Description** (textarea)
  - **Bed Configuration** (dropdown or text) *required
    - Options: "1 King Bed", "2 Single Beds", "1 Queen Bed", "2 Queen Beds", "1 King + 1 Sofa Bed"
  - **Room Size** (number input with "sqm" label)
  - **View Type** (dropdown)
    - Options: "Sea View", "City View", "Garden View", "Pool View", "Mountain View", "No View"
  - **Floor Range** (text input)
    - Examples: "1-5", "6-10", "High Floor", "Penthouse"
  - **Standard Occupancy** (number input) *required
  - **Max Occupancy** (number input) *required
  - **Amenities** (multi-select or tag input)
    - Options: "Balcony", "Kitchenette", "Bathtub", "Walk-in Shower", "Sea View", "Coffee Machine"
  - **Base Price Hint** (currency input - optional, for reference only)
  - **Currency** (dropdown - USD, EUR, GBP, AED)
  - **Active** (toggle switch)
- Validation:
  - Max occupancy >= Standard occupancy
  - Option code must be uppercase alphanumeric
- Submit button: "Create Option" or "Update Option"
- Cancel button

---

## TASK 9: Build Event Option Form

**File: `src/components/product-options/option-form-event.tsx`**

Requirements:
- Fields:
  - **Option Name** (text) *required
    - Examples: "VIP Hospitality", "Main Grandstand", "General Admission"
  - **Option Code** (text, uppercase) *required
  - **Description** (textarea)
  - **Ticket Type** (radio buttons or dropdown) *required
    - Options: "Seated", "Standing", "VIP Lounge", "Hospitality", "General"
  - **Section** (text)
    - Examples: "Main Grandstand", "South Stand", "Pit Lane Club"
  - **Seat Details** (text)
    - Examples: "Row 10, Seats 5-8", "Block A", "Standing Area 3"
  - **Access Level** (dropdown) *required
    - Options: "General", "VIP", "Premium", "Hospitality", "Backstage"
  - **Includes** (multi-select tag input)
    - Examples: "Pit Lane Walk", "Team Radio", "Buffet Lunch", "Open Bar", "Paddock Access"
  - **Base Price Hint** (currency input)
  - **Currency** (dropdown)
  - **Active** (toggle)
- Note: Tickets are typically per person, so no occupancy fields needed
- Validation and submit/cancel buttons

---

## TASK 10: Build Transfer Option Form

**File: `src/components/product-options/option-form-transfer.tsx`**

Requirements:
- Fields:
  - **Option Name** (text) *required
    - Examples: "Private Sedan", "Shared Shuttle", "Luxury SUV"
  - **Option Code** (text, uppercase) *required
  - **Description** (textarea)
  - **Vehicle Type** (dropdown) *required
    - Options: "Sedan", "SUV", "Van", "Minibus", "Bus", "Luxury", "Limousine"
  - **Max Passengers** (number input) *required
  - **Max Luggage** (number input) *required
  - **Vehicle Class** (dropdown)
    - Options: "Economy", "Business", "Luxury", "Premium"
  - **Standard Occupancy** (number input) *required
    - Typical number of passengers for pricing
  - **Vehicle Features** (multi-select tag input)
    - Options: "WiFi", "Child Seat", "Wheelchair Accessible", "Air Conditioning", "USB Charging", "Water Bottles"
  - **Base Price Hint** (currency input)
  - **Currency** (dropdown)
  - **Active** (toggle)
- Validation:
  - Max passengers >= Standard occupancy
- Submit/cancel buttons

---

## TASK 11: Build Activity Option Form

**File: `src/components/product-options/option-form-activity.tsx`**

Requirements:
- Fields:
  - **Option Name** (text) *required
    - Examples: "Private Guided Tour", "Small Group Experience", "Self-Guided Package"
  - **Option Code** (text, uppercase) *required
  - **Description** (textarea)
  - **Experience Type** (dropdown) *required
    - Options: "Group", "Private", "Self-Guided", "Shared"
  - **Duration Hours** (number input with decimal) *required
    - Examples: 2, 3.5, 8
  - **Difficulty Level** (dropdown) *required
    - Options: "Easy", "Moderate", "Challenging", "Extreme"
  - **Min Group Size** (number input)
    - Only show if experience type is "Group"
  - **Max Group Size** (number input)
  - **Standard Occupancy** (number input) *required
    - Typical group size for pricing
  - **Max Occupancy** (number input) *required
  - **Includes** (multi-select tag input)
    - Examples: "Professional Guide", "Equipment", "Lunch", "Hotel Pickup", "Photos", "Insurance"
  - **Base Price Hint** (currency input)
  - **Currency** (dropdown)
  - **Active** (toggle)
- Validation:
  - Max group size >= Min group size
  - Max occupancy >= Standard occupancy
- Conditional fields based on experience type
- Submit/cancel buttons

---

## TASK 12: Build Extra Option Form

**File: `src/components/product-options/option-form-extra.tsx`**

Requirements:
- Fields:
  - **Option Name** (text) *required
    - Examples: "Travel Insurance Premium", "Airport Meet & Greet", "Visa Assistance"
  - **Option Code** (text, uppercase) *required
  - **Description** (textarea)
  - **Extra Type** (dropdown) *required
    - Options: "Insurance", "Visa", "Equipment", "Service", "Upgrade", "Other"
  - **Unit Type** (dropdown) *required
    - Options: "Per Person", "Per Booking", "Per Day", "Per Item"
  - **Is Mandatory** (checkbox)
    - If checked, this extra will be automatically added to bookings
  - **Coverage Details** (textarea)
    - Show if extra type is "Insurance"
    - Details about what's covered
  - **Validity Days** (number input)
    - How many days this extra is valid for
  - **Base Price Hint** (currency input)
  - **Currency** (dropdown)
  - **Active** (toggle)
- Conditional fields based on extra type
- Submit/cancel buttons

---

## TASK 13: Build Delete Confirmation Dialog

**File: `src/components/product-options/delete-option-dialog.tsx`**

```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteProductOption } from '@/hooks/useProductOptions'

interface DeleteOptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  option: { id: string; option_name: string; product_id: string } | null
}

export function DeleteOptionDialog({
  open,
  onOpenChange,
  option
}: DeleteOptionDialogProps) {
  const deleteOption = useDeleteProductOption()
  
  const handleDelete = async () => {
    if (!option) return
    
    await deleteOption.mutateAsync({
      id: option.id,
      productId: option.product_id
    })
    
    onOpenChange(false)
  }
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Option</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{option?.option_name}"?
            This action cannot be undone. Any rates or allocations using this option will need to be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

---

## Design Guidelines

### Color Coding by Product Type:
```typescript
const productTypeColors = {
  accommodation: 'blue',    // #3B82F6
  event: 'purple',         // #A855F7
  transfer: 'orange',      // #F59E0B
  activity: 'green',       // #10B981
  extra: 'gray'            // #6B7280
}
```

Use these colors for:
- Status badges
- Product type indicators
- Table row accents

### Form Layout:
- Two-column layout on desktop
- Single column on mobile
- Group related fields
- Use fieldsets with legends for sections
- Clear labels with helper text where needed

### Table Features:
- Sortable columns
- Inline editing for name and status
- Drag handles for reordering
- Action dropdown (3-dot menu)
- Empty state with "Add first option" CTA
- Loading skeletons

---

## Example Data

### Accommodation Option:
```json
{
  "option_name": "Deluxe Room Double",
  "option_code": "DLX-DBL",
  "bed_configuration": "1 King Bed",
  "room_size_sqm": 35,
  "view_type": "Sea View",
  "floor_range": "6-10",
  "standard_occupancy": 2,
  "max_occupancy": 3,
  "amenities": ["balcony", "bathtub", "coffee_machine"]
}
```

### Event Option:
```json
{
  "option_name": "VIP Hospitality Suite",
  "option_code": "VIP-HOSP",
  "ticket_type": "vip_lounge",
  "section": "Paddock Club",
  "access_level": "hospitality",
  "includes": ["buffet_lunch", "open_bar", "pit_lane_walk", "team_radio"]
}
```

### Transfer Option:
```json
{
  "option_name": "Private Luxury SUV",
  "option_code": "SUV-LUX",
  "vehicle_type": "suv",
  "vehicle_class": "luxury",
  "max_passengers": 6,
  "max_luggage": 6,
  "standard_occupancy": 4,
  "vehicle_features": ["wifi", "child_seat", "water_bottles"]
}
```

### Activity Option:
```json
{
  "option_name": "Private Desert Safari",
  "option_code": "DST-PRV",
  "experience_type": "private",
  "duration_hours": 6,
  "difficulty_level": "moderate",
  "min_group_size": 2,
  "max_group_size": 6,
  "standard_occupancy": 4,
  "max_occupancy": 6,
  "includes": ["guide", "dinner", "photos", "hotel_pickup"]
}
```

### Extra Option:
```json
{
  "option_name": "Comprehensive Travel Insurance",
  "option_code": "INS-COMP",
  "extra_type": "insurance",
  "unit_type": "per_person",
  "is_mandatory": false,
  "coverage_details": "Covers medical, cancellation, lost luggage up to $50,000",
  "validity_days": 30
}
```

---

## Success Criteria

The system is complete when:
- ✅ Can view all options for a product
- ✅ Can add options with type-specific forms
- ✅ Forms validate correctly per product type
- ✅ Can edit options inline (name, status)
- ✅ Can edit options in dialog (full edit)
- ✅ Can delete options with confirmation
- ✅ Can duplicate options
- ✅ Can reorder options (drag & drop)
- ✅ Table columns adapt to product type
- ✅ Empty state shows when no options
- ✅ Loading states display properly
- ✅ Success/error toasts work
- ✅ Mobile responsive

---

## Testing Checklist

For each product type, test:

**Accommodation:**
- [ ] Create option with all fields
- [ ] Validate occupancy (max >= standard)
- [ ] Edit inline
- [ ] Delete option
- [ ] Duplicate option

**Event:**
- [ ] Create ticket option
- [ ] Add multiple includes
- [ ] Edit access level inline
- [ ] Reorder multiple options

**Transfer:**
- [ ] Create vehicle option
- [ ] Set max passengers/luggage
- [ ] Add vehicle features
- [ ] Edit inline

**Activity:**
- [ ] Create experience option
- [ ] Set duration and difficulty
- [ ] Validate group sizes
- [ ] Add includes

**Extra:**
- [ ] Create extra option
- [ ] Set unit type
- [ ] Toggle mandatory
- [ ] Add coverage details

---

## Next Steps

After completing this, you'll be ready to:
1. **Contract Allocations** - Link these options to supplier inventory
2. **Supplier Rates** - Set costs per option
3. **Selling Rates** - Set prices per option
4. **Availability** - Track daily inventory per option
5. **Bookings** - Allow customers to book these options

---

**Start building! Focus on getting one product type working completely first (e.g., accommodation), then replicate the pattern for the other types.** 🚀

**Suggested order:**
1. Build types and schemas (Tasks 1-2)
2. Build queries and hooks (Tasks 3-4)
3. Build main page and table (Tasks 5-6)
4. Build one form (Task 8 - Accommodation)
5. Test thoroughly
6. Build remaining forms (Tasks 9-12)
7. Add delete dialog (Task 13)

Let me know when you're ready to start! 💪