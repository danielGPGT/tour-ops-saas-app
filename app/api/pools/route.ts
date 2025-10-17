import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current organization (in real app, this would come from auth)
    const orgId = 1; // TODO: Get from auth context
    
    const { data: pools, error } = await supabase
      .from('inventory_pools')
      .select(`
        *,
        suppliers(
          id,
          name
        ),
        pool_variants(
          id,
          product_variant_id,
          capacity_weight,
          cost_per_unit,
          sell_price_per_unit,
          priority,
          auto_allocate,
          status,
          product_variants(
            id,
            name,
            subtype
          )
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pools:', error);
      return NextResponse.json({ error: 'Failed to fetch pools' }, { status: 500 });
    }

    return NextResponse.json(pools);
  } catch (error) {
    console.error('Error in GET /api/pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current organization (in real app, this would come from auth)
    const orgId = 1; // TODO: Get from auth context
    
    const body = await request.json();
    const {
      name,
      reference,
      pool_type,
      valid_from,
      valid_to,
      total_capacity,
      capacity_unit,
      min_commitment,
      release_date,
      cutoff_days,
      currency,
      supplier_id,
      notes,
      pool_variants
    } = body;

    // Validate required fields
    if (!name || !pool_type || !valid_from || !valid_to) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, pool_type, valid_from, valid_to' 
      }, { status: 400 });
    }

    // Create the pool
    const { data: pool, error: poolError } = await supabase
      .from('inventory_pools')
      .insert({
        org_id: orgId,
        name,
        reference: reference || null,
        pool_type,
        valid_from,
        valid_to,
        total_capacity: total_capacity || null,
        capacity_unit: capacity_unit || 'rooms',
        min_commitment: min_commitment || null,
        release_date: release_date || null,
        cutoff_days: cutoff_days || null,
        currency: currency || 'EUR',
        supplier_id: supplier_id || null,
        notes: notes || null,
        status: 'active'
      })
      .select('id')
      .single();

    if (poolError) {
      console.error('Error creating pool:', poolError);
      return NextResponse.json({ error: 'Failed to create pool' }, { status: 500 });
    }

    // Create pool variants if provided
    if (pool_variants && pool_variants.length > 0) {
      const variantInserts = pool_variants.map((variant: any) => ({
        org_id: orgId,
        inventory_pool_id: pool.id,
        product_variant_id: variant.product_variant_id,
        capacity_weight: variant.capacity_weight || 1.0,
        cost_per_unit: variant.cost_per_unit || null,
        sell_price_per_unit: variant.sell_price_per_unit || null,
        priority: variant.priority || 100,
        auto_allocate: variant.auto_allocate !== false,
        status: 'active'
      }));

      const { error: variantsError } = await supabase
        .from('pool_variants')
        .insert(variantInserts);

      if (variantsError) {
        console.error('Error creating pool variants:', variantsError);
        // Don't fail the entire request, just log the error
      }
    }

    // Fetch the created pool with all relations
    const { data: createdPool, error: fetchError } = await supabase
      .from('inventory_pools')
      .select(`
        *,
        suppliers(
          id,
          name
        ),
        pool_variants(
          id,
          product_variant_id,
          capacity_weight,
          cost_per_unit,
          sell_price_per_unit,
          priority,
          auto_allocate,
          status,
          product_variants(
            id,
            name,
            subtype
          )
        )
      `)
      .eq('id', pool.id)
      .single();

    if (fetchError) {
      console.error('Error fetching created pool:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch created pool' }, { status: 500 });
    }

    return NextResponse.json(createdPool, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
