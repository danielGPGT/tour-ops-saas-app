import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = parseInt(resolvedParams.id);
    const supabase = await createClient();
    
    const data = await request.json();
    
    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    // Update the product
    const { data: updatedProduct, error } = await supabase
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('org_id', 1) // TODO: from session
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error in product update API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update product'
    }, { status: 500 });
  }
}
