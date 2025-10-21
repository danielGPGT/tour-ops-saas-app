-- F1 Tour Operator Scenario Setup
-- This creates a complete F1 Monaco Grand Prix scenario with all the complexity you described

-- Step 0: Create F1 Tour Operator Organization
INSERT INTO organizations (id, name, settings, created_at, updated_at) VALUES
(300, 'F1 Monaco Grand Prix Tours', '{"business_type": "sport_events", "specialization": "f1_motogp", "currency": "EUR", "timezone": "Europe/Monaco", "commission_structure": "supplier_based"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 1: Create F1-specific suppliers
INSERT INTO suppliers (org_id, name, terms, channels, status) VALUES
(300, 'Hotel Hermitage Monaco', '{"commission_rate": 10, "booking_cutoff_days": 30, "rooming_list_deadline": 14}', ARRAY['direct', 'agent'], 'active'),
(300, 'Ticket Supplier Monaco', '{"commission_rate": 15, "booking_cutoff_days": 45}', ARRAY['direct'], 'active'),
(300, 'Elite Ticket Solutions', '{"commission_rate": 12, "booking_cutoff_days": 30}', ARRAY['agent'], 'active'),
(300, 'Monaco Transfer Co', '{"booking_cutoff_days": 7, "vehicle_types": ["coach", "minibus", "car"]}', ARRAY['direct'], 'active'),
(300, 'Nice Airport Transfers', '{"booking_cutoff_days": 7, "vehicle_types": ["coach", "minibus", "car"]}', ARRAY['direct'], 'active');

-- Step 2: Create F1 products
INSERT INTO products (org_id, name, type, status, product_type_id) VALUES
(300, 'F1 Monaco Grand Prix 2025', 'package', 'active', (SELECT id FROM product_types WHERE name = 'Event Package')),
(300, 'Monaco Grand Prix Hotel', 'accommodation', 'active', (SELECT id FROM product_types WHERE name = 'Accommodation')),
(300, 'F1 Circuit Transfers', 'transfer', 'active', (SELECT id FROM product_types WHERE name = 'Transfer')),
(300, 'Airport Transfers', 'transfer', 'active', (SELECT id FROM product_types WHERE name = 'Transfer'));

-- Step 3: Create F1 product variants
INSERT INTO product_variants (org_id, product_id, name, subtype, attributes, status) VALUES
-- Hotel variants
(300, (SELECT id FROM products WHERE name = 'Monaco Grand Prix Hotel'), 'Standard Room', 'hotel_room', '{"room_type": "standard", "max_occupancy": 3, "bed_type": "double_or_twin"}', 'active'),
(300, (SELECT id FROM products WHERE name = 'Monaco Grand Prix Hotel'), 'Deluxe Room', 'hotel_room', '{"room_type": "deluxe", "max_occupancy": 3, "bed_type": "double_or_twin", "sea_view": true}', 'active'),

-- Ticket variants
(300, (SELECT id FROM products WHERE name = 'F1 Monaco Grand Prix 2025'), 'Main Grandstand', 'event_ticket', '{"sector": "main_grandstand", "seat_type": "reserved"}', 'active'),
(300, (SELECT id FROM products WHERE name = 'F1 Monaco Grand Prix 2025'), 'General Admission', 'event_ticket', '{"sector": "general_admission", "seat_type": "standing"}', 'active'),
(300, (SELECT id FROM products WHERE name = 'F1 Monaco Grand Prix 2025'), 'VIP Hospitality', 'event_ticket', '{"sector": "vip", "seat_type": "hospitality", "includes": ["catering", "drinks"]}', 'active'),

-- Transfer variants
(300, (SELECT id FROM products WHERE name = 'F1 Circuit Transfers'), 'Circuit Transfer Per Person', 'transfer', '{"transfer_type": "circuit", "pricing_model": "per_person", "vehicle_type": "coach"}', 'active'),
(300, (SELECT id FROM products WHERE name = 'F1 Circuit Transfers'), 'Circuit Transfer Per Vehicle', 'transfer', '{"transfer_type": "circuit", "pricing_model": "per_vehicle", "vehicle_type": "coach"}', 'active'),

-- Airport transfer variants
(300, (SELECT id FROM products WHERE name = 'Airport Transfers'), 'Inbound Transfer Per Person', 'transfer', '{"transfer_type": "airport_inbound", "pricing_model": "per_person", "vehicle_type": "coach"}', 'active'),
(300, (SELECT id FROM products WHERE name = 'Airport Transfers'), 'Outbound Transfer Per Vehicle', 'transfer', '{"transfer_type": "airport_outbound", "pricing_model": "per_vehicle", "vehicle_type": "coach"}', 'active');

-- Step 4: Create hotel block allocations (04-08 Dec, 70 standard + 30 deluxe)
-- Standard rooms
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost, contract_id) VALUES
-- Standard rooms for each day
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-04', 'committed', 70, 0, 0, 280.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-05', 'committed', 70, 0, 0, 280.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-06', 'committed', 70, 0, 0, 280.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-07', 'committed', 70, 0, 0, 280.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-08', 'committed', 70, 0, 0, 280.00, 'EUR', true, NULL),

