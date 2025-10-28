-- Enable Row Level Security on all main tables
-- This provides an additional layer of security beyond application-level filtering

-- Organizations table (only super admins can access all orgs)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own organization" ON organizations
  FOR ALL USING (
    id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can access all organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
        AND is_super_admin = true
    )
  );

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access users in their organization" ON users
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can access all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() 
        AND is_super_admin = true
    )
  );

-- Suppliers table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access suppliers in their organization" ON suppliers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access products in their organization" ON products
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Product options table
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access product options for their org's products" ON product_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_options.product_id
        AND products.organization_id = (
          SELECT organization_id FROM users 
          WHERE auth_id = auth.uid()
        )
    )
  );

-- Contracts table
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access contracts in their organization" ON contracts
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Contract allocations table
ALTER TABLE contract_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access allocations for their org's contracts" ON contract_allocations
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access bookings in their organization" ON bookings
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Booking items table
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access booking items for their org's bookings" ON booking_items
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access customers in their organization" ON customers
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Events table (can be global or org-specific)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access global events or their org events" ON events
  FOR ALL USING (
    organization_id IS NULL OR -- Global events
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Supplier rates table
ALTER TABLE supplier_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access rates for their org's products" ON supplier_rates
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Selling rates table
ALTER TABLE selling_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access selling rates for their org's products" ON selling_rates
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Allocation inventory table
ALTER TABLE allocation_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access inventory for their org's allocations" ON allocation_inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM contract_allocations 
      WHERE contract_allocations.id = allocation_inventory.contract_allocation_id
        AND contract_allocations.organization_id = (
          SELECT organization_id FROM users 
          WHERE auth_id = auth.uid()
        )
    )
  );

-- Allocation pools table
ALTER TABLE allocation_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access pools in their organization" ON allocation_pools
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access payments for their org's bookings" ON payments
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Audit log table
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access audit logs for their organization" ON audit_log
  FOR ALL USING (
    organization_id = (
      SELECT organization_id FROM users 
      WHERE auth_id = auth.uid()
    )
  );

-- Create a helper function to get current user's organization in public schema
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY definer
STABLE
AS $$
  SELECT organization_id 
  FROM public.users 
  WHERE auth_id = auth.uid()
  LIMIT 1
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO authenticated;

-- Comment explaining the security model
COMMENT ON SCHEMA public IS 'Multi-tenant schema with Row Level Security. Each organization''s data is isolated using RLS policies that filter by organization_id based on the authenticated user''s organization membership.';
