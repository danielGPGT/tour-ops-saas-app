import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const {
    mode,
    product,
    variantName,
    supplier,
    pricing,
    availability,
    cloneFrom,
    attributes
  } = await request.json();

  const orgId = 1; // TODO: Get from session

  // Debug logging
  console.log('API received data:', {
    mode,
    product: product?.name,
    variantName,
    availability: availability ? {
      dateFrom: availability.dateFrom,
      dateTo: availability.dateTo,
      allocationModel: availability.allocationModel
    } : 'undefined',
    pricing: pricing ? {
      currency: pricing.currency,
      basePrice: pricing.basePrice,
      baseCost: pricing.baseCost
    } : 'undefined'
  });

  // Validate required data
  if (!availability) {
    return NextResponse.json({
      success: false,
      error: 'Availability data is required'
    }, { status: 400 });
  }

  if (!availability.dateFrom || !availability.dateTo) {
    return NextResponse.json({
      success: false,
      error: 'Date range is required in availability data'
    }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Step 1: Handle Product (existing or new)
    let productId: number;
    
    if (mode === 'existing') {
      productId = product.id;
    } else {
      // Create new product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          org_id: orgId,
          name: product.name,
          type: product.type,
          status: 'active'
        })
        .select('id')
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }
      
      productId = newProduct.id;
    }

    // Step 2: Handle Supplier (if new product)
    let supplierId: number;
    let contractVersionId: number;
    
    if (mode === 'existing') {
      // Try to get supplier and contract from existing variant, but don't fail if none exist
      const { data: existingVariant, error: variantError } = await supabase
        .from('product_variants')
        .select(`
          id,
          rate_plans(
            supplier_id,
            contract_version_id
          )
        `)
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();

      if (existingVariant && existingVariant.rate_plans) {
        supplierId = existingVariant.rate_plans.supplier_id;
        contractVersionId = existingVariant.rate_plans.contract_version_id;
      } else {
        // No existing variants, create default supplier and contract
        supplierId = null;
        contractVersionId = null;
      }
    }

    // Handle supplier creation if needed (for both new products and existing products without variants)
    if (!supplierId) {
      // Create new supplier if needed
      if (supplier.id === 0) {
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            org_id: orgId,
            name: supplier.name,
            status: 'active',
            terms: {}
          })
          .select('id')
          .single();

        if (supplierError) {
          throw new Error(`Failed to create supplier: ${supplierError.message}`);
        }
        
        supplierId = newSupplier.id;
      } else {
        supplierId = supplier.id;
      }
    }

    // Handle contract creation if needed
    if (!contractVersionId) {
      // Create contract and contract version
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          org_id: orgId,
          supplier_id: supplierId,
          reference: `AUTO-${Date.now()}`,
          status: 'active'
        })
        .select('id')
        .single();

      if (contractError) {
        throw new Error(`Failed to create contract: ${contractError.message}`);
      }

      // Create contract version
      const { data: newContractVersion, error: versionError } = await supabase
        .from('contract_versions')
        .insert({
          org_id: orgId,
          contract_id: newContract.id,
          valid_from: new Date().toISOString().split('T')[0],
          valid_to: '2099-12-31',
          terms: {},
          cancellation_policy: {},
          payment_policy: {}
        })
        .select('id')
        .single();

      if (versionError) {
        throw new Error(`Failed to create contract version: ${versionError.message}`);
      }

      contractVersionId = newContractVersion.id;
    }


    // Step 3: Create Product Variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        org_id: orgId,
        product_id: productId,
        name: variantName,
        subtype: 'default',
        attributes: {
          ...attributes,
          created_via: 'wizard',
          wizard_mode: mode,
          cloned_from: cloneFrom || null
        },
        status: 'active'
      })
      .select('id')
      .single();

    if (variantError) {
      throw new Error(`Failed to create variant: ${variantError.message}`);
    }

    const variantId = variant.id;

    // Step 4: Create Rate Plan
    const { data: ratePlan, error: ratePlanError } = await supabase
      .from('rate_plans')
      .insert({
        org_id: orgId,
        product_variant_id: variantId,
        supplier_id: supplierId,
        contract_version_id: contractVersionId,
        inventory_model: availability.allocationModel,
        currency: pricing.currency,
        valid_from: availability.dateFrom,
        valid_to: availability.dateTo,
        rate_doc: {
          base_cost: pricing.baseCost,
          base_price: pricing.basePrice,
          created_from_wizard: true,
          cloned_from: cloneFrom || null
        }
      })
      .select('id')
      .single();

    if (ratePlanError) {
      throw new Error(`Failed to create rate plan: ${ratePlanError.message}`);
    }

    // Step 5: Create Rate Season
    const { data: rateSeason, error: seasonError } = await supabase
      .from('rate_seasons')
      .insert({
        org_id: orgId,
        rate_plan_id: ratePlan.id,
        season_from: availability.dateFrom,
        season_to: availability.dateTo,
        dow_mask: 127, // all days
        min_pax: 1,
        max_pax: 10
      })
      .select('id')
      .single();

    if (seasonError) {
      throw new Error(`Failed to create rate season: ${seasonError.message}`);
    }

    // Step 6: Create Rate Occupancies
    const occupancies = cloneFrom && pricing.inheritOccupancy ? 
      // In a real app, fetch from cloned variant
      [
        { min_occupancy: 1, max_occupancy: 1, pricing_model: 'fixed', base_amount: pricing.basePrice },
        { min_occupancy: 2, max_occupancy: 4, pricing_model: 'base_plus_pax', base_amount: pricing.basePrice, per_person_amount: 30 }
      ] :
      [
        { min_occupancy: 1, max_occupancy: 1, pricing_model: 'fixed', base_amount: pricing.basePrice, per_person_amount: null }
      ];

    const { error: occupanciesError } = await supabase
      .from('rate_occupancies')
      .insert(occupancies.map(occ => ({
        org_id: orgId,
        rate_plan_id: ratePlan.id,
        min_occupancy: occ.min_occupancy,
        max_occupancy: occ.max_occupancy,
        pricing_model: occ.pricing_model,
        base_amount: occ.base_amount,
        per_person_amount: occ.per_person_amount
      })));

    if (occupanciesError) {
      throw new Error(`Failed to create rate occupancies: ${occupanciesError.message}`);
    }

    // Step 7: Create Allocation Buckets (if committed allocation)
    if (availability.allocationModel === 'committed') {
      const dates = generateDateRange(availability.dateFrom, availability.dateTo);
      
      let inventoryPoolId = null;
      
      // Handle shared vs separate inventory
      if (availability.mode === 'inherit' && availability.inventoryPoolId) {
        inventoryPoolId = availability.inventoryPoolId;
      } else if (availability.mode === 'separate' || mode === 'new') {
        // Create new inventory pool
        const { data: pool, error: poolError } = await supabase
          .from('inventory_pools')
          .insert({
            org_id: orgId,
            supplier_id: supplierId,
            name: `${product.name} - ${variantName} Pool`,
            pool_type: 'shared'
          })
          .select('id')
          .single();

        if (poolError) {
          throw new Error(`Failed to create inventory pool: ${poolError.message}`);
        }
        
        inventoryPoolId = pool.id;
      }

      // Create allocation buckets in batches for performance
      const BATCH_SIZE = 100;
      const batches = [];
      
      for (let i = 0; i < dates.length; i += BATCH_SIZE) {
        batches.push(dates.slice(i, i + BATCH_SIZE));
      }

      for (const batch of batches) {
        const { error: allocationError } = await supabase
          .from('allocation_buckets')
          .insert(batch.map(date => ({
            org_id: orgId,
            product_variant_id: variantId,
            supplier_id: supplierId,
            date: date.toISOString().split('T')[0],
            allocation_type: 'committed',
            quantity: availability.quantity,
            booked: 0,
            held: 0,
            inventory_pool_id: inventoryPoolId
          })));

        if (allocationError) {
          throw new Error(`Failed to create allocation buckets: ${allocationError.message}`);
        }
      }
    }

    // Calculate stats
    const dateCount = Math.ceil(
      (new Date(availability.dateTo).getTime() - 
       new Date(availability.dateFrom).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    const totalUnits = availability.allocationModel === 'committed' 
      ? dateCount * (availability.quantity || 0)
      : 0;

    const margin = pricing.price - pricing.cost;
    const marginPercent = (margin / pricing.price) * 100;

    return NextResponse.json({
      success: true,
      product: { id: productId, name: product.name },
      variant: { id: variantId, name: variantName },
      ratePlan: { id: ratePlan.id },
      message: `✅ ${variantName} created successfully!`,
      nextSteps: {
        viewVariant: `/products/${productId}/variants/${variantId}`,
        addAnother: `/products/${productId}/variants/new`,
        createBooking: `/bookings/new?variant=${variantId}`
      },
      stats: {
        allocationDays: dateCount,
        totalUnits,
        margin: Math.round(marginPercent)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('API Error creating variant:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: Generate date range
function generateDateRange(from: string, to: string): Date[] {
  const dates: Date[] = [];
  const current = new Date(from);
  const end = new Date(to);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}