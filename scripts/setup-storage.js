// Script to set up Supabase storage bucket for product images
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    console.log('Setting up storage bucket for product images...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    })
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket "product-images" already exists')
      } else {
        console.error('❌ Error creating bucket:', error)
        return
      }
    } else {
      console.log('✅ Bucket "product-images" created successfully')
    }
    
    // Set up RLS policies
    console.log('Setting up RLS policies...')
    
    // Policy to allow authenticated users to upload images
    const { error: uploadError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'product-images',
      policy_name: 'Allow authenticated users to upload',
      policy_definition: 'auth.role() = \'authenticated\''
    })
    
    if (uploadError && !uploadError.message.includes('already exists')) {
      console.error('❌ Error creating upload policy:', uploadError)
    } else {
      console.log('✅ Upload policy created')
    }
    
    // Policy to allow public read access
    const { error: readError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'product-images',
      policy_name: 'Allow public read access',
      policy_definition: 'true'
    })
    
    if (readError && !readError.message.includes('already exists')) {
      console.error('❌ Error creating read policy:', readError)
    } else {
      console.log('✅ Read policy created')
    }
    
    console.log('🎉 Storage setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupStorage()
