import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const variantId = parseInt(resolvedParams.id);
    const supabase = await createClient();
    
    if (isNaN(variantId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid variant ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const {
      productId,
      productName,
      productDescription,
      productStatus,
      productAttributes,
      productImages
    } = body;

    if (!productName) {
      return NextResponse.json({
        success: false,
        error: 'Product name is required'
      }, { status: 400 });
    }

    const orgId = 1; // In real app, this would come from session

    // Check if a variant with this name already exists for this product (excluding current variant)
    const { data: existingVariant, error: checkError } = await supabase
      .from('product_variants')
      .select('id, name')
      .eq('org_id', orgId)
      .eq('product_id', productId)
      .eq('name', productName)
      .neq('id', variantId)
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

    // Update the product variant
    const { data: variant, error } = await supabase
      .from('product_variants')
      .update({
        product_id: productId,
        name: productName,
        attributes: {
          ...productAttributes,
          description: productDescription,
          updated_via: 'smart_wizard'
        },
        status: productStatus || 'active',
        images: productImages || []
      })
      .eq('id', variantId)
      .eq('org_id', orgId)
      .select('id, name')
      .single();

    if (error) {
      console.error('Error updating product variant:', error);
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
    console.error('Error in variant update API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update product variant'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const variantId = parseInt(resolvedParams.id);
    const supabase = await createClient();
    
    if (isNaN(variantId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid variant ID'
      }, { status: 400 });
    }

    // Delete the variant (this will cascade delete related records)
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', variantId)
      .eq('org_id', 1); // TODO: from session

    if (error) {
      console.error('Error deleting variant:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Variant deleted successfully'
    });

  } catch (error) {
    console.error('Error in variant delete API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete variant'
    }, { status: 500 });
  }
}
