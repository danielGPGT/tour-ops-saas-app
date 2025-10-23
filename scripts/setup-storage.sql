-- Setup Supabase Storage for Product Images
-- Run this in your Supabase SQL Editor

-- Create the product-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

-- Create storage policies for the bucket

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload product images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view images
CREATE POLICY "Authenticated users can view product images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own product images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own product images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Make the bucket public for viewing (optional - you can remove this if you want private images)
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'product-images';
