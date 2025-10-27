# Contract Tabs Analysis

## Current Tabs in Contracts Detail Page

1. **Overview** - Basic contract info ✅
2. **Terms & Conditions** - Uses `terms_and_conditions` TEXT field ✅
3. **Payment Schedule** - ❌ Separate table/component not in main schema
4. **Cancellation Policy** - Uses `cancellation_policy` TEXT field ✅
5. **Allocations** - Uses `contract_allocations` table ✅
6. **Deadlines** - ❌ Not in main contract schema
7. **Rates** - Uses `supplier_rates` table ✅
8. **Commission Tiers** - ❌ Not in main contract schema

## What EXISTS in Database

### Contract Table Fields:
- ✅ `payment_terms` (TEXT) - Simple text field
- ✅ `cancellation_policy` (TEXT) - Simple text field
- ✅ `terms_and_conditions` (TEXT) - Simple text field
- ✅ `notes` (TEXT) - Simple text field

### Related Tables That EXIST:
- ✅ `contract_allocations` - Product-level allocations
- ✅ `supplier_rates` - Pricing/rates table

## Recommendation

### KEEP These Tabs:
1. ✅ **Overview** - Core contract information
2. ✅ **Terms & Conditions** - Uses `terms_and_conditions` and `notes` fields
3. ✅ **Cancellation Policy** - Uses `cancellation_policy` TEXT field (inline editing)
4. ✅ **Payment Terms** - Uses `payment_terms` TEXT field (inline editing)
5. ✅ **Allocations** - Uses `contract_allocations` table
6. ✅ **Rates** - Uses `supplier_rates` table

### REMOVE These Tabs:
1. ❌ **Payment Schedule** - No dedicated payment schedules table
2. ❌ **Deadlines** - Not in main contract schema
3. ❌ **Commission Tiers** - Not in main contract schema

## Simplified Tab Structure (Recommended)

```
1. Overview - Basic info
2. Terms - Terms, conditions, notes (all TEXT fields combined)
3. Financial - Payment terms, cancellation policy
4. Allocations - Product allocations
5. Rates - Supplier rates
```

## Simplified Alternative (Even Simpler)

Since payment_terms, cancellation_policy, and terms_and_conditions are all simple TEXT fields:

```
1. Overview - All basic info
2. Details - Terms, payment terms, cancellation policy, notes (all in one place)
3. Allocations - Product allocations  
4. Rates - Supplier rates
```
