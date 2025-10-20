#!/usr/bin/env node

/**
 * Apply Contract MVP Migration
 * 
 * This script applies the MVP contract structure enhancements to the database.
 * It adds essential fields to make contracts actually usable.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying Contract MVP Migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'contract_mvp_enhancements.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded from:', migrationPath);
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}:`);
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Check if it's a "column already exists" error (which is OK for re-runs)
          if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
            console.log(`   ⚠️  Column already exists (OK for re-runs): ${error.message}`);
          } else {
            throw error;
          }
        } else {
          console.log(`   ✅ Statement executed successfully`);
        }
      } catch (stmtError) {
        console.error(`   ❌ Error executing statement:`, stmtError.message);
        throw stmtError;
      }
    }
    
    console.log('\n🎉 Contract MVP Migration completed successfully!');
    console.log('\n📋 Summary of changes:');
    console.log('   ✅ Added contract_type, signed_date, notes to contracts table');
    console.log('   ✅ Added commission_rate, currency, booking_cutoff_days to contract_versions table');
    console.log('   ✅ Added constraints and indexes for data integrity');
    console.log('   ✅ Added helpful comments for documentation');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Test the new contract fields in the UI');
    console.log('   2. Create some sample contracts with the new fields');
    console.log('   3. Verify contract versions can be created with commission rates');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check your database connection');
    console.error('   2. Verify you have the necessary permissions');
    console.error('   3. Check if the columns already exist (migration may have run before)');
    process.exit(1);
  }
}

// Run the migration
applyMigration();
