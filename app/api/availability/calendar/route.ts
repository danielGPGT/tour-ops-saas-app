import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAvailabilityService } from '@/lib/services/supabase-availability-service';
import { getCurrentOrgId } from '@/lib/hooks/use-current-org';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productVariantId, startDate, endDate } = body;

    if (!productVariantId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: productVariantId, startDate, endDate' },
        { status: 400 }
      );
    }

    const orgId = await getCurrentOrgId();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get calendar data using the enhanced availability service
    const calendarData = await SupabaseAvailabilityService.getCalendarData(
      orgId,
      productVariantId,
      start,
      end
    );

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productVariantId = searchParams.get('productVariantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!productVariantId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required query parameters: productVariantId, startDate, endDate' },
        { status: 400 }
      );
    }

    const orgId = await getCurrentOrgId();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get calendar data using the enhanced availability service
    const calendarData = await SupabaseAvailabilityService.getCalendarData(
      orgId,
      productVariantId,
      start,
      end
    );

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    );
  }
}
