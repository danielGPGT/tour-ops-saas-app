# Supabase Storage Setup for Product Images

## Manual Setup (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Go to Storage in the left sidebar

2. **Create a new bucket**
   - Click "Create a new bucket"
   - Name: `product-images`
   - Make it **Public** (so images can be accessed via URL)
   - Click "Create bucket"

3. **Set up RLS Policies**
   - Go to Authentication > Policies
   - Create a new policy for the `product-images` bucket:
   
   **Policy Name**: `Allow authenticated users to upload`
   **Policy Definition**: 
   ```sql
   auth.role() = 'authenticated'
   ```
   
   **Policy Name**: `Allow public read access`
   **Policy Definition**:
   ```sql
   true
   ```

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Create the bucket
supabase storage create product-images --public

# Set up policies (you may need to do this manually in the dashboard)
```

## Environment Variables

Make sure you have these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

Once set up, you can test the image upload functionality in the Smart Product Wizard. Images should be uploaded to the `product-images` bucket and URLs should be stored in the `images` field of the `product_variants` table.
