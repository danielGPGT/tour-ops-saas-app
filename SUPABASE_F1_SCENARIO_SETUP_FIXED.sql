-- F1 Tour Operator Scenario Setup - FIXED VERSION
-- This creates a complete F1 Monaco Grand Prix scenario with all the complexity you described

-- Step 0: Create F1 Tour Operator Organization
INSERT INTO organizations (id, name, settings, created_at, updated_at) VALUES
(300, 'F1 Monaco Grand Prix Tours', '{"business_type": "sport_events", "specialization": "f1_motogp", "currency": "EUR", "timezone": "Europe/Monaco", "commission_structure": "supplier_based"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Step 1: Create product types if they don't exist
INSERT INTO product_types (org_id, name, description, icon, color, is_default, created_at, updated_at)
SELECT 300, 'Event Package', 'F1 and MotoGP event packages', 'ticket', '#FF6B35', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM product_types WHERE org_id = 300 AND name = 'Event Package');

INSERT INTO product_types (org_id, name, description, icon, color, is_default, created_at, updated_at)
SELECT 300, 'Accommodation', 'Hotel and accommodation services', 'bed', '#4ECDC4', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM product_types WHERE org_id = 300 AND name = 'Accommodation');

INSERT INTO product_types (org_id, name, description, icon, color, is_default, created_at, updated_at)
SELECT 300, 'Transfer', 'Transportation and transfer services', 'car', '#45B7D1', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM product_types WHERE org_id = 300 AND name = 'Transfer');

-- Step 2: Create F1-specific suppliers
INSERT INTO suppliers (org_id, name, terms, channels, status) VALUES
(300, 'Hotel Hermitage Monaco', '{"commission_rate": 10, "booking_cutoff_days": 30, "rooming_list_deadline": 14}', ARRAY['direct', 'agent'], 'active'),
(300, 'Ticket Supplier Monaco', '{"commission_rate": 15, "booking_cutoff_days": 45}', ARRAY['direct'], 'active'),
(300, 'Elite Ticket Solutions', '{"commission_rate": 12, "booking_cutoff_days": 30}', ARRAY['agent'], 'active'),
(300, 'Monaco Transfer Co', '{"booking_cutoff_days": 7, "vehicle_types": ["coach", "minibus", "car"]}', ARRAY['direct'], 'active'),
(300, 'Nice Airport Transfers', '{"booking_cutoff_days": 7, "vehicle_types": ["coach", "minibus", "car"]}', ARRAY['direct'], 'active');

-- Step 2: Create contracts for suppliers
INSERT INTO contracts (org_id, supplier_id, reference, status, contract_type, signed_date, notes, commission_rate, currency, booking_cutoff_days, cancellation_policies, payment_policies, valid_from, valid_to) VALUES
-- Hotel contract
(300, (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), 'HOT-2025-001', 'active', 'allocation', '2025-01-15', 'F1 Monaco Grand Prix 2025 - Block allocation contract for 100 rooms (70 standard + 30 deluxe) for 04-08 Dec with 4 night minimum stay', 10.00, 'EUR', 30, '[{"days_before": 30, "penalty_percent": 50}, {"days_before": 14, "penalty_percent": 100}]', '[{"type": "deposit", "days_before": 30, "percentage": 50}, {"type": "final", "days_before": 7, "percentage": 50}]', '2025-01-01', '2025-12-31'),

-- Ticket supplier contracts
(300, (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), 'TICK-2025-001', 'active', 'net_rate', '2025-02-01', 'F1 Monaco Grand Prix 2025 - Main ticket supplier contract for grandstand and general admission tickets', 15.00, 'EUR', 45, '[{"days_before": 45, "penalty_percent": 25}, {"days_before": 30, "penalty_percent": 50}, {"days_before": 14, "penalty_percent": 100}]', '[{"type": "full_payment", "days_before": 45, "percentage": 100}]', '2025-01-01', '2025-12-31'),

