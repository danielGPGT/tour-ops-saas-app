-- ============================================
-- SEED DATA FOR F1 TOUR OPERATOR SYSTEM
-- Complete realistic data for Abu Dhabi F1 2025
-- ============================================

BEGIN;

-- ============================================
-- 1. ORGANIZATION
-- ============================================

INSERT INTO organizations (id, name, slug, email, phone, default_currency, timezone, subscription_plan, subscription_status, is_active, onboarded_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'F1 Adventures Travel',
    'f1-adventures',
    'info@f1adventures.com',
    '+971-4-123-4567',
    'AED',
    'Asia/Dubai',
    'professional',
    'active',
    true,
    '2024-01-15 10:00:00'
);

-- ============================================
-- 2. USERS
-- ============================================

INSERT INTO users (id, organization_id, email, first_name, last_name, role, is_active, email_verified)
VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@f1adventures.com',
    'Sarah',
    'Johnson',
    'owner',
    true,
    true
),
(
    '22222222-2222-2222-2222-222222222223',
    '11111111-1111-1111-1111-111111111111',
    'ops@f1adventures.com',
    'Mike',
    'Chen',
    'manager',
    true,
    true
),
(
    '22222222-2222-2222-2222-222222222224',
    '11111111-1111-1111-1111-111111111111',
    'agent@f1adventures.com',
    'Emma',
    'Williams',
    'agent',
    true,
    true
);

-- ============================================
-- 3. SUPPLIERS
-- ============================================

INSERT INTO suppliers (id, organization_id, name, code, supplier_type, contact_info, commission_rate, is_active)
VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Fairmont Hotels & Resorts',
    'FAIRMONT',
    'accommodation',
    '{"contact_name": "John Smith", "email": "reservations@fairmont.com", "phone": "+971-2-654-3333"}'::jsonb,
    10.00,
    true
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'Platinum Hospitality',
    'PLATINUM',
    'ticket',
    '{"contact_name": "Lisa Wang", "email": "bookings@platinumhosp.com", "phone": "+971-4-567-8900"}'::jsonb,
    8.00,
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'F1 Experiences Official',
    'F1EXP',
    'ticket',
    '{"contact_name": "David Brown", "email": "sales@f1experiences.com", "phone": "+971-4-888-9999"}'::jsonb,
    5.00,
    true
),
(
    '33333333-3333-3333-3333-333333333334',
    '11111111-1111-1111-1111-111111111111',
    'Elite Coach Services',
    'ELITE',
    'transfer',
    '{"contact_name": "Ahmed Al Rashid", "email": "groups@elitecoach.ae", "phone": "+971-50-123-4567"}'::jsonb,
    12.00,
    true
),
(
    '33333333-3333-3333-3333-333333333335',
    '11111111-1111-1111-1111-111111111111',
    'Uber Business',
    'UBER',
    'transfer',
    '{"contact_name": "Support Team", "email": "business@uber.com", "phone": "+971-800-UBER"}'::jsonb,
    0.00,
    true
);

-- ============================================
-- 4. CONTRACTS
-- ============================================

INSERT INTO contracts (id, organization_id, supplier_id, contract_number, contract_name, valid_from, valid_to, currency, commission_rate, commission_type, rooming_list_deadline, status, created_by)
VALUES 
(
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'FAIR-F1-2025',
    'Fairmont Palm Abu Dhabi - F1 Package 2025',
    '2025-12-03',
    '2025-12-10',
    'AED',
    10.00,
    'net_rate',
    14,
    'active',
    '22222222-2222-2222-2222-222222222222'
),
(
    '44444444-4444-4444-4444-444444444442',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333332',
    'PLAT-F1-2025',
    'Platinum Hospitality - F1 Tickets 2025',
    '2025-12-05',
    '2025-12-07',
    'AED',
    8.00,
    'percentage',
    null,
    'active',
    '22222222-2222-2222-2222-222222222222'
);

-- ============================================
-- 5. PRODUCTS (Already has product_types seeded)
-- ============================================

