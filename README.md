# Cursor AI Prompt: Build Tour Operator Inventory & Booking Management System

## Context

I'm building a multi-tenant SaaS tour operator system with Supabase. Authentication is complete with app-sidebar and header already implemented. Now I need to build the core inventory and booking management features.

This is a B2B system for tour operators to manage:
- **Suppliers** (hotels, activity providers, etc.)
- **Contracts** with suppliers
- **Products** (hotels, tickets, tours, transfers)
- **Inventory & Availability** (room blocks, ticket allotments)
- **Bookings** (customer reservations)
- **Pricing** (supplier costs + selling rates)

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + RLS + Edge Functions)
- **State Management**: React Query / TanStack Query for server state
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **Date Handling**: date-fns
- **Charts**: Recharts (for dashboard)

---

## Database Schema Overview

The database follows this hierarchy:

```
Organizations
    ├── Suppliers
    │   └── Contracts
    │       ├── Contract Allocations (room blocks/ticket allotments)
    │       │   ├── Allocation Inventory (by product option)
    │       │   │   └── Availability (daily inventory)
    │       │   └── Supplier Rates (costs)
    │       └── Rate Taxes & Fees
    ├── Products (hotels, tickets, tours, transfers)
    │   ├── Product Options (room types, ticket categories)
    │   └── Selling Rates (prices to customers)
    ├── Customers
    └── Bookings
        ├── Booking Items (line items with inventory)
        └── Booking Passengers
```

---

## Key Database Tables (Reference)

### **suppliers**
```typescript
{
  id: UUID
  organization_id: UUID
  name: string
  code: string
  supplier_type: string  // 'hotel', 'dmc', 'activity', 'transport'
  contact_info: JSONB
  payment_terms: JSONB
  is_active: boolean
}
```

### **contracts**
```typescript
{
  id: UUID
  organization_id: UUID
  supplier_id: UUID
  contract_number: string
  contract_name: string
  valid_from: date
  valid_to: date
  currency: string
  status: string  // 'active', 'expired', 'draft'
}
```

### **products**
```typescript
{
  id: UUID
  organization_id: UUID
  product_type_id: UUID  // Links to product_types (hotel, event_ticket, tour, transfer)
  name: string
  code: string
  description: text
  location: JSONB
  attributes: JSONB
  is_active: boolean
}
```

### **product_options**
```typescript
{
  id: UUID
  product_id: UUID
  option_name: string  // "Deluxe Room Double", "Main Grandstand", etc.
  option_code: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration: string
  is_active: boolean
}
```

### **contract_allocations**
```typescript
{
  id: UUID
  organization_id: UUID
  contract_id: UUID
  product_id: UUID
  allocation_name: string
  allocation_type: 'allotment' | 'free_sell' | 'on_request'
  valid_from: date
  valid_to: date
  min_nights: number  // For hotels
  max_nights: number
  release_days: number  // Release inventory X days before
  dow_arrival: string[]  // Day of week restrictions
  allow_overbooking: boolean
  is_active: boolean
}
```

### **allocation_inventory**
```typescript
{
  id: UUID
  contract_allocation_id: UUID
  product_option_id: UUID
  total_quantity: number  // e.g., 100 rooms or 500 tickets
  flexible_configuration: boolean
  alternate_option_ids: UUID[]
}
```

### **availability**
```typescript
{
  id: UUID
  allocation_inventory_id: UUID
  availability_date: date
  total_available: number
  booked: number
  provisional: number
  held: number
  available: number  // Auto-calculated
  is_closed: boolean
  is_released: boolean
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
  rate_name: string
  valid_from: date
  valid_to: date
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: string
}
```

### **rate_occupancy_costs**
```typescript
{
  id: UUID
  supplier_rate_id: UUID
  occupancy: number  // 1, 2, 3 for single, double, triple
  base_cost: number
  adult_cost: number
  child_cost: number
  board_basis: string  // 'room_only', 'BB', 'HB', 'FB', 'AI'
  currency: string
}
```

