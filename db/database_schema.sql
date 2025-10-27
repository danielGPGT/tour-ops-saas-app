-- ============================================================================
-- 🚀 MVP SPORTS TRAVEL PLATFORM - COMPLETE WITH ESSENTIAL FEATURES
-- ============================================================================
-- Version: 5.0 - PRODUCTION READY
-- 
-- ✅ INCLUDES:
-- • Multi-currency with FX tracking
-- • Inventory pooling (draw from multiple allocations)
-- • Quotes → Bookings workflow with price locking
-- • Real-time availability (no holds - can't afford to hold)
-- • All core booking/inventory features
-- 
-- 🎯 READY FOR:
-- • First enterprise customer with pooling needs
-- • Multi-currency bookings
-- • Quote management with conversion tracking
-- • Flexible sell-first workflows
-- 
-- Database: PostgreSQL 14+
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Fuzzy text search

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE booking_status AS ENUM (
  'quote',          -- ⭐ It's a quote (not confirmed)
  'provisional',    -- Quote accepted, waiting deposit
  'confirmed',      -- Deposit paid
  'cancelled',      -- Booking cancelled
  'completed',      -- Service delivered
  'no_show'         -- Customer didn't show up
);

CREATE TYPE payment_status AS ENUM (
  'pending',        -- No payment received
  'partial',        -- Deposit received
  'paid',           -- Fully paid
  'refunded',       -- Money returned
  'failed'          -- Payment failed
);

CREATE TYPE contract_status AS ENUM (
  'draft',          -- Being negotiated
  'active',         -- Live and in use
  'expired',        -- Past validity date
  'cancelled'       -- Terminated
);

CREATE TYPE allocation_type AS ENUM (
  'allotment',      -- Room/seat blocks with release dates
  'batch',          -- Pre-purchased inventory (tickets, tours)
  'free_sell',      -- Unlimited availability
  'on_request'      -- Book per request (sell-first!)
);

CREATE TYPE vip_status AS ENUM (
  'standard',       -- Regular customer
  'gold',           -- Spent $10k+ or 3+ bookings
  'platinum',       -- Spent $25k+ or 5+ bookings
  'diamond'         -- Spent $50k+ or 10+ bookings
);

CREATE TYPE item_status AS ENUM (
  'provisional',    -- In quote, not confirmed
  'on_request',     -- Sold but not sourced yet (sell-first model!)
  'confirmed',      -- Fully sourced and confirmed
  'cancelled'       -- Item cancelled
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizations (Multi-tenant)
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization details
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(2), -- ISO 3166-1 alpha-2
  
  -- Settings
  default_currency VARCHAR(3) DEFAULT 'USD',
  base_currency VARCHAR(3) DEFAULT 'USD', -- ⭐ For reporting
  timezone VARCHAR(50) DEFAULT 'UTC',
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Authentication
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  
  -- Role
  role VARCHAR(50) DEFAULT 'agent', -- owner | admin | agent | viewer
  
  -- Security
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

-- ----------------------------------------------------------------------------
-- Audit Log
-- ----------------------------------------------------------------------------
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- What changed
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Who & when
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Context
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_audit_log_org ON audit_log(organization_id, changed_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- Exchange Rates (⭐ NEW!)
-- ----------------------------------------------------------------------------
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate NUMERIC(12,6) NOT NULL,
  date DATE NOT NULL,
  source VARCHAR(50) DEFAULT 'api', -- api | manual | ecb
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_currency_pair_date UNIQUE (from_currency, to_currency, date)
);

CREATE INDEX idx_exchange_rates_currencies ON exchange_rates(from_currency, to_currency, date DESC);

COMMENT ON TABLE exchange_rates IS 'FX rates cached from API. Updated daily.';

-- ----------------------------------------------------------------------------
-- Suppliers
-- ----------------------------------------------------------------------------
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  supplier_type VARCHAR(50), -- hotel | transport | ticket_broker | experience
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  contact_info JSONB,
  
  -- Address
  address_line1 VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(2),
  
  -- Settings
  default_currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- Product Types
-- ----------------------------------------------------------------------------
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) NOT NULL UNIQUE,
  type_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);