-- Hotel Product
INSERT INTO products (id, organization_id, product_type_id, name, code, description, location, attributes, is_active, created_by)
VALUES (
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM product_types WHERE type_code = 'accommodation'),
    'Fairmont The Palm Abu Dhabi',
    'HTL-FAIRMONT-PALM',
    'Luxury beachfront resort on Palm Jumeirah with stunning views of the Arabian Gulf. Features world-class dining, spa, and direct beach access.',
    '{"city": "Abu Dhabi", "country": "UAE", "address": "Palm Jumeirah West Crescent", "coordinates": {"lat": 24.4539, "lng": 54.3773}}'::jsonb,
    '{"star_rating": 5, "check_in_time": "15:00", "check_out_time": "12:00", "total_rooms": 381}'::jsonb,
    true,
    '22222222-2222-2222-2222-222222222222'
);

-- F1 Event Product
INSERT INTO products (id, organization_id, product_type_id, name, code, description, location, attributes, is_active, created_by)
VALUES (
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM product_types WHERE type_code = 'ticket'),
    'Formula 1 Etihad Airways Abu Dhabi Grand Prix 2025',
    'F1-ABU-2025',
    'The season finale of Formula 1 at the spectacular Yas Marina Circuit. Experience the thrilling night race under the lights.',
    '{"city": "Abu Dhabi", "venue": "Yas Marina Circuit", "country": "UAE"}'::jsonb,
    '{"event_dates": ["2025-12-05", "2025-12-06", "2025-12-07"], "series": "Formula 1", "event_type": "Grand Prix"}'::jsonb,
    true,
    '22222222-2222-2222-2222-222222222222'
);

-- Airport Transfer - Arrival
INSERT INTO products (id, organization_id, product_type_id, name, code, description, location, attributes, is_active, created_by)
VALUES (
    '55555555-5555-5555-5555-555555555553',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM product_types WHERE type_code = 'transfer'),
    'Airport Transfer - Arrival',
    'XFER-AUH-ARR',
    'Comfortable transfer from Abu Dhabi International Airport to your hotel',
    '{"route": "Airport to Hotel", "distance_km": 45}'::jsonb,
    '{"transfer_type": "airport_arrival"}'::jsonb,
    true,
    '22222222-2222-2222-2222-222222222222'
);

-- Airport Transfer - Departure
INSERT INTO products (id, organization_id, product_type_id, name, code, description, location, attributes, is_active, created_by)
VALUES (
    '55555555-5555-5555-5555-555555555554',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM product_types WHERE type_code = 'transfer'),
    'Airport Transfer - Departure',
    'XFER-AUH-DEP',
    'Comfortable transfer from your hotel to Abu Dhabi International Airport',
    '{"route": "Hotel to Airport", "distance_km": 45}'::jsonb,
    '{"transfer_type": "airport_departure"}'::jsonb,
    true,
    '22222222-2222-2222-2222-222222222222'
);

-- Circuit Transfer
INSERT INTO products (id, organization_id, product_type_id, name, code, description, location, attributes, is_active, created_by)
VALUES (
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM product_types WHERE type_code = 'transfer'),
    'Yas Marina Circuit Daily Transfer',
    'XFER-CIRCUIT',
    'Daily return transfer from hotel to Yas Marina Circuit during race weekend',
    '{"route": "Hotel to Yas Marina Circuit (Return)", "distance_km": 25}'::jsonb,
    '{"transfer_type": "circuit_daily", "return_transfer": true}'::jsonb,
    true,
    '22222222-2222-2222-2222-222222222222'
);

-- ============================================
-- 6. PRODUCT OPTIONS
-- ============================================

-- Hotel Room Types
INSERT INTO product_options (id, product_id, option_name, option_code, description, standard_occupancy, max_occupancy, min_occupancy, bed_configuration, is_active)
VALUES 
(
    '66666666-6666-6666-6666-666666666661',
    '55555555-5555-5555-5555-555555555551',
    'Standard Room - Double or Twin',
    'STD-DBL-TWN',
    'Contemporary room with choice of one king bed or two twin beds, 43 sqm',
    2,
    3,
    1,
    'Flexible',
    true
),
(
    '66666666-6666-6666-6666-666666666662',
    '55555555-5555-5555-5555-555555555551',
    'Deluxe Room - Double or Twin',
    'DLX-DBL-TWN',
    'Spacious room with choice of bed configuration, 55 sqm with partial sea view',
    2,
    3,
    1,
    'Flexible',
    true
);