### **bookings**
```typescript
{
  id: UUID
  organization_id: UUID
  booking_reference: string  // Auto-generated unique ref
  booking_status: 'provisional' | 'confirmed' | 'cancelled'
  customer_id: UUID
  booking_date: timestamp
  travel_date_from: date
  travel_date_to: date
  total_cost: number  // Supplier costs
  total_price: number  // Selling price
  margin: number  // Price - Cost
  currency: string
  lead_passenger_name: string
  lead_passenger_email: string
  payment_status: string
}
```

### **booking_items**
```typescript
{
  id: UUID
  booking_id: UUID
  organization_id: UUID
  product_id: UUID
  product_option_id: UUID
  service_date_from: date
  service_date_to: date
  nights: number
  quantity: number
  adults: number
  children: number
  supplier_id: UUID
  contract_id: UUID
  allocation_inventory_id: UUID
  unit_cost: number
  unit_price: number
  total_cost: number
  total_price: number
  cost_currency: string
  price_currency: string
  base_currency: string
  margin_base: number
  item_status: 'provisional' | 'confirmed' | 'cancelled'
}
```

---

## RPC Functions Available

These PostgreSQL functions are already implemented:

```typescript
// Check availability with locking (prevents overbooking)
supabase.rpc('check_availability_with_lock', {
  p_allocation_inventory_id: UUID,
  p_date_from: DATE,
  p_date_to: DATE,
  p_quantity: number
})
// Returns: boolean

// Book inventory atomically
supabase.rpc('book_inventory_atomic', {
  p_allocation_inventory_id: UUID,
  p_booking_id: UUID,
  p_date_from: DATE,
  p_date_to: DATE,
  p_quantity: number,
  p_status: 'provisional' | 'confirmed'
})
// Returns: boolean

// Get exchange rate
supabase.rpc('get_exchange_rate', {
  p_from_currency: string,
  p_to_currency: string,
  p_date: timestamp,
  p_direction: 'mid' | 'buy' | 'sell',
  p_organization_id: UUID
})
// Returns: number

// Get user profile
supabase.rpc('get_user_profile')
// Returns: { id, email, first_name, organization: {...} }
```

---

## Project Structure

Build the following structure:

