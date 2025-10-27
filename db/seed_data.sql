-- ============================================================================
-- F1 MONACO GP TOUR OPERATOR - SIMPLIFIED SEED DATA
-- ============================================================================

BEGIN;

-- Organization
INSERT INTO organizations (id, name, slug, code, email, default_currency, base_currency, is_active)
VALUES ('20000000-0000-0000-0000-000000000001', 'Monaco GP Experiences Ltd', 'monaco-gp', 'MGPE', 
        'info@monacogp.com', 'GBP', 'USD', true);

-- Users
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role, is_active)
VALUES 
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 
 'james@monacogp.com', '$2a$10$hash', 'James', 'Hartley', 'owner', true),
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 'sarah@monacogp.com', '$2a$10$hash', 'Sarah', 'Mitchell', 'agent', true);

-- Exchange Rates
INSERT INTO exchange_rates (from_currency, to_currency, rate, date) VALUES
('GBP', 'USD', 1.2734, '2025-01-27'),
('GBP', 'EUR', 1.1845, '2025-01-27'),
('EUR', 'USD', 1.0750, '2025-01-27'),
('EUR', 'GBP', 0.8442, '2025-01-27');

-- Event
INSERT INTO events (id, event_name, event_code, event_type, venue_name, city, country, 
                    event_date_from, event_date_to, event_status)
VALUES ('30000000-0000-0000-0000-000000000001', 'Monaco Grand Prix 2025', 'F1-MONACO-2025', 'f1',
        'Circuit de Monaco', 'Monte Carlo', 'MC', '2025-05-23', '2025-05-25', 'scheduled');

-- Suppliers
INSERT INTO suppliers (id, organization_id, name, code, supplier_type, email, phone, 
                       city, country, default_currency, is_active)
VALUES 
('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 'Fairmont Monte Carlo', 'FAIRMONT-MC', 'hotel', 'groups@fairmont.com', '+377 93 50 65 00',
 'Monte Carlo', 'MC', 'EUR', true),
('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 'Monaco GP Ticketing', 'MGP-TICKETS', 'ticket_broker', 'trade@mgptickets.com', '+377 92 16 61 66',
 'Monte Carlo', 'MC', 'EUR', true),
('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
 'Riviera Luxury Transport', 'RLT', 'transport', 'bookings@rlt.com', '+33 4 93 21 30 15',
 'Nice', 'FR', 'EUR', true);

-- Products
INSERT INTO products (id, organization_id, product_type_id, supplier_id, event_id,
                      name, code, description, location, venue_name, 
                      attributes, is_active, created_by)
VALUES 
-- Hotel
('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 (SELECT id FROM product_types WHERE type_code = 'accommodation'),
 '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
 'Fairmont Monte Carlo - Monaco GP Package', 'HOTEL-FAIRMONT-GP2025',
 'Experience Monaco GP from the iconic 5-star Fairmont Monte Carlo. Located ON the circuit with stunning views. Includes 3 nights accommodation and daily breakfast.',
 '{"city": "Monte Carlo", "country": "Monaco", "address": "12 Avenue des Spélugues"}'::jsonb,
 'Fairmont Monte Carlo',
 '{"hotel_rating": "5-star", "board_basis": "bed_breakfast", "check_in": "15:00", "check_out": "12:00",
   "inclusions": ["3 nights accommodation", "Daily breakfast", "WiFi", "Pool access"],
   "exclusions": ["City tax €4.80/person/night", "Parking", "Mini-bar"]}'::jsonb,
 true, '10000000-0000-0000-0000-000000000001'),

-- Tickets
('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 (SELECT id FROM product_types WHERE type_code = 'event_ticket'),
 '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
 'Monaco GP 2025 - Grandstand K - 3 Day Pass', 'TICKET-MGP-K-3DAY',
 'Premium 3-day reserved grandstand seats at the Swimming Pool section. Covers Friday practice, Saturday qualifying, and Sunday race.',
 '{"venue": "Circuit de Monaco", "grandstand": "K", "section": "Swimming Pool"}'::jsonb,
 'Circuit de Monaco - Grandstand K',
 '{"ticket_type": "reserved_grandstand", "covered": true, "days": ["Friday", "Saturday", "Sunday"],
   "delivery": "E-ticket 14 days before event", "non_refundable": true}'::jsonb,
 true, '10000000-0000-0000-0000-000000000001'),

-- Airport Transfer
('50000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
 (SELECT id FROM product_types WHERE type_code = 'transfer'),
 '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001',
 'Nice Airport - Monaco Private Transfer', 'TRANSFER-NCE-MC',
 'Premium private transfer between Nice Airport and Monaco in luxury Mercedes vehicle with professional chauffeur.',
 '{"from": "Nice Airport", "to": "Monaco", "distance_km": 30, "duration_minutes": 45}'::jsonb,
 null,
 '{"service_type": "private", "vehicle": "Mercedes E-Class or V-Class", "meet_and_greet": true,
   "flight_monitoring": true, "inclusions": ["Professional chauffeur", "Luggage assistance", "Water"]}'::jsonb,
 true, '10000000-0000-0000-0000-000000000001');

