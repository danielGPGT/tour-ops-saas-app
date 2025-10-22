# Cursor Prompt: Products, Inventory & Rates Management System

## Overview

Build a comprehensive product and inventory management system for a tour operator platform. This system manages:

1. **Products** - Hotels, event tickets, tours, transfers
2. **Product Options** - Room types, ticket categories, tour variants
3. **Contract Allocations** - Inventory blocks from suppliers
4. **Allocation Inventory** - Inventory per product option
5. **Availability** - Daily availability tracking
6. **Supplier Rates** - Cost prices from suppliers
7. **Selling Rates** - Customer-facing prices

This is the CORE of the booking system - where inventory and pricing meet.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS + RPC functions)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Date Handling**: date-fns

---

## Database Schema Reference

### **product_types**
```typescript
{
  id: UUID
  type_name: 'hotel' | 'event_ticket' | 'tour' | 'transfer'
  type_code: 'HTL' | 'TKT' | 'TOR' | 'TRF'
  type_category: 'accommodation' | 'activity' | 'transport'
  attributes_schema: JSONB  // Defines what fields each type needs
  is_active: BOOLEAN
}
```

### **products**
```typescript
{
  id: UUID
  organization_id: UUID
  product_type_id: UUID
  name: STRING              // "Fairmont The Palm"
  code: STRING              // "FAI-PALM"
  description: TEXT
  location: JSONB           // {city, country, lat, lng, address}
  attributes: JSONB         // Type-specific: {star_rating, check_in_time, amenities}
  tags: STRING[]
  images: JSONB             // Array of {url, alt, is_primary}
  is_active: BOOLEAN
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

### **product_options**
```typescript
{
  id: UUID
  product_id: UUID
  option_name: STRING       // "Deluxe Room Double"
  option_code: STRING       // "DLX-DBL"
  description: TEXT
  standard_occupancy: INT   // 2 persons
  max_occupancy: INT        // 3 persons
  bed_configuration: STRING // "1 King Bed"
  attributes: JSONB         // Type-specific: {size_sqm, view_type, floor_range}
  sort_order: INT
  is_active: BOOLEAN
}
```

### **contract_allocations**
```typescript
{
  id: UUID
  organization_id: UUID
  contract_id: UUID
  product_id: UUID
  allocation_name: STRING
  allocation_type: 'allotment' | 'free_sell' | 'on_request'
  valid_from: DATE
  valid_to: DATE
  min_nights: INT           // Hotels: minimum stay
  max_nights: INT
  release_days: INT         // Release inventory X days before
  dow_arrival: STRING[]     // Day of week restrictions: ['mon', 'tue']
  dow_departure: STRING[]
  blackout_dates: DATE[]    // Dates not available
  allow_overbooking: BOOLEAN
  overbooking_limit: INT
  is_active: BOOLEAN
}
```

### **allocation_inventory**
```typescript
{
  id: UUID
  contract_allocation_id: UUID
  product_option_id: UUID
  total_quantity: INT       // Total units (e.g., 100 rooms)
  flexible_configuration: BOOLEAN
  alternate_option_ids: UUID[]  // Can substitute with these options
  min_quantity_per_booking: INT
  max_quantity_per_booking: INT
}
```

### **availability**
```typescript
{
  id: UUID
  allocation_inventory_id: UUID
  availability_date: DATE
  total_available: INT
  booked: INT
  provisional: INT
  held: INT
  available: INT            // Auto-calculated: total - booked - provisional - held
  is_closed: BOOLEAN        // Manually closed
  is_released: BOOLEAN      // Auto-released per release_days
  notes: TEXT
  updated_at: TIMESTAMPTZ
}
```

### **supplier_rates**
```typescript
{
  id: UUID
  organization_id: UUID
  contract_id: UUID
  product_id: UUID
  product_option_id: UUID
  rate_name: STRING
  rate_code: STRING
  valid_from: DATE
  valid_to: DATE
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: STRING
  dow_mask: STRING[]        // Days rate applies: ['mon', 'tue', 'wed']
  min_nights: INT
  max_nights: INT
  priority: INT             // Higher = checked first
  is_active: BOOLEAN
}
```

### **rate_occupancy_costs**
```typescript
{
  id: UUID
  supplier_rate_id: UUID
  occupancy: INT            // 1 = single, 2 = double, 3 = triple
  base_cost: NUMERIC
  adult_cost: NUMERIC       // Cost per extra adult
  child_cost: NUMERIC       // Cost per child
  infant_cost: NUMERIC
  board_basis: STRING       // 'room_only', 'BB', 'HB', 'FB', 'AI'
  board_supplement: NUMERIC // Extra cost for this board type
  currency: STRING
}
```

### **rate_taxes_fees**
```typescript
{
  id: UUID
  supplier_rate_id: UUID
  tax_name: STRING          // "VAT", "Tourism Tax", "Service Charge"
  tax_type: 'percentage' | 'fixed_per_night' | 'fixed_per_person' | 'fixed_per_booking'
  tax_value: NUMERIC
  is_included_in_cost: BOOLEAN
  sort_order: INT
}
```

### **selling_rates**
```typescript
{
  id: UUID
  organization_id: UUID
  product_id: UUID
  product_option_id: UUID
  rate_name: STRING
  rate_code: STRING
  valid_from: DATE
  valid_to: DATE
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: STRING
  customer_type: 'b2c' | 'b2b_agent' | 'b2b_corporate'
  dow_mask: STRING[]
  min_nights: INT
  max_nights: INT
  min_pax: INT
  max_pax: INT
  priority: INT
  is_active: BOOLEAN
}
```

### **selling_rate_occupancy**
```typescript
{
  id: UUID
  selling_rate_id: UUID
  occupancy: INT
  selling_price: NUMERIC
  adult_price: NUMERIC
  child_price: NUMERIC
  infant_price: NUMERIC
  board_basis: STRING
  board_supplement: NUMERIC
  currency: STRING
}
```

---

## Available RPC Functions

```typescript
// Generate availability records for date range
supabase.rpc('generate_availability', {
  p_allocation_inventory_id: UUID,
  p_date_from: DATE,
  p_date_to: DATE,
  p_total_available: INT
})

// Check availability with locking
supabase.rpc('check_availability_with_lock', {
  p_allocation_inventory_id: UUID,
  p_date_from: DATE,
  p_date_to: DATE,
  p_quantity: INT
})
// Returns: BOOLEAN