```
src/
├── app/
│   └── (dashboard)/
│       ├── dashboard/
│       │   └── page.tsx                    // ✅ Already done
│       ├── suppliers/
│       │   ├── page.tsx                    // List suppliers
│       │   ├── [id]/
│       │   │   ├── page.tsx                // View supplier details
│       │   │   └── edit/page.tsx           // Edit supplier
│       │   └── new/page.tsx                // Create supplier
│       ├── contracts/
│       │   ├── page.tsx                    // List contracts
│       │   ├── [id]/
│       │   │   ├── page.tsx                // View contract
│       │   │   ├── edit/page.tsx
│       │   │   ├── allocations/page.tsx    // Manage allocations
│       │   │   └── rates/page.tsx          // Manage rates
│       │   └── new/page.tsx
│       ├── products/
│       │   ├── page.tsx                    // List products
│       │   ├── [id]/
│       │   │   ├── page.tsx                // View product
│       │   │   ├── edit/page.tsx
│       │   │   ├── options/page.tsx        // Manage options
│       │   │   └── rates/page.tsx          // Selling rates
│       │   └── new/page.tsx
│       ├── inventory/
│       │   ├── page.tsx                    // Inventory overview
│       │   ├── availability/page.tsx       // Calendar view
│       │   └── [id]/page.tsx               // Detailed inventory
│       ├── bookings/
│       │   ├── page.tsx                    // List bookings
│       │   ├── [id]/
│       │   │   ├── page.tsx                // View booking
│       │   │   └── edit/page.tsx
│       │   └── new/page.tsx                // Create booking (wizard)
│       ├── customers/
│       │   ├── page.tsx
│       │   ├── [id]/page.tsx
│       │   └── new/page.tsx
│       └── reports/
│           ├── page.tsx                    // Reports hub
│           ├── sales/page.tsx
│           ├── inventory/page.tsx
│           └── financial/page.tsx
├── components/
│   ├── suppliers/
│   │   ├── supplier-list.tsx
│   │   ├── supplier-form.tsx
│   │   ├── supplier-card.tsx
│   │   └── supplier-stats.tsx
│   ├── contracts/
│   │   ├── contract-list.tsx
│   │   ├── contract-form.tsx
│   │   ├── allocation-form.tsx
│   │   ├── rate-form.tsx
│   │   └── contract-timeline.tsx
│   ├── products/
│   │   ├── product-list.tsx
│   │   ├── product-form.tsx
│   │   ├── product-card.tsx
│   │   ├── option-form.tsx
│   │   └── product-type-selector.tsx
│   ├── inventory/
│   │   ├── availability-calendar.tsx
│   │   ├── availability-grid.tsx
│   │   ├── inventory-card.tsx
│   │   └── bulk-update-modal.tsx
│   ├── bookings/
│   │   ├── booking-list.tsx
│   │   ├── booking-form-wizard.tsx
│   │   ├── booking-card.tsx
│   │   ├── booking-timeline.tsx
│   │   ├── product-selector.tsx
│   │   ├── date-selector.tsx
│   │   ├── passenger-form.tsx
│   │   └── booking-summary.tsx
│   ├── customers/
│   │   ├── customer-list.tsx
│   │   ├── customer-form.tsx
│   │   └── customer-card.tsx
│   ├── shared/
│   │   ├── data-table.tsx               // Reusable table
│   │   ├── status-badge.tsx
│   │   ├── currency-display.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── search-input.tsx
│   │   ├── filters.tsx
│   │   ├── pagination.tsx
│   │   ├── empty-state.tsx
│   │   └── loading-skeleton.tsx
│   └── layout/
│       ├── app-sidebar.tsx              // ✅ Already done
│       └── header.tsx                   // ✅ Already done
├── hooks/
│   ├── useAuth.ts                       // ✅ Already done
│   ├── useSuppliers.ts
│   ├── useContracts.ts
│   ├── useProducts.ts
│   ├── useInventory.ts
│   ├── useAvailability.ts
│   ├── useBookings.ts
│   ├── useCustomers.ts
│   └── useOrganization.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    // ✅ Already done
│   │   └── server.ts                    // ✅ Already done
│   ├── queries/
│   │   ├── suppliers.ts
│   │   ├── contracts.ts
│   │   ├── products.ts
│   │   ├── inventory.ts
│   │   ├── bookings.ts
│   │   └── customers.ts
│   ├── validations/
│   │   ├── supplier.schema.ts
│   │   ├── contract.schema.ts
│   │   ├── product.schema.ts
│   │   ├── booking.schema.ts
│   │   └── customer.schema.ts
│   └── utils/
│       ├── formatting.ts                // Currency, dates, etc.
│       ├── calculations.ts              // Pricing, margin, etc.
│       ├── reference-generator.ts       // Booking refs, codes
│       └── date-helpers.ts
├── types/
│   ├── supplier.ts
│   ├── contract.ts
│   ├── product.ts
│   ├── inventory.ts
│   ├── booking.ts
│   ├── customer.ts
│   └── database.ts                      // Generated from Supabase
└── constants/
    ├── product-types.ts
    ├── allocation-types.ts
    ├── currencies.ts
    └── countries.ts
```

---

## Implementation Phases

Build the system in this order for best dependencies:

---

## **PHASE 1: Foundation & Suppliers** (Build First)

### Task 1.1: Setup TypeScript Types

Create comprehensive types for all entities.

**File: `src/types/database.ts`**
- Generate from Supabase CLI: `supabase gen types typescript`
- Or manually create interfaces matching the schema