-- F1 Ticket Types
INSERT INTO product_options (id, product_id, option_name, option_code, description, standard_occupancy, max_occupancy, is_active)
VALUES 
(
    '66666666-6666-6666-6666-666666666663',
    '55555555-5555-5555-5555-555555555552',
    'Main Grandstand - 3 Day Pass',
    'MGS-3DAY',
    'Reserved seating at Main Grandstand for all 3 days (Practice, Qualifying, Race)',
    1,
    1,
    true
),
(
    '66666666-6666-6666-6666-666666666664',
    '55555555-5555-5555-5555-555555555552',
    'Marina Suite - 3 Day Hospitality',
    'MARINA-3DAY',
    'Premium hospitality package with Marina Suite access, food and beverage included',
    1,
    1,
    true
),
(
    '66666666-6666-6666-6666-666666666665',
    '55555555-5555-5555-5555-555555555552',
    'West Grandstand - 3 Day Pass',
    'WGS-3DAY',
    'West Grandstand seating for all 3 days with excellent views',
    1,
    1,
    true
);

-- Airport Transfer Options
INSERT INTO product_options (id, product_id, option_name, option_code, standard_occupancy, max_occupancy, attributes, is_active)
VALUES 
(
    '66666666-6666-6666-6666-666666666666',
    '55555555-5555-5555-5555-555555555553',
    'Shared Shuttle',
    'SHARED-SHUTTLE',
    1,
    8,
    '{"vehicle_type": "Minibus", "luggage_capacity": 8}'::jsonb,
    true
),
(
    '66666666-6666-6666-6666-666666666667',
    '55555555-5555-5555-5555-555555555553',
    'Private Sedan',
    'PRIVATE-SEDAN',
    3,
    3,
    '{"vehicle_type": "Sedan", "luggage_capacity": 3}'::jsonb,
    true
),
(
    '66666666-6666-6666-6666-666666666668',
    '55555555-5555-5555-5555-555555555553',
    'Private SUV',
    'PRIVATE-SUV',
    6,
    6,
    '{"vehicle_type": "SUV", "luggage_capacity": 6}'::jsonb,
    true
);

-- Duplicate for Departure
INSERT INTO product_options (id, product_id, option_name, option_code, standard_occupancy, max_occupancy, attributes, is_active)
VALUES 
(
    '66666666-6666-6666-6666-666666666669',
    '55555555-5555-5555-5555-555555555554',
    'Shared Shuttle',
    'SHARED-SHUTTLE',
    1,
    8,
    '{"vehicle_type": "Minibus", "luggage_capacity": 8}'::jsonb,
    true
),
(
    '66666666-6666-6666-6666-666666666670',
    '55555555-5555-5555-5555-555555555554',
    'Private Sedan',
    'PRIVATE-SEDAN',
    3,
    3,
    '{"vehicle_type": "Sedan", "luggage_capacity": 3}'::jsonb,
    true
),
(
    '66666666-6666-6666-6666-666666666671',
    '55555555-5555-5555-5555-555555555554',
    'Private SUV',
    'PRIVATE-SUV',
    6,
    6,
    '{"vehicle_type": "SUV", "luggage_capacity": 6}'::jsonb,
    true
);

-- Circuit Transfer Options
INSERT INTO product_options (id, product_id, option_name, option_code, standard_occupancy, max_occupancy, attributes, is_active)
VALUES 
(
    '66666666-6666-6666-6666-666666666672',
    '55555555-5555-5555-5555-555555555555',
    'Shared Coach - Per Person',
    'SHARED-COACH',
    1,
    1,
    '{"vehicle_type": "Coach", "pricing_type": "per_person"}'::jsonb,
    true
),
(
    '66666666-6666-6666-6666-666666666673',
    '55555555-5555-5555-5555-555555555555',
    'Private Vehicle',
    'PRIVATE-VEH',
    6,
    6,
    '{"vehicle_type": "SUV", "pricing_type": "per_vehicle"}'::jsonb,
    true
);

-- ============================================
-- 7. CONTRACT ALLOCATIONS
-- ============================================

-- Hotel Block Dec 4-8
INSERT INTO contract_allocations (id, organization_id, contract_id, product_id, allocation_name, allocation_type, valid_from, valid_to, min_nights, max_nights, dow_arrival, release_days, is_active)
VALUES (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '55555555-5555-5555-5555-555555555551',
    'F1 Abu Dhabi Main Block Dec 4-8',
    'committed',
    '2025-12-04',
    '2025-12-08',
    4,
    4,
    ARRAY[4], -- Thursday
    30,
    true
);

