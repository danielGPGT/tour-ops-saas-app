-- Simple Supabase Storage RLS Policies
-- Run this in your Supabase SQL Editor

-- First, let's check if RLS is already enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Enable RLS if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete from product-images" ON storage.objects;

-- Create a simple, permissive policy for the product-images bucket
CREATE POLICY "product-images-policy"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');