**File: `src/types/supplier.ts`**
```typescript
export interface Supplier {
  id: string
  organization_id: string
  name: string
  code: string
  supplier_type: 'hotel' | 'dmc' | 'activity' | 'transport' | 'other'
  contact_info: ContactInfo
  payment_terms: PaymentTerms
  commission_rate: number
  rating: number
  total_bookings: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContactInfo {
  primary_contact: string
  email: string
  phone: string
  address: Address
  website?: string
}

export interface PaymentTerms {
  payment_method: string
  credit_days: number
  terms: string
}
```

Similar types for: `contract.ts`, `product.ts`, `inventory.ts`, `booking.ts`, `customer.ts`

---

### Task 1.2: Create Utility Functions

**File: `src/lib/utils/formatting.ts`**
```typescript
// Currency formatting
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string

// Date formatting
export function formatDate(date: Date | string): string
export function formatDateRange(from: Date, to: Date): string

// Reference formatting
export function formatBookingReference(ref: string): string
```

**File: `src/lib/utils/calculations.ts`**
```typescript
// Calculate margin
export function calculateMargin(cost: number, price: number): number
export function calculateMarginPercentage(cost: number, price: number): number

// Calculate nights
export function calculateNights(checkIn: Date, checkOut: Date): number

// Price calculations
export function calculateTotal(unitPrice: number, quantity: number, nights?: number): number
```

**File: `src/lib/utils/reference-generator.ts`**
```typescript
// Generate unique references
export function generateBookingReference(prefix?: string): string
export function generateSupplierCode(name: string): string
export function generateContractNumber(supplierCode: string): string
```

---

### Task 1.3: Create Validation Schemas

**File: `src/lib/validations/supplier.schema.ts`**
```typescript
import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2).max(10),
  supplier_type: z.enum(['hotel', 'dmc', 'activity', 'transport', 'other']),
  contact_info: z.object({
    primary_contact: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.object({
      street: z.string().optional(),
      city: z.string(),
      country: z.string(),
      postal_code: z.string().optional()
    })
  }),
  payment_terms: z.object({
    payment_method: z.string(),
    credit_days: z.number().min(0).max(365),
    terms: z.string().optional()
  }),
  commission_rate: z.number().min(0).max(100).optional(),
  is_active: z.boolean().default(true)
})

export type SupplierFormData = z.infer<typeof supplierSchema>
```

Similar schemas for other entities.

---

### Task 1.4: Create Supabase Query Functions

**File: `src/lib/queries/suppliers.ts`**
```typescript
import { createClient } from '@/lib/supabase/client'
import type { Supplier } from '@/types/supplier'

export async function getSuppliers(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data as Supplier[]
}

export async function getSupplier(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function createSupplier(supplier: Partial<Supplier>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .insert(supplier)
    .select()
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(id: string, updates: Partial<Supplier>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}
```

---

### Task 1.5: Create React Query Hooks

**File: `src/hooks/useSuppliers.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as supplierQueries from '@/lib/queries/suppliers'
import type { Supplier } from '@/types/supplier'

export function useSuppliers() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['suppliers', profile?.organization.id],
    queryFn: () => supplierQueries.getSuppliers(profile!.organization.id),
    enabled: !!profile?.organization.id
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => supplierQueries.getSupplier(id),
    enabled: !!id
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: Partial<Supplier>) => 
      supplierQueries.createSupplier({
        ...data,
        organization_id: profile!.organization.id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      supplierQueries.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => supplierQueries.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })
}
```

---

### Task 1.6: Create Reusable Data Table Component

**File: `src/components/shared/data-table.tsx`**

Build a reusable table component using TanStack Table with:
- Sorting
- Filtering
- Pagination
- Row selection
- Column visibility
- Search
- Export (optional)

Use shadcn/ui table components as base.

---

### Task 1.7: Build Suppliers List Page

**File: `src/app/(dashboard)/suppliers/page.tsx`**

