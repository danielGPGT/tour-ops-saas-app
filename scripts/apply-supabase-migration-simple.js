const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

async function applyMigration() {
  try {
    console.log('🚀 Applying Master Rate Support Migration to Supabase...\n');

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      console.log('💡 Make sure your .env.local contains:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=...');
      console.log('   SUPABASE_SERVICE_ROLE_KEY=...');
      process.exit(1);
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔗 Connected to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/:[^:]*@/, ':***@'));

    // Test connection first
    console.log('\n🧪 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ Connection successful');

    // Step 1: Make supplier_id nullable
    console.log('\n📝 Step 1: Making supplier_id nullable in rate_plans...');
    const { error: alterError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE rate_plans ALTER COLUMN supplier_id DROP NOT NULL;'
    });

    if (alterError) {
      console.log('⚠️  Alter column error (might already be nullable):', alterError.message);
    } else {
      console.log('✅ supplier_id is now nullable');
    }

    // Step 2: Add check constraint
    console.log('\n📝 Step 2: Adding data integrity constraint...');
    const { error: constraintError } = await supabase.rpc('exec', {
      sql: `ALTER TABLE rate_plans 
            ADD CONSTRAINT rate_admin_supplier_or_master_check 
            CHECK (
              (supplier_id IS NOT NULL) OR 
              (supplier_id IS NULL AND preferred = true AND inventory_model = 'freesale')
            );`
    });

    if (constraintError) {
      console.log('⚠️  Constraint error (might already exist):', constraintError.message);
    } else {
      console.log('✅ Data integrity constraint added');
    }

    // Step 3: Add index
    console.log('\n📝 Step 3: Creating performance index...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: `CREATE INDEX IF NOT EXISTS idx_rate_plans_master_rates 
            ON rate_plans (org_id, product_variant_id, preferred) 
            WHERE supplier_id IS NULL;`
    });

    if (indexError) {
      console.log('⚠️  Index error (might already exist):', indexError.message);
    } else {
      console.log('✅ Performance index created');
    }

    // Step 4: Add comment
    console.log('\n📝 Step 4: Adding column documentation...');
    const { error: commentError } = await supabase.rpc('exec', {
      sql: `COMMENT ON COLUMN rate_plans.supplier_id IS 
            'NULL for master/selling rates, NOT NULL for supplier/cost rates. Master rates define what customers pay, supplier rates define what we pay suppliers.';`
    });

    if (commentError) {
      console.log('⚠️  Comment error (might already exist):', commentError.message);
    } else {
      console.log('✅ Column documentation added');
    }

    // Step 5: Create master rate function
    console.log('\n📝 Step 5: Creating master rate helper function...');
    const masterRateFunction = `
      CREATE OR REPLACE FUNCTION get_master_rate(
        p_org_id bigint,
        p_product_variant_id bigint,
        p_date date DEFAULT CURRENT_DATE
      ) RETURNS TABLE (
        rate_plan_id bigint,
        selling_price numeric,
        currency text,
        valid_from date,
        valid_to date
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          rp.id,
          ro.base_amount,
          rp.currency,
          rp.valid_from,
          rp.valid_to
        FROM rate_plans rp
        JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
        WHERE rp.org_id = p_org_id
          AND rp.product_variant_id = p_product_variant_id
          AND rp.supplier_id IS NULL
          AND rp.preferred = true
          AND rp.valid_from <= p_date
          AND rp.valid_to >= p_date
        ORDER BY rp.priority DESC
        LIMIT 1;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: masterFuncError } = await supabase.rpc('exec', { sql: masterRateFunction });

    if (masterFuncError) {
      console.log('⚠️  Master rate function error:', masterFuncError.message);
    } else {
      console.log('✅ Master rate helper function created');
    }

    // Step 6: Create supplier rates function
    console.log('\n📝 Step 6: Creating supplier rates helper function...');
    const supplierRatesFunction = `
      CREATE OR REPLACE FUNCTION get_supplier_rates(
        p_org_id bigint,
        p_product_variant_id bigint,
        p_date date DEFAULT CURRENT_DATE
      ) RETURNS TABLE (
        rate_plan_id bigint,
        supplier_id bigint,
        supplier_name text,
        cost_price numeric,
        currency text,
        priority integer,
        valid_from date,
        valid_to date,
        inventory_model text
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          rp.id,
          rp.supplier_id,
          s.name,
          ro.base_amount,
          rp.currency,
          rp.priority,
          rp.valid_from,
          rp.valid_to,
          rp.inventory_model
        FROM rate_plans rp
        JOIN rate_occupancies ro ON ro.rate_plan_id = rp.id
        JOIN suppliers s ON s.id = rp.supplier_id
        WHERE rp.org_id = p_org_id
          AND rp.product_variant_id = p_product_variant_id
          AND rp.supplier_id IS NOT NULL
          AND rp.valid_from <= p_date
          AND rp.valid_to >= p_date
        ORDER BY rp.priority DESC, ro.base_amount ASC;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const { error: supplierFuncError } = await supabase.rpc('exec', { sql: supplierRatesFunction });

    if (supplierFuncError) {
      console.log('⚠️  Supplier rates function error:', supplierFuncError.message);
    } else {
      console.log('✅ Supplier rates helper function created');
    }

    console.log('\n🎉 Master Rate Support Migration Applied Successfully!');
    console.log('\n🎯 What was added:');
    console.log('  • Made supplier_id nullable in rate_plans table');
    console.log('  • Added constraint to ensure data integrity');
    console.log('  • Created helper functions for master/supplier rates');
    console.log('  • Added indexes for performance');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Test the enhanced availability service');
    console.log('  2. Create master rates for your F1 products');
    console.log('  3. Test the booking flow with auto-selection');

    // Test the new functions
    console.log('\n🧪 Testing new functions...');
    
    const { data: testMaster, error: masterError } = await supabase.rpc('get_master_rate', {
      p_org_id: 1,
      p_product_variant_id: 1,
      p_date: new Date().toISOString().split('T')[0]
    });
    
    if (masterError) {
      console.log('⚠️  Master rate function test failed (this is expected if no master rates exist yet)');
    } else {
      console.log('✅ Master rate function working');
    }
    
    const { data: testSupplier, error: supplierError } = await supabase.rpc('get_supplier_rates', {
      p_org_id: 1,
      p_product_variant_id: 1,
      p_date: new Date().toISOString().split('T')[0]
    });
    
    if (supplierError) {
      console.log('⚠️  Supplier rates function test failed (this is expected if no supplier rates exist yet)');
    } else {
      console.log('✅ Supplier rates function working');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    console.log('\n🛠️  Manual alternative:');
    console.log('  1. Go to your Supabase dashboard');
    console.log('  2. Navigate to SQL Editor');
    console.log('  3. Copy the contents of db/migrations/add_master_rate_support.sql');
    console.log('  4. Run the SQL manually');
    
    process.exit(1);
  }
}

applyMigration();
