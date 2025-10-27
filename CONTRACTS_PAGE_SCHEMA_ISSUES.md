# Contracts Page Schema Issues

## Issues Found

### 1. ⚠️ Missing Fields in Database Schema

The `app/(dashboard)/contracts/[id]/page.tsx` references fields that **DO NOT EXIST** in the database:

#### Fields Used BUT NOT IN DATABASE:
1. ❌ `commission_type` - Not in database schema
2. ❌ `signed_date` - Not in database schema  
3. ❌ `special_terms` - Not in database schema
4. ❌ `booking_cutoff_days` - Not in database schema

#### Fields in Database BUT NOT IN UI (yet):
- ✅ `event_id` - Can link contract to specific event
- ✅ `total_cost` - Total contract value
- ✅ `created_by` - Audit trail

### 2. ⚠️ Old Field References

**Supplier contact info:**
- UI tries to access: `supplier?.contact_info?.email`
- **Schema has direct fields**: `supplier?.email` (no `contact_info` object!)

### 3. ✅ Fields Matching Correctly

These fields ARE correct:
- `contract_number` ✅
- `contract_name` ✅
- `contract_type` ✅
- `valid_from` / `valid_to` ✅
- `currency` ✅
- `commission_rate` ✅
- `payment_terms` (TEXT) ✅
- `cancellation_policy` (TEXT) ✅
- `terms_and_conditions` (TEXT) ✅
- `notes` ✅
- `status` ✅
- `contract_files` (JSONB) ✅

## Required Fixes

### Fix 1: Remove Non-Existent Fields

**File:** `app/(dashboard)/contracts/[id]/page.tsx`

**Remove these sections:**

1. **Commission Type** (lines 415-420):
```tsx
// DELETE THIS:
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Commission Type</label>
  <EnterpriseInlineEdit
    value={contract.commission_type || ''}
    onSave={(value) => handleUpdate('commission_type', value)}
    placeholder="Select commission type"
  />
</div>
```

2. **Signed Date** (lines 366-382):
```tsx
// DELETE THIS:
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
  {isLoading ? (
    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
  ) : (
    <DatePicker
      date={contract?.signed_date ? new Date(contract.signed_date) : undefined}
      onDateChange={(date) => {
        if (date) {
          handleUpdate('signed_date', date.toISOString().split('T')[0])
        } else {
          handleUpdate('signed_date', null)
        }
      }}
      placeholder="Select signed date"
    />
  )}
</div>
```

3. **Booking Cutoff** (lines 383-391):
```tsx
// DELETE THIS:
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Booking Cutoff</label>
  <EnterpriseInlineEdit
    value={contract.booking_cutoff_days ? `${contract.booking_cutoff_days}` : ''}
    onSave={(value) => handleUpdate('booking_cutoff_days', parseInt(value) || null)}
    placeholder="Days before arrival"
  />
</div>
```

4. **Special Terms** (lines 438-446):
```tsx
// DELETE THIS:
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Special Terms</label>
  <EnterpriseInlineEdit
    value={contract.special_terms || 'No special terms'}
    onSave={(value) => handleUpdate('special_terms', value)}
    placeholder="Enter special terms"
    multiline
  />
</div>
```

### Fix 2: Update Supplier Contact Info Access

**File:** `app/(dashboard)/contracts/[id]/page.tsx`

**Replace (line 317):**
```tsx
// WRONG:
value={supplier?.contact_info?.email || 'N/A'}

// CORRECT:
value={supplier?.email || 'N/A'}
```

### Fix 3: Add Missing Useful Fields

**Replace the removed sections with these:**

```tsx
{/* Event Linkage */}
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Event</label>
  <EnterpriseInlineEdit
    value={contract.event_id || 'No event'}
    onSave={(value) => handleUpdate('event_id', value)}
    placeholder="Event ID"
  />
</div>

{/* Total Cost */}
<div className="space-y-2">
  <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
  <EnterpriseInlineEdit
    value={contract.total_cost ? `${contract.total_cost}` : ''}
    onSave={(value) => handleUpdate('total_cost', parseFloat(value) || null)}
    placeholder="Total contract value"
  />
</div>
```

## Summary

**Total Issues:** 6 fields that don't exist
**Priority:** HIGH - These will cause runtime errors
**Breaking Changes:** Yes, fields need to be removed

## Recommendation

1. ✅ **Remove non-existent fields** from the UI
2. ✅ **Fix supplier contact access** (use direct field)
3. ✅ **Add missing useful fields** (`total_cost`, `event_id`)
4. ⚠️ **Consider adding missing fields to database** IF they're needed:
   - `commission_type` 
   - `signed_date`
   - `booking_cutoff_days`
   
   BUT for MVP, the `metadata JSONB` field would handle these!

## Next Steps

Should I:
1. Fix the UI to remove non-existent fields?
2. Add the missing useful fields that DO exist?
3. Or add the missing fields to the database schema?