// Get applicable supplier rate
supabase.rpc('get_supplier_rate', {
  p_product_option_id: UUID,
  p_check_in: DATE,
  p_check_out: DATE,
  p_occupancy: INT,
  p_contract_id: UUID
})
// Returns: supplier rate with costs

// Get applicable selling rate
supabase.rpc('get_selling_rate', {
  p_product_option_id: UUID,
  p_check_in: DATE,
  p_check_out: DATE,
  p_occupancy: INT,
  p_customer_type: STRING
})
// Returns: selling rate with prices
```

---

## Common Components Available

Use these existing components from `src/components/common/`:

- **DataTable** - TanStack Table with sorting, filtering, pagination
- **SearchBar** - Search with debounce
- **Pagination** - Page navigation
- **SummaryCard** - Stat card with icon
- **StatusBadge** - Colored badge
- **InlineDropdown** - Dropdown with auto-save
- **EnterpriseInlineEdit** - Inline text edit
- **LoadingSkeleton** - Loading placeholder
- **PageHeader** - Page title + actions
- **DatePicker** - Date selection
- **DateRangePicker** - Date range selection
- **CurrencyInput** - Currency formatted input
- **ImageUpload** - Image upload component
- **TagInput** - Multi-tag input
- **AvailabilityCalendar** - Calendar grid (to be built)

---

## Project Structure

```
src/
├── app/(dashboard)/
│   ├── products/
│   │   ├── page.tsx                       // Products list
│   │   ├── [id]/
│   │   │   ├── page.tsx                   // Product details
│   │   │   ├── options/page.tsx           // Manage options
│   │   │   ├── selling-rates/page.tsx     // Selling rates
│   │   │   └── allocations/page.tsx       // Contract allocations
│   │   └── new/page.tsx                   // Create product
│   ├── allocations/
│   │   ├── page.tsx                       // All allocations list
│   │   ├── [id]/
│   │   │   ├── page.tsx                   // Allocation details
│   │   │   ├── inventory/page.tsx         // Setup inventory
│   │   │   └── supplier-rates/page.tsx    // Supplier rates
│   │   └── new/page.tsx
│   └── availability/
│       ├── page.tsx                       // Availability overview
│       └── calendar/page.tsx              // Calendar view
├── components/
│   ├── products/
│   │   ├── product-form.tsx
│   │   ├── product-card.tsx
│   │   ├── product-type-selector.tsx
│   │   ├── option-form.tsx
│   │   ├── attributes-editor.tsx
│   │   └── image-manager.tsx
│   ├── allocations/
│   │   ├── allocation-form.tsx
│   │   ├── allocation-card.tsx
│   │   ├── inventory-setup.tsx
│   │   └── dow-selector.tsx
│   ├── rates/
│   │   ├── supplier-rate-form.tsx
│   │   ├── selling-rate-form.tsx
│   │   ├── occupancy-costs-form.tsx
│   │   ├── rate-comparison.tsx
│   │   └── margin-calculator.tsx
│   └── availability/
│       ├── availability-calendar.tsx
│       ├── availability-grid.tsx
│       ├── bulk-update-modal.tsx
│       └── availability-stats.tsx
├── hooks/
│   ├── useProducts.ts
│   ├── useProductOptions.ts
│   ├── useAllocations.ts
│   ├── useAllocationInventory.ts
│   ├── useAvailability.ts
│   ├── useSupplierRates.ts
│   └── useSellingRates.ts
├── lib/
│   ├── queries/
│   │   ├── products.ts
│   │   ├── allocations.ts
│   │   ├── availability.ts
│   │   └── rates.ts
│   └── validations/
│       ├── product.schema.ts
│       ├── allocation.schema.ts
│       └── rate.schema.ts
└── types/
    ├── product.ts
    ├── allocation.ts
    ├── availability.ts
    └── rate.ts
```

---

# PHASE 1: Products Foundation (2-3 hours)

## Goal
Create the products system with type-specific attributes and product options management.

---

## Task 1.1: Create Types

**File: `src/types/product.ts`**

```typescript
export type ProductTypeCode = 'hotel' | 'event_ticket' | 'tour' | 'transfer'
export type ProductCategory = 'accommodation' | 'activity' | 'transport'

export interface ProductType {
  id: string
  type_name: ProductTypeCode
  type_code: string
  type_category: ProductCategory
  attributes_schema: any
  is_active: boolean
}

export interface Product {
  id: string
  organization_id: string
  product_type_id: string
  name: string
  code: string
  description?: string
  location: {
    city: string
    country: string
    lat?: number
    lng?: number
    address?: string
  }
  attributes: any  // Type-specific
  tags: string[]
  images: Array<{
    url: string
    alt: string
    is_primary: boolean
  }>
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  product_type?: ProductType
}

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  description?: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration?: string
  attributes: any
  sort_order: number
  is_active: boolean
}

// Type-specific attributes
export interface HotelAttributes {
  star_rating: number
  check_in_time: string
  check_out_time: string
  amenities: string[]
  property_type: string  // 'hotel', 'resort', 'apartment'
  chain?: string
}

export interface EventTicketAttributes {
  event_name: string
  event_date: string
  venue_name: string
  venue_capacity: number
  event_type: string  // 'sports', 'concert', 'exhibition'
  gates_open_time: string
  event_start_time: string
}

export interface TourAttributes {
  duration_hours: number
  duration_days: number
  meeting_point: string
  meeting_time: string
  end_point: string
  tour_type: string  // 'group', 'private', 'self_guided'
  inclusions: string[]
  exclusions: string[]
  max_group_size: number
}

export interface TransferAttributes {
  vehicle_type: string  // 'sedan', 'suv', 'van', 'bus'
  max_passengers: number
  max_luggage: number
  from_location: string
  to_location: string
  distance_km: number
  duration_minutes: number
  transfer_type: string  // 'airport', 'hotel', 'point_to_point'
}
```

---

## Task 1.2: Create Validation Schemas

**File: `src/lib/validations/product.schema.ts`**

```typescript
import { z } from 'zod'

const locationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional()
})

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  is_primary: z.boolean()
})

