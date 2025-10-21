-- Migration: Implement JSONB-based pricing structure with block allocations
-- This replaces the complex 7-table structure with 2 efficient tables

-- Step 1: Add JSONB pricing column to rate_plans
ALTER TABLE rate_plans ADD COLUMN IF NOT EXISTS pricing jsonb DEFAULT '{}';
ALTER TABLE rate_plans ADD COLUMN IF NOT EXISTS block_type text DEFAULT 'block'; -- 'block', 'extra_before', 'extra_after'

-- Step 2: Update allocation_buckets to handle block allocations
ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS block_type text DEFAULT 'block'; -- 'block', 'extra_before', 'extra_after'
ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS block_start_date date;
ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS block_end_date date;
ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS min_stay integer DEFAULT 1;
ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS max_stay integer DEFAULT 999;

-- Step 3: Create essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_plans_variant_supplier ON rate_plans(product_variant_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_dates ON rate_plans(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_rate_plans_block_type ON rate_plans(block_type);
CREATE INDEX IF NOT EXISTS idx_rate_plans_pricing ON rate_plans USING GIN(pricing);

CREATE INDEX IF NOT EXISTS idx_allocation_buckets_variant_supplier_date ON allocation_buckets(product_variant_id, supplier_id, date);
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_block_type ON allocation_buckets(block_type);
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_block_dates ON allocation_buckets(block_start_date, block_end_date);

-- Step 4: Create helper functions for JSONB pricing queries
CREATE OR REPLACE FUNCTION get_rate_for_occupancy(
  pricing jsonb,
  occupancy integer,
  room_type text DEFAULT 'standard',
  rate_type text DEFAULT 'block_rate'
) RETURNS numeric AS $$
BEGIN
  RETURN (pricing->'occupancy'->occupancy::text->room_type->>rate_type)::numeric;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION get_extra_night_rate(
  pricing jsonb,
  occupancy integer,
  room_type text DEFAULT 'standard',
  extra_type text DEFAULT 'extra_night_rate_after'
) RETURNS numeric AS $$
BEGIN
  RETURN (pricing->'occupancy'->occupancy::text->room_type->>extra_type)::numeric;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 5: Create function to calculate total cost for mixed stays
CREATE OR REPLACE FUNCTION calculate_stay_cost(
  p_product_variant_id bigint,
  p_supplier_id bigint,
  p_check_in date,
  p_check_out date,
  p_occupancy integer,
  p_room_type text DEFAULT 'standard'
) RETURNS numeric AS $$
DECLARE
  v_pricing jsonb;
  v_block_start date;
  v_block_end date;
  v_block_nights integer;
  v_extra_before_nights integer;
  v_extra_after_nights integer;
  v_block_cost numeric;
  v_extra_before_cost numeric;
  v_extra_after_cost numeric;
  v_total_cost numeric;
BEGIN
  -- Get pricing for the supplier
  SELECT pricing INTO v_pricing
  FROM rate_plans
  WHERE product_variant_id = p_product_variant_id
    AND supplier_id = p_supplier_id
    AND rate_type = 'supplier_rate'
    AND p_check_in BETWEEN valid_from AND valid_to;
  
  IF v_pricing IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Get block dates from allocation
  SELECT block_start_date, block_end_date INTO v_block_start, v_block_end
  FROM allocation_buckets
  WHERE product_variant_id = p_product_variant_id
    AND supplier_id = p_supplier_id
    AND block_type = 'block'
    AND p_check_in <= block_end_date
    AND p_check_out >= block_start_date
  LIMIT 1;
  
  IF v_block_start IS NULL THEN
    -- No block allocation, use standard rates
    RETURN get_rate_for_occupancy(v_pricing, p_occupancy, p_room_type, 'block_rate') * 
           (p_check_out - p_check_in);
  END IF;
  
  -- Calculate nights in each category
  v_block_nights := GREATEST(0, LEAST(p_check_out, v_block_end) - GREATEST(p_check_in, v_block_start));
  v_extra_before_nights := GREATEST(0, v_block_start - p_check_in);
  v_extra_after_nights := GREATEST(0, p_check_out - v_block_end);
  
  -- Calculate costs
  v_block_cost := v_block_nights * get_rate_for_occupancy(v_pricing, p_occupancy, p_room_type, 'block_rate');
  v_extra_before_cost := v_extra_before_nights * get_extra_night_rate(v_pricing, p_occupancy, p_room_type, 'extra_night_rate_before');
  v_extra_after_cost := v_extra_after_nights * get_extra_night_rate(v_pricing, p_occupancy, p_room_type, 'extra_night_rate_after');
  
  v_total_cost := v_block_cost + v_extra_before_cost + v_extra_after_cost;
  
  RETURN v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create view for easy rate queries
CREATE OR REPLACE VIEW rate_plans_view AS
SELECT 
  rp.*,
  rp.pricing->'occupancy' as occupancy_pricing,
  rp.pricing->'extras' as extras_pricing,
  rp.pricing->'contract_terms' as contract_terms
FROM rate_plans rp;

-- Step 7: Create view for allocation summary
CREATE OR REPLACE VIEW allocation_summary AS
SELECT 
  ab.*,
  pv.name as variant_name,
  p.name as product_name,
  s.name as supplier_name
FROM allocation_buckets ab
JOIN product_variants pv ON pv.id = ab.product_variant_id
JOIN products p ON p.id = pv.product_id
JOIN suppliers s ON s.id = ab.supplier_id;
