-- ============================================================================
-- ULTIMATE DATABASE SCHEMA: Sports & Luxury Travel Platform
-- ============================================================================
-- Version: 2.0 - COMPLETE & ENHANCED
-- 
-- Purpose: Complete tour operator platform optimized for sports & luxury travel
-- 
-- Features:
-- ✅ Multi-tenant organizations
-- ✅ Contract management (4 entry modes: allocation, batch, series, on-request)
-- ✅ Release schedules (attrition management - $50k+ annual savings!)
-- ✅ Batch inventory tracking (tickets, experiences)
-- ✅ Supplier & Selling rate tables (dynamic pricing)
-- ✅ Events catalog (F1, Golf, Tennis, Rugby)
-- ✅ Customer VIP tiers (gold, platinum, diamond)
-- ✅ Sell-first, source-later model support
-- ✅ Package management with templates
-- ✅ Comprehensive booking system
-- ✅ Payment tracking (supplier + customer)
-- ✅ Passenger manifests
-- ✅ Real-time availability
-- ✅ Powerful reporting views
-- ✅ Helper functions
-- 
-- Database: PostgreSQL 14+
-- ============================================================================

BEGIN;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For encryption if needed

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

CREATE TYPE booking_status AS ENUM (
  'provisional',    -- Inquiry/quote stage
  'confirmed',      -- Customer confirmed and paid deposit
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
  'cancelled',      -- Terminated early
  'terminated',     -- Ended by mutual agreement
  'suspended'       -- Temporarily paused
);

CREATE TYPE allocation_type AS ENUM (
  'allotment',      -- Room/seat blocks with release dates
  'batch',          -- Pre-purchased inventory (tickets, tours)
  'free_sell',      -- Unlimited availability
  'on_request'      -- Book per request
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
  legal_name VARCHAR(255),
  code VARCHAR(50) UNIQUE,
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2), -- ISO 3166-1 alpha-2
  
  -- Business details
  business_type VARCHAR(50), -- tour_operator | dmc | travel_agency | hotel | venue
  tax_id VARCHAR(100),
  business_registration VARCHAR(100),
  
  -- Settings
  default_currency VARCHAR(3) DEFAULT 'USD', -- ISO 4217
  timezone VARCHAR(50) DEFAULT 'UTC',
  date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
  time_format VARCHAR(20) DEFAULT 'HH24:MI',
  logo_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Features enabled
  features_enabled JSONB DEFAULT '{
    "contracts": true,
    "inventory": true,
    "bookings": true,
    "packages": true,
    "events": true,
    "rates": false,
    "api_access": false
  }'::jsonb,
  
  -- Subscription
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'starter', -- starter | professional | enterprise
  subscription_expires_at TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5,
  max_bookings_per_month INTEGER DEFAULT 100,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_active ON organizations(is_active) WHERE is_active = true;
CREATE INDEX idx_organizations_business_type ON organizations(business_type);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations. Each organization is a separate tour operator/travel company.';
COMMENT ON COLUMN organizations.features_enabled IS 'JSONB object controlling which features this organization can access';

-- ----------------------------------------------------------------------------
-- Users
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Authentication
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255),
  auth_provider VARCHAR(50) DEFAULT 'local', -- local | google | microsoft | saml
  auth_provider_id VARCHAR(255),
  
  -- Profile
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar_url TEXT,
  
  -- Role & permissions
  role VARCHAR(50) DEFAULT 'user', -- admin | manager | agent | viewer
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of permission strings
  
  -- Settings
  preferences JSONB DEFAULT '{}'::jsonb,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50),
  notification_preferences JSONB DEFAULT '{
    "email": true,
    "sms": false,
    "push": true,
    "release_alerts": true,
    "booking_updates": true,
    "payment_reminders": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(45),
  
  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_reset_token VARCHAR(255),
  password_reset_expires_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role);

COMMENT ON TABLE users IS 'Platform users. Each user belongs to one organization.';
COMMENT ON COLUMN users.permissions IS 'Array of specific permissions like ["contracts.create", "bookings.edit", "reports.view"]';