// Hotel attributes
const hotelAttributesSchema = z.object({
  star_rating: z.number().min(1).max(5),
  check_in_time: z.string(),
  check_out_time: z.string(),
  amenities: z.array(z.string()),
  property_type: z.enum(['hotel', 'resort', 'apartment', 'villa']),
  chain: z.string().optional()
})

// Event ticket attributes
const eventTicketAttributesSchema = z.object({
  event_name: z.string().min(1),
  event_date: z.string(),
  venue_name: z.string().min(1),
  venue_capacity: z.number().int().min(1),
  event_type: z.enum(['sports', 'concert', 'exhibition', 'theater', 'other']),
  gates_open_time: z.string(),
  event_start_time: z.string()
})

// Base product schema
export const productSchema = z.object({
  product_type_id: z.string().uuid('Please select a product type'),
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  location: locationSchema,
  attributes: z.any(),  // Validated based on product type
  tags: z.array(z.string()).default([]),
  images: z.array(imageSchema).default([]),
  is_active: z.boolean().default(true)
})

// Product option schema
export const productOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name is required'),
  option_code: z.string().min(2).max(20),
  description: z.string().optional(),
  standard_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  bed_configuration: z.string().optional(),
  attributes: z.any(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true)
}).refine(data => data.max_occupancy >= data.standard_occupancy, {
  message: 'Max occupancy must be >= standard occupancy',
  path: ['max_occupancy']
})

export type ProductFormData = z.infer<typeof productSchema>
export type ProductOptionFormData = z.infer<typeof productOptionSchema>
```

---

## Task 1.3: Create Database Queries

**File: `src/lib/queries/products.ts`**

```typescript
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductOption } from '@/types/product'

// Get product types
export async function getProductTypes() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .eq('is_active', true)
    .order('type_name')
  
  if (error) throw error
  return data
}

// Get products
export async function getProducts(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Product[]
}

// Get single product
export async function getProduct(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Product
}

// Create product
export async function createProduct(product: Partial<Product>) {
  const supabase = createClient()
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...product,
      organization_id: profile.organization.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data as Product
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Product
}

// Delete product
export async function deleteProduct(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// === PRODUCT OPTIONS ===

// Get product options
export async function getProductOptions(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
  
  if (error) throw error
  return data as ProductOption[]
}

// Create product option
export async function createProductOption(option: Partial<ProductOption>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .insert(option)
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Update product option
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

// Delete product option
export async function deleteProductOption(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('product_options')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
```

---

## Task 1.4: Create React Query Hooks

**File: `src/hooks/useProducts.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as productQueries from '@/lib/queries/products'
import type { Product, ProductOption } from '@/types/product'
import { toast } from 'sonner'

// Product types
export function useProductTypes() {
  return useQuery({
    queryKey: ['product-types'],
    queryFn: productQueries.getProductTypes
  })
}

// Products
export function useProducts() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['products', profile?.organization.id],
    queryFn: () => productQueries.getProducts(profile!.organization.id),
    enabled: !!profile?.organization.id
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productQueries.getProduct(id),
    enabled: !!id
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<Product>) => productQueries.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create product')
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productQueries.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] })
      toast.success('Product updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update product')
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => productQueries.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete product')
    }
  })
}

// Product options
export function useProductOptions(productId: string) {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: () => productQueries.getProductOptions(productId),
    enabled: !!productId
  })
}

export function useCreateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ProductOption>) => productQueries.createProductOption(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', data.product_id] })
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
      productQueries.updateProductOption(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', data.product_id] })
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
      productQueries.deleteProductOption(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', variables.productId] })
      toast.success('Option deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete option')
    }
  })
}
```

---

## Task 1.5: Build Products List Page

**File: `src/app/(dashboard)/products/page.tsx`**

Requirements:
- Use **PageHeader** with "Products" title and "+ Add Product" button
- Display **SummaryCards**:
  - Total products
  - Active products
  - Products by type breakdown
- **SearchBar** to filter by name, code, location
- Filter dropdowns for:
  - Product type (hotel, ticket, tour, transfer)
  - Status (active, inactive)
  - Location (city)
- **DataTable** with columns:
  - Image (thumbnail)
  - Product Code
  - Product Name
  - Type (with icon + badge)
  - Location (city, country)
  - Options Count
  - Status (StatusBadge)
  - Actions (View, Edit, Delete)
- Click row → navigate to product details
- "+ Add Product" → navigate to `/products/new`

---

## Task 1.6: Build Create Product Page

**File: `src/app/(dashboard)/products/new/page.tsx`**

Multi-step form wizard:

**Step 1: Product Type Selection**
- Display cards for each product type
- Show icon, name, description
- Select one to continue

**Step 2: Basic Information**
- Product Name
- Product Code (auto-suggest from name)
- Description (textarea)
- Tags (TagInput component)

**Step 3: Location**
- City (text or autocomplete)
- Country (dropdown)
- Address (textarea)
- Map picker (optional)

**Step 4: Type-Specific Attributes**
For hotels:
- Star rating (1-5 stars selector)
- Check-in time
- Check-out time
- Property type (dropdown)
- Amenities (multi-select)

For event tickets:
- Event name
- Event date
- Venue name
- Event type
- Gates open time
- Event start time

For tours:
- Duration (hours/days)
- Meeting point
- Tour type
- Max group size
- Inclusions/exclusions

For transfers:
- Vehicle type
- Max passengers
- From/to locations
- Distance & duration

**Step 5: Images**
- Upload multiple images
- Set primary image
- Reorder images

**Step 6: Review & Create**
- Summary of all entered data
- "Create Product" button

On success: redirect to product details page

---

## Task 1.7: Build Product Details Page

**File: `src/app/(dashboard)/products/[id]/page.tsx`**

Layout with tabs:

**Tab 1: Overview**
- Product header with image gallery
- Basic info (inline editable)
- Type-specific attributes (inline editable)
- Location map
- Tags editor
- Activity log

**Tab 2: Options** → `/products/[id]/options`
- Navigate to options management page

**Tab 3: Selling Rates** → `/products/[id]/selling-rates`
- Navigate to selling rates page

**Tab 4: Allocations** → `/products/[id]/allocations`
- List all contract allocations for this product

Use **EnterpriseInlineEdit** for all editable fields.

---

## Task 1.8: Build Options Management Page

**File: `src/app/(dashboard)/products/[id]/options/page.tsx`**

Requirements:
- **PageHeader** with breadcrumbs and "+ Add Option" button
- **DataTable** showing all options:
  - Option Code
  - Option Name
  - Standard Occupancy
  - Max Occupancy
  - Bed Configuration (for hotels)
  - Status
  - Actions (Edit, Delete, Duplicate)
- Inline editing for:
  - Option name
  - Occupancy numbers
  - Bed configuration
  - Status
- Drag-to-reorder rows (updates sort_order)
- "+ Add Option" opens dialog with form

**Add Option Dialog:**
- Option name
- Option code (auto-generate from name)
- Standard occupancy
- Max occupancy
- Bed configuration (for hotels)
- Description
- Type-specific attributes

---

**✅ PHASE 1 COMPLETE CRITERIA:**
- Can view all products in searchable table
- Can create products with type-specific attributes
- Can view product details with inline editing
- Can manage product options (create, edit, delete, reorder)
- All CRUD operations work
- Loading states and errors handled

---

# PHASE 2: Contract Allocations (3-4 hours)

## Goal
Create the allocation system that links contracts to products and defines inventory blocks.

---

## Task 2.1: Create Types

**File: `src/types/allocation.ts`**

```typescript
export type AllocationType = 'allotment' | 'free_sell' | 'on_request'

