-- Migration: Enhanced Hotel Inventory Management
-- Adds support for shared inventory pools, flexible occupancy pricing, and room assignments
-- Designed to handle complex hotel scenarios while maintaining simplicity for basic use cases

-- 1. INVENTORY POOLS - Shared inventory across multiple product variants
CREATE TABLE IF NOT EXISTS inventory_pools (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id       BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  name              TEXT NOT NULL,
  description       TEXT NULL,
  pool_type         TEXT NOT NULL DEFAULT 'shared',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, supplier_id, name)
);

-- Index for efficient pool queries
CREATE INDEX IF NOT EXISTS idx_inventory_pools_org_supplier ON inventory_pools(org_id, supplier_id);

-- 2. EXTEND ALLOCATION BUCKETS to support inventory pools
ALTER TABLE allocation_buckets 
  ADD COLUMN IF NOT EXISTS inventory_pool_id BIGINT NULL REFERENCES inventory_pools(id) ON DELETE CASCADE;

-- Index for pool-based availability queries
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_pool ON allocation_buckets(inventory_pool_id, date, org_id);

-- 3. ENHANCED RATE OCCUPANCIES - Flexible pricing models
-- Drop and recreate with enhanced pricing model
DROP TABLE IF EXISTS rate_occupancies CASCADE;

CREATE TABLE rate_occupancies (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  min_occupancy     INTEGER NOT NULL,
  max_occupancy     INTEGER NOT NULL,
  pricing_model     TEXT NOT NULL,
  base_amount       NUMERIC(12,2) NOT NULL,
  per_person_amount NUMERIC(12,2) NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (min_occupancy > 0 AND max_occupancy >= min_occupancy),
  CHECK (pricing_model IN ('fixed', 'base_plus_pax', 'per_person')),
  CHECK (per_person_amount IS NULL OR per_person_amount >= 0)
);

-- Index for occupancy queries
CREATE INDEX IF NOT EXISTS idx_rate_occupancies_plan ON rate_occupancies(org_id, rate_plan_id, min_occupancy);

-- 4. ROOM ASSIGNMENTS - Proper rooming list management
CREATE TABLE IF NOT EXISTS room_assignments (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_item_id   BIGINT NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  room_number       TEXT NULL,
  room_type         TEXT NOT NULL,
  bedding_preference TEXT NULL,
  floor_preference  TEXT NULL,
  adjacent_to       BIGINT NULL REFERENCES room_assignments(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'requested',
  special_requests  TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status IN ('requested', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  CHECK (room_type IN ('single', 'double', 'twin', 'triple', 'quad', 'suite'))
);

-- Index for rooming list queries
CREATE INDEX IF NOT EXISTS idx_room_assignments_booking ON room_assignments(booking_item_id, org_id);

-- 5. ROOM OCCUPANTS - Link passengers to rooms
CREATE TABLE IF NOT EXISTS room_occupants (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  room_assignment_id BIGINT NOT NULL REFERENCES room_assignments(id) ON DELETE CASCADE,
  passenger_id      BIGINT NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  is_lead           BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (room_assignment_id, passenger_id)
);

-- Indexes for room occupant queries
CREATE INDEX IF NOT EXISTS idx_room_occupants_room ON room_occupants(room_assignment_id);
CREATE INDEX IF NOT EXISTS idx_room_occupants_passenger ON room_occupants(passenger_id);

-- 6. PRODUCT TEMPLATES - Opinionated defaults for common scenarios
CREATE TABLE IF NOT EXISTS product_templates (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  product_type      TEXT NOT NULL,
  template_data     JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default        BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (name)
);

-- 7. ORGANIZATION SETTINGS - Configuration over customization
CREATE TABLE IF NOT EXISTS org_settings (
  org_id            BIGINT PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. PERFORMANCE INDEXES for availability search
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_search_optimized 
  ON allocation_buckets (org_id, product_variant_id, date) 
  INCLUDE (quantity, booked, held, allocation_type);

-- Partial index for available inventory only
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_available 
  ON allocation_buckets (product_variant_id, date) 
  WHERE (quantity IS NULL OR quantity > booked + held);

-- 9. INSERT DEFAULT PRODUCT TEMPLATES
INSERT INTO product_templates (name, description, product_type, template_data, is_default) VALUES
(
  '3-Star Hotel Room',
  'Standard hotel accommodation with flexible room types',
  'accommodation',
  '{
    "default_rate_plan": {
      "inventory_model": "committed",
      "currency": "GBP",
      "pricing_model": "per_person",
      "markets": ["all"],
      "channels": ["direct", "agent"]
    },
    "default_occupancy": [
      {"min_occupancy": 1, "max_occupancy": 1, "pricing_model": "fixed", "base_amount": 100},
      {"min_occupancy": 2, "max_occupancy": 4, "pricing_model": "base_plus_pax", "base_amount": 120, "per_person_amount": 20}
    ],
    "suggested_margin": 0.20,
    "common_taxes": [
      {"name": "City Tax", "calc_base": "per_person_per_night", "amount_type": "fixed", "value": 5}
    ]
  }'::jsonb,
  true
),
(
  'Full-Day Activity',
  'Day-long tour or activity with group pricing',
  'activity',
  '{
    "default_rate_plan": {
      "inventory_model": "committed",
      "currency": "GBP",
      "pricing_model": "per_person"
    },
    "default_occupancy": [
      {"min_occupancy": 1, "max_occupancy": 50, "pricing_model": "per_person", "base_amount": 75}
    ],
    "suggested_margin": 0.30,
    "group_discounts": [
      {"min_pax": 10, "discount_percent": 5},
      {"min_pax": 20, "discount_percent": 10}
    ]
  }'::jsonb,
  true
),
(
  'Airport Transfer',
  'Point-to-point transportation service',
  'transfer',
  '{
    "default_rate_plan": {
      "inventory_model": "freesale",
      "currency": "GBP",
      "pricing_model": "per_person"
    },
    "default_occupancy": [
      {"min_occupancy": 1, "max_occupancy": 8, "pricing_model": "per_person", "base_amount": 25}
    ],
    "suggested_margin": 0.25,
    "capacity_limit": 8
  }'::jsonb,
  true
);

