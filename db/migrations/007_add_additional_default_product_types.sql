-- Migration: Add additional default product types
-- This adds the missing product types: meal, equipment, pass, ancillary, other

-- Add meal product type
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'meal' as name,
  'Restaurants, dining experiences, and food services' as description,
  'Utensils' as icon,
  'bg-yellow-100 text-yellow-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'meal'
);

-- Add equipment product type
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'equipment' as name,
  'Rental equipment, gear, and tools' as description,
  'Wrench' as icon,
  'bg-gray-100 text-gray-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'equipment'
);

-- Add pass product type
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'pass' as name,
  'Access passes, memberships, and entry tickets' as description,
  'Ticket' as icon,
  'bg-indigo-100 text-indigo-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'pass'
);

-- Add ancillary product type
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'ancillary' as name,
  'Additional services, add-ons, and supplementary products' as description,
  'Plus' as icon,
  'bg-teal-100 text-teal-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'ancillary'
);

-- Add other product type (for flexibility)
INSERT INTO product_types (org_id, name, description, icon, color, is_default)
SELECT DISTINCT 
  o.id as org_id,
  'other' as name,
  'Other products and services not covered by standard categories' as description,
  'MoreHorizontal' as icon,
  'bg-slate-100 text-slate-800' as color,
  true as is_default
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM product_types pt 
  WHERE pt.org_id = o.id AND pt.name = 'other'
);