-- Deluxe rooms for each day
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-04', 'committed', 30, 0, 0, 380.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-05', 'committed', 30, 0, 0, 380.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-06', 'committed', 30, 0, 0, 380.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-07', 'committed', 30, 0, 0, 380.00, 'EUR', true, NULL),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), '2025-12-08', 'committed', 30, 0, 0, 380.00, 'EUR', true, NULL);

-- Step 5: Create ticket allocations (supplier inventory)
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost) VALUES
-- Main Grandstand from different suppliers
(300, (SELECT id FROM product_variants WHERE name = 'Main Grandstand'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), '2025-12-07', 'committed', 50, 0, 0, 280.00, 'EUR', true),
(300, (SELECT id FROM product_variants WHERE name = 'Main Grandstand'), (SELECT id FROM suppliers WHERE name = 'Elite Ticket Solutions'), '2025-12-07', 'committed', 30, 0, 0, 295.00, 'EUR', true),

-- General Admission
(300, (SELECT id FROM product_variants WHERE name = 'General Admission'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), '2025-12-07', 'committed', 100, 0, 0, 180.00, 'EUR', true),

-- VIP Hospitality (free sell - no pre-allocated inventory)
(300, (SELECT id FROM product_variants WHERE name = 'VIP Hospitality'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), '2025-12-07', 'freesale', NULL, 0, 0, 850.00, 'EUR', false);

-- Step 6: Create transfer allocations (free sell)
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost) VALUES
-- Circuit transfers (free sell)
(300, (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Person'), (SELECT id FROM suppliers WHERE name = 'Monaco Transfer Co'), '2025-12-07', 'freesale', NULL, 0, 0, 35.00, 'EUR', false),
(300, (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Vehicle'), (SELECT id FROM suppliers WHERE name = 'Monaco Transfer Co'), '2025-12-07', 'freesale', NULL, 0, 0, 280.00, 'EUR', false),

-- Airport transfers (free sell)
(300, (SELECT id FROM product_variants WHERE name = 'Inbound Transfer Per Person'), (SELECT id FROM suppliers WHERE name = 'Nice Airport Transfers'), '2025-12-04', 'freesale', NULL, 0, 0, 45.00, 'EUR', false),
(300, (SELECT id FROM product_variants WHERE name = 'Outbound Transfer Per Vehicle'), (SELECT id FROM suppliers WHERE name = 'Nice Airport Transfers'), '2025-12-08', 'freesale', NULL, 0, 0, 180.00, 'EUR', false);

-- Step 7: Create master rates (selling prices)
INSERT INTO rate_plans (org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, rate_type) VALUES
-- Hotel master rates
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Standard Room", "min_stay": 4}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Deluxe Room", "min_stay": 4}', 1000, 'master_rate'),

-- Ticket master rates
(300, (SELECT id FROM product_variants WHERE name = 'Main Grandstand'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Main Grandstand tickets"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'General Admission'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for General Admission tickets"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'VIP Hospitality'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for VIP Hospitality"}', 1000, 'master_rate'),

-- Transfer master rates
(300, (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Person'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Circuit Transfer per person"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Vehicle'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Circuit Transfer per vehicle"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Inbound Transfer Per Person'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Inbound Airport Transfer per person"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Outbound Transfer Per Vehicle'), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Outbound Airport Transfer per vehicle"}', 1000, 'master_rate');

-- Step 8: Create occupancy-based rate structures for hotels
INSERT INTO rate_occupancies (org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount) VALUES
-- Standard Room occupancy rates
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 1, 1, 'fixed', 400.00, NULL), -- Single occupancy
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 2, 2, 'fixed', 450.00, NULL), -- Double occupancy
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 3, 3, 'base_plus_pax', 450.00, 75.00), -- Extra person

-- Deluxe Room occupancy rates
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 1, 1, 'fixed', 520.00, NULL), -- Single occupancy
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 2, 2, 'fixed', 580.00, NULL), -- Double occupancy
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 3, 3, 'base_plus_pax', 580.00, 85.00), -- Extra person

