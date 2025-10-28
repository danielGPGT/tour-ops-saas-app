# Row Level Security (RLS) Setup Guide

If you're getting permission errors when applying RLS policies, follow this step-by-step guide.

## Method 1: Use the Fixed Migration (Recommended)

Run this file in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of: 20241028_add_rls_policies_fixed.sql
```

## Method 2: Step-by-Step Application (If Method 1 Fails)

### Step 1: Enable RLS on Core Tables
Run these commands one by one in the Supabase SQL Editor:

```sql
-- Enable RLS on main tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Organization Policies
```sql
-- Organizations - users can only see their own org
CREATE POLICY "org_isolation" ON public.organizations
  FOR ALL USING (
    id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid() AND is_active = true
    )
  );

-- Super admin access to all orgs
CREATE POLICY "super_admin_all_orgs" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
        AND is_super_admin = true 
        AND is_active = true
    )
  );
```

### Step 3: Create User Policies
```sql
-- Users can see other users in their org
CREATE POLICY "users_org_isolation" ON public.users
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users AS u
      WHERE u.auth_id = auth.uid() AND u.is_active = true
    )
  );

-- Super admin can see all users
CREATE POLICY "super_admin_all_users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.auth_id = auth.uid() 
        AND u.is_super_admin = true 
        AND u.is_active = true
    )
  );
```

### Step 4: Create Supplier Policies
```sql
CREATE POLICY "suppliers_org_isolation" ON public.suppliers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid() AND is_active = true
    )
  );
```

### Step 5: Create Product Policies
```sql
CREATE POLICY "products_org_isolation" ON public.products
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid() AND is_active = true
    )
  );
```

### Step 6: Create Contract Policies
```sql
CREATE POLICY "contracts_org_isolation" ON public.contracts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid() AND is_active = true
    )
  );
```

### Step 7: Create Booking Policies
```sql
CREATE POLICY "bookings_org_isolation" ON public.bookings
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid() AND is_active = true
    )
  );
```

## Method 3: Minimal RLS (If Still Having Issues)

If you're still having permission issues, start with just the core tables:

```sql
-- Enable RLS on just the most critical tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Basic org isolation policy
CREATE POLICY "basic_org_policy" ON public.organizations FOR ALL USING (
  id = (SELECT organization_id FROM public.users WHERE auth_id = auth.uid())
);

CREATE POLICY "basic_user_policy" ON public.users FOR ALL USING (
  organization_id = (SELECT organization_id FROM public.users AS u WHERE u.auth_id = auth.uid())
);

CREATE POLICY "basic_supplier_policy" ON public.suppliers FOR ALL USING (
  organization_id = (SELECT organization_id FROM public.users WHERE auth_id = auth.uid())
);

CREATE POLICY "basic_product_policy" ON public.products FOR ALL USING (
  organization_id = (SELECT organization_id FROM public.users WHERE auth_id = auth.uid())
);
```

## Verification

After applying RLS policies, verify they're working:

```sql
-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Troubleshooting

### If you get "permission denied" errors:
1. Make sure you're running the SQL as the Supabase project owner
2. Use the Supabase Dashboard SQL Editor instead of a client
3. Try the step-by-step method instead of the full migration

### If policies aren't working:
1. Check that `auth.uid()` returns a value when authenticated
2. Verify your `users` table has the `auth_id` column populated
3. Test with a simple policy first before applying complex ones

### If users can't access data after RLS is enabled:
1. Check that `users.auth_id` matches the Supabase auth user ID
2. Verify `users.is_active = true` for the user
3. Ensure the user has a valid `organization_id`

## Need Help?

If you're still having issues, you can:
1. Run just the application-level security (which we already implemented)
2. Skip RLS for now and implement it later when you have more time
3. Contact Supabase support for assistance with RLS policies
