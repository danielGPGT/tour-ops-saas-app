# Migration 004: Core Inventory Fixes

## Overview
This migration addresses critical inventory management issues identified in the schema review, focusing on event handling, time slots, and overbooking support.

## Issues Fixed

### 1. Event vs Per-Day Inventory
**Problem**: `allocation_buckets.date` was too rigid for events like F1 tickets that are valid for multiple days.

**Solution**: 
- Made `date` nullable
- Added `event_start_date` and `event_end_date` for event inventory
- Added constraint to ensure either date OR event dates are set, not both

**Example**:
```sql
-- Hotel room (per-day inventory)
INSERT INTO allocation_buckets (date, quantity) 
VALUES ('2025-11-21', 50);

-- F1 tickets (event inventory)
INSERT INTO allocation_buckets (event_start_date, event_end_date, quantity)
VALUES ('2025-11-21', '2025-11-23', 500);
```

### 2. Time Slots for Activities
**Problem**: `slot_id` in `allocation_buckets` referenced nothing, but activities need time slots (9am tour, 2pm tour).

**Solution**:
- Created `time_slots` table
- Added proper foreign key constraint
- Each slot defines time, duration, and optional name

**Example**:
```sql
-- Define time slots for Eiffel Tower tour
INSERT INTO time_slots (product_variant_id, slot_time, slot_name, duration_minutes)
VALUES 
  (123, '09:00', 'Morning Tour', 180),
  (123, '14:00', 'Afternoon Tour', 180),
  (123, '16:00', 'Sunset Tour', 180);

-- Allocations per slot per day
INSERT INTO allocation_buckets (date, slot_id, quantity)
VALUES
  ('2025-11-21', 1, 20),  -- Nov 21, 9am, 20 spots
  ('2025-11-21', 2, 20),  -- Nov 21, 2pm, 20 spots
  ('2025-11-21', 3, 15);  -- Nov 21, 4pm, 15 spots
```

### 3. Overbooking Support
**Problem**: No way to handle controlled overbooking (sell 110 seats when you have 100).

**Solution**:
- Added `allow_overbooking` boolean flag
- Added `overbooking_limit` integer field
- Added constraint to ensure overbooking logic is consistent

**Example**:
```sql
-- Allow selling 10 extra seats
INSERT INTO allocation_buckets (date, quantity, allow_overbooking, overbooking_limit)
VALUES ('2025-11-21', 100, true, 10);
-- Can sell up to 110 seats (100 + 10 overbooking)
```

### 4. Clean Up Orphaned Fields
**Problem**: `category_id` in `allocation_buckets` referenced nothing and caused confusion.

**Solution**: Removed `category_id` - product variants already handle categorization.

## New Tables

### `time_slots`
- `id`: Primary key
- `org_id`: Organization (multi-tenant)
- `product_variant_id`: Which variant this slot belongs to
- `slot_time`: Time of day (e.g., "14:00")
- `slot_name`: Optional friendly name (e.g., "Afternoon Tour")
- `duration_minutes`: Duration of the slot
- `is_active`: Can disable slots without deleting

## Modified Tables

### `allocation_buckets`
**Added**:
- `event_start_date`: For event inventory
- `event_end_date`: For event inventory
- `allow_overbooking`: Enable controlled overbooking
- `overbooking_limit`: How many extra can be sold
- `notes`: Optional notes about allocation

**Modified**:
- `date`: Made nullable (events don't need specific dates)
- `slot_id`: Now properly references `time_slots.id`

**Removed**:
- `category_id`: Was orphaned and unused

## Constraints Added

### Date/Event Logic
```sql
CHECK (
  -- Per-day inventory
  (date IS NOT NULL AND event_start_date IS NULL AND event_end_date IS NULL)
  OR
  -- Event inventory
  (date IS NULL AND event_start_date IS NOT NULL AND event_end_date IS NOT NULL AND event_start_date <= event_end_date)
)
```

### Overbooking Logic
```sql
CHECK (
  (allow_overbooking = false AND overbooking_limit IS NULL)
  OR
  (allow_overbooking = true AND overbooking_limit IS NOT NULL AND overbooking_limit >= 0)
)
```

## Usage Patterns

### Pattern 1: Hotel Room (Per-Day Inventory)
```sql
INSERT INTO allocation_buckets (org_id, product_variant_id, date, quantity, allocation_type)
VALUES (1, 123, '2025-11-21', 50, 'committed');
```

### Pattern 2: Event Ticket (Event Inventory)
```sql
INSERT INTO allocation_buckets (org_id, product_variant_id, event_start_date, event_end_date, quantity, allocation_type)
VALUES (1, 456, '2025-11-21', '2025-11-23', 500, 'committed');
```

### Pattern 3: Activity with Time Slots
```sql
-- Define slots first
INSERT INTO time_slots (org_id, product_variant_id, slot_time, slot_name, duration_minutes)
VALUES (1, 789, '09:00', 'Morning Tour', 180);

-- Then allocations per slot per day
INSERT INTO allocation_buckets (org_id, product_variant_id, date, slot_id, quantity, allocation_type)
VALUES (1, 789, '2025-11-21', 1, 20, 'committed');
```

### Pattern 4: Overbooking
```sql
INSERT INTO allocation_buckets (org_id, product_variant_id, date, quantity, allow_overbooking, overbooking_limit, allocation_type)
VALUES (1, 123, '2025-11-21', 100, true, 10, 'committed');
-- Can sell up to 110 seats (100 + 10 overbooking)
```

## Indexes Added
- `idx_time_slots_org_variant`: Fast lookup of slots per variant
- `idx_time_slots_time`: Fast lookup by time
- `idx_allocation_buckets_date_variant`: Fast per-day inventory queries
- `idx_allocation_buckets_event_dates`: Fast event inventory queries
- `idx_allocation_buckets_slot_date`: Fast time slot queries
- `idx_allocation_buckets_overbooking`: Fast overbooking queries

## Impact
This migration significantly improves the schema's ability to handle real-world tour operator scenarios:
- ✅ Events like F1 tickets, festivals, multi-day passes
- ✅ Activities with time slots like tours, classes, shows
- ✅ Controlled overbooking for revenue optimization
- ✅ Cleaner data model without orphaned foreign keys

## Testing
After running this migration, test:
1. Creating allocation buckets for events vs per-day inventory
2. Setting up time slots for activities
3. Testing overbooking limits
4. Verifying constraints prevent invalid data combinations
