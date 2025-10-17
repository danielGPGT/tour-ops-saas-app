import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface SimpleRatePlan {
  id: string;
  name: string;
  template: string;
  supplier: { id: string; name: string };
  contractReference: string;
  pricing: {
    currency: string;
    cost: number;
    markupPercentage: number;
    sellingPrice: number;
    fields: Record<string, any>;
  };
  channels: string[];
  markets: string[];
  validity: {
    from: string;
    to: string;
  };
  occupancy: {
    min: number;
    max: number;
  };
  seasons: Array<{
    id: string;
    seasonFrom: string;
    seasonTo: string;
    dowMask: number;
    minStay?: number;
    maxStay?: number;
    minPax?: number;
    maxPax?: number;
  }>;
  occupancies: Array<{
    id: string;
    minOccupancy: number;
    maxOccupancy: number;
    pricingModel: 'fixed' | 'base_plus_pax' | 'per_person';
    baseAmount: number;
    perPersonAmount?: number;
  }>;
  ageBands: Array<{
    id: string;
    label: string;
    minAge: number;
    maxAge: number;
    priceType: string;
    value: number;
  }>;
  taxes: Array<{
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    inclusive: boolean;
  }>;
  customAttributes: Record<string, any>;
  notes: string;
  preferred: boolean;
}

interface WizardData {
  mode: 'new' | 'existing';
  productType: string;
  productName: string;
  variantName: string;
  customAttributes?: Record<string, any>;
  ratePlans: SimpleRatePlan[];
  availability: {
    allocationModel: string;
    dateFrom: string;
    dateTo: string;
    quantity: number;
    allowOverbooking: boolean;
    overbookingLimit?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const data: WizardData = await request.json();

    console.log('Simple rate API received data:', {
      mode: data.mode,
      product: data.productName,
      variant: data.variantName,
      ratePlansCount: data.ratePlans.length,
      availability: data.availability
    });

    // Get organization ID from auth (simplified for demo)
    const orgId = 1; // In real app, get from auth context

    let productId: number;
    let variantId: number;

    if (data.mode === 'new') {
      // Create new product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          org_id: orgId,
          name: data.productName,
          type: data.productType,
          status: 'active'
        })
        .select('id')
        .single();

      if (productError) {
        console.error('Error creating product:', productError);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
      }

      productId = product.id;
      console.log(`Created product ${productId}: ${data.productName}`);

