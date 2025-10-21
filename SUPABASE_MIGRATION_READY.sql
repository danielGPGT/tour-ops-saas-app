-- Master Rate Support Migration for Supabase
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Step 1: Make supplier_id nullable for master rates
ALTER TABLE rate_plans 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Step 2: Add constraint to ensure data integrity
-- Master rates should have supplier_id = NULL, preferred = true, inventory_model = 'freesale'
ALTER TABLE rate_plans 
ADD CONSTRAINT rate_admin_supplier_or_master_check 
CHECK (
  (supplier_id IS NOT NULL) OR 
  (supplier_id IS NULL AND preferred = true AND inventory_model = 'freesale')
);

-- Step 3: Add index for master rate lookups
CREATE INDEX IF NOT EXISTS idx_rate_plans_master_rates 
ON rate_plans (org_id, product_variant_id, preferred) 
WHERE supplier_id IS NULL;

-- Step 4: Add column documentation
COMMENT ON COLUMN rate_plans.supplier_id IS 
'NULL for master/selling rates, NOT NULL for supplier/cost rates. Master rates define what customers pay, supplier rates define what we pay suppliers.';

-- Step 5: Create helper function to get master rate
CREATE OR REPLACE FUNCTION get_master_rate(
  p_org_id bigint,
  p_product_variant_id bigint,
  p_date date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  rate_plan_id bigint,
  selling_price numeric,
  currency text,
  valid_from date,
  valid_to date
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    ro.base_amount,
    rp.currency,
    rp.valid_from,
    rp.valid_to
  FROM rate_plans rp
  JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
  WHERE rp.org_id = p_org_id
    AND rp.product_variant_id = p_product_variant_id
    AND rp.supplier_id IS NULL  -- Master rate
    AND rp.preferred = true
    AND rp.valid_from <= p_date
    AND rp.valid_to >= p_date
  ORDER BY rp.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create helper function to get supplier rates
CREATE OR REPLACE FUNCTION get_supplier_rates(
  p_org_id bigint,
  p_product_variant_id bigint,
  p_date date DEFAULT CURRENT_DATE
) RETURNS TABLE (
  rate_plan_id bigint,
  supplier_id bigint,
  supplier_name text,
  cost_price numeric,
  currency text,
  priority integer,
  valid_from date,
  valid_to date,
  inventory_model text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id,
    rp.supplier_id,
    s.name,
    ro.base_amount,
    rp.currency,
    rp.priority,
    rp.valid_from,
    rp.valid_to,
    rp.inventory_model
  FROM rate_plans rp
  JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
  JOIN suppliers s ON s.id = rp.supplier_id
  WHERE rp.org_id = p_org_id
    AND rp.product_variant_id = p_product_variant_id
    AND rp.supplier_id IS NOT NULL  -- Supplier rate
    AND rp.valid_from <= p_date
    AND rp.valid_to >= p_date
  ORDER BY rp.priority DESC, ro.base_amount ASC;  -- Best margin first
END;
$$ LANGUAGE plpgsql;

-- Step 7: Update existing rate plans to ensure data integrity
-- This sets preferred = false for existing supplier rates
UPDATE rate_plans 
SET preferred = false 
WHERE supplier_id IS NOT NULL;

-- Step 8: Test the functions (optional - you can run these separately)
-- Test getting master rate (will be empty until we create master rates)
-- SELECT * FROM get_master_rate(1, 1, CURRENT_DATE);

-- Test getting supplier rates
-- SELECT * FROM get_supplier_rates(1, 1, CURRENT_DATE);

-- Success message
SELECT 'Master Rate Support Migration Applied Successfully!' as status;
