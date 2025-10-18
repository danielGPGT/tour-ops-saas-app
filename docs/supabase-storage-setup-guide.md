# Supabase Storage Setup Guide

## 🚫 Issue with Direct SQL
The `storage.objects` table is a system table in Supabase that requires special permissions. You cannot create RLS policies on it directly via SQL.

## ✅ Correct Setup Method

### Option 1: Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Storage** in the left sidebar

2. **Create Storage Bucket**
   - Click **"New bucket"**
   - Name: `contracts`
   - Public: **No** (uncheck this)
   - File size limit: `50 MB`
   - Allowed MIME types: 
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     text/plain
     image/jpeg
     image/png
     image/gif
     ```

3. **Set Up RLS Policies**
   - Go to **Authentication** → **Policies**
   - Find the `storage.objects` table
   - Create these policies:

   **Policy 1: Upload Policy**
   - Name: `contracts_upload_policy`
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'contracts'
     ```

   **Policy 2: View Policy**
   - Name: `contracts_select_policy`
   - Operation: `SELECT`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'contracts'
     ```

   **Policy 3: Update Policy**
   - Name: `contracts_update_policy`
   - Operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'contracts'
     ```

   **Policy 4: Delete Policy**
   - Name: `contracts_delete_policy`
   - Operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition:
     ```sql
     bucket_id = 'contracts'
     ```

### Option 2: Supabase CLI (Alternative)

If you have Supabase CLI installed:

```bash
# Initialize Supabase in your project
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Create the bucket via CLI
supabase storage create contracts --public=false --file-size-limit=52428800
```

## 🔧 Manual SQL (Simplified)

If you must use SQL, try this minimal approach:

```sql
-- Only create the bucket (this should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  52428800,
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
```

Then set up the RLS policies through the Supabase Dashboard as described above.

## ✅ Verification

After setup, verify it works:

1. **Check bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'contracts';
   ```

2. **Test upload (in your app):**
   ```typescript
   const { data, error } = await supabase.storage
     .from('contracts')
     .upload('test/test.txt', 'Hello World');
   ```

## 🎯 Next Steps

Once the storage bucket is set up:

1. The contract document upload feature will work
2. Files will be stored in: `contracts/{org_id}/{contract_id}/{filename}`
3. You can test the upload functionality in the contracts page

## 🔒 Security Note

The current setup allows all authenticated users to access the contracts bucket. For production, you'll want to implement more specific access control based on your authentication system and organization membership.