export interface ContractAllocation {
  id: string
  organization_id: string
  contract_id: string
  product_id: string
  allocation_name: string
  allocation_type: AllocationType
  valid_from: string
  valid_to: string
  min_nights?: number
  max_nights?: number
  release_days: number
  dow_arrival: string[]  // ['mon', 'tue', 'wed']
  dow_departure: string[]
  blackout_dates: string[]
  allow_overbooking: boolean
  overbooking_limit?: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  contract?: {
    id: string
    contract_number: string
    contract_name: string
    supplier: {
      name: string
    }
  }
  product?: {
    id: string
    name: string
    code: string
  }
}

export interface AllocationInventory {
  id: string
  contract_allocation_id: string
  product_option_id: string
  total_quantity: number
  flexible_configuration: boolean
  alternate_option_ids: string[]
  min_quantity_per_booking: number
  max_quantity_per_booking: number
  
  // Relations
  product_option?: {
    id: string
    option_name: string
    option_code: string
  }
}
```

---

## Task 2.2: Create Validation Schema

**File: `src/lib/validations/allocation.schema.ts`**

```typescript
import { z } from 'zod'

export const allocationSchema = z.object({
  contract_id: z.string().uuid('Please select a contract'),
  product_id: z.string().uuid('Please select a product'),
  allocation_name: z.string().min(3, 'Allocation name is required'),
  allocation_type: z.enum(['allotment', 'free_sell', 'on_request']),
  valid_from: z.string().min(1, 'Start date is required'),
  valid_to: z.string().min(1, 'End date is required'),
  min_nights: z.number().int().min(0).optional(),
  max_nights: z.number().int().min(0).optional(),
  release_days: z.number().int().min(0).default(0),
  dow_arrival: z.array(z.string()).default([]),
  dow_departure: z.array(z.string()).default([]),
  blackout_dates: z.array(z.string()).default([]),
  allow_overbooking: z.boolean().default(false),
  overbooking_limit: z.number().int().min(0).optional(),
  is_active: z.boolean().default(true)
}).refine(data => new Date(data.valid_to) >= new Date(data.valid_from), {
  message: 'End date must be after start date',
  path: ['valid_to']
})

export const allocationInventorySchema = z.object({
  product_option_id: z.string().uuid('Please select a product option'),
  total_quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  flexible_configuration: z.boolean().default(false),
  alternate_option_ids: z.array(z.string().uuid()).default([]),
  min_quantity_per_booking: z.number().int().min(1).default(1),
  max_quantity_per_booking: z.number().int().min(1).optional()
})

export type AllocationFormData = z.infer<typeof allocationSchema>
export type AllocationInventoryFormData = z.infer<typeof allocationInventorySchema>
```

---

## Task 2.3: Create Database Queries

**File: `src/lib/queries/allocations.ts`**

```typescript
import { createClient } from '@/lib/supabase/client'
import type { ContractAllocation, AllocationInventory } from '@/types/allocation'

// Get allocations
export async function getAllocations(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(name)
      ),
      product:products(id, name, code)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Get single allocation