Features:
- Display all suppliers in data table
- Search by name, code, type
- Filter by supplier type, status
- Sort by name, total bookings, rating
- Actions: View, Edit, Delete
- "Add Supplier" button → routes to `/suppliers/new`
- Stats cards showing:
  - Total suppliers
  - Active contracts
  - Total bookings this month

Design:
- Page header with title and actions
- Stats cards row
- Filters and search bar
- Data table
- Pagination

---

### Task 1.8: Build Supplier Form Component

**File: `src/components/suppliers/supplier-form.tsx`**

Multi-step form with React Hook Form + Zod:

**Step 1: Basic Information**
- Name (required)
- Code (auto-generated from name, editable)
- Supplier type (dropdown)
- Rating (1-5 stars)

**Step 2: Contact Information**
- Primary contact name
- Email
- Phone
- Address (street, city, country, postal code)
- Website

**Step 3: Payment Terms**
- Payment method (dropdown)
- Credit days (number)
- Commission rate (%)
- Terms (textarea)

Form validation, error messages, submit handling.

---

### Task 1.9: Build Create Supplier Page

**File: `src/app/(dashboard)/suppliers/new/page.tsx`**

- Page header with breadcrumbs
- Back button
- Supplier form component
- On success: redirect to supplier details page
- Toast notification on success/error

---

### Task 1.10: Build Supplier Details Page

**File: `src/app/(dashboard)/suppliers/[id]/page.tsx`**

Display:
- Supplier information card
- Contact details card
- Payment terms card
- Statistics (total bookings, contracts, etc.)
- Tabs:
  - Overview
  - Contracts (list all contracts with this supplier)
  - Products (list all products from this supplier)
  - Bookings (recent bookings)
- Actions: Edit, Delete, Activate/Deactivate

---

### Task 1.11: Build Edit Supplier Page

**File: `src/app/(dashboard)/suppliers/[id]/edit/page.tsx`**

- Same form as create
- Pre-filled with existing data
- Update functionality
- Redirect to details page on success

---

## **PHASE 2: Contracts** (Build Second)

Repeat similar pattern for Contracts:

### Task 2.1: Types & Validation
- `types/contract.ts`
- `validations/contract.schema.ts`

### Task 2.2: Queries & Hooks
- `queries/contracts.ts`
- `hooks/useContracts.ts`

### Task 2.3: Components
- `components/contracts/contract-list.tsx`
- `components/contracts/contract-form.tsx`
- `components/contracts/contract-card.tsx`
- `components/contracts/contract-timeline.tsx` (visual timeline of valid dates)

### Task 2.4: Pages
- `/contracts` - List page
- `/contracts/new` - Create page
- `/contracts/[id]` - Details page
- `/contracts/[id]/edit` - Edit page

**Key Features for Contracts:**
- Link to supplier (dropdown or autocomplete)
- Contract number (auto-generated)
- Valid from/to dates (date range picker)
- Currency selector
- Status badge (active, expired, draft)
- Upload contract files (PDF)
- Timeline visualization showing validity period
- Display all allocations for this contract

---

## **PHASE 3: Products** (Build Third)

### Task 3.1-3.4: Same pattern as above

**Key Features for Products:**
- Product type selector (hotel, event ticket, tour, transfer)
- Different forms based on product type:
  - Hotel: star rating, check-in/out times, amenities
  - Event: event date, venue, gates open time
  - Tour: duration, meeting point, inclusions
  - Transfer: vehicle type, route, luggage allowance
- Location picker (Google Maps or manual)
- Media upload (images, videos)
- Tags (for filtering)
- SEO fields (meta title, description, slug)

### Task 3.5: Product Options Management

**File: `/products/[id]/options/page.tsx`**

- Table showing all options for a product
- Add/Edit/Delete options
- For hotels: room types with bed config, occupancy
- For tickets: categories (VIP, Standard, etc.)
- For tours: group sizes, private vs shared
- Inline editing for quick updates

---

## **PHASE 4: Contract Allocations & Inventory** (Build Fourth)

This is where it gets complex!

### Task 4.1: Allocation Management

