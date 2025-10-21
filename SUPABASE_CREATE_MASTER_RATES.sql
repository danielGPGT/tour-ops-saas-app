-- Create Master Rates for F1 Grand Prix Scenario
-- Run this AFTER applying the master rate migration

-- First, let's see what F1 products we have
-- SELECT pv.id, pv.name, p.name as product_name 
-- FROM product_variants pv 
-- JOIN products p ON p.id = pv.product_id 
-- WHERE p.name ILIKE '%f1%' OR p.name ILIKE '%grand prix%' OR p.name ILIKE '%monaco%';

-- Create master rates for F1 products
-- These are the SELLING PRICES that customers pay

-- 1. F1 Monaco Grand Prix Tickets - Main Grandstand
INSERT INTO rate_plans (
  org_id,
  product_variant_id,
  supplier_id,  -- NULL for master rate
  inventory_model,
  currency,
  markets,
  channels,
  preferred,    -- TRUE for master rates
  valid_from,
  valid_to,
  rate_doc,
  priority
) VALUES (
  1,  -- org_id (adjust as needed)
  (SELECT id FROM product_variants WHERE name ILIKE '%main grandstand%' LIMIT 1),
  NULL,  -- Master rate has no supplier
  'freesale',
  'EUR',
  ARRAY['UK', 'US', 'EU'],
  ARRAY['direct', 'agent', 'online'],
  true,  -- This is the master/selling rate
  '2025-01-01',
  '2025-12-31',
  '{"description": "Master selling rate for F1 Monaco Main Grandstand tickets"}',
  1000  -- High priority for master rates
);

-- Add the occupancy rate (selling price)
INSERT INTO rate_occupancies (
  rate_plan_id,
  occupancy_type,
  base_amount,
  currency,
  age_band,
  rate_doc
) VALUES (
  (SELECT id FROM rate_plans WHERE supplier_id IS NULL AND preferred = true ORDER BY created_at DESC LIMIT 1),
  'adult',
  450.00,  -- €450 selling price
  'EUR',
  'adult',
  '{"description": "Adult ticket price"}'
);

-- 2. F1 Monaco Grand Prix Tickets - General Admission
INSERT INTO rate_plans (
  org_id,
  product_variant_id,
  supplier_id,
  inventory_model,
  currency,
  markets,
  channels,
  preferred,
  valid_from,
  valid_to,
  rate_doc,
  priority
) VALUES (
  1,
  (SELECT id FROM product_variants WHERE name ILIKE '%general admission%' LIMIT 1),
  NULL,
  'freesale',
  'EUR',
  ARRAY['UK', 'US', 'EU'],
  ARRAY['direct', 'agent', 'online'],
  true,
  '2025-01-01',
  '2025-12-31',
  '{"description": "Master selling rate for F1 Monaco General Admission tickets"}',
  1000
);

INSERT INTO rate_occupancies (
  rate_plan_id,
  occupancy_type,
  base_amount,
  currency,
  age_band,
  rate_doc
) VALUES (
  (SELECT id FROM rate_plans WHERE supplier_id IS NULL AND preferred = true ORDER BY created_at DESC LIMIT 1),
  'adult',
  280.00,  -- €280 selling price
  'EUR',
  'adult',
  '{"description": "Adult ticket price"}'
);

-- 3. Hotel Accommodation - Deluxe Room
INSERT INTO rate_plans (
  org_id,
  product_variant_id,
  supplier_id,
  inventory_model,
  currency,
  markets,
  channels,
  preferred,
  valid_from,
  valid_to,
  rate_doc,
  priority
) VALUES (
  1,
  (SELECT id FROM product_variants WHERE name ILIKE '%deluxe%' AND name ILIKE '%room%' LIMIT 1),
  NULL,
  'freesale',
  'EUR',
  ARRAY['UK', 'US', 'EU'],
  ARRAY['direct', 'agent', 'online'],
  true,
  '2025-01-01',
  '2025-12-31',
  '{"description": "Master selling rate for Deluxe Hotel Room"}',
  1000
);

INSERT INTO rate_occupancies (
  rate_plan_id,
  occupancy_type,
  base_amount,
  currency,
  age_band,
  rate_doc
) VALUES (
  (SELECT id FROM rate_plans WHERE supplier_id IS NULL AND preferred = true ORDER BY created_at DESC LIMIT 1),
  'per_room',
  320.00,  -- €320 per room per night
  'EUR',
  'adult',
  '{"description": "Per room per night"}'
);

-- 4. Transfer Service - Airport to Hotel
INSERT INTO rate_plans (
  org_id,
  product_variant_id,
  supplier_id,
  inventory_model,
  currency,
  markets,
  channels,
  preferred,
  valid_from,
  valid_to,
  rate_doc,
  priority
) VALUES (
  1,
  (SELECT id FROM product_variants WHERE name ILIKE '%transfer%' AND name ILIKE '%airport%' LIMIT 1),
  NULL,
  'freesale',
  'EUR',
  ARRAY['UK', 'US', 'EU'],
  ARRAY['direct', 'agent', 'online'],
  true,
  '2025-01-01',
  '2025-12-31',
  '{"description": "Master selling rate for Airport Transfer"}',
  1000
);

INSERT INTO rate_occupancies (
  rate_plan_id,
  occupancy_type,
  base_amount,
  currency,
  age_band,
  rate_doc
) VALUES (
  (SELECT id FROM rate_plans WHERE supplier_id IS NULL AND preferred = true ORDER BY created_at DESC LIMIT 1),
  'per_person',
  45.00,  -- €45 per person
  'EUR',
  'adult',
  '{"description": "Per person transfer price"}'
);

-- Verify the master rates were created
SELECT 
  'Master rates created successfully!' as status,
  COUNT(*) as total_master_rates
FROM rate_plans 
WHERE supplier_id IS NULL AND preferred = true;

-- Show the created master rates
SELECT 
  rp.id,
  rp.product_variant_id,
  pv.name as variant_name,
  p.name as product_name,
  ro.base_amount as selling_price,
  rp.currency,
  rp.preferred
FROM rate_plans rp
JOIN product_variants pv ON pv.id = rp.product_variant_id
JOIN products p ON p.id = pv.product_id
JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
WHERE rp.supplier_id IS NULL 
  AND rp.preferred = true
ORDER BY p.name, pv.name;