-- ============================================
-- 8. ALLOCATION INVENTORY
-- ============================================

-- 70 Standard Rooms
INSERT INTO allocation_inventory (id, contract_allocation_id, product_option_id, total_quantity, flexible_configuration)
VALUES (
    '88888888-8888-8888-8888-888888888881',
    '77777777-7777-7777-7777-777777777771',
    '66666666-6666-6666-6666-666666666661',
    70,
    true
);

-- 30 Deluxe Rooms
INSERT INTO allocation_inventory (id, contract_allocation_id, product_option_id, total_quantity, flexible_configuration)
VALUES (
    '88888888-8888-8888-8888-888888888882',
    '77777777-7777-7777-7777-777777777771',
    '66666666-6666-6666-6666-666666666662',
    30,
    true
);

-- ============================================
-- 9. AVAILABILITY (Daily for Dec 4-7)
-- ============================================

-- Standard Rooms Availability
INSERT INTO availability (allocation_inventory_id, availability_date, total_available, booked, provisional)
VALUES 
('88888888-8888-8888-8888-888888888881', '2025-12-04', 70, 12, 5),
('88888888-8888-8888-8888-888888888881', '2025-12-05', 70, 12, 5),
('88888888-8888-8888-8888-888888888881', '2025-12-06', 70, 12, 5),
('88888888-8888-8888-8888-888888888881', '2025-12-07', 70, 12, 5);

-- Deluxe Rooms Availability
INSERT INTO availability (allocation_inventory_id, availability_date, total_available, booked, provisional)
VALUES 
('88888888-8888-8888-8888-888888888882', '2025-12-04', 30, 5, 2),
('88888888-8888-8888-8888-888888888882', '2025-12-05', 30, 5, 2),
('88888888-8888-8888-8888-888888888882', '2025-12-06', 30, 5, 2),
('88888888-8888-8888-8888-888888888882', '2025-12-07', 30, 5, 2);

-- ============================================
-- 10. SUPPLIER RATES
-- ============================================

-- Standard Room Package Rate
INSERT INTO supplier_rates (id, organization_id, contract_id, contract_allocation_id, product_id, product_option_id, rate_name, valid_from, valid_to, rate_basis, is_included_in_package, currency)
VALUES (
    '99999999-9999-9999-9999-999999999991',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '77777777-7777-7777-7777-777777777771',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666661',
    'F1 Package Rate - Standard Room',
    '2025-12-04',
    '2025-12-07',
    'per_room_night',
    true,
    'AED'
);

-- Standard Room Occupancy Costs
INSERT INTO rate_occupancy_costs (supplier_rate_id, occupancy, is_standard_occupancy, base_cost, extra_adult_cost, board_basis, board_supplement)
VALUES 
('99999999-9999-9999-9999-999999999991', 1, false, 240.00, null, 'room_only', 15.00),
('99999999-9999-9999-9999-999999999991', 2, true, 250.00, null, 'room_only', 15.00),
('99999999-9999-9999-9999-999999999991', 3, false, 250.00, 30.00, 'room_only', 15.00);

-- Deluxe Room Package Rate
INSERT INTO supplier_rates (id, organization_id, contract_id, contract_allocation_id, product_id, product_option_id, rate_name, valid_from, valid_to, rate_basis, is_included_in_package, currency)
VALUES (
    '99999999-9999-9999-9999-999999999992',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '77777777-7777-7777-7777-777777777771',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666662',
    'F1 Package Rate - Deluxe Room',
    '2025-12-04',
    '2025-12-07',
    'per_room_night',
    true,
    'AED'
);

-- Deluxe Room Occupancy Costs
INSERT INTO rate_occupancy_costs (supplier_rate_id, occupancy, is_standard_occupancy, base_cost, extra_adult_cost, board_basis, board_supplement)
VALUES 
('99999999-9999-9999-9999-999999999992', 1, false, 290.00, null, 'room_only', 15.00),
('99999999-9999-9999-9999-999999999992', 2, true, 300.00, null, 'room_only', 15.00),
('99999999-9999-9999-9999-999999999992', 3, false, 300.00, 30.00, 'room_only', 15.00);

