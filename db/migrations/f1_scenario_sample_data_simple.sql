-- Simple F1 scenario sample data with correct column counts
-- This demonstrates the JSONB pricing structure with block allocations

-- Insert F1 Tour Operator organization
INSERT INTO organizations (id, name, settings) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 'F1 Tour Operator test', '{"business_type": "sport_events", "specialization": "f1_motogp", "currency": "EUR", "timezone": "Europe/Monaco", "commission_structure": "supplier_based"}')
ON CONFLICT (id) DO NOTHING;

-- Insert suppliers
INSERT INTO suppliers (id, org_id, name, terms, channels, status) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'Fairmont Palm Dubai', '{"type": "hotel"}', ARRAY['direct', 'agent'], 'active'),
(301, 300, 'F1 Official Tickets', '{"type": "ticket_supplier"}', ARRAY['direct', 'agent'], 'active'),
(302, 300, 'Monaco Circuit Transfers', '{"type": "transfer_supplier"}', ARRAY['direct'], 'active'),
(303, 300, 'Dubai Airport Transfers', '{"type": "transfer_supplier"}', ARRAY['direct'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert product types
INSERT INTO product_types (id, org_id, name, description) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'accommodation', 'Hotel accommodations'),
(301, 300, 'event_ticket', 'F1 and MotoGP event tickets'),
(302, 300, 'transfer', 'Airport and circuit transfers')
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, org_id, name, type, status, product_type_id) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 'Fairmont Palm Dubai', 'accommodation', 'active', 300),
(301, 300, 'F1 Monaco Grand Prix 2025', 'event_ticket', 'active', 301),
(302, 300, 'Circuit Transfer', 'transfer', 'active', 302),
(303, 300, 'Airport Transfer', 'transfer', 'active', 302)
ON CONFLICT (id) DO NOTHING;

