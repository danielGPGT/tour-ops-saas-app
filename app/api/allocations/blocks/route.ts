import { NextRequest, NextResponse } from 'next/server';
import { JsonbPricingService } from '@/lib/services/jsonb-pricing-service';
import { z } from 'zod';

const getBlockAllocationsSchema = z.object({
  productVariantId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productVariantId = parseInt(searchParams.get('productVariantId') || '');
    const supplierId = searchParams.get('supplierId') ? parseInt(searchParams.get('supplierId') || '') : undefined;

    const validatedData = getBlockAllocationsSchema.safeParse({
      productVariantId,
      supplierId
    });

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const allocations = await JsonbPricingService.getBlockAllocations(
      productVariantId,
      supplierId
    );

    return NextResponse.json(allocations);
  } catch (error: any) {
    console.error('Error getting block allocations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get block allocations' },
      { status: 500 }
    );
  }
}
