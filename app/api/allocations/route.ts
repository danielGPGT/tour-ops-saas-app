import { NextRequest, NextResponse } from 'next/server';
import { SupabaseAvailabilityService } from '@/lib/services/supabase-availability-service';
import { getCurrentOrgId } from '@/lib/hooks/use-current-org';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productVariantId = searchParams.get('productVariantId');
    const supplierId = searchParams.get('supplierId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Build query with filters
    let query = supabase
      .from('allocation_buckets')
      .select(`
        *,
        suppliers!inner (
          id,
          name
        ),
        product_variants!inner (
          id,
          name,
          products!inner (
            id,
            name
          )
        )
      `)
      .eq('org_id', orgId)
      .order('date', { ascending: false });

    if (productVariantId) {
      query = query.eq('product_variant_id', parseInt(productVariantId));
    }
    
    if (supplierId) {
      query = query.eq('supplier_id', parseInt(supplierId));
    }
    
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: allocations, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch allocations' },
        { status: 500 }
      );
    }

    return NextResponse.json(allocations || []);
  } catch (error) {
    console.error('Allocations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      productVariantId, 
      supplierId, 
      startDate, 
      endDate, 
      quantity, 
      unitCost, 
      allocationType = 'committed' 
    } = body;

    if (!productVariantId || !supplierId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: productVariantId, supplierId, startDate, endDate' },
        { status: 400 }
      );
    }

    const orgId = await getCurrentOrgId();

    // Create allocation using the Supabase availability service
    const success = await SupabaseAvailabilityService.createAllocation(
      orgId,
      parseInt(productVariantId),
      parseInt(supplierId),
      new Date(startDate),
      new Date(endDate),
      parseInt(quantity),
      unitCost ? parseFloat(unitCost) : undefined
    );

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to create allocation' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Create allocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to create allocation' },
      { status: 500 }
    );
  }
}