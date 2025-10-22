import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const db = await createDatabaseService();
    
    // For now, using a hardcoded organization ID
    // In production, this would come from the authenticated user's session
    const organizationId = '11111111-1111-1111-1111-111111111111';
    
    const products = await db.getProducts(organizationId);

    return NextResponse.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 });
  }
}
