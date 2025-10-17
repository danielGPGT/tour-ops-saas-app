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

    // Check if a variant with this name already exists for this product
    const { data: existingVariant, error: checkError } = await supabase
      .from('product_variants')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('product_id', productId)
      .eq('name', productName)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing variant:', checkError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing variant'
      }, { status: 500 });
    }

    if (existingVariant) {
      return NextResponse.json({
        success: false,
        error: `A product variant with the name "${productName}" already exists for this collection. Please choose a different name.`
      }, { status: 409 }); // 409 Conflict
    }

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
    console.error('Error in smart create API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create product variant'
    }, { status: 500 });
  }
}