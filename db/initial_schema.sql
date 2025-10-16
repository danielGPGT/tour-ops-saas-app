-- PostgreSQL initial schema for multi-tenant tour-ops SaaS
-- All domain tables include org_id for tenant isolation
-- Conventions:
-- - Primary keys use bigint identity
-- - created_at/updated_at timestamps default to now(), updated via triggers in app layer
-- - Textual enums are CHECK constraints to avoid hard SQL enums during early iteration

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              TEXT NOT NULL,
  settings          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  terms             JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels          TEXT[] NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_org ON suppliers(org_id);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  type              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (type IN ('accommodation','activity','event','transfer','package'))
);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);

-- Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id        BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  subtype           TEXT NOT NULL,
  attributes        JSONB NOT NULL DEFAULT '{}'::jsonb,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (subtype IN ('room_category','seat_tier','time_slot','none')),
  UNIQUE (org_id, product_id, name)
);
CREATE INDEX IF NOT EXISTS idx_product_variants_org_prod ON product_variants(org_id, product_id);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id       BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  reference         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, supplier_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_contracts_org_supplier ON contracts(org_id, supplier_id);

-- Contract Versions (immutable effective dating)
CREATE TABLE IF NOT EXISTS contract_versions (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id                BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id           BIGINT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  valid_from            DATE NOT NULL,
  valid_to              DATE NOT NULL,
  cancellation_policy   JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_policy        JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id         BIGINT NULL REFERENCES contract_versions(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_from < valid_to)
);
CREATE INDEX IF NOT EXISTS idx_contract_versions_org_contract ON contract_versions(org_id, contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_effective ON contract_versions(org_id, valid_from, valid_to);

-- Rate Plans (aka Rate Sheets) - hybrid model with canonical JSON doc + normalized tables
CREATE TABLE IF NOT EXISTS rate_plans (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id                BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_variant_id    BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  supplier_id           BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  contract_version_id   BIGINT NOT NULL REFERENCES contract_versions(id) ON DELETE RESTRICT,
  inventory_model       TEXT NOT NULL,
  currency              TEXT NOT NULL,
  markets               TEXT[] NOT NULL DEFAULT '{}',
  channels              TEXT[] NOT NULL DEFAULT '{}',
  preferred             BOOLEAN NOT NULL DEFAULT FALSE,
  valid_from            DATE NOT NULL,
  valid_to              DATE NOT NULL,
  rate_doc              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_from < valid_to),
  CHECK (inventory_model IN ('committed','on_request','freesale'))
);
CREATE INDEX IF NOT EXISTS idx_rate_plans_variant_window ON rate_plans(org_id, product_variant_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_rate_plans_contract ON rate_plans(org_id, contract_version_id);

-- Rate Seasons
CREATE TABLE IF NOT EXISTS rate_seasons (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  season_from       DATE NOT NULL,
  season_to         DATE NOT NULL,
  dow_mask          SMALLINT NOT NULL DEFAULT 127, -- 7-bit mask (Mon-Sun)
  min_stay          SMALLINT NULL,
  max_stay          SMALLINT NULL,
  min_pax           SMALLINT NULL,
  max_pax           SMALLINT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (season_from < season_to)
);
CREATE INDEX IF NOT EXISTS idx_rate_seasons_window ON rate_seasons(org_id, rate_plan_id, season_from, season_to);

-- Rate Occupancies
CREATE TABLE IF NOT EXISTS rate_occupancies (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  occupancy_type    TEXT NOT NULL,
  price_type        TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (occupancy_type IN ('single','double','triple','quad')),
  CHECK (price_type IN ('per_unit','per_person'))
);
CREATE INDEX IF NOT EXISTS idx_rate_occupancies_plan ON rate_occupancies(org_id, rate_plan_id, occupancy_type);

-- Rate Age Bands
CREATE TABLE IF NOT EXISTS rate_age_bands (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  min_age           SMALLINT NOT NULL,
  max_age           SMALLINT NOT NULL,
  price_type        TEXT NOT NULL,
  value             NUMERIC(12,4) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (price_type IN ('fixed','factor')),
  CHECK (min_age >= 0 AND max_age >= min_age)
);
CREATE INDEX IF NOT EXISTS idx_rate_age_bands_plan ON rate_age_bands(org_id, rate_plan_id, label);

-- Rate Adjustments (DOW, group, promo, channel)
CREATE TABLE IF NOT EXISTS rate_adjustments (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  scope             TEXT NOT NULL,
  condition         JSONB NOT NULL DEFAULT '{}'::jsonb,
  adjustment_type   TEXT NOT NULL,
  value             NUMERIC(12,4) NOT NULL,
  priority          INT NOT NULL DEFAULT 100,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (scope IN ('season','dow','group','promo','channel')),
  CHECK (adjustment_type IN ('percent','fixed'))
);
CREATE INDEX IF NOT EXISTS idx_rate_adjustments_plan ON rate_adjustments(org_id, rate_plan_id, scope, priority);

-- Taxes & Fees
CREATE TABLE IF NOT EXISTS rate_taxes_fees (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_plan_id      BIGINT NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  jurisdiction      TEXT NULL,
  inclusive         BOOLEAN NOT NULL DEFAULT FALSE,
  calc_base         TEXT NOT NULL,
  amount_type       TEXT NOT NULL,
  value             NUMERIC(12,4) NOT NULL,
  rounding_rule     TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (calc_base IN ('net','gross','per_person','per_booking')),
  CHECK (amount_type IN ('percent','fixed'))
);
CREATE INDEX IF NOT EXISTS idx_rate_taxes_fees_plan ON rate_taxes_fees(org_id, rate_plan_id);

-- Allocation Buckets (availability per date, supplier, variant)
CREATE TABLE IF NOT EXISTS allocation_buckets (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  supplier_id       BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  date              DATE NOT NULL,
  allocation_type   TEXT NOT NULL,
  quantity          INT NULL, -- NULL = unlimited
  booked            INT NOT NULL DEFAULT 0,
  held              INT NOT NULL DEFAULT 0,
  release_period_hours INT NULL,
  stop_sell         BOOLEAN NOT NULL DEFAULT FALSE,
  blackout          BOOLEAN NOT NULL DEFAULT FALSE,
  category_id       BIGINT NULL,
  slot_id           BIGINT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (allocation_type IN ('committed','on_request','freesale')),
  CHECK (quantity IS NULL OR quantity >= 0),
  CHECK (booked >= 0 AND held >= 0),
  UNIQUE (org_id, product_variant_id, supplier_id, date, COALESCE(category_id,0), COALESCE(slot_id,0))
);
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_search ON allocation_buckets(org_id, product_variant_id, date);

-- Allocation Holds
CREATE TABLE IF NOT EXISTS allocation_holds (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  allocation_bucket_id BIGINT NOT NULL REFERENCES allocation_buckets(id) ON DELETE CASCADE,
  quantity          INT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  booking_ref       TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (quantity > 0)
);
CREATE INDEX IF NOT EXISTS idx_allocation_holds_bucket ON allocation_holds(org_id, allocation_bucket_id);
CREATE INDEX IF NOT EXISTS idx_allocation_holds_expiry ON allocation_holds(org_id, expires_at);

-- Packages
CREATE TABLE IF NOT EXISTS packages (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT NULL,
  pricing_mode      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (pricing_mode IN ('fixed','dynamic'))
);
CREATE INDEX IF NOT EXISTS idx_packages_org ON packages(org_id);

-- Package Components
CREATE TABLE IF NOT EXISTS package_components (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  package_id        BIGINT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  sequence          INT NOT NULL,
  quantity          INT NOT NULL DEFAULT 1,
  pricing_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_package_components_pkg ON package_components(org_id, package_id, sequence);

-- Product Add-ons
CREATE TABLE IF NOT EXISTS product_addons (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  price_type        TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,
  taxable           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (price_type IN ('per_person','per_booking'))
);
CREATE INDEX IF NOT EXISTS idx_product_addons_variant ON product_addons(org_id, product_variant_id);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference         TEXT NOT NULL,
  channel           TEXT NOT NULL,
  status            TEXT NOT NULL,
  total_cost        NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_price       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_margin      NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, reference)
);
CREATE INDEX IF NOT EXISTS idx_bookings_org_status ON bookings(org_id, status);