**File: `/contracts/[id]/allocations/page.tsx`**

Features:
- List all allocations for this contract
- Add new allocation
- Allocation form fields:
  - Allocation name
  - Product (dropdown - filtered by supplier)
  - Allocation type (allotment, free_sell, on_request)
  - Valid dates (date range)
  - Min/max nights (for hotels)
  - Release days
  - DOW restrictions (checkboxes for days)
  - Overbooking settings

### Task 4.2: Inventory Setup

**File: `/contracts/[id]/allocations/[allocationId]/inventory`**

For each allocation, set up inventory per product option:
- Table showing product options
- Quantity input for each option
- Flexible configuration toggle
- Alternate options selector
- Generate availability records button
- Visual indicator of availability generated

### Task 4.3: Availability Management

**File: `/inventory/availability/page.tsx`**

**Calendar View:**
- Month/week view selector
- Product filter
- Option filter
- Date range filter
- Grid showing:
  - Date
  - Product option
  - Total available
  - Booked
  - Provisional
  - Available (color-coded)
- Click on cell to edit
- Bulk update modal
- Close/open specific dates

**Features:**
- Color coding:
  - Green: >50% available
  - Yellow: 10-50% available
  - Orange: 1-10% available
  - Red: Sold out
  - Gray: Closed
- Quick actions:
  - Bulk update quantity
  - Close dates
  - Release inventory early
- Export to CSV

---

## **PHASE 5: Supplier Rates (Costs)** (Build Fifth)

### Task 5.1: Rates Management

**File: `/contracts/[id]/rates/page.tsx`**

Features:
- List all rates for this contract
- Grouped by product
- Add new rate form:
  - Product selector
  - Product option selector
  - Rate name
  - Valid dates
  - Rate basis (per_room_per_night, per_ticket, etc.)
  - DOW mask (rate applies only on certain days)
  - Priority (for rate selection)

### Task 5.2: Occupancy Costs

**Sub-component or modal:**
- For each rate, define costs by occupancy:
  - Single (1 person)
  - Double (2 persons)
  - Triple (3 persons)
  - Quad (4 persons)
- Extra adult/child costs
- Board basis options (Room Only, BB, HB, FB, AI)
- Board supplements
- Child age ranges

---

## **PHASE 6: Selling Rates (Prices)** (Build Sixth)

### Task 6.1: Selling Rates Management

**File: `/products/[id]/rates/page.tsx`**

Similar to supplier rates but for selling prices:
- List all selling rates for this product
- Add/edit selling rate
- Markup type (fixed amount or percentage)
- Customer type (B2C, B2B agent, B2B corporate)
- Min/max pax restrictions
- DOW restrictions
- Priority

### Task 6.2: Occupancy Prices

- Same pattern as supplier rates
- Show margin calculation (selling price - supplier cost)

---

## **PHASE 7: Customers** (Build Seventh)

Simpler CRUD:

### Task 7.1-7.4: Standard pattern
- Types, validation, queries, hooks
- List page
- Create/edit forms
- Details page

**Key Fields:**
- Customer type (B2C, B2B)
- Personal info (name, email, phone)
- Company info (for B2B)
- Address
- Preferences
- Marketing consent
- Tags
- Notes

---

## **PHASE 8: Bookings** (Build Last - Most Complex)

### Task 8.1: Booking List Page

**File: `/bookings/page.tsx`**

Features:
- Data table with all bookings
- Filters:
  - Status (provisional, confirmed, cancelled)
  - Date range
  - Customer
  - Product
  - Payment status
- Search by booking reference, customer name
- Stats cards:
  - Total bookings today
  - Revenue today
  - Pending confirmations
  - Cancellations
- Quick actions:
  - View
  - Edit
  - Confirm
  - Cancel
  - Send confirmation email

---

### Task 8.2: Create Booking Wizard

**File: `/bookings/new/page.tsx`**

Multi-step wizard:

**Step 1: Customer Selection**
- Search existing customer or create new
- Display customer details

