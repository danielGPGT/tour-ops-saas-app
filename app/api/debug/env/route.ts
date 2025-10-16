import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    const allSet = Object.values(envCheck).every(value => value === 'Set' || value === 'development' || value === 'production');
    
    return NextResponse.json({
      status: allSet ? 'ok' : 'issues',
      environment: envCheck,
      message: allSet ? 'All required environment variables are set' : 'Some environment variables are missing'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
