-- MVP Contract Structure - SIMPLIFIED
-- Production-safe (idempotent) migration to align with absolute minimum MVP schema

-- 1) Simplify allocation_buckets - Remove complex fields, add cost tracking
DO $$ BEGIN
  -- First, drop dependent views that reference columns we want to remove
  BEGIN
    DROP VIEW IF EXISTS available_inventory CASCADE;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    DROP VIEW IF EXISTS v_allocation_status CASCADE;
  EXCEPTION WHEN undefined_object THEN NULL; END;
  BEGIN
    DROP VIEW IF EXISTS v_upcoming_deadlines CASCADE;
  EXCEPTION WHEN undefined_object THEN NULL; END;

  -- Remove complex fields that aren't needed for MVP
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS inventory_pool_id CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS slot_id CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS allow_overbooking CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS overbooking_limit CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS event_start_date CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets DROP COLUMN IF EXISTS event_end_date CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Add essential cost tracking fields
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS unit_cost NUMERIC DEFAULT 0;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS committed_cost BOOLEAN DEFAULT false;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS contract_version_id BIGINT;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS contract_id BIGINT;
  EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- 2) Drop complex attrition table and create simple contract_deadlines table
DO $$ BEGIN
  -- Drop the over-engineered attrition periods table
  BEGIN
    DROP TABLE IF EXISTS contract_attrition_periods CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- Create simple contract_deadlines table (replaces complex attrition tracking)
CREATE TABLE IF NOT EXISTS contract_deadlines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id),
  
  -- What does this deadline apply to?
  ref_type TEXT NOT NULL CHECK (ref_type IN ('allocation', 'contract', 'booking')),
  ref_id BIGINT NOT NULL, -- FK to allocation_buckets, contracts, or bookings
  
  -- Deadline details
  deadline_type TEXT NOT NULL, -- 'release', 'deposit', 'balance', 'final_numbers', etc.
  deadline_date DATE NOT NULL,
  
  -- What happens if missed?
  penalty_type TEXT, -- 'percentage', 'fixed_amount', 'forfeit_deposit', 'none'
  penalty_value NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'missed', 'waived')),
  actioned_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for contract_deadlines
CREATE INDEX IF NOT EXISTS idx_deadlines_pending ON contract_deadlines(deadline_date, status) 
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_deadlines_ref ON contract_deadlines(ref_type, ref_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_org ON contract_deadlines(org_id);

-- 3) Simplify contract_versions - Remove over-engineered attrition fields and duplicate policies
DO $$ BEGIN
  -- Drop complex attrition fields that aren't needed for MVP
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS attrition_applies CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS committed_quantity CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS minimum_pickup_percent CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS penalty_calculation CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS grace_allowance CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS attrition_period_type CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS default_cancellation_policy CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS default_payment_policy CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS additional_policies CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS key_dates CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Drop duplicate single policy columns (keep only the array versions)
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS cancellation_policy CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS payment_policy CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE contract_versions DROP COLUMN IF EXISTS terms CASCADE;
  EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- 4) Add contract links to allocation_buckets
DO $$ BEGIN
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS contract_version_id BIGINT REFERENCES contract_versions(id);
  EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN
    ALTER TABLE allocation_buckets ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES contracts(id);
  EXCEPTION WHEN undefined_table THEN NULL; END;
END $$;

-- Indexes for allocation_buckets contract links
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_contract_version ON allocation_buckets(contract_version_id);
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_contract ON allocation_buckets(contract_id);

