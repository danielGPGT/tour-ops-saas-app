const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyMigration() {
  try {
    console.log('🚀 Applying Master Rate Support Migration...\n');

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is not set');
      console.log('💡 Make sure your .env.local file contains DATABASE_URL');
      process.exit(1);
    }

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'db', 'migrations', 'add_master_rate_support.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    console.log('📄 Found migration file:', migrationPath);
    console.log('🔗 Database URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

    // Apply the migration
    console.log('\n⏳ Applying migration...');
    execSync(`psql "${process.env.DATABASE_URL}" -f "${migrationPath}"`, { 
      stdio: 'inherit',
      encoding: 'utf8'
    });

    console.log('\n✅ Master Rate Support Migration Applied Successfully!');
    console.log('\n🎯 What was added:');
    console.log('  • Made supplier_id nullable in rate_plans table');
    console.log('  • Added constraint to ensure data integrity');
    console.log('  • Created helper functions for master/supplier rates');
    console.log('  • Added indexes for performance');
    
    console.log('\n🚀 Next steps:');
    console.log('  1. Test the enhanced availability service');
    console.log('  2. Create master rates for your F1 products');
    console.log('  3. Test the booking flow with auto-selection');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    
    if (error.message.includes('psql')) {
      console.log('\n💡 Troubleshooting:');
      console.log('  • Make sure PostgreSQL is installed and psql is in PATH');
      console.log('  • Verify your DATABASE_URL is correct');
      console.log('  • Check that the database is accessible');
    }
    
    console.log('\n🛠️ Manual alternative:');
    console.log('  Run this command manually:');
    console.log(`  psql "${process.env.DATABASE_URL}" -f "${path.join(__dirname, '..', 'db', 'migrations', 'add_master_rate_support.sql')}"`);
    
    process.exit(1);
  }
}

applyMigration();
