-- Migration to remove contract_versions and simplify to direct contract relationships
-- This migration safely handles existing data and columns

-- Step 1: Add contract terms fields to contracts table (if they don't exist)
DO $$ 
BEGIN
    -- Add commission_rate if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'commission_rate') THEN
        ALTER TABLE contracts ADD COLUMN commission_rate numeric CHECK (commission_rate IS NULL OR commission_rate >= 0::numeric AND commission_rate <= 100::numeric);
    END IF;
    
    -- Add currency if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'currency') THEN
        ALTER TABLE contracts ADD COLUMN currency text DEFAULT 'USD'::text;
    END IF;
    
    -- Add booking_cutoff_days if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'booking_cutoff_days') THEN
        ALTER TABLE contracts ADD COLUMN booking_cutoff_days integer CHECK (booking_cutoff_days IS NULL OR booking_cutoff_days > 0);
    END IF;
    
    -- Add cancellation_policies if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'cancellation_policies') THEN
        ALTER TABLE contracts ADD COLUMN cancellation_policies jsonb NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add payment_policies if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'payment_policies') THEN
        ALTER TABLE contracts ADD COLUMN payment_policies jsonb NOT NULL DEFAULT '[]'::jsonb;
    END IF;
    
    -- Add valid_from if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'valid_from') THEN
        ALTER TABLE contracts ADD COLUMN valid_from date;
    END IF;
    
    -- Add valid_to if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contracts' AND column_name = 'valid_to') THEN
        ALTER TABLE contracts ADD COLUMN valid_to date;
    END IF;
END $$;

-- Step 2: Migrate data from contract_versions to contracts
-- Only update contracts that don't already have this data
UPDATE contracts 
SET 
  commission_rate = cv.commission_rate,
  currency = cv.currency,
  booking_cutoff_days = cv.booking_cutoff_days,
  cancellation_policies = cv.cancellation_policies,
  payment_policies = cv.payment_policies,
  valid_from = cv.valid_from,
  valid_to = cv.valid_to
FROM contract_versions cv
WHERE contracts.id = cv.contract_id
AND contracts.commission_rate IS NULL  -- Only update if not already set
AND cv.valid_from <= CURRENT_DATE 
AND cv.valid_to >= CURRENT_DATE;

-- Step 3: Add contract_id to rate_plans (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rate_plans' AND column_name = 'contract_id') THEN
        ALTER TABLE rate_plans ADD COLUMN contract_id bigint;
    END IF;
END $$;

-- Step 4: Add foreign key constraint for rate_plans.contract_id (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'rate_plans_contract_id_fkey') THEN
        ALTER TABLE rate_plans ADD CONSTRAINT rate_plans_contract_id_fkey 
          FOREIGN KEY (contract_id) REFERENCES public.contracts(id);
    END IF;
END $$;

-- Step 5: Migrate rate_plans data from contract_versions to contracts
UPDATE rate_plans 
SET contract_id = cv.contract_id 
FROM contract_versions cv 
WHERE rate_plans.contract_version_id = cv.id
AND rate_plans.contract_id IS NULL;  -- Only update if not already set

-- Step 6: Migrate allocation_buckets data from contract_versions to contracts
-- (contract_id already exists in allocation_buckets, just need to populate it)
UPDATE allocation_buckets 
SET contract_id = cv.contract_id 
FROM contract_versions cv 
WHERE allocation_buckets.contract_version_id = cv.id
AND allocation_buckets.contract_id IS NULL;  -- Only update if not already set

-- Step 6.5: Contract deadlines are already properly linked to contracts via ref_id
-- No migration needed for contract_deadlines as they use ref_type='contract' and ref_id=contract_id

-- Step 7: Remove old foreign key constraints
DO $$ 
BEGIN
    -- Drop rate_plans.contract_version_id foreign key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'rate_plans_contract_version_id_fkey') THEN
        ALTER TABLE rate_plans DROP CONSTRAINT rate_plans_contract_version_id_fkey;
    END IF;
END $$;

-- Step 8: Remove old columns
DO $$ 
BEGIN
    -- Drop rate_plans.contract_version_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'rate_plans' AND column_name = 'contract_version_id') THEN
        ALTER TABLE rate_plans DROP COLUMN contract_version_id;
    END IF;
    
    -- Drop allocation_buckets.contract_version_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'allocation_buckets' AND column_name = 'contract_version_id') THEN
        ALTER TABLE allocation_buckets DROP COLUMN contract_version_id;
    END IF;
END $$;

-- Step 9: Drop contract_versions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'contract_versions') THEN
        DROP TABLE contract_versions;
    END IF;
END $$;

-- Step 10: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_plans_contract_id ON rate_plans(contract_id);
CREATE INDEX IF NOT EXISTS idx_allocation_buckets_contract_id ON allocation_buckets(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_valid_dates ON contracts(valid_from, valid_to);
