-- Monaco Grand Prix 2026 Scenario
-- Real data from CSV files for June 5-7, 2026

-- Clean up any existing Monaco data for org_id 200
DELETE FROM allocation_buckets WHERE org_id = 200;
DELETE FROM rate_occupancies WHERE org_id = 200;
DELETE FROM rate_seasons WHERE org_id = 200;
DELETE FROM rate_plans WHERE org_id = 200;
DELETE FROM package_components WHERE org_id = 200;
DELETE FROM packages WHERE org_id = 200;
DELETE FROM product_variants WHERE org_id = 200;
DELETE FROM products WHERE org_id = 200;
DELETE FROM contract_versions WHERE org_id = 200;
DELETE FROM contracts WHERE org_id = 200;
DELETE FROM suppliers WHERE org_id = 200;

-- Insert Monaco Grand Prix organization
INSERT INTO organizations (id, name, settings, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(200, 'Monaco Grand Prix Tours', '{"currency": "GBP", "timezone": "Europe/Monaco"}', now(), now());

-- Suppliers for Monaco scenario
INSERT INTO suppliers (id, org_id, name, terms, channels, status, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(200, 200, 'ACM (Automobile Club de Monaco)', '{"commission": "10%", "payment_terms": "14 days"}', ARRAY['b2b'], 'active', now(), now()),
(201, 200, 'XS2 Tickets', '{"commission": "12%", "payment_terms": "21 days"}', ARRAY['b2b'], 'active', now(), now()),
(202, 200, 'Fairmont Monte Carlo', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(203, 200, 'Hotel Villa Otero', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(204, 200, 'Hotel du Pin Nice Port', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(205, 200, 'SoCo Hotel by HappyCulture', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(206, 200, 'Hotel Excelsior Nice', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(207, 200, 'The Jay Nice Hotel', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(208, 200, 'Monaco Airport Transfers', '{"commission": "20%", "payment_terms": "7 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(209, 200, 'Circuit Transfers Monaco', '{"commission": "25%", "payment_terms": "7 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now());

-- Product Types
INSERT INTO product_types (id, org_id, name, description, icon, color, is_default, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(200, 200, 'Accommodation', 'Hotels, B&Bs, Apartments', 'bed', 'blue', true, now(), now()),
(201, 200, 'Event', 'Concerts, Festivals, Sports', 'calendar', 'red', true, now(), now()),
(202, 200, 'Transfer', 'Airport, Inter-city, Local', 'car', 'green', true, now(), now());

-- Contracts for Monaco scenario
INSERT INTO contracts (id, org_id, supplier_id, reference, status, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(200, 200, 200, 'CONTRACT-MONACO-2026-001', 'active', now(), now()),
(201, 200, 201, 'CONTRACT-MONACO-2026-002', 'active', now(), now()),
(202, 200, 202, 'CONTRACT-MONACO-2026-003', 'active', now(), now()),
(203, 200, 203, 'CONTRACT-MONACO-2026-004', 'active', now(), now()),
(204, 200, 204, 'CONTRACT-MONACO-2026-005', 'active', now(), now()),
(205, 200, 205, 'CONTRACT-MONACO-2026-006', 'active', now(), now()),
(206, 200, 206, 'CONTRACT-MONACO-2026-007', 'active', now(), now()),
(207, 200, 207, 'CONTRACT-MONACO-2026-008', 'active', now(), now()),
(208, 200, 208, 'CONTRACT-MONACO-2026-009', 'active', now(), now()),
(209, 200, 209, 'CONTRACT-MONACO-2026-010', 'active', now(), now());

-- Contract versions
INSERT INTO contract_versions (id, org_id, contract_id, valid_from, valid_to, terms, payment_policy, cancellation_policy, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(200, 200, 200, '2026-06-05', '2026-06-07', '{"commission": "10%", "allocation": "200 tickets", "validity": "3 days"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "7 days", "late_cancellation": "48 hours"}', now(), now()),
(201, 200, 201, '2026-06-05', '2026-06-07', '{"commission": "12%", "allocation": "100 tickets", "validity": "3 days"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "7 days", "late_cancellation": "48 hours"}', now(), now()),
(202, 200, 202, '2026-06-04', '2026-06-08', '{"commission": "15%", "allocation": "4 rooms", "room_types": ["sea_view", "garden_view"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(203, 200, 203, '2026-06-04', '2026-06-09', '{"commission": "15%", "allocation": "10 rooms", "room_types": ["superior", "classic"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(204, 200, 204, '2026-06-05', '2026-06-08', '{"commission": "15%", "allocation": "22 rooms", "room_types": ["family", "standard"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(205, 200, 205, '2026-06-05', '2026-06-08', '{"commission": "15%", "allocation": "10 rooms", "room_types": ["standard"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(206, 200, 206, '2026-06-04', '2026-06-09', '{"commission": "15%", "allocation": "10 rooms", "room_types": ["standard_double"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(207, 200, 207, '2026-06-05', '2026-06-08', '{"commission": "15%", "allocation": "10 rooms", "room_types": ["standard"]}', '{"balance": "30 days before arrival", "deposit": "50% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "48 hours", "late_cancellation": "24 hours"}', now(), now()),
(208, 200, 208, '2026-06-05', '2026-06-07', '{"commission": "20%", "allocation": "unlimited", "capacity": "1-4 people"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "2 hours", "late_cancellation": "1 hour"}', now(), now()),
(209, 200, 209, '2026-06-06', '2026-06-07', '{"commission": "25%", "allocation": "unlimited", "capacity": "1-4 people"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"no_show": "100% charge", "free_cancellation": "2 hours", "late_cancellation": "1 hour"}', now(), now());

-- Products for Monaco scenario
INSERT INTO products (id, org_id, name, type, status, product_type_id, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(200, 200, 'Monaco Grand Prix 2026 Tickets', 'event', 'active', 201, now(), now()),
(201, 200, 'Fairmont Monte Carlo', 'accommodation', 'active', 200, now(), now()),
(202, 200, 'Hotel Villa Otero', 'accommodation', 'active', 200, now(), now()),
(203, 200, 'Hotel du Pin Nice Port', 'accommodation', 'active', 200, now(), now()),
(204, 200, 'SoCo Hotel by HappyCulture', 'accommodation', 'active', 200, now(), now()),
(205, 200, 'Hotel Excelsior Nice', 'accommodation', 'active', 200, now(), now()),
(206, 200, 'The Jay Nice Hotel', 'accommodation', 'active', 200, now(), now()),
(207, 200, 'Monaco Airport Transfers', 'transfer', 'active', 202, now(), now()),
(208, 200, 'Circuit Transfers Monaco', 'transfer', 'active', 202, now(), now());

-- Product variants for Monaco scenario
INSERT INTO product_variants (id, org_id, product_id, name, subtype, attributes, status, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
-- Monaco Grand Prix Tickets
(200, 200, 200, 'Grandstand N - Swimming Pool', 'tickets', '{"view": "Swimming Pool", "validity": "Sat & Sun", "grandstand": "N"}', 'active', now(), now()),
(201, 200, 200, 'Grandstand K - Bureau de Tabac', 'tickets', '{"view": "Bureau de Tabac", "validity": "Sat & Sun", "grandstand": "K"}', 'active', now(), now()),
(202, 200, 200, 'Grandstand P - Swimming Pool', 'tickets', '{"view": "Swimming Pool", "validity": "Sat & Sun", "grandstand": "P"}', 'active', now(), now()),

-- Fairmont Monte Carlo
(203, 200, 201, 'Sea View Room', 'room', '{"view": "sea", "amenities": ["sea_view", "balcony", "wifi"], "room_types": ["double"]}', 'active', now(), now()),
(204, 200, 201, 'Garden View Room', 'room', '{"view": "garden", "amenities": ["garden_view", "balcony", "wifi"], "room_types": ["double"]}', 'active', now(), now()),

-- Hotel Villa Otero
(205, 200, 202, 'Superior Room Twin', 'room', '{"bed_type": "twin", "amenities": ["wifi", "breakfast"], "room_types": ["twin"]}', 'active', now(), now()),
(206, 200, 202, 'Superior Room Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),
(207, 200, 202, 'Classic Room Twin', 'room', '{"bed_type": "twin", "amenities": ["wifi", "breakfast"], "room_types": ["twin"]}', 'active', now(), now()),
(208, 200, 202, 'Classic Room Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),

-- Hotel du Pin Nice Port
(209, 200, 203, 'Family Room Triple', 'room', '{"bed_type": "triple", "amenities": ["wifi", "breakfast"], "room_types": ["triple"]}', 'active', now(), now()),
(210, 200, 203, 'Standard Double Room Twin', 'room', '{"bed_type": "twin", "amenities": ["wifi", "breakfast"], "room_types": ["twin"]}', 'active', now(), now()),
(211, 200, 203, 'Standard Double Room Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),

-- SoCo Hotel by HappyCulture
(212, 200, 204, 'Standard Room Twin', 'room', '{"bed_type": "twin", "amenities": ["wifi", "breakfast"], "room_types": ["twin"]}', 'active', now(), now()),
(213, 200, 204, 'Standard Room Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),

-- Hotel Excelsior Nice
(214, 200, 205, 'Standard Double Room Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),

-- The Jay Nice Hotel
(215, 200, 206, 'Standard Twin', 'room', '{"bed_type": "twin", "amenities": ["wifi", "breakfast"], "room_types": ["twin"]}', 'active', now(), now()),
(216, 200, 206, 'Standard Double', 'room', '{"bed_type": "double", "amenities": ["wifi", "breakfast"], "room_types": ["double"]}', 'active', now(), now()),

-- Transfers
(217, 200, 207, 'Airport Transfer Inbound', 'sedan', '{"route": "Nice Airport to Monaco", "capacity": "1-4 people", "duration": "45 minutes"}', 'active', now(), now()),
(218, 200, 207, 'Airport Transfer Outbound', 'sedan', '{"route": "Monaco to Nice Airport", "capacity": "1-4 people", "duration": "45 minutes"}', 'active', now(), now()),
(219, 200, 208, 'Circuit Transfer', 'sedan', '{"route": "Hotel to Circuit de Monaco", "capacity": "1-4 people", "duration": "15 minutes"}', 'active', now(), now());

-- Rate plans for Monaco scenario
INSERT INTO rate_plans (id, org_id, product_variant_id, supplier_id, contract_version_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
-- Monaco Grand Prix Tickets (ACM)
(200, 200, 200, 200, 200, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b'], true, '2026-06-05', '2026-06-07', '{"base_rate": 1194.26, "supplier_reference": "214"}', now(), now()),
(201, 200, 201, 200, 200, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b'], true, '2026-06-05', '2026-06-07', '{"base_rate": 1634.26, "supplier_reference": "214"}', now(), now()),
(202, 200, 202, 200, 200, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b'], true, '2026-06-05', '2026-06-07', '{"base_rate": 1194.26, "supplier_reference": "214"}', now(), now()),

-- Monaco Grand Prix Tickets (XS2)
(203, 200, 200, 201, 201, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b'], false, '2026-06-05', '2026-06-07', '{"base_rate": 1399.39, "supplier_reference": "XZBZTN-25317046"}', now(), now()),

-- Fairmont Monte Carlo
(204, 200, 203, 202, 202, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-04', '2026-06-08', '{"base_rate": 20706, "extra_night": 4732.8}', now(), now()),
(205, 200, 204, 202, 202, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-04', '2026-06-08', '{"base_rate": 13721.96, "extra_night": 3136.45}', now(), now()),

-- Hotel Villa Otero
(206, 200, 205, 203, 203, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1763.98, "extra_night": 470.4}', now(), now()),
(207, 200, 206, 203, 203, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-04', '2026-06-09', '{"base_rate": 2939.97, "extra_night": 470.4}', now(), now()),
(208, 200, 207, 203, 203, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1663.42, "extra_night": 443.58}', now(), now()),
(209, 200, 208, 203, 203, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1663.42, "extra_night": 443.58}', now(), now()),

-- Hotel du Pin Nice Port
(210, 200, 209, 204, 204, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1322.74, "extra_night": 352.73}', now(), now()),
(211, 200, 210, 204, 204, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1147.78, "extra_night": 306.07}', now(), now()),
(212, 200, 211, 204, 204, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1150.4, "extra_night": 306.78}', now(), now()),

-- SoCo Hotel by HappyCulture
(213, 200, 212, 205, 205, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1401.94, "extra_night": 373.85}', now(), now()),
(214, 200, 213, 205, 205, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 1401.94, "extra_night": 373.85}', now(), now()),

-- Hotel Excelsior Nice
(215, 200, 214, 206, 206, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-04', '2026-06-09', '{"base_rate": 2981.89, "extra_night": 477.11}', now(), now()),

-- The Jay Nice Hotel
(216, 200, 215, 207, 207, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 2124.37, "extra_night": 566.5}', now(), now()),
(217, 200, 216, 207, 207, 'committed', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-08', '{"base_rate": 2124.37, "extra_night": 566.5}', now(), now()),

-- Transfers
(218, 200, 217, 208, 208, 'freesale', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-07', '{"base_rate": 86.80}', now(), now()),
(219, 200, 218, 208, 208, 'freesale', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-05', '2026-06-07', '{"base_rate": 86.80}', now(), now()),
(220, 200, 219, 209, 209, 'freesale', 'GBP', ARRAY['UK', 'EU'], ARRAY['b2b', 'b2c'], true, '2026-06-06', '2026-06-07', '{"base_rate": 40, "per_person": true}', now(), now());

-- Rate occupancies for Monaco scenario
INSERT INTO rate_occupancies (id, org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
-- Hotel rooms (1-2 people)
(200, 200, 204, 1, 2, 'fixed', 20706.00, null, now(), now()),
(201, 200, 205, 1, 2, 'fixed', 13721.96, null, now(), now()),
(202, 200, 206, 1, 2, 'fixed', 1763.98, null, now(), now()),
(203, 200, 207, 1, 2, 'fixed', 2939.97, null, now(), now()),
(204, 200, 208, 1, 2, 'fixed', 1663.42, null, now(), now()),
(205, 200, 209, 1, 2, 'fixed', 1663.42, null, now(), now()),
(206, 200, 210, 1, 2, 'fixed', 1322.74, null, now(), now()),
(207, 200, 211, 1, 2, 'fixed', 1147.78, null, now(), now()),
(208, 200, 212, 1, 2, 'fixed', 1401.94, null, now(), now()),
(209, 200, 213, 1, 2, 'fixed', 1401.94, null, now(), now()),
(210, 200, 215, 1, 2, 'fixed', 2981.89, null, now(), now()),
(211, 200, 216, 1, 2, 'fixed', 2124.37, null, now(), now()),
(212, 200, 217, 1, 2, 'fixed', 2124.37, null, now(), now()),

-- Family room (3 people)
(213, 200, 210, 3, 3, 'fixed', 1322.74, null, now(), now()),

-- Transfers (per person)
(214, 200, 220, 1, 4, 'per_person', 40.00, null, now(), now());

-- Rate seasons for Monaco scenario
INSERT INTO rate_seasons (id, org_id, rate_plan_id, season_from, season_to, dow_mask, min_stay, max_stay, min_pax, max_pax, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
-- Monaco Grand Prix weekend
(200, 200, 200, '2026-06-05', '2026-06-07', 127, 1, 3, 1, 4, now(), now()),
(201, 200, 201, '2026-06-05', '2026-06-07', 127, 1, 3, 1, 4, now(), now()),
(202, 200, 202, '2026-06-05', '2026-06-07', 127, 1, 3, 1, 4, now(), now()),
(203, 200, 203, '2026-06-05', '2026-06-07', 127, 1, 3, 1, 4, now(), now()),

-- Hotel stays
(204, 200, 204, '2026-06-04', '2026-06-08', 127, 3, 5, 1, 4, now(), now()),
(205, 200, 205, '2026-06-04', '2026-06-08', 127, 3, 5, 1, 4, now(), now()),
(206, 200, 206, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(207, 200, 207, '2026-06-04', '2026-06-09', 127, 4, 5, 1, 4, now(), now()),
(208, 200, 208, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(209, 200, 209, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(210, 200, 210, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(211, 200, 211, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(212, 200, 212, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(213, 200, 213, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(214, 200, 215, '2026-06-04', '2026-06-09', 127, 4, 5, 1, 4, now(), now()),
(215, 200, 216, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),
(216, 200, 217, '2026-06-05', '2026-06-08', 127, 3, 4, 1, 4, now(), now()),

-- Transfers
(217, 200, 218, '2026-06-05', '2026-06-07', 127, 1, 1, 1, 4, now(), now()),
(218, 200, 219, '2026-06-05', '2026-06-07', 127, 1, 1, 1, 4, now(), now()),
(219, 200, 220, '2026-06-06', '2026-06-07', 127, 1, 1, 1, 4, now(), now());

-- Allocation buckets for Monaco scenario
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, event_start_date, event_end_date, allocation_type, quantity, booked, held, stop_sell, blackout, allow_overbooking, overbooking_limit, notes, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
-- Monaco Grand Prix Tickets (ACM) - Event-based allocation
(200, 200, 200, 200, '2026-06-06', '2026-06-08', 'committed', 30, 0, 0, false, false, false, null, 'Grandstand N - Swimming Pool tickets', now(), now()),
(201, 200, 201, 200, '2026-06-06', '2026-06-08', 'committed', 70, 0, 0, false, false, false, null, 'Grandstand K - Bureau de Tabac tickets', now(), now()),
(202, 200, 202, 200, '2026-06-06', '2026-06-08', 'committed', 36, 0, 0, false, false, false, null, 'Grandstand P - Swimming Pool tickets', now(), now()),

-- Monaco Grand Prix Tickets (XS2) - Event-based allocation
(203, 200, 200, 201, '2026-06-06', '2026-06-08', 'committed', 30, 0, 0, false, false, false, null, 'Grandstand N - Swimming Pool tickets (XS2)', now(), now());

-- Fairmont Monte Carlo (Daily allocations)
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, stop_sell, blackout, allow_overbooking, overbooking_limit, notes, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(204, 200, 203, 202, '2026-06-04', 'committed', 2, 0, 0, false, false, false, null, 'Sea View Room allocation', now(), now()),
(205, 200, 203, 202, '2026-06-05', 'committed', 2, 0, 0, false, false, false, null, 'Sea View Room allocation', now(), now()),
(206, 200, 203, 202, '2026-06-06', 'committed', 2, 0, 0, false, false, false, null, 'Sea View Room allocation', now(), now()),
(207, 200, 203, 202, '2026-06-07', 'committed', 2, 0, 0, false, false, false, null, 'Sea View Room allocation', now(), now()),
(208, 200, 203, 202, '2026-06-08', 'committed', 2, 0, 0, false, false, false, null, 'Sea View Room allocation', now(), now()),
(209, 200, 204, 202, '2026-06-04', 'committed', 2, 0, 0, false, false, false, null, 'Garden View Room allocation', now(), now()),
(210, 200, 204, 202, '2026-06-05', 'committed', 2, 0, 0, false, false, false, null, 'Garden View Room allocation', now(), now()),
(211, 200, 204, 202, '2026-06-06', 'committed', 2, 0, 0, false, false, false, null, 'Garden View Room allocation', now(), now()),
(212, 200, 204, 202, '2026-06-07', 'committed', 2, 0, 0, false, false, false, null, 'Garden View Room allocation', now(), now()),
(213, 200, 204, 202, '2026-06-08', 'committed', 2, 0, 0, false, false, false, null, 'Garden View Room allocation', now(), now()),

-- Hotel Villa Otero
(214, 200, 205, 203, '2026-06-05', 'committed', 2, 0, 0, false, false, false, null, 'Superior Room Twin allocation', now(), now()),
(215, 200, 205, 203, '2026-06-06', 'committed', 2, 0, 0, false, false, false, null, 'Superior Room Twin allocation', now(), now()),
(216, 200, 205, 203, '2026-06-07', 'committed', 2, 0, 0, false, false, false, null, 'Superior Room Twin allocation', now(), now()),
(217, 200, 205, 203, '2026-06-08', 'committed', 2, 0, 0, false, false, false, null, 'Superior Room Twin allocation', now(), now()),
(218, 200, 206, 203, '2026-06-04', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(219, 200, 206, 203, '2026-06-05', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(220, 200, 206, 203, '2026-06-06', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(221, 200, 206, 203, '2026-06-07', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(222, 200, 206, 203, '2026-06-08', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(223, 200, 206, 203, '2026-06-09', 'committed', 1, 0, 0, false, false, false, null, 'Superior Room Double allocation', now(), now()),
(224, 200, 207, 203, '2026-06-05', 'committed', 4, 0, 0, false, false, false, null, 'Classic Room Twin allocation', now(), now()),
(225, 200, 207, 203, '2026-06-06', 'committed', 4, 0, 0, false, false, false, null, 'Classic Room Twin allocation', now(), now()),
(226, 200, 207, 203, '2026-06-07', 'committed', 4, 0, 0, false, false, false, null, 'Classic Room Twin allocation', now(), now()),
(227, 200, 207, 203, '2026-06-08', 'committed', 4, 0, 0, false, false, false, null, 'Classic Room Twin allocation', now(), now()),
(228, 200, 208, 203, '2026-06-05', 'committed', 3, 0, 0, false, false, false, null, 'Classic Room Double allocation', now(), now()),
(229, 200, 208, 203, '2026-06-06', 'committed', 3, 0, 0, false, false, false, null, 'Classic Room Double allocation', now(), now()),
(230, 200, 208, 203, '2026-06-07', 'committed', 3, 0, 0, false, false, false, null, 'Classic Room Double allocation', now(), now()),
(231, 200, 208, 203, '2026-06-08', 'committed', 3, 0, 0, false, false, false, null, 'Classic Room Double allocation', now(), now()),

-- Hotel du Pin Nice Port
(232, 200, 209, 204, '2026-06-05', 'committed', 3, 0, 0, false, false, false, null, 'Family Room Triple allocation', now(), now()),
(233, 200, 209, 204, '2026-06-06', 'committed', 3, 0, 0, false, false, false, null, 'Family Room Triple allocation', now(), now()),
(234, 200, 209, 204, '2026-06-07', 'committed', 3, 0, 0, false, false, false, null, 'Family Room Triple allocation', now(), now()),
(235, 200, 209, 204, '2026-06-08', 'committed', 3, 0, 0, false, false, false, null, 'Family Room Triple allocation', now(), now()),
(236, 200, 210, 204, '2026-06-05', 'committed', 6, 0, 0, false, false, false, null, 'Standard Double Room Twin allocation', now(), now()),
(237, 200, 210, 204, '2026-06-06', 'committed', 6, 0, 0, false, false, false, null, 'Standard Double Room Twin allocation', now(), now()),
(238, 200, 210, 204, '2026-06-07', 'committed', 6, 0, 0, false, false, false, null, 'Standard Double Room Twin allocation', now(), now()),
(239, 200, 210, 204, '2026-06-08', 'committed', 6, 0, 0, false, false, false, null, 'Standard Double Room Twin allocation', now(), now()),
(240, 200, 211, 204, '2026-06-05', 'committed', 16, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(241, 200, 211, 204, '2026-06-06', 'committed', 16, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(242, 200, 211, 204, '2026-06-07', 'committed', 16, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(243, 200, 211, 204, '2026-06-08', 'committed', 16, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),

-- SoCo Hotel by HappyCulture
(244, 200, 212, 205, '2026-06-05', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Twin allocation', now(), now()),
(245, 200, 212, 205, '2026-06-06', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Twin allocation', now(), now()),
(246, 200, 212, 205, '2026-06-07', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Twin allocation', now(), now()),
(247, 200, 212, 205, '2026-06-08', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Twin allocation', now(), now()),
(248, 200, 213, 205, '2026-06-05', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Double allocation', now(), now()),
(249, 200, 213, 205, '2026-06-06', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Double allocation', now(), now()),
(250, 200, 213, 205, '2026-06-07', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Double allocation', now(), now()),
(251, 200, 213, 205, '2026-06-08', 'committed', 5, 0, 0, false, false, false, null, 'Standard Room Double allocation', now(), now()),

-- Hotel Excelsior Nice
(252, 200, 214, 206, '2026-06-04', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(253, 200, 214, 206, '2026-06-05', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(254, 200, 214, 206, '2026-06-06', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(255, 200, 214, 206, '2026-06-07', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(256, 200, 214, 206, '2026-06-08', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),
(257, 200, 214, 206, '2026-06-09', 'committed', 10, 0, 0, false, false, false, null, 'Standard Double Room Double allocation', now(), now()),

-- The Jay Nice Hotel
(258, 200, 215, 207, '2026-06-05', 'committed', 5, 0, 0, false, false, false, null, 'Standard Twin allocation', now(), now()),
(259, 200, 215, 207, '2026-06-06', 'committed', 5, 0, 0, false, false, false, null, 'Standard Twin allocation', now(), now()),
(260, 200, 215, 207, '2026-06-07', 'committed', 5, 0, 0, false, false, false, null, 'Standard Twin allocation', now(), now()),
(261, 200, 215, 207, '2026-06-08', 'committed', 5, 0, 0, false, false, false, null, 'Standard Twin allocation', now(), now()),
(262, 200, 216, 207, '2026-06-05', 'committed', 5, 0, 0, false, false, false, null, 'Standard Double allocation', now(), now()),
(263, 200, 216, 207, '2026-06-06', 'committed', 5, 0, 0, false, false, false, null, 'Standard Double allocation', now(), now()),
(264, 200, 216, 207, '2026-06-07', 'committed', 5, 0, 0, false, false, false, null, 'Standard Double allocation', now(), now()),
(265, 200, 216, 207, '2026-06-08', 'committed', 5, 0, 0, false, false, false, null, 'Standard Double allocation', now(), now()),

-- Transfers (freesale - unlimited capacity)
(266, 200, 217, 208, '2026-06-05', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Inbound - unlimited capacity', now(), now()),
(267, 200, 217, 208, '2026-06-06', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Inbound - unlimited capacity', now(), now()),
(268, 200, 217, 208, '2026-06-07', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Inbound - unlimited capacity', now(), now()),
(269, 200, 218, 208, '2026-06-05', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Outbound - unlimited capacity', now(), now()),
(270, 200, 218, 208, '2026-06-06', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Outbound - unlimited capacity', now(), now()),
(271, 200, 218, 208, '2026-06-07', 'freesale', null, 0, 0, false, false, true, 100, 'Airport Transfer Outbound - unlimited capacity', now(), now()),
(272, 200, 219, 209, '2026-06-06', 'freesale', null, 0, 0, false, false, true, 100, 'Circuit Transfer - unlimited capacity', now(), now()),
(273, 200, 219, 209, '2026-06-07', 'freesale', null, 0, 0, false, false, true, 100, 'Circuit Transfer - unlimited capacity', now(), now());

-- Monaco Grand Prix Packages
INSERT INTO packages (id, org_id, name, description, pricing_mode, status, created_at, updated_at) OVERRIDING SYSTEM VALUE VALUES
(200, 200, 'Monaco Grand Prix VIP Experience', 'Luxury package with Fairmont Monte Carlo and premium tickets', 'fixed', 'active', now(), now()),
(201, 200, 'Monaco Grand Prix Standard Package', 'Standard package with Nice hotels and grandstand tickets', 'fixed', 'active', now(), now()),
(202, 200, 'Monaco Grand Prix Budget Package', 'Budget package with Paris hotel and general admission', 'fixed', 'active', now(), now());

-- Package components
INSERT INTO package_components (id, org_id, package_id, product_variant_id, sequence, quantity, pricing_overrides, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
-- VIP Experience Package
(200, 200, 200, 203, 1, 1, '{}', now(), now()), -- Fairmont Sea View Room
(201, 200, 200, 200, 2, 1, '{}', now(), now()), -- Grandstand N tickets
(202, 200, 200, 217, 3, 1, '{}', now(), now()), -- Airport Transfer Inbound
(203, 200, 200, 218, 4, 1, '{}', now(), now()), -- Airport Transfer Outbound
(204, 200, 200, 219, 5, 2, '{}', now(), now()), -- Circuit Transfer (2 days)

-- Standard Package
(205, 200, 201, 205, 1, 1, '{}', now(), now()), -- Hotel Villa Otero Superior Twin
(206, 200, 201, 201, 2, 1, '{}', now(), now()), -- Grandstand K tickets
(207, 200, 201, 217, 3, 1, '{}', now(), now()), -- Airport Transfer Inbound
(208, 200, 201, 218, 4, 1, '{}', now(), now()), -- Airport Transfer Outbound
(209, 200, 201, 219, 5, 2, '{}', now(), now()), -- Circuit Transfer (2 days)

-- Budget Package
(210, 200, 202, 212, 1, 1, '{}', now(), now()), -- SoCo Hotel Standard Twin
(211, 200, 202, 202, 2, 1, '{}', now(), now()), -- Grandstand P tickets
(212, 200, 202, 217, 3, 1, '{}', now(), now()), -- Airport Transfer Inbound
(213, 200, 202, 218, 4, 1, '{}', now(), now()), -- Airport Transfer Outbound
(214, 200, 202, 219, 5, 2, '{}', now(), now()); -- Circuit Transfer (2 days)
