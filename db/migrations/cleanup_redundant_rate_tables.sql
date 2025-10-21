-- Migration: Clean up redundant rate tables and columns
-- This removes 5 tables and several columns that are now replaced by JSONB pricing structure
-- 
-- BEFORE: 7 tables for pricing (rate_plans, rate_occupancies, rate_seasons, rate_taxes_fees, rate_age_bands, rate_adjustments, allocation_buckets)
-- AFTER: 2 tables for pricing (rate_plans with JSONB, allocation_buckets with block support)

-- ============================================================================
-- STEP 1: Remove redundant rate tables (in dependency order)
-- ============================================================================

-- Remove rate_adjustments table (depends on rate_plans)
DROP TABLE IF EXISTS public.rate_adjustments CASCADE;

-- Remove rate_taxes_fees table (depends on rate_plans)
DROP TABLE IF EXISTS public.rate_taxes_fees CASCADE;

-- Remove rate_age_bands table (depends on rate_plans)
DROP TABLE IF EXISTS public.rate_age_bands CASCADE;

-- Remove rate_occupancies table (depends on rate_plans)
DROP TABLE IF EXISTS public.rate_occupancies CASCADE;

-- Remove rate_seasons table (depends on rate_plans)
DROP TABLE IF EXISTS public.rate_seasons CASCADE;

-- ============================================================================
-- STEP 2: Clean up rate_plans table - remove redundant columns
-- ============================================================================

-- Remove redundant columns from rate_plans
-- (We keep: id, org_id, product_variant_id, supplier_id, inventory_model, currency, 
--          markets, channels, preferred, valid_from, valid_to, rate_doc, 
--          created_at, updated_at, contract_id, pricing, block_type)

ALTER TABLE public.rate_plans DROP COLUMN IF EXISTS priority;
ALTER TABLE public.rate_plans DROP COLUMN IF EXISTS rate_type;
ALTER TABLE public.rate_plans DROP COLUMN IF EXISTS rate_source;

-- ============================================================================
-- STEP 3: Remove related sequences (if they exist)
-- ============================================================================

DROP SEQUENCE IF EXISTS public.rate_adjustments_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.rate_taxes_fees_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.rate_age_bands_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.rate_occupancies_id_seq CASCADE;
DROP SEQUENCE IF EXISTS public.rate_seasons_id_seq CASCADE;

-- ============================================================================
-- STEP 4: Update rate_plans table constraints and indexes
-- ============================================================================

-- Add check constraint for block_type
ALTER TABLE public.rate_plans 
ADD CONSTRAINT rate_plans_block_type_check 
CHECK (block_type IN ('block', 'extra_before', 'extra_after', 'daily'));

-- Ensure pricing column is NOT NULL (it should have a default)
ALTER TABLE public.rate_plans 
ALTER COLUMN pricing SET NOT NULL;

-- ============================================================================
-- STEP 5: Create optimized indexes for the new structure
-- ============================================================================

-- Index for JSONB pricing queries
CREATE INDEX IF NOT EXISTS idx_rate_plans_pricing_gin 
ON public.rate_plans USING GIN (pricing);

-- Index for block type filtering
CREATE INDEX IF NOT EXISTS idx_rate_plans_block_type 
ON public.rate_plans (block_type);

