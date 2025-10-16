#!/usr/bin/env node

/**
 * Database Connection Test Script
 * 
 * This script tests the database connection and helps diagnose issues.
 * Run with: node scripts/test-db-connection.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Please check your .env.local file.');
    process.exit(1);
  }

  // Parse DATABASE_URL to check format
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('🔗 Database URL Analysis:');
    console.log(`   Protocol: ${url.protocol}`);
    console.log(`   Host: ${url.hostname}`);
    console.log(`   Port: ${url.port}`);
    console.log(`   Database: ${url.pathname.slice(1)}`);
    console.log(`   Has pgbouncer: ${url.searchParams.get('pgbouncer')}`);
    console.log(`   Connection limit: ${url.searchParams.get('connection_limit')}\n`);
  } catch (e) {
    console.error('❌ Invalid DATABASE_URL format:', e.message);
    process.exit(1);
  }

  // Test Prisma connection
  console.log('🔌 Testing Prisma Connection...');
  const prisma = new PrismaClient({
    log: ['error'],
  });

  try {
    // Test basic connection
    console.log('   Connecting to database...');
    await prisma.$connect();
    console.log('   ✅ Connected successfully');

    // Test simple query
    console.log('   Running test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query executed successfully:', result);

    // Test organizations table
    console.log('   Testing organizations table...');
    try {
      const orgCount = await prisma.organizations.count();
      console.log(`   ✅ Organizations table accessible (${orgCount} records)`);
    } catch (e) {
      console.log('   ⚠️  Organizations table not accessible:', e.message);
      console.log('   💡 Run "npx prisma db push" to create the schema');
    }

    // Test suppliers table
    console.log('   Testing suppliers table...');
    try {
      const supplierCount = await prisma.suppliers.count();
      console.log(`   ✅ Suppliers table accessible (${supplierCount} records)`);
    } catch (e) {
      console.log('   ⚠️  Suppliers table not accessible:', e.message);
      console.log('   💡 Run "npx prisma db push" to create the schema');
    }

    // Test contracts table
    console.log('   Testing contracts table...');
    try {
      const contractCount = await prisma.contracts.count();
      console.log(`   ✅ Contracts table accessible (${contractCount} records)`);
    } catch (e) {
      console.log('   ⚠️  Contracts table not accessible:', e.message);
      console.log('   💡 Run "npx prisma db push" to create the schema');
    }

    console.log('\n🎉 Database connection test completed successfully!');

  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n🔧 Troubleshooting suggestions:');
      console.error('   1. Check if your Supabase project is active');
      console.error('   2. Verify your DATABASE_URL is correct');
      console.error('   3. Ensure your IP is not blocked');
      console.error('   4. Try using the pooler connection string');
      console.error('   5. Check Supabase status at https://status.supabase.com');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('   🔌 Disconnected from database');
  }
}

// Run the test
testDatabaseConnection().catch(console.error);
