-- Migration: 005_inventory_pools.sql
-- Description: Add inventory pools and pool variants tables for block-based inventory management
-- This supports fixed-date tour operators who work with supplier blocks

-- Inventory pools represent supplier allocations (e.g., "100 rooms Dec 4-8")
CREATE TABLE inventory_pools (
  id bigserial PRIMARY KEY,
  org_id bigint NOT NULL,
  supplier_id bigint NOT NULL REFERENCES suppliers(id),
  
  -- Pool identification
  name text NOT NULL,  -- "Hotel Paris - December Block"
  reference text,      -- Supplier's reference (e.g., "CON-2025-001")
  pool_type text NOT NULL DEFAULT 'committed',  -- 'committed' | 'provisional' | 'on_request' | 'freesale'
  
  -- Date coverage (when is this pool valid)
  valid_from date NOT NULL,
  valid_to date NOT NULL,
  
  -- Total pool capacity (across all variants in pool)
  total_capacity integer,  -- NULL for on_request/freesale
  capacity_unit text DEFAULT 'rooms',  -- 'rooms' | 'seats' | 'units' | 'people'
  
  -- Booking rules
  min_commitment integer,   -- Minimum you must use (e.g., 80 out of 100 rooms)
  release_date date,        -- When unused inventory releases back to supplier
  cutoff_days integer,      -- Days before service for booking cutoff
  
  -- Financial
  currency text NOT NULL DEFAULT 'EUR',
  contract_version_id bigint REFERENCES contract_versions(id),
  
  -- Status
  status text NOT NULL DEFAULT 'active',  -- 'active' | 'inactive' | 'released' | 'expired'
  notes text,
  
  -- Audit fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (valid_to >= valid_from),
  CONSTRAINT valid_capacity CHECK (total_capacity IS NULL OR total_capacity > 0),
  CONSTRAINT valid_commitment CHECK (min_commitment IS NULL OR min_commitment >= 0)
);

-- Product variants that share the same inventory pool
CREATE TABLE pool_variants (
  id bigserial PRIMARY KEY,
  org_id bigint NOT NULL,
  inventory_pool_id bigint NOT NULL REFERENCES inventory_pools(id) ON DELETE CASCADE,
  product_variant_id bigint NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  
  -- Capacity weighting (how much of pool this consumes)
  capacity_weight numeric NOT NULL DEFAULT 1.0,
  -- Example: Standard room = 1.0, Suite = 1.5 (consumes more of the pool)
  
  -- Pricing for this variant from this pool
  cost_per_unit numeric,
  sell_price_per_unit numeric,
  
  -- Priority for auto-assignment (lower number = higher priority)
  priority integer DEFAULT 100,
  
  -- Can this be auto-allocated from pool?
  auto_allocate boolean DEFAULT true,
  
  -- Status
  status text NOT NULL DEFAULT 'active',  -- 'active' | 'inactive'
  
  -- Audit fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_capacity_weight CHECK (capacity_weight > 0),
  CONSTRAINT valid_priority CHECK (priority > 0),
  CONSTRAINT unique_pool_variant UNIQUE (inventory_pool_id, product_variant_id)
);

-- Pool utilization tracking (daily snapshots of pool usage)
CREATE TABLE pool_utilization (
  id bigserial PRIMARY KEY,
  org_id bigint NOT NULL,
  inventory_pool_id bigint NOT NULL REFERENCES inventory_pools(id) ON DELETE CASCADE,
  
  -- Date for this utilization snapshot
  snapshot_date date NOT NULL,
  
  -- Pool capacity at this date
  total_capacity integer,
  
  -- Utilization breakdown
  booked_units integer DEFAULT 0,
  held_units integer DEFAULT 0,
  available_units integer GENERATED ALWAYS AS (
    COALESCE(total_capacity, 0) - booked_units - held_units
  ) STORED,
  
  -- Utilization percentage
  utilization_percentage numeric GENERATED ALWAYS AS (
    CASE 
      WHEN total_capacity > 0 THEN 
        ROUND(((booked_units + held_units)::numeric / total_capacity::numeric) * 100, 2)
      ELSE 0
    END
  ) STORED,
  
  -- Status flags
  is_released boolean DEFAULT false,  -- Has this pool been released back to supplier?
  is_overbooked boolean DEFAULT false,  -- Is this pool overbooked?
  
  -- Audit fields
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_units CHECK (booked_units >= 0 AND held_units >= 0),
  CONSTRAINT unique_pool_date UNIQUE (inventory_pool_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX idx_inventory_pools_org_dates ON inventory_pools(org_id, valid_from, valid_to);
CREATE INDEX idx_inventory_pools_supplier ON inventory_pools(supplier_id);
CREATE INDEX idx_inventory_pools_type ON inventory_pools(pool_type);
CREATE INDEX idx_inventory_pools_status ON inventory_pools(status);

CREATE INDEX idx_pool_variants_pool ON pool_variants(inventory_pool_id);
CREATE INDEX idx_pool_variants_variant ON pool_variants(product_variant_id);
CREATE INDEX idx_pool_variants_priority ON pool_variants(priority);

CREATE INDEX idx_pool_utilization_pool_date ON pool_utilization(inventory_pool_id, snapshot_date);
CREATE INDEX idx_pool_utilization_org_date ON pool_utilization(org_id, snapshot_date);

-- Comments for documentation
COMMENT ON TABLE inventory_pools IS 'Supplier inventory blocks (e.g., 100 rooms Dec 4-8)';
COMMENT ON TABLE pool_variants IS 'Product variants that can be sold from a pool (e.g., Standard Double, Suite)';
COMMENT ON TABLE pool_utilization IS 'Daily snapshots of pool capacity and utilization';

COMMENT ON COLUMN inventory_pools.pool_type IS 'committed=guaranteed allocation, provisional=tentative, on_request=no allocation, freesale=unlimited';
COMMENT ON COLUMN inventory_pools.capacity_unit IS 'Unit of measurement for capacity (rooms, seats, units, people)';
COMMENT ON COLUMN inventory_pools.min_commitment IS 'Minimum units that must be used from this pool';
COMMENT ON COLUMN inventory_pools.release_date IS 'Date when unused inventory releases back to supplier';

COMMENT ON COLUMN pool_variants.capacity_weight IS 'How much of the pool this variant consumes (Suite=1.5x Standard room)';
COMMENT ON COLUMN pool_variants.priority IS 'Priority for auto-allocation (lower = higher priority)';
COMMENT ON COLUMN pool_variants.auto_allocate IS 'Can this variant be automatically allocated from the pool?';

COMMENT ON COLUMN pool_utilization.snapshot_date IS 'Date for this utilization snapshot';
COMMENT ON COLUMN pool_utilization.booked_units IS 'Units confirmed booked from this pool';
COMMENT ON COLUMN pool_utilization.held_units IS 'Units temporarily held (pending confirmation)';
COMMENT ON COLUMN pool_utilization.available_units IS 'Computed available units (total - booked - held)';
COMMENT ON COLUMN pool_utilization.utilization_percentage IS 'Computed utilization percentage';