-- Insert product variants
INSERT INTO product_variants (id, org_id, product_id, name, subtype, status) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 300, 'Standard Room', 'standard', 'active'),
(301, 300, 300, 'Deluxe Room', 'deluxe', 'active'),
(302, 300, 301, 'Grandstand Ticket', 'grandstand', 'active'),
(303, 300, 302, 'Circuit Transfer Per Seat', 'per_seat', 'active'),
(304, 300, 303, 'Airport Transfer Per Vehicle', 'per_vehicle', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert contracts
INSERT INTO contracts (id, org_id, supplier_id, reference, contract_type, status, valid_from, valid_to, currency, commission_rate, terms_and_conditions) 
OVERRIDING SYSTEM VALUE VALUES 
(300, 300, 300, 'HOT-2025-001', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 10.0, '4-night minimum stay block allocation'),
(301, 300, 301, 'TKT-2025-001', 'net_rate', 'active', '2025-01-01', '2025-12-31', 'GBP', 5.0, 'Official F1 ticket supplier'),
(302, 300, 302, 'TRF-2025-001', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 15.0, 'Free sell circuit transfers'),
(303, 300, 303, 'TRF-2025-002', 'allocation', 'active', '2025-01-01', '2025-12-31', 'GBP', 15.0, 'Free sell airport transfers')
ON CONFLICT (id) DO NOTHING;

-- Insert rate plans with simplified JSONB pricing
INSERT INTO rate_plans (id, org_id, product_variant_id, supplier_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, priority, contract_id, rate_type, rate_source) 
OVERRIDING SYSTEM VALUE VALUES 

-- Hotel Supplier Rate (Standard Room)
(300, 300, 300, 300, 'committed', 'GBP', ARRAY['direct', 'agent'], ARRAY['b2b'], false, '2025-12-01', '2025-12-31', 
'{"occupancy": {"1": {"standard": {"block_rate": 950.00, "extra_night_rate_before": 1100.00, "extra_night_rate_after": 1100.00}}, "2": {"standard": {"block_rate": 1000.00, "extra_night_rate_before": 1200.00, "extra_night_rate_after": 1200.00}}}}', 
100, 300, 'supplier_rate', null),

-- Hotel Master Rate (Selling Price)
(301, 300, 300, null, 'committed', 'GBP', ARRAY['direct', 'agent'], ARRAY['b2c'], true, '2025-12-01', '2025-12-31', 
'{"occupancy": {"1": {"standard": {"block_rate": 1200.00, "extra_night_rate_before": 1400.00, "extra_night_rate_after": 1400.00}}, "2": {"standard": {"block_rate": 1300.00, "extra_night_rate_before": 1500.00, "extra_night_rate_after": 1500.00}}}}', 
100, null, 'master_rate', 'internal'),

-- Ticket Supplier Rate
(302, 300, 302, 301, 'committed', 'GBP', ARRAY['direct', 'agent'], ARRAY['b2b'], false, '2025-12-01', '2025-12-31', 
'{"suppliers": {"official": {"rate": 800.00, "availability": "committed", "priority": 100}}, "provisional": {"enabled": true, "estimated_rate": 800.00}}', 
100, 301, 'supplier_rate', null),

-- Circuit Transfer Rate (Free Sell)
(303, 300, 303, 302, 'freesale', 'GBP', ARRAY['direct'], ARRAY['b2b'], false, '2025-12-01', '2025-12-31', 
'{"pricing_model": "freesale", "unit_types": {"per_seat": {"estimated_rate": 25.00, "margin": 0.30}}}', 
100, 302, 'supplier_rate', null),

-- Airport Transfer Rate (Free Sell)
(304, 300, 304, 303, 'freesale', 'GBP', ARRAY['direct'], ARRAY['b2b'], false, '2025-12-01', '2025-12-31', 
'{"pricing_model": "freesale", "transfer_types": {"inbound": {"per_vehicle": {"estimated_rate": 150.00, "capacity": 8}}}}', 
100, 303, 'supplier_rate', null)
ON CONFLICT (id) DO NOTHING;

-- Insert block allocations
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, contract_id, date, allocation_type, quantity, booked, held, base_cost, currency, block_type, block_start_date, block_end_date, min_stay, max_stay) 
OVERRIDING SYSTEM VALUE VALUES 

-- Hotel block allocation (Dec 4-7)
(300, 300, 300, 300, 300, '2025-12-04', 'committed', 70, 0, 0, 1000.00, 'GBP', 'block', '2025-12-04', '2025-12-07', 4, 4),
(301, 300, 301, 300, 300, '2025-12-04', 'committed', 30, 0, 0, 1300.00, 'GBP', 'block', '2025-12-04', '2025-12-07', 4, 4),

-- Extra night allocations (before and after block)
(302, 300, 300, 300, 300, '2025-12-02', 'committed', 20, 0, 0, 1200.00, 'GBP', 'extra_before', '2025-12-02', '2025-12-03', 1, 3),
(303, 300, 300, 300, 300, '2025-12-08', 'committed', 20, 0, 0, 1200.00, 'GBP', 'extra_after', '2025-12-08', '2025-12-09', 1, 3),

-- Ticket allocations
(304, 300, 302, 301, 301, '2025-12-07', 'committed', 100, 0, 0, 800.00, 'GBP', 'block', '2025-12-07', '2025-12-07', 1, 1),

-- Transfer allocations (free sell - no quantity limits)
(305, 300, 303, 302, 302, '2025-12-07', 'freesale', NULL, 0, 0, 25.00, 'GBP', 'block', '2025-12-07', '2025-12-07', 1, 1),
(306, 300, 304, 303, 303, '2025-12-04', 'freesale', NULL, 0, 0, 150.00, 'GBP', 'block', '2025-12-04', '2025-12-04', 1, 1),
(307, 300, 304, 303, 303, '2025-12-08', 'freesale', NULL, 0, 0, 150.00, 'GBP', 'block', '2025-12-08', '2025-12-08', 1, 1)
ON CONFLICT (id) DO NOTHING;
