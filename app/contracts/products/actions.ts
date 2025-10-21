'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Schema for rate plan queries
const ratePlanQuerySchema = z.object({
  contractId: z.string().transform(val => BigInt(val)),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0)
})

// Schema for allocation queries
const allocationQuerySchema = z.object({
  contractId: z.string().transform(val => BigInt(val)),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0)
})

export async function getContractRatePlans(params: z.infer<typeof ratePlanQuerySchema>) {
  try {
    const validatedParams = ratePlanQuerySchema.parse(params)
    const supabase = await createClient()

    // Fetch rate plans linked to this contract
    const { data: ratePlans, error } = await supabase
      .from('rate_plans')
      .select(`
        *,
        product_variants (
          id,
          name,
          product_id,
          products (
            id,
            name,
            type
          )
        ),
        suppliers (
          id,
          name
        ),
        contracts (
          id,
          reference,
          status
        ),
        rate_seasons (
          id,
          season_from,
          season_to,
          dow_mask,
          min_stay,
          max_stay,
          min_pax,
          max_pax
        ),
        rate_occupancies (
          id,
          min_occupancy,
          max_occupancy,
          pricing_model,
          base_amount,
          per_person_amount
        ),
        rate_age_bands (
          id,
          label,
          min_age,
          max_age,
          price_type,
          value
        ),
        rate_taxes_fees (
          id,
          name,
          jurisdiction,
          inclusive,
          calc_base,
          amount_type,
          value,
          rounding_rule
        ),
        rate_adjustments (
          id,
          scope,
          condition,
          adjustment_type,
          value,
          priority
        )
      `)
      .eq('contract_id', validatedParams.contractId.toString())
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contract rate plans:', error)
      return { success: false, error: 'Failed to fetch rate plans' }
    }

    // Get total count
    const { count } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', validatedParams.contractId.toString())

    return {
      success: true,
      data: ratePlans || [],
      totalCount: count || 0
    }
  } catch (error) {
    console.error('Error in getContractRatePlans:', error)
    return { success: false, error: 'Failed to fetch rate plans' }
  }
}

export async function getContractAllocations(params: z.infer<typeof allocationQuerySchema>) {
  try {
    const validatedParams = allocationQuerySchema.parse(params)
    const supabase = await createClient()

    // Fetch allocation buckets linked to this contract
    const { data: allocations, error } = await supabase
      .from('allocation_buckets')
      .select(`
        *,
        product_variants (
          id,
          name,
          product_id,
          products (
            id,
            name,
            type
          )
        ),
        suppliers (
          id,
          name
        ),
        contracts (
          id,
          reference,
          status
        )
      `)
      .eq('contract_id', validatedParams.contractId.toString())
      .range(validatedParams.offset, validatedParams.offset + validatedParams.limit - 1)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching contract allocations:', error)
      return { success: false, error: 'Failed to fetch allocations' }
    }

    // Get total count
    const { count } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', validatedParams.contractId.toString())

    return {
      success: true,
      data: allocations || [],
      totalCount: count || 0
    }
  } catch (error) {
    console.error('Error in getContractAllocations:', error)
    return { success: false, error: 'Failed to fetch allocations' }
  }
}

export async function getContractProductsStats(contractId: string) {
  try {
    const supabase = await createClient()
    const contractIdBigInt = BigInt(contractId)

    // Get rate plans count
    const { count: ratePlansCount } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', contractIdBigInt.toString())

    // Get allocations count
    const { count: allocationsCount } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', contractIdBigInt.toString())

    // Get unique products count
    const { data: uniqueProducts } = await supabase
      .from('rate_plans')
      .select('product_variant_id')
      .eq('contract_id', contractIdBigInt.toString())

    const uniqueProductCount = new Set(uniqueProducts?.map(rp => rp.product_variant_id) || []).size

    return {
      success: true,
      data: {
        ratePlansCount: ratePlansCount || 0,
        allocationsCount: allocationsCount || 0,
        uniqueProductsCount: uniqueProductCount
      }
    }
  } catch (error) {
    console.error('Error in getContractProductsStats:', error)
    return { success: false, error: 'Failed to fetch contract products stats' }
  }
}