-- Extra Night Rates (Dec 3 and Dec 8-9)
INSERT INTO supplier_rates (id, organization_id, contract_id, product_id, product_option_id, rate_name, valid_from, valid_to, rate_basis, is_included_in_package, is_extra_night_rate, currency)
VALUES (
    '99999999-9999-9999-9999-999999999993',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666661',
    'Extra Night Rate - Standard Room',
    '2025-12-03',
    '2025-12-09',
    'per_room_night',
    false,
    true,
    'AED'
);

INSERT INTO rate_occupancy_costs (supplier_rate_id, occupancy, is_standard_occupancy, base_cost, board_supplement)
VALUES 
('99999999-9999-9999-9999-999999999993', 1, false, 280.00, 15.00),
('99999999-9999-9999-9999-999999999993', 2, true, 290.00, 15.00),
('99999999-9999-9999-9999-999999999993', 3, false, 290.00, 15.00);

-- F1 Ticket Rates (Main Grandstand from Platinum)
INSERT INTO supplier_rates (id, organization_id, contract_id, product_id, product_option_id, rate_name, valid_from, valid_to, rate_basis, currency)
VALUES (
    '99999999-9999-9999-9999-999999999994',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    '55555555-5555-5555-5555-555555555552',
    '66666666-6666-6666-6666-666666666663',
    'Main Grandstand - Platinum Hospitality',
    '2025-12-05',
    '2025-12-07',
    'per_unit',
    'AED'
);

INSERT INTO rate_occupancy_costs (supplier_rate_id, occupancy, base_cost, adult_cost, child_cost)
VALUES ('99999999-9999-9999-9999-999999999994', 1, 1650.00, 1650.00, 1100.00);

-- Marina Suite Tickets
INSERT INTO supplier_rates (id, organization_id, contract_id, product_id, product_option_id, rate_name, valid_from, valid_to, rate_basis, currency)
VALUES (
    '99999999-9999-9999-9999-999999999995',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444442',
    '55555555-5555-5555-5555-555555555552',
    '66666666-6666-6666-6666-666666666664',
    'Marina Suite - F1 Experiences',
    '2025-12-05',
    '2025-12-07',
    'per_unit',
    'AED'
);

INSERT INTO rate_occupancy_costs (supplier_rate_id, occupancy, base_cost, adult_cost)
VALUES ('99999999-9999-9999-9999-999999999995', 1, 4500.00, 4500.00);

-- ============================================
-- 11. TAXES & FEES
-- ============================================

-- City Tax (applies to all hotel rates)
INSERT INTO rate_taxes_fees (organization_id, contract_id, fee_name, fee_type, calculation_method, amount, applies_to_adults, applies_to_children, child_age_to, is_included_in_rate, is_payable_at_property, currency)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'Abu Dhabi Tourism Dirham',
    'tax',
    'per_person_night',
    10.00,
    true,
    false,
    12,
    false,
    true,
    'AED'
);

-- VAT
INSERT INTO rate_taxes_fees (organization_id, contract_id, fee_name, fee_type, calculation_method, amount, applies_to_adults, applies_to_children, is_included_in_rate, currency)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444441',
    'VAT',
    'tax',
    'percentage',
    12.00,
    true,
    true,
    true,
    'AED'
);

-- ============================================
-- 12. SELLING RATES
-- ============================================

-- Standard Room Selling Price
INSERT INTO selling_rates (id, organization_id, product_id, product_option_id, rate_name, rate_basis, valid_from, valid_to, base_price, markup_type, markup_amount, customer_type, currency, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666661',
    'F1 Package - Standard Room',
    'per_room_night',
    '2025-12-04',
    '2025-12-07',
    400.00,
    'percentage',
    60.00,
    'b2c',
    'AED',
    true
);

INSERT INTO selling_rate_occupancy (selling_rate_id, occupancy, is_standard_occupancy, selling_price, board_basis, board_price)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, false, 380.00, 'room_only', 25.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, true, 400.00, 'room_only', 25.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, false, 450.00, 'room_only', 25.00);

-- Deluxe Room Selling Price
INSERT INTO selling_rates (id, organization_id, product_id, product_option_id, rate_name, rate_basis, valid_from, valid_to, base_price, markup_type, markup_amount, customer_type, currency, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666662',
    'F1 Package - Deluxe Room',
    'per_room_night',
    '2025-12-04',
    '2025-12-07',
    480.00,
    'percentage',
    60.00,
    'b2c',
    'AED',
    true
);

