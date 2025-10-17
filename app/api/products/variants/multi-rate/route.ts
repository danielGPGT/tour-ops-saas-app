import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface RateOccupancy {
  id: string;
  minOccupancy: number;
  maxOccupancy: number;
  pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
  baseAmount: number;
  perPersonAmount?: number;
}

interface RatePlan {
  id: string;
  name: string;
  type: 'main' | 'pre_night' | 'post_night';
  dates: {
    from: string;
    to: string;
  };
  pricing: {
    cost: number;
    markupPercentage: number;
    sellingPrice: number;
    currency: string;
  };
  occupancies: RateOccupancy[];
  channels: string[];
  markets: string[];
  preferred: boolean;
}

interface WizardData {
  mode: 'new' | 'existing';
  productId?: number;
  productType: string;
  variantName: string;
  variantDescription: string;
  customAttributes: Array<{ name: string; type: string; value: string }>;
  supplier: { id: string; name: string };
  contractReference: string;
  inventoryPool: {
    name: string;
    totalCapacity: number;
    capacityUnit: string;
  };
  ratePlans: RatePlan[];
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const data: WizardData = await request.json();

    console.log('Multi-rate plan wizard data:', JSON.stringify(data, null, 2));

    // For now, use a default org_id (TODO: Get from session)
    const orgId = 1;

