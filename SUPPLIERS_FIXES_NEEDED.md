# Suppliers Pages - Required Fixes

## Summary
The suppliers pages are using old field names that don't exist in the updated database schema. Here are all the fixes needed.

---

## 🚨 Fields That Need to be REMOVED (don't exist in DB)

### 1. `total_bookings` field
**Files to fix:**
- `app/(dashboard)/suppliers/page.tsx` - Lines 58, 117-120
- `components/suppliers/supplier-card.tsx` - Line 115

**What to do:** Remove references to `supplier.total_bookings`. This field doesn't exist.

### 2. `rating` field
**Files to fix:**
- `app/(dashboard)/suppliers/page.tsx` - Lines 66-67, 106-109
- `app/(dashboard)/suppliers/[id]/page.tsx` - Lines 136-150 (inline edit for rating)
- `components/suppliers/supplier-card.tsx` - Lines 35-38
- `components/suppliers/supplier-dialog-form.tsx` - Lines 40, 186-189
- `components/suppliers/supplier-sheet-form.tsx` - Line 49

**What to do:** Remove `rating` field from summary cards, table columns, and forms.

### 3. `commission_rate` field
**Files to fix:**
- `app/(dashboard)/suppliers/[id]/page.tsx` - Line 84
- `components/suppliers/supplier-card.tsx` - Lines 117-120
- `components/suppliers/supplier-dialog-form.tsx` - Lines 39, 214-227
- `components/suppliers/supplier-sheet-form.tsx` - Lines 48, 72, 166-174

**What to do:** Remove commission rate fields from supplier pages. (This belongs in contracts, not suppliers!)

### 4. `payment_terms` field
**Files to fix:**
- `app/(dashboard)/suppliers/[id]/page.tsx` - Line 70
- `components/suppliers/supplier-card.tsx` - Line 17
- `components/suppliers/supplier-dialog-form.tsx` - Line 41

**What to do:** Remove `payment_terms` from supplier form. This field doesn't exist on suppliers table.

---

## ✅ Fields That Need to be ADDED (exist in DB)

### 1. Separate `email` and `phone` fields
**Files to fix:**
- `app/(dashboard)/suppliers/page.tsx` - Line 102-108 (currently using `contact_info.email`)
- All forms that currently use `contact_info.email` and `contact_info.phone`

**What to do:**
- Change from: `supplier.contact_info?.email` → `supplier.email`
- Change from: `supplier.contact_info?.phone` → `supplier.phone`

### 2. Address fields (`address_line1`, `city`, `country`)
**Files to fix:**
- `app/(dashboard)/suppliers/[id]/page.tsx` - Currently might be using `contact_info.address`
- All forms

**What to do:**
- Add form fields for `address_line1`, `city`, `country`
- Update display to use these separate fields

### 3. `default_currency` field
**Files to fix:**
- Supplier detail page
- Supplier forms

**What to do:** Add a currency selector in the supplier form

### 4. `notes` field
**Files to fix:**
- Supplier detail page
- Supplier forms

**What to do:** Add a notes textarea to the supplier form

---

## 📝 Specific Files That Need Updates

### High Priority Files:

1. **`app/(dashboard)/suppliers/page.tsx`**
   - ❌ Remove `total_bookings` summary card (line 58)
   - ❌ Remove `average-rating` summary card (lines 64-68)
   - ❌ Remove `rating` column from table (lines 103-112)
   - ❌ Remove `total_bookings` column from table (lines 115-121)
   - ✅ Fix contact display to use `supplier.email` and `supplier.phone` instead of `supplier.contact_info?.email`

2. **`app/(dashboard)/suppliers/[id]/page.tsx`**
   - ❌ Remove `commission_rate` stat (line 84)
   - ❌ Remove inline edit for `rating` (lines 136-150)
   - ❌ Remove `payment_terms` usage (line 70)
   - ✅ Add address fields display: `address_line1`, `city`, `country`
   - ✅ Add `default_currency` display
   - ✅ Add `notes` display
   - ✅ Update contact display to use separate fields

