-- F1 Scenario Test Queries
-- Run these after the F1 scenario setup to verify everything works

-- Test 1: Check organization was created
SELECT 
  'Organization Test' as test_name,
  id,
  name,
  settings->>'business_type' as business_type,
  settings->>'specialization' as specialization
FROM organizations 
WHERE id = 300;

-- Test 2: Check suppliers were created
SELECT 
  'Suppliers Test' as test_name,
  COUNT(*) as total_suppliers,
  STRING_AGG(name, ', ') as supplier_names
FROM suppliers 
WHERE org_id = 300;

-- Test 3: Check contracts were created
SELECT 
  'Contracts Test' as test_name,
  COUNT(*) as total_contracts,
  STRING_AGG(reference || ' (' || contract_type || ')', ', ') as contract_references
FROM contracts 
WHERE org_id = 300;

-- Test 4: Check products and variants were created
SELECT 
  'Products Test' as test_name,
  p.name as product_name,
  COUNT(pv.id) as variant_count,
  STRING_AGG(pv.name, ', ') as variant_names
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.org_id = 300
GROUP BY p.id, p.name;

-- Test 5: Check allocations were created
SELECT 
  'Allocations Test' as test_name,
  allocation_type,
  COUNT(*) as allocation_count,
  SUM(quantity) as total_quantity
FROM allocation_buckets 
WHERE org_id = 300
GROUP BY allocation_type;

-- Test 6: Check master rates were created
SELECT 
  'Master Rates Test' as test_name,
  pv.name as variant_name,
  ro.base_amount as selling_price,
  rp.currency
FROM rate_plans rp
JOIN product_variants pv ON pv.id = rp.product_variant_id
JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
WHERE rp.org_id = 300 
  AND rp.supplier_id IS NULL 
  AND rp.preferred = true
ORDER BY pv.name;

-- Test 7: Check supplier rates were created
SELECT 
  'Supplier Rates Test' as test_name,
  pv.name as variant_name,
  s.name as supplier_name,
  ro.base_amount as cost_price,
  rp.currency,
  rp.priority
FROM rate_plans rp
JOIN product_variants pv ON pv.id = rp.product_variant_id
JOIN suppliers s ON s.id = rp.supplier_id
JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
WHERE rp.org_id = 300 
  AND rp.supplier_id IS NOT NULL
ORDER BY pv.name, rp.priority DESC;

-- Test 8: Test master rate function
SELECT 
  'Master Rate Function Test' as test_name,
  *
FROM get_master_rate(
  300, 
  (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1),
  CURRENT_DATE
);

-- Test 9: Test supplier rates function
SELECT 
  'Supplier Rates Function Test' as test_name,
  *
FROM get_supplier_rates(
  300, 
  (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1),
  CURRENT_DATE
);

-- Test 10: Check occupancy-based pricing for hotels
SELECT 
  'Hotel Occupancy Pricing Test' as test_name,
  pv.name as variant_name,
  ro.min_occupancy,
  ro.max_occupancy,
  ro.pricing_model,
  ro.base_amount,
  ro.per_person_amount
FROM rate_occupancies ro
JOIN rate_plans rp ON rp.id = ro.rate_plan_id
JOIN product_variants pv ON pv.id = rp.product_variant_id
WHERE rp.org_id = 300 
  AND pv.name LIKE '%Room%'
  AND rp.supplier_id IS NULL
ORDER BY pv.name, ro.min_occupancy;

-- Test 11: Check taxes and fees
SELECT 
  'Taxes and Fees Test' as test_name,
  pv.name as variant_name,
  rtf.name as tax_fee_name,
  rtf.value,
  rtf.amount_type,
  rtf.calc_base
FROM rate_taxes_fees rtf
JOIN rate_plans rp ON rp.id = rtf.rate_plan_id
JOIN product_variants pv ON pv.id = rp.product_variant_id
WHERE rp.org_id = 300 
  AND rp.supplier_id IS NULL
ORDER BY pv.name, rtf.name;

-- Summary
SELECT 
  'F1 Scenario Setup Summary' as summary,
  (SELECT COUNT(*) FROM organizations WHERE id = 300) as organizations,
  (SELECT COUNT(*) FROM suppliers WHERE org_id = 300) as suppliers,
  (SELECT COUNT(*) FROM contracts WHERE org_id = 300) as contracts,
  (SELECT COUNT(*) FROM products WHERE org_id = 300) as products,
  (SELECT COUNT(*) FROM product_variants WHERE org_id = 300) as variants,
  (SELECT COUNT(*) FROM allocation_buckets WHERE org_id = 300) as allocations,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NULL) as master_rates,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NOT NULL) as supplier_rates,
  (SELECT COUNT(*) FROM rate_occupancies WHERE org_id = 300) as occupancy_rates,
  (SELECT COUNT(*) FROM rate_taxes_fees WHERE org_id = 300) as taxes_fees;
