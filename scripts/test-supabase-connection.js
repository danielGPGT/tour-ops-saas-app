#!/usr/bin/env node

/**
 * Test Supabase Connection
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n`);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔌 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query failed:', error.message);
      console.error('   Details:', error);
      process.exit(1);
    }

    console.log('✅ Supabase connection successful!');
    console.log(`   Found ${data.length} organization(s)`);
    
    if (data.length > 0) {
      console.log('   Sample data:', JSON.stringify(data[0], null, 2));
    }

    // Test auth
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('   Auth error (expected if not logged in):', authError.message);
    } else if (user) {
      console.log('   ✅ User authenticated:', user.email || user.id);
    } else {
      console.log('   ℹ️  No user authenticated (this is normal)');
    }

    console.log('\n🎉 Supabase connection test completed successfully!');

  } catch (error) {
    console.error('\n❌ Supabase connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('fetch')) {
      console.error('\n🔧 This suggests:');
      console.error('   1. Network connectivity issues');
      console.error('   2. Invalid Supabase URL');
      console.error('   3. Firewall blocking the connection');
    }
    
    process.exit(1);
  }
}

testSupabaseConnection().catch(console.error);
