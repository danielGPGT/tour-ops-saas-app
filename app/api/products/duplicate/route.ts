import { NextRequest, NextResponse } from 'next/server';
import { duplicateProduct } from '@/app/products/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.productId) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    const result = await duplicateProduct(body.productId, body.name);

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
