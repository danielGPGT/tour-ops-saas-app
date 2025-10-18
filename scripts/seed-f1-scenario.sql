-- F1 Grand Prix Abu Dhabi Scenario Seed Data
-- This script sets up the complete F1 Grand Prix scenario

-- 0. Clean up existing data (in reverse order of dependencies)
DELETE FROM package_components WHERE org_id = 100;
DELETE FROM packages WHERE org_id = 100;
DELETE FROM allocation_buckets WHERE org_id = 100;
DELETE FROM rate_occupancies WHERE org_id = 100;
DELETE FROM rate_seasons WHERE org_id = 100;
DELETE FROM rate_plans WHERE org_id = 100;
DELETE FROM contract_versions WHERE org_id = 100;
DELETE FROM contracts WHERE org_id = 100;
DELETE FROM product_variants WHERE org_id = 100;
DELETE FROM products WHERE org_id = 100;
DELETE FROM product_types WHERE org_id = 100;
DELETE FROM suppliers WHERE org_id = 100;
DELETE FROM organizations WHERE id = 100;

-- 1. Organization
INSERT INTO organizations (id, name, settings, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 'F1 Tour Operator', '{"currency": "GBP", "timezone": "Europe/London"}', now(), now());

-- 2. Suppliers
INSERT INTO suppliers (id, org_id, name, terms, channels, status, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 'Fairmont Palm Dubai', '{"commission": "15%", "payment_terms": "30 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(101, 100, 'F1 Official Tickets', '{"commission": "10%", "payment_terms": "14 days"}', ARRAY['b2b'], 'active', now(), now()),
(102, 100, 'Abu Dhabi Circuit', '{"commission": "12%", "payment_terms": "21 days"}', ARRAY['b2b'], 'active', now(), now()),
(103, 100, 'Dubai Airport Transfers', '{"commission": "20%", "payment_terms": "7 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(104, 100, 'Circuit Transfers', '{"commission": "25%", "payment_terms": "7 days"}', ARRAY['b2b', 'b2c'], 'active', now(), now()),
(105, 100, 'F1 Ticket Reseller', '{"commission": "8%", "payment_terms": "21 days"}', ARRAY['b2b'], 'active', now(), now());

-- 3. Product Types
INSERT INTO product_types (id, org_id, name, description, icon, color, is_default, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 'Accommodation', 'Hotels, B&Bs, Apartments', 'bed', 'blue', true, now(), now()),
(101, 100, 'Event', 'Concerts, Festivals, Sports', 'calendar', 'red', true, now(), now()),
(102, 100, 'Transfer', 'Airport, Inter-city, Local', 'car', 'green', true, now(), now());

-- 4. Products
INSERT INTO products (id, org_id, name, type, status, product_type_id, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 'Fairmont Palm Dubai', 'accommodation', 'active', 100, now(), now()),
(101, 100, 'Abu Dhabi F1 Grand Prix Tickets', 'event', 'active', 101, now(), now()),
(102, 100, 'Airport Transfers', 'transfer', 'active', 102, now(), now()),
(103, 100, 'Circuit Transfers', 'transfer', 'active', 102, now(), now()),
(104, 100, 'F1 Hospitality Packages', 'event', 'active', 101, now(), now()),
(105, 100, 'F1 Paddock Club', 'event', 'active', 101, now(), now()),
(106, 100, 'F1 General Admission', 'event', 'active', 101, now(), now()),
(107, 100, 'Shared Coach Transfers', 'transfer', 'active', 102, now(), now()),
(108, 100, 'Private VIP Transfers', 'transfer', 'active', 102, now(), now()),
(109, 100, 'F1 Weekend Experience', 'package', 'active', 100, now(), now());

-- 5. Product Variants
INSERT INTO product_variants (id, org_id, product_id, name, subtype, attributes, status, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 'Standard Room', 'room', '{"room_types": ["twin", "double"], "min_stay": 4, "amenities": ["sea_view", "balcony", "wifi"]}', 'active', now(), now()),
(101, 100, 100, 'Deluxe Room', 'room', '{"room_types": ["twin", "double"], "min_stay": 4, "amenities": ["sea_view", "balcony", "wifi", "butler_service"]}', 'active', now(), now()),
(102, 100, 100, 'Suite', 'room', '{"room_types": ["king"], "min_stay": 4, "amenities": ["sea_view", "balcony", "wifi", "butler_service", "living_room"]}', 'active', now(), now()),
(103, 100, 101, 'Grandstand Tickets', 'tickets', '{"grandstand": "Main Grandstand", "view": "Start/Finish Line", "validity": "Fri-Sun"}', 'active', now(), now()),
(104, 100, 101, 'Turn 1 Grandstand', 'tickets', '{"grandstand": "Turn 1", "view": "First Corner", "validity": "Fri-Sun"}', 'active', now(), now()),
(105, 100, 101, 'Marina Grandstand', 'tickets', '{"grandstand": "Marina", "view": "Waterfront", "validity": "Fri-Sun"}', 'active', now(), now()),
(106, 100, 104, 'Champions Club', 'hospitality', '{"location": "Champions Club", "includes": ["lunch", "drinks", "paddock_tour"], "validity": "Fri-Sun"}', 'active', now(), now()),
(107, 100, 104, 'Yas Club', 'hospitality', '{"location": "Yas Club", "includes": ["lunch", "drinks", "viewing_deck"], "validity": "Fri-Sun"}', 'active', now(), now()),
(108, 100, 105, 'Paddock Club 3-Day', 'paddock', '{"access": "Paddock", "includes": ["all_meals", "drinks", "garage_tour"], "validity": "Fri-Sun"}', 'active', now(), now()),
(109, 100, 105, 'Paddock Club Sunday', 'paddock', '{"access": "Paddock", "includes": ["race_day_meals", "drinks", "garage_tour"], "validity": "Sun"}', 'active', now(), now()),
(110, 100, 106, 'General Admission 3-Day', 'general', '{"access": "General", "includes": ["track_access"], "validity": "Fri-Sun"}', 'active', now(), now()),
(111, 100, 106, 'General Admission Sunday', 'general', '{"access": "General", "includes": ["track_access"], "validity": "Sun"}', 'active', now(), now()),
(112, 100, 102, 'Airport to Hotel', 'sedan', '{"route": "DXB to Fairmont Palm", "duration": "45 minutes", "capacity": "1-4 people"}', 'active', now(), now()),
(113, 100, 103, 'Hotel to Circuit', 'sedan', '{"route": "Fairmont Palm to Yas Marina", "duration": "30 minutes", "capacity": "1-4 people"}', 'active', now(), now()),
(114, 100, 107, 'Shared Coach Airport', 'coach', '{"route": "DXB to Hotels", "duration": "60 minutes", "capacity": "50 people", "frequency": "every_2_hours"}', 'active', now(), now()),
(115, 100, 107, 'Shared Coach Circuit', 'coach', '{"route": "Hotels to Yas Marina", "duration": "45 minutes", "capacity": "50 people", "frequency": "every_hour"}', 'active', now(), now()),
(116, 100, 108, 'VIP Airport Transfer', 'vip', '{"route": "DXB to Hotels", "duration": "45 minutes", "capacity": "1-6 people", "includes": ["champagne", "wifi", "concierge"]}', 'active', now(), now()),
(117, 100, 108, 'VIP Circuit Transfer', 'vip', '{"route": "Hotels to Yas Marina", "duration": "30 minutes", "capacity": "1-6 people", "includes": ["champagne", "wifi", "concierge"]}', 'active', now(), now()),
(118, 100, 109, 'F1 Weekend Experience', 'package', '{"includes": ["hotel", "tickets", "transfers", "hospitality"], "duration": "4_days", "group_size": "2-6"}', 'active', now(), now());

-- 6. Contracts
INSERT INTO contracts (id, org_id, supplier_id, reference, status, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 'CONTRACT-F1-2024-001', 'active', now(), now()),
(101, 100, 101, 'CONTRACT-F1-2024-002', 'active', now(), now()),
(102, 100, 102, 'CONTRACT-F1-2024-003', 'active', now(), now()),
(103, 100, 103, 'CONTRACT-F1-2024-004', 'active', now(), now()),
(104, 100, 104, 'CONTRACT-F1-2024-005', 'active', now(), now()),
(105, 100, 100, 'CONTRACT-F1-2024-006', 'active', now(), now()),
(106, 100, 100, 'CONTRACT-F1-2024-007', 'active', now(), now()),
(107, 100, 101, 'CONTRACT-F1-2024-008', 'active', now(), now()),
(108, 100, 101, 'CONTRACT-F1-2024-009', 'active', now(), now()),
(109, 100, 101, 'CONTRACT-F1-2024-010', 'active', now(), now()),
(110, 100, 103, 'CONTRACT-F1-2024-011', 'active', now(), now()),
(111, 100, 104, 'CONTRACT-F1-2024-012', 'active', now(), now()),
(112, 100, 105, 'CONTRACT-F1-2024-013', 'active', now(), now());

-- 7. Contract Versions
INSERT INTO contract_versions (id, org_id, contract_id, valid_from, valid_to, cancellation_policy, payment_policy, terms, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, '2025-12-04', '2025-12-08', '{"free_cancellation": "48 hours", "late_cancellation": "24 hours", "no_show": "100% charge"}', '{"deposit": "50% on booking", "balance": "30 days before arrival", "currency": "GBP"}', '{"commission": "15%", "allocation": "100 rooms", "room_types": ["twin", "double"], "min_stay": "4 nights"}', now(), now()),
(101, 100, 101, '2025-12-06', '2025-12-08', '{"free_cancellation": "7 days", "late_cancellation": "48 hours", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "10%", "allocation": "200 tickets", "validity": "3 days"}', now(), now()),
(102, 100, 102, '2025-12-06', '2025-12-08', '{"free_cancellation": "24 hours", "late_cancellation": "12 hours", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "12%", "allocation": "200 tickets", "validity": "3 days"}', now(), now()),
(103, 100, 103, '2025-12-04', '2025-12-08', '{"free_cancellation": "2 hours", "late_cancellation": "1 hour", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "20%", "allocation": "unlimited", "capacity": "1-4 people"}', now(), now()),
(104, 100, 104, '2025-12-06', '2025-12-08', '{"free_cancellation": "2 hours", "late_cancellation": "1 hour", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "25%", "allocation": "unlimited", "capacity": "1-4 people"}', now(), now()),
(105, 100, 105, '2025-12-04', '2025-12-08', '{"free_cancellation": "48 hours", "late_cancellation": "24 hours", "no_show": "100% charge"}', '{"deposit": "50% on booking", "balance": "30 days before arrival", "currency": "GBP"}', '{"commission": "15%", "allocation": "50 rooms", "room_types": ["twin", "double"], "min_stay": "4 nights"}', now(), now()),
(106, 100, 106, '2025-12-04', '2025-12-08', '{"free_cancellation": "48 hours", "late_cancellation": "24 hours", "no_show": "100% charge"}', '{"deposit": "50% on booking", "balance": "30 days before arrival", "currency": "GBP"}', '{"commission": "15%", "allocation": "20 suites", "room_types": ["king"], "min_stay": "4 nights"}', now(), now()),
(107, 100, 107, '2025-12-06', '2025-12-08', '{"free_cancellation": "7 days", "late_cancellation": "48 hours", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "10%", "allocation": "500 tickets", "validity": "3 days"}', now(), now()),
(108, 100, 108, '2025-12-06', '2025-12-08', '{"free_cancellation": "7 days", "late_cancellation": "48 hours", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "10%", "allocation": "300 tickets", "validity": "3 days"}', now(), now()),
(109, 100, 109, '2025-12-06', '2025-12-08', '{"free_cancellation": "7 days", "late_cancellation": "48 hours", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "10%", "allocation": "1000 tickets", "validity": "3 days"}', now(), now()),
(110, 100, 110, '2025-12-04', '2025-12-08', '{"free_cancellation": "2 hours", "late_cancellation": "1 hour", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "20%", "allocation": "unlimited", "capacity": "1-50 people"}', now(), now()),
(111, 100, 111, '2025-12-04', '2025-12-08', '{"free_cancellation": "2 hours", "late_cancellation": "1 hour", "no_show": "100% charge"}', '{"deposit": "100% on booking", "currency": "GBP"}', '{"commission": "25%", "allocation": "unlimited", "capacity": "1-6 people"}', now(), now()),
(112, 100, 112, '2025-12-06', '2025-12-08', '{"free_cancellation": "14 days", "late_cancellation": "7 days", "no_show": "100% charge"}', '{"deposit": "50% on booking", "balance": "21 days before event", "currency": "GBP"}', '{"commission": "8%", "allocation": "150 tickets", "validity": "3 days", "note": "Secondary supplier with better terms"}', now(), now());

-- 8. Rate Plans
INSERT INTO rate_plans (id, org_id, product_variant_id, supplier_id, contract_version_id, inventory_model, currency, markets, channels, preferred, valid_from, valid_to, rate_doc, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 100, 100, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-04', '2025-12-08', '{"room_type": "Standard Room", "base_rate": 1000, "currency": "GBP", "min_stay": 4, "room_types": ["twin", "double"]}', now(), now()),
(101, 100, 101, 100, 105, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-04', '2025-12-08', '{"room_type": "Deluxe Room", "base_rate": 1200, "currency": "GBP", "min_stay": 4, "room_types": ["twin", "double"]}', now(), now()),
(102, 100, 102, 100, 106, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-04', '2025-12-08', '{"room_type": "Suite", "base_rate": 2000, "currency": "GBP", "min_stay": 4, "room_types": ["king"]}', now(), now()),
(103, 100, 103, 101, 101, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"ticket_type": "Main Grandstand", "base_rate": 500, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(104, 100, 104, 101, 107, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"ticket_type": "Turn 1 Grandstand", "base_rate": 400, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(105, 100, 105, 101, 108, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"ticket_type": "Marina Grandstand", "base_rate": 350, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(106, 100, 106, 101, 101, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"hospitality": "Champions Club", "base_rate": 800, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(107, 100, 107, 101, 101, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"hospitality": "Yas Club", "base_rate": 600, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(108, 100, 108, 101, 101, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"paddock": "Paddock Club 3-Day", "base_rate": 1500, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(109, 100, 109, 101, 101, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-08', '2025-12-08', '{"paddock": "Paddock Club Sunday", "base_rate": 800, "currency": "GBP", "validity": "Sun"}', now(), now()),
(110, 100, 110, 101, 109, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-06', '2025-12-08', '{"general": "General Admission 3-Day", "base_rate": 150, "currency": "GBP", "validity": "Fri-Sun"}', now(), now()),
(111, 100, 111, 101, 109, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-08', '2025-12-08', '{"general": "General Admission Sunday", "base_rate": 80, "currency": "GBP", "validity": "Sun"}', now(), now()),
(112, 100, 112, 103, 103, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-04', '2025-12-08', '{"base_rate": 50, "currency": "GBP", "capacity": "1-4 people"}', now(), now()),
(113, 100, 113, 104, 104, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-06', '2025-12-08', '{"base_rate": 30, "currency": "GBP", "capacity": "1-4 people"}', now(), now()),
(114, 100, 114, 103, 110, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-04', '2025-12-08', '{"base_rate": 25, "currency": "GBP", "capacity": "1-50 people"}', now(), now()),
(115, 100, 115, 104, 110, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b', 'b2c'], true, '2025-12-06', '2025-12-08', '{"base_rate": 15, "currency": "GBP", "capacity": "1-50 people"}', now(), now()),
(116, 100, 116, 104, 111, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-04', '2025-12-08', '{"base_rate": 150, "currency": "GBP", "capacity": "1-6 people"}', now(), now()),
(117, 100, 117, 104, 111, 'freesale', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], true, '2025-12-06', '2025-12-08', '{"base_rate": 100, "currency": "GBP", "capacity": "1-6 people"}', now(), now()),
-- Additional rate plans from F1 Ticket Reseller (supplier 105) for same Grandstand tickets with different pricing
(118, 100, 103, 105, 112, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], false, '2025-12-06', '2025-12-08', '{"ticket_type": "Main Grandstand", "base_rate": 450, "currency": "GBP", "validity": "Fri-Sun", "supplier": "F1 Ticket Reseller"}', now(), now()),
(119, 100, 104, 105, 112, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], false, '2025-12-06', '2025-12-08', '{"ticket_type": "Turn 1 Grandstand", "base_rate": 350, "currency": "GBP", "validity": "Fri-Sun", "supplier": "F1 Ticket Reseller"}', now(), now()),
(120, 100, 105, 105, 112, 'committed', 'GBP', ARRAY['UK', 'US', 'EU'], ARRAY['b2b'], false, '2025-12-06', '2025-12-08', '{"ticket_type": "Marina Grandstand", "base_rate": 300, "currency": "GBP", "validity": "Fri-Sun", "supplier": "F1 Ticket Reseller"}', now(), now());

-- 9. Rate Occupancies (Hotel)
INSERT INTO rate_occupancies (id, org_id, rate_plan_id, min_occupancy, max_occupancy, pricing_model, base_amount, per_person_amount, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 1, 2, 'fixed', 1000.00, null, now(), now()),
(101, 100, 100, 1, 1, 'fixed', 950.00, null, now(), now()),
(102, 100, 100, 3, 4, 'base_plus_pax', 1000.00, 30.00, now(), now()),
-- Rate occupancies for F1 Ticket Reseller rate plans
(103, 100, 118, 1, 1, 'fixed', 450.00, null, now(), now()),
(104, 100, 119, 1, 1, 'fixed', 350.00, null, now(), now()),
(105, 100, 120, 1, 1, 'fixed', 300.00, null, now(), now());

-- 10. Rate Seasons (Hotel)
INSERT INTO rate_seasons (id, org_id, rate_plan_id, season_from, season_to, dow_mask, min_stay, max_stay, min_pax, max_pax, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, '2025-12-04', '2025-12-05', 127, 4, 4, 1, 4, now(), now()),
(101, 100, 100, '2025-12-06', '2025-12-07', 127, 4, 4, 1, 4, now(), now()),
(102, 100, 100, '2025-12-08', '2025-12-09', 127, 4, 4, 1, 4, now(), now());

-- 11. Allocation Buckets (Hotel - Committed)
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, stop_sell, blackout, allow_overbooking, overbooking_limit, notes, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 100, '2025-12-04', 'committed', 100, 0, 0, false, false, false, null, 'Fairmont Palm Dubai - Standard Rooms - 100 rooms', now(), now()),
(101, 100, 100, 100, '2025-12-05', 'committed', 100, 0, 0, false, false, false, null, 'Fairmont Palm Dubai - Standard Rooms - 100 rooms', now(), now()),
(102, 100, 100, 100, '2025-12-06', 'committed', 100, 0, 0, false, false, false, null, 'Fairmont Palm Dubai - Standard Rooms - 100 rooms', now(), now()),
(103, 100, 100, 100, '2025-12-07', 'committed', 100, 0, 0, false, false, false, null, 'Fairmont Palm Dubai - Standard Rooms - 100 rooms', now(), now()),
(104, 100, 100, 100, '2025-12-08', 'committed', 100, 0, 0, false, false, false, null, 'Fairmont Palm Dubai - Standard Rooms - 100 rooms', now(), now());

-- 12. Allocation Buckets (F1 Tickets - Event-based)
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, event_start_date, event_end_date, allocation_type, quantity, booked, held, stop_sell, blackout, allow_overbooking, overbooking_limit, notes, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(106, 100, 103, 101, '2025-12-06', '2025-12-08', 'committed', 200, 0, 0, false, false, false, null, 'Main Grandstand tickets - 3-day package', now(), now()),
(107, 100, 104, 101, '2025-12-06', '2025-12-08', 'committed', 500, 0, 0, false, false, false, null, 'Turn 1 Grandstand tickets - 3-day package', now(), now()),
(108, 100, 105, 101, '2025-12-06', '2025-12-08', 'committed', 300, 0, 0, false, false, false, null, 'Marina Grandstand tickets - 3-day package', now(), now()),
(109, 100, 106, 101, '2025-12-06', '2025-12-08', 'committed', 100, 0, 0, false, false, false, null, 'Champions Club hospitality - 3-day package', now(), now()),
(110, 100, 107, 101, '2025-12-06', '2025-12-08', 'committed', 150, 0, 0, false, false, false, null, 'Yas Club hospitality - 3-day package', now(), now()),
(111, 100, 108, 101, '2025-12-06', '2025-12-08', 'committed', 50, 0, 0, false, false, false, null, 'Paddock Club 3-day - 3-day package', now(), now()),
(112, 100, 109, 101, '2025-12-08', '2025-12-08', 'committed', 30, 0, 0, false, false, false, null, 'Paddock Club Sunday - 1-day package', now(), now()),
(113, 100, 110, 101, '2025-12-06', '2025-12-08', 'committed', 1000, 0, 0, false, false, false, null, 'General Admission 3-day - 3-day package', now(), now()),
(114, 100, 111, 101, '2025-12-08', '2025-12-08', 'committed', 500, 0, 0, false, false, false, null, 'General Admission Sunday - 1-day package', now(), now()),
-- Additional allocation buckets for F1 Ticket Reseller (supplier 105) - same tickets, different supplier
(115, 100, 103, 105, '2025-12-06', '2025-12-08', 'committed', 150, 0, 0, false, false, false, null, 'Main Grandstand tickets - F1 Ticket Reseller (cheaper)', now(), now()),
(116, 100, 104, 105, '2025-12-06', '2025-12-08', 'committed', 100, 0, 0, false, false, false, null, 'Turn 1 Grandstand tickets - F1 Ticket Reseller (cheaper)', now(), now()),
(117, 100, 105, 105, '2025-12-06', '2025-12-08', 'committed', 80, 0, 0, false, false, false, null, 'Marina Grandstand tickets - F1 Ticket Reseller (cheaper)', now(), now());

-- 13. Allocation Buckets (Transfers - Freesale)
INSERT INTO allocation_buckets (id, org_id, product_variant_id, supplier_id, date, allocation_type, quantity, booked, held, stop_sell, blackout, allow_overbooking, overbooking_limit, notes, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(118, 100, 112, 103, '2025-12-04', 'freesale', null, 0, 0, false, false, true, 100, 'Airport sedan transfers - unlimited capacity', now(), now()),
(119, 100, 112, 103, '2025-12-05', 'freesale', null, 0, 0, false, false, true, 100, 'Airport sedan transfers - unlimited capacity', now(), now()),
(120, 100, 112, 103, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 100, 'Airport sedan transfers - unlimited capacity', now(), now()),
(121, 100, 112, 103, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 100, 'Airport sedan transfers - unlimited capacity', now(), now()),
(122, 100, 112, 103, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 100, 'Airport sedan transfers - unlimited capacity', now(), now()),
(124, 100, 113, 104, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 50, 'Circuit sedan transfers - unlimited capacity', now(), now()),
(125, 100, 113, 104, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 50, 'Circuit sedan transfers - unlimited capacity', now(), now()),
(126, 100, 113, 104, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 50, 'Circuit sedan transfers - unlimited capacity', now(), now()),
(127, 100, 114, 103, '2025-12-04', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(128, 100, 114, 103, '2025-12-05', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(129, 100, 114, 103, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(130, 100, 114, 103, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(131, 100, 114, 103, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(132, 100, 114, 103, '2025-12-09', 'freesale', null, 0, 0, false, false, true, 200, 'Shared coach airport transfers - unlimited capacity', now(), now()),
(133, 100, 115, 104, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 100, 'Shared coach circuit transfers - unlimited capacity', now(), now()),
(134, 100, 115, 104, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 100, 'Shared coach circuit transfers - unlimited capacity', now(), now()),
(135, 100, 115, 104, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 100, 'Shared coach circuit transfers - unlimited capacity', now(), now()),
(136, 100, 116, 104, '2025-12-04', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(137, 100, 116, 104, '2025-12-05', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(138, 100, 116, 104, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(139, 100, 116, 104, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(140, 100, 116, 104, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(141, 100, 116, 104, '2025-12-09', 'freesale', null, 0, 0, false, false, true, 50, 'VIP airport transfers - unlimited capacity', now(), now()),
(142, 100, 117, 104, '2025-12-06', 'freesale', null, 0, 0, false, false, true, 30, 'VIP circuit transfers - unlimited capacity', now(), now()),
(143, 100, 117, 104, '2025-12-07', 'freesale', null, 0, 0, false, false, true, 30, 'VIP circuit transfers - unlimited capacity', now(), now()),
(144, 100, 117, 104, '2025-12-08', 'freesale', null, 0, 0, false, false, true, 30, 'VIP circuit transfers - unlimited capacity', now(), now());

-- 14. Packages
INSERT INTO packages (id, org_id, name, description, pricing_mode, status, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 'Abu Dhabi F1 Grand Prix Package', '4 nights at Fairmont Palm + F1 tickets + transfers', 'package', 'active', now(), now()),
(101, 100, 'F1 VIP Experience', '4 nights Deluxe + Paddock Club + VIP transfers', 'package', 'active', now(), now()),
(102, 100, 'F1 Budget Package', '4 nights Standard + General Admission + Shared transfers', 'package', 'active', now(), now()),
(103, 100, 'F1 Hospitality Package', '4 nights Standard + Champions Club + transfers', 'package', 'active', now(), now()),
(104, 100, 'F1 Weekend Experience', 'Complete F1 weekend with all options', 'package', 'active', now(), now());

-- 15. Package Components
INSERT INTO package_components (id, org_id, package_id, product_variant_id, sequence, quantity, pricing_overrides, created_at, updated_at) 
OVERRIDING SYSTEM VALUE VALUES 
(100, 100, 100, 100, 1, 1, '{}', now(), now()),
(101, 100, 100, 103, 2, 1, '{}', now(), now()),
(102, 100, 100, 112, 3, 1, '{}', now(), now()),
(103, 100, 100, 113, 4, 2, '{}', now(), now()),
(104, 100, 101, 101, 1, 1, '{}', now(), now()),
(105, 100, 101, 108, 2, 1, '{}', now(), now()),
(106, 100, 101, 116, 3, 1, '{}', now(), now()),
(107, 100, 101, 117, 4, 2, '{}', now(), now()),
(108, 100, 102, 100, 1, 1, '{}', now(), now()),
(109, 100, 102, 110, 2, 1, '{}', now(), now()),
(110, 100, 102, 114, 3, 1, '{}', now(), now()),
(111, 100, 102, 115, 4, 2, '{}', now(), now()),
(112, 100, 103, 100, 1, 1, '{}', now(), now()),
(113, 100, 103, 106, 2, 1, '{}', now(), now()),
(114, 100, 103, 112, 3, 1, '{}', now(), now()),
(115, 100, 103, 113, 4, 2, '{}', now(), now()),
(116, 100, 104, 102, 1, 1, '{}', now(), now()),
(117, 100, 104, 108, 2, 1, '{}', now(), now()),
(118, 100, 104, 116, 3, 1, '{}', now(), now()),
(119, 100, 104, 117, 4, 2, '{}', now(), now());

-- Success message
SELECT 'F1 Grand Prix scenario seeded successfully!' as message;