(300, (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Elite Ticket Solutions' LIMIT 1), 'TICK-2025-002', 'active', 'commissionable', '2025-02-15', 'F1 Monaco Grand Prix 2025 - Secondary ticket supplier contract for premium grandstand tickets', 12.00, 'EUR', 30, '[{"days_before": 30, "penalty_percent": 50}, {"days_before": 14, "penalty_percent": 100}]', '[{"type": "full_payment", "days_before": 30, "percentage": 100}]', '2025-01-01', '2025-12-31'),

-- Transfer company contracts (free sell, no allocation commitment)
(300, (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Monaco Transfer Co' LIMIT 1), 'TRANS-2025-001', 'active', 'net_rate', '2025-03-01', 'F1 Monaco Grand Prix 2025 - Circuit transfer services contract (free sell basis)', 8.00, 'EUR', 7, '[{"days_before": 7, "penalty_percent": 0}, {"days_before": 24, "penalty_percent": 25}]', '[{"type": "full_payment", "days_before": 7, "percentage": 100}]', '2025-01-01', '2025-12-31'),

(300, (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Nice Airport Transfers' LIMIT 1), 'TRANS-2025-002', 'active', 'net_rate', '2025-03-01', 'F1 Monaco Grand Prix 2025 - Airport transfer services contract (free sell basis)', 8.00, 'EUR', 7, '[{"days_before": 7, "penalty_percent": 0}, {"days_before": 24, "penalty_percent": 25}]', '[{"type": "full_payment", "days_before": 7, "percentage": 100}]', '2025-01-01', '2025-12-31');

-- Step 3: Create F1 products (using the product type IDs we just created)
INSERT INTO products (org_id, name, type, status, product_type_id) VALUES
(300, 'F1 Monaco Grand Prix 2025', 'package', 'active', (SELECT id FROM product_types WHERE org_id = 300 AND name = 'Event Package' LIMIT 1)),
(300, 'Monaco Grand Prix Hotel', 'accommodation', 'active', (SELECT id FROM product_types WHERE org_id = 300 AND name = 'Accommodation' LIMIT 1)),
(300, 'F1 Circuit Transfers', 'transfer', 'active', (SELECT id FROM product_types WHERE org_id = 300 AND name = 'Transfer' LIMIT 1)),
(300, 'Airport Transfers', 'transfer', 'active', (SELECT id FROM product_types WHERE org_id = 300 AND name = 'Transfer' LIMIT 1));

-- Step 4: Create F1 product variants
INSERT INTO product_variants (org_id, product_id, name, subtype, attributes, status) VALUES
-- Hotel variants
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'Monaco Grand Prix Hotel' LIMIT 1), 'Standard Room', 'hotel_room', '{"room_type": "standard", "max_occupancy": 3, "bed_type": "double_or_twin"}', 'active'),
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'Monaco Grand Prix Hotel' LIMIT 1), 'Deluxe Room', 'hotel_room', '{"room_type": "deluxe", "max_occupancy": 3, "bed_type": "double_or_twin", "sea_view": true}', 'active'),

-- Ticket variants
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'F1 Monaco Grand Prix 2025' LIMIT 1), 'Main Grandstand', 'event_ticket', '{"sector": "main_grandstand", "seat_type": "reserved"}', 'active'),
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'F1 Monaco Grand Prix 2025' LIMIT 1), 'General Admission', 'event_ticket', '{"sector": "general_admission", "seat_type": "standing"}', 'active'),
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'F1 Monaco Grand Prix 2025' LIMIT 1), 'VIP Hospitality', 'event_ticket', '{"sector": "vip", "seat_type": "hospitality", "includes": ["catering", "drinks"]}', 'active'),

-- Transfer variants
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'F1 Circuit Transfers' LIMIT 1), 'Circuit Transfer Per Person', 'transfer', '{"transfer_type": "circuit", "pricing_model": "per_person", "vehicle_type": "coach"}', 'active'),
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'F1 Circuit Transfers' LIMIT 1), 'Circuit Transfer Per Vehicle', 'transfer', '{"transfer_type": "circuit", "pricing_model": "per_vehicle", "vehicle_type": "coach"}', 'active'),

-- Airport transfer variants
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'Airport Transfers' LIMIT 1), 'Inbound Transfer Per Person', 'transfer', '{"transfer_type": "airport_inbound", "pricing_model": "per_person", "vehicle_type": "coach"}', 'active'),
(300, (SELECT id FROM products WHERE org_id = 300 AND name = 'Airport Transfers' LIMIT 1), 'Outbound Transfer Per Vehicle', 'transfer', '{"transfer_type": "airport_outbound", "pricing_model": "per_vehicle", "vehicle_type": "coach"}', 'active');

