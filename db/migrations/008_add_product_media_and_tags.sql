-- ============================================================================
-- Migration: Add Media, Tags, and Images to Products
-- ============================================================================
-- This migration adds media, tags, and images columns to products and 
-- product_options tables for better content management.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Add media column to products table
-- ----------------------------------------------------------------------------

-- Add media column as JSONB array
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN products.media IS 
'Array of media items (images, videos) with structure:
[
  {
    "url": "https://...",
    "alt": "Description",
    "is_primary": true,
    "type": "image"
  }
]';

-- ----------------------------------------------------------------------------
-- Step 2: Add tags column to products table
-- ----------------------------------------------------------------------------

-- Add tags column as text array
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN products.tags IS 
'Array of tags for categorization and search';

-- ----------------------------------------------------------------------------
-- Step 3: Create indexes for better performance
-- ----------------------------------------------------------------------------

-- Index for tags (array_ops for array queries)
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Index for media (jsonb_ops for JSONB queries)
CREATE INDEX IF NOT EXISTS idx_products_media ON products USING GIN(media);

-- Index for attributes (including images for product_options)
CREATE INDEX IF NOT EXISTS idx_product_options_attributes ON product_options USING GIN(attributes);

-- ----------------------------------------------------------------------------
-- Step 4: Migrate existing data from attributes (if any)
-- ----------------------------------------------------------------------------

-- Migrate media from attributes.media to the new media column for products
UPDATE products
SET media = COALESCE(attributes->'media', '[]'::jsonb)
WHERE attributes ? 'media';

-- Migrate tags from attributes.tags to the new tags column for products
UPDATE products
SET tags = (
  SELECT ARRAY_AGG(value::text)
  FROM jsonb_array_elements_text(attributes->'tags')
)
WHERE attributes ? 'tags';

-- NOTE: Product options images remain in attributes.images - no migration needed

-- ----------------------------------------------------------------------------
-- Step 5: Add constraints for data validation
-- ----------------------------------------------------------------------------

-- Add constraint to ensure media is always an array
ALTER TABLE products
  ADD CONSTRAINT products_media_is_array CHECK (jsonb_typeof(media) = 'array');

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  products_count INTEGER;
  product_options_count INTEGER;
  products_with_media INTEGER;
  products_with_tags INTEGER;
  options_with_images INTEGER;
BEGIN
  -- Count total records
  SELECT COUNT(*) INTO products_count FROM products;
  SELECT COUNT(*) INTO product_options_count FROM product_options;
  
  -- Count records with new columns populated
  SELECT COUNT(*) INTO products_with_media FROM products WHERE jsonb_array_length(media) > 0;
  SELECT COUNT(*) INTO products_with_tags FROM products WHERE array_length(tags, 1) > 0;
  SELECT COUNT(*) INTO options_with_images FROM product_options WHERE jsonb_array_length(attributes->'images') > 0;
  
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '      ✅ Migration Complete: Media and Tags Added to Products         ';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 MIGRATION SUMMARY:';
  RAISE NOTICE '   • Products table: % records', products_count;
  RAISE NOTICE '   • Product options table: % records', product_options_count;
  RAISE NOTICE '   • Products with media: %', products_with_media;
  RAISE NOTICE '   • Products with tags: %', products_with_tags;
  RAISE NOTICE '   • Options with images (in attributes): %', options_with_images;
  RAISE NOTICE '';
  RAISE NOTICE '📝 WHAT WAS ADDED:';
  RAISE NOTICE '   • products.media (JSONB) - Array of media items';
  RAISE NOTICE '   • products.tags (TEXT[]) - Array of tags';
  RAISE NOTICE '   • product_options.images - Stays in attributes.images';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 INDEXES CREATED:';
  RAISE NOTICE '   • idx_products_tags (GIN)';
  RAISE NOTICE '   • idx_products_media (GIN)';
  RAISE NOTICE '   • idx_product_options_attributes (GIN)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ CONSTRAINTS ADDED:';
  RAISE NOTICE '   • products_media_is_array';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  NOTE: Product options images remain in attributes.images';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (In case you need to rollback)
-- ============================================================================

/*
BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_products_tags;
DROP INDEX IF EXISTS idx_products_media;
DROP INDEX IF EXISTS idx_product_options_attributes;

-- Drop constraints
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_media_is_array;

-- Drop columns
ALTER TABLE products DROP COLUMN IF EXISTS media;
ALTER TABLE products DROP COLUMN IF EXISTS tags;

COMMIT;
*/
