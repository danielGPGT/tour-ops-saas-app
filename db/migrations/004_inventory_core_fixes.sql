-- Migration 004: Core Inventory Fixes for Events, Time Slots, and Overbooking
-- Addresses critical issues identified in schema review:
-- 1. Event date handling in allocation_buckets
-- 2. Time slots table + slot_id FK
-- 3. Remove orphaned category_id
-- 4. Add overbooking support

-- =============================================================================
-- 1. CREATE TIME_SLOTS TABLE
-- =============================================================================
-- This table defines time slots for activities (9am tour, 2pm tour, etc.)
-- Each slot can have different availability and pricing

CREATE TABLE time_slots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id bigint NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  slot_time time NOT NULL,                    -- "14:00" for 2pm slot
  slot_name text,                             -- "Afternoon Tour" (optional friendly name)
  duration_minutes integer,                   -- 180 for 3-hour tour
  is_active boolean NOT NULL DEFAULT true,    -- Can disable slots without deleting
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure unique slots per variant
  CONSTRAINT time_slots_unique_slot UNIQUE (org_id, product_variant_id, slot_time),
  
  -- Ensure valid duration
  CONSTRAINT time_slots_valid_duration CHECK (duration_minutes > 0)
);

-- Indexes for time_slots
CREATE INDEX idx_time_slots_org_variant ON time_slots(org_id, product_variant_id);
CREATE INDEX idx_time_slots_time ON time_slots(slot_time);
CREATE INDEX idx_time_slots_active ON time_slots(is_active) WHERE is_active = true;

-- =============================================================================
-- 2. FIX ALLOCATION_BUCKETS FOR EVENTS AND OVERBOOKING
-- =============================================================================
-- Add columns to support:
-- - Event inventory (F1 tickets valid for 3 days vs hotel rooms per night)
-- - Overbooking (sell 110 seats when you have 100)
-- - Better time slot integration

-- Add new columns
ALTER TABLE allocation_buckets 
  ADD COLUMN event_start_date date,           -- For event inventory
  ADD COLUMN event_end_date date,             -- For event inventory  
  ADD COLUMN allow_overbooking boolean NOT NULL DEFAULT false,
  ADD COLUMN overbooking_limit integer,       -- How many extra can be sold
  ADD COLUMN notes text;                      -- Optional notes about allocation

