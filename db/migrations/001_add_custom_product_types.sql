-- Migration: Add custom product types and subtypes tables
-- This allows organizations to define their own product types and subtypes
-- instead of being limited to hardcoded CHECK constraints

-- 1. Create Product Types table
CREATE TABLE IF NOT EXISTS product_types (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  icon              TEXT, -- icon name for UI (lucide-react)
  color             TEXT, -- color theme (CSS class)
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- 2. Add new columns to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS product_type_id BIGINT REFERENCES product_types(id) ON DELETE RESTRICT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_types_org ON product_types(org_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(org_id, product_type_id);

-- 4. Seed default product types for all existing organizations
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'accommodation' as name,
  'Hotels, resorts, hostels, and other lodging options' as description,
  'Building2' as icon,
  'bg-blue-100 text-blue-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'accommodation'
);

INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'activity' as name,
  'Tours, excursions, and experiential activities' as description,
  'Activity' as icon,
  'bg-green-100 text-green-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'activity'
);

INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'event' as name,
  'Concerts, festivals, shows, and special events' as description,
  'Calendar' as icon,
  'bg-purple-100 text-purple-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'event'
);

INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'transfer' as name,
  'Transportation services between locations' as description,
  'Car' as icon,
  'bg-orange-100 text-orange-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'transfer'
);

INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'package' as name,
  'Multi-component packages combining multiple services' as description,
  'Gift' as icon,
  'bg-pink-100 text-pink-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'package'
);

-- 5. Migrate existing products to use new product types
UPDATE products 
SET product_type_id = pt.id
FROM product_types pt
WHERE products.org_id = pt.org_id 
  AND products.type = pt.name
  AND products.product_type_id IS NULL;

-- 6. Remove old CHECK constraints (commented out for safety)
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_type_check;
-- ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS product_variants_subtype_check;

-- Note: Keep the old columns for now during transition period
-- They can be removed in a future migration once all code is updated