-- Product Options
INSERT INTO product_options (id, product_id, option_name, option_code, description,
                             base_price, base_cost, currency, attributes, is_active)
VALUES 
-- Hotel option
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
 'Standard Double Room - 3 Nights', 'STD-DOUBLE-3N',
 'Elegant 35m² room with king or twin beds. 3 nights Thu 22 - Mon 26 May.',
 3600.00, 2850.00, 'GBP',
 '{"nights": 3, "room_size_sqm": 35, "bed_options": ["King", "Twin"], "max_occupancy": 3}'::jsonb,
 true),

-- Ticket option
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002',
 '3-Day Pass - Grandstand K', 'K-3DAY',
 'Full weekend pass with reserved seat. Friday, Saturday, Sunday.',
 850.00, 650.00, 'GBP',
 '{"format": "e-ticket", "delivery_days": 14, "grandstand": "K"}'::jsonb,
 true),

-- Transfer options
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003',
 'Arrival Transfer', 'ARRIVAL',
 'Private transfer from Nice Airport to Monaco hotel.',
 120.00, null, 'GBP',
 '{"direction": "inbound", "on_request": true}'::jsonb,
 true),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003',
 'Return Transfer', 'RETURN',
 'Private transfer from Monaco hotel to Nice Airport.',
 120.00, null, 'GBP',
 '{"direction": "outbound", "on_request": true}'::jsonb,
 true);

-- Contracts
INSERT INTO contracts (id, organization_id, supplier_id, event_id, contract_number, contract_name,
                       contract_type, valid_from, valid_to, currency, status, created_by)
VALUES 
-- Hotel allocation
('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
 'FAIRMONT-GP2025-001', 'Fairmont Monte Carlo Room Allocation', 'allotment',
 '2025-05-22', '2025-05-26', 'EUR', 'active', '10000000-0000-0000-0000-000000000001'),

-- Ticket batch
('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001',
 'MGP-TICKETS-2025-001', 'Monaco GP Tickets Batch Purchase', 'batch_purchase',
 '2025-05-23', '2025-05-25', 'EUR', 'active', '10000000-0000-0000-0000-000000000001'),

-- Transfer on-request
('70000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
 '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001',
 'RLT-TRANSFERS-2025', 'Airport Transfers On-Request', 'on_request',
 '2025-05-20', '2025-05-27', 'EUR', 'active', '10000000-0000-0000-0000-000000000001');

-- Contract Allocations
INSERT INTO contract_allocations (id, organization_id, contract_id, product_id,
                                  allocation_name, allocation_type, total_quantity,
                                  valid_from, valid_to, total_cost, cost_per_unit, currency)
VALUES 
-- Hotel allocation
('80000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 '70000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
 'Fairmont Rooms - GP Weekend', 'allotment', 10,
 '2025-05-22', '2025-05-26', 28500.00, 2850.00, 'EUR'),

-- Ticket batch
('80000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 '70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002',
 'Grandstand K Tickets - Batch', 'batch', 20,
 '2025-05-23', '2025-05-25', 13000.00, 650.00, 'EUR');

-- Allocation Inventory
INSERT INTO allocation_inventory (id, contract_allocation_id, product_option_id,
                                  total_quantity, available_quantity, sold_quantity,
                                  batch_cost_per_unit, currency, is_virtual_capacity)
VALUES 
('a0000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001', 10, 8, 2, 2850.00, 'EUR', false),
('a0000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000002', 20, 16, 4, 650.00, 'EUR', false);

-- Customers
INSERT INTO customers (id, organization_id, customer_type, first_name, last_name,
                       email, phone, vip_status, total_bookings, total_spent, is_active)
VALUES 
('d0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
 'b2c', 'James', 'Thompson', 'james.thompson@email.com', '+44 7700 900456',
 'gold', 3, 15800.00, true),
('d0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
 'b2c', 'David', 'Harrison', 'david.harrison@email.com', '+44 7700 900789',
 'standard', 0, 0, true);

-- Package
INSERT INTO packages (id, organization_id, package_name, package_code, description,
                      duration_nights, base_price, currency, is_published, created_by)
VALUES ('e0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'Monaco GP 2025 - Complete Experience', 'MGP-COMPLETE-2025',
        'Ultimate Monaco GP package: hotel, tickets, transfers. Everything included!',
        3, 5995.00, 'GBP', true, '10000000-0000-0000-0000-000000000001');

-- Booking 1: James Thompson (Confirmed)
INSERT INTO bookings (id, organization_id, customer_id, package_id, booking_reference,
                      booking_status, booking_date, confirmed_at, travel_date_from, travel_date_to,
                      total_cost, total_price, margin, display_currency, base_currency,
                      fx_rate_at_booking, lead_passenger_name, lead_passenger_email,
                      total_adults, payment_status, created_by)