-- Make date nullable (events don't need specific dates)
ALTER TABLE allocation_buckets ALTER COLUMN date DROP NOT NULL;

-- =============================================================================
-- 3. ADD CONSTRAINTS FOR DATE/EVENT LOGIC
-- =============================================================================
-- Ensure either date OR event dates are set, but not both
-- This prevents data inconsistency

ALTER TABLE allocation_buckets
  ADD CONSTRAINT check_date_or_event
  CHECK (
    -- Pattern 1: Per-day inventory (hotels, daily activities)
    (date IS NOT NULL AND event_start_date IS NULL AND event_end_date IS NULL)
    OR
    -- Pattern 2: Event inventory (multi-day events, cruise cabins)
    (date IS NULL AND event_start_date IS NOT NULL AND event_end_date IS NOT NULL AND event_start_date <= event_end_date)
  );

-- Ensure overbooking makes sense
ALTER TABLE allocation_buckets
  ADD CONSTRAINT check_overbooking_logic
  CHECK (
    (allow_overbooking = false AND overbooking_limit IS NULL)
    OR
    (allow_overbooking = true AND overbooking_limit IS NOT NULL AND overbooking_limit >= 0)
  );

-- =============================================================================
-- 4. FIX SLOT_ID FOREIGN KEY
-- =============================================================================
-- Now that we have time_slots table, add the proper foreign key constraint

ALTER TABLE allocation_buckets
  ADD CONSTRAINT allocation_buckets_slot_id_fkey
  FOREIGN KEY (slot_id) REFERENCES time_slots(id) ON DELETE CASCADE;

-- =============================================================================
-- 5. REMOVE ORPHANED CATEGORY_ID
-- =============================================================================
-- This column references nothing and causes confusion
-- Product variants already handle categorization

ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS category_id;

-- =============================================================================
-- 6. ADD HELPFUL INDEXES
-- =============================================================================
-- Optimize common queries for availability checking

-- For per-day inventory queries
CREATE INDEX idx_allocation_buckets_date_variant 
  ON allocation_buckets(date, product_variant_id) 
  WHERE date IS NOT NULL;

-- For event inventory queries  
CREATE INDEX idx_allocation_buckets_event_dates
  ON allocation_buckets(event_start_date, event_end_date, product_variant_id)
  WHERE event_start_date IS NOT NULL;

-- For time slot queries
CREATE INDEX idx_allocation_buckets_slot_date
  ON allocation_buckets(slot_id, date)
  WHERE slot_id IS NOT NULL AND date IS NOT NULL;

-- For overbooking queries
CREATE INDEX idx_allocation_buckets_overbooking
  ON allocation_buckets(allow_overbooking, overbooking_limit)
  WHERE allow_overbooking = true;

-- =============================================================================
-- 7. ADD COMMENTS FOR CLARITY
-- =============================================================================
-- Document the different usage patterns

COMMENT ON TABLE time_slots IS 'Defines time slots for activities (9am tour, 2pm tour, etc.)';
COMMENT ON COLUMN time_slots.slot_time IS 'Time of day for this slot (e.g., 14:00 for 2pm)';
COMMENT ON COLUMN time_slots.slot_name IS 'Optional friendly name (e.g., "Morning Tour", "Sunset Cruise")';
COMMENT ON COLUMN time_slots.duration_minutes IS 'Duration of the slot in minutes';

COMMENT ON COLUMN allocation_buckets.date IS 'For per-day inventory (hotels, daily activities). NULL for events.';
COMMENT ON COLUMN allocation_buckets.event_start_date IS 'For event inventory (F1 tickets, cruise cabins). NULL for per-day inventory.';
COMMENT ON COLUMN allocation_buckets.event_end_date IS 'For event inventory. Must be >= event_start_date.';
COMMENT ON COLUMN allocation_buckets.allow_overbooking IS 'Allow selling more than quantity (controlled overbooking)';
COMMENT ON COLUMN allocation_buckets.overbooking_limit IS 'How many extra units can be sold beyond quantity';
COMMENT ON COLUMN allocation_buckets.slot_id IS 'References time_slots.id for time-based activities';

-- =============================================================================
-- 8. EXAMPLE USAGE PATTERNS
-- =============================================================================
-- Document how to use the new schema

/*
-- PATTERN 1: Hotel Room (per-day inventory)
INSERT INTO allocation_buckets (org_id, product_variant_id, date, quantity, allocation_type)
VALUES (1, 123, '2025-11-21', 50, 'committed');

-- PATTERN 2: Event Ticket (event inventory)  
INSERT INTO allocation_buckets (org_id, product_variant_id, event_start_date, event_end_date, quantity, allocation_type)
VALUES (1, 456, '2025-11-21', '2025-11-23', 500, 'committed');

-- PATTERN 3: Activity with Time Slots
INSERT INTO time_slots (org_id, product_variant_id, slot_time, slot_name, duration_minutes)
VALUES (1, 789, '09:00', 'Morning Tour', 180);

INSERT INTO allocation_buckets (org_id, product_variant_id, date, slot_id, quantity, allocation_type)
VALUES (1, 789, '2025-11-21', 1, 20, 'committed');

-- PATTERN 4: Overbooking
INSERT INTO allocation_buckets (org_id, product_variant_id, date, quantity, allow_overbooking, overbooking_limit, allocation_type)
VALUES (1, 123, '2025-11-21', 100, true, 10, 'committed');
-- Can sell up to 110 seats (100 + 10 overbooking)
*/
