# Contract Allocations & Supplier Rates Analysis

## Overview

Contracts are linked to products through multiple related tables that provide different levels of pricing and inventory management.

## Table Relationships

```
contracts (main contract)
  ↓
contract_allocations (product-level terms within a contract)
  ↓
allocation_inventory (specific product option inventory)
  ↓
allocation_releases (release schedule for hotel blocks)

supplier_rates (what you pay, linked to contract)
selling_rates (what you sell, independent of contracts)
```

## 1. Contract Allocations

### Structure
```sql
CREATE TABLE contract_allocations (
  contract_id UUID NOT NULL REFERENCES contracts(id),
  product_id UUID NOT NULL REFERENCES products(id),
  
  allocation_type: allocation_type,  -- allotment | batch | free_sell | on_request
  total_quantity INTEGER,
  valid_from DATE,
  valid_to DATE,
  
  cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3),
  
  release_days INTEGER,  -- For hotel block releases
)
```

### Purpose
**Links specific products to a contract with pricing and terms.**

Example:
- Contract: "Grand Hotel 2024"
- Allocation: "Deluxe Rooms" product
- Terms: 50 rooms, $100/night, January 1-31

### Analysis ✅

**Strengths:**
- ✅ Flexible `allocation_type` supports different business models
- ✅ Date range separate from main contract
- ✅ Unit pricing at allocation level
- ✅ Release days for hotel attrition management

**Potential Issues:**
- ⚠️ No index on `contract_id` + `product_id` combo
- ⚠️ No unique constraint to prevent duplicate allocations
- ⚠️ Missing `allocation_code` field for easy reference

### Recommendations

**Add these fields:**
```sql
allocation_code VARCHAR(50) NOT NULL,  -- Unique identifier for this allocation
total_quantity_min INTEGER,           -- Minimum viable quantity
total_quantity_max INTEGER,           -- Maximum allowed quantity
priority INTEGER DEFAULT 0,           -- Priority when multiple allocations available
metadata JSONB DEFAULT '{}'::jsonb    -- Flexible metadata
```

**Add unique constraint:**
```sql
CONSTRAINT unique_contract_product_allocation 
UNIQUE (contract_id, product_id, allocation_code)
```

## 2. Allocation Inventory

### Structure
```sql
CREATE TABLE allocation_inventory (
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id),
  product_option_id UUID NOT NULL REFERENCES product_options(id),
  
  total_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  
  batch_cost_per_unit NUMERIC(12,2),
  is_virtual_capacity BOOLEAN DEFAULT false,  -- ⭐ KEY FOR SELL-FIRST!
  minimum_viable_quantity INTEGER,
)
```

### Purpose
**Tracks specific product option inventory within an allocation.**

Example:
- Allocation: "50 Deluxe Rooms"
- Inventory: "Double Bed" option = 30 rooms, "King Bed" option = 20 rooms

### Analysis ✅

**Strengths:**
- ✅ `is_virtual_capacity` flag = KEY for sell-first model!
- ✅ Tracks sold vs available
- ✅ Different cost per unit per option
- ✅ Minimum viable quantity

**Perfect for MVP!** No changes needed. ✅

## 3. Supplier Rates

### Current Structure
```sql
CREATE TABLE supplier_rates (
  organization_id UUID,
  product_id UUID,
  product_option_id UUID,
  contract_id UUID REFERENCES contracts(id),  -- ⚠️ Optional link!
  
  rate_basis VARCHAR(50),  -- per_night | per_person | per_unit
  valid_from DATE,
  valid_to DATE,
  base_cost NUMERIC(10,2),
  pricing_details JSONB,  -- For complex pricing
)
```

### Analysis ⚠️

**Potential Issue:**
The `contract_id` is **optional** which could be confusing:

1. **Contract-linked rate**: `contract_id` is set → rate comes from a contract
2. **Standalone rate**: `contract_id` is NULL → rate is independent

**Problem:**
- How do you know if a rate is from a contract or not?
- Should rates ALWAYS be linked to contracts?

### Recommendations

**Option 1: Keep it optional but add clarity**
```sql
rate_source VARCHAR(20) DEFAULT 'contract',  -- contract | standalone | template
```

**Option 2: Make contract_id required**
```sql
contract_id UUID NOT NULL REFERENCES contracts(id),
```

**Option 3: Add both**
```sql
contract_id UUID REFERENCES contracts(id),
rate_source VARCHAR(20) DEFAULT 'contract',
is_template BOOLEAN DEFAULT false,  -- Can this rate be reused?
```

## 4. Selling Rates

### Structure
```sql
CREATE TABLE selling_rates (
  organization_id UUID,
  product_id UUID,
  product_option_id UUID,
  -- ⚠️ NO contract_id field!
  
  rate_basis VARCHAR(50),
  base_price NUMERIC(10,2),
  markup_type VARCHAR(20),  -- fixed_amount | percentage
  markup_amount NUMERIC(10,2),
  pricing_details JSONB,
)
```

### Analysis ✅

**Why no contract_id?**
Selling rates are **independent** of contracts - they're what YOU sell to customers, not what the supplier charges you.

This is **correct**! Selling rates should be independent.

## Summary & Recommendations

### Contract Allocations: 8/10 🌟
**Good design, minor improvements needed:**

**Add:**
```sql
-- To contract_allocations table:
allocation_code VARCHAR(50) NOT NULL,
metadata JSONB DEFAULT '{}'::jsonb,
priority INTEGER DEFAULT 0,

-- Add unique constraint:
CONSTRAINT unique_contract_product 
UNIQUE (contract_id, product_id)
```

### Allocation Inventory: 10/10 🌟
**Perfect! No changes needed.**

### Supplier Rates: 7/10 ⚠️
**Clarify the contract relationship:**

**Option A (Recommended):** Add clarity fields
```sql
-- Add to supplier_rates:
rate_source VARCHAR(20) DEFAULT 'contract',
contract_id UUID REFERENCES contracts(id),  -- Keep optional
is_template BOOLEAN DEFAULT false,  -- Can be reused
```

**Option B:** Make contract required
```sql
contract_id UUID NOT NULL REFERENCES contracts(id),  -- Always link to contract
```

### Selling Rates: 10/10 🌟
**Perfect! Independent of contracts as it should be.**

## MVP Recommendation

**For now, supplier rates are FINE as-is.** The optional `contract_id` gives flexibility.

**Priority fixes:**
1. ✅ Add `allocation_code` to contract_allocations
2. ✅ Add unique constraint to prevent duplicates
3. ⚠️ Consider adding `rate_source` to supplier_rates for clarity

**Keep selling rates as-is** - they're correctly independent!