VALUES ('f0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001',
        'MGPE-20250110-001', 'confirmed', '2025-01-10 14:32:15+00', '2025-01-10 16:45:22+00',
        '2025-05-22', '2025-05-26', 6450.00, 10570.00, 4120.00, 'GBP', 'USD', 1.2734,
        'Mr James Thompson', 'james.thompson@email.com', 2, 'partial',
        '10000000-0000-0000-0000-000000000002');

-- Booking Items for James Thompson
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id,
                           service_date_from, service_date_to, nights, quantity, adults,
                           contract_id, contract_allocation_id, allocation_inventory_id,
                           supplier_id, unit_cost, total_cost, cost_currency,
                           unit_price, total_price, price_currency, base_currency,
                           item_status, is_sourced, created_by)
VALUES 
-- Hotel
('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001', '2025-05-22', '2025-05-25', 3, 1, 2,
 '70000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001',
 'a0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
 2850.00, 2850.00, 'EUR', 3600.00, 3600.00, 'GBP', 'USD', 'confirmed', true,
 '10000000-0000-0000-0000-000000000002'),

-- Tickets (2x)
('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000002', '2025-05-23', '2025-05-25', null, 2, 2,
 '70000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000002',
 'a0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002',
 650.00, 1300.00, 'EUR', 850.00, 1700.00, 'GBP', 'USD', 'confirmed', true,
 '10000000-0000-0000-0000-000000000002'),

-- Transfer Arrival
('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000003', '2025-05-22', null, null, 1, 2,
 null, null, null, '40000000-0000-0000-0000-000000000003',
 null, null, 'EUR', 120.00, 120.00, 'GBP', 'USD', 'on_request', false,
 '10000000-0000-0000-0000-000000000002'),

-- Transfer Return
('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003',
 '60000000-0000-0000-0000-000000000004', '2025-05-26', null, null, 1, 2,
 null, null, null, '40000000-0000-0000-0000-000000000003',
 null, null, 'EUR', 120.00, 120.00, 'GBP', 'USD', 'on_request', false,
 '10000000-0000-0000-0000-000000000002');

-- Payment
INSERT INTO payments (id, organization_id, booking_id, payment_reference,
                      amount, currency, payment_method, payment_type, status,
                      paid_at, created_by)
VALUES ('f3000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        'f0000000-0000-0000-0000-000000000001', 'PAY-MGPE-20250110-001-DEP',
        5285.00, 'GBP', 'credit_card', 'deposit', 'completed',
        '2025-01-10 16:48:35+00', '10000000-0000-0000-0000-000000000002');

-- Booking 2: David Harrison (Quote)
INSERT INTO bookings (id, organization_id, customer_id, package_id, booking_reference,
                      quote_reference, booking_status, quote_expires_at,
                      booking_date, travel_date_from, travel_date_to,
                      total_cost, total_price, margin, display_currency, base_currency,
                      fx_rate_at_booking, lead_passenger_name, lead_passenger_email,
                      total_adults, payment_status, created_by)
VALUES ('f0000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001',
        'MGPE-20250120-002', 'QUOTE-20250120-002', 'quote', '2025-01-27 23:59:59+00',
        '2025-01-20 11:45:22+00', '2025-05-22', '2025-05-26',
        6450.00, 10570.00, 4120.00, 'GBP', 'USD', 1.2734,
        'Mr David Harrison', 'david.harrison@email.com', 2, 'pending',
        '10000000-0000-0000-0000-000000000001');

-- Quote items (similar to booking 1 but status=provisional)
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id,
                           service_date_from, service_date_to, nights, quantity, adults,
                           unit_cost, total_cost, cost_currency,
                           unit_price, total_price, price_currency, base_currency,
                           item_status, is_sourced, created_by)
VALUES 
('f1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000002',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001',
 '60000000-0000-0000-0000-000000000001', '2025-05-22', '2025-05-25', 3, 1, 2,
 2850.00, 2850.00, 'EUR', 3600.00, 3600.00, 'GBP', 'USD', 'provisional', false,
 '10000000-0000-0000-0000-000000000001'),
('f1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002',
 '20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002',
 '60000000-0000-0000-0000-000000000002', '2025-05-23', '2025-05-25', null, 2, 2,
 650.00, 1300.00, 'EUR', 850.00, 1700.00, 'GBP', 'USD', 'provisional', false,
 '10000000-0000-0000-0000-000000000001');

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ 1 Organization
-- ✅ 2 Users
-- ✅ FX rates
-- ✅ 1 Event (Monaco GP 2025)
-- ✅ 3 Suppliers
-- ✅ 3 Products (Hotel, Tickets, Transfers)
-- ✅ 4 Product Options
-- ✅ 3 Contracts (Allocation, Batch, On-request)
-- ✅ 2 Allocations with inventory
-- ✅ 2 Customers (1 VIP, 1 new)
-- ✅ 1 Package
-- ✅ 2 Bookings (1 confirmed, 1 quote)
-- ✅ 6 Booking items
-- ✅ 1 Payment
-- 
-- Inventory: 10 hotel rooms (2 sold), 20 tickets (4 sold)