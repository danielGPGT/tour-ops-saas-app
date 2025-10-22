import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';

export async function GET() {
  try {
    // Test basic database connection
    const db = await createDatabaseService();
    const supabase = db.getServerDatabase();
    
    // Test querying organizations
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    // Test if new tables exist by querying them
    const { data: products } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1);

    return NextResponse.json({
      status: 'ok',
      connection: 'successful',
      organizations_count: orgCount || 0,
      new_tables: {
        products: products !== null,
        suppliers: suppliers !== null,
      },
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        connection: 'failed',
        error: error instanceof Error ? error.message : 'Unknown database error',
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}