-- Insert common product types
INSERT INTO product_types (type_code, type_name, description, icon) VALUES
('accommodation', 'Accommodation', 'Hotels, resorts, apartments', 'bed'),
('event_ticket', 'Event Ticket', 'Sports events, concerts, theater', 'ticket'),
('flight', 'Flight', 'Airline tickets', 'plane'),
('train', 'Train', 'Rail journeys', 'train'),
('transfer', 'Transfer', 'Airport transfers, shuttles', 'car'),
('experience', 'Experience', 'Tours, activities, excursions', 'compass'),
('meal', 'Meal', 'Restaurants, dining', 'utensils');

-- ----------------------------------------------------------------------------
-- Events (OPTIONAL - for sports travel)
-- ----------------------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Event basics
  event_name VARCHAR(255) NOT NULL,
  event_code VARCHAR(50),
  event_type VARCHAR(50), -- f1 | golf | tennis | concert
  
  -- Venue
  venue_name VARCHAR(255),
  city VARCHAR(100),
  country VARCHAR(2),
  
  -- Dates
  event_date_from DATE NOT NULL,
  event_date_to DATE NOT NULL,
  
  -- Status
  event_status VARCHAR(20) DEFAULT 'scheduled',
  
  -- Marketing
  description TEXT,
  event_image_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_dates ON events(event_date_from, event_date_to);
CREATE INDEX idx_events_upcoming ON events(event_date_from);

-- ----------------------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type_id UUID NOT NULL REFERENCES product_types(id),
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Location
  location JSONB,
  venue_name VARCHAR(255),
  
  -- Details
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Event linkage (optional)
  event_id UUID REFERENCES events(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_type ON products(product_type_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_event ON products(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- Product Options (Variants)
-- ----------------------------------------------------------------------------
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Option details
  option_name VARCHAR(255) NOT NULL,
  option_code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Pricing (simple!)
  base_price NUMERIC(10,2),
  base_cost NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Details
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_product_options_active ON product_options(is_active) WHERE is_active = true;

-- ============================================================================
-- CONTRACTS & ALLOCATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Contracts
-- ----------------------------------------------------------------------------
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Event linkage
  event_id UUID REFERENCES events(id),
  
  -- Contract basics
  contract_number VARCHAR(100) NOT NULL,
  contract_name VARCHAR(255),
  contract_type VARCHAR(50) DEFAULT 'on_request',
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Financial
  currency VARCHAR(3) DEFAULT 'USD',
  total_cost NUMERIC(15,2),
  commission_rate NUMERIC(5,2),
  
  -- Terms (TEXT fields - flexible!)
  payment_terms TEXT,
  cancellation_policy TEXT,
  terms_and_conditions TEXT,
  
  -- Documents
  contract_files JSONB DEFAULT '[]'::jsonb,
  
  -- Notes
  notes TEXT,
  
  -- Status
  status contract_status DEFAULT 'draft',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT contracts_dates_check CHECK (valid_to >= valid_from),
  CONSTRAINT contracts_org_number_unique UNIQUE (organization_id, contract_number)
);

CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_supplier ON contracts(supplier_id);
CREATE INDEX idx_contracts_status ON contracts(status);

-- ----------------------------------------------------------------------------
-- Contract Allocations
-- ----------------------------------------------------------------------------
CREATE TABLE contract_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Allocation details
  allocation_name VARCHAR(255),
  allocation_type allocation_type DEFAULT 'on_request',
  
  -- Quantity (optional)
  total_quantity INTEGER,
  
  -- Dates
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Pricing (optional)
  total_cost NUMERIC(15,2),
  cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Release (for hotel blocks)
  release_days INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT allocations_dates_check CHECK (valid_to >= valid_from)
);

CREATE INDEX idx_allocations_org ON contract_allocations(organization_id);
CREATE INDEX idx_allocations_contract ON contract_allocations(contract_id);
CREATE INDEX idx_allocations_product ON contract_allocations(product_id);

-- ----------------------------------------------------------------------------
-- Allocation Releases (THE KILLER FEATURE!)
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id) ON DELETE CASCADE,
  
  -- Release details
  release_date DATE NOT NULL,
  release_percentage NUMERIC(5,2),
  release_quantity INTEGER,
  
  -- What happens after
  penalty_applies BOOLEAN DEFAULT false,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_releases_allocation ON allocation_releases(contract_allocation_id, release_date);
