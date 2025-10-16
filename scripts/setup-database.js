#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script helps set up the database with the enhanced schema
 * Run this after setting up your Supabase project
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up database with enhanced schema...\n');

try {
  // 1. Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // 2. Push schema to database
  console.log('\n🔄 Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // 3. Run the enhanced hotel inventory migration
  console.log('\n📋 Running enhanced hotel inventory migration...');
  execSync('npx prisma db execute --file db/migrations/003_enhanced_hotel_inventory.sql', { stdio: 'inherit' });
  
  // 4. Seed wizard data
  console.log('\n🌱 Seeding wizard data...');
  execSync('node scripts/seed-wizard-data.js', { stdio: 'inherit' });
  
  console.log('\n✅ Database setup complete!');
  console.log('\n🎯 Your enhanced schema is ready with:');
  console.log('   • Inventory pools for shared room types');
  console.log('   • Flexible occupancy pricing (base + per person)');
  console.log('   • Room assignments and occupants');
  console.log('   • Product templates and org settings');
  console.log('   • Performance indexes for availability searches');
  
  console.log('\n🚀 You can now run: npm run dev');
  console.log('   Then visit: http://localhost:3000/products/wizard');
  
} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure your DATABASE_URL is set in .env.local');
  console.log('   2. Ensure your Supabase database is accessible');
  console.log('   3. Check that you have the latest Prisma CLI');
  process.exit(1);
}
