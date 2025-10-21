# 🚀 Master Rate Support Migration - Supabase Instructions

## Step 1: Apply the Migration

### Option A: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `db/migrations/add_master_rate_support.sql`
4. Click **Run** to execute the migration

### Option B: Copy the SQL Below

```sql
-- Add Master Rate Support to Rate Plans
-- This allows rate_plans to have NULL supplier_id for master/selling rates

-- First, make supplier_id nullable for master rates
ALTER TABLE rate_plans 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Add a check constraint to ensure either supplier_id is set OR it's a master rate
ALTER TABLE rate_plans 
ADD CONSTRAINT rate_admin_supplier_or_master_check 
CHECK (
  (supplier_id IS NOT NULL) OR 
  (supplier_id IS NULL AND preferred = true AND inventory_model = 'freesale')
);

-- Add index for master rate lookups
CREATE INDEX IF NOT EXISTS idx_rate_plans_master_rates 
ON rate_plans (org_id, product_variant_id, preferred) 
WHERE supplier_id IS NULL;

-- Add comment explaining the master rate concept
COMMENT ON COLUMN rate_plans.supplier_id IS 
'NULL for master/selling rates, NOT NULL for supplier/cost rates. Master rates define what customers pay, supplier rates define what we pay suppliers.';

-- Update existing rate plans to ensure data integrity
-- This assumes current rate_plans are all supplier rates
-- If you have master rates already, adjust this accordingly
UPDATE rate_plans 
SET preferred = false 
WHERE supplier_id IS NOT NULL;

-- Add helper function to get master rate for a product variant
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

-- Add helper function to get supplier rates for a product variant
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
```

## Step 2: Verify the Migration

After running the migration, verify it worked by running this test query:

```sql
-- Test query to verify master rate support
SELECT 
  'Migration successful!' as status,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rate_plans' 
    AND column_name = 'supplier_id' 
    AND is_nullable = 'YES'
  ) as supplier_id_nullable,
  EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_master_rate'
  ) as master_rate_function_exists;
```

## Step 3: Test the New Functions

```sql
-- Test getting master rate (will be empty until we create master rates)
SELECT * FROM get_master_rate(100, 123, CURRENT_DATE);

-- Test getting supplier rates
SELECT * FROM get_supplier_rates(100, 123, CURRENT_DATE);
```

## What This Migration Does

✅ **Makes supplier_id nullable** - Allows master rates with NULL supplier_id
✅ **Adds data integrity constraints** - Ensures master rates are properly configured  
✅ **Creates helper functions** - get_master_rate() and get_supplier_rates()
✅ **Adds performance indexes** - Optimizes master rate lookups
✅ **Updates existing data** - Sets preferred=false for existing supplier rates

## Next Steps After Migration

1. ✅ Migration applied successfully
2. 🔄 Create master rates for your F1 products  
3. 🔄 Test the enhanced availability service
4. 🔄 Test the booking flow with auto-selection
5. 🔄 Add availability page to navigation

## Troubleshooting

If you get any errors:
- **Permission errors**: Make sure you're using the service role key
- **Constraint errors**: Check if you have existing master rates that conflict
- **Function errors**: Verify PostgreSQL version supports the syntax

## Success Indicators

After successful migration, you should see:
- ✅ `supplier_id` column is nullable in rate_plans table
- ✅ Helper functions are created in your database
- ✅ Test queries return expected results