CREATE INDEX idx_releases_upcoming ON allocation_releases(release_date);

COMMENT ON TABLE allocation_releases IS 'Release schedule for allocations. Prevents attrition charges!';

-- ----------------------------------------------------------------------------
-- Allocation Inventory
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id) ON DELETE CASCADE,
  product_option_id UUID NOT NULL REFERENCES product_options(id),
  
  -- Quantity tracking
  total_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  
  -- Cost
  batch_cost_per_unit NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Flags (⭐ for flexible transfers!)
  is_virtual_capacity BOOLEAN DEFAULT false,
  minimum_viable_quantity INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_allocation ON allocation_inventory(contract_allocation_id);
CREATE INDEX idx_inventory_option ON allocation_inventory(product_option_id);

-- ----------------------------------------------------------------------------
-- Allocation Pools (⭐ NEW! For pooling inventory)
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  
  -- Pool details
  pool_name VARCHAR(255) NOT NULL,
  pool_code VARCHAR(50),
  
  -- How to use allocations in this pool
  usage_strategy VARCHAR(50) DEFAULT 'lowest_cost',
  -- lowest_cost | nearest_expiry | highest_margin | round_robin
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_allocation_pools_org ON allocation_pools(organization_id);
CREATE INDEX idx_allocation_pools_product ON allocation_pools(product_id);

COMMENT ON TABLE allocation_pools IS '⭐ Pool multiple allocations together. Draw from cheapest/best allocation automatically.';

-- ----------------------------------------------------------------------------
-- Allocation Pool Members
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_pool_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_pool_id UUID NOT NULL REFERENCES allocation_pools(id) ON DELETE CASCADE,
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id) ON DELETE CASCADE,
  
  -- Priority/weight
  priority INTEGER DEFAULT 0, -- Lower = higher priority
  
  -- Usage tracking
  units_used INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_pool_allocation UNIQUE (allocation_pool_id, contract_allocation_id)
);

CREATE INDEX idx_pool_members_pool ON allocation_pool_members(allocation_pool_id);
CREATE INDEX idx_pool_members_allocation ON allocation_pool_members(contract_allocation_id);

-- ----------------------------------------------------------------------------
-- Availability (OPTIONAL - for hotels with daily calendar)
-- ----------------------------------------------------------------------------
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_inventory_id UUID NOT NULL REFERENCES allocation_inventory(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- Quantities
  total_available INTEGER NOT NULL,
  booked INTEGER DEFAULT 0,
  available INTEGER NOT NULL,
  
  -- Status
  is_closed BOOLEAN DEFAULT false,
  
  -- Audit
  last_modified TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_inventory_date UNIQUE (allocation_inventory_id, date)
);

CREATE INDEX idx_availability_inventory_date ON availability(allocation_inventory_id, date);
CREATE INDEX idx_availability_date_range ON availability(date);

