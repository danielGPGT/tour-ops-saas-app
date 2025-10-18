const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupContractsStorage() {
  try {
    console.log('Setting up contracts storage bucket...')
    
    // Create the contracts bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('contracts', {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ],
      fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Contracts bucket already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Created contracts bucket')
    }

    // Set up RLS policies for the contracts bucket
    console.log('Setting up RLS policies...')
    
    // Policy 1: Users can upload files to their organization's folder
    const { error: uploadPolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'contracts_upload_policy',
      table_name: 'storage.objects',
      policy_definition: `
        INSERT INTO storage.objects (bucket_id, name, owner, metadata)
        SELECT 'contracts', name, auth.uid(), metadata
        WHERE bucket_id = 'contracts'
        AND (storage.foldername(name))[1] = (SELECT id::text FROM organizations WHERE id = (
          SELECT org_id FROM user_organizations 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        ))
      `,
      policy_command: 'INSERT',
      policy_roles: 'authenticated'
    })

    if (uploadPolicyError && !uploadPolicyError.message.includes('already exists')) {
      console.error('Error creating upload policy:', uploadPolicyError)
    } else {
      console.log('✅ Created upload policy')
    }

    // Policy 2: Users can view files from their organization's folder
    const { error: selectPolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'contracts_select_policy',
      table_name: 'storage.objects',
      policy_definition: `
        SELECT * FROM storage.objects
        WHERE bucket_id = 'contracts'
        AND (storage.foldername(name))[1] = (SELECT id::text FROM organizations WHERE id = (
          SELECT org_id FROM user_organizations 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'viewer')
        ))
      `,
      policy_command: 'SELECT',
      policy_roles: 'authenticated'
    })

    if (selectPolicyError && !selectPolicyError.message.includes('already exists')) {
      console.error('Error creating select policy:', selectPolicyError)
    } else {
      console.log('✅ Created select policy')
    }

    // Policy 3: Users can update files in their organization's folder
    const { error: updatePolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'contracts_update_policy',
      table_name: 'storage.objects',
      policy_definition: `
        UPDATE storage.objects
        SET metadata = new_metadata
        WHERE bucket_id = 'contracts'
        AND (storage.foldername(name))[1] = (SELECT id::text FROM organizations WHERE id = (
          SELECT org_id FROM user_organizations 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        ))
      `,
      policy_command: 'UPDATE',
      policy_roles: 'authenticated'
    })

    if (updatePolicyError && !updatePolicyError.message.includes('already exists')) {
      console.error('Error creating update policy:', updatePolicyError)
    } else {
      console.log('✅ Created update policy')
    }

    // Policy 4: Users can delete files from their organization's folder
    const { error: deletePolicyError } = await supabase.rpc('create_policy', {
      policy_name: 'contracts_delete_policy',
      table_name: 'storage.objects',
      policy_definition: `
        DELETE FROM storage.objects
        WHERE bucket_id = 'contracts'
        AND (storage.foldername(name))[1] = (SELECT id::text FROM organizations WHERE id = (
          SELECT org_id FROM user_organizations 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        ))
      `,
      policy_command: 'DELETE',
      policy_roles: 'authenticated'
    })

    if (deletePolicyError && !deletePolicyError.message.includes('already exists')) {
      console.error('Error creating delete policy:', deletePolicyError)
    } else {
      console.log('✅ Created delete policy')
    }

    console.log('🎉 Contracts storage setup complete!')
    console.log('📁 Bucket: contracts')
    console.log('📄 Allowed file types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF')
    console.log('📏 File size limit: 50MB')
    console.log('🔒 RLS policies: Organization-based access control')

  } catch (error) {
    console.error('Error setting up contracts storage:', error)
    process.exit(1)
  }
}

setupContractsStorage()
