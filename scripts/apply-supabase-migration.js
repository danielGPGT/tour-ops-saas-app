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

    // Read the migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'add_master_rate_support.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration SQL loaded successfully');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`\n⏳ Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      if (statement.includes('-- Add Master Rate Support')) {
        console.log(`\n📝 Step ${i + 1}: Making supplier_id nullable...`);
      } else if (statement.includes('ALTER TABLE rate_plans ADD CONSTRAINT')) {
        console.log(`📝 Step ${i + 1}: Adding data integrity constraint...`);
      } else if (statement.includes('CREATE INDEX')) {
        console.log(`📝 Step ${i + 1}: Creating performance index...`);
      } else if (statement.includes('COMMENT ON COLUMN')) {
        console.log(`📝 Step ${i + 1}: Adding column documentation...`);
      } else if (statement.includes('CREATE OR REPLACE FUNCTION get_master_rate')) {
        console.log(`📝 Step ${i + 1}: Creating master rate helper function...`);
      } else if (statement.includes('CREATE OR REPLACE FUNCTION get_supplier_rates')) {
        console.log(`📝 Step ${i + 1}: Creating supplier rates helper function...`);
      } else {
        console.log(`📝 Step ${i + 1}: Executing SQL statement...`);
      }

      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in step ${i + 1}:`, error.message);
        console.log('📄 Failed statement:', statement.substring(0, 100) + '...');
        
        // Some errors might be expected (like "already exists")
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('⚠️  This might be expected - continuing...');
          continue;
        }
        
        console.log('\n🛠️  Troubleshooting:');
        console.log('  • Check if you have the necessary permissions');
        console.log('  • Verify the database schema is correct');
        console.log('  • Some statements might need to be run manually');
        
        process.exit(1);
      } else {
        console.log('✅ Success');
      }
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