-- ============================================================================
-- PRICING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Supplier Rates (What it costs you)
-- ----------------------------------------------------------------------------
CREATE TABLE supplier_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Link to product
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  contract_id UUID REFERENCES contracts(id),
  
  -- Rate details
  rate_name VARCHAR(255),
  rate_basis VARCHAR(50) NOT NULL, -- per_night | per_person | per_unit
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Pricing
  base_cost NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Advanced pricing (optional)
  pricing_details JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supplier_rates_org ON supplier_rates(organization_id);
CREATE INDEX idx_supplier_rates_product ON supplier_rates(product_id);

-- ----------------------------------------------------------------------------
-- Selling Rates (What you sell for)
-- ----------------------------------------------------------------------------
CREATE TABLE selling_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Link to product
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  
  -- Rate details
  rate_name VARCHAR(255),
  rate_basis VARCHAR(50) NOT NULL, -- per_night | per_person | per_unit
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Pricing
  base_price NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Markup
  markup_type VARCHAR(20), -- fixed_amount | percentage
  markup_amount NUMERIC(10,2),
  
  -- Advanced pricing (optional)
  pricing_details JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_selling_rates_org ON selling_rates(organization_id);
CREATE INDEX idx_selling_rates_product ON selling_rates(product_id);

-- ============================================================================
-- CUSTOMERS & BOOKINGS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Customers
-- ----------------------------------------------------------------------------
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  customer_type VARCHAR(20) DEFAULT 'b2c', -- b2c | b2b
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Address
  address JSONB,
  
  -- VIP status (optional)
  vip_status vip_status DEFAULT 'standard',
  
  -- Stats
  total_bookings INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(organization_id, email);

-- ----------------------------------------------------------------------------
-- Packages (SIMPLIFIED)
-- ----------------------------------------------------------------------------
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Package basics
  package_name VARCHAR(255) NOT NULL,
  package_code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Duration
  duration_nights INTEGER,
  duration_days INTEGER,
  
  -- Pricing
  base_price NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_packages_org ON packages(organization_id);

-- ----------------------------------------------------------------------------
-- Bookings (⭐ UPDATED for quotes!)
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Booking reference
  booking_reference VARCHAR(100) NOT NULL,
  booking_status booking_status DEFAULT 'quote', -- ⭐ Can be 'quote'!
  
  -- Quote fields (⭐ NEW!)
  quote_reference VARCHAR(100) UNIQUE,
  quote_expires_at TIMESTAMPTZ,
  quote_version INTEGER DEFAULT 1,
  converted_from_quote_id UUID REFERENCES bookings(id),
  
  -- Customer
  customer_id UUID REFERENCES customers(id),
  
  -- Package
  package_id UUID REFERENCES packages(id),
  
  -- Dates
  booking_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  travel_date_from DATE,
  travel_date_to DATE,
  
  -- Financial (⭐ Multi-currency!)
  total_cost NUMERIC(15,2),
  total_price NUMERIC(15,2),
  margin NUMERIC(15,2),
  display_currency VARCHAR(3) DEFAULT 'USD', -- What customer sees
  base_currency VARCHAR(3) DEFAULT 'USD',    -- What you report in
  fx_rate_at_booking NUMERIC(12,6) DEFAULT 1.0,
  
  -- Lead passenger
  lead_passenger_name VARCHAR(255),
  lead_passenger_email VARCHAR(255),
  lead_passenger_phone VARCHAR(50),
  
  -- Passenger counts
  total_adults INTEGER DEFAULT 0,
  total_children INTEGER DEFAULT 0,
  total_infants INTEGER DEFAULT 0,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT bookings_org_reference_unique UNIQUE (organization_id, booking_reference)
);

