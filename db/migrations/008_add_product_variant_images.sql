-- Add images column to product_variants table
-- This allows storing multiple image URLs for each product variant

ALTER TABLE public.product_variants 
ADD COLUMN images jsonb DEFAULT '[]'::jsonb;

-- Add comment to explain the images structure
COMMENT ON COLUMN public.product_variants.images IS 'Array of image objects with url, alt_text, and is_primary fields';

-- Example structure for images column:
-- [
--   {
--     "url": "https://example.com/image1.jpg",
--     "alt_text": "Hotel room view",
--     "is_primary": true,
--     "uploaded_at": "2024-01-15T10:30:00Z"
--   },
--   {
--     "url": "https://example.com/image2.jpg", 
--     "alt_text": "Hotel room bathroom",
--     "is_primary": false,
--     "uploaded_at": "2024-01-15T10:31:00Z"
--   }
-- ]
