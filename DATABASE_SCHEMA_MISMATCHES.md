# Database Schema Mismatches Report

## Executive Summary
This document identifies critical mismatches between your `database_schema.sql` and your application code in `lib/types/database.ts` and other type files.

---

## 🔴 CRITICAL ISSUES

### 1. **Contracts Table - MISSING FIELDS**

**Database Schema (`database_schema.sql`)**:
```sql
CREATE TABLE contracts (
  id UUID,
  organization_id UUID,
  supplier_id UUID REFERENCES suppliers(id),
  event_id UUID REFERENCES events(id),  -- ✅ EXISTS
  contract_number VARCHAR(100),
  contract_name VARCHAR(255),
  contract_type VARCHAR(50) DEFAULT 'on_request',  -- ✅ EXISTS
  valid_from DATE,
  valid_to DATE,
  currency VARCHAR(3),
  total_cost NUMERIC(15,2),  -- ✅ EXISTS
  commission_rate NUMERIC(5,2),  -- ✅ EXISTS
  payment_terms TEXT,  -- ⚠️ EXISTS but wrong type
  cancellation_policy TEXT,  -- ⚠️ EXISTS but wrong type
  terms_and_conditions TEXT,  -- ✅ EXISTS
  contract_files JSONB DEFAULT '[]'::jsonb,  -- ✅ EXISTS
  notes TEXT,
  status contract_status DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Application Types (`lib/types/database.ts`)**:
```typescript
contracts: {
  Row: {
    id: string
    organization_id: string
    supplier_id: string
    // ❌ MISSING: event_id
    contract_number: string
    contract_name: string | null
    // ❌ MISSING: contract_type
    valid_from: string
    valid_to: string
    currency: string
    // ❌ MISSING: total_cost
    // ❌ MISSING: commission_rate
    payment_terms: any | null  // ⚠️ WRONG TYPE - should be TEXT
    cancellation_policy: any | null  // ⚠️ WRONG TYPE - should be TEXT
    rooming_list_deadline: number | null  // ❌ DOESN'T EXIST in schema
    cutoff_date: string | null  // ❌ DOESN'T EXIST in schema
    commission_rate: number | null  // ⚠️ Already exists above
    commission_type: string | null  // ❌ DOESN'T EXIST in schema
    contract_files: any | null  // ✅ EXISTS
    terms: string | null  // ❌ Should be 'terms_and_conditions'
    status: string
    created_by: string | null
    created_at: string
    updated_at: string
  }
}
```

**Missing Fields:**
- ❌ `event_id` - exists in DB but not in types
- ❌ `contract_type` - exists in DB but not in types  
- ❌ `total_cost` - exists in DB but not in types
- ❌ `terms_and_conditions` - wrong name in types (called `terms`)

**Extra Fields in Types (don't exist in DB):**
- ❌ `rooming_list_deadline` - doesn't exist in schema
- ❌ `cutoff_date` - doesn't exist in schema
- ❌ `commission_type` - doesn't exist in schema

---

### 2. **Suppliers Table - MISSING FIELDS**

**Database Schema**:
```sql
CREATE TABLE suppliers (
  id UUID,
  organization_id UUID,
  name VARCHAR(255),
  code VARCHAR(50),
  supplier_type VARCHAR(50),
  email VARCHAR(255),  -- ✅ EXISTS
  phone VARCHAR(50),  -- ✅ EXISTS
  contact_info JSONB,  -- ✅ EXISTS
  address_line1 VARCHAR(255),  -- ✅ EXISTS
  city VARCHAR(100),  -- ✅ EXISTS
  country VARCHAR(2),  -- ✅ EXISTS
  default_currency VARCHAR(3),  -- ✅ EXISTS
  is_active BOOLEAN,
  notes TEXT,  -- ✅ EXISTS
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Application Types**:
```typescript
suppliers: {
  Row: {
    id: string
    organization_id: string
    name: string
    code: string
    supplier_type: string | null
    // ❌ MISSING: email
    // ❌ MISSING: phone
    contact_info: any | null
    payment_terms: any | null  // ❌ DOESN'T EXIST in schema
    commission_rate: number | null  // ❌ DOESN'T EXIST in schema
    rating: number | null  // ❌ DOESN'T EXIST in schema
    total_bookings: number  // ❌ DOESN'T EXIST in schema
    is_active: boolean
    created_at: string
    updated_at: string
  }
}
```

**Missing Fields:**
- ❌ `email` - exists in DB but not in types
- ❌ `phone` - exists in DB but not in types
- ❌ `address_line1` - exists in DB but not in types
- ❌ `city` - exists in DB but not in types
- ❌ `country` - exists in DB but not in types
- ❌ `default_currency` - exists in DB but not in types
- ❌ `notes` - exists in DB but not in types

**Extra Fields in Types:**
- ❌ `payment_terms` - doesn't exist in schema
- ❌ `commission_rate` - doesn't exist in schema
- ❌ `rating` - doesn't exist in schema
- ❌ `total_bookings` - doesn't exist in schema

---

### 3. **Products Table - MISSING FIELDS**

**Database Schema**:
```sql
CREATE TABLE products (
  id UUID,
  organization_id UUID,
  product_type_id UUID,
  supplier_id UUID REFERENCES suppliers(id),  -- ✅ EXISTS
  name VARCHAR(255),
  code VARCHAR(100),
  description TEXT,  -- ✅ EXISTS
  location JSONB,  -- ✅ EXISTS
  venue_name VARCHAR(255),  -- ✅ EXISTS
  attributes JSONB,  -- ✅ EXISTS
  event_id UUID REFERENCES events(id),  -- ✅ EXISTS
  is_active BOOLEAN,  -- ✅ EXISTS
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Application Types**:
```typescript
products: {
  Row: {
    id: string
    organization_id: string
    product_type_id: string
    // ❌ MISSING: supplier_id
    name: string
    code: string
    description: string | null
    location: any | null
    attributes: any | null
    media: any | null  // ❌ DOESN'T EXIST in schema
    tags: string[] | null  // ❌ DOESN'T EXIST in schema
    meta_title: string | null  // ❌ DOESN'T EXIST in schema
    meta_description: string | null  // ❌ DOESN'T EXIST in schema
    is_active: boolean
    is_featured: boolean  // ❌ DOESN'T EXIST in schema
    created_by: string | null
    created_at: string
    updated_at: string
  }
}
```

**Missing Fields:**
- ❌ `supplier_id` - exists in DB but not in types
- ❌ `venue_name` - exists in DB but not in types
- ❌ `event_id` - exists in DB but not in types

**Extra Fields in Types:**
- ❌ `media` - doesn't exist in schema
- ❌ `tags` - doesn't exist in schema
- ❌ `meta_title` - doesn't exist in schema
- ❌ `meta_description` - doesn't exist in schema
- ❌ `is_featured` - doesn't exist in schema

---

### 4. **Contract Allocations Table - FIELD MISMATCHES**

**Database Schema**:
```sql
CREATE TABLE contract_allocations (
  id UUID,
  organization_id UUID,
  contract_id UUID,
  product_id UUID,
  allocation_name VARCHAR(255),
  allocation_type allocation_type DEFAULT 'on_request',
  total_quantity INTEGER,
  valid_from DATE,
  valid_to DATE,
  total_cost NUMERIC(15,2),
  cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3),
  release_days INTEGER,
  notes TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Application Types** (in `lib/types/contract.ts`):
```typescript
export interface ContractAllocation {
  id: string
  contract_id: string
  product_id: string
  allocation_name: string
  allocation_type: 'allotment' | 'free_sell' | 'on_request'
  valid_from: string
  valid_to: string
  // ❌ MISSING: total_quantity
  // ❌ MISSING: total_cost
  // ❌ MISSING: cost_per_unit
  // ❌ MISSING: currency
  // ❌ MISSING: release_days
  // ❌ MISSING: notes
  min_nights?: number  // ❌ DOESN'T EXIST in schema
  max_nights?: number  // ❌ DOESN'T EXIST in schema
  dow_arrival: string[]  // ❌ DOESN'T EXIST in schema
  allow_overbooking: boolean  // ❌ DOESN'T EXIST in schema
  is_active: boolean
  created_at: string
  updated_at: string
}
```

**Missing Fields:**
- ❌ `total_quantity` - exists in DB but not in types
- ❌ `total_cost` - exists in DB but not in types
- ❌ `cost_per_unit` - exists in DB but not in types
- ❌ `currency` - exists in DB but not in types
- ❌ `release_days` - exists in DB but not in types
- ❌ `notes` - exists in DB but not in types
- ❌ `organization_id` - exists in DB but not in types

**Extra Fields in Types:**
- ❌ `min_nights` - doesn't exist in schema
- ❌ `max_nights` - doesn't exist in schema
- ❌ `dow_arrival` - doesn't exist in schema
- ❌ `allow_overbooking` - doesn't exist in schema

---

## 🟡 MODERATE ISSUES

### 5. **Status Enums - Type Mismatches**

**Database** defines:
```sql
CREATE TYPE contract_status AS ENUM (
  'draft',          -- Being negotiated
  'active',         -- Live and in use
  'expired',        -- Past validity date
  'cancelled'       -- Terminated
);
```

**Application** expects:
```typescript
status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended'
```

**Problem**: 
- DB has `'cancelled'` but app expects `'terminated'`
- App has `'suspended'` but DB doesn't have it

---

### 6. **Type Definitions in Wrong Files**

The file `lib/types/contract.ts` defines interfaces that don't match the database schema, but they should be derived from `lib/types/database.ts`.

---

## 🔧 RECOMMENDED FIXES

### Fix 1: Update `lib/types/database.ts`

You need to regenerate this file from your actual database schema using Supabase CLI:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/database.ts
```

Or manually update it to match your `database_schema.sql`.

### Fix 2: Update Application Types

Once `database.ts` is fixed, update your custom interfaces in:
- `lib/types/contract.ts`
- `lib/types/supplier.ts`
- `lib/types/product.ts`

To extend the base types from `database.ts` instead of redefining them.

### Fix 3: Add Missing Database Columns

If your application code expects fields that don't exist in the schema, you need to either:
1. Add them to the database schema, OR
2. Remove them from the application code

### Fix 4: Fix Type Mismatches

Make sure all field types match:
- TEXT in DB = `string` in TS (not `any`)
- JSONB in DB = `any` or specific interface in TS
- DATE in DB = `string` in TS (ISO format)
- TIMESTAMPTZ in DB = `string` in TS (ISO format)

---

## 📋 SUMMARY

**Total Issues Found:**
- 🔴 **Critical**: 6 major table mismatches
- 🟡 **Moderate**: 3 type/enum mismatches
- ⚪ **Minor**: Several field name inconsistencies

**Most Affected Tables:**
1. `contracts` - 10+ field mismatches
2. `suppliers` - 7+ field mismatches
3. `contract_allocations` - 8+ field mismatches
4. `products` - 5+ field mismatches

**Root Cause:**
Your `lib/types/database.ts` file is out of sync with your `database_schema.sql`. This likely happened because:
1. The schema evolved independently of the types
2. The types were manually created instead of auto-generated
3. Multiple people worked on schema vs types

**Next Steps:**
1. Regenerate types from actual database
2. Update all custom type files to extend base types
3. Run type checking to find all code errors
4. Test all database operations
