# Contract MVP Implementation

## Overview

This document outlines the MVP contract structure enhancements that have been implemented to make contracts actually usable for tour operators.

## What Was Added

### Database Schema Changes

#### Contracts Table Enhancements
- **`contract_type`** (TEXT): Type of contract - 'net_rate', 'commissionable', or 'allocation'
- **`signed_date`** (DATE): Date when contract was actually executed  
- **`notes`** (TEXT): Additional notes and terms for this contract

#### Contract Versions Table Enhancements
- **`commission_rate`** (NUMERIC): Commission rate as percentage (0-100) for commissionable contracts
- **`currency`** (TEXT): Currency for contracted rates (defaults to 'USD')
- **`booking_cutoff_days`** (INTEGER): Days before travel to cut off bookings for this contract version

#### Attrition Tracking Fields
- **`attrition_applies`** (BOOLEAN): Whether attrition tracking applies to this contract version
- **`committed_quantity`** (INTEGER): Committed quantity for attrition tracking (e.g., 100 rooms)
- **`minimum_pickup_percent`** (NUMERIC): Minimum pickup percentage to avoid penalties (e.g., 80%)
- **`penalty_calculation`** (TEXT): How penalties are calculated: 'pay_for_unused', 'sliding_scale', or 'fixed_fee'
- **`grace_allowance`** (INTEGER): Grace allowance in units before penalties apply
- **`attrition_period_type`** (TEXT): Period type for attrition tracking: 'monthly', 'seasonal', or 'event'

### Why These Specific Fields?

1. **`contract_type`** - You MUST know if this is a net rate contract or commissionable. This affects your entire pricing calculation in rate plans.

2. **`signed_date`** - Legal/audit requirement. When did this actually get executed?

3. **`commission_rate`** - If it's commissionable, you need this number to calculate costs vs. prices.

4. **`currency`** - Rate plans reference contract versions. They need to know what currency the contracted rates are in.

5. **`booking_cutoff_days`** - Operational necessity. "Can I book this rate for next week?" depends on this.

6. **`notes`** - Catch-all for anything else without creating new tables.

7. **`attrition_applies`** - Whether this contract version has attrition clauses that need tracking.

8. **`committed_quantity`** - The guaranteed allotment (e.g., 100 rooms) that the operator committed to.

9. **`minimum_pickup_percent`** - The minimum percentage (e.g., 80%) that must be utilized to avoid penalties.

10. **`penalty_calculation`** - How penalties are calculated when minimums aren't met.

11. **`grace_allowance`** - Units allowed to miss before penalties apply.

12. **`attrition_period_type`** - Whether attrition is tracked monthly, seasonally, or per event.

## Implementation Details

### Files Modified

1. **Database Migration**: `db/migrations/contract_mvp_enhancements.sql`
   - Adds all new columns with proper constraints
   - Adds indexes for performance
   - Includes helpful comments

2. **Contract Actions**: `app/contracts/actions.ts`
   - Updated validation schemas to include new fields
   - Modified create/update functions to handle new data

3. **Contract Versions Actions**: `app/contracts/versions/actions.ts`
   - New file for contract version management
   - Handles commission rates, currency, booking cutoffs, and attrition tracking

4. **Contract Sheet Component**: `components/contracts/ContractSheet.tsx`
   - Added form fields for contract type, signed date, and notes
   - Enhanced UI with proper validation and tooltips

5. **Contract Version Sheet Component**: `components/contracts/ContractVersionSheet.tsx`
   - New component for creating/editing contract versions
   - Includes attrition tracking fields with proper validation
   - Enhanced UI with conditional fields and tooltips

6. **Contracts Page Client**: `components/contracts/ContractsPageClient.tsx`
   - Updated table columns to display contract type and signed date
   - Added visual indicators for contract types

### Database Constraints

- `contract_type` must be one of: 'net_rate', 'commissionable', 'allocation'
- `commission_rate` must be between 0 and 100 (if provided)
- `booking_cutoff_days` must be positive (if provided)
- `minimum_pickup_percent` must be between 0 and 100 (if provided)
- `penalty_calculation` must be one of: 'pay_for_unused', 'sliding_scale', 'fixed_fee'
- `attrition_period_type` must be one of: 'monthly', 'seasonal', 'event'
- `committed_quantity` must be positive (if provided)
- `grace_allowance` must be non-negative (if provided)
- Added indexes for performance on frequently queried fields

