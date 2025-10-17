-- Supabase Storage RLS Policies Setup
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for authenticated users to upload to product-images bucket
CREATE POLICY "Allow authenticated users to upload to product-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Create policy for public read access to product-images bucket
CREATE POLICY "Allow public read access to product-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- 4. Create policy for authenticated users to delete from product-images bucket
CREATE POLICY "Allow authenticated users to delete from product-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- 5. Create policy for authenticated users to update in product-images bucket
CREATE POLICY "Allow authenticated users to update in product-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- 6. Alternative: More permissive policy for all operations
-- Uncomment this if the above policies don't work:
-- CREATE POLICY "Allow all operations on product-images"
-- ON storage.objects
-- FOR ALL
-- TO public
-- USING (bucket_id = 'product-images')
-- WITH CHECK (bucket_id = 'product-images');