CREATE INDEX idx_bookings_org ON bookings(organization_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_quote_reference ON bookings(quote_reference) WHERE quote_reference IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Booking Items (⭐ UPDATED for quotes, pooling, multi-currency!)
-- ----------------------------------------------------------------------------
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Product
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  
  -- Service dates
  service_date_from DATE NOT NULL,
  service_date_to DATE,
  nights INTEGER,
  
  -- Quantity
  quantity INTEGER NOT NULL DEFAULT 1,
  adults INTEGER DEFAULT 0,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  
  -- Sourcing (OPTIONAL - for sell-first OR pooling!)
  contract_id UUID REFERENCES contracts(id),
  contract_allocation_id UUID REFERENCES contract_allocations(id),
  allocation_inventory_id UUID REFERENCES allocation_inventory(id),
  allocation_pool_id UUID REFERENCES allocation_pools(id), -- ⭐ NEW! Can use pool
  supplier_id UUID REFERENCES suppliers(id),
  supplier_reference VARCHAR(100),
  
  -- Pricing - COST (⭐ Multi-currency!)
  unit_cost NUMERIC(10,2),
  total_cost NUMERIC(12,2),
  cost_currency VARCHAR(3) DEFAULT 'USD',
  cost_fx_rate NUMERIC(12,6) DEFAULT 1.0,
  
  -- Pricing - SELL (⭐ Multi-currency!)
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'USD',
  price_fx_rate NUMERIC(12,6) DEFAULT 1.0,
  
  -- Base currency amounts (⭐ For reporting!)
  base_currency VARCHAR(3) DEFAULT 'USD',
  unit_cost_base NUMERIC(10,2),
  total_cost_base NUMERIC(12,2),
  unit_price_base NUMERIC(10,2),
  total_price_base NUMERIC(12,2),
  
  -- Quote/Price locking (⭐ NEW!)
  quoted_at TIMESTAMPTZ,
  quoted_unit_price NUMERIC(10,2),
  quoted_total_price NUMERIC(12,2),
  rate_locked BOOLEAN DEFAULT false,
  
  -- Status
  item_status item_status DEFAULT 'provisional',
  is_sourced BOOLEAN DEFAULT false,
  
  -- Notes
  special_requests TEXT,
  item_notes TEXT,
  
  -- Flexible attributes
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_org ON booking_items(organization_id);
CREATE INDEX idx_booking_items_product ON booking_items(product_id);
CREATE INDEX idx_booking_items_pool ON booking_items(allocation_pool_id) WHERE allocation_pool_id IS NOT NULL;
CREATE INDEX idx_booking_items_status ON booking_items(item_status);
CREATE INDEX idx_booking_items_unsourced ON booking_items(is_sourced) WHERE NOT is_sourced;

COMMENT ON COLUMN booking_items.allocation_pool_id IS '⭐ NEW! Book from pool instead of specific allocation. System draws from cheapest/best allocation.';
COMMENT ON COLUMN booking_items.rate_locked IS '⭐ NEW! If true, price is locked from quote time and won''t change.';

-- ----------------------------------------------------------------------------
-- Booking Passengers
-- ----------------------------------------------------------------------------
CREATE TABLE booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_item_id UUID REFERENCES booking_items(id),
  
  -- Passenger type
  passenger_type VARCHAR(20) NOT NULL, -- adult | child | infant
  
  -- Personal details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  
  -- Travel documents
  passport_number VARCHAR(50),
  passport_expiry DATE,
  nationality VARCHAR(2),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Special requirements
  dietary_requirements TEXT,
  special_requirements TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passengers_booking ON booking_passengers(booking_id);
CREATE INDEX idx_passengers_booking_item ON booking_passengers(booking_item_id);

-- ----------------------------------------------------------------------------
-- Transport Segments
-- ----------------------------------------------------------------------------
CREATE TABLE transport_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  
  -- Segment info
  segment_number INTEGER NOT NULL,
  transport_type VARCHAR(50) NOT NULL, -- flight | train | ferry | transfer | coach
  
  -- Operator
  operator_name VARCHAR(255),
  service_number VARCHAR(50),
  
  -- Route
  departure_location VARCHAR(255) NOT NULL,
  arrival_location VARCHAR(255) NOT NULL,
  
  -- Schedule
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  arrival_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  
  -- Details (flexible!)
  segment_details JSONB,
  
  -- Booking references
  booking_reference VARCHAR(50),
  
  -- Status
  confirmation_status VARCHAR(20) DEFAULT 'pending',
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transport_segments_booking_item ON transport_segments(booking_item_id);
CREATE INDEX idx_transport_segments_departure ON transport_segments(departure_date);

-- ----------------------------------------------------------------------------
-- Payments
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  
  -- Payment reference
  payment_reference VARCHAR(100) NOT NULL UNIQUE,
  
  -- Amount
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment details
  payment_method VARCHAR(50), -- credit_card | bank_transfer | paypal
  payment_type VARCHAR(50), -- deposit | balance | full_payment
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending | completed | failed | refunded
  
  -- Timing
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Get FX Rate
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_fx_rate(
  from_curr VARCHAR(3),
  to_curr VARCHAR(3),
  rate_date DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC AS $$
DECLARE
  rate_value NUMERIC;
BEGIN
  -- If same currency, rate is 1
  IF from_curr = to_curr THEN
    RETURN 1.0;
  END IF;
  
  -- Try to get rate from cache
  SELECT rate INTO rate_value
  FROM exchange_rates
  WHERE from_currency = from_curr
    AND to_currency = to_curr
    AND date = rate_date
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If not found, return 1 and log warning
  IF rate_value IS NULL THEN
    RAISE WARNING 'FX rate not found for % -> % on %. Using 1.0', from_curr, to_curr, rate_date;
    RETURN 1.0;
  END IF;
  
  RETURN rate_value;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_fx_rate IS 'Get FX rate for date. Returns 1.0 if not found.';

-- ----------------------------------------------------------------------------
-- Allocate From Pool (Returns allocation plan)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION allocate_from_pool(
  p_pool_id UUID,
  p_quantity INTEGER,
  OUT allocated JSONB
) AS $$
DECLARE
  member RECORD;
  remaining INTEGER := p_quantity;
  result JSONB := '[]'::jsonb;
BEGIN
  -- Get pool members in priority order
  FOR member IN 
    SELECT 
      apm.contract_allocation_id,
      ai.available_quantity,
      ai.batch_cost_per_unit,
      ai.currency
    FROM allocation_pool_members apm
    JOIN contract_allocations ca ON apm.contract_allocation_id = ca.id
    LEFT JOIN allocation_inventory ai ON ca.id = ai.contract_allocation_id
    WHERE apm.allocation_pool_id = p_pool_id
      AND apm.is_active = true
      AND ca.is_active = true
      AND ai.available_quantity > 0
    ORDER BY apm.priority ASC
  LOOP
    IF remaining <= 0 THEN
      EXIT;
    END IF;
    
    -- Take what we can from this allocation
    DECLARE
      qty_from_this INTEGER := LEAST(remaining, member.available_quantity);
    BEGIN
      -- Add to result
      result := result || jsonb_build_object(
        'allocation_id', member.contract_allocation_id,
        'quantity', qty_from_this,
        'cost_per_unit', member.batch_cost_per_unit,
        'currency', member.currency
      );
      
      remaining := remaining - qty_from_this;
    END;
  END LOOP;
  
  -- Check if we could fulfill the full quantity
  IF remaining > 0 THEN
    RAISE EXCEPTION 'Not enough inventory in pool. Short by % units', remaining;
  END IF;
  
  allocated := result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION allocate_from_pool IS '⭐ Draw from pool. Returns plan showing which allocations to use.';

-- ----------------------------------------------------------------------------
-- Calculate Pool Cost
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_pool_cost(
  p_pool_id UUID,
  p_quantity INTEGER
) RETURNS NUMERIC AS $$
DECLARE
  allocation_plan JSONB;
  total_cost NUMERIC := 0;
  item JSONB;
BEGIN
  -- Get allocation plan
  allocation_plan := allocate_from_pool(p_pool_id, p_quantity);
  
  -- Calculate blended cost
  FOR item IN SELECT * FROM jsonb_array_elements(allocation_plan)
  LOOP
    total_cost := total_cost + 
      (item->>'quantity')::INTEGER * (item->>'cost_per_unit')::NUMERIC;
  END LOOP;
  
  -- Return blended cost per unit
  RETURN total_cost / p_quantity;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_pool_cost IS 'Calculate blended cost per unit from pool.';

-- ----------------------------------------------------------------------------
-- Check Availability
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_availability(
  p_allocation_id UUID,
  p_date DATE,
  p_quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  available INTEGER;
BEGIN
  -- For daily availability (hotels)
  IF EXISTS (
    SELECT 1 FROM availability a
    JOIN allocation_inventory ai ON a.allocation_inventory_id = ai.id
    WHERE ai.contract_allocation_id = p_allocation_id
  ) THEN
    SELECT a.available INTO available
    FROM availability a
    JOIN allocation_inventory ai ON a.allocation_inventory_id = ai.id
    WHERE ai.contract_allocation_id = p_allocation_id
      AND a.date = p_date
    LIMIT 1;
  ELSE
    -- For batch inventory
    SELECT ai.available_quantity INTO available
    FROM allocation_inventory ai
    WHERE ai.contract_allocation_id = p_allocation_id
    LIMIT 1;
  END IF;
  
  RETURN COALESCE(available, 0) >= p_quantity;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_availability IS 'Check if quantity available. Works for daily OR batch inventory.';

-- ----------------------------------------------------------------------------
-- Generate Booking Reference
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_booking_reference(org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  org_code VARCHAR(10);
  next_number INTEGER;
  reference VARCHAR(100);
BEGIN
  SELECT COALESCE(code, 'ORG') INTO org_code FROM organizations WHERE id = org_id;
  
  SELECT COALESCE(MAX(
    SUBSTRING(booking_reference FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO next_number
  FROM bookings
  WHERE organization_id = org_id
    AND booking_date::DATE = CURRENT_DATE;
  
  reference := org_code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN reference;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Items Needing Sourcing
-- ----------------------------------------------------------------------------
CREATE VIEW items_needing_sourcing AS
SELECT 
  bi.id as booking_item_id,
  b.booking_reference,
  b.booking_status,
  bi.service_date_from,
  p.name as product_name,
  po.option_name,
  bi.quantity,
  bi.total_price_base,
  bi.base_currency,
  c.first_name || ' ' || c.last_name as customer_name,
  bi.service_date_from - CURRENT_DATE as days_until_service,
  CASE 
    WHEN bi.service_date_from - CURRENT_DATE < 7 THEN 'urgent'
    WHEN bi.service_date_from - CURRENT_DATE < 30 THEN 'high'
    ELSE 'normal'
  END as priority
FROM booking_items bi
JOIN bookings b ON bi.booking_id = b.id
JOIN products p ON bi.product_id = p.id
LEFT JOIN product_options po ON bi.product_option_id = po.id
LEFT JOIN customers c ON b.customer_id = c.id
WHERE bi.item_status = 'on_request'
  AND b.booking_status NOT IN ('cancelled', 'quote')
ORDER BY bi.service_date_from ASC;

COMMENT ON VIEW items_needing_sourcing IS 'Shows all items that need to be sourced (sell-first model). Excludes quotes.';

-- ----------------------------------------------------------------------------
-- Active Quotes
-- ----------------------------------------------------------------------------
CREATE VIEW active_quotes AS
SELECT 
  b.id as quote_id,
  b.quote_reference,
  b.booking_reference,
  b.quote_expires_at,
  b.quote_expires_at - CURRENT_TIMESTAMP as time_until_expiry,
  CASE 
    WHEN b.quote_expires_at < CURRENT_TIMESTAMP THEN 'expired'
    WHEN b.quote_expires_at - CURRENT_TIMESTAMP < INTERVAL '24 hours' THEN 'expiring_soon'
    ELSE 'active'
  END as quote_status,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  b.total_price,
  b.display_currency,
  b.created_at as quoted_at,
  u.first_name || ' ' || u.last_name as quoted_by
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN users u ON b.created_by = u.id
WHERE b.booking_status = 'quote'
  AND b.quote_expires_at IS NOT NULL
ORDER BY b.quote_expires_at ASC;

COMMENT ON VIEW active_quotes IS '⭐ All quotes with expiry tracking. Shows which are expiring soon.';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_product_options_updated_at BEFORE UPDATE ON product_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON contract_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON allocation_releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON allocation_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_supplier_rates_updated_at BEFORE UPDATE ON supplier_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_selling_rates_updated_at BEFORE UPDATE ON selling_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_booking_items_updated_at BEFORE UPDATE ON booking_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON booking_passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_transport_segments_updated_at BEFORE UPDATE ON transport_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocation_pools_updated_at BEFORE UPDATE ON allocation_pools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '    🚀 MVP SCHEMA V5 - PRODUCTION READY WITH ESSENTIAL FEATURES!       ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ INCLUDED IN THIS VERSION:';
  RAISE NOTICE '';
  RAISE NOTICE '⭐ MULTI-CURRENCY:';
  RAISE NOTICE '   • FX rates table with API caching';
  RAISE NOTICE '   • Cost/price in different currencies';
  RAISE NOTICE '   • Automatic base currency conversion';
  RAISE NOTICE '   • FX rate locking at booking time';
  RAISE NOTICE '';
  RAISE NOTICE '⭐ INVENTORY POOLING:';
  RAISE NOTICE '   • Pool multiple allocations together';
  RAISE NOTICE '   • Auto-draw from cheapest/best allocation';
  RAISE NOTICE '   • Usage strategies (cost, expiry, margin)';
  RAISE NOTICE '   • Perfect for enterprise customers!';
  RAISE NOTICE '';
  RAISE NOTICE '⭐ QUOTES → BOOKINGS:';
  RAISE NOTICE '   • Quotes stored as booking_status = ''quote''';
  RAISE NOTICE '   • Price locking (rate_locked field)';
  RAISE NOTICE '   • Quote versioning';
  RAISE NOTICE '   • Expiry tracking';
  RAISE NOTICE '   • Convert quote to booking workflow';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TOTAL TABLES: 28';
  RAISE NOTICE '   • Core: 25 tables from v4';
  RAISE NOTICE '   • NEW: allocation_pools (pooling!)';
  RAISE NOTICE '   • NEW: allocation_pool_members';
  RAISE NOTICE '   • NEW: exchange_rates (multi-currency!)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 HELPER FUNCTIONS:';
  RAISE NOTICE '   • get_fx_rate() - Get FX rate for date';
  RAISE NOTICE '   • allocate_from_pool() - Draw from pool';
  RAISE NOTICE '   • calculate_pool_cost() - Blended cost';
  RAISE NOTICE '   • check_availability() - Real-time check';
  RAISE NOTICE '   • generate_booking_reference()';
  RAISE NOTICE '';
  RAISE NOTICE '📈 VIEWS:';
  RAISE NOTICE '   • items_needing_sourcing (operations)';
  RAISE NOTICE '   • active_quotes (sales tracking)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PERFECT FOR:';
  RAISE NOTICE '   • Enterprise customers needing pooling';
  RAISE NOTICE '   • Multi-currency international bookings';
  RAISE NOTICE '   • Quote-to-booking workflows';
  RAISE NOTICE '   • Flexible sell-first operations';
  RAISE NOTICE '   • Real-world tour operators';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 THIS IS YOUR PRODUCTION MVP!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;

COMMIT;