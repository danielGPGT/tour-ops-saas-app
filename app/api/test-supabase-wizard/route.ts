import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test 1: Check if we can connect to Supabase
    const { data: connectionTest, error: connectionError } = await supabase
      .from('suppliers')
      .select('count', { count: 'exact', head: true })
      .eq('org_id', 1);

    if (connectionError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to connect to Supabase',
        error: connectionError.message,
        details: connectionError
      }, { status: 500 });
    }

    // Test 2: Fetch actual suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('id, name, channels, status, created_at')
      .eq('org_id', 1)
      .order('name', { ascending: true });

    if (suppliersError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to fetch suppliers',
        error: suppliersError.message,
        details: suppliersError
      }, { status: 500 });
    }

    // Test 3: Check product types table
    const { data: productTypes, error: productTypesError } = await supabase
      .from('product_types')
      .select('*')
      .eq('active', true)
      .limit(5);

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data: {
        connectionTest: {
          canConnect: true,
          totalSuppliers: connectionTest?.length || 0
        },
        suppliers: {
          count: suppliers?.length || 0,
          data: suppliers || [],
          error: suppliersError?.message || null
        },
        productTypes: {
          count: productTypes?.length || 0,
          data: productTypes || [],
          error: productTypesError?.message || null
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Unexpected error testing Supabase',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