-- ----------------------------------------------------------------------------
-- Invitations (Organization-based signup)
-- ----------------------------------------------------------------------------
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Invitation details
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user', -- admin | manager | user
  token VARCHAR(255) NOT NULL UNIQUE,
  
  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Usage tracking
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT invitations_email_org_unique UNIQUE (email, organization_id),
  CONSTRAINT invitations_expires_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_invitations_org ON invitations(organization_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires ON invitations(expires_at) WHERE used_at IS NULL;

COMMENT ON TABLE invitations IS 'Organization-based invitation system. Users can only sign up with a valid invitation token.';
COMMENT ON COLUMN invitations.token IS 'Unique invitation token. Used in signup URLs.';
COMMENT ON COLUMN invitations.expires_at IS 'Invitation expiration timestamp. Default 7 days from creation.';

-- ----------------------------------------------------------------------------
-- Suppliers
-- ----------------------------------------------------------------------------
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  supplier_type VARCHAR(50), -- hotel | venue | transport | ticket_broker | experience | golf_course | restaurant
  
  -- Contact
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  location JSONB, -- { lat, lng, city, country, region }
  
  -- Business details
  tax_id VARCHAR(100),
  business_registration VARCHAR(100),
  payment_terms TEXT,
  credit_limit NUMERIC(15,2),
  current_balance NUMERIC(15,2) DEFAULT 0,
  default_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Banking (encrypted in production!)
  bank_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_swift_code VARCHAR(50),
  bank_iban VARCHAR(50),
  
  -- Relationships
  account_manager_id UUID REFERENCES users(id),
  parent_supplier_id UUID REFERENCES suppliers(id), -- For supplier groups/chains
  supplier_rating NUMERIC(3,2) CHECK (supplier_rating >= 0 AND supplier_rating <= 5),
  
  -- Settings
  is_preferred BOOLEAN DEFAULT false,
  requires_po BOOLEAN DEFAULT false, -- Purchase order required?
  auto_confirm_bookings BOOLEAN DEFAULT false,
  tags TEXT[],
  notes TEXT,
  internal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_active ON suppliers(is_active) WHERE is_active = true;
CREATE INDEX idx_suppliers_preferred ON suppliers(is_preferred) WHERE is_preferred = true;
CREATE INDEX idx_suppliers_name_trgm ON suppliers USING gin(name gin_trgm_ops);
CREATE INDEX idx_suppliers_location ON suppliers USING gin(location);

COMMENT ON TABLE suppliers IS 'Supplier database. Hotels, venues, transport companies, ticket brokers, experiences, etc.';
COMMENT ON COLUMN suppliers.supplier_type IS 'Type of supplier: hotel, venue, transport, ticket_broker, experience, golf_course, restaurant, etc.';

-- ----------------------------------------------------------------------------
-- Product Types
-- ----------------------------------------------------------------------------
CREATE TABLE product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code VARCHAR(50) NOT NULL UNIQUE,
  type_name VARCHAR(255) NOT NULL,
  description TEXT,
  schema_definition JSONB, -- Define custom fields for this product type
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_types_code ON product_types(type_code);
CREATE INDEX idx_product_types_active ON product_types(is_active) WHERE is_active = true;

COMMENT ON TABLE product_types IS 'Product type definitions with custom field schemas';
COMMENT ON COLUMN product_types.schema_definition IS 'JSONB schema defining fields for this product type';

-- Insert default product types
INSERT INTO product_types (type_code, type_name, description, schema_definition, icon) VALUES
('accommodation', 'Accommodation', 'Hotels, resorts, apartments, villas', '{
  "fields": {
    "room_type": "text",
    "bed_configuration": "text",
    "max_occupancy": "number",
    "board_basis": ["room_only", "breakfast", "half_board", "full_board", "all_inclusive"],
    "amenities": "array",
    "floor": "number",
    "view": ["sea", "city", "garden", "pool", "mountain"]
  }
}'::jsonb, 'bed'),

('event_ticket', 'Event Ticket', 'Sports event tickets, concert tickets, theater', '{
  "fields": {
    "ticket_type": ["general_admission", "grandstand", "paddock_club", "vip", "hospitality", "box"],
    "seat_location": "text",
    "section": "text",
    "row": "text",
    "seat_number": "text",
    "includes_hospitality": "boolean",
    "session_access": ["practice", "qualifying", "race", "all_sessions"]
  }
}'::jsonb, 'ticket'),

('golf_round', 'Golf Round', 'Golf tee times and rounds', '{
  "fields": {
    "course_name": "text",
    "holes": [9, 18],
    "tee_time_type": ["guaranteed", "request", "standby"],
    "tee_time": "time",
    "includes_caddy": "boolean",
    "includes_cart": "boolean",
    "dress_code": "text",
    "handicap_required": "boolean",
    "max_handicap": "number"
  }
}'::jsonb, 'golf-ball'),

('transfer', 'Transfer', 'Airport transfers, private transport, shuttles', '{
  "fields": {
    "vehicle_type": ["sedan", "suv", "van", "coach", "luxury", "limousine"],
    "max_passengers": "number",
    "max_luggage": "number",
    "includes_meet_greet": "boolean",
    "pickup_location": "text",
    "dropoff_location": "text",
    "distance_km": "number",
    "duration_minutes": "number"
  }
}'::jsonb, 'car'),

('experience', 'Experience', 'Tours, activities, excursions, sightseeing', '{
  "fields": {
    "duration_hours": "number",
    "difficulty_level": ["easy", "moderate", "challenging", "extreme"],
    "max_group_size": "number",
    "min_age": "number",
    "includes_guide": "boolean",
    "includes_meal": "boolean",
    "includes_equipment": "boolean",
    "fitness_required": "text",
    "languages": "array"
  }
}'::jsonb, 'compass'),

('premium_experience', 'Premium Experience', 'VIP experiences, meet & greets, exclusive access', '{
  "fields": {
    "experience_type": ["paddock_tour", "meet_greet", "pit_lane_walk", "team_garage", "behind_scenes"],
    "duration_minutes": "number",
    "max_group_size": "number",
    "requires_escort": "boolean",
    "photo_opportunities": "boolean",
    "exclusive_access": "boolean"
  }
}'::jsonb, 'star'),

('meal', 'Meal', 'Restaurants, dining experiences', '{
  "fields": {
    "meal_type": ["breakfast", "brunch", "lunch", "dinner", "afternoon_tea"],
    "cuisine": "text",
    "dress_code": "text",
    "michelin_stars": "number",
    "includes_drinks": "boolean",
    "dietary_options": "array",
    "private_dining": "boolean"
  }
}'::jsonb, 'utensils');

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
  code VARCHAR(100),
  description TEXT,
  short_description TEXT,
  
  -- Classification
  category VARCHAR(100),
  subcategory VARCHAR(100),
  tags TEXT[],
  
  -- Location
  location JSONB, -- { city, country, region, lat, lng, address }
  venue_name VARCHAR(255),
  
  -- Details (product-type specific attributes)
  attributes JSONB DEFAULT '{}'::jsonb,
  inclusions TEXT[],
  exclusions TEXT[],
  requirements TEXT[],
  terms_and_conditions TEXT,
  
  -- Capacity & availability
  max_capacity INTEGER,
  min_capacity INTEGER,
  capacity_note TEXT,
  
  -- Media
  media JSONB DEFAULT '[]'::jsonb, -- [{ type, url, title, caption, is_primary, sort_order }]
  thumbnail_url TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255),
  
  -- Settings
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Event linkage (for sports travel)
  event_id UUID, -- References events(id) - added later
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_products_org ON products(organization_id);
CREATE INDEX idx_products_type ON products(product_type_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_event ON products(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_products_active ON products(is_active, is_public) WHERE is_active = true;
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_products_location ON products USING gin(location);

COMMENT ON TABLE products IS 'Product catalog. Hotels, tickets, transfers, experiences, golf rounds, etc.';
COMMENT ON COLUMN products.attributes IS 'Product-type specific attributes matching the schema in product_types.schema_definition';

-- ----------------------------------------------------------------------------
-- Product Options (Variants)
-- ----------------------------------------------------------------------------
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Option details
  option_name VARCHAR(255) NOT NULL,
  option_code VARCHAR(100),
  description TEXT,
  
  -- Pricing (base - can be overridden by rates)
  base_price NUMERIC(10,2),
  base_cost NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Attributes (option-specific)
  attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Inclusions for this specific option
  inclusions TEXT[],
  
  -- Capacity
  max_capacity INTEGER,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_product_options_active ON product_options(is_active) WHERE is_active = true;
CREATE UNIQUE INDEX idx_product_options_default ON product_options(product_id) WHERE is_default = true;

COMMENT ON TABLE product_options IS 'Product variants/options. Examples: room types, ticket sections, tee times';

-- ============================================================================
-- EVENTS TABLES (Sports Travel)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Event Series (Recurring events)
-- ----------------------------------------------------------------------------
CREATE TABLE event_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Series info
  series_name VARCHAR(255) NOT NULL,
  series_code VARCHAR(50) UNIQUE,
  event_type VARCHAR(50) NOT NULL, -- f1 | golf | tennis | rugby | motogp | cricket | etc
  sport VARCHAR(50), -- Formula 1 | Golf | Tennis
  competition VARCHAR(100), -- FIA Formula 1 World Championship
  
  -- Venue (typically same each year)
  venue_name VARCHAR(255),
  venue_location JSONB, -- { city, country, region, lat, lng }
  
  -- Timing patterns
  typical_month INTEGER, -- 5 for May
  typical_week_of_month INTEGER, -- 3 for third week
  typical_duration_days INTEGER, -- 4 days
  
  -- Template for creating annual events
  event_template JSONB DEFAULT '{}'::jsonb,
  
  -- Media
  logo_url TEXT,
  banner_url TEXT,
  
  -- Settings
  is_premium BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_series_code ON event_series(series_code);
CREATE INDEX idx_event_series_type ON event_series(event_type);
CREATE INDEX idx_event_series_sport ON event_series(sport);
CREATE INDEX idx_event_series_active ON event_series(is_active) WHERE is_active = true;

COMMENT ON TABLE event_series IS 'Recurring sporting events. Monaco GP happens every year, track it as a series.';

-- Pre-populate event series
INSERT INTO event_series (series_name, series_code, event_type, sport, competition, venue_name, venue_location, typical_month, typical_duration_days) VALUES
-- F1
('Monaco Grand Prix', 'F1-MON', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Circuit de Monaco', '{"city": "Monte Carlo", "country": "Monaco", "region": "Europe"}'::jsonb, 5, 4),
('Singapore Grand Prix', 'F1-SIN', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Marina Bay Street Circuit', '{"city": "Singapore", "country": "Singapore", "region": "Asia"}'::jsonb, 9, 3),
('British Grand Prix', 'F1-GBR', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Silverstone Circuit', '{"city": "Silverstone", "country": "United Kingdom", "region": "Europe"}'::jsonb, 7, 3),
('Abu Dhabi Grand Prix', 'F1-ABU', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Yas Marina Circuit', '{"city": "Abu Dhabi", "country": "UAE", "region": "Middle East"}'::jsonb, 11, 3),
('Belgian Grand Prix', 'F1-BEL', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Circuit de Spa-Francorchamps', '{"city": "Spa", "country": "Belgium", "region": "Europe"}'::jsonb, 7, 3),
('Italian Grand Prix', 'F1-ITA', 'f1', 'Formula 1', 'FIA Formula 1 World Championship', 'Autodromo Nazionale di Monza', '{"city": "Monza", "country": "Italy", "region": "Europe"}'::jsonb, 9, 3),

-- Golf
('The Masters', 'GOLF-MASTERS', 'golf', 'Golf', 'Major Championship', 'Augusta National Golf Club', '{"city": "Augusta", "state": "Georgia", "country": "USA"}'::jsonb, 4, 4),
('The Open Championship', 'GOLF-OPEN', 'golf', 'Golf', 'Major Championship', 'Various Links Courses', '{"country": "UK"}'::jsonb, 7, 4),
('US Open Golf', 'GOLF-USOPEN', 'golf', 'Golf', 'Major Championship', 'Various US Courses', '{"country": "USA"}'::jsonb, 6, 4),
('PGA Championship', 'GOLF-PGA', 'golf', 'Golf', 'Major Championship', 'Various US Courses', '{"country": "USA"}'::jsonb, 5, 4),
('Ryder Cup', 'GOLF-RYDER', 'golf', 'Golf', 'Team Championship', 'Various Venues', '{"region": "Europe/USA"}'::jsonb, 9, 3),

-- Tennis
('Wimbledon', 'TENNIS-WIM', 'tennis', 'Tennis', 'Grand Slam', 'All England Lawn Tennis Club', '{"city": "London", "country": "UK"}'::jsonb, 6, 14),
('US Open Tennis', 'TENNIS-USO', 'tennis', 'Tennis', 'Grand Slam', 'USTA Billie Jean King National Tennis Center', '{"city": "New York", "country": "USA"}'::jsonb, 8, 14),
('Australian Open', 'TENNIS-AO', 'tennis', 'Tennis', 'Grand Slam', 'Melbourne Park', '{"city": "Melbourne", "country": "Australia"}'::jsonb, 1, 14),
('French Open', 'TENNIS-FO', 'tennis', 'Tennis', 'Grand Slam', 'Stade Roland Garros', '{"city": "Paris", "country": "France"}'::jsonb, 5, 14),

-- Rugby
('Six Nations', 'RUGBY-6N', 'rugby', 'Rugby Union', 'Championship', 'Various Stadiums', '{"region": "Europe"}'::jsonb, 2, 60);

-- ----------------------------------------------------------------------------
-- Events
-- ----------------------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id), -- NULL = global/public event
  event_series_id UUID REFERENCES event_series(id),
  
  -- Event basics
  event_name VARCHAR(255) NOT NULL,
  event_code VARCHAR(50),
  event_type VARCHAR(50) NOT NULL, -- f1 | golf | tennis | rugby | etc
  sport VARCHAR(50),
  competition VARCHAR(100),
  
  -- Venue
  venue_name VARCHAR(255),
  venue_location JSONB, -- { city, country, region, lat, lng, timezone }
  
  -- Dates
  event_date_from DATE NOT NULL,
  event_date_to DATE NOT NULL,
  event_year INTEGER,
  season VARCHAR(50), -- "2025 Season"
  round_number INTEGER, -- Race 6 of 23
  
  -- Schedule breakdown
  event_schedule JSONB, -- [{ date, session_type, session_name, start_time, end_time }]
  
  -- Status
  event_status VARCHAR(20) DEFAULT 'scheduled', -- scheduled | confirmed | cancelled | postponed | completed
  is_premium BOOLEAN DEFAULT false,
  
  -- Operational flags
  requires_early_booking BOOLEAN DEFAULT false,
  typical_hotel_attrition BOOLEAN DEFAULT false,
  booking_window_opens DATE,
  booking_window_closes DATE,
  booking_cutoff_days INTEGER,
  
  -- Marketing
  description TEXT,
  short_description TEXT,
  highlights TEXT[],
  event_image_url TEXT,
  banner_url TEXT,
  official_website TEXT,
  
  -- Media
  media JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  tags TEXT[],
  expected_attendance INTEGER,
  weather_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_events_series ON events(event_series_id);
CREATE INDEX idx_events_org ON events(organization_id);
CREATE INDEX idx_events_type_year ON events(event_type, event_year);
CREATE INDEX idx_events_dates ON events(event_date_from, event_date_to);
CREATE INDEX idx_events_status ON events(event_status) WHERE event_status IN ('scheduled', 'confirmed');
CREATE INDEX idx_events_year ON events(event_year);

COMMENT ON TABLE events IS 'Specific event instances. Monaco GP 2025, Monaco GP 2026, etc.';
COMMENT ON COLUMN events.typical_hotel_attrition IS 'Flag events known for strict hotel attrition policies';

-- Add foreign key to products
ALTER TABLE products ADD CONSTRAINT fk_products_event FOREIGN KEY (event_id) REFERENCES events(id);

-- Insert 2025/2026 events
INSERT INTO events (event_series_id, event_name, event_code, event_type, sport, competition, venue_name, venue_location, event_date_from, event_date_to, event_year, season, round_number, requires_early_booking, typical_hotel_attrition) 
SELECT 
  es.id,
  es.series_name || ' 2025',
  es.series_code || '-2025',
  es.event_type,
  es.sport,
  es.competition,
  es.venue_name,
  es.venue_location,
  CASE 
    -- F1 2025 dates
    WHEN es.series_code = 'F1-MON' THEN '2025-05-23'::date
    WHEN es.series_code = 'F1-SIN' THEN '2025-09-19'::date
    WHEN es.series_code = 'F1-GBR' THEN '2025-07-04'::date
    WHEN es.series_code = 'F1-ABU' THEN '2025-11-21'::date
    WHEN es.series_code = 'F1-BEL' THEN '2025-07-25'::date
    WHEN es.series_code = 'F1-ITA' THEN '2025-09-05'::date
    -- Golf 2025 dates
    WHEN es.series_code = 'GOLF-MASTERS' THEN '2025-04-10'::date
    WHEN es.series_code = 'GOLF-OPEN' THEN '2025-07-17'::date
    WHEN es.series_code = 'GOLF-USOPEN' THEN '2025-06-12'::date
    WHEN es.series_code = 'GOLF-PGA' THEN '2025-05-15'::date
    -- Tennis 2025 dates
    WHEN es.series_code = 'TENNIS-WIM' THEN '2025-06-23'::date
    WHEN es.series_code = 'TENNIS-USO' THEN '2025-08-25'::date
    WHEN es.series_code = 'TENNIS-AO' THEN '2025-01-13'::date
    WHEN es.series_code = 'TENNIS-FO' THEN '2025-05-25'::date
  END,
  CASE 
    WHEN es.series_code = 'F1-MON' THEN '2025-05-25'::date
    WHEN es.series_code = 'F1-SIN' THEN '2025-09-21'::date
    WHEN es.series_code = 'F1-GBR' THEN '2025-07-06'::date
    WHEN es.series_code = 'F1-ABU' THEN '2025-11-23'::date
    WHEN es.series_code = 'F1-BEL' THEN '2025-07-27'::date
    WHEN es.series_code = 'F1-ITA' THEN '2025-09-07'::date
    WHEN es.series_code = 'GOLF-MASTERS' THEN '2025-04-13'::date
    WHEN es.series_code = 'GOLF-OPEN' THEN '2025-07-20'::date
    WHEN es.series_code = 'GOLF-USOPEN' THEN '2025-06-15'::date
    WHEN es.series_code = 'GOLF-PGA' THEN '2025-05-18'::date
    WHEN es.series_code = 'TENNIS-WIM' THEN '2025-07-06'::date
    WHEN es.series_code = 'TENNIS-USO' THEN '2025-09-07'::date
    WHEN es.series_code = 'TENNIS-AO' THEN '2025-01-26'::date
    WHEN es.series_code = 'TENNIS-FO' THEN '2025-06-08'::date
  END,
  2025,
  '2025 Season',
  CASE 
    WHEN es.series_code = 'F1-MON' THEN 6
    WHEN es.series_code = 'F1-SIN' THEN 17
    WHEN es.series_code = 'F1-GBR' THEN 12
    WHEN es.series_code = 'F1-ABU' THEN 24
    WHEN es.series_code = 'F1-BEL' THEN 14
    WHEN es.series_code = 'F1-ITA' THEN 16
    ELSE NULL
  END,
  true,
  CASE 
    WHEN es.event_type = 'f1' THEN true
    WHEN es.series_code IN ('GOLF-MASTERS', 'TENNIS-WIM') THEN true
    ELSE false
  END
FROM event_series es
WHERE es.series_code NOT IN ('RUGBY-6N', 'GOLF-RYDER'); -- Skip multi-match/biennial events

-- ============================================================================
-- CONTRACTS & ALLOCATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Contracts
-- ----------------------------------------------------------------------------
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  
  -- Event linkage
  event_id UUID REFERENCES events(id),
  
  -- Contract basics
  contract_number VARCHAR(100) NOT NULL,
  contract_name VARCHAR(255) NOT NULL,
  contract_type VARCHAR(50) NOT NULL, -- allocation | batch_purchase | series | on_request | net_rate | commissionable | dynamic
  contract_date DATE DEFAULT CURRENT_DATE,
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Financial
  currency VARCHAR(3) DEFAULT 'USD',
  total_value NUMERIC(15,2),
  commission_rate NUMERIC(5,2),
  
  -- Payment terms (simplified - TEXT field for flexibility)
  payment_terms TEXT,
  /*
  Example: 
  "50% deposit on signing (€36,000 due Oct 31, 2024)
   25% payment 60 days before arrival (€18,000 due Mar 23, 2025)
   25% final payment 30 days before arrival (€18,000 due Apr 22, 2025)"
  */
  
  -- Policies (simplified - TEXT fields)
  cancellation_policy TEXT,
  /*
  Example:
  "Full cancellation penalty after final payment date.
   Individual room cancellations: 1 night charge per room."
  */
  
  attrition_policy TEXT,
  /*
  Example:
  "Minimum commitment: 15 rooms × 4 nights = 60 room nights.
   Shortfall charged at contracted rate (€1,200/night).
   Release schedule below must be met to avoid attrition charges."
  */
  
  -- Settings
  booking_cutoff_days INTEGER,
  has_attrition BOOLEAN DEFAULT false,
  minimum_commitment INTEGER, -- For allocations
  
  -- Notes
  special_notes TEXT,
  internal_notes TEXT,
  supplier_reference VARCHAR(100),
  
  -- Document
  contract_document_url TEXT,
  contract_document_name VARCHAR(255),
  contract_signed_date DATE,
  
  -- Quick entry flag
  is_quick_entry BOOLEAN DEFAULT false,
  
  -- Status
  status contract_status DEFAULT 'draft',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT contracts_dates_check CHECK (valid_to >= valid_from),
  CONSTRAINT contracts_commission_check CHECK (
    commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100)
  )
);

CREATE INDEX idx_contracts_org ON contracts(organization_id);
CREATE INDEX idx_contracts_supplier ON contracts(supplier_id);
CREATE INDEX idx_contracts_event ON contracts(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_active ON contracts(status, valid_from, valid_to) WHERE status = 'active';
CREATE INDEX idx_contracts_dates ON contracts(valid_from, valid_to);
CREATE INDEX idx_contracts_attrition ON contracts(has_attrition) WHERE has_attrition = true;
CREATE INDEX idx_contracts_number ON contracts(contract_number);
CREATE INDEX idx_contracts_type ON contracts(contract_type);

COMMENT ON TABLE contracts IS 'Supplier contracts. Supports 4 entry modes: allocation (hotels), batch_purchase (tickets), series (ongoing rates), on_request (book per request)';
COMMENT ON COLUMN contracts.payment_terms IS 'Free-text payment terms. Example: "50% on signing, 25% at 60 days, 25% at 30 days"';
COMMENT ON COLUMN contracts.cancellation_policy IS 'Free-text cancellation policy';
COMMENT ON COLUMN contracts.attrition_policy IS 'Free-text attrition policy. Links to allocation_releases for schedule';
COMMENT ON COLUMN contracts.is_quick_entry IS 'Flag for 30-second quick entry (simple purchases: tickets, tours, etc)';

-- ----------------------------------------------------------------------------
-- Contract Allocations
-- ----------------------------------------------------------------------------
CREATE TABLE contract_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  
  -- Allocation details
  allocation_name VARCHAR(255) NOT NULL,
  allocation_type allocation_type DEFAULT 'allotment',
  
  -- Quantity
  total_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  available_quantity INTEGER, -- Computed or explicit
  
  -- Dates
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Pricing
  total_cost NUMERIC(15,2),
  cost_per_unit NUMERIC(12,2),
  
  -- Constraints
  min_nights INTEGER, -- For hotels
  max_nights INTEGER,
  min_quantity_per_booking INTEGER DEFAULT 1,
  max_quantity_per_booking INTEGER,
  release_days INTEGER, -- Simple release days (for non-complex allocations)
  
  -- Notes
  notes TEXT,
  supplier_confirmation VARCHAR(100),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_on_request BOOLEAN DEFAULT false, -- If true, check availability with supplier per booking
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT allocations_dates_check CHECK (valid_to >= valid_from),
  CONSTRAINT allocations_quantity_check CHECK (total_quantity > 0),
  CONSTRAINT allocations_sold_check CHECK (sold_quantity >= 0 AND sold_quantity <= total_quantity)
);

CREATE INDEX idx_allocations_org ON contract_allocations(organization_id);
CREATE INDEX idx_allocations_contract ON contract_allocations(contract_id);
CREATE INDEX idx_allocations_product ON contract_allocations(product_id);
CREATE INDEX idx_allocations_product_option ON contract_allocations(product_option_id);
CREATE INDEX idx_allocations_active ON contract_allocations(is_active) WHERE is_active = true;
CREATE INDEX idx_allocations_dates ON contract_allocations(valid_from, valid_to);
CREATE INDEX idx_allocations_type ON contract_allocations(allocation_type);

COMMENT ON TABLE contract_allocations IS 'Inventory allocations from contracts. Example: 15 rooms for 4 nights = 60 room nights. Tracks sold vs available.';
COMMENT ON COLUMN contract_allocations.release_days IS 'Simple release days for basic allocations. For complex release schedules, use allocation_releases table.';

-- ----------------------------------------------------------------------------
-- Allocation Releases (Attrition/Wash Dates)
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id) ON DELETE CASCADE,
  
  -- Release details
  release_date DATE NOT NULL,
  release_percentage NUMERIC(5,2), -- 50.00 for 50%
  release_quantity INTEGER, -- Alternative: absolute quantity
  
  -- Impact
  penalty_applies BOOLEAN DEFAULT false,
  penalty_description TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Tracking
  release_actioned BOOLEAN DEFAULT false,
  release_actioned_date DATE,
  release_actioned_by UUID REFERENCES users(id),
  release_actioned_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_release_per_allocation_date UNIQUE (contract_allocation_id, release_date),
  CONSTRAINT release_percentage_check CHECK (
    release_percentage IS NULL OR (release_percentage >= 0 AND release_percentage <= 100)
  ),
  CONSTRAINT release_quantity_check CHECK (release_quantity IS NULL OR release_quantity >= 0)
);

CREATE INDEX idx_releases_allocation ON allocation_releases(contract_allocation_id, release_date);
CREATE INDEX idx_releases_upcoming ON allocation_releases(release_date) 
WHERE NOT release_actioned;
CREATE INDEX idx_releases_pending ON allocation_releases(release_actioned) WHERE NOT release_actioned;

COMMENT ON TABLE allocation_releases IS 'Release schedule for allocations. THE KILLER FEATURE for attrition management. Example: Release 50% by Dec 1 (no penalty), 75% by Feb 1 (no penalty), after Mar 1 = attrition charges apply.';
COMMENT ON COLUMN allocation_releases.penalty_applies IS 'If true, this is the final release date. After this, attrition penalties apply for unsold inventory.';

-- ----------------------------------------------------------------------------
-- Contract Payments (Supplier payments)
-- ----------------------------------------------------------------------------
CREATE TABLE contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Payment details
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC(15,2) NOT NULL,
  percentage NUMERIC(5,2),
  description TEXT,
  
  -- Status tracking
  status payment_status DEFAULT 'pending',
  paid_date DATE,
  paid_amount NUMERIC(15,2),
  payment_reference VARCHAR(100),
  payment_method VARCHAR(50), -- bank_transfer | credit_card | cheque | cash
  
  -- Banking
  paid_to_account VARCHAR(100),
  transaction_id VARCHAR(100),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  paid_by UUID REFERENCES users(id),
  
  CONSTRAINT unique_payment_per_contract UNIQUE (contract_id, payment_number),
  CONSTRAINT payment_percentage_check CHECK (
    percentage IS NULL OR (percentage >= 0 AND percentage <= 100)
  )
);

CREATE INDEX idx_payments_contract ON contract_payments(contract_id, due_date);
CREATE INDEX idx_payments_status ON contract_payments(status, due_date) WHERE status IN ('pending', 'partial');

COMMENT ON TABLE contract_payments IS 'OPTIONAL: Detailed payment tracking for supplier contracts. Many operators just use contracts.payment_terms text field.';

-- ============================================================================
-- PRICING TABLES (Dynamic Pricing)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Supplier Rates
-- ----------------------------------------------------------------------------
CREATE TABLE supplier_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Link to what this rate applies to
  product_id UUID REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  contract_id UUID REFERENCES contracts(id),
  contract_allocation_id UUID REFERENCES contract_allocations(id),
  supplier_id UUID REFERENCES suppliers(id),
  
  -- Rate identification
  rate_code VARCHAR(50),
  rate_name VARCHAR(255) NOT NULL,
  rate_type VARCHAR(50) NOT NULL, -- per_night | per_person | per_unit | per_day | hourly | flat_fee | percentage
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- Pricing
  base_cost NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Date-based applicability
  applies_to_days_of_week INTEGER[], -- [1,2,3,4,5] Mon-Fri, [6,7] weekends
  applies_to_months INTEGER[], -- [6,7,8] summer
  applies_to_date_range JSONB, -- [{"from": "2025-05-20", "to": "2025-05-30"}]
  
  -- Quantity rules
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  min_nights INTEGER,
  max_nights INTEGER,
  
  -- Discounts
  length_of_stay_discount JSONB, -- {"7": 5, "14": 10} = 5% off 7+ nights, 10% off 14+
  occupancy_pricing JSONB, -- {"single": 100, "double": 80, "triple": 70} = % of base
  volume_discount JSONB, -- {"10": 5, "20": 10} = 5% off 10+, 10% off 20+
  
  -- Conditions
  requires_minimum_guests INTEGER,
  requires_advance_booking_days INTEGER,
  blackout_dates DATE[],
  
  -- Commission (for commissionable rates)
  is_commissionable BOOLEAN DEFAULT false,
  commission_rate NUMERIC(5,2),
  
  -- Notes
  notes TEXT,
  supplier_rate_card_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT supplier_rates_quantity_check CHECK (
    max_quantity IS NULL OR max_quantity >= min_quantity
  ),
  CONSTRAINT supplier_rates_dates_check CHECK (
    valid_to IS NULL OR valid_to >= valid_from
  )
);