-- 10. INSERT DEFAULT ORGANIZATION SETTINGS for existing orgs
INSERT INTO org_settings (org_id, settings)
SELECT 
  id,
  '{
    "currency": "GBP",
    "booking_reference_format": "{year}-{counter:5}",
    "booking_reference_prefix": "BK",
    "counter_start": 1000,
    "default_cancellation_policy": {
      "notice_period": {"days": 30, "type": "calendar"},
      "penalties": {
        "early_termination": {"percentage": 10, "minimum_amount": 50, "currency": "GBP"}
      }
    },
    "feature_flags": {
      "advanced_rate_builder": false,
      "api_access": false,
      "beta_features": false
    }
  }'::jsonb
FROM organizations
WHERE NOT EXISTS (SELECT 1 FROM org_settings WHERE org_settings.org_id = organizations.id);

-- 11. HELPER FUNCTIONS for pricing calculations
CREATE OR REPLACE FUNCTION calculate_occupancy_price(
  pax_count INTEGER,
  occupancy_rate_plan_id BIGINT
) RETURNS NUMERIC AS $$
DECLARE
  occupancy_record RECORD;
  result NUMERIC := 0;
BEGIN
  -- Find the appropriate occupancy rate
  SELECT * INTO occupancy_record
  FROM rate_occupancies
  WHERE rate_plan_id = occupancy_rate_plan_id
    AND pax_count >= min_occupancy
    AND pax_count <= max_occupancy
  ORDER BY min_occupancy DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No occupancy rate found for % people in rate plan %', pax_count, occupancy_rate_plan_id;
  END IF;
  
  -- Calculate price based on pricing model
  CASE occupancy_record.pricing_model
    WHEN 'fixed' THEN
      result := occupancy_record.base_amount;
    WHEN 'base_plus_pax' THEN
      result := occupancy_record.base_amount + 
                ((pax_count - occupancy_record.min_occupancy) * COALESCE(occupancy_record.per_person_amount, 0));
    WHEN 'per_person' THEN
      result := pax_count * occupancy_record.base_amount;
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 12. CREATE VIEWS for common queries (hides complexity)
CREATE OR REPLACE VIEW available_inventory AS
SELECT 
  ab.org_id,
  ab.product_variant_id,
  ab.supplier_id,
  ab.date,
  ab.inventory_pool_id,
  ab.allocation_type,
  COALESCE(ab.quantity, 999999) as max_quantity,
  ab.booked,
  ab.held,
  (COALESCE(ab.quantity, 999999) - ab.booked - ab.held) as available,
  CASE 
    WHEN ab.quantity IS NULL THEN true
    ELSE (ab.quantity > ab.booked + ab.held)
  END as has_availability
FROM allocation_buckets ab;

-- 13. CREATE TRIGGERS for maintaining data consistency
CREATE OR REPLACE FUNCTION update_room_assignment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_room_assignments_updated_at
  BEFORE UPDATE ON room_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_room_assignment_updated_at();

-- 14. COMMENTS for documentation
COMMENT ON TABLE inventory_pools IS 'Groups product variants that share the same inventory pool (e.g., double/twin rooms from same hotel)';
COMMENT ON TABLE room_assignments IS 'Tracks actual room assignments for hotel bookings with room numbers and preferences';
COMMENT ON TABLE room_occupants IS 'Links passengers to specific room assignments for rooming lists';
COMMENT ON TABLE product_templates IS 'Pre-configured templates for common product types to simplify setup';
COMMENT ON TABLE org_settings IS 'Organization-level configuration settings to avoid hardcoded customizations';

COMMENT ON COLUMN rate_occupancies.pricing_model IS 'fixed: flat rate regardless of pax, base_plus_pax: base rate + per additional person, per_person: rate multiplied by pax count';
COMMENT ON COLUMN room_assignments.adjacent_to IS 'Reference to another room_assignment for connecting/adjacent rooms';
COMMENT ON COLUMN org_settings.settings IS 'JSONB configuration for booking formats, currencies, feature flags, etc.';

-- 15. GRANT PERMISSIONS (if using RLS)
-- These would be added if implementing Row Level Security
-- ALTER TABLE inventory_pools ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE room_occupants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