INSERT INTO selling_rate_occupancy (selling_rate_id, occupancy, is_standard_occupancy, selling_price, board_basis, board_price)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, false, 460.00, 'room_only', 25.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 2, true, 480.00, 'room_only', 25.00),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 3, false, 530.00, 'room_only', 25.00);

-- Main Grandstand Tickets Selling
INSERT INTO selling_rates (id, organization_id, product_id, product_option_id, rate_name, rate_basis, valid_from, valid_to, base_price, customer_type, currency, is_active)
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555552',
    '66666666-6666-6666-6666-666666666663',
    'Main Grandstand - Public Price',
    'per_unit',
    '2025-12-05',
    '2025-12-07',
    2200.00,
    'b2c',
    'AED',
    true
);

INSERT INTO selling_rate_occupancy (selling_rate_id, occupancy, selling_price, adult_price, child_price)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 1, 2200.00, 2200.00, 1500.00);

-- ============================================
-- 13. CUSTOMERS
-- ============================================

INSERT INTO customers (id, organization_id, customer_type, first_name, last_name, email, phone, total_bookings, is_active)
VALUES 
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'b2c',
    'James',
    'Anderson',
    'james.anderson@email.com',
    '+44-7700-123456',
    1,
    true
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '11111111-1111-1111-1111-111111111111',
    'b2c',
    'Sarah',
    'Williams',
    'sarah.williams@email.com',
    '+44-7800-654321',
    1,
    true
),
(
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '11111111-1111-1111-1111-111111111111',
    'b2c',
    'Emma',
    'Thompson',
    'emma.thompson@email.com',
    '+44-7900-111222',
    1,
    true
);

-- ============================================
-- 14. BOOKINGS
-- ============================================

-- Booking 1: James Anderson (Provisional)
INSERT INTO bookings (id, organization_id, booking_reference, booking_status, customer_id, booking_date, travel_date_from, travel_date_to, total_adults, total_children, total_cost, total_price, currency, lead_passenger_name, lead_passenger_email, lead_passenger_phone, source, created_by)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'F1ABU2025-0001',
    'provisional',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '2024-10-15 14:30:00',
    '2025-12-04',
    '2025-12-08',
    2,
    0,
    5720.00,
    8080.00,
    'AED',
    'James Anderson',
    'james.anderson@email.com',
    '+44-7700-123456',
    'web',
    '22222222-2222-2222-2222-222222222224'
);

-- Booking 2: Sarah Williams (Confirmed)
INSERT INTO bookings (id, organization_id, booking_reference, booking_status, customer_id, booking_date, confirmed_at, travel_date_from, travel_date_to, total_adults, total_children, total_cost, total_price, currency, lead_passenger_name, lead_passenger_email, source, created_by)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    '11111111-1111-1111-1111-111111111111',
    'F1ABU2025-0002',
    'confirmed',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    '2024-09-28 10:15:00',
    '2024-10-01 16:20:00',
    '2025-12-04',
    '2025-12-08',
    2,
    1,
    7840.00,
    11200.00,
    'AED',
    'Sarah Williams',
    'sarah.williams@email.com',
    'web',
    '22222222-2222-2222-2222-222222222224'
);

-- Booking 3: Emma Thompson (Confirmed with extra nights)
INSERT INTO bookings (id, organization_id, booking_reference, booking_status, customer_id, booking_date, confirmed_at, travel_date_from, travel_date_to, total_adults, total_cost, total_price, currency, lead_passenger_name, lead_passenger_email, source, created_by)
VALUES (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    '11111111-1111-1111-1111-111111111111',
    'F1ABU2025-0004',
    'confirmed',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    '2024-10-05 11:00:00',
    '2024-10-08 09:30:00',
    '2025-12-03',
    '2025-12-09',
    2,
    8200.00,
    12080.00,
    'AED',
    'Emma Thompson',
    'emma.thompson@email.com',
    'email',
    '22222222-2222-2222-2222-222222222223'
);

-- ============================================
-- 15. BOOKING ITEMS (Sample for Booking 1)
-- ============================================