CREATE INDEX idx_supplier_rates_org ON supplier_rates(organization_id);
CREATE INDEX idx_supplier_rates_product ON supplier_rates(product_id);
CREATE INDEX idx_supplier_rates_product_option ON supplier_rates(product_option_id);
CREATE INDEX idx_supplier_rates_contract ON supplier_rates(contract_id);
CREATE INDEX idx_supplier_rates_allocation ON supplier_rates(contract_allocation_id);
CREATE INDEX idx_supplier_rates_supplier ON supplier_rates(supplier_id);
CREATE INDEX idx_supplier_rates_dates ON supplier_rates(valid_from, valid_to);
CREATE INDEX idx_supplier_rates_active ON supplier_rates(is_active) WHERE is_active = true;

COMMENT ON TABLE supplier_rates IS 'Supplier pricing rules. Supports date-variable pricing (weekend vs weekday), seasonal rates, length-of-stay discounts, volume discounts.';
COMMENT ON COLUMN supplier_rates.rate_type IS 'How rate is calculated: per_night (hotels), per_person (tours), per_unit (tickets), per_day (car rental), hourly (transfers), flat_fee (one-time), percentage (commission)';
COMMENT ON COLUMN supplier_rates.applies_to_days_of_week IS 'Array of day numbers (1=Monday, 7=Sunday). Example: [6,7] = weekends only';
COMMENT ON COLUMN supplier_rates.applies_to_date_range IS 'Array of date ranges. Example: [{"from": "2025-12-20", "to": "2026-01-05"}] = Christmas/New Year';