-- 4) Create essential views for MVP dashboard
CREATE OR REPLACE VIEW v_upcoming_deadlines AS
SELECT 
  cd.id,
  o.name AS org_name,
  cd.deadline_type,
  cd.deadline_date,
  (cd.deadline_date - CURRENT_DATE) AS days_until,
  cd.status,
  
  -- Context
  CASE cd.ref_type
    WHEN 'allocation' THEN (
      SELECT concat(pv.name, ' - ', s.name)
      FROM allocation_buckets ab
      JOIN product_variants pv ON ab.product_variant_id = pv.id
      JOIN suppliers s ON ab.supplier_id = s.id
      WHERE ab.id = cd.ref_id
    )
    WHEN 'contract' THEN (
      SELECT concat(c.reference, ' - ', s.name)
      FROM contracts c
      JOIN suppliers s ON c.supplier_id = s.id
      WHERE c.id = cd.ref_id
    )
    ELSE 'Booking deadline'
  END AS description,
  
  -- Financial impact
  CASE cd.ref_type
    WHEN 'allocation' THEN (
      SELECT (ab.quantity - ab.booked) * ab.unit_cost
      FROM allocation_buckets ab
      WHERE ab.id = cd.ref_id AND ab.committed_cost = true
    )
    ELSE cd.penalty_value
  END AS at_risk_amount,
  
  cd.penalty_type,
  cd.notes

FROM contract_deadlines cd
JOIN organizations o ON cd.org_id = o.id

WHERE cd.status = 'pending'
  AND cd.deadline_date >= CURRENT_DATE
  
ORDER BY cd.deadline_date, at_risk_amount DESC NULLS LAST;

CREATE OR REPLACE VIEW v_allocation_status AS
SELECT 
  o.name AS org_name,
  s.name AS supplier_name,
  pv.name AS product_name,
  ab.date AS service_date,
  ab.quantity AS allocated,
  ab.booked AS sold,
  ab.held AS on_hold,
  (ab.quantity - ab.booked - ab.held) AS available,
  ab.unit_cost,
  ab.currency,
  
  -- Financial
  CASE 
    WHEN ab.committed_cost THEN (ab.quantity * ab.unit_cost)
    ELSE NULL
  END AS committed_value,
  
  CASE 
    WHEN ab.committed_cost THEN ((ab.quantity - ab.booked) * ab.unit_cost)
    ELSE NULL
  END AS exposure,
  
  -- Deadlines
  (SELECT MIN(cd.deadline_date)
   FROM contract_deadlines cd
   WHERE cd.ref_type = 'allocation' 
     AND cd.ref_id = ab.id 
     AND cd.status = 'pending'
  ) AS next_deadline,
  
  ab.stop_sell,
  ab.blackout

FROM allocation_buckets ab
JOIN organizations o ON ab.org_id = o.id
JOIN suppliers s ON ab.supplier_id = s.id
JOIN product_variants pv ON ab.product_variant_id = pv.id

WHERE ab.date >= CURRENT_DATE
  AND ab.quantity > 0

ORDER BY ab.date, exposure DESC NULLS LAST;

-- 5) Ensure core contract tables exist (idempotent creates)
CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  contract_type TEXT NULL,
  signed_date DATE NULL,
  notes TEXT NULL,
  signed_document_url TEXT NULL,
  terms_and_conditions TEXT NULL,
  special_terms TEXT NULL,
  CONSTRAINT contracts_contract_type_check CHECK (contract_type = ANY (ARRAY['net_rate','commissionable','allocation']))
);

CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_date ON contracts(signed_date);
CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON contracts(supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(org_id, status);

CREATE TABLE IF NOT EXISTS contract_versions (
  id BIGSERIAL PRIMARY KEY,
  org_id BIGINT NOT NULL REFERENCES organizations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  contract_id BIGINT NOT NULL REFERENCES contracts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  cancellation_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id BIGINT NULL REFERENCES contract_versions(id) ON UPDATE CASCADE ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  commission_rate NUMERIC NULL,
  currency TEXT NULL DEFAULT 'GBP',
  booking_cutoff_days INTEGER NULL,
  CONSTRAINT contract_versions_valid_date_range CHECK (valid_to > valid_from),
  CONSTRAINT contract_versions_booking_cutoff_days_check CHECK (booking_cutoff_days IS NULL OR booking_cutoff_days > 0),
  CONSTRAINT contract_versions_commission_rate_check CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100))
);

CREATE INDEX IF NOT EXISTS idx_contract_versions_commission_rate ON contract_versions(commission_rate);
CREATE INDEX IF NOT EXISTS idx_contract_versions_currency ON contract_versions(currency);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract ON contract_versions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_dates ON contract_versions(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract_valid_to ON contract_versions(contract_id, valid_to);
