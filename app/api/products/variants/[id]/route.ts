import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
