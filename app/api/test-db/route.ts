import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';

export async function GET() {
  try {
    // Test basic database connection
    const db = await createDatabaseService();
    const supabase = db.getServerDatabase();
    
    // Test a simple query
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      result: data
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
