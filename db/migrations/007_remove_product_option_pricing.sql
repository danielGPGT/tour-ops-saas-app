-- ============================================================================
-- Migration: Remove Pricing from product_options
-- ============================================================================
-- This migration removes pricing from product_options table and ensures
-- all pricing is managed through supplier_rates and selling_rates tables.
-- 
-- Why?
-- - Enables seasonal pricing (same product, different rates for different dates)
-- - Supports multiple suppliers for same product
-- - Allows time-based pricing (peak/off-peak rates)
-- - Provides audit trail (which rate was used at booking time)
-- - Enables occupancy-based pricing (single/double/triple rooms)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Migrate existing pricing data to supplier_rates and selling_rates
-- ----------------------------------------------------------------------------

-- Migrate existing base_cost and base_price to supplier_rates and selling_rates
DO $$
DECLARE
  product_option_record RECORD;
  supplier_rate_id UUID;
  selling_rate_id UUID;
BEGIN
  -- Loop through all product_options that have pricing
  FOR product_option_record IN
    SELECT po.*, p.organization_id, p.supplier_id
    FROM product_options po
    JOIN products p ON po.product_id = p.id
    WHERE po.base_cost IS NOT NULL OR po.base_price IS NOT NULL
  LOOP
    -- Create supplier rate if base_cost exists
    IF product_option_record.base_cost IS NOT NULL THEN
      INSERT INTO supplier_rates (
        organization_id,
        product_id,
        product_option_id,
        rate_name,
        rate_basis,
        valid_from,
        valid_to,
        base_cost,
        currency,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        product_option_record.organization_id,
        product_option_record.product_id,
        product_option_record.id,
        'Migrated Rate - ' || product_option_record.option_name,
        'per_unit', -- Default basis, can be updated later
        '2024-01-01'::DATE, -- Start from far past
        '2099-12-31'::DATE, -- End in far future
        product_option_record.base_cost,
        COALESCE(product_option_record.currency, 'USD'),
        product_option_record.is_active,
        product_option_record.created_at,
        product_option_record.updated_at
      )
      RETURNING id INTO supplier_rate_id;
      
      RAISE NOTICE 'Created supplier_rate % for product_option %', supplier_rate_id, product_option_record.id;
    END IF;
    
    -- Create selling rate if base_price exists
    IF product_option_record.base_price IS NOT NULL THEN
      INSERT INTO selling_rates (
        organization_id,
        product_id,
        product_option_id,
        rate_name,
        rate_basis,
        valid_from,
        valid_to,
        base_price,
        currency,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        product_option_record.organization_id,
        product_option_record.product_id,
        product_option_record.id,
        'Migrated Rate - ' || product_option_record.option_name,
        'per_unit', -- Default basis, can be updated later
        '2024-01-01'::DATE, -- Start from far past
        '2099-12-31'::DATE, -- End in far future
        product_option_record.base_price,
        COALESCE(product_option_record.currency, 'USD'),
        product_option_record.is_active,
        product_option_record.created_at,
        product_option_record.updated_at
      )
      RETURNING id INTO selling_rate_id;
      
      RAISE NOTICE 'Created selling_rate % for product_option %', selling_rate_id, product_option_record.id;
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- Step 2: Remove pricing columns from product_options
-- ----------------------------------------------------------------------------

-- Drop the pricing columns
ALTER TABLE product_options 
  DROP COLUMN IF EXISTS base_price,
  DROP COLUMN IF EXISTS base_cost,
  DROP COLUMN IF EXISTS currency;

-- ----------------------------------------------------------------------------
-- Step 3: Add comment explaining the change
-- ----------------------------------------------------------------------------

COMMENT ON TABLE product_options IS 
'Product options represent product variants (room types, ticket tiers, etc.). 
Pricing is managed through supplier_rates (what supplier charges) and 
selling_rates (what you charge customers). This enables:
- Seasonal pricing (different rates for different dates)
- Multiple suppliers for same product
- Time-based pricing (peak/off-peak rates)
- Audit trail (which rate was used at booking time)
- Occupancy-based pricing (single/double/triple rooms)';

-- ----------------------------------------------------------------------------
-- Step 4: Verify migration
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  options_with_pricing INTEGER;
  supplier_rates_count INTEGER;
  selling_rates_count INTEGER;
BEGIN
  -- Check if any product_options still have pricing (should be 0)
  SELECT COUNT(*) INTO options_with_pricing
  FROM information_schema.columns
  WHERE table_name = 'product_options'
    AND column_name IN ('base_price', 'base_cost', 'currency');
  
  -- Count migrated rates
  SELECT COUNT(*) INTO supplier_rates_count FROM supplier_rates;
  SELECT COUNT(*) INTO selling_rates_count FROM selling_rates;
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  - Product options with pricing columns: %', options_with_pricing;
  RAISE NOTICE '  - Total supplier_rates: %', supplier_rates_count;
  RAISE NOTICE '  - Total selling_rates: %', selling_rates_count;
  
  IF options_with_pricing > 0 THEN
    RAISE WARNING 'Pricing columns still exist in product_options!';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (In case you need to rollback)
-- ============================================================================

/*
BEGIN;

-- Restore pricing columns
ALTER TABLE product_options 
  ADD COLUMN base_price NUMERIC(10,2),
  ADD COLUMN base_cost NUMERIC(10,2),
  ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';

-- Restore data from rates (most recent rate for each option)
UPDATE product_options po
SET 
  base_cost = (
    SELECT base_cost 
    FROM supplier_rates sr 
    WHERE sr.product_option_id = po.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  base_price = (
    SELECT base_price 
    FROM selling_rates slr 
    WHERE slr.product_option_id = po.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  currency = COALESCE(
    (SELECT currency FROM supplier_rates sr WHERE sr.product_option_id = po.id LIMIT 1),
    (SELECT currency FROM selling_rates slr WHERE slr.product_option_id = po.id LIMIT 1),
    'USD'
  );

COMMIT;
*/

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      ✅ Migration Complete: Pricing Removed from product_options      ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 WHAT CHANGED:';
  RAISE NOTICE '   • Removed: base_price, base_cost, currency from product_options';
  RAISE NOTICE '   • Migrated: Existing pricing data to supplier_rates & selling_rates';
  RAISE NOTICE '   • Created: Default rates for all existing product options';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 WHY THIS IS BETTER:';
  RAISE NOTICE '   ✅ Seasonal pricing (different rates for different dates)';
  RAISE NOTICE '   ✅ Multiple suppliers for same product';
  RAISE NOTICE '   ✅ Time-based pricing (peak/off-peak rates)';
  RAISE NOTICE '   ✅ Audit trail (which rate was used at booking time)';
  RAISE NOTICE '   ✅ Occupancy-based pricing (single/double/triple rooms)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '   1. Update product_option forms to remove pricing fields';
  RAISE NOTICE '   2. Update product_option types to remove pricing fields';
  RAISE NOTICE '   3. Update product_detail page to show rates instead of option prices';
  RAISE NOTICE '   4. Update booking flow to fetch rates from supplier_rates/selling_rates';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT:';
  RAISE NOTICE '   • All existing pricing has been migrated to rates';
  RAISE NOTICE '   • Default dates are 2024-01-01 to 2099-12-31 (very wide range)';
  RAISE NOTICE '   • You should review and update the migrated rates with proper dates';
  RAISE NOTICE '   • Update rate_basis from "per_unit" to appropriate value';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;