3. **`components/suppliers/supplier-dialog-form.tsx`**
   - ❌ Remove `commission_rate` field (lines 214-227)
   - ❌ Remove `rating` field (lines 186-189)
   - ❌ Remove `payment_terms` field (line 41)
   - ✅ Change email/phone to use separate fields instead of nested in `contact_info`
   - ✅ Add address fields: `address_line1`, `city`, `country`
   - ✅ Add `default_currency` select field
   - ✅ Add `notes` textarea

4. **`components/suppliers/supplier-sheet-form.tsx`**
   - Same changes as dialog form

5. **`components/suppliers/supplier-card.tsx`**
   - ❌ Remove rating display (lines 35-38)
   - ❌ Remove commission rate display (lines 117-120)
   - ❌ Remove total_bookings display (line 115)
   - ❌ Remove `payment_terms` destructuring (line 17)
   - ✅ Update to use `supplier.email` and `supplier.phone`

### Medium Priority Files:

6. **`lib/validations/supplier.schema.ts`**
   - Update schema to match new Supplier type
   - Remove: `rating`, `commission_rate`, `payment_terms`, `total_bookings`
   - Add: `email`, `phone`, `address_line1`, `city`, `country`, `default_currency`, `notes`

7. **Supplier hooks and API routes**
   - Check that they handle the new field structure
   - Update any mutations/queries

---

## 🎯 Recommended Action Plan

### Step 1: Update Summary Cards (Quick Win)
Remove the cards that use non-existent fields:
- Remove "Total Bookings" card
- Remove "Average Rating" card

### Step 2: Update Table Columns
- Remove `rating` column
- Remove `total_bookings` column
- Fix contact column to use separate fields

### Step 3: Update Forms
- Remove non-existent fields
- Add new address fields
- Add currency and notes

### Step 4: Update Detail Page
- Remove non-existent field displays
- Add new field displays

### Step 5: Update Validation Schema
- Update to match new type structure

---

## 📊 Before vs After

### Summary Cards:
**Before:**
- Total Suppliers ✅
- Active Suppliers ✅
- **Total Bookings** ❌ (remove)
- **Average Rating** ❌ (remove)

**After:**
- Total Suppliers ✅
- Active Suppliers ✅
- **Currency** ✅ (new - shows default currency distribution)
- **By Type** ✅ (new - shows distribution by supplier_type)

### Table Columns:
**Before:**
- Name ✅
- Type ✅
- Contact (using `contact_info`) ❌
- **Rating** ❌ (remove)
- **Bookings** ❌ (remove)
- Status ✅

**After:**
- Name ✅
- Type ✅
- Email ✅ (using `supplier.email`)
- Phone ✅ (using `supplier.phone`)
- Location ✅ (using `city, country`)
- Status ✅

---

## ⚠️ Important Notes

1. **Contact Info is Still Available**: The `contact_info` JSONB field still exists in the database for flexible data. But we should primarily use the separate `email`, `phone`, `address_line1`, `city`, `country` fields.

2. **Commission Rate**: Commission rates belong in **contracts**, not suppliers. That's why it was removed from the suppliers table.

3. **Backward Compatibility**: When updating, make sure to handle suppliers that might have data in the old `contact_info` structure. You might want to migrate it to the new separate fields.

4. **Default Currency**: This is important for multi-currency support. Each supplier can have their own default currency.

---

## ✅ Quick Test Checklist

After making changes, verify:
- [ ] Suppliers page loads without errors
- [ ] Supplier detail page loads without errors
- [ ] Creating a new supplier works
- [ ] Updating a supplier works
- [ ] No references to `total_bookings`, `rating`, `commission_rate`, `payment_terms` on suppliers
- [ ] New fields display correctly (email, phone, address, currency, notes)
- [ ] No TypeScript errors
- [ ] No runtime errors in browser console