      // Create variant
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          org_id: orgId,
          product_id: productId,
          name: data.variantName,
          subtype: data.productType,
          attributes: {
            template: data.ratePlans[0]?.template || data.productType,
            customAttributes: data.customAttributes || {}
          },
          status: 'active'
        })
        .select('id')
        .single();

      if (variantError) {
        console.error('Error creating variant:', variantError);
        return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
      }

      variantId = variant.id;
      console.log(`Created variant ${variantId} for product ${productId}`);
    } else {
      // Use existing product (from preselectedProduct)
      // For now, we'll assume we have the product ID from the client
      // In a real implementation, you'd pass this from the client
      productId = 1; // This should come from the client
      
      // Create variant for existing product
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          org_id: orgId,
          product_id: productId,
          name: data.variantName,
          subtype: data.productType,
          attributes: {
            template: data.ratePlans[0]?.template || data.productType,
            customAttributes: data.customAttributes || {}
          },
          status: 'active'
        })
        .select('id')
        .single();

      if (variantError) {
        console.error('Error creating variant:', variantError);
        return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
      }

      variantId = variant.id;
      console.log(`Created variant ${variantId} for existing product ${productId}`);
    }

    // Process each rate plan
    for (const ratePlanData of data.ratePlans) {
      console.log(`Creating rate plan: ${ratePlanData.name}`);

      // Get or create supplier
      let supplierId: number;
      if (ratePlanData.supplier.id) {
        supplierId = parseInt(ratePlanData.supplier.id);
      } else {
        // Create new supplier
        const { data: supplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            org_id: orgId,
            name: ratePlanData.supplier.name,
            status: 'active',
            channels: ratePlanData.channels
          })
          .select('id')
          .single();

        if (supplierError) {
          console.error('Error creating supplier:', supplierError);
          return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
        }

        supplierId = supplier.id;
      }

      // Get or create contract
      let contractVersionId: number;
      if (ratePlanData.contractReference) {
        // Check if contract exists
        const { data: existingContract, error: contractError } = await supabase
          .from('contracts')
          .select('id')
          .eq('org_id', orgId)
          .eq('supplier_id', supplierId)
          .eq('reference', ratePlanData.contractReference)
          .single();

        if (contractError && contractError.code !== 'PGRST116') {
          console.error('Error checking contract:', contractError);
          return NextResponse.json({ error: 'Failed to check contract' }, { status: 500 });
        }

        if (existingContract) {
          // Use existing contract and get latest version
          const { data: contractVersion, error: versionError } = await supabase
            .from('contract_versions')
            .select('id')
            .eq('contract_id', existingContract.id)
            .order('valid_from', { ascending: false })
            .limit(1)
            .single();

          if (versionError) {
            console.error('Error getting contract version:', versionError);
            return NextResponse.json({ error: 'Failed to get contract version' }, { status: 500 });
          }

          contractVersionId = contractVersion.id;
        } else {
          // Create new contract
          const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .insert({
              org_id: orgId,
              supplier_id: supplierId,
              reference: ratePlanData.contractReference,
              status: 'active'
            })
            .select('id')
            .single();

          if (contractError) {
            console.error('Error creating contract:', contractError);
            return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
          }

          // Create contract version
          const { data: contractVersion, error: versionError } = await supabase
            .from('contract_versions')
            .insert({
              org_id: orgId,
              contract_id: contract.id,
              valid_from: data.availability.dateFrom,
              valid_to: data.availability.dateTo,
              cancellation_policy: {},
              payment_policy: {},
              terms: {}
            })
            .select('id')
            .single();

          if (versionError) {
            console.error('Error creating contract version:', versionError);
            return NextResponse.json({ error: 'Failed to create contract version' }, { status: 500 });
          }

          contractVersionId = contractVersion.id;
        }
      } else {
        // Create default contract
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .insert({
            org_id: orgId,
            supplier_id: supplierId,
            reference: `DEFAULT-${Date.now()}`,
            status: 'active'
          })
          .select('id')
          .single();

        if (contractError) {
          console.error('Error creating default contract:', contractError);
          return NextResponse.json({ error: 'Failed to create default contract' }, { status: 500 });
        }

        const { data: contractVersion, error: versionError } = await supabase
          .from('contract_versions')
          .insert({
            org_id: orgId,
            contract_id: contract.id,
            valid_from: data.availability.dateFrom,
            valid_to: data.availability.dateTo,
            cancellation_policy: {},
            payment_policy: {},
            terms: {}
          })
          .select('id')
          .single();

        if (versionError) {
          console.error('Error creating default contract version:', versionError);
          return NextResponse.json({ error: 'Failed to create default contract version' }, { status: 500 });
        }

        contractVersionId = contractVersion.id;
      }

      // Create rate plan
      const sellingPrice = ratePlanData.pricing.cost + (ratePlanData.pricing.cost * ratePlanData.pricing.markupPercentage / 100);
      
      const { data: ratePlan, error: ratePlanError } = await supabase
        .from('rate_plans')
        .insert({
          org_id: orgId,
          product_variant_id: variantId,
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
            base_cost: ratePlanData.pricing.cost,
            base_price: sellingPrice,
            currency: ratePlanData.pricing.currency,
            fields: ratePlanData.pricing.fields,
            notes: ratePlanData.notes
          }
        })
        .select('id')
        .single();

      if (ratePlanError) {
        console.error('Error creating rate plan:', ratePlanError);
        return NextResponse.json({ error: 'Failed to create rate plan' }, { status: 500 });
      }

      console.log(`Created rate plan ${ratePlan.id}`);

      // Create rate seasons
      for (const season of ratePlanData.seasons) {
        if (season.seasonFrom && season.seasonTo) {
          const { error: seasonError } = await supabase
            .from('rate_seasons')
            .insert({
              org_id: orgId,
              rate_plan_id: ratePlan.id,
              season_from: season.seasonFrom,
              season_to: season.seasonTo,
              dow_mask: season.dowMask || 127,
              min_stay: season.minStay || null,
              max_stay: season.maxStay || null,
              min_pax: season.minPax || null,
              max_pax: season.maxPax || null
            });

          if (seasonError) {
            console.warn(`Failed to create season ${season.seasonFrom}-${season.seasonTo}:`, seasonError.message);
          }
        }
      }

      // Create occupancy rules
      for (const occupancy of ratePlanData.occupancies) {
        const { error: occupancyError } = await supabase
          .from('rate_occupancies')
          .insert({
            org_id: orgId,
            rate_plan_id: ratePlan.id,
            min_occupancy: occupancy.minOccupancy,
            max_occupancy: occupancy.maxOccupancy,
            pricing_model: occupancy.pricingModel,
            base_amount: occupancy.baseAmount || sellingPrice,
            per_person_amount: occupancy.perPersonAmount || null
          });

        if (occupancyError) {
          console.warn(`Failed to create occupancy ${occupancy.minOccupancy}-${occupancy.maxOccupancy}pax:`, occupancyError.message);
        }
      }

      // Create age bands
      for (const ageBand of ratePlanData.ageBands) {
        if (ageBand.label && ageBand.minAge !== undefined && ageBand.maxAge !== undefined) {
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

      // Create taxes/fees
      for (const tax of ratePlanData.taxes) {
        if (tax.name && tax.value > 0) {
          const { error: taxError } = await supabase
            .from('rate_taxes_fees')
            .insert({
              org_id: orgId,
              rate_plan_id: ratePlan.id,
              name: tax.name,
              jurisdiction: 'default',
              inclusive: tax.inclusive,
              calc_base: 'base_price',
              amount_type: tax.type,
              value: tax.value
            });

          if (taxError) {
            console.warn(`Failed to create tax/fee ${tax.name}:`, taxError.message);
          }
        }
      }

      // Create allocation bucket
      const { error: allocationError } = await supabase
        .from('allocation_buckets')
        .insert({
          org_id: orgId,
          product_variant_id: variantId,
          supplier_id: supplierId,
          date: data.availability.dateFrom === data.availability.dateTo ? data.availability.dateFrom : null,
          event_start_date: data.availability.dateFrom !== data.availability.dateTo ? data.availability.dateFrom : null,
          event_end_date: data.availability.dateFrom !== data.availability.dateTo ? data.availability.dateTo : null,
          allocation_type: data.availability.allocationModel,
          quantity: data.availability.quantity,
          allow_overbooking: data.availability.allowOverbooking,
          overbooking_limit: data.availability.overbookingLimit || null
        });

      if (allocationError) {
        console.warn(`Failed to create allocation bucket:`, allocationError.message);
      }
    }

    console.log(`Successfully created variant ${variantId} with ${data.ratePlans.length} rate plans`);

    return NextResponse.json({
      success: true,
      data: {
        variantId,
        productId,
        ratePlansCount: data.ratePlans.length
      }
    }, { status: 201 });

  } catch (error) {
    console.error('API Error creating simple rate plan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
