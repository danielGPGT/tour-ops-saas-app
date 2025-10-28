import { NextRequest } from 'next/server';
import { createDatabaseService } from '@/lib/database';
import { withAuth, successResponse, errorResponse } from '@/lib/auth/api-middleware';

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const db = await createDatabaseService();
    
    // Use authenticated user's organization ID
    const products = await db.getProducts(context.organizationId);

    return successResponse(products, 'Products retrieved successfully');

  } catch (error) {
    console.error('Error in products API:', error);
    return errorResponse(
      'Failed to fetch products',
      'FETCH_ERROR',
      500
    );
  }
});
