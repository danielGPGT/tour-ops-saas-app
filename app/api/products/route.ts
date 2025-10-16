import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch products with their variants
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        type,
        status,
        created_at,
        product_variants (
          id,
          name,
          subtype,
          status
        )
      `)
      .eq('org_id', 1) // In real app, this would come from session
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      console.log('Error fetching products:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedProducts = products?.map(product => ({
      id: product.id.toString(),
      name: product.name,
      type: product.type,
      variants: product.product_variants?.map(variant => ({
        id: variant.id.toString(),
        name: variant.name
      })) || []
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedProducts
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 });
  }
}
