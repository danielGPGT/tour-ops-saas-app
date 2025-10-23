// Test database connection and create missing organization
const { createClient } = require('@supabase/supabase-js');

// You'll need to replace these with your actual values
const supabaseUrl = 'https://xvltzkjylpinswdhfsaa.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('organizations').select('count').limit(1);
    if (error) {
      console.error('Database connection error:', error);
      return;
    }
    console.log('Database connection successful');
    
    // Check if organization exists
    const orgId = '11111111-1111-1111-1111-111111111111';
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    
    if (orgError && orgError.code === 'PGRST116') {
      console.log('Organization not found, creating it...');
      
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: 'Grand Prix Grand Tours',
          slug: 'grandprix-grandtours',
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating organization:', createError);
      } else {
        console.log('Organization created:', newOrg);
      }
    } else if (orgError) {
      console.error('Error checking organization:', orgError);
    } else {
      console.log('Organization exists:', org);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection();