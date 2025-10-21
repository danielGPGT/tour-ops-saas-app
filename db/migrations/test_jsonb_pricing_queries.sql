-- Test queries for JSONB pricing structure
-- These demonstrate how the new structure works

-- Test 1: Get hotel rates for different occupancies
SELECT 
  rp.id,
  rp.rate_type,
  rp.pricing->'occupancy'->'1'->'standard'->>'block_rate' as single_occupancy_rate,
  rp.pricing->'occupancy'->'2'->'standard'->>'block_rate' as double_occupancy_rate,
  rp.pricing->'occupancy'->'2'->'standard'->>'extra_night_rate_before' as extra_night_before,
  rp.pricing->'occupancy'->'2'->'standard'->>'extra_night_rate_after' as extra_night_after
FROM rate_plans rp
WHERE rp.product_variant_id = 300
  AND rp.rate_type = 'supplier_rate'
  AND rp.valid_from <= '2025-12-05'
  AND rp.valid_to >= '2025-12-05';

-- Test 2: Calculate cost for a 6-night stay (4 block + 2 extra after)
SELECT 
  calculate_stay_cost(300, 300, '2025-12-04', '2025-12-10', 2, 'standard') as total_cost;

-- Test 3: Calculate cost for a 6-night stay (2 extra before + 4 block)
SELECT 
  calculate_stay_cost(300, 300, '2025-12-02', '2025-12-08', 2, 'standard') as total_cost;

-- Test 4: Calculate cost for an 8-night stay (2 before + 4 block + 2 after)
SELECT 
  calculate_stay_cost(300, 300, '2025-12-02', '2025-12-10', 2, 'standard') as total_cost;

-- Test 5: Get all block allocations for a product variant
SELECT 
  ab.*,
  pv.name as variant_name,
  s.name as supplier_name
FROM allocation_buckets ab
JOIN product_variants pv ON pv.id = ab.product_variant_id
JOIN suppliers s ON s.id = ab.supplier_id
WHERE ab.product_variant_id = 300
  AND ab.block_type = 'block'
ORDER BY ab.block_start_date;

-- Test 6: Get all extra night allocations
SELECT 
  ab.*,
  pv.name as variant_name,
  s.name as supplier_name
FROM allocation_buckets ab
JOIN product_variants pv ON pv.id = ab.product_variant_id
JOIN suppliers s ON s.id = ab.supplier_id
WHERE ab.product_variant_id = 300
  AND ab.block_type IN ('extra_before', 'extra_after')
ORDER BY ab.date;

-- Test 7: Get ticket pricing with multiple suppliers
SELECT 
  rp.id,
  rp.pricing->'suppliers'->'official'->>'rate' as official_rate,
  rp.pricing->'suppliers'->'reseller_a'->>'rate' as reseller_a_rate,
  rp.pricing->'suppliers'->'reseller_b'->>'rate' as reseller_b_rate,
  rp.pricing->'provisional'->>'estimated_rate' as provisional_rate
FROM rate_plans rp
WHERE rp.product_variant_id = 302
  AND rp.rate_type = 'supplier_rate';

-- Test 8: Get transfer pricing (free sell)
SELECT 
  rp.id,
  rp.pricing->'unit_types'->'per_seat'->>'estimated_rate' as per_seat_rate,
  rp.pricing->'unit_types'->'per_vehicle'->>'estimated_rate' as per_vehicle_rate,
  rp.pricing->'logistics'->>'planning_deadline' as planning_deadline
FROM rate_plans rp
WHERE rp.product_variant_id = 303
  AND rp.rate_type = 'supplier_rate';

-- Test 9: Get master rates (selling prices) vs supplier rates (costs)
SELECT 
  rp.rate_type,
  rp.pricing->'occupancy'->'2'->'standard'->>'block_rate' as rate,
  CASE 
    WHEN rp.rate_type = 'master_rate' THEN 'Selling Price'
    WHEN rp.rate_type = 'supplier_rate' THEN 'Cost Price'
  END as rate_description
FROM rate_plans rp
WHERE rp.product_variant_id = 300
  AND rp.valid_from <= '2025-12-05'
  AND rp.valid_to >= '2025-12-05'
ORDER BY rp.rate_type;

-- Test 10: Calculate margin for 2-person, 4-night stay
WITH costs AS (
  SELECT 
    rp.pricing->'occupancy'->'2'->'standard'->>'block_rate'::numeric as supplier_rate
  FROM rate_plans rp
  WHERE rp.product_variant_id = 300
    AND rp.supplier_id = 300
    AND rp.rate_type = 'supplier_rate'
),
selling AS (
  SELECT 
    rp.pricing->'occupancy'->'2'->'standard'->>'block_rate'::numeric as master_rate
  FROM rate_plans rp
  WHERE rp.product_variant_id = 300
    AND rp.supplier_id IS NULL
    AND rp.rate_type = 'master_rate'
)
SELECT 
  c.supplier_rate * 4 as total_cost,
  s.master_rate * 4 as total_selling_price,
  (s.master_rate * 4) - (c.supplier_rate * 4) as margin,
  ((s.master_rate * 4) - (c.supplier_rate * 4)) / (s.master_rate * 4) * 100 as margin_percentage
FROM costs c, selling s;
