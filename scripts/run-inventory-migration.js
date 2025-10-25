const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🔄 Running allocation_inventory migration...')
  
  try {
    // Add missing columns to allocation_inventory table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.allocation_inventory 
        ADD COLUMN IF NOT EXISTS min_quantity_per_booking integer DEFAULT 1,
        ADD COLUMN IF NOT EXISTS max_quantity_per_booking integer,
        ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
        ADD COLUMN IF NOT EXISTS availability_generated boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;
      `
    })

    if (alterError) {
      console.error('❌ Error adding columns:', alterError)
      return
    }

    // Fix the alternate_option_ids column type
    const { error: typeError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.allocation_inventory 
        ALTER COLUMN alternate_option_ids TYPE uuid[] USING COALESCE(alternate_option_ids, '{}'::uuid[]);
      `
    })

    if (typeError) {
      console.error('❌ Error fixing column type:', typeError)
      return
    }

    // Add unique constraint to availability table
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.availability 
        ADD CONSTRAINT IF NOT EXISTS availability_unique_date UNIQUE (allocation_inventory_id, date);
      `
    })

    if (constraintError) {
      console.error('❌ Error adding constraint:', constraintError)
      return
    }

    // Rename availability_date to date in availability table if needed
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'availability' AND column_name = 'availability_date') THEN
                ALTER TABLE public.availability RENAME COLUMN availability_date TO date;
            END IF;
        END $$;
      `
    })

    if (renameError) {
      console.error('❌ Error renaming column:', renameError)
      return
    }

    console.log('✅ Migration completed successfully!')
    console.log('📋 Added columns: min_quantity_per_booking, max_quantity_per_booking, is_active, availability_generated, created_at, updated_at')
    console.log('🔧 Fixed alternate_option_ids column type')
    console.log('🔗 Added unique constraint to availability table')
    console.log('📅 Renamed availability_date to date in availability table')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

runMigration()