-- ----------------------------------------------------------------------------
-- Selling Rates
-- ----------------------------------------------------------------------------
CREATE TABLE selling_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Link to what we're selling
  product_id UUID REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  package_id UUID, -- References packages(id) - added later
  supplier_rate_id UUID REFERENCES supplier_rates(id),
  
  -- Rate identification
  rate_code VARCHAR(50),
  rate_name VARCHAR(255) NOT NULL,
  rate_type VARCHAR(50) NOT NULL, -- per_night | per_person | per_unit | per_package | percentage
  
  -- Validity
  valid_from DATE NOT NULL,
  valid_to DATE,
  
  -- Base pricing (option 1: fixed price)
  base_price NUMERIC(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Markup strategy (option 2: calculate from cost)
  markup_type VARCHAR(20), -- fixed_amount | percentage | tiered
  markup_value NUMERIC(10,2),
  markup_tiers JSONB, -- [{"min_cost": 0, "markup": 40}, {"min_cost": 5000, "markup": 30}]
  
  -- Dynamic adjustments
  seasonal_adjustments JSONB, -- {"peak": 20, "shoulder": 10, "low": 0} = % adjustment
  day_of_week_adjustments JSONB, -- {"5": 10, "6": 15, "7": 15} = Friday +10%, Sat/Sun +15%
  special_date_pricing JSONB, -- [{"dates": ["2025-12-25"], "adjustment": 50}]
  
  -- Booking window pricing
  early_bird_discount NUMERIC(5,2),
  early_bird_days INTEGER,
  last_minute_surcharge NUMERIC(5,2),
  last_minute_days INTEGER,
  
  -- Volume pricing
  group_discount JSONB, -- {"4": 5, "8": 10, "12": 15}
  
  -- Customer tier pricing
  vip_discount JSONB, -- {"gold": 5, "platinum": 10, "diamond": 15}
  
  -- Channel-specific pricing
  sales_channel VARCHAR(50), -- website | agent | direct | wholesale | affiliate
  channel_adjustment NUMERIC(5,2),
  
  -- Price bounds
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  
  -- Quantity rules
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  minimum_nights INTEGER,
  
  -- Conditions
  requires_package_purchase BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  
  CONSTRAINT selling_rates_dates_check CHECK (
    valid_to IS NULL OR valid_to >= valid_from
  ),
  CONSTRAINT selling_rates_pricing_check CHECK (
    base_price IS NOT NULL OR (markup_type IS NOT NULL AND markup_value IS NOT NULL)
  )
);

CREATE INDEX idx_selling_rates_org ON selling_rates(organization_id);
CREATE INDEX idx_selling_rates_product ON selling_rates(product_id);
CREATE INDEX idx_selling_rates_product_option ON selling_rates(product_option_id);
CREATE INDEX idx_selling_rates_package ON selling_rates(package_id);
CREATE INDEX idx_selling_rates_supplier_rate ON selling_rates(supplier_rate_id);
CREATE INDEX idx_selling_rates_dates ON selling_rates(valid_from, valid_to);
CREATE INDEX idx_selling_rates_active ON selling_rates(is_active, is_public) WHERE is_active = true AND is_public = true;
CREATE INDEX idx_selling_rates_channel ON selling_rates(sales_channel);

COMMENT ON TABLE selling_rates IS 'Customer-facing pricing rules. Supports dynamic pricing with early bird discounts, last-minute surcharges, group discounts, VIP tiers, channel-specific pricing.';
COMMENT ON COLUMN selling_rates.markup_type IS 'How to calculate price from cost: fixed_amount (+€500), percentage (+35%), tiered (markup varies by cost level)';
COMMENT ON COLUMN selling_rates.markup_tiers IS 'Tiered markup by cost level. Example: [{"min_cost": 0, "markup": 40}, {"min_cost": 5000, "markup": 30}] = 40% markup up to €5k cost, 30% above €5k';