-- James Anderson: Standard Room
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id, service_date_from, service_date_to, quantity, adults, bed_configuration, board_basis, contract_allocation_id, allocation_inventory_id, supplier_id, contract_id, unit_cost, unit_price, total_cost, total_price, currency, item_status, is_sourced, created_by)
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    '66666666-6666-6666-6666-666666666661',
    '2025-12-04',
    '2025-12-08',
    1,
    2,
    'Double',
    'room_only',
    '77777777-7777-7777-7777-777777777771',
    '88888888-8888-8888-8888-888888888881',
    '33333333-3333-3333-3333-333333333331',
    '44444444-4444-4444-4444-444444444441',
    250.00,
    400.00,
    1000.00,
    1600.00,
    'AED',
    'provisional',
    true,
    '22222222-2222-2222-2222-222222222224'
);

-- James Anderson: F1 Tickets
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id, service_date_from, service_date_to, quantity, adults, supplier_id, contract_id, unit_cost, unit_price, total_cost, total_price, currency, item_status, is_sourced, created_by)
VALUES (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555552',
    '66666666-6666-6666-6666-666666666663',
    '2025-12-05',
    '2025-12-07',
    2,
    2,
    '33333333-3333-3333-3333-333333333332',
    '44444444-4444-4444-4444-444444444442',
    1650.00,
    2200.00,
    3300.00,
    4400.00,
    'AED',
    'provisional',
    true,
    '22222222-2222-2222-2222-222222222224'
);

-- James Anderson: Airport Transfer Arrival (NOT SOURCED)
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id, service_date_from, quantity, adults, unit_cost, unit_price, total_cost, total_price, currency, item_status, is_sourced, item_notes, created_by)
VALUES (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555553',
    '66666666-6666-6666-6666-666666666667',
    '2025-12-04',
    1,
    2,
    350.00,
    500.00,
    350.00,
    500.00,
    'AED',
    'provisional',
    false,
    'Flight: EK001, Arrival: 14:30',
    '22222222-2222-2222-2222-222222222224'
);

-- James Anderson: Circuit Transfer (NOT SOURCED)
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id, service_date_from, service_date_to, quantity, adults, unit_cost, unit_price, total_cost, total_price, currency, item_status, is_sourced, item_notes, created_by)
VALUES (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666672',
    '2025-12-05',
    '2025-12-07',
    2,
    2,
    120.00,
    180.00,
    720.00,
    1080.00,
    'AED',
    'provisional',
    false,
    '2 people × 3 days',
    '22222222-2222-2222-2222-222222222224'
);

-- James Anderson: Airport Transfer Departure (NOT SOURCED)
INSERT INTO booking_items (id, booking_id, organization_id, product_id, product_option_id, service_date_from, quantity, adults, unit_cost, unit_price, total_cost, total_price, currency, item_status, is_sourced, item_notes, created_by)
VALUES (
    'dddddddd-dddd-dddd-dddd-ddddddddddd5',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555554',
    '66666666-6666-6666-6666-666666666670',
    '2025-12-08',
    1,
    2,
    350.00,
    500.00,
    350.00,
    500.00,
    'AED',
    'provisional',
    false,
    'Flight: EK002, Departure: 22:45',
    '22222222-2222-2222-2222-222222222224'
);

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check organization
SELECT name, slug, default_currency FROM organizations;

-- Check products
SELECT p.name, pt.type_name, p.location->>'city' as city
FROM products p
JOIN product_types pt ON p.product_type_id = pt.id;

-- Check availability
SELECT 
    po.option_name,
    a.availability_date,
    a.total_available,
    a.booked,
    a.provisional,
    a.available
FROM availability a
JOIN allocation_inventory ai ON a.allocation_inventory_id = ai.id
JOIN product_options po ON ai.product_option_id = po.id
ORDER BY po.option_name, a.availability_date;

-- Check bookings
SELECT 
    booking_reference,
    booking_status,
    lead_passenger_name,
    total_adults,
    total_cost,
    total_price,
    margin
FROM bookings
ORDER BY booking_date DESC;

-- Check unsourced items
SELECT 
    b.booking_reference,
    p.name as product_name,
    bi.service_date_from,
    bi.is_sourced
FROM booking_items bi
JOIN bookings b ON bi.booking_id = b.id
JOIN products p ON bi.product_id = p.id
WHERE bi.is_sourced = false
ORDER BY b.booking_reference;