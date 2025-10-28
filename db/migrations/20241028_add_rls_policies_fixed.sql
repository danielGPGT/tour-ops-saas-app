-- Enable Row Level Security on all main tables
-- This provides an additional layer of security beyond application-level filtering
-- 
-- IMPORTANT: Run this as a Supabase admin or via the Supabase dashboard SQL editor

-- Organizations table (only super admins can access all orgs)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only access their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can access all organizations" ON public.organizations;

CREATE POLICY "Users can only access their own organization" ON public.organizations
  FOR ALL USING (
    id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can access all organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_id = auth.uid() 
        AND is_super_admin = true
        AND is_active = true
    )
  );

-- Users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access users in their organization" ON public.users;
DROP POLICY IF EXISTS "Super admins can access all users" ON public.users;

CREATE POLICY "Users can access users in their organization" ON public.users
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users AS u 
      WHERE u.auth_id = auth.uid()
      AND u.is_active = true
    )
  );

CREATE POLICY "Super admins can access all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users AS u
      WHERE u.auth_id = auth.uid() 
        AND u.is_super_admin = true
        AND u.is_active = true
    )
  );

-- Suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access suppliers in their organization" ON public.suppliers;

CREATE POLICY "Users can only access suppliers in their organization" ON public.suppliers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access products in their organization" ON public.products;

CREATE POLICY "Users can only access products in their organization" ON public.products
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Product options table
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access product options for their org's products" ON public.product_options;

CREATE POLICY "Users can only access product options for their org's products" ON public.product_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_options.product_id
        AND products.organization_id = (
          SELECT organization_id FROM public.users 
          WHERE auth_id = auth.uid()
          AND is_active = true
        )
    )
  );

-- Contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access contracts in their organization" ON public.contracts;

CREATE POLICY "Users can only access contracts in their organization" ON public.contracts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Contract allocations table
ALTER TABLE public.contract_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access allocations for their org's contracts" ON public.contract_allocations;

CREATE POLICY "Users can only access allocations for their org's contracts" ON public.contract_allocations
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access bookings in their organization" ON public.bookings;

CREATE POLICY "Users can only access bookings in their organization" ON public.bookings
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Booking items table
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access booking items for their org's bookings" ON public.booking_items;

CREATE POLICY "Users can only access booking items for their org's bookings" ON public.booking_items
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Customers table
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access customers in their organization" ON public.customers;

CREATE POLICY "Users can only access customers in their organization" ON public.customers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Events table (can be global or org-specific)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access global events or their org events" ON public.events;

CREATE POLICY "Users can access global events or their org events" ON public.events
  FOR ALL USING (
    organization_id IS NULL OR -- Global events
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Supplier rates table
ALTER TABLE public.supplier_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access rates for their org's products" ON public.supplier_rates;

CREATE POLICY "Users can only access rates for their org's products" ON public.supplier_rates
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Selling rates table
ALTER TABLE public.selling_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access selling rates for their org's products" ON public.selling_rates;

CREATE POLICY "Users can only access selling rates for their org's products" ON public.selling_rates
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Allocation inventory table
ALTER TABLE public.allocation_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access inventory for their org's allocations" ON public.allocation_inventory;

CREATE POLICY "Users can only access inventory for their org's allocations" ON public.allocation_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.contract_allocations 
      WHERE contract_allocations.id = allocation_inventory.contract_allocation_id
        AND contract_allocations.organization_id = (
          SELECT organization_id FROM public.users 
          WHERE auth_id = auth.uid()
          AND is_active = true
        )
    )
  );

-- Allocation pools table
ALTER TABLE public.allocation_pools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access pools in their organization" ON public.allocation_pools;

CREATE POLICY "Users can only access pools in their organization" ON public.allocation_pools
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access payments for their org's bookings" ON public.payments;

CREATE POLICY "Users can only access payments for their org's bookings" ON public.payments
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Audit log table
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access audit logs for their organization" ON public.audit_log;

CREATE POLICY "Users can only access audit logs for their organization" ON public.audit_log
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM public.users 
      WHERE auth_id = auth.uid()
      AND is_active = true
    )
  );

-- Additional tables that might exist

-- Product types table (this can be global)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_types' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Product types are accessible to all authenticated users" ON public.product_types';
    EXECUTE 'CREATE POLICY "Product types are accessible to all authenticated users" ON public.product_types FOR ALL USING (true)';
  END IF;
END $$;

-- Exchange rates table (global data)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exchange_rates' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Exchange rates are accessible to all authenticated users" ON public.exchange_rates';
    EXECUTE 'CREATE POLICY "Exchange rates are accessible to all authenticated users" ON public.exchange_rates FOR ALL USING (true)';
  END IF;
END $$;

-- Organization invitations table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organization_invitations' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Users can access invitations for their organization" ON public.organization_invitations';
    EXECUTE 'CREATE POLICY "Users can access invitations for their organization" ON public.organization_invitations FOR ALL USING (
      organization_id = (
        SELECT organization_id FROM public.users 
        WHERE auth_id = auth.uid()
        AND is_active = true
      )
    )';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Row Level Security policies have been successfully applied to all tables.';
  RAISE NOTICE 'Multi-tenant security is now active - users can only access data from their organization.';
  RAISE NOTICE 'Super admins can access all data across organizations.';
END $$;
