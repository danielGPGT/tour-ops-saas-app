# 🚀 Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `tour-ops-saas`
   - **Database Password**: Choose a strong password
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Create .env.local File

Create a file called `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 4: Run Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `db/initial_schema.sql`
3. Paste and run the SQL
4. This will create all the necessary tables

## Step 5: Set Up Row Level Security (RLS)

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id = (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

-- Create policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth_id = auth.uid());

-- Create policies for suppliers
CREATE POLICY "Users can view suppliers in their organization" ON suppliers
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create suppliers in their organization" ON suppliers
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update suppliers in their organization" ON suppliers
  FOR UPDATE USING (organization_id = (SELECT organization_id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete suppliers in their organization" ON suppliers
  FOR DELETE USING (organization_id = (SELECT organization_id FROM users WHERE auth_id = auth.uid()));
```

## Step 6: Test Your Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/debug` to test the connection

3. You should see:
   - ✅ Supabase connection: Connected
   - ✅ Database tables: Found
   - ✅ Authentication: Working

## Step 7: Create Your First Organization

Run this SQL in your Supabase SQL Editor to create a test organization:

```sql
-- Insert a test organization
INSERT INTO organizations (id, name, slug, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Test Organization',
  'test-org',
  true,
  NOW(),
  NOW()
);

-- Get the organization ID
SELECT id FROM organizations WHERE slug = 'test-org';
```

## Step 8: Test the Suppliers System

1. Go to `http://localhost:3000/suppliers`
2. You should see the suppliers page (it will be empty initially)
3. Click "Add Supplier" to create your first supplier
4. Fill out the form and submit

## 🎉 You're Ready!

Your Supabase connection is now set up and ready to use real data instead of mock data. The suppliers system will now:

- ✅ Connect to your actual Supabase database
- ✅ Use real authentication
- ✅ Store data in your database
- ✅ Enforce row-level security
- ✅ Work with your organization's data

## 🔧 Troubleshooting

### Error: "Invalid API key"
- Check your `.env.local` file has the correct Supabase URL and key
- Make sure you copied the **anon public key**, not the service role key

### Error: "Table doesn't exist"
- Run the database schema from `db/initial_schema.sql`
- Check the SQL Editor for any errors

### Error: "Permission denied"
- Make sure you've set up the RLS policies
- Check that your user is properly linked to an organization

### Error: "Connection failed"
- Verify your Supabase project is running
- Check your internet connection
- Try refreshing the page

## 📞 Need Help?

If you're still having issues:
1. Check the debug page: `http://localhost:3000/debug`
2. Look at the browser console for specific errors
3. Verify your `.env.local` file is correct
4. Make sure you've run the database schema