-- Ticket rates (per person)
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Main Grandstand') AND supplier_id IS NULL), 1, 1, 'fixed', 450.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'General Admission') AND supplier_id IS NULL), 1, 1, 'fixed', 280.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'VIP Hospitality') AND supplier_id IS NULL), 1, 1, 'fixed', 1200.00, NULL),

-- Transfer rates
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Person') AND supplier_id IS NULL), 1, 1, 'fixed', 45.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Circuit Transfer Per Vehicle') AND supplier_id IS NULL), 1, 1, 'fixed', 350.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Inbound Transfer Per Person') AND supplier_id IS NULL), 1, 1, 'fixed', 55.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Outbound Transfer Per Vehicle') AND supplier_id IS NULL), 1, 1, 'fixed', 220.00, NULL);

-- Step 9: Create taxes and fees
INSERT INTO rate_taxes_fees (org_id, rate_plan_id, name, jurisdiction, inclusive, calc_base, amount_type, value) VALUES
-- Hotel taxes and fees
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 'City Tax', 'Monaco', false, 'per_person_per_night', 'fixed', 5.00),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 'VAT', 'Monaco', false, 'total', 'percentage', 10.00),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NULL), 'Breakfast', 'Monaco', false, 'per_person_per_night', 'fixed', 25.00),

(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 'City Tax', 'Monaco', false, 'per_person_per_night', 'fixed', 5.00),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 'VAT', 'Monaco', false, 'total', 'percentage', 10.00),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NULL), 'Breakfast', 'Monaco', false, 'per_person_per_night', 'fixed', 30.00);

-- Step 10: Create supplier rate plans (cost rates)
INSERT INTO rate_plans (org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, rate_type) VALUES
-- Hotel supplier rates (cost rates)
(300, (SELECT id FROM product_variants WHERE name = 'Standard Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Standard Room"}', 100, 'supplier_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Deluxe Room'), (SELECT id FROM suppliers WHERE name = 'Hotel Hermitage Monaco'), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Deluxe Room"}', 100, 'supplier_rate'),

-- Ticket supplier rates (cost rates)
(300, (SELECT id FROM product_variants WHERE name = 'Main Grandstand'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Main Grandstand from Ticket Supplier Monaco"}', 100, 'supplier_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'Main Grandstand'), (SELECT id FROM suppliers WHERE name = 'Elite Ticket Solutions'), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Main Grandstand from Elite Ticket Solutions"}', 90, 'supplier_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'General Admission'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for General Admission"}', 100, 'supplier_rate'),
(300, (SELECT id FROM product_variants WHERE name = 'VIP Hospitality'), (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco'), 'on_request', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for VIP Hospitality (on request)"}', 100, 'supplier_rate');

-- Add occupancy rates for supplier rates
INSERT INTO rate_occupancies (org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount) VALUES
-- Hotel supplier rates (cost rates)
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Standard Room') AND supplier_id IS NOT NULL), 2, 2, 'fixed', 280.00, NULL), -- Cost for double occupancy
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Deluxe Room') AND supplier_id IS NOT NULL), 2, 2, 'fixed', 380.00, NULL), -- Cost for double occupancy

-- Ticket supplier rates (cost rates)
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Main Grandstand') AND supplier_id = (SELECT id FROM suppliers WHERE name = 'Ticket Supplier Monaco')), 1, 1, 'fixed', 280.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'Main Grandstand') AND supplier_id = (SELECT id FROM suppliers WHERE name = 'Elite Ticket Solutions')), 1, 1, 'fixed', 295.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'General Admission') AND supplier_id IS NOT NULL), 1, 1, 'fixed', 180.00, NULL),
(300, (SELECT id FROM rate_plans WHERE product_variant_id = (SELECT id FROM product_variants WHERE name = 'VIP Hospitality') AND supplier_id IS NOT NULL), 1, 1, 'fixed', 850.00, NULL);

-- Success message
SELECT 
  'F1 Monaco Grand Prix Scenario Setup Complete!' as status,
  (SELECT COUNT(*) FROM suppliers WHERE org_id = 300) as suppliers_created,
  (SELECT COUNT(*) FROM products WHERE org_id = 300) as products_created,
  (SELECT COUNT(*) FROM product_variants WHERE org_id = 300) as variants_created,
  (SELECT COUNT(*) FROM allocation_buckets WHERE org_id = 300) as allocations_created,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NULL) as master_rates_created,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NOT NULL) as supplier_rates_created;
