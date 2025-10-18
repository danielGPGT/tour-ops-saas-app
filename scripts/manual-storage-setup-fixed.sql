-- Manual Supabase Storage Setup for Contract Documents (Fixed Version)
-- This version works with your current schema structure

-- 1. Create the contracts storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  52428800, -- 50MB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "contracts_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "contracts_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "contracts_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "contracts_delete_policy" ON storage.objects;

-- 3. Create simplified RLS policies
-- For now, we'll allow all authenticated users to access contracts
-- You can tighten this later based on your authentication setup

-- Upload Policy - Allow authenticated users to upload
CREATE POLICY "contracts_upload_policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contracts');

-- View Policy - Allow authenticated users to view
CREATE POLICY "contracts_select_policy" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'contracts');

-- Update Policy - Allow authenticated users to update
CREATE POLICY "contracts_update_policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts')
WITH CHECK (bucket_id = 'contracts');

-- Delete Policy - Allow authenticated users to delete
CREATE POLICY "contracts_delete_policy" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');

-- 4. Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Verify the setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'contracts';

-- 6. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE 'contracts_%';

-- Setup complete! 
-- The contracts bucket is now ready for document uploads.
-- File structure will be: contracts/{org_id}/{contract_id}/{filename}