**Step 2: Product Selection**
- Search products
- Filter by type, location
- Display product cards with:
  - Image
  - Name
  - Description
  - Base price
  - "Select" button

**Step 3: Date & Quantity**
- Date range picker (check-in/out for hotels, event date for tickets)
- Quantity selector
- Adults/children/infants counters
- Check availability button
- Display available options with prices

**Step 4: Option Selection**
- Show all available product options
- Display:
  - Option name
  - Availability
  - Price per unit
  - Total price
- Select option
- Add to booking
- Can add multiple products (hotel + tickets + tour)

**Step 5: Passenger Details**
- For each adult/child/infant, capture:
  - Title, first name, last name
  - Date of birth
  - Passport details (if required)
  - Dietary requirements
  - Special requests
- Lead passenger marked
- Quick fill option (copy from customer)

**Step 6: Review & Confirm**
- Summary of all booking items
- Display:
  - Each product with dates, quantity, price
  - Supplier costs (hidden from customer view)
  - Selling prices
  - Margin
  - Total cost, total price, total margin
- Currency display (with exchange rate if multi-currency)
- Payment status selector
- Internal notes
- Customer notes
- "Create Provisional Booking" button
- "Create Confirmed Booking" button

**Step 7: Success**
- Booking reference displayed
- Download/email confirmation button
- View booking button
- Create another booking button

**Key Logic:**
- On "Check Availability":
  - Call `check_availability_with_lock` RPC
  - Display available options with real-time inventory
  - If sold out, show "Sold Out" badge
- On "Add to Booking":
  - Create temporary hold (if implementing cart)
  - Update running totals
- On "Create Booking":
  - Create booking record
  - Create all booking items
  - Call `book_inventory_atomic` for each item
  - Update availability
  - Generate booking reference
  - Send confirmation email (optional)

---

### Task 8.3: Booking Details Page

**File: `/bookings/[id]/page.tsx`**

Display:
- Booking header:
  - Booking reference (large, prominent)
  - Status badge
  - Created date, travel dates
  - Customer name
- Customer card
- Booking items table:
  - Product, dates, quantity, price
  - Supplier info
  - Contract reference
  - Status
- Passengers list
- Payment information
- Timeline of changes (audit log)
- Actions:
  - Edit
  - Confirm
  - Cancel
  - Add item
  - Remove item
  - Send email
  - Download PDF
  - Generate invoice

---

### Task 8.4: Edit Booking Page

**File: `/bookings/[id]/edit/page.tsx`**

- Similar to create wizard but pre-filled
- Allow adding/removing items
- Allow changing dates (if availability permits)
- Allow changing quantities
- Recalculate pricing
- Show change summary before saving

---

## **PHASE 9: Dashboard & Reports** (Build Last)

### Task 9.1: Enhanced Dashboard

**File: `/dashboard/page.tsx`**

Widgets:
- Today's bookings count
- Today's revenue
- Pending confirmations count
- Availability alerts (low inventory)
- Recent bookings list
- Revenue chart (last 30 days)
- Top products chart
- Top suppliers list
- Upcoming releases (inventory about to be released)

### Task 9.2: Reports

**Sales Report:**
- Revenue by date range
- Revenue by product
- Revenue by supplier
- Conversion rates
- Average booking value

**Inventory Report:**
- Utilization rates
- Released inventory
- Expiring contracts
- Low availability alerts

**Financial Report:**
- Total costs
- Total revenue
- Gross margin
- By supplier, product, date range
- Currency breakdown

---

## Design Guidelines

