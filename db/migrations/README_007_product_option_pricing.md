# Migration 007: Remove Pricing from product_options

## Overview

This migration removes pricing columns (`base_price`, `base_cost`, `currency`) from the `product_options` table and migrates existing pricing data to the `supplier_rates` and `selling_rates` tables.

## Why This Migration Exists

### The Problem

Previously, pricing was stored directly in the `product_options` table:

```sql
product_options (
  id,
  product_id,
  option_name,
  base_price,      -- ❌ Hard-coded pricing
  base_cost,       -- ❌ Can't change by season
  currency
)
```

This approach has several limitations:
- ❌ No seasonal pricing (same product, different rates for different dates)
- ❌ No multiple suppliers for same product
- ❌ No time-based pricing (peak/off-peak rates)
- ❌ No audit trail (can't track which rate was used at booking time)
- ❌ No occupancy-based pricing (single/double/triple rooms)

### The Solution

Move all pricing to dedicated rates tables:

```sql
product_options (
  id,
  product_id,
  option_name
  -- NO PRICING! ✅ Just product details
)

supplier_rates (
  product_option_id,
  base_cost,
  currency,
  valid_from,
  valid_to,
  pricing_details  -- JSONB for complex pricing
)

selling_rates (
  product_option_id,
  base_price,
  currency,
  valid_from,
  valid_to,
  pricing_details  -- JSONB for complex pricing
)
```

### Benefits

✅ **Seasonal Pricing**: Different rates for different date ranges
```typescript
// Summer rate
supplier_rates {
  product_option_id: 'std-room',
  valid_from: '2025-06-01',
  valid_to: '2025-08-31',
  base_cost: 450  // Cheap summer rate
}

// GP weekend rate (same product!)
supplier_rates {
  product_option_id: 'std-room',  // SAME product!
  valid_from: '2025-05-22',
  valid_to: '2025-05-25',
  base_cost: 950  // Expensive GP rate
}
```

✅ **Multiple Suppliers**: Same product, different costs
```typescript
// Supplier A (cheap)
supplier_rates {
  supplier_id: 'hotel-direct',
  product_option_id: 'std-room',
  base_cost: 900
}

// Supplier B (backup)
supplier_rates {
  supplier_id: 'booking-com',
  product_option_id: 'std-room',  // SAME product!
  base_cost: 950
}
```

✅ **Occupancy-Based Pricing**: Different rates for different occupancy
```typescript
supplier_rates {
  base_cost: 950,
  pricing_details: {
    occupancy_pricing: {
      single: { adults: 1, cost_per_night: 950 },
      double: { adults: 2, cost_per_night: 950 },  // Same rate
      triple: { adults: 3, cost_per_night: 1000 }  // +€50 extra bed
    }
  }
}
```

✅ **Audit Trail**: Track which rate was used
```typescript
booking_items {
  supplier_rate_id: 'rate-xyz',  // Which rate was used
  unit_cost: 2850,               // Locked at booking time
  // Even if rate changes later, booking keeps old rate!
}
```

## What This Migration Does

### 1. Migrate Existing Data

For each product option that has pricing:
- Creates a `supplier_rate` record (if `base_cost` exists)
- Creates a `selling_rate` record (if `base_price` exists)
- Migrates dates to: `2024-01-01` to `2099-12-31` (very wide range)
- Sets `rate_basis` to `'per_unit'` (you should update this)

### 2. Remove Columns

Drops these columns from `product_options`:
- `base_price`
- `base_cost`
- `currency`

### 3. Add Documentation

Adds a comment to `product_options` table explaining why pricing isn't here.

### 4. Verify Migration

Checks that:
- Columns are removed
- Rates are created
- No orphaned pricing data exists

## How to Apply This Migration

### Option 1: Using Supabase CLI

```bash
# Link to your project
npx supabase link --project-ref xhjxfpnsxxnwcfhadgad

# Run the migration
npx supabase db push

# Or apply manually
psql -h db.xhjxfpnsxxnwcfhadgad.supabase.co -U postgres -d postgres -f db/migrations/007_remove_product_option_pricing.sql
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `007_remove_product_option_pricing.sql`
4. Paste and run

### Option 3: Direct Database Connection

```bash
# Connect to your database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xhjxfpnsxxnwcfhadgad.supabase.co:5432/postgres"

# Run the migration
\i db/migrations/007_remove_product_option_pricing.sql
```

## Rollback

If you need to rollback this migration, you can use the rollback script included in the migration file (commented out at the bottom).

⚠️ **Important**: The rollback script will:
1. Restore the columns
2. Pull data from the most recent rate for each product option
3. May not restore 100% accurate data if you've created multiple rates

## What to Update After Migration

### 1. TypeScript Types

Update `lib/types/product.ts`:

```typescript
// BEFORE ❌
export interface ProductOption {
  base_price: number | null
  base_cost: number | null
  currency: string | null
}

// AFTER ✅
export interface ProductOption {
  // Pricing removed!
  // Use supplier_rates and selling_rates instead
}
```

### 2. Product Option Forms

Remove pricing fields from `components/products/product-option-form.tsx`:

```typescript
// REMOVE these fields from the form:
// - base_price
// - base_cost
// - currency
```

### 3. Product Detail Page

Update `app/(dashboard)/products/[id]/page.tsx` to:
- Remove pricing columns from product options table
- Show rates instead of option prices
- Link to rate management

### 4. Booking Flow

Update booking logic to:
- Fetch rates from `supplier_rates` and `selling_rates`
- Calculate prices based on date and occupancy
- Store `supplier_rate_id` and `selling_rate_id` in booking items

### 5. Validation Schema

Update `lib/validations/product.schema.ts`:

```typescript
// REMOVE from productOptionSchema:
// - base_price
// - base_cost
// - currency
```

## Example: Before vs After

### Before ❌

```typescript
// Create product option with pricing
const option = {
  option_name: "Standard Room - 3 nights",
  base_price: 3600,  // ❌ Hard-coded
  base_cost: 2850,   // ❌ Can't change
  currency: 'EUR'
}

// Can't have different rates for different dates!
```

### After ✅

```typescript
// Create product option (no pricing)
const option = {
  option_name: "Standard Room - 3 nights"
  // NO PRICING HERE!
}

// Create separate rates for different periods
const summerRate = {
  product_option_id: option.id,
  valid_from: '2025-06-01',
  valid_to: '2025-08-31',
  base_cost: 450,
  currency: 'EUR'
}

const gpWeekendRate = {
  product_option_id: option.id,  // SAME option!
  valid_from: '2025-05-22',
  valid_to: '2025-05-25',
  base_cost: 950,  // Different price!
  currency: 'EUR'
}
```

## Testing Checklist

After applying this migration:

- [ ] Verify product options no longer have pricing columns
- [ ] Verify supplier_rates were created for all options with base_cost
- [ ] Verify selling_rates were created for all options with base_price
- [ ] Update product option forms (remove pricing fields)
- [ ] Update product detail page (show rates, not prices)
- [ ] Update TypeScript types
- [ ] Update validation schemas
- [ ] Test creating new product options (should not have pricing)
- [ ] Test creating supplier rates
- [ ] Test creating selling rates
- [ ] Update booking flow to use rates

## Questions?

If you have questions about this migration, please refer to:
- [README.md](../../README.md) - Complete architecture documentation
- [Database Schema](../../database_schema.sql) - Full schema reference
- [Supplier Rates Documentation](../../docs/SUPPLIER_RATES.md) - Rate management guide

---

**Migration Created**: 2025-01-26  
**Author**: AI Assistant  
**Status**: Ready to Apply
