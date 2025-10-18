const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMonacoSeed() {
  console.log('Running Monaco Grand Prix 2026 scenario seed...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('scripts/seed-monaco-scenario.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          console.log('Statement:', statement.substring(0, 100) + '...');
          return;
        }
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (err) {
        console.error(`Error executing statement ${i + 1}:`, err);
        console.log('Statement:', statement.substring(0, 100) + '...');
        return;
      }
    }
    
    console.log('\n✅ Monaco Grand Prix 2026 scenario seeded successfully!');
    console.log('You can now visit /test-monaco-scenario to see the data');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

runMonacoSeed();