export async function getAllocation(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(name, code, contact_info)
      ),
      product:products(id, name, code, product_type:product_types(*))
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Get allocations by contract
export async function getAllocationsByContract(contractId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      product:products(id, name, code)
    `)
    .eq('contract_id', contractId)
    .order('allocation_name')
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Get allocations by product
export async function getAllocationsByProduct(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(name)
      )
    `)
    .eq('product_id', productId)
    .order('valid_from', { ascending: false })
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Create allocation
export async function createAllocation(allocation: Partial<ContractAllocation>) {
  const supabase = createClient()
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .insert({
      ...allocation,
      organization_id: profile.organization.id
    })
    .select()
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Update allocation
export async function updateAllocation(id: string, updates: Partial<ContractAllocation>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Delete allocation
export async function deleteAllocation(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_allocations')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// === ALLOCATION INVENTORY ===

// Get inventory for allocation
export async function getAllocationInventory(allocationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy
      )
    `)
    .eq('contract_allocation_id', allocationId)
  
  if (error) throw error
  return data as AllocationInventory[]
}

// Create inventory
export async function createAllocationInventory(inventory: Partial<AllocationInventory>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .insert(inventory)
    .select()
    .single()
  
  if (error) throw error
  return data as AllocationInventory
}

// Update inventory
export async function updateAllocationInventory(id: string, updates: Partial<AllocationInventory>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as AllocationInventory
}

// Delete inventory
export async function deleteAllocationInventory(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('allocation_inventory')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
```

---

## Task 2.4: Create React Query Hooks

**File: `src/hooks/useAllocations.ts`**

Follow similar pattern as useProducts.ts for:
- useAllocations()
- useAllocation(id)
- useAllocationsByContract(contractId)
- useAllocationsByProduct(productId)
- useCreateAllocation()
- useUpdateAllocation()
- useDeleteAllocation()

**File: `src/hooks/useAllocationInventory.ts`**

For inventory management:
- useAllocationInventory(allocationId)
- useCreateAllocationInventory()
- useUpdateAllocationInventory()
- useDeleteAllocationInventory()

---

## Task 2.5: Build Allocations List Page

**File: `src/app/(dashboard)/allocations/page.tsx`**

Requirements:
- **PageHeader** with "+ New Allocation" button
- **SummaryCards**:
  - Total allocations
  - Active allocations
  - Total inventory units
  - Allocations expiring soon
- Filter by:
  - Contract
  - Product
  - Allocation type
  - Date range
  - Status
- **DataTable** with columns:
  - Allocation Name
  - Contract (with link)
  - Product (with link)
  - Type (StatusBadge)
  - Valid From → To
  - Release Days
  - Status
  - Actions
- Click row → navigate to allocation details

---

## Task 2.6: Build Create Allocation Page

**File: `src/app/(dashboard)/allocations/new/page.tsx`**

Multi-step form:

**Step 1: Contract & Product**
- Select contract (searchable dropdown)
- Select product (filtered by contract's supplier if possible)
- Allocation name (auto-suggest: "[Contract] - [Product]")

**Step 2: Allocation Type & Dates**
- Allocation type (radio buttons with descriptions):
  - **Allotment**: Fixed inventory block
  - **Free Sell**: Unlimited availability
  - **On Request**: Manual confirmation needed
- Valid from/to dates
- Min/max nights (for hotels)

**Step 3: Restrictions**
- Release days (number input)
- Day of week arrival (checkboxes: Mon-Sun)
- Day of week departure (checkboxes)
- Blackout dates (date picker, can select multiple)

**Step 4: Overbooking Settings**
- Allow overbooking (toggle)
- Overbooking limit (if enabled)

**Step 5: Review & Create**
- Summary
- Create button

On success: redirect to allocation details to set up inventory

---

## Task 2.7: Build Allocation Details Page

**File: `src/app/(dashboard)/allocations/[id]/page.tsx`**

Layout with tabs:

**Tab 1: Overview**
- Allocation details (inline editable)
- Contract info (read-only with link)
- Product info (read-only with link)
- Restrictions summary
- Activity log

**Tab 2: Inventory Setup** → `/allocations/[id]/inventory`
- Navigate to inventory management

**Tab 3: Supplier Rates** → `/allocations/[id]/supplier-rates`
- Navigate to supplier rates (covered in Phase 4)

---

## Task 2.8: Build Inventory Setup Page

**File: `src/app/(dashboard)/allocations/[id]/inventory/page.tsx`**

This is where you link product options to the allocation and set quantities.

Requirements:
- **PageHeader** with breadcrumbs and "+ Add Inventory" button
- Show allocation summary at top
- **DataTable** with product options:
  - Option Code
  - Option Name
  - Occupancy
  - Total Quantity (inline editable)
  - Flexible Config (toggle)
  - Alternate Options (multi-select)
  - Min/Max per Booking
  - Actions (Generate Availability, Delete)
- "+ Add Inventory" opens dialog to select option and set quantity

**Add Inventory Dialog:**
- Select product option (dropdown)
- Total quantity (number)
- Flexible configuration (checkbox)
- Alternate options (multi-select from other options)
- Min quantity per booking
- Max quantity per booking

**Generate Availability Button:**
- Opens dialog with date range picker
- Generates availability records for selected date range
- Shows progress/success message

---

**✅ PHASE 2 COMPLETE CRITERIA:**
- Can view all allocations
- Can create allocations with restrictions
- Can view allocation details
- Can set up inventory per product option
- Can generate availability records
- All inline editing works

---

# PHASE 3: Availability Management (3-4 hours)

## Goal
Build the availability calendar system for viewing and managing daily inventory.

---

## Task 3.1: Create Types

**File: `src/types/availability.ts`**

```typescript
export interface Availability {
  id: string
  allocation_inventory_id: string
  availability_date: string
  total_available: number
  booked: number
  provisional: number
  held: number
  available: number  // Calculated
  is_closed: boolean
  is_released: boolean
  notes?: string
  updated_at: string
  
  // Relations
  allocation_inventory?: {
    id: string
    product_option: {
      option_name: string
      option_code: string
    }
  }
}

export interface AvailabilityStats {
  total_inventory: number
  available: number
  booked: number
  utilization_percentage: number
  low_availability_days: number
  sold_out_days: number
}
```

---

## Task 3.2: Create Database Queries

**File: `src/lib/queries/availability.ts`**

```typescript
import { createClient } from '@/lib/supabase/client'
import type { Availability } from '@/types/availability'

// Generate availability for date range
export async function generateAvailability(
  allocationInventoryId: string,
  dateFrom: string,
  dateTo: string,
  totalAvailable: number
) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('generate_availability', {
    p_allocation_inventory_id: allocationInventoryId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_total_available: totalAvailable
  })
  
  if (error) throw error
  return data
}

// Get availability for allocation inventory
export async function getAvailability(
  allocationInventoryId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('allocation_inventory_id', allocationInventoryId)
    .gte('availability_date', dateFrom)
    .lte('availability_date', dateTo)
    .order('availability_date')
  
  if (error) throw error
  return data as Availability[]
}

// Get availability for product
export async function getProductAvailability(
  productId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .select(`
      *,
      allocation_inventory:allocation_inventory(
        id,
        product_option:product_options(
          id,
          option_name,
          option_code
        ),
        contract_allocation:contract_allocations(
          id,
          allocation_name,
          product_id
        )
      )
    `)
    .gte('availability_date', dateFrom)
    .lte('availability_date', dateTo)
    .order('availability_date')
  
  if (error) throw error
  
  // Filter by product_id from nested allocation
  return data.filter((avail: any) => 
    avail.allocation_inventory?.contract_allocation?.product_id === productId
  )
}

// Update availability
export async function updateAvailability(id: string, updates: Partial<Availability>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Availability
}

// Bulk update availability
export async function bulkUpdateAvailability(ids: string[], updates: Partial<Availability>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .update(updates)
    .in('id', ids)
    .select()
  
  if (error) throw error
  return data as Availability[]
}

// Check availability with lock
export async function checkAvailability(
  allocationInventoryId: string,
  dateFrom: string,
  dateTo: string,
  quantity: number
) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('check_availability_with_lock', {
    p_allocation_inventory_id: allocationInventoryId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_quantity: quantity
  })
  
  if (error) throw error
  return data as boolean
}

// Get availability stats
export async function getAvailabilityStats(productId: string, dateFrom: string, dateTo: string) {
  // Calculate stats from availability data
  const availability = await getProductAvailability(productId, dateFrom, dateTo)
  
  const stats = {
    total_inventory: 0,
    available: 0,
    booked: 0,
    utilization_percentage: 0,
    low_availability_days: 0,
    sold_out_days: 0
  }
  
  availability.forEach(avail => {
    stats.total_inventory += avail.total_available
    stats.available += avail.available
    stats.booked += avail.booked
    
    if (avail.available === 0) stats.sold_out_days++
    else if (avail.available <= avail.total_available * 0.1) stats.low_availability_days++
  })
  
  if (stats.total_inventory > 0) {
    stats.utilization_percentage = (stats.booked / stats.total_inventory) * 100
  }
  
  return stats
}
```

---

## Task 3.3: Create React Query Hooks

**File: `src/hooks/useAvailability.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as availabilityQueries from '@/lib/queries/availability'
import { toast } from 'sonner'

export function useAvailability(
  allocationInventoryId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['availability', allocationInventoryId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAvailability(allocationInventoryId, dateFrom, dateTo),
    enabled: !!allocationInventoryId && !!dateFrom && !!dateTo
  })
}

export function useProductAvailability(
  productId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['product-availability', productId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getProductAvailability(productId, dateFrom, dateTo),
    enabled: !!productId && !!dateFrom && !!dateTo
  })
}

export function useGenerateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (params: {
      allocationInventoryId: string
      dateFrom: string
      dateTo: string
      totalAvailable: number
    }) => availabilityQueries.generateAvailability(
      params.allocationInventoryId,
      params.dateFrom,
      params.dateTo,
      params.totalAvailable
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      toast.success('Availability generated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate availability')
    }
  })
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      availabilityQueries.updateAvailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      toast.success('Availability updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability')
    }
  })
}

export function useBulkUpdateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<any> }) =>
      availabilityQueries.bulkUpdateAvailability(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      toast.success('Availability updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability')
    }
  })
}

export function useAvailabilityStats(
  productId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['availability-stats', productId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAvailabilityStats(productId, dateFrom, dateTo),
    enabled: !!productId && !!dateFrom && !!dateTo
  })
}
```

---

## Task 3.4: Build Availability Calendar Component

**File: `src/components/availability/availability-calendar.tsx`**

This is a KEY component - a calendar grid showing availability.

Requirements:
- Month view with 7 columns (days of week)
- Each cell shows:
  - Date
  - Total available
  - Booked count
  - Available count
  - Color coding:
    - Green: >50% available
    - Yellow: 10-50% available
    - Orange: 1-10% available
    - Red: Sold out
    - Gray: Closed/Released
- Click cell to edit availability
- Select multiple cells for bulk edit
- Legend showing color meanings
- Month navigation (prev/next buttons)

---

## Task 3.5: Build Availability Overview Page

**File: `src/app/(dashboard)/availability/page.tsx`**

Requirements:
- **PageHeader** with date range selector
- **SummaryCards**:
  - Total inventory
  - Available inventory
  - Utilization %
  - Low availability alerts
- Filter by:
  - Product
  - Product option
  - Allocation
  - Date range
- **AvailabilityCalendar** component
- **Bulk Actions**:
  - Close selected dates
  - Open selected dates
  - Adjust quantity
  - Add notes

---

## Task 3.6: Build Calendar View Page

**File: `src/app/(dashboard)/availability/calendar/page.tsx`**

Full-screen calendar view:
- Product selector dropdown
- Month/Week/Day view toggle
- Large **AvailabilityCalendar**
- Quick stats sidebar
- Bulk edit toolbar
- Export to CSV button

---

## Task 3.7: Build Bulk Update Modal

**File: `src/components/availability/bulk-update-modal.tsx`**

Modal for bulk editing availability:
- Shows selected date range
- Fields:
  - Adjust quantity (± number)
  - Set quantity (absolute number)
  - Close dates (toggle)
  - Add notes (textarea)
- Preview impact
- Confirm & apply button

---

**✅ PHASE 3 COMPLETE CRITERIA:**
- Can view availability in calendar format
- Can update individual availability records
- Can bulk update multiple dates
- Color coding works correctly
- Can filter by product/option
- Stats display accurately

---

# PHASE 4: Supplier Rates (3-4 hours)

## Goal
Build the supplier rates system for managing cost prices with occupancy-based pricing.

---

## Task 4.1: Create Types

**File: `src/types/rate.ts`**

```typescript
export type RateBasis = 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
export type BoardBasis = 'room_only' | 'BB' | 'HB' | 'FB' | 'AI'

export interface SupplierRate {
  id: string
  organization_id: string
  contract_id: string
  product_id: string
  product_option_id: string
  rate_name: string
  rate_code: string
  valid_from: string
  valid_to: string
  rate_basis: RateBasis
  currency: string
  dow_mask: string[]
  min_nights?: number
  max_nights?: number
  priority: number
  is_active: boolean
  
  // Relations
  contract?: {
    contract_number: string
    contract_name: string
  }
  product_option?: {
    option_name: string
    option_code: string
  }
}

export interface RateOccupancyCost {
  id: string
  supplier_rate_id: string
  occupancy: number
  base_cost: number
  adult_cost: number
  child_cost: number
  infant_cost: number
  board_basis: BoardBasis
  board_supplement: number
  currency: string
}

export interface RateTaxFee {
  id: string
  supplier_rate_id: string
  tax_name: string
  tax_type: 'percentage' | 'fixed_per_night' | 'fixed_per_person' | 'fixed_per_booking'
  tax_value: number
  is_included_in_cost: boolean
  sort_order: number
}

export interface SellingRate {
  id: string
  organization_id: string
  product_id: string
  product_option_id: string
  rate_name: string
  rate_code: string
  valid_from: string
  valid_to: string
  rate_basis: RateBasis
  currency: string
  customer_type: 'b2c' | 'b2b_agent' | 'b2b_corporate'
  dow_mask: string[]
  min_nights?: number
  max_nights?: number
  min_pax?: number
  max_pax?: number
  priority: number
  is_active: boolean
}

export interface SellingRateOccupancy {
  id: string
  selling_rate_id: string
  occupancy: number
  selling_price: number
  adult_price: number
  child_price: number
  infant_price: number
  board_basis: BoardBasis
  board_supplement: number
  currency: string
}
```

---

## Task 4.2: Create Validation Schemas

**File: `src/lib/validations/rate.schema.ts`**

```typescript
import { z } from 'zod'

export const supplierRateSchema = z.object({
  contract_id: z.string().uuid(),
  product_option_id: z.string().uuid(),
  rate_name: z.string().min(2),
  rate_code: z.string().min(2).max(20),
  valid_from: z.string(),
  valid_to: z.string(),
  rate_basis: z.enum(['per_room_per_night', 'per_ticket', 'per_person', 'per_booking']),
  currency: z.string().length(3),
  dow_mask: z.array(z.string()).default([]),
  min_nights: z.number().int().min(0).optional(),
  max_nights: z.number().int().min(0).optional(),
  priority: z.number().int().default(0),
  is_active: z.boolean().default(true)
})

export const rateOccupancyCostSchema = z.object({
  occupancy: z.number().int().min(1).max(10),
  base_cost: z.number().min(0),
  adult_cost: z.number().min(0).default(0),
  child_cost: z.number().min(0).default(0),
  infant_cost: z.number().min(0).default(0),
  board_basis: z.enum(['room_only', 'BB', 'HB', 'FB', 'AI']).default('room_only'),
  board_supplement: z.number().min(0).default(0),
  currency: z.string().length(3)
})

export const sellingRateSchema = z.object({
  product_option_id: z.string().uuid(),
  rate_name: z.string().min(2),
  rate_code: z.string().min(2).max(20),
  valid_from: z.string(),
  valid_to: z.string(),
  rate_basis: z.enum(['per_room_per_night', 'per_ticket', 'per_person', 'per_booking']),
  currency: z.string().length(3),
  customer_type: z.enum(['b2c', 'b2b_agent', 'b2b_corporate']),
  dow_mask: z.array(z.string()).default([]),
  min_nights: z.number().int().min(0).optional(),
  max_nights: z.number().int().min(0).optional(),
  min_pax: z.number().int().min(0).optional(),
  max_pax: z.number().int().min(0).optional(),
  priority: z.number().int().default(0),
  is_active: z.boolean().default(true)
})

export type SupplierRateFormData = z.infer<typeof supplierRateSchema>
export type RateOccupancyCostFormData = z.infer<typeof rateOccupancyCostSchema>
export type SellingRateFormData = z.infer<typeof sellingRateSchema>
```

---

## Task 4.3: Create Database Queries

**File: `src/lib/queries/rates.ts`**

Create functions for:
- getSupplierRates(contractId, productOptionId)
- getSupplierRate(id)
- createSupplierRate(rate)
- updateSupplierRate(id, updates)
- deleteSupplierRate(id)
- getRateOccupancyCosts(supplierRateId)
- createRateOccupancyCost(cost)
- updateRateOccupancyCost(id, updates)
- deleteRateOccupancyCost(id)
- getRateTaxesFees(supplierRateId)
- createRateTaxFee(tax)
- updateRateTaxFee(id, updates)
- deleteRateTaxFee(id)

Similarly for selling rates:
- getSellingRates(productOptionId)
- createSellingRate(rate)
- etc.

---

## Task 4.4: Create React Query Hooks

**File: `src/hooks/useSupplierRates.ts`**
**File: `src/hooks/useSellingRates.ts`**

Follow the same pattern as previous hooks.

---

## Task 4.5: Build Supplier Rates Page

**File: `src/app/(dashboard)/allocations/[id]/supplier-rates/page.tsx`**

Requirements:
- **PageHeader** with "+ Add Rate" button
- Group rates by product option
- **DataTable** for each option showing:
  - Rate Name
  - Valid From → To
  - Rate Basis
  - Priority
  - Occupancy Costs (expandable)
  - Status
  - Actions (Edit, Delete, Duplicate)
- Click "+ Add Rate" opens sheet/dialog
- Inline edit rate name, dates, priority

---

## Task 4.6: Build Supplier Rate Form

**File: `src/components/rates/supplier-rate-form.tsx`**

Multi-section form:

**Section 1: Basic Info**
- Rate name
- Rate code
- Valid from/to
- Rate basis (dropdown)
- Currency
- Priority

**Section 2: Restrictions**
- Day of week mask (checkboxes)
- Min/max nights
- Blackout dates

**Section 3: Occupancy Costs**
For each occupancy (1-4):
- Base cost
- Extra adult cost
- Child cost
- Infant cost
- Board basis options (tabs or dropdown)
- Board supplements

**Section 4: Taxes & Fees**
- Add multiple taxes
- Tax name
- Tax type (percentage/fixed)
- Tax value
- Is included in cost?

---

## Task 4.7: Build Rate Comparison Component

**File: `src/components/rates/rate-comparison.tsx`**

Shows side-by-side comparison of supplier rate vs selling rate:
- Cost breakdown by occupancy
- Selling price by occupancy
- Margin per occupancy
- Total taxes/fees
- Visual margin indicator (green if good, red if low)

---

**✅ PHASE 4 COMPLETE CRITERIA:**
- Can create supplier rates with occupancy costs
- Can add taxes and fees
- Can view all rates for an allocation
- Inline editing works
- Rate comparison shows margins

---

# PHASE 5: Selling Rates (2-3 hours)

## Goal
Build the customer-facing pricing system with markup calculations.

---

## Task 5.1: Build Selling Rates Page

**File: `src/app/(dashboard)/products/[id]/selling-rates/page.tsx`**

Requirements:
- **PageHeader** with "+ Add Selling Rate" button
- Filter by:
  - Product option
  - Customer type
  - Date range
  - Status
- **DataTable** showing:
  - Rate Name
  - Option
  - Customer Type (B2C, B2B Agent, B2B Corporate)
  - Valid From → To
  - Base Price
  - Margin % (calculated from supplier rate)
  - Priority
  - Status
  - Actions

---

## Task 5.2: Build Selling Rate Form

**File: `src/components/rates/selling-rate-form.tsx`**

Similar to supplier rate form but for selling:

**Section 1: Basic Info**
- Rate name
- Rate code
- Product option
- Customer type
- Valid from/to
- Currency
- Priority

**Section 2: Restrictions**
- DOW mask
- Min/max nights
- Min/max pax

**Section 3: Occupancy Prices**
For each occupancy:
- Selling price
- Extra adult price
- Child price
- Infant price
- Board supplements

**Section 4: Margin Calculator**
- Auto-fetch supplier rate
- Show cost
- Show selling price
- Display margin amount and %
- Visual indicator if margin is below threshold

---

## Task 5.3: Build Margin Calculator

**File: `src/components/rates/margin-calculator.tsx`**

Interactive calculator:
- Input: Supplier cost
- Input: Desired margin % OR fixed amount
- Output: Calculated selling price
- OR reverse: Input selling price, show margin
- Save to rate button

---

**✅ PHASE 5 COMPLETE CRITERIA:**
- Can create selling rates
- Can set prices by occupancy
- Margin calculator works
- Can see margin for each rate
- Can filter by customer type

---

# PHASE 6: Integration & Polish (2-3 hours)

## Goal
Connect everything together and add finishing touches.

---

## Task 6.1: Add Quick Actions

Add "quick action" buttons throughout:

**On Product Details:**
- "Create Allocation" → pre-fills product
- "Add Selling Rate" → pre-fills product

**On Contract Details:**
- "Create Allocation" → pre-fills contract

**On Allocation Details:**
- "Setup Inventory" → navigates to inventory page
- "Add Supplier Rate" → pre-fills allocation
- "Generate Availability" → opens modal

---

## Task 6.2: Add Wizards

**Booking Flow Preview:**
Create a "Test Booking" button that shows:
1. Select product & dates
2. Shows available options
3. Shows prices (from selling rates)
4. Shows availability status
5. (Don't actually create booking yet)

This validates the entire system is connected.

---

## Task 6.3: Add Dashboard Widgets

**File: `src/app/(dashboard)/dashboard/page.tsx`**

Add widgets:
- **Low Availability Alert**: Products with <10% availability
- **Expiring Allocations**: Allocations ending in 30 days
- **Rate Gaps**: Product options without selling rates
- **Inventory Utilization**: Chart showing booking %
- **Top Products**: By booking count

---

## Task 6.4: Add Real-time Updates

Use Supabase realtime subscriptions for:
- Availability changes
- New bookings
- Rate updates

---

## Task 6.5: Add Keyboard Shortcuts

- `Cmd/Ctrl + K`: Quick search products
- `Cmd/Ctrl + N`: New product
- `Cmd/Ctrl + S`: Save changes
- `Esc`: Close modals

---

## Task 6.6: Mobile Optimization

Ensure all pages work on mobile:
- Stack table columns vertically
- Use accordion for details
- Touch-friendly buttons
- Responsive calendar

---

## Task 6.7: Add Help & Tooltips

Add help icons with tooltips explaining:
- Allocation types
- Rate basis options
- Release days
- Overbooking
- Flexible configuration

---

**✅ PHASE 6 COMPLETE CRITERIA:**
- All pages connected
- Quick actions work
- Dashboard shows insights
- Mobile responsive
- Help tooltips present

---

# Complete System Flow

Here's how everything connects:

```
1. Create PRODUCT (hotel)
   ↓
2. Add PRODUCT OPTIONS (room types)
   ↓
3. Create CONTRACT with supplier
   ↓
4. Create CONTRACT ALLOCATION (link contract → product)
   ↓
5. Setup ALLOCATION INVENTORY (assign quantities to options)
   ↓
6. Generate AVAILABILITY (daily inventory records)
   ↓
7. Add SUPPLIER RATES (costs per option/occupancy)
   ↓
8. Add SELLING RATES (prices per option/occupancy)
   ↓
9. System ready for bookings! ✅
```

---

# Design Guidelines

## Color Scheme

**Product Types:**
- Hotel: Blue (#3B82F6)
- Event Ticket: Purple (#A855F7)
- Tour: Green (#10B981)
- Transfer: Orange (#F59E0B)

**Allocation Types:**
- Allotment: Blue
- Free Sell: Green
- On Request: Orange

**Availability:**
- High (>50%): Green
- Medium (10-50%): Yellow
- Low (1-10%): Orange
- Sold Out: Red
- Closed: Gray

**Margins:**
- Good (>20%): Green
- Ok (10-20%): Yellow
- Low (<10%): Red

---

# Testing Checklist

Before completing each phase, test:

**Phase 1:**
- [ ] Create hotel product with attributes
- [ ] Create event ticket product
- [ ] Add multiple options to product
- [ ] Edit product inline
- [ ] Delete product (with confirmation)

**Phase 2:**
- [ ] Create allocation for hotel
- [ ] Add inventory to options
- [ ] Generate availability for date range
- [ ] View allocation details

**Phase 3:**
- [ ] View availability calendar
- [ ] Update single date
- [ ] Bulk update multiple dates
- [ ] Close/open dates
- [ ] Filter by product

**Phase 4:**
- [ ] Create supplier rate
- [ ] Add occupancy costs (single, double, triple)
- [ ] Add taxes/fees
- [ ] View rate in allocation

**Phase 5:**
- [ ] Create selling rate
- [ ] Set prices by occupancy
- [ ] Calculate margin
- [ ] Compare supplier vs selling rate

**Phase 6:**
- [ ] Quick action buttons work
- [ ] Dashboard widgets load
- [ ] Mobile view works
- [ ] Keyboard shortcuts work

---

# Success Criteria

The system is complete when:

✅ Products can be created with type-specific attributes
✅ Product options can be managed
✅ Contract allocations can be created
✅ Inventory can be assigned to options
✅ Availability generates correctly
✅ Availability calendar displays properly
✅ Supplier rates can be configured
✅ Selling rates can be configured
✅ Margins calculate correctly
✅ All CRUD operations work
✅ Inline editing works
✅ Loading states display
✅ Error handling works
✅ Mobile responsive
✅ Real-time updates (optional)
✅ System ready for booking module

---

# Next Steps

After completing all phases, you'll be ready to build:
- **Customers Module**: Customer management
- **Bookings Module**: The booking engine that uses all this data
- **Reports Module**: Analytics and insights

---

**This is the foundation of your entire booking system. Take your time with each phase and test thoroughly!** 🚀

Let me know when you're ready to start with Phase 1! 💪