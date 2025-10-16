#!/usr/bin/env node

/**
 * Test Direct Database Connection (without pooler)
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function testDirectConnection() {
  console.log('🔍 Testing Direct Database Connection...\n');

  // Create a direct connection URL (without pooler)
  const originalUrl = process.env.DATABASE_URL;
  if (!originalUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  // Remove pooler parameters and try direct connection
  const directUrl = originalUrl
    .replace('?pgbouncer=true&connection_limit=1', '')
    .replace('?connection_limit=1', '')
    .replace('?pgbouncer=true', '');

  console.log('🔗 Testing Direct Connection URL:');
  console.log(`   ${directUrl.replace(/:[^:@]*@/, ':***@')}\n`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
    log: ['error'],
  });

  try {
    console.log('🔌 Connecting directly to database...');
    await prisma.$connect();
    console.log('   ✅ Connected successfully');

    console.log('   Running test query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Query executed successfully:', result);

    console.log('\n🎉 Direct connection works! The issue might be with the pooler.');
    console.log('💡 Try using the direct connection URL in your .env.local');

  } catch (error) {
    console.error('\n❌ Direct connection also failed:');
    console.error('   Error:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.error('\n🔧 This suggests:');
      console.error('   1. Your Supabase project might be paused');
      console.error('   2. Check your password in DATABASE_URL');
      console.error('   3. Verify your IP is not blocked');
      console.error('   4. Check if your Supabase project is active');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDirectConnection().catch(console.error);
