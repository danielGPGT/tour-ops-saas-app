import { NextRequest, NextResponse } from 'next/server';
import { JsonbPricingService } from '@/lib/services/jsonb-pricing-service';
import { z } from 'zod';

const calculatePricingSchema = z.object({
  productVariantId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  occupancy: z.number().int().min(1).max(10),
  roomType: z.string().optional().default('standard'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = calculatePricingSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { productVariantId, supplierId, checkIn, checkOut, occupancy, roomType } = validatedData.data;

    const pricing = await JsonbPricingService.calculateStayCost({
      productVariantId,
      supplierId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      occupancy,
      roomType
    });

    return NextResponse.json(pricing);
  } catch (error: any) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productVariantId = parseInt(searchParams.get('productVariantId') || '');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');

    if (!productVariantId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required parameters: productVariantId, checkIn, checkOut' },
        { status: 400 }
      );
    }

    const rates = await JsonbPricingService.getAvailableRates(
      productVariantId,
      new Date(checkIn),
      new Date(checkOut)
    );

    return NextResponse.json(rates);
  } catch (error: any) {
    console.error('Error getting available rates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get available rates' },
      { status: 500 }
    );
  }
}