-- ============================================================================
-- INVENTORY & AVAILABILITY
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Allocation Inventory (Batch inventory tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE allocation_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_allocation_id UUID NOT NULL REFERENCES contract_allocations(id) ON DELETE CASCADE,
  product_option_id UUID NOT NULL REFERENCES product_options(id),
  
  -- Quantity
  total_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  sold_quantity INTEGER DEFAULT 0,
  held_quantity INTEGER DEFAULT 0, -- Temporarily held for quotes
  
  -- Batch details
  batch_number VARCHAR(50),
  batch_cost_per_unit NUMERIC(12,2),
  batch_reference VARCHAR(100),
  
  -- Configuration
  flexible_configuration BOOLEAN DEFAULT false,
  alternate_option_ids UUID[], -- Alternative product options
  min_quantity_per_booking INTEGER DEFAULT 1,
  max_quantity_per_booking INTEGER,
  
  -- Notes
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  availability_generated BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT inventory_quantity_check CHECK (
    available_quantity >= 0 AND 
    sold_quantity >= 0 AND 
    held_quantity >= 0 AND
    sold_quantity + held_quantity <= total_quantity
  )
);

CREATE INDEX idx_inventory_allocation ON allocation_inventory(contract_allocation_id);
CREATE INDEX idx_inventory_option ON allocation_inventory(product_option_id);
CREATE INDEX idx_inventory_active ON allocation_inventory(is_active) WHERE is_active = true;
CREATE INDEX idx_inventory_available ON allocation_inventory(available_quantity) WHERE available_quantity > 0;

COMMENT ON TABLE allocation_inventory IS 'Batch inventory tracking for pre-purchased items like tickets. Links allocations to specific product options and tracks available vs sold quantities.';

-- ----------------------------------------------------------------------------
-- Availability (Daily availability calendar)
-- ----------------------------------------------------------------------------
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_inventory_id UUID NOT NULL REFERENCES allocation_inventory(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- Quantities
  total_available INTEGER NOT NULL,
  booked INTEGER DEFAULT 0,
  provisional INTEGER DEFAULT 0,
  held INTEGER DEFAULT 0,
  available INTEGER NOT NULL,
  
  -- Status
  is_closed BOOLEAN DEFAULT false,
  close_reason VARCHAR(100),
  
  -- Price overrides (optional - can override supplier/selling rates)
  cost_override NUMERIC(10,2),
  price_override NUMERIC(10,2),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_inventory_date UNIQUE (allocation_inventory_id, date),
  CONSTRAINT availability_quantity_check CHECK (
    available >= 0 AND
    booked >= 0 AND
    provisional >= 0 AND
    held >= 0 AND
    booked + provisional + held <= total_available
  )
);

CREATE INDEX idx_availability_inventory_date ON availability(allocation_inventory_id, date);
CREATE INDEX idx_availability_date_range ON availability(date);
CREATE INDEX idx_availability_available ON availability(available) WHERE available > 0 AND NOT is_closed;

