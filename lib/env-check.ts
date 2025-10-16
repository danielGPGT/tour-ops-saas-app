/**
 * Environment Check Utility
 * Helps debug common setup issues
 */

export function checkEnvironment() {
  const issues: string[] = [];
  
  // Check for required environment variables
  if (!process.env.DATABASE_URL) {
    issues.push('DATABASE_URL is not set in environment variables');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  }
  
  // Check if we're in the right environment
  if (typeof window !== 'undefined') {
    // We're in a browser environment
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      issues.push('Supabase environment variables not available in browser');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

export function logEnvironmentCheck() {
  const check = checkEnvironment();
  
  if (!check.isValid) {
    console.error('🚨 Environment Issues Found:');
    check.issues.forEach(issue => {
      console.error(`   • ${issue}`);
    });
    console.error('\n💡 Make sure you have a .env.local file with all required variables');
  } else {
    console.log('✅ Environment variables are properly configured');
  }
  
  return check;
}
