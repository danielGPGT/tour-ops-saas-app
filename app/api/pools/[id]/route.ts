import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current organization (in real app, this would come from auth)
    const orgId = 1; // TODO: Get from auth context
    
    const poolId = parseInt(params.id);
    if (isNaN(poolId)) {
      return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
    }

    const { data: pool, error } = await supabase
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
      .eq('id', poolId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      console.error('Error fetching pool:', error);
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    return NextResponse.json(pool);
  } catch (error) {
    console.error('Error in GET /api/pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current organization (in real app, this would come from auth)
    const orgId = 1; // TODO: Get from auth context
    
    const poolId = parseInt(params.id);
    if (isNaN(poolId)) {
      return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
    }

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
      pool_variants,
      status
    } = body;

    // Validate required fields
    if (!name || !pool_type || !valid_from || !valid_to) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, pool_type, valid_from, valid_to' 
      }, { status: 400 });
    }

    // Update the pool
    const { data: pool, error: poolError } = await supabase
      .from('inventory_pools')
      .update({
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
        status: status || 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', poolId)
      .eq('org_id', orgId)
      .select('id')
      .single();

    if (poolError) {
      console.error('Error updating pool:', poolError);
      return NextResponse.json({ error: 'Failed to update pool' }, { status: 500 });
    }

    // Update pool variants if provided
    if (pool_variants !== undefined) {
      // First, delete existing variants
      const { error: deleteError } = await supabase
        .from('pool_variants')
        .delete()
        .eq('inventory_pool_id', poolId)
        .eq('org_id', orgId);

      if (deleteError) {
        console.error('Error deleting existing pool variants:', deleteError);
      }

      // Then, insert new variants
      if (pool_variants.length > 0) {
        const variantInserts = pool_variants.map((variant: any) => ({
          org_id: orgId,
          inventory_pool_id: poolId,
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
    }

    // Fetch the updated pool with all relations
    const { data: updatedPool, error: fetchError } = await supabase
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
      .eq('id', poolId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated pool:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch updated pool' }, { status: 500 });
    }

    return NextResponse.json(updatedPool);
  } catch (error) {
    console.error('Error in PUT /api/pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current organization (in real app, this would come from auth)
    const orgId = 1; // TODO: Get from auth context
    
    const poolId = parseInt(params.id);
    if (isNaN(poolId)) {
      return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
    }

    // Check if pool exists and belongs to organization
    const { data: existingPool, error: checkError } = await supabase
      .from('inventory_pools')
      .select('id')
      .eq('id', poolId)
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingPool) {
      return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Delete the pool (cascade will handle pool_variants and pool_utilization)
    const { error: deleteError } = await supabase
      .from('inventory_pools')
      .delete()
      .eq('id', poolId)
      .eq('org_id', orgId);

    if (deleteError) {
      console.error('Error deleting pool:', deleteError);
      return NextResponse.json({ error: 'Failed to delete pool' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/pools/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