COMMENT ON TABLE availability IS 'Daily availability calendar. Tracks day-by-day inventory for bookings. Used for hotels, tee times, date-specific experiences.';

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
  customer_type VARCHAR(20) DEFAULT 'individual', -- individual | corporate | agent | group
  customer_number VARCHAR(50), -- Auto-generated customer ID
  title VARCHAR(10),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company_name VARCHAR(255),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  alternate_phone VARCHAR(50),
  
  -- Address
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(2),
  
  -- Identity
  date_of_birth DATE,
  nationality VARCHAR(2),
  passport_number VARCHAR(50),
  passport_expiry DATE,
  passport_country VARCHAR(2),
  
  -- Sports travel specific
  vip_status vip_status DEFAULT 'standard',
  loyalty_points INTEGER DEFAULT 0,
  favorite_sports TEXT[],
  attended_events UUID[], -- Array of event IDs
  preferences JSONB DEFAULT '{}'::jsonb, -- Seat preferences, dietary, accessibility, etc
  communication_preferences JSONB DEFAULT '{
    "email": true,
    "sms": false,
    "phone": true,
    "whatsapp": false,
    "preferred_contact_time": "business_hours"
  }'::jsonb,
  
  -- Marketing
  marketing_consent BOOLEAN DEFAULT false,
  marketing_consent_date DATE,
  marketing_source VARCHAR(100),
  referral_source VARCHAR(100),
  referral_code VARCHAR(50),
  tags TEXT[],
  
  -- Financial
  credit_limit NUMERIC(12,2),
  current_balance NUMERIC(12,2) DEFAULT 0,
  payment_terms VARCHAR(100),
  payment_method_preferred VARCHAR(50),
  
  -- Relationship
  account_manager_id UUID REFERENCES users(id),
  customer_rating NUMERIC(3,2) CHECK (customer_rating IS NULL OR (customer_rating >= 0 AND customer_rating <= 5)),
  lifetime_value NUMERIC(15,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  average_booking_value NUMERIC(12,2),
  last_booking_date DATE,
  
  -- Emergency contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(50),
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_vip BOOLEAN DEFAULT false,
  is_blacklisted BOOLEAN DEFAULT false,
  blacklist_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_customers_org ON customers(organization_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_number ON customers(customer_number);
CREATE INDEX idx_customers_vip ON customers(vip_status) WHERE vip_status != 'standard';
CREATE INDEX idx_customers_sports ON customers USING gin(favorite_sports) WHERE favorite_sports IS NOT NULL;
CREATE INDEX idx_customers_events ON customers USING gin(attended_events) WHERE attended_events IS NOT NULL;
CREATE INDEX idx_customers_active ON customers(is_active) WHERE is_active = true;
CREATE INDEX idx_customers_name_trgm ON customers USING gin((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_customers_company_trgm ON customers USING gin(company_name gin_trgm_ops) WHERE company_name IS NOT NULL;

COMMENT ON TABLE customers IS 'Customer/client database with VIP tiers, preferences, and event history tracking';
COMMENT ON COLUMN customers.attended_events IS 'Array of event UUIDs customer has attended. Used for repeat customer targeting.';
COMMENT ON COLUMN customers.preferences IS 'JSONB object for customer preferences: {"seat_preference": "aisle", "dietary": ["vegetarian"], "accessibility": ["wheelchair"]}';

-- ----------------------------------------------------------------------------
-- Bookings
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  
  -- Event linkage
  event_id UUID REFERENCES events(id),
  
  -- Booking reference
  booking_reference VARCHAR(100) NOT NULL UNIQUE,
  booking_number VARCHAR(50), -- Alternative reference format
  booking_status booking_status DEFAULT 'provisional',
  
  -- Dates
  booking_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  travel_date_from DATE,
  travel_date_to DATE,
  
  -- Customer details (denormalized for convenience)
  customer_type VARCHAR(50), -- individual | corporate | group
  lead_passenger_name VARCHAR(255),
  lead_passenger_email VARCHAR(255),
  lead_passenger_phone VARCHAR(50),
  lead_passenger_details JSONB,
  lead_passenger_preferences JSONB,
  
  -- Passengers
  total_adults INTEGER DEFAULT 0,
  total_children INTEGER DEFAULT 0,
  total_infants INTEGER DEFAULT 0,
  total_passengers INTEGER GENERATED ALWAYS AS (total_adults + total_children + total_infants) STORED,
  
  -- Group booking
  booking_type VARCHAR(50) DEFAULT 'standard', -- standard | vip | corporate | group
  group_name VARCHAR(255),
  
  -- Financial
  total_cost NUMERIC(15,2), -- What we pay suppliers (may be estimated initially)
  total_price NUMERIC(15,2), -- What customer pays us
  margin NUMERIC(15,2) GENERATED ALWAYS AS (total_price - total_cost) STORED,
  margin_percentage NUMERIC(5,2),
  currency VARCHAR(3) DEFAULT 'USD',
  exchange_rate NUMERIC(10,6),
  base_currency VARCHAR(3),
  
  -- Payment
  payment_status payment_status DEFAULT 'pending',
  payment_terms VARCHAR(255),
  deposit_amount NUMERIC(12,2),
  deposit_due_date DATE,
  deposit_paid_date DATE,
  balance_amount NUMERIC(12,2),
  balance_due_date DATE,
  balance_paid_date DATE,
  
  -- Notes
  customer_notes TEXT,
  internal_notes TEXT,
  special_requests TEXT,
  concierge_notes TEXT,
  
  -- Source
  source VARCHAR(100), -- website | phone | email | agent | referral | walk_in
  source_detail VARCHAR(255),
  agent_reference VARCHAR(100),
  agent_id UUID REFERENCES users(id),
  
  -- Package
  package_id UUID, -- References packages(id) - added later
  is_custom_package BOOLEAN DEFAULT false,
  
  -- Invoice
  invoice_number VARCHAR(100),
  invoice_date DATE,
  invoice_url TEXT,
  
  -- Cancellation
  cancellation_reason TEXT,
  cancellation_fee NUMERIC(10,2),
  refund_amount NUMERIC(10,2),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_org ON bookings(organization_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_event ON bookings(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX idx_bookings_dates ON bookings(travel_date_from, travel_date_to);
CREATE INDEX idx_bookings_type ON bookings(booking_type);
CREATE INDEX idx_bookings_group ON bookings(group_name) WHERE group_name IS NOT NULL;
CREATE INDEX idx_bookings_created_date ON bookings(booking_date);

COMMENT ON TABLE bookings IS 'Customer bookings. Each booking can contain multiple items (hotel, tickets, transfers, etc)';
COMMENT ON COLUMN bookings.total_cost IS 'Total supplier costs. May be estimated initially for sell-first, source-later items. Update with actuals when sourced.';

-- ----------------------------------------------------------------------------
-- Booking Items
-- ----------------------------------------------------------------------------
CREATE TABLE booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Product
  product_id UUID NOT NULL REFERENCES products(id),
  product_option_id UUID REFERENCES product_options(id),
  supplier_id UUID REFERENCES suppliers(id), -- ⚠️ NULLABLE for sell-first, source-later!
  
  -- Service details
  service_date_from DATE,
  service_date_to DATE,
  service_time_from TIME,
  service_time_to TIME,
  quantity INTEGER NOT NULL DEFAULT 1,
  
  -- Allocation linkage (NULLABLE for sell-first model!)
  contract_id UUID REFERENCES contracts(id),
  contract_allocation_id UUID REFERENCES contract_allocations(id),
  allocation_inventory_id UUID REFERENCES allocation_inventory(id),
  supplier_rate_id UUID REFERENCES supplier_rates(id),
  selling_rate_id UUID REFERENCES selling_rates(id),
  
  -- Pricing
  unit_cost NUMERIC(10,2), -- ⚠️ May be ESTIMATED initially, update with actual
  unit_price NUMERIC(10,2),
  total_cost NUMERIC(12,2),
  total_price NUMERIC(12,2),
  cost_currency VARCHAR(3) DEFAULT 'USD',
  price_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Exchange rates
  base_currency VARCHAR(3),
  exchange_rate_cost_to_base NUMERIC(10,6),
  exchange_rate_price_to_base NUMERIC(10,6),
  unit_cost_base NUMERIC(10,2),
  unit_price_base NUMERIC(10,2),
  total_cost_base NUMERIC(12,2),
  total_price_base NUMERIC(12,2),
  
  -- Margin
  margin_base NUMERIC(12,2),
  margin_percentage NUMERIC(5,2),
  
  -- Payment processing
  payment_method VARCHAR(50),
  payment_processing_fee NUMERIC(10,2) DEFAULT 0,
  payment_fx_markup NUMERIC(10,2) DEFAULT 0,
  total_cost_with_fees NUMERIC(12,2),
  total_price_after_fees NUMERIC(12,2),
  
  -- Details
  item_name VARCHAR(255),
  item_description TEXT,
  passenger_names TEXT[],
  special_requests TEXT,
  item_notes TEXT, -- ⚠️ IMPORTANT for sell-first model: "TODO: Source 2 weeks before"
  
  -- Status
  item_status item_status DEFAULT 'confirmed', -- provisional | on_request | confirmed | cancelled
  supplier_confirmation VARCHAR(100),
  
  -- Cancellation
  is_cancelled BOOLEAN DEFAULT false,
  cancellation_date DATE,
  cancellation_fee NUMERIC(10,2),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);
CREATE INDEX idx_booking_items_org ON booking_items(organization_id);
CREATE INDEX idx_booking_items_product ON booking_items(product_id);
CREATE INDEX idx_booking_items_supplier ON booking_items(supplier_id);
CREATE INDEX idx_booking_items_allocation ON booking_items(contract_allocation_id);
CREATE INDEX idx_booking_items_inventory ON booking_items(allocation_inventory_id);
CREATE INDEX idx_booking_items_contract ON booking_items(contract_id);
CREATE INDEX idx_booking_items_dates ON booking_items(service_date_from, service_date_to);
CREATE INDEX idx_booking_items_status ON booking_items(item_status);
CREATE INDEX idx_booking_items_on_request ON booking_items(item_status) WHERE item_status = 'on_request';

COMMENT ON TABLE booking_items IS 'Individual items in a booking. Each item is one product/service. Supports SELL-FIRST, SOURCE-LATER model via nullable supplier_id and item_status=on_request.';
COMMENT ON COLUMN booking_items.supplier_id IS 'NULLABLE! For sell-first model, leave NULL when item sold but not sourced yet. Fill in when supplier booked.';
COMMENT ON COLUMN booking_items.unit_cost IS 'May be ESTIMATED initially. Update with actual cost when supplier sourced.';
COMMENT ON COLUMN booking_items.item_status IS 'on_request = sold but not sourced yet (sell-first model). confirmed = fully sourced and locked in.';
COMMENT ON COLUMN booking_items.item_notes IS 'Free-text notes. For on_request items: "TODO: Source transfer supplier 2 weeks before. Target cost €150 max."';

-- ----------------------------------------------------------------------------
-- Booking Passengers
-- ----------------------------------------------------------------------------
CREATE TABLE booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_item_id UUID REFERENCES booking_items(id),
  
  -- Passenger details
  passenger_type VARCHAR(20) NOT NULL, -- adult | child | infant
  passenger_number INTEGER,
  title VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  
  -- Personal details
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(10),
  
  -- Travel documents
  passport_number VARCHAR(50),
  passport_expiry DATE,
  passport_country VARCHAR(2),
  nationality VARCHAR(2),
  visa_required BOOLEAN,
  visa_number VARCHAR(50),
  
  -- Contact
  email VARCHAR(255),
  phone VARCHAR(50),
  
  -- Requirements
  dietary_requirements TEXT,
  meal_preference VARCHAR(100),
  special_requirements TEXT,
  medical_conditions TEXT,
  accessibility_needs TEXT,
  
  -- Frequent traveler
  frequent_flyer_number VARCHAR(50),
  frequent_flyer_airline VARCHAR(100),
  
  -- Emergency contact
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(50),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_passengers_booking ON booking_passengers(booking_id);
CREATE INDEX idx_passengers_item ON booking_passengers(booking_item_id);
CREATE INDEX idx_passengers_type ON booking_passengers(passenger_type);

COMMENT ON TABLE booking_passengers IS 'Passenger manifest for bookings. Full passenger details including documents, requirements, emergency contacts.';

-- ============================================================================
-- TRANSPORT SEGMENTS (Manual Entry - MVP)
-- ============================================================================

CREATE TABLE transport_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_item_id UUID NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  
  -- Segment info
  segment_number INTEGER NOT NULL, -- 1=outbound, 2=return, 3+=connections
  segment_type VARCHAR(20), -- outbound | return | connection
  
  -- ✅ CORE FIELDS (always used)
  transport_type VARCHAR(50) NOT NULL, -- flight | train | ferry | cruise | transfer | coach
  
  -- Operator
  operator_name VARCHAR(255),
  service_number VARCHAR(50), -- Flight BA123, Train 9004, Ferry name, etc.
  
  -- Route
  departure_location VARCHAR(255) NOT NULL,
  departure_location_code VARCHAR(10), -- LHR, GBQQS, etc. (optional)
  arrival_location VARCHAR(255) NOT NULL,
  arrival_location_code VARCHAR(10),
  
  -- Schedule
  departure_datetime TIMESTAMPTZ NOT NULL,
  arrival_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  
  -- Passengers
  passenger_names TEXT[], -- ["John Smith", "Jane Smith"]
  seat_identifiers TEXT[], -- ["12A", "12B"] or cabin numbers
  
  -- Booking reference
  booking_reference VARCHAR(50), -- PNR, confirmation code, ticket number
  confirmation_status VARCHAR(20) DEFAULT 'pending', -- pending | confirmed | ticketed | cancelled
  
  -- Supplier (if booked through broker/agent)
  supplier_id UUID REFERENCES suppliers(id),
  
  -- 🎯 TRANSPORT-SPECIFIC DETAILS (JSONB - flexible!)
  transport_details JSONB DEFAULT '{}'::jsonb,
  /*
  EXAMPLES:
  
  Flight:
  {
    "cabin_class": "economy",
    "terminal_departure": "5",
    "terminal_arrival": "2",
    "checked_bags": 2,
    "meal_included": false
  }
  
  Train:
  {
    "class": "standard_premier",
    "seat_type": "table",
    "meal_included": true
  }
  
  Ferry:
  {
    "cabin_type": "2_berth",
    "vehicle": {
      "included": true,
      "type": "car",
      "registration": "AB12 CDE"
    }
  }
  
  Cruise:
  {
    "ship_name": "MSC Fantasia",
    "cabin_number": "B403",
    "deck": "9"
  }
  
  Transfer:
  {
    "vehicle_type": "mercedes_s_class",
    "driver_name": "François",
    "meet_and_greet": true
  }
  */
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT segments_per_item UNIQUE (booking_item_id, segment_number)
);

CREATE INDEX idx_transport_segments_booking_item ON transport_segments(booking_item_id);
CREATE INDEX idx_transport_segments_type ON transport_segments(transport_type);
CREATE INDEX idx_transport_segments_departure ON transport_segments(departure_datetime);
CREATE INDEX idx_transport_segments_route ON transport_segments(departure_location_code, arrival_location_code);
CREATE INDEX idx_transport_segments_status ON transport_segments(confirmation_status);
CREATE INDEX idx_transport_segments_details ON transport_segments USING gin(transport_details);

COMMENT ON TABLE transport_segments IS 'Transport segments for bookings. Manually entered. Supports flights, trains, ferries, cruises, transfers. Use transport_details JSONB for type-specific data.';
COMMENT ON COLUMN transport_segments.transport_details IS 'JSONB for transport-type-specific data. Schema varies by transport_type.';

CREATE TRIGGER update_transport_segments_updated_at BEFORE UPDATE ON transport_segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PACKAGES & TEMPLATES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Packages
-- ----------------------------------------------------------------------------
CREATE TABLE packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Event linkage
  event_id UUID REFERENCES events(id),
  
  -- Package info
  package_name VARCHAR(255) NOT NULL,
  package_code VARCHAR(100),
  description TEXT,
  short_description TEXT,
  
  -- Pricing
  base_price NUMERIC(12,2),
  base_cost NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'USD',
  price_includes TEXT[],
  price_excludes TEXT[],
  
  -- Duration
  duration_nights INTEGER,
  duration_days INTEGER,
  
  -- Capacity
  min_passengers INTEGER DEFAULT 1,
  max_passengers INTEGER,
  
  -- Itinerary
  itinerary JSONB, -- Detailed day-by-day breakdown
  /*
  Example:
  {
    "days": [
      {
        "day": 1,
        "date": "2025-05-22",
        "title": "Arrival Day",
        "activities": [
          "Arrive Nice Airport",
          "Private transfer to hotel",
          "Check-in",
          "Welcome cocktails"
        ]
      }
    ]
  }
  */
  
  -- Media
  media JSONB DEFAULT '[]'::jsonb,
  thumbnail_url TEXT,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_packages_org ON packages(organization_id);
CREATE INDEX idx_packages_event ON packages(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_packages_active ON packages(is_active, is_public) WHERE is_active = true;
CREATE INDEX idx_packages_featured ON packages(is_featured) WHERE is_featured = true;

COMMENT ON TABLE packages IS 'Pre-defined travel packages combining multiple products/services';

-- Add foreign key to bookings and selling_rates
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_package FOREIGN KEY (package_id) REFERENCES packages(id);
ALTER TABLE selling_rates ADD CONSTRAINT fk_selling_rates_package FOREIGN KEY (package_id) REFERENCES packages(id);

-- ----------------------------------------------------------------------------
-- Package Templates
-- ----------------------------------------------------------------------------
CREATE TABLE package_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_series_id UUID REFERENCES event_series(id),
  
  -- Template info
  template_name VARCHAR(255) NOT NULL,
  template_code VARCHAR(50),
  event_type VARCHAR(50),
  
  -- Package structure (blueprint)
  template_structure JSONB NOT NULL,
  /*
  Example:
  {
    "name_pattern": "{event_name} VIP Package",
    "duration_nights": 4,
    "components": [
      {"type": "accommodation", "quantity": 1, "product_type": "hotel", "category": "5_star"},
      {"type": "event_ticket", "quantity": 1, "product_type": "paddock_club"},
      {"type": "transfer", "quantity": 2, "product_type": "private_transfer"},
      {"type": "experience", "quantity": 1, "product_type": "pit_lane_tour"}
    ],
    "pricing": {
      "base_markup_percentage": 35,
      "early_bird_discount": 10,
      "early_bird_days": 180
    }
  }
  */
  
  -- Defaults
  default_duration_nights INTEGER,
  default_markup_percentage NUMERIC(5,2),
  
  -- Marketing
  description TEXT,
  inclusions TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_package_templates_org ON package_templates(organization_id);
CREATE INDEX idx_package_templates_series ON package_templates(event_series_id);
CREATE INDEX idx_package_templates_type ON package_templates(event_type);
CREATE INDEX idx_package_templates_active ON package_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE package_templates IS 'Reusable package blueprints. When Monaco GP 2026 created, auto-generate packages from templates. Clone Monaco 2025 → Monaco 2026.';

-- ============================================================================
-- CUSTOMER EVENT HISTORY (Sports Travel)
-- ============================================================================

CREATE TABLE customer_event_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Attendance details
  attendance_year INTEGER,
  package_type VARCHAR(100),
  total_spent NUMERIC(12,2),
  
  -- Feedback
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  would_repeat BOOLEAN,
  would_recommend BOOLEAN,
  feedback_notes TEXT,
  testimonial TEXT,
  
  -- Follow-up
  follow_up_sent BOOLEAN DEFAULT false,
  follow_up_sent_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customer_history_customer ON customer_event_history(customer_id);
CREATE INDEX idx_customer_history_event ON customer_event_history(event_id);
CREATE INDEX idx_customer_history_booking ON customer_event_history(booking_id);
CREATE INDEX idx_customer_history_year ON customer_event_history(attendance_year);

COMMENT ON TABLE customer_event_history IS 'Track customer event attendance history. Used for "You attended Monaco 2024, book Monaco 2025 early!" repeat customer campaigns.';

-- ============================================================================
-- PAYMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Customer Payments
-- ----------------------------------------------------------------------------
CREATE TABLE customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  
  -- Payment details
  payment_reference VARCHAR(100) NOT NULL UNIQUE,
  payment_type VARCHAR(50), -- deposit | balance | full_payment | refund
  payment_date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment method
  payment_method VARCHAR(50), -- credit_card | bank_transfer | paypal | stripe | cash | cheque
  payment_processor VARCHAR(50),
  transaction_id VARCHAR(100),
  
  -- Card details (if applicable - should be encrypted!)
  card_last_four VARCHAR(4),
  card_type VARCHAR(20),
  
  -- Status
  status payment_status DEFAULT 'pending',
  cleared_date DATE,
  
  -- Fees
  processing_fee NUMERIC(10,2) DEFAULT 0,
  exchange_rate NUMERIC(10,6),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  processed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_customer_payments_org ON customer_payments(organization_id);
CREATE INDEX idx_customer_payments_booking ON customer_payments(booking_id);
CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);
CREATE INDEX idx_customer_payments_reference ON customer_payments(payment_reference);
CREATE INDEX idx_customer_payments_date ON customer_payments(payment_date);
CREATE INDEX idx_customer_payments_status ON customer_payments(status);

COMMENT ON TABLE customer_payments IS 'Customer payment transactions. Track deposits, balance payments, refunds.';

-- ============================================================================
-- USEFUL VIEWS FOR OPERATIONS
-- ============================================================================

-- Active events with booking stats
CREATE VIEW active_events_summary AS
SELECT 
  e.id,
  e.event_name,
  e.event_type,
  e.event_date_from,
  e.event_date_to,
  e.event_status,
  
  -- Days until event
  e.event_date_from - CURRENT_DATE as days_until_event,
  
  -- Booking stats
  COUNT(DISTINCT b.id) as total_bookings,
  COALESCE(SUM(b.total_price), 0) as total_revenue,
  COALESCE(SUM(b.total_cost), 0) as total_costs,
  COALESCE(SUM(b.margin), 0) as total_margin,
  COUNT(DISTINCT b.customer_id) as unique_customers,
  SUM(b.total_passengers) as total_passengers,
  
  -- Inventory stats
  COUNT(DISTINCT c.id) as contracts_count,
  COUNT(DISTINCT ca.id) as allocations_count,
  
  -- Next release date
  MIN(ar.release_date) FILTER (
    WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned
  ) as next_release_date
  
FROM events e
LEFT JOIN bookings b ON e.id = b.event_id AND b.booking_status NOT IN ('cancelled')
LEFT JOIN contracts c ON e.id = c.event_id AND c.status = 'active'
LEFT JOIN contract_allocations ca ON c.id = ca.contract_id
LEFT JOIN allocation_releases ar ON ca.id = ar.contract_allocation_id
WHERE e.event_status IN ('scheduled', 'confirmed')
  AND e.event_date_from >= CURRENT_DATE
GROUP BY e.id, e.event_name, e.event_type, e.event_date_from, e.event_date_to, e.event_status
ORDER BY e.event_date_from;

COMMENT ON VIEW active_events_summary IS 'Event dashboard with booking stats, revenue, margin, passenger counts, next release dates';

-- Repeat customer opportunities
CREATE VIEW repeat_customer_opportunities AS
SELECT 
  es.series_name,
  e_next.id as upcoming_event_id,
  e_next.event_name as upcoming_event,
  e_next.event_date_from as event_date,
  c.id as customer_id,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email,
  c.phone,
  c.vip_status,
  
  -- Last attendance
  e_prev.event_name as last_attended,
  e_prev.event_date_from as last_attendance_date,
  b.total_price as last_booking_value,
  ceh.satisfaction_rating as last_satisfaction,
  ceh.would_repeat,
  
  -- Days since last attendance
  CURRENT_DATE - e_prev.event_date_from as days_since_attendance,
  
  -- Customer value
  c.total_bookings,
  c.lifetime_value
  
FROM event_series es
JOIN events e_next ON es.id = e_next.event_series_id 
  AND e_next.event_date_from > CURRENT_DATE
  AND e_next.event_status IN ('scheduled', 'confirmed')
JOIN events e_prev ON es.id = e_prev.event_series_id 
  AND e_prev.event_date_from < CURRENT_DATE
JOIN bookings b ON e_prev.id = b.event_id
  AND b.booking_status NOT IN ('cancelled')
JOIN customers c ON b.customer_id = c.id
  AND c.is_active = true
LEFT JOIN customer_event_history ceh ON c.id = ceh.customer_id 
  AND e_prev.id = ceh.event_id
WHERE ceh.would_repeat IS DISTINCT FROM false -- Include NULLs and true
ORDER BY e_next.event_date_from, c.vip_status DESC, b.total_price DESC;

COMMENT ON VIEW repeat_customer_opportunities IS 'Customers who attended previous years of an event - target for repeat bookings with personalized campaigns';

-- Contracts with upcoming releases (attrition management!)
CREATE VIEW contracts_with_upcoming_releases AS
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_name,
  c.contract_type,
  s.name as supplier_name,
  e.event_name,
  c.has_attrition,
  
  -- Allocation details
  ca.allocation_name,
  ca.total_quantity as committed_quantity,
  ca.sold_quantity,
  ca.total_quantity - ca.sold_quantity as unsold_quantity,
  
  -- Next release
  MIN(ar.release_date) FILTER (
    WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned
  ) as next_release_date,
  
  MIN(ar.release_date) FILTER (
    WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned
  ) - CURRENT_DATE as days_until_release,
  
  -- Release details
  (SELECT ar2.release_percentage 
   FROM allocation_releases ar2 
   WHERE ar2.contract_allocation_id = ca.id 
     AND ar2.release_date = MIN(ar.release_date) FILTER (WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned)
   LIMIT 1) as next_release_percentage,
  
  (SELECT ar2.penalty_applies 
   FROM allocation_releases ar2 
   WHERE ar2.contract_allocation_id = ca.id 
     AND ar2.release_date = MIN(ar.release_date) FILTER (WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned)
   LIMIT 1) as next_release_has_penalty,
  
  -- Count upcoming releases
  COUNT(ar.id) FILTER (
    WHERE ar.release_date >= CURRENT_DATE AND NOT ar.release_actioned
  ) as upcoming_releases_count
  
FROM contracts c
JOIN suppliers s ON c.supplier_id = s.id
LEFT JOIN events e ON c.event_id = e.id
JOIN contract_allocations ca ON c.id = ca.contract_id
LEFT JOIN allocation_releases ar ON ca.id = ar.contract_allocation_id
WHERE c.status = 'active'
  AND ca.is_active = true
  AND EXISTS (
    SELECT 1 FROM allocation_releases ar2
    WHERE ar2.contract_allocation_id = ca.id
    AND ar2.release_date >= CURRENT_DATE
    AND NOT ar2.release_actioned
  )
GROUP BY c.id, c.contract_number, c.contract_name, c.contract_type, s.name, e.event_name, c.has_attrition, ca.id, ca.allocation_name, ca.total_quantity, ca.sold_quantity
ORDER BY next_release_date NULLS LAST;

COMMENT ON VIEW contracts_with_upcoming_releases IS 'Contracts with upcoming release dates. CRITICAL for attrition management. Alerts operators to release or commit inventory before penalty dates.';

-- Items needing sourcing (sell-first model)
CREATE VIEW items_needing_sourcing AS
SELECT 
  b.booking_reference,
  b.travel_date_from,
  b.travel_date_from - CURRENT_DATE as days_until_travel,
  c.first_name || ' ' || c.last_name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  bi.id as booking_item_id,
  bi.item_name,
  bi.item_description,
  bi.service_date_from,
  bi.quantity,
  bi.total_price as selling_price,
  bi.unit_cost as estimated_unit_cost,
  bi.total_cost as estimated_total_cost,
  bi.item_notes,
  CASE 
    WHEN bi.item_name LIKE '%Transfer%' THEN 14
    WHEN bi.item_name LIKE '%Dinner%' OR bi.item_name LIKE '%Restaurant%' THEN 30
    WHEN bi.item_name LIKE '%Tour%' OR bi.item_name LIKE '%Experience%' THEN 21
    ELSE 7
  END as recommended_sourcing_days,
  CASE
    WHEN (b.travel_date_from - CURRENT_DATE) <= 14 THEN 'URGENT'
    WHEN (b.travel_date_from - CURRENT_DATE) <= 30 THEN 'SOON'
    WHEN (b.travel_date_from - CURRENT_DATE) <= 60 THEN 'PLANNED'
    ELSE 'FUTURE'
  END as urgency
FROM bookings b
JOIN booking_items bi ON b.id = bi.booking_id
JOIN customers c ON b.customer_id = c.id
WHERE bi.item_status = 'on_request'
  AND bi.supplier_id IS NULL
  AND b.booking_status IN ('confirmed', 'provisional')
  AND b.travel_date_from >= CURRENT_DATE
ORDER BY 
  CASE 
    WHEN (b.travel_date_from - CURRENT_DATE) <= 14 THEN 1
    WHEN (b.travel_date_from - CURRENT_DATE) <= 30 THEN 2
    WHEN (b.travel_date_from - CURRENT_DATE) <= 60 THEN 3
    ELSE 4
  END,
  b.travel_date_from;

COMMENT ON VIEW items_needing_sourcing IS 'Booking items that need supplier sourcing (sell-first, source-later model). Prioritized by urgency.';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get next release date for allocation
CREATE OR REPLACE FUNCTION get_next_release_date(allocation_id UUID)
RETURNS DATE AS $$
  SELECT release_date
  FROM allocation_releases
  WHERE contract_allocation_id = allocation_id
    AND release_date >= CURRENT_DATE
    AND NOT release_actioned
  ORDER BY release_date ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_next_release_date IS 'Get the next upcoming release date for an allocation';

-- Check if allocation is past all release dates
CREATE OR REPLACE FUNCTION is_past_release_dates(allocation_id UUID)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM allocation_releases
    WHERE contract_allocation_id = allocation_id
      AND release_date >= CURRENT_DATE
      AND NOT release_actioned
  );
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION is_past_release_dates IS 'Check if allocation is past all release dates (attrition risk!)';

-- Get contracts expiring soon
CREATE OR REPLACE FUNCTION get_expiring_contracts(days_threshold INTEGER DEFAULT 30)
RETURNS TABLE (
  contract_id UUID,
  contract_number VARCHAR,
  contract_name VARCHAR,
  supplier_name VARCHAR,
  valid_to DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.contract_number,
    c.contract_name,
    s.name,
    c.valid_to,
    (c.valid_to - CURRENT_DATE)::INTEGER
  FROM contracts c
  JOIN suppliers s ON c.supplier_id = s.id
  WHERE c.status = 'active'
    AND c.valid_to BETWEEN CURRENT_DATE AND CURRENT_DATE + days_threshold
  ORDER BY c.valid_to ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_expiring_contracts IS 'Get contracts expiring within specified days. Default 30 days.';

-- Generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference(org_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  org_code VARCHAR(10);
  next_number INTEGER;
  reference VARCHAR(100);
BEGIN
  -- Get organization code
  SELECT COALESCE(code, 'ORG') INTO org_code FROM organizations WHERE id = org_id;
  
  -- Get next booking number for this organization today
  SELECT COALESCE(MAX(
    SUBSTRING(booking_reference FROM '[0-9]+$')::INTEGER
  ), 0) + 1
  INTO next_number
  FROM bookings
  WHERE organization_id = org_id
    AND booking_date::DATE = CURRENT_DATE;
  
  -- Generate reference: ORGCODE-YYYYMMDD-NNN
  reference := org_code || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN reference;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_booking_reference IS 'Generate unique booking reference for organization. Format: ORGCODE-YYYYMMDD-001';

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

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_product_options_updated_at BEFORE UPDATE ON product_options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_event_series_updated_at BEFORE UPDATE ON event_series
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON contract_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_releases_updated_at BEFORE UPDATE ON allocation_releases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON contract_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_supplier_rates_updated_at BEFORE UPDATE ON supplier_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_selling_rates_updated_at BEFORE UPDATE ON selling_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON allocation_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_booking_items_updated_at BEFORE UPDATE ON booking_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_passengers_updated_at BEFORE UPDATE ON booking_passengers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_package_templates_updated_at BEFORE UPDATE ON package_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_customer_history_updated_at BEFORE UPDATE ON customer_event_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_customer_payments_updated_at BEFORE UPDATE ON customer_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '                 DATABASE SCHEMA CREATED SUCCESSFULLY!                   ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CORE TABLES:';
  RAISE NOTICE '   • Organizations (multi-tenant)';
  RAISE NOTICE '   • Users (auth & permissions)';
  RAISE NOTICE '   • Suppliers (hotels, venues, brokers)';
  RAISE NOTICE '   • Products (catalog with 7 types)';
  RAISE NOTICE '   • Product Options (variants)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ EVENTS & SPORTS TRAVEL:';
  RAISE NOTICE '   • Event Series (16 pre-loaded)';
  RAISE NOTICE '   • Events (2025 F1, Golf, Tennis calendar)';
  RAISE NOTICE '   • Customer Event History';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONTRACTS & INVENTORY:';
  RAISE NOTICE '   • Contracts (4 entry modes!)';
  RAISE NOTICE '   • Contract Allocations';
  RAISE NOTICE '   • Allocation Releases (attrition mgmt!)';
  RAISE NOTICE '   • Contract Payments';
  RAISE NOTICE '   • Allocation Inventory (batch tracking)';
  RAISE NOTICE '   • Availability (daily calendar)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ PRICING (Dynamic Pricing Engine):';
  RAISE NOTICE '   • Supplier Rates (date-variable pricing)';
  RAISE NOTICE '   • Selling Rates (early bird, VIP, groups)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CUSTOMERS & BOOKINGS:';
  RAISE NOTICE '   • Customers (VIP tiers, preferences)';
  RAISE NOTICE '   • Bookings (sell-first model support!)';
  RAISE NOTICE '   • Booking Items (on_request status!)';
  RAISE NOTICE '   • Booking Passengers (manifests)';
  RAISE NOTICE '   • Customer Payments';
  RAISE NOTICE '';
  RAISE NOTICE '✅ PACKAGES:';
  RAISE NOTICE '   • Packages (pre-defined packages)';
  RAISE NOTICE '   • Package Templates (reusable blueprints)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ OPERATIONAL VIEWS:';
  RAISE NOTICE '   • active_events_summary';
  RAISE NOTICE '   • repeat_customer_opportunities';
  RAISE NOTICE '   • contracts_with_upcoming_releases';
  RAISE NOTICE '   • items_needing_sourcing';
  RAISE NOTICE '';
  RAISE NOTICE '✅ HELPER FUNCTIONS:';
  RAISE NOTICE '   • get_next_release_date()';
  RAISE NOTICE '   • is_past_release_dates()';
  RAISE NOTICE '   • get_expiring_contracts()';
  RAISE NOTICE '   • generate_booking_reference()';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTICS:';
  RAISE NOTICE '   • Total Tables: 36';
  RAISE NOTICE '   • Total Views: 4';
  RAISE NOTICE '   • Total Functions: 4';
  RAISE NOTICE '   • Total Indexes: 150+';
  RAISE NOTICE '   • Total Triggers: 21+';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRE-LOADED DATA:';
  RAISE NOTICE '   • 7 Product Types';
  RAISE NOTICE '   • 16 Event Series (F1, Golf, Tennis, Rugby)';
  RAISE NOTICE '   • 14 Events for 2025 Season';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY FOR:';
  RAISE NOTICE '   • 30-second purchase orders (quick entry!)';
  RAISE NOTICE '   • 3-minute hotel allocations (with releases!)';
  RAISE NOTICE '   • Event-driven inventory management';
  RAISE NOTICE '   • Sell-first, source-later workflows';
  RAISE NOTICE '   • Dynamic pricing (early bird, VIP, groups)';
  RAISE NOTICE '   • Attrition management ($50k+ savings!)';
  RAISE NOTICE '   • Repeat customer targeting';
  RAISE NOTICE '   • Premium customer tracking';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '                    🎉 READY TO BUILD! 🎉                              ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================