    // 1. Create or get product
    let productId = data.productId;
    if (data.mode === 'new') {
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          org_id: orgId,
          name: `${data.variantName} Product`,
          type: data.productType,
          status: 'active'
        })
        .select()
        .single();

      if (productError) {
        console.error('Product creation error:', productError);
        return NextResponse.json({ success: false, error: 'Failed to create product' }, { status: 500 });
      }
      productId = product.id;
    }

    // 2. Create product variant
    const attributes: any = {};
    data.customAttributes.forEach(attr => {
      if (attr.name && attr.value) {
        attributes[attr.name] = attr.type === 'number' ? parseFloat(attr.value) : 
                               attr.type === 'boolean' ? attr.value === 'true' : attr.value;
      }
    });

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        org_id: orgId,
        product_id: productId,
        name: data.variantName,
        subtype: data.productType,
        attributes,
        status: 'active'
      })
      .select()
      .single();

    if (variantError) {
      console.error('Variant creation error:', variantError);
      return NextResponse.json({ success: false, error: 'Failed to create variant' }, { status: 500 });
    }

    // 3. Create supplier if new
    let supplierId = parseInt(data.supplier.id);
    if (!supplierId) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          org_id: orgId,
          name: data.supplier.name,
          status: 'active'
        })
        .select()
        .single();

      if (supplierError) {
        console.error('Supplier creation error:', supplierError);
        return NextResponse.json({ success: false, error: 'Failed to create supplier' }, { status: 500 });
      }
      supplierId = supplier.id;
    }

    // 4. Create contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        org_id: orgId,
        supplier_id: supplierId,
        reference: data.contractReference,
        status: 'active'
      })
      .select()
      .single();

    if (contractError) {
      console.error('Contract creation error:', contractError);
      return NextResponse.json({ success: false, error: 'Failed to create contract' }, { status: 500 });
    }

    // 5. Create contract version
    const { data: contractVersion, error: contractVersionError } = await supabase
      .from('contract_versions')
      .insert({
        org_id: orgId,
        contract_id: contract.id,
        valid_from: new Date().toISOString().split('T')[0],
        valid_to: '2099-12-31',
        cancellation_policy: {},
        payment_policy: {},
        terms: {}
      })
      .select()
      .single();

    if (contractVersionError) {
      console.error('Contract version creation error:', contractVersionError);
      return NextResponse.json({ success: false, error: 'Failed to create contract version' }, { status: 500 });
    }

    // 6. Create inventory pool
    const { data: inventoryPool, error: poolError } = await supabase
      .from('inventory_pools')
      .insert({
        org_id: orgId,
        supplier_id: supplierId,
        name: data.inventoryPool.name,
        pool_type: 'shared'
      })
      .select()
      .single();

    if (poolError) {
      console.error('Inventory pool creation error:', poolError);
      return NextResponse.json({ success: false, error: 'Failed to create inventory pool' }, { status: 500 });
    }

    // 7. Create rate plans
    const ratePlanIds: number[] = [];
    for (const ratePlanData of data.ratePlans) {
      const { data: ratePlan, error: ratePlanError } = await supabase
        .from('rate_plans')
        .insert({
          org_id: orgId,
          product_variant_id: variant.id,
          supplier_id: supplierId,
          contract_version_id: contractVersion.id,
          inventory_model: 'committed',
          currency: ratePlanData.pricing.currency,
          markets: data.ratePlans.length > 1 ? ratePlanData.markets : ['UK', 'US'],
          channels: data.ratePlans.length > 1 ? ratePlanData.channels : ['b2c', 'b2b'],
          preferred: ratePlanData.preferred,
          valid_from: ratePlanData.dates.from,
          valid_to: ratePlanData.dates.to,
          rate_doc: {
            name: ratePlanData.name,
            base_cost: ratePlanData.pricing.cost,
            base_price: ratePlanData.pricing.sellingPrice,
            currency: ratePlanData.pricing.currency,
            markup_percentage: ratePlanData.pricing.markupPercentage
          }
        })
        .select()
        .single();

      if (ratePlanError) {
        console.error('Rate plan creation error:', ratePlanError);
        return NextResponse.json({ success: false, error: 'Failed to create rate plan' }, { status: 500 });
      }
      ratePlanIds.push(ratePlan.id);

      // 8. Create rate seasons for each rate plan
      const { error: seasonError } = await supabase
        .from('rate_seasons')
        .insert({
          org_id: orgId,
          rate_plan_id: ratePlan.id,
          season_from: ratePlanData.dates.from,
          season_to: ratePlanData.dates.to,
          dow_mask: 127, // All days of week
          min_stay: 1,
          max_stay: 30
        });

      if (seasonError) {
        console.error('Rate season creation error:', seasonError);
        return NextResponse.json({ success: false, error: 'Failed to create rate season' }, { status: 500 });
      }

      // 9. Create rate occupancies
      for (const occupancyData of ratePlanData.occupancies || []) {
        const { error: occupancyError } = await supabase
          .from('rate_occupancies')
          .insert({
            org_id: orgId,
            rate_plan_id: ratePlan.id,
            min_occupancy: occupancyData.minOccupancy,
            max_occupancy: occupancyData.maxOccupancy,
            pricing_model: occupancyData.pricingModel,
            base_amount: occupancyData.baseAmount,
            per_person_amount: occupancyData.perPersonAmount || null
          });

        if (occupancyError) {
          console.error('Rate occupancy creation error:', occupancyError);
          return NextResponse.json({ success: false, error: 'Failed to create rate occupancy' }, { status: 500 });
        }
      }
    }

    // 10. Create allocation bucket (shared across all rate plans)
    const mainRatePlan = data.ratePlans.find(rp => rp.type === 'main');
    const startDate = mainRatePlan?.dates.from || data.ratePlans[0].dates.from;
    const endDate = mainRatePlan?.dates.to || data.ratePlans[0].dates.to;

    const { error: allocationError } = await supabase
      .from('allocation_buckets')
      .insert({
        org_id: orgId,
        product_variant_id: variant.id,
        supplier_id: supplierId,
        inventory_pool_id: inventoryPool.id,
        event_start_date: startDate,
        event_end_date: endDate,
        allocation_type: 'committed',
        quantity: data.inventoryPool.totalCapacity,
        booked: 0,
        held: 0
      });

    if (allocationError) {
      console.error('Allocation bucket creation error:', allocationError);
      return NextResponse.json({ success: false, error: 'Failed to create allocation bucket' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        variant: variant,
        ratePlans: ratePlanIds,
        inventoryPool: inventoryPool,
        supplier: { id: supplierId, name: data.supplier.name }
      }
    });

  } catch (error) {
    console.error('Multi-rate plan creation error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}