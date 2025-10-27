const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('📋 Reading migration file...')
    const migrationPath = path.join(__dirname, '../db/migrations/006_super_admin_system.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('🚀 Applying super admin migration to Supabase...')
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    })
    
    // If exec_sql doesn't exist, we need to run the migration differently
    if (error) {
      console.log('⚠️  exec_sql RPC not available, trying alternative method...')
      console.log('⚠️  You need to run the migration manually in Supabase SQL Editor')
      console.log('\n📝 To apply this migration:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of: db/migrations/006_super_admin_system.sql')
      console.log('4. Click Run')
      
      return
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('\n⚠️  IMPORTANT: Change the super admin credentials!')
    console.log('Default super admin: admin@system.com')
    console.log('Run this SQL query to update it:')
    console.log(`
UPDATE users 
SET 
  email = 'your-email@example.com',
  password_hash = '$2a$10$YOUR_HASHED_PASSWORD'
WHERE email = 'admin@system.com';
    `)
    
  } catch (error) {
    console.error('❌ Error applying migration:', error.message)
    console.error('\n⚠️  You need to apply the migration manually in Supabase SQL Editor')
    console.log('\n📝 To apply this migration:')
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Navigate to SQL Editor')
    console.log('4. Copy the contents of: db/migrations/006_super_admin_system.sql')
    console.log('5. Paste and click Run')
  }
}

applyMigration()