-- Booking Items
CREATE TABLE IF NOT EXISTS booking_items (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  product_variant_id BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  supplier_id       BIGINT NULL REFERENCES suppliers(id) ON DELETE SET NULL,
  state             TEXT NOT NULL,
  service_start     TIMESTAMPTZ NOT NULL,
  service_end       TIMESTAMPTZ NULL,
  quantity          INT NOT NULL DEFAULT 1,
  pax_breakdown     JSONB NOT NULL DEFAULT '{}'::jsonb,
  unit_cost         NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit_price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  margin            NUMERIC(12,2) NOT NULL DEFAULT 0,
  product_variant_name TEXT NOT NULL,
  supplier_name     TEXT NULL,
  rate_plan_code    TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (state IN ('option','needs_supplier_assignment','supplier_pending','confirmed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_booking_items_queue ON booking_items(org_id, state);
CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(org_id, booking_id);

-- Booking Item Add-ons
CREATE TABLE IF NOT EXISTS booking_item_addons (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_item_id   BIGINT NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  addon_id          BIGINT NULL REFERENCES product_addons(id) ON DELETE SET NULL,
  quantity          INT NOT NULL DEFAULT 1,
  amount            NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_booking_item_addons_item ON booking_item_addons(org_id, booking_item_id);

-- Passengers
CREATE TABLE IF NOT EXISTS passengers (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  dob               DATE NULL,
  age               SMALLINT NULL,
  gender            TEXT NULL,
  passport          TEXT NULL,
  nationality       TEXT NULL,
  dietary           TEXT NULL,
  medical           TEXT NULL,
  is_lead           BOOLEAN NOT NULL DEFAULT FALSE,
  assignment        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(org_id, booking_id);

-- Payment Schedules
CREATE TABLE IF NOT EXISTS payment_schedules (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,
  due_at            TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (type IN ('deposit','balance','installment'))
);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_due ON payment_schedules(org_id, due_at);

-- Payments (customer)
CREATE TABLE IF NOT EXISTS payments (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payment_schedule_id BIGINT NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  received_at       TIMESTAMPTZ NOT NULL,
  method            TEXT NOT NULL,
  status            TEXT NOT NULL,
  reference         TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_schedule ON payments(org_id, payment_schedule_id);

-- Supplier Payments (payables)
CREATE TABLE IF NOT EXISTS supplier_payments (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_item_id   BIGINT NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  due_at            TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  invoice_ref       TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_due ON supplier_payments(org_id, due_at);

-- Agents and Commissions
CREATE TABLE IF NOT EXISTS agents (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  terms             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(org_id);

CREATE TABLE IF NOT EXISTS agent_commissions (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_id        BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  basis             TEXT NOT NULL, -- net|gross
  rate              NUMERIC(6,4) NOT NULL,
  amount            NUMERIC(12,2) NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (basis IN ('net','gross'))
);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking ON agent_commissions(org_id, booking_id);

CREATE TABLE IF NOT EXISTS commission_payments (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id          BIGINT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  amount            NUMERIC(12,2) NOT NULL,
  paid_at           TIMESTAMPTZ NOT NULL,
  reference         TEXT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_commission_payments_agent ON commission_payments(org_id, agent_id, paid_at);

-- Fulfillment Tasks
CREATE TABLE IF NOT EXISTS fulfillment_tasks (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_item_id   BIGINT NOT NULL REFERENCES booking_items(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  payload           JSONB NOT NULL DEFAULT '{}'::jsonb,
  due_at            TIMESTAMPTZ NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fulfillment_tasks_queue ON fulfillment_tasks(org_id, status, due_at);

-- Helpful partial indexes for queues (example; adapt as needed)
CREATE INDEX IF NOT EXISTS idx_booking_items_needs_action ON booking_items(org_id)
  WHERE state IN ('needs_supplier_assignment','supplier_pending','option');

-- Notes on partitioning (apply in later migration once volumes justify):
-- - allocation_buckets: RANGE PARTITION by date, SUBPARTITION by org_id
-- - booking_items: RANGE PARTITION by service_start::date, SUBPARTITION by org_id
-- - payment_schedules: RANGE PARTITION by due_at::date, SUBPARTITION by org_id


