-- Manual Supabase Storage Setup for Contract Documents
-- Paste these commands into the Supabase SQL Editor

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

-- 2. Create RLS policy for uploading documents
-- Users can upload files to their organization's folder
CREATE POLICY "contracts_upload_policy" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM organizations 
    WHERE id = (
      SELECT org_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
);

-- 3. Create RLS policy for viewing documents
-- Users can view files from their organization's folder
CREATE POLICY "contracts_select_policy" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM organizations 
    WHERE id = (
      SELECT org_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager', 'viewer')
    )
  )
);

-- 4. Create RLS policy for updating documents
-- Users can update files in their organization's folder
CREATE POLICY "contracts_update_policy" ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM organizations 
    WHERE id = (
      SELECT org_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
)
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM organizations 
    WHERE id = (
      SELECT org_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
);

-- 5. Create RLS policy for deleting documents
-- Users can delete files from their organization's folder
CREATE POLICY "contracts_delete_policy" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1] = (
    SELECT id::text 
    FROM organizations 
    WHERE id = (
      SELECT org_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  )
);

-- 6. Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 7. Verify the setup
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'contracts';

-- 8. Check RLS policies
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
