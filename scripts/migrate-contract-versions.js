const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting contract versions migration...');
  
  try {
    // Step 1: Add contract terms fields to contracts table
    console.log('📝 Step 1: Adding contract terms fields to contracts table...');
    
    const addFieldsSQL = `
      -- Add contract terms fields to contracts table (if they don't exist)
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
    `;
    
    const { error: fieldsError } = await supabase.rpc('exec_sql', { sql: addFieldsSQL });
    if (fieldsError) {
      console.error('❌ Error adding fields:', fieldsError);
      throw fieldsError;
    }
    console.log('✅ Contract terms fields added successfully');
    
    // Step 2: Migrate data from contract_versions to contracts
    console.log('📝 Step 2: Migrating data from contract_versions to contracts...');
    
    const migrateDataSQL = `
      -- Migrate data from contract_versions to contracts
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
    `;
    
    const { error: migrateError } = await supabase.rpc('exec_sql', { sql: migrateDataSQL });
    if (migrateError) {
      console.error('❌ Error migrating data:', migrateError);
      throw migrateError;
    }
    console.log('✅ Data migrated successfully');
    
    // Step 3: Add contract_id to rate_plans
    console.log('📝 Step 3: Adding contract_id to rate_plans...');
    
    const addContractIdSQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'rate_plans' AND column_name = 'contract_id') THEN
              ALTER TABLE rate_plans ADD COLUMN contract_id bigint;
          END IF;
      END $$;
    `;
    
    const { error: contractIdError } = await supabase.rpc('exec_sql', { sql: addContractIdSQL });
    if (contractIdError) {
      console.error('❌ Error adding contract_id to rate_plans:', contractIdError);
      throw contractIdError;
    }
    console.log('✅ contract_id added to rate_plans');
    
    // Step 4: Add foreign key constraint
    console.log('📝 Step 4: Adding foreign key constraint...');
    
    const addForeignKeySQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                         WHERE constraint_name = 'rate_plans_contract_id_fkey') THEN
              ALTER TABLE rate_plans ADD CONSTRAINT rate_plans_contract_id_fkey 
                FOREIGN KEY (contract_id) REFERENCES public.contracts(id);
          END IF;
      END $$;
    `;
    
    const { error: fkError } = await supabase.rpc('exec_sql', { sql: addForeignKeySQL });
    if (fkError) {
      console.error('❌ Error adding foreign key:', fkError);
      throw fkError;
    }
    console.log('✅ Foreign key constraint added');
    
    // Step 5: Migrate rate_plans data
    console.log('📝 Step 5: Migrating rate_plans data...');
    
    const migrateRatePlansSQL = `
      UPDATE rate_plans 
      SET contract_id = cv.contract_id 
      FROM contract_versions cv 
      WHERE rate_plans.contract_version_id = cv.id
      AND rate_plans.contract_id IS NULL;
    `;
    
    const { error: ratePlansError } = await supabase.rpc('exec_sql', { sql: migrateRatePlansSQL });
    if (ratePlansError) {
      console.error('❌ Error migrating rate_plans:', ratePlansError);
      throw ratePlansError;
    }
    console.log('✅ Rate plans data migrated');
    
    // Step 6: Migrate allocation_buckets data
    console.log('📝 Step 6: Migrating allocation_buckets data...');
    
    const migrateAllocationSQL = `
      UPDATE allocation_buckets 
      SET contract_id = cv.contract_id 
      FROM contract_versions cv 
      WHERE allocation_buckets.contract_version_id = cv.id
      AND allocation_buckets.contract_id IS NULL;
    `;
    
    const { error: allocationError } = await supabase.rpc('exec_sql', { sql: migrateAllocationSQL });
    if (allocationError) {
      console.error('❌ Error migrating allocation_buckets:', allocationError);
      throw allocationError;
    }
    console.log('✅ Allocation buckets data migrated');
    
    // Step 6.5: Contract deadlines are already properly linked
    console.log('📝 Step 6.5: Contract deadlines are already properly linked to contracts via ref_id');
    console.log('✅ Contract deadlines use ref_type="contract" and ref_id=contract_id - no migration needed');
    
    // Step 7: Remove old constraints and columns
    console.log('📝 Step 7: Removing old constraints and columns...');
    
    const removeOldSQL = `
      DO $$ 
      BEGIN
          -- Drop rate_plans.contract_version_id foreign key if it exists
          IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                     WHERE constraint_name = 'rate_plans_contract_version_id_fkey') THEN
              ALTER TABLE rate_plans DROP CONSTRAINT rate_plans_contract_version_id_fkey;
          END IF;
          
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
    `;
    
    const { error: removeError } = await supabase.rpc('exec_sql', { sql: removeOldSQL });
    if (removeError) {
      console.error('❌ Error removing old columns:', removeError);
      throw removeError;
    }
    console.log('✅ Old constraints and columns removed');
    
    // Step 8: Drop contract_versions table
    console.log('📝 Step 8: Dropping contract_versions table...');
    
    const dropTableSQL = `
      DO $$ 
      BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.tables 
                     WHERE table_name = 'contract_versions') THEN
              DROP TABLE contract_versions;
          END IF;
      END $$;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropTableSQL });
    if (dropError) {
      console.error('❌ Error dropping contract_versions table:', dropError);
      throw dropError;
    }
    console.log('✅ contract_versions table dropped');
    
    // Step 9: Add indexes for performance
    console.log('📝 Step 9: Adding performance indexes...');
    
    const addIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_rate_plans_contract_id ON rate_plans(contract_id);
      CREATE INDEX IF NOT EXISTS idx_allocation_buckets_contract_id ON allocation_buckets(contract_id);
      CREATE INDEX IF NOT EXISTS idx_contracts_valid_dates ON contracts(valid_from, valid_to);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: addIndexesSQL });
    if (indexError) {
      console.error('❌ Error adding indexes:', indexError);
      throw indexError;
    }
    console.log('✅ Performance indexes added');
    
    console.log('🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log('  ✅ Contract terms fields added to contracts table');
    console.log('  ✅ Data migrated from contract_versions to contracts');
    console.log('  ✅ contract_id added to rate_plans and allocation_buckets');
    console.log('  ✅ Foreign key constraints added');
    console.log('  ✅ Old contract_version_id columns removed');
    console.log('  ✅ contract_versions table dropped');
    console.log('  ✅ Performance indexes added');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