## Usage Examples

### Creating a Net Rate Contract
```typescript
const contract = await createContract({
  supplier_id: BigInt(123),
  reference: "HOTEL-2024-001",
  status: "active",
  contract_type: "net_rate",
  signed_date: new Date("2024-01-15"),
  notes: "Special rates for high season"
});
```

### Creating a Commissionable Contract Version
```typescript
const version = await createContractVersion({
  contract_id: BigInt(456),
  valid_from: new Date("2024-01-01"),
  valid_to: new Date("2024-12-31"),
  commission_rate: 15.5,
  currency: "USD",
  booking_cutoff_days: 7,
  cancellation_policy: {
    type: "tiered",
    rules: [
      { days_before: 60, penalty_percent: 25 },
      { days_before: 30, penalty_percent: 50 }
    ]
  }
});
```

### Creating a Contract Version with Attrition Tracking
```typescript
const versionWithAttrition = await createContractVersion({
  contract_id: BigInt(456),
  valid_from: new Date("2024-01-01"),
  valid_to: new Date("2024-12-31"),
  commission_rate: 12.0,
  currency: "USD",
  booking_cutoff_days: 14,
  // Attrition tracking
  attrition_applies: true,
  committed_quantity: 100, // 100 rooms committed
  minimum_pickup_percent: 80, // Must use 80% to avoid penalties
  penalty_calculation: "pay_for_unused", // Pay for unused rooms
  grace_allowance: 5, // 5 rooms grace before penalties
  attrition_period_type: "monthly", // Track monthly
  cancellation_policy: {
    type: "tiered",
    rules: [
      { days_before: 60, penalty_percent: 25 },
      { days_before: 30, penalty_percent: 50 }
    ]
  }
});
```

## JSONB Structure Examples

### Cancellation Policy
```json
{
  "type": "tiered",
  "rules": [
    {"days_before": 60, "penalty_percent": 25},
    {"days_before": 30, "penalty_percent": 50},
    {"days_before": 14, "penalty_percent": 100}
  ]
}
```

### Payment Policy
```json
{
  "deposit_percent": 25,
  "deposit_due_days": 7,
  "final_payment_days": 60
}
```

### Terms (Kitchen Sink)
```json
{
  "minimum_pax": 2,
  "child_age_max": 17,
  "credit_terms_days": 30,
  "special_conditions": "Free cancellation for groups 20+"
}
```

## Migration Script

Run the migration with:
```bash
node scripts/apply-contract-mvp-migration.js
```

The script will:
- Apply all database schema changes
- Handle re-runs gracefully (won't fail if columns already exist)
- Provide detailed progress feedback
- Validate the migration was successful

## What's NOT Included (Future Enhancements)

For MVP, we deliberately skipped:
- ❌ Contract templates
- ❌ Amendment tracking (just create new versions)
- ❌ Separate financials table
- ❌ Allocation commitments table
- ❌ Status log table (use updated_at + current status field)
- ❌ Multi-party contracts
- ❌ Contract owner/stakeholder tracking
- ❌ Attrition tracking (for larger operators)

## Business Impact

### For Small-Mid Tour Operators
- **Immediate Value**: Can now track contract types and commission rates
- **Operational**: Booking cutoff days prevent last-minute booking issues
- **Compliance**: Signed dates for audit trails
- **Flexibility**: Notes field for custom terms

### For Rate Plan Integration
- Rate plans can now inherit contract version policies
- Commission calculations are now possible
- Currency handling is standardized
- Booking rules are enforceable

## Next Steps

1. **Test the Implementation**
   - Create sample contracts with different types
   - Test contract version creation with commission rates
   - Verify UI displays new fields correctly

2. **Rate Plan Integration**
   - Update rate plan creation to reference contract versions
   - Implement commission calculation logic
   - Add booking cutoff validation

3. **Future Enhancements** (when needed)
   - Add attrition tracking for larger operators
   - Implement contract templates
   - Add amendment tracking
   - Create allocation commitment tracking

## Technical Notes

- All new fields are optional to maintain backward compatibility
- Proper validation ensures data integrity
- Indexes added for performance on key fields
- UI components include proper error handling and validation
- Migration script is idempotent (safe to run multiple times)

This MVP implementation provides the essential foundation for contract management while keeping complexity minimal for small-to-mid sized tour operators.
