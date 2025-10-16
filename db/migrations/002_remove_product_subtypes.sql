-- Migration to recreate product subtypes with proper structure
-- This creates a normalized subtypes system for better data organization

-- 1. Recreate the product_subtypes table with proper structure
CREATE TABLE IF NOT EXISTS product_subtypes (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  org_id            BIGINT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_type_id   BIGINT REFERENCES product_types(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  icon              TEXT, -- icon name for UI (lucide-react)
  is_default        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, product_type_id, name)
);

-- 2. Add product_subtype_id column back to product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS product_subtype_id BIGINT REFERENCES product_subtypes(id) ON DELETE RESTRICT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_subtypes_org_type ON product_subtypes(org_id, product_type_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_subtype ON product_variants(org_id, product_subtype_id);

-- 4. Keep the subtype column but make it nullable with sensible defaults
ALTER TABLE product_variants ALTER COLUMN subtype DROP NOT NULL;

-- 5. Update existing variants to have appropriate subtype values based on their product type
UPDATE product_variants 
SET subtype = 'room_category'
FROM products 
WHERE product_variants.product_id = products.id 
  AND products.type = 'accommodation'
  AND product_variants.subtype IS NULL;

UPDATE product_variants 
SET subtype = 'seat_tier'
FROM products 
WHERE product_variants.product_id = products.id 
  AND products.type = 'transfer'
  AND product_variants.subtype IS NULL;

UPDATE product_variants 
SET subtype = 'time_slot'
FROM products 
WHERE product_variants.product_id = products.id 
  AND products.type IN ('activity', 'event')
  AND product_variants.subtype IS NULL;

UPDATE product_variants 
SET subtype = 'none'
WHERE subtype IS NULL;

-- 6. Seed default product subtypes for all existing organizations
INSERT INTO product_subtypes (org_id, product_type_id, name, description, icon, is_default)
SELECT DISTINCT 
  pt.org_id,
  pt.id as product_type_id,
  'room_category' as name,
  'Different room types and categories' as description,
  'Bed' as icon,
  true as is_default
FROM product_types pt
WHERE pt.name = 'accommodation'
AND NOT EXISTS (
  SELECT 1 FROM product_subtypes ps 
  WHERE ps.org_id = pt.org_id AND ps.product_type_id = pt.id AND ps.name = 'room_category'
);

INSERT INTO product_subtypes (org_id, product_type_id, name, description, icon, is_default)
SELECT DISTINCT 
  pt.org_id,
  pt.id as product_type_id,
  'seat_tier' as name,
  'Different seat classes and tiers' as description,
  'Users' as icon,
  true as is_default
FROM product_types pt
WHERE pt.name = 'transfer'
AND NOT EXISTS (
  SELECT 1 FROM product_subtypes ps 
  WHERE ps.org_id = pt.org_id AND ps.product_type_id = pt.id AND ps.name = 'seat_tier'
);

INSERT INTO product_subtypes (org_id, product_type_id, name, description, icon, is_default)
SELECT DISTINCT 
  pt.org_id,
  pt.id as product_type_id,
  'time_slot' as name,
  'Different time periods or sessions' as description,
  'Clock' as icon,
  true as is_default
FROM product_types pt
WHERE pt.name IN ('activity', 'event')
AND NOT EXISTS (
  SELECT 1 FROM product_subtypes ps 
  WHERE ps.org_id = pt.org_id AND ps.product_type_id = pt.id AND ps.name = 'time_slot'
);

INSERT INTO product_subtypes (org_id, product_type_id, name, description, icon, is_default)
SELECT DISTINCT 
  pt.org_id,
  pt.id as product_type_id,
  'none' as name,
  'Single variant product without variations' as description,
  'Package' as icon,
  true as is_default
FROM product_types pt
WHERE NOT EXISTS (
  SELECT 1 FROM product_subtypes ps 
  WHERE ps.org_id = pt.org_id AND ps.product_type_id = pt.id AND ps.name = 'none'
);

-- Note: Subtypes provide structured categorization for better data organization
-- Variants now have: name, subtype (text), product_subtype_id (FK), status, and attributes (JSON)

-- The migration is complete - the system now only uses product types without subtypes