-- Step 6: Create hotel block allocations (04-08 Dec, 70 standard + 30 deluxe)
-- Standard rooms
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost, contract_id) VALUES
-- Standard rooms for each day
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-04', 'committed', 70, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-05', 'committed', 70, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-06', 'committed', 70, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-07', 'committed', 70, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-08', 'committed', 70, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),

-- Deluxe rooms for each day
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-04', 'committed', 30, 0, 0, 380.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-05', 'committed', 30, 0, 0, 380.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-06', 'committed', 30, 0, 0, 380.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-07', 'committed', 30, 0, 0, 380.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), '2025-12-08', 'committed', 30, 0, 0, 380.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1));

-- Step 7: Create ticket allocations (supplier inventory)
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost, contract_id) VALUES
-- Main Grandstand from different suppliers
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), '2025-12-07', 'committed', 50, 0, 0, 280.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Elite Ticket Solutions' LIMIT 1), '2025-12-07', 'committed', 30, 0, 0, 295.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-002' LIMIT 1)),

-- General Admission
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'General Admission' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), '2025-12-07', 'committed', 100, 0, 0, 180.00, 'EUR', true, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1)),

-- VIP Hospitality (free sell - no pre-allocated inventory)
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'VIP Hospitality' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), '2025-12-07', 'freesale', NULL, 0, 0, 850.00, 'EUR', false, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1));

-- Step 8: Create transfer allocations (free sell)
INSERT INTO allocation_buckets (org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, unit_cost, currency, committed_cost, contract_id) VALUES
-- Circuit transfers (free sell)
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Person' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Monaco Transfer Co' LIMIT 1), '2025-12-07', 'freesale', NULL, 0, 0, 35.00, 'EUR', false, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TRANS-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Vehicle' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Monaco Transfer Co' LIMIT 1), '2025-12-07', 'freesale', NULL, 0, 0, 280.00, 'EUR', false, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TRANS-2025-001' LIMIT 1)),

-- Airport transfers (free sell)
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Inbound Transfer Per Person' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Nice Airport Transfers' LIMIT 1), '2025-12-04', 'freesale', NULL, 0, 0, 45.00, 'EUR', false, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TRANS-2025-002' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Outbound Transfer Per Vehicle' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Nice Airport Transfers' LIMIT 1), '2025-12-08', 'freesale', NULL, 0, 0, 180.00, 'EUR', false, (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TRANS-2025-002' LIMIT 1));

-- Step 9: Create master rates (selling prices)
INSERT INTO rate_plans (org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, rate_type) VALUES
-- Hotel master rates
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Standard Room", "min_stay": 4}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Deluxe Room", "min_stay": 4}', 1000, 'master_rate'),

-- Ticket master rates
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Main Grandstand tickets"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'General Admission' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for General Admission tickets"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'VIP Hospitality' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for VIP Hospitality"}', 1000, 'master_rate'),

-- Transfer master rates
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Person' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Circuit Transfer per person"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Vehicle' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Circuit Transfer per vehicle"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Inbound Transfer Per Person' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Inbound Airport Transfer per person"}', 1000, 'master_rate'),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Outbound Transfer Per Vehicle' LIMIT 1), NULL, 'freesale', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent', 'online'], true, '2025-01-01', '2025-12-31', '{"description": "Master selling rate for Outbound Airport Transfer per vehicle"}', 1000, 'master_rate');

-- Step 10: Create occupancy-based rate structures for hotels
INSERT INTO rate_occupancies (org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount) VALUES
-- Standard Room occupancy rates
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 400.00, NULL), -- Single occupancy
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 2, 2, 'fixed', 450.00, NULL), -- Double occupancy
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 3, 3, 'base_plus_pax', 450.00, 75.00), -- Extra person

-- Deluxe Room occupancy rates
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 520.00, NULL), -- Single occupancy
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 2, 2, 'fixed', 580.00, NULL), -- Double occupancy
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 3, 3, 'base_plus_pax', 580.00, 85.00), -- Extra person

-- Ticket rates (per person)
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 450.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'General Admission') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 280.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'VIP Hospitality') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 1200.00, NULL),

-- Transfer rates
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Person') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 45.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Circuit Transfer Per Vehicle') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 350.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Inbound Transfer Per Person') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 55.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Outbound Transfer Per Vehicle') AND supplier_id IS NULL LIMIT 1), 1, 1, 'fixed', 220.00, NULL);

