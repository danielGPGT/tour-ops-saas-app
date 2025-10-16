import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface RatePlanData {
  id: string;
  name: string;
  supplier: {
    id: string;
    name: string;
  };
  contract: {
    id?: string;
    reference: string;
  };
  pricing: {
    currency: string;
    baseCost: number;
    basePrice: number;
    markupPercentage?: number;
    useMarkup: boolean;
  };
  channels: string[];
  markets: string[];
  seasons: {
    seasonFrom: string;
    seasonTo: string;
    dowMask?: number;
    minStay?: number;
    maxStay?: number;
    minPax?: number;
    maxPax?: number;
  }[];
  occupancies: {
    minOccupancy: number;
    maxOccupancy: number;
    pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
    baseAmount: number;
    perPersonAmount?: number;
  }[];
  ageBands?: {
    label: string;
    minAge: number;
    maxAge: number;
    priceType: string;
    value: number;
  }[];
  preferred: boolean;
  notes?: string;
}

interface VariantData {
  mode: 'new' | 'existing';
  productType: string;
  product?: {
    id: number;
    name: string;
  };
  variant: {
    name: string;
    description?: string;
    attributes?: Record<string, any>;
  };
  ratePlans: RatePlanData[];
  availability: {
    allocationModel: 'committed' | 'on_request' | 'unlimited';
    dateFrom: string;
    dateTo: string;
    quantity: number;
    timeSlots?: {
      time: string;
      name?: string;
      duration?: number;
    }[];
    allowOverbooking: boolean;
    overbookingLimit?: number;
  };
}