### Color Scheme
- Primary: Blue (#0066cc)
- Success: Green (#10b981)
- Warning: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Neutral: Slate (#64748b)

### Status Colors
- Provisional: Yellow/Amber
- Confirmed: Green
- Cancelled: Red
- Expired: Gray
- Active: Blue

### Components
Use shadcn/ui components consistently:
- Button, Input, Select, Checkbox, Radio
- Card, Badge, Avatar
- Dialog, Sheet, Popover
- Table, Tabs, Accordion
- Calendar, DatePicker
- Form, Label, Error messages
- Toast/Sonner for notifications
- Loading states: Skeleton

### Responsive Design
- Mobile: Stack elements vertically
- Tablet: 2-column layouts
- Desktop: Full layouts with sidebars
- Tables: Scroll horizontally on mobile

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus states
- Error announcements

---

## Key Patterns to Follow

### 1. Consistent Page Structure
```tsx
export default function PageName() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page Title</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
        <Button>Primary Action</Button>
      </div>

      {/* Stats Cards (optional) */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard />
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4">
        <SearchInput />
        <Filters />
      </div>

      {/* Main Content */}
      <Card>
        <DataTable />
      </Card>
    </div>
  )
}
```

### 2. Form Handling Pattern
```tsx
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: {}
})

const mutation = useCreateEntity()

async function onSubmit(data: FormData) {
  try {
    await mutation.mutateAsync(data)
    toast.success('Created successfully')
    router.push('/list-page')
  } catch (error) {
    toast.error(error.message)
  }
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save'}
      </Button>
    </form>
  </Form>
)
```

### 3. Data Fetching Pattern
```tsx
const { data, isLoading, error } = useEntities()

if (isLoading) return <LoadingSkeleton />
if (error) return <ErrorState />
if (!data?.length) return <EmptyState />

return <DataTable data={data} />
```

### 4. Real-time Updates
```tsx
useEffect(() => {
  const channel = supabase
    .channel('table-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'bookings' },
      () => queryClient.invalidateQueries(['bookings'])
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

---

## Error Handling

1. **Form validation errors**: Display inline below fields
2. **API errors**: Show toast notification
3. **Network errors**: Show retry button
4. **Permission errors**: Show upgrade/contact admin message
5. **Not found errors**: Show 404 page with navigation

---

## Performance Optimization

1. **Lazy load heavy components**: Use `React.lazy()` for wizards, charts
2. **Debounce search inputs**: Wait 300ms before searching
3. **Paginate large lists**: Default 25 items per page
4. **Cache queries**: Use React Query's stale time
5. **Optimize images**: Use Next.js Image component
6. **Virtual scrolling**: For very long lists (>1000 items)

---

## Testing Strategy (Optional but Recommended)

1. **Unit tests**: Utility functions, calculations
2. **Integration tests**: API calls, form submissions
3. **E2E tests**: Critical user flows (create booking)

---

## Deployment Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Forms validate correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Mobile responsive
- [ ] Cross-browser tested
- [ ] Performance optimized

---

## Getting Started

**Recommended Build Order:**
1. Phase 1: Suppliers (foundation)
2. Phase 2: Contracts
3. Phase 3: Products
4. Phase 4: Allocations & Inventory
5. Phase 5: Supplier Rates
6. Phase 6: Selling Rates
7. Phase 7: Customers
8. Phase 8: Bookings (most complex)
9. Phase 9: Dashboard & Reports

**Start with:**
```bash
# Install additional dependencies
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form zod @hookform/resolvers
npm install date-fns recharts

# Generate Supabase types
supabase gen types typescript --project-id your-project > src/types/database.ts
```

Then begin with **Task 1.1: Setup TypeScript Types**

---

## Success Criteria

The system is complete when:
✅ Users can create suppliers, contracts, products
✅ Users can set up inventory allocations
✅ Users can manage availability calendars
✅ Users can configure supplier costs and selling rates
✅ Users can create customers
✅ Users can create bookings with real-time availability checks
✅ System prevents overbooking
✅ Multi-currency support works
✅ Margins are calculated correctly
✅ All pages are responsive
✅ Error handling is comprehensive
✅ Loading states are smooth

---

**Let's build this! Start with Phase 1 and work through systematically.** 🚀

Focus on getting Suppliers fully working first before moving to Contracts. This builds confidence and establishes patterns that will be reused throughout the system.