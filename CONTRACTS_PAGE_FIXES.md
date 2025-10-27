# Contracts Page & Components - Required Fixes

## Summary
The contracts page and components need **import path fixes** to use the correct type definitions.

## Issues Found

### 1. **Incorrect Import Paths** ❌
Several contract components are importing from the wrong path:

**Current (Wrong):**
```typescript
import type { Contract } from '@/types/contract'
```

**Should be:**
```typescript
import type { Contract } from '@/lib/types/contract'
```

**Files with incorrect imports:**
- `components/contracts/contract-list.tsx` (line 33)
- `components/contracts/contract-card.tsx` (line 38)
- `components/contracts/contract-timeline.tsx` (line 10)

**Files with correct imports (already fixed):**
- `components/contracts/contract-form.tsx` ✅
- `components/contracts/contract-dialog-form.tsx` ✅
- `components/contracts/ContractInlineEdit.tsx` ✅

### 2. **Type Fields Already Match** ✅
The contract type fields in `lib/types/contract.ts` already match the database schema perfectly:
- `commission_rate` ✅
- `payment_terms` ✅
- `cancellation_policy` ✅
- `terms_and_conditions` ✅
- All other fields ✅

### 3. **No Schema Mismatches** ✅
Unlike suppliers, contracts DON'T have any schema mismatches. The database schema and TypeScript types are already aligned.

## Required Actions

1. **Fix import paths** in the 3 contract component files listed above
2. **No other changes needed** - the contract types are already correct

## Files to Update

### `components/contracts/contract-list.tsx`
- Line 33: Change import path from `'@/types/contract'` to `'@/lib/types/contract'`

### `components/contracts/contract-card.tsx`
- Line 38: Change import path from `'@/types/contract'` to `'@/lib/types/contract'`

### `components/contracts/contract-timeline.tsx`
- Line 10: Change import path from `'@/types/contract'` to `'@/lib/types/contract'`

## Testing
After fixing the imports, verify:
1. Contracts page loads without errors
2. Contract list displays correctly
3. Contract cards render properly
4. No TypeScript errors in the console
