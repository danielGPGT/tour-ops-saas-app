import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { 
      productId, 
      productName, 
      productDescription, 
      productStatus,
      productAttributes,
      productImages 
    } = body;

    if (!productId || !productName) {
      return NextResponse.json({
        success: false,
        error: 'Product ID and product name are required'
      }, { status: 400 });
    }

    const orgId = 1; // In real app, this would come from session

    // Create new product variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .insert({
        org_id: orgId,
        product_id: productId,
        name: productName,
        subtype: 'default',
        attributes: {
          ...productAttributes,
          description: productDescription,
          created_via: 'smart_wizard'
        },
        status: productStatus || 'active',
        images: productImages || [] // Store uploaded images
      })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error creating product variant:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: variant.id,
        name: variant.name
      }
    });

  } catch (error) {
    console.error('Error in simple variant creation API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create product variant'
    }, { status: 500 });
  }
}
