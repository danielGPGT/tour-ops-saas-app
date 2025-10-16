import { NextRequest, NextResponse } from 'next/server';
import { bulkDeleteProducts } from '@/app/products/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No product IDs provided' },
        { status: 400 }
      );
    }

    const result = await bulkDeleteProducts(ids);

    if (result.success) {
      return NextResponse.json({ success: true, deletedCount: result.deletedCount });
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Bulk delete products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete products' },
      { status: 500 }
    );
  }
}