export async function POST(request: Request) {
  try {
    const data: VariantData = await request.json();
    const orgId = 1; // TODO: Get from session
    
    console.log('Multi-rate API received data:', {
      mode: data.mode,
      product: data.product?.name,
      variant: data.variant.name,
      ratePlansCount: data.ratePlans.length,
      availability: data.availability
    });

    const supabase = await createClient();

    // Step 1: Create or get product
    let productId: number;
    
    if (data.mode === 'existing' && data.product?.id) {
      productId = data.product.id;
    } else {
      // Create new product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          org_id: orgId,
          name: data.product?.name || `${data.variant.name} Product`,
          type: data.productType,
          status: 'active'
        })
        .select('id')
        .single();

      if (productError) {
        throw new Error(`Failed to create product: ${productError.message}`);
      }

      productId = newProduct.id;
    }

    // Step 2: Create product variant
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        org_id: orgId,
        product_id: productId,
        name: data.variant.name,
        subtype: data.productType,
        attributes: data.variant.attributes || {},
        status: 'active'
      })
      .select('id')
      .single();

    if (variantError) {
      throw new Error(`Failed to create variant: ${variantError.message}`);
    }

    console.log(`Created variant ${variant.id} for product ${productId}`);

    // Step 3: Create multiple rate plans
    const createdRatePlans = [];
    
    for (const ratePlanData of data.ratePlans) {
      console.log(`Creating rate plan: ${ratePlanData.name}`);
      
      // Get or create supplier
      let supplierId: number;
      
      if (ratePlanData.supplier.id) {
        supplierId = parseInt(ratePlanData.supplier.id);
      } else {
        // Create new supplier
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            org_id: orgId,
            name: ratePlanData.supplier.name || 'New Supplier',
            status: 'active'
          })
          .select('id')
          .single();

        if (supplierError) {
          throw new Error(`Failed to create supplier: ${supplierError.message}`);
        }

        supplierId = newSupplier.id;
      }

      // Get or create contract
      let contractVersionId: number;
      
      // For now, create a default contract for each rate plan
      // In a real system, you'd want to manage contracts more carefully
      const { data: newContract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          org_id: orgId,
          supplier_id: supplierId,
          reference: ratePlanData.contract.reference || `${ratePlanData.name}-CON-${Date.now()}`,
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
          valid_from: data.availability.dateFrom,
          valid_to: data.availability.dateTo,
          cancellation_policy: {
            free_cancellation_days: 30,
            cancellation_penalty: 'percentage',
            penalty_percentage: 100
          },
          payment_policy: {
            deposit_percentage: 20,
            balance_due_days: 30
          }
        })
        .select('id')
        .single();

      if (versionError) {
        throw new Error(`Failed to create contract version: ${versionError.message}`);
      }

      contractVersionId = newContractVersion.id;

      // Create rate plan
      const { data: ratePlan, error: ratePlanError } = await supabase
        .from('rate_plans')
        .insert({
          org_id: orgId,
          product_variant_id: variant.id,
          supplier_id: supplierId,
          contract_version_id: contractVersionId,
          inventory_model: data.availability.allocationModel,
          currency: ratePlanData.pricing.currency,
          markets: ratePlanData.markets,
          channels: ratePlanData.channels,
          preferred: ratePlanData.preferred,
          valid_from: data.availability.dateFrom,
          valid_to: data.availability.dateTo,
          rate_doc: {
            name: ratePlanData.name,
            base_cost: ratePlanData.pricing.baseCost,
            base_price: ratePlanData.pricing.basePrice,
            currency: ratePlanData.pricing.currency,
            notes: ratePlanData.notes
          }
        })
        .select('id')
        .single();

      if (ratePlanError) {
        throw new Error(`Failed to create rate plan: ${ratePlanError.message}`);
      }

      console.log(`Created rate plan ${ratePlan.id}`);

      // Create rate seasons
      for (const season of ratePlanData.seasons) {
        const { error: seasonError } = await supabase
          .from('rate_seasons')
          .insert({
            org_id: orgId,
            rate_plan_id: ratePlan.id,
            season_from: season.seasonFrom,
            season_to: season.seasonTo,
            dow_mask: season.dowMask || 127, // Default to all days
            min_stay: season.minStay || null,
            max_stay: season.maxStay || null,
            min_pax: season.minPax || null,
            max_pax: season.maxPax || null
          });

        if (seasonError) {
          console.warn(`Failed to create season ${season.seasonFrom}-${season.seasonTo}:`, seasonError.message);
        }
      }

      // Create rate occupancies
      for (const occupancy of ratePlanData.occupancies) {
        const { error: occupancyError } = await supabase
          .from('rate_occupancies')
          .insert({
            org_id: orgId,
            rate_plan_id: ratePlan.id,
            min_occupancy: occupancy.minOccupancy,
            max_occupancy: occupancy.maxOccupancy,
            pricing_model: occupancy.pricingModel,
            base_amount: occupancy.baseAmount,
            per_person_amount: occupancy.perPersonAmount || null
          });

        if (occupancyError) {
          console.warn(`Failed to create occupancy ${occupancy.minOccupancy}-${occupancy.maxOccupancy}pax:`, occupancyError.message);
        }
      }

      // Create rate age bands (if any)
      if (ratePlanData.ageBands && ratePlanData.ageBands.length > 0) {
        for (const ageBand of ratePlanData.ageBands) {
          const { error: ageBandError } = await supabase
            .from('rate_age_bands')
            .insert({
              org_id: orgId,
              rate_plan_id: ratePlan.id,
              label: ageBand.label,
              min_age: ageBand.minAge,
              max_age: ageBand.maxAge,
              price_type: ageBand.priceType,
              value: ageBand.value
            });

          if (ageBandError) {
            console.warn(`Failed to create age band ${ageBand.label}:`, ageBandError.message);
          }
        }
      }

      createdRatePlans.push({
        id: ratePlan.id,
        name: ratePlanData.name,
        supplier_id: supplierId
      });
    }

    // Step 4: Create allocation buckets (if committed allocation)
    if (data.availability.allocationModel === 'committed') {
      // Create allocation bucket for each supplier
      const uniqueSuppliers = [...new Set(data.ratePlans.map(rp => {
        const supplier = data.ratePlans.find(p => p.id === rp.id)?.supplier;
        return supplier?.id;
      }).filter(Boolean))];

      for (const supplierIdStr of uniqueSuppliers) {
        if (!supplierIdStr) continue;
        
        const supplierId = parseInt(supplierIdStr);
        
        const { error: bucketError } = await supabase
          .from('allocation_buckets')
          .insert({
            org_id: orgId,
            product_variant_id: variant.id,
            supplier_id: supplierId,
            date: data.availability.dateFrom,
            allocation_type: 'committed',
            quantity: data.availability.quantity,
            booked: 0,
            held: 0,
            allow_overbooking: data.availability.allowOverbooking,
            overbooking_limit: data.availability.overbookingLimit
          });

        if (bucketError) {
          console.warn(`Failed to create allocation bucket for supplier ${supplierId}:`, bucketError.message);
        }
      }
    }

    // Step 5: Create time slots (if any)
    if (data.availability.timeSlots && data.availability.timeSlots.length > 0) {
      for (const timeSlot of data.availability.timeSlots) {
        const { error: slotError } = await supabase
          .from('time_slots')
          .insert({
            org_id: orgId,
            product_variant_id: variant.id,
            slot_time: timeSlot.time,
            slot_name: timeSlot.name,
            duration_minutes: timeSlot.duration
          });

        if (slotError) {
          console.warn(`Failed to create time slot ${timeSlot.time}:`, slotError.message);
        }
      }
    }

    console.log(`Successfully created variant ${variant.id} with ${createdRatePlans.length} rate plans`);

    return NextResponse.json({
      success: true,
      data: {
        variant_id: variant.id,
        product_id: productId,
        rate_plans: createdRatePlans
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Multi-rate API Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