-- Step 11: Create taxes and fees
INSERT INTO rate_taxes_fees (org_id, rate_plan_id, name, jurisdiction, inclusive, calc_base, amount_type, value) VALUES
-- Hotel taxes and fees
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 'City Tax', 'Monaco', false, 'per_person_per_night', 'fixed', 5.00),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 'VAT', 'Monaco', false, 'total', 'percentage', 10.00),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NULL LIMIT 1), 'Breakfast', 'Monaco', false, 'per_person_per_night', 'fixed', 25.00),

(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 'City Tax', 'Monaco', false, 'per_person_per_night', 'fixed', 5.00),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 'VAT', 'Monaco', false, 'total', 'percentage', 10.00),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NULL LIMIT 1), 'Breakfast', 'Monaco', false, 'per_person_per_night', 'fixed', 30.00);

-- Step 12: Create supplier rate plans (cost rates)
INSERT INTO rate_plans (org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, rate_type, contract_id) VALUES
-- Hotel supplier rates (cost rates)
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Standard Room"}', 100, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Hotel Hermitage Monaco' LIMIT 1), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct', 'agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Deluxe Room"}', 100, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'HOT-2025-001' LIMIT 1)),

-- Ticket supplier rates (cost rates)
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Main Grandstand from Ticket Supplier Monaco"}', 100, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Elite Ticket Solutions' LIMIT 1), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['agent'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for Main Grandstand from Elite Ticket Solutions"}', 90, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-002' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'General Admission' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), 'committed', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for General Admission"}', 100, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1)),
(300, (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'VIP Hospitality' LIMIT 1), (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1), 'on_request', 'EUR', ARRAY['UK', 'US', 'EU'], ARRAY['direct'], false, '2025-01-01', '2025-12-31', '{"description": "Supplier cost rate for VIP Hospitality (on request)"}', 100, 'supplier_rate', (SELECT id FROM contracts WHERE org_id = 300 AND reference = 'TICK-2025-001' LIMIT 1));

-- Step 13: Add occupancy rates for supplier rates
INSERT INTO rate_occupancies (org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount) VALUES
-- Hotel supplier rates (cost rates)
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Standard Room') AND supplier_id IS NOT NULL LIMIT 1), 2, 2, 'fixed', 280.00, NULL), -- Cost for double occupancy
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Deluxe Room') AND supplier_id IS NOT NULL LIMIT 1), 2, 2, 'fixed', 380.00, NULL), -- Cost for double occupancy

-- Ticket supplier rates (cost rates)
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand') AND supplier_id = (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Ticket Supplier Monaco' LIMIT 1) LIMIT 1), 1, 1, 'fixed', 280.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'Main Grandstand') AND supplier_id = (SELECT id FROM suppliers WHERE org_id = 300 AND name = 'Elite Ticket Solutions' LIMIT 1) LIMIT 1), 1, 1, 'fixed', 295.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'General Admission') AND supplier_id IS NOT NULL LIMIT 1), 1, 1, 'fixed', 180.00, NULL),
(300, (SELECT id FROM rate_plans WHERE org_id = 300 AND product_variant_id = (SELECT id FROM product_variants WHERE org_id = 300 AND name = 'VIP Hospitality') AND supplier_id IS NOT NULL LIMIT 1), 1, 1, 'fixed', 850.00, NULL);

-- Success message
SELECT 
  'F1 Monaco Grand Prix Scenario Setup Complete!' as status,
  (SELECT COUNT(*) FROM organizations WHERE id = 300) as organizations_created,
  (SELECT COUNT(*) FROM suppliers WHERE org_id = 300) as suppliers_created,
  (SELECT COUNT(*) FROM contracts WHERE org_id = 300) as contracts_created,
  (SELECT COUNT(*) FROM products WHERE org_id = 300) as products_created,
  (SELECT COUNT(*) FROM product_variants WHERE org_id = 300) as variants_created,
  (SELECT COUNT(*) FROM allocation_buckets WHERE org_id = 300) as allocations_created,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NULL) as master_rates_created,
  (SELECT COUNT(*) FROM rate_plans WHERE org_id = 300 AND supplier_id IS NOT NULL) as supplier_rates_created;
