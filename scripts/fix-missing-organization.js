// Quick script to create the missing organization
const { createClient } = require('@supabase/supabase-js');

// You'll need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xvltzkjylpinswdhfsaa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMissingOrganization() {
  console.log('Creating missing organization...');
  
  const organizationId = '11111111-1111-1111-1111-111111111111';
  
  // First check if it exists
  const { data: existing, error: checkError } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .single();
  
  if (existing) {
    console.log('Organization already exists:', existing);
    return;
  }
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking organization:', checkError);
    return;
  }
  
  // Create the organization
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      id: organizationId,
      name: 'Grand Prix Grand Tours',
      slug: 'grandprix-grandtours',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating organization:', error);
  } else {
    console.log('Organization created successfully:', data);
  }
}

createMissingOrganization().catch(console.error);
