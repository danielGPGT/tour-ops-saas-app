import { NextRequest, NextResponse } from 'next/server';
import { createProduct } from '@/app/products/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await createProduct({
      name: body.name,
      type: body.type || 'accommodation',
      status: body.status || 'active',
      product_type_id: body.product_type_id || undefined
    });

    if (result.success) {
      return NextResponse.json({ success: true, product: result.product });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Duplicate product error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate product' },
      { status: 500 }
    );
  }
}
