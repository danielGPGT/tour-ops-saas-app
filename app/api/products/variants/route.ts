import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const supplierId = searchParams.get('supplierId')
    const productType = searchParams.get('productType')
    const status = searchParams.get('status') || 'active'

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Build query for product variants
    let query = supabase
      .from('product_variants')
              .select(`
                id,
                name,
                subtype,
                attributes,
                status,
                created_at,
                updated_at,
                products (
                  id,
                  name,
                  type
                )
              `)
      .eq('org_id', orgId)
      .eq('status', status)
      .order('name', { ascending: true })

    // If supplierId is provided, we need to find variants that have allocations or rates from this supplier
    if (supplierId) {
      // First get product variant IDs that have allocations or rates from this supplier
      const { data: allocationVariants } = await supabase
        .from('allocation_buckets')
        .select('product_variant_id')
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)

      const { data: rateVariants } = await supabase
        .from('rate_plans')
        .select('product_variant_id')
        .eq('org_id', orgId)
        .eq('supplier_id', supplierId)

      // Combine and get unique variant IDs
      const variantIds = new Set([
        ...(allocationVariants?.map(a => a.product_variant_id) || []),
        ...(rateVariants?.map(r => r.product_variant_id) || [])
      ])

      if (variantIds.size > 0) {
        query = query.in('id', Array.from(variantIds))
      } else {
        // No variants found for this supplier
        return NextResponse.json({ variants: [] })
      }
    }

    // Filter by product type if provided
    if (productType) {
      query = query.eq('products.type', productType)
    }

    const { data: variants, error } = await query

    if (error) {
      console.error('Error fetching product variants:', error)
      return NextResponse.json({ error: 'Failed to fetch product variants' }, { status: 500 })
    }

    return NextResponse.json({ variants: variants || [] })
  } catch (error: any) {
    console.error('Error in GET /api/products/variants:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}