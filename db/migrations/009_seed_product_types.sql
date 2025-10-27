-- Migration: Seed Product Types (Accommodation, Event, Transfer, Transport, Experience, Extra)
-- Based on PRODUCT_TYPES_GUIDE.md

-- Insert the 6 product types
INSERT INTO product_types (type_code, type_name, description, icon, is_active) VALUES
(
  'accommodation', 
  'Accommodation', 
  'Hotels, apartments, villas, and lodging. Complex pricing with occupancy variations, contracted allocations, and inventory management.',
  'bed',
  true
),
(
  'event', 
  'Event Tickets', 
  'Race tickets, grandstand seats, paddock passes. Simple per-unit pricing with batch inventory allocations.',
  'ticket',
  true
),
(
  'transfer', 
  'Transfers', 
  'Airport transfers, circuit shuttles, ground transport. On-request products with no inventory, priced per booking or per vehicle.',
  'car',
  true
),
(
  'transport', 
  'Transport', 
  'Flights, trains, ferries. Dynamic products with generic catalog entries and specific details in transport_segments. Quoted per customer, no inventory.',
  'plane',
  true
),
(
  'experience', 
  'Experiences', 
  'Tours, activities, yacht charters, helicopter rides. On-request products, typically priced per booking or per person, no inventory.',
  'compass',
  true
),
(
  'extra', 
  'Extras', 
  'Supplementary items and add-ons like lounge access, insurance, parking, merchandise. Simple products, typically on-request, high margins.',
  'package',
  true
)
ON CONFLICT (type_code) 
DO UPDATE SET
  type_name = EXCLUDED.type_name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = true;

-- Comments for documentation
COMMENT ON TABLE product_types IS 'Product types define the category and behavior of products (accommodation, events, transfers, transport, experiences, extras)';
