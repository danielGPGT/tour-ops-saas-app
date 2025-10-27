# Database Schema vs TypeScript Types - Comprehensive Comparison

## Overview
This document compares the actual database schema (`db/database_schema.sql`) with the TypeScript type definitions in `lib/types/*.ts`.

**Last Updated:** Today  
**Database Schema Version:** 5.0 (MVP)

---

## 🚨 CRITICAL DISCREPANCIES

### 1. SUPPLIERS TABLE

#### Database Schema (`suppliers` table):
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  supplier_type VARCHAR(50),
  
  -- Contact (SPLIT INTO SEPARATE FIELDS!)
  email VARCHAR(255),
  phone VARCHAR(50),
  contact_info JSONB,
  
  -- Address (SPLIT INTO SEPARATE FIELDS!)
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(2),
  
  -- Settings
  default_currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### TypeScript Type (`lib/types/supplier.ts`):
```typescript
export interface Supplier {
  id: string
  organization_id: string
  name: string
  code: string
  supplier_type: string | null
  
  // ❌ MISSING: email, phone separate fields
  // ❌ MISSING: address_line1, city, country separate fields
  // ❌ MISSING: default_currency
  // ❌ MISSING: notes
  
  // ✅ HAS: contact_info (JSONB)
  contact_info: ContactInfo | null
  
  // ❌ WRONG: These don't exist in DB!
  payment_terms: string | null
  commission_rate: number | null  // Not in DB!
  rating: number | null            // Not in DB!
  total_bookings: number           // Not in DB!
  
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**ISSUES:**
1. ❌ Missing separate `email` and `phone` fields (database has them)
2. ❌ Missing separate address fields (`address_line1`, `city`, `country`)
3. ❌ Missing `default_currency` field
4. ❌ Missing `notes` field
5. ❌ TypeScript has fields that don't exist in DB: `payment_terms`, `commission_rate`, `rating`, `total_bookings`

---

### 2. CONTRACTS TABLE

#### Database Schema (`contracts` table):
```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  supplier_id UUID,
  
  -- Event linkage
  event_id UUID,
  
  -- Contract basics
  contract_number VARCHAR(100) NOT NULL,
  contract_name VARCHAR(255),
  contract_type VARCHAR(50) DEFAULT 'on_request',
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Financial
  currency VARCHAR(3) DEFAULT 'USD',
  total_cost NUMERIC(15,2),
  commission_rate NUMERIC(5,2),
  
  -- Terms (TEXT fields!)
  payment_terms TEXT,
  cancellation_policy TEXT,
  terms_and_conditions TEXT,
  
  -- Documents
  contract_files JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  
  -- Status
  status contract_status DEFAULT 'draft',
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
);
```

#### TypeScript Type (`lib/types/contract.ts`):
```typescript
export interface Contract {
  id: string
  organization_id: string
  supplier_id: string
  
  // ❌ WRONG: Should be string (DB has VARCHAR(50))
  contract_type: 'net_rate' | 'commissionable' | 'allocation' | 'on_request'
  
  contract_number: string
  contract_name?: string
  
  // ✅ CORRECT
  valid_from: string
  valid_to: string
  
  // ✅ CORRECT
  currency: string
  commission_rate?: number
  
  // ❌ MISSING: event_id
  // ❌ MISSING: total_cost
  // ❌ MISSING: payment_terms (TEXT not JSONB!)
  // ❌ MISSING: cancellation_policy (TEXT not JSONB!)
  // ❌ MISSING: terms_and_conditions
  // ❌ MISSING: notes
  
  // ❌ WRONG: These don't exist in DB!
  signed_date?: string
  commission_type: 'percentage' | 'fixed_amount' | 'tiered' | 'none'
  booking_cutoff_days?: number
  signed_document_url?: string
  special_terms?: string
  