-- Index for variant + supplier + dates (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_rate_plans_variant_supplier_dates 
ON public.rate_plans (product_variant_id, supplier_id, valid_from, valid_to);

-- Index for contract-based queries
CREATE INDEX IF NOT EXISTS idx_rate_plans_contract 
ON public.rate_plans (contract_id) WHERE contract_id IS NOT NULL;

-- ============================================================================
-- STEP 6: Create helper functions for JSONB pricing queries
-- ============================================================================

-- Function to extract rate for specific occupancy and room type
CREATE OR REPLACE FUNCTION get_rate_for_occupancy(
  pricing jsonb,
  occupancy integer,
  room_type text DEFAULT 'standard',
  rate_type text DEFAULT 'block_rate'
) RETURNS numeric AS $$
BEGIN
  RETURN (pricing->'occupancy'->occupancy::text->room_type->>rate_type)::numeric;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract extra night rate
CREATE OR REPLACE FUNCTION get_extra_night_rate(
  pricing jsonb,
  occupancy integer,
  room_type text DEFAULT 'standard',
  night_type text DEFAULT 'extra_after'
) RETURNS numeric AS $$
BEGIN
  RETURN (pricing->'occupancy'->occupancy::text->room_type->>night_type)::numeric;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to extract taxes and fees
CREATE OR REPLACE FUNCTION get_taxes_fees(pricing jsonb) 
RETURNS jsonb AS $$
BEGIN
  RETURN pricing->'taxes_fees';
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::jsonb;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 7: Update allocation_buckets indexes for block support
-- ============================================================================

-- Index for block date ranges
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_block_dates 
ON public.allocation_buckets (block_start_date, block_end_date) 
WHERE block_start_date IS NOT NULL AND block_end_date IS NOT NULL;

-- Index for block type filtering
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_block_type 
ON public.allocation_buckets (block_type);

-- Index for stay requirements
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_stay_requirements 
ON public.allocation_buckets (min_stay, max_stay) 
WHERE min_stay IS NOT NULL OR max_stay IS NOT NULL;

-- ============================================================================
-- STEP 8: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.rate_plans IS 'Rate plans with JSONB pricing structure. Supports block allocations, occupancy-based pricing, taxes/fees, and seasonal rates all in the pricing JSONB column.';
COMMENT ON COLUMN public.rate_plans.pricing IS 'JSONB structure containing all pricing rules: occupancy rates, extra night rates, taxes/fees, seasonal adjustments, and age bands.';
COMMENT ON COLUMN public.rate_plans.block_type IS 'Type of allocation: block (main allocation), extra_before (nights before block), extra_after (nights after block), daily (daily allocation).';
COMMENT ON COLUMN public.rate_plans.rate_doc IS 'Legacy JSONB column - use pricing column instead. Will be deprecated in future migration.';

COMMENT ON TABLE public.allocation_buckets IS 'Inventory allocations with block support. Can represent single-day allocations or multi-day blocks with min/max stay requirements.';
COMMENT ON COLUMN public.allocation_buckets.block_type IS 'Type of allocation: block (main allocation), extra_before (nights before block), extra_after (nights after block), daily (daily allocation).';
COMMENT ON COLUMN public.allocation_buckets.block_start_date IS 'Start date for block allocations (NULL for daily allocations).';
COMMENT ON COLUMN public.allocation_buckets.block_end_date IS 'End date for block allocations (NULL for daily allocations).';
COMMENT ON COLUMN public.allocation_buckets.min_stay IS 'Minimum stay requirement for block allocations.';
COMMENT ON COLUMN public.allocation_buckets.max_stay IS 'Maximum stay allowed for block allocations.';

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================

-- REMOVED TABLES:
-- - rate_occupancies (replaced by JSONB occupancy structure)
-- - rate_seasons (replaced by multiple rate plans with date ranges)
-- - rate_taxes_fees (replaced by JSONB taxes/fees structure)
-- - rate_age_bands (replaced by JSONB age band structure)
-- - rate_adjustments (replaced by JSONB adjustment rules)

-- REMOVED COLUMNS from rate_plans:
-- - priority (can be stored in JSONB)
-- - rate_type (inferred from supplier_id presence)
-- - rate_source (can be stored in JSONB)

-- ADDED FEATURES:
-- - JSONB pricing column with helper functions
-- - Block allocation support in allocation_buckets
-- - Optimized indexes for new structure
-- - Comprehensive documentation

-- PERFORMANCE IMPROVEMENTS:
-- - Reduced from 7 tables to 2 tables for pricing
-- - Fewer JOINs required for pricing queries
-- - GIN index on JSONB for fast pricing lookups
-- - Optimized indexes for common query patterns
