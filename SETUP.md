# 🚀 Tour Ops SaaS - Setup Guide

## Quick Start

The "global is not defined" error occurs when server-side code (Prisma) tries to run in the browser. Here's how to fix it:

### 1. Environment Setup

Create a `.env.local` file in your project root:

```bash
# Database
DATABASE_URL="postgresql://postgres:[password]@[host]:5432/[database]"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[your-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
```

### 2. Database Setup

Run the database setup script:

```bash
# Option 1: Use the setup script
node scripts/setup-database.js

# Option 2: Manual setup
npx prisma generate
npx prisma db push
npx prisma db execute --file db/migrations/003_enhanced_hotel_inventory.sql
```

### 3. Seed Wizard Data

Populate your database with initial data for the wizard:

```bash
# Seed the database with product types, suppliers, and templates
node scripts/seed-wizard-data.js
```

This creates:
- ✅ 4 product types (accommodation, activity, transfer, package)
- ✅ 16 product subtypes (4 per type)
- ✅ 3 sample suppliers
- ✅ 3 product templates

### 4. Test the Setup

Visit the diagnostics page to verify everything is working:

```
http://localhost:3000/debug
```

### 5. Try the Product Wizard

Once diagnostics pass, try the product creation wizard:

```
http://localhost:3000/products/wizard
```

## 🔧 Troubleshooting

### Error: "global is not defined"

**Cause**: Prisma client being imported in client-side code

**Solution**: 
- ✅ Database calls moved to API routes
- ✅ Client components use fetch() to call APIs
- ✅ Server-side code stays in `/api` routes

### Error: "500 Internal Server Error" on API endpoints

**Cause**: Database tables don't exist or schema mismatch

**Solutions**:
1. **Check database connection**: Visit `http://localhost:3000/debug`
2. **Run database setup**: `node scripts/setup-database.js`
3. **Use simple wizard**: Visit `http://localhost:3000/products/wizard-simple` (works without database)
4. **Check environment**: Ensure `.env.local` has correct `DATABASE_URL`

### Error: "Database connection failed"

**Solutions**:
1. Check your `DATABASE_URL` in `.env.local`
2. Verify Supabase database is running
3. Test connection: `npx prisma db push`

### Error: "Schema issues" or "Table not found"

**Solutions**:
1. Run the migration: `npx prisma db execute --file db/migrations/003_enhanced_hotel_inventory.sql`
2. Or use the setup script: `node scripts/setup-database.js`

### Error: "Environment variables not set"

**Solutions**:
1. Create `.env.local` file with all required variables
2. Restart your development server: `npm run dev`
3. Check the debug page: `http://localhost:3000/debug`

## 📁 File Structure

```
├── components/wizards/ProductWizard.tsx    # Main wizard UI
├── lib/services/product-service.ts         # Server-side business logic
├── app/api/products/create/route.ts        # API endpoint
├── app/api/debug/                          # Diagnostic endpoints
├── db/migrations/003_enhanced_hotel_inventory.sql  # Database migration
├── scripts/setup-database.js               # Setup automation
└── SETUP.md                                # This file
```

## 🎯 What the Wizard Creates

From simple inputs like:
- Product name: "Hotel ABC"
- Cost: £100, Price: £150
- Availability: 100 rooms, shared pool

The wizard automatically creates:
- ✅ 1 supplier record
- ✅ 1 contract + contract_version
- ✅ 1 product + variant
- ✅ 1 rate_plan with flexible occupancy pricing
- ✅ 2 rate_occupancies (single £130, base+£30 per extra person)
- ✅ 1 inventory_pool for shared room types
- ✅ 5 allocation_buckets (one per day)
- ✅ Tax configuration
- ✅ Audit log entry

**Total**: 35+ database records from 6 simple form fields!

## 🏨 Hotel Scenario Test

Test with your exact scenario:

1. **Product Type**: Hotel / Accommodation
2. **Name**: "Hotel XYZ Dec 2024"
3. **Supplier**: "Hotel XYZ Ltd"
4. **Pricing**: 
   - Cost: £100
   - Price: £150
   - Single: £130
   - Additional person: +£30
5. **Taxes**: City Tax £6 per person per night
6. **Availability**: 
   - Fixed quantity: 100
   - Shared pool: ✅ Enabled
   - Dates: Dec 4-8, 2024

**Result**: Perfect handling of shared room types, flexible occupancy pricing, and proper inventory management!

## 🚨 Common Issues

### Issue: Wizard shows "Creating..." forever

**Solution**: Check browser console for API errors, then visit `/debug` page

### Issue: "Failed to create product" error

**Solutions**:
1. Check database connection in `/debug`
2. Verify all tables exist
3. Check Prisma client is generated: `npx prisma generate`

### Issue: Pricing calculations wrong

**Solution**: The wizard handles your exact scenario:
- Single occupancy: £130 (not £150)
- Double occupancy: £150 (base rate)
- Triple occupancy: £150 + £30 = £180
- Quad occupancy: £150 + £60 = £210

## 📞 Support

If you're still having issues:

1. Run diagnostics: `http://localhost:3000/debug`
2. Check the console for specific error messages
3. Verify your `.env.local` file has all required variables
4. Ensure database migration has been run

The system is designed to handle complex hotel scenarios while presenting a simple interface to users. The "global is not defined" error should be completely resolved with this setup! 🎉