  // ✅ CORRECT
  contract_files?: any[]
  
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended'
  created_by?: string
  created_at: string
  updated_at: string
}
```

**ISSUES:**
1. ❌ Missing `event_id` (links to events table)
2. ❌ Missing `total_cost` field
3. ❌ Missing `payment_terms` (TEXT field in DB, not JSONB)
4. ❌ Missing `cancellation_policy` (TEXT field in DB, not JSONB)
5. ❌ Missing `terms_and_conditions` (TEXT field)
6. ❌ Missing `notes` field
7. ❌ Has `contract_type` enum but DB uses VARCHAR(50) - should validate enum values
8. ❌ Fields in TypeScript that don't exist in DB: `signed_date`, `commission_type`, `booking_cutoff_days`, `signed_document_url`, `special_terms`

---

### 3. PRODUCTS TABLE

#### Database Schema (`products` table):
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  product_type_id UUID NOT NULL,
  supplier_id UUID,  -- ⭐ NEW!
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Location (JSONB!)
  location JSONB,
  venue_name VARCHAR(255),
  
  -- Details
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Event linkage (OPTIONAL!)
  event_id UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
);
```

#### TypeScript Type (`lib/types/product.ts`):
```typescript
export interface Product {
  id: string
  organization_id: string
  product_type_id: string
  
  // ❌ MISSING: supplier_id
  // ❌ MISSING: venue_name
  
  name: string
  code: string
  description?: string
  
  // ✅ CORRECT
  location: Location  // Structure matches JSONB
  attributes: any
  
  // ❌ MISSING: event_id
  
  // ❌ TypeScript has fields that don't exist!
  tags: string[]      // Not in DB!
  media: Array<...>   // Not in DB!
  
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**ISSUES:**
1. ❌ Missing `supplier_id` (links products to suppliers)
2. ❌ Missing `venue_name` field
3. ❌ Missing `event_id` (links to events table)
4. ❌ TypeScript has `tags` and `media` fields that don't exist in DB
5. ❌ Missing `created_by` field

---

### 4. PRODUCT OPTIONS TABLE

#### Database Schema (`product_options` table):
```sql
CREATE TABLE product_options (
  id UUID PRIMARY KEY,
  product_id UUID NOT NULL,
  
  -- Option details
  option_name VARCHAR(255) NOT NULL,
  option_code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Pricing (SIMPLE!)
  base_price NUMERIC(10,2),
  base_cost NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Details
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### TypeScript Type (`lib/types/product.ts`):
```typescript
export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  description?: string
  
  // ❌ WRONG: These don't exist in DB!
  standard_occupancy: number   // Not in DB!
  max_occupancy: number        // Not in DB!
  bed_configuration?: string   // Not in DB!
  
  attributes: any
  
  // ❌ MISSING: Pricing fields!
  // base_price
  // base_cost
  // currency
  
  // ❌ Missing: sort_order
  
  is_active: boolean
}
```

**ISSUES:**
1. ❌ Missing pricing fields: `base_price`, `base_cost`, `currency`
2. ❌ TypeScript has fields that don't exist: `standard_occupancy`, `max_occupancy`, `bed_configuration`
3. ❌ Missing audit fields: `created_at`, `updated_at`

---

### 5. CONTRACT ALLOCATIONS TABLE

#### Database Schema (`contract_allocations` table):
```sql
CREATE TABLE contract_allocations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL,
  contract_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  -- Allocation details
  allocation_name VARCHAR(255),
  allocation_type allocation_type DEFAULT 'on_request',
  
  -- Quantity (OPTIONAL)
  total_quantity INTEGER,
  
  -- Dates
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Pricing (OPTIONAL)
  total_cost NUMERIC(15,2),
  cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Release (for hotel blocks)
  release_days INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### TypeScript Type (`lib/types/contract.ts`):
```typescript
export interface ContractAllocation {
  id: string
  contract_id: string
  product_id: string
  allocation_name: string
  
  // ⚠️ PARTIALLY WRONG
  allocation_type: 'allotment' | 'free_sell' | 'on_request'  // Missing 'batch'!
  
  valid_from: string
  valid_to: string
  
  // ❌ MISSING: total_quantity
  // ❌ MISSING: Pricing fields (total_cost, cost_per_unit, currency)
  
  // ❌ WRONG: These don't exist in DB!
  min_nights?: number
  max_nights?: number
  release_days: number        // ✅ EXISTS
  dow_arrival: string[]       // Not in DB!
  allow_overbooking: boolean  // Not in DB!
  
  // ❌ MISSING: notes
  // ❌ MISSING: organization_id
  
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**ISSUES:**
1. ❌ Missing `organization_id`
2. ❌ Missing `total_quantity`
3. ❌ Missing pricing fields: `total_cost`, `cost_per_unit`, `currency`
4. ❌ Missing `notes` field
5. ❌ TypeScript has fields that don't exist: `min_nights`, `max_nights`, `dow_arrival`, `allow_overbooking`
6. ❌ `allocation_type` missing 'batch' value (DB has 4 types: 'allotment', 'batch', 'free_sell', 'on_request')

---

### 6. ALLOCATION INVENTORY TABLE

#### Database Schema (`allocation_inventory` table):
```sql
CREATE TABLE allocation_inventory (
  id UUID PRIMARY KEY,
  contract_allocation_id UUID NOT NULL,
  product_option_id UUID NOT NULL,
  
  -- Quantity tracking
  total_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  
  -- Cost
  batch_cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Flags
  is_virtual_capacity BOOLEAN DEFAULT false,
  minimum_viable_quantity INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### TypeScript Type (`lib/types/contract.ts`):
```typescript
export interface AllocationInventory {
  id: string
  allocation_id: string  // ❌ WRONG NAME: Should be contract_allocation_id
  product_option_id: string
  total_quantity: number
  
  // ❌ MISSING: available_quantity
  // ❌ MISSING: sold_quantity
  // ❌ MISSING: batch_cost_per_unit
  // ❌ MISSING: currency
  
  // ❌ WRONG: These don't exist in DB!
  flexible_configuration: boolean      // Not in DB!
  alternate_option_ids: string[]       // Not in DB!
  
  // ❌ MISSING: notes
  // ❌ MISSING: is_virtual_capacity
  // ❌ MISSING: minimum_viable_quantity
  // ❌ MISSING: is_active
  
  created_at: string
  updated_at: string
}
```

**ISSUES:**
1. ❌ Wrong field name: `allocation_id` should be `contract_allocation_id`
2. ❌ Missing quantity fields: `available_quantity`, `sold_quantity`
3. ❌ Missing pricing fields: `batch_cost_per_unit`, `currency`
4. ❌ Missing flags: `is_virtual_capacity`, `minimum_viable_quantity`
5. ❌ Missing `notes` field
6. ❌ Missing `is_active` field
7. ❌ TypeScript has fields that don't exist: `flexible_configuration`, `alternate_option_ids`

---

## 📊 SUMMARY OF ISSUES

### By Category:

**Missing Fields (Should be added to TypeScript):**
- Suppliers: `email`, `phone`, `address_line1`, `city`, `country`, `default_currency`, `notes`
- Contracts: `event_id`, `total_cost`, `payment_terms` (TEXT), `cancellation_policy` (TEXT), `terms_and_conditions`, `notes`
- Products: `supplier_id`, `venue_name`, `event_id`, `created_by`
- Product Options: `base_price`, `base_cost`, `currency`, `created_at`, `updated_at`
- Allocations: `organization_id`, `total_quantity`, `total_cost`, `cost_per_unit`, `currency`, `notes`
- Allocation Inventory: `available_quantity`, `sold_quantity`, `batch_cost_per_unit`, `currency`, `is_virtual_capacity`, `minimum_viable_quantity`, `notes`, `is_active`

**Extra Fields (Not in Database, should be removed from TypeScript):**
- Suppliers: `payment_terms`, `commission_rate`, `rating`, `total_bookings`
- Contracts: `signed_date`, `commission_type`, `booking_cutoff_days`, `signed_document_url`, `special_terms`
- Products: `tags`, `media`
- Product Options: `standard_occupancy`, `max_occupancy`, `bed_configuration`
- Allocations: `min_nights`, `max_nights`, `dow_arrival`, `allow_overbooking`
- Allocation Inventory: `flexible_configuration`, `alternate_option_ids`

**Wrong Types/Values:**
- `contract_type` in Contract: Should allow string, not just enum values
- `allocation_type`: Missing 'batch' value
- `allocation_id` in AllocationInventory: Should be `contract_allocation_id`

---

## 🔧 RECOMMENDED ACTIONS

1. **Update TypeScript types** to match actual database schema
2. **Remove non-existent fields** from TypeScript types
3. **Add missing fields** to TypeScript types
4. **Update application code** that uses incorrect field names
5. **Regenerate types from actual database** using Supabase CLI

---

## 📝 NOTES

- The database schema is v5.0 (MVP version) and is simplified for MVP purposes
- The TypeScript types appear to be from an older or different version of the schema
- The database schema is the source of truth
- All application code should align with the database schema

