import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProductVariantDetailsClient } from '@/components/products-variants/ProductVariantDetailsClient'

interface Props {
  params: {
    id: string
  }
}

export default async function ProductVariantDetailsPage({ params }: Props) {
  const supabase = await createClient()
  
  try {
    // Get the basic product variant data first
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .select(`
        *,
        products (
          id,
          name,
          type,
          status
        )
      `)
      .eq('id', params.id)
      .single()

    if (variantError || !variant) {
      console.error('Variant fetch error:', variantError)
      redirect('/products-variants')
    }

    // Get rate plans separately
    const { data: ratePlans, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select(`
        *,
        suppliers (
          id,
          name,
          status
        )
      `)
      .eq('product_variant_id', variant.id)

    if (ratePlansError) {
      console.error('Rate plans error:', ratePlansError)
    }
    console.log('Rate plans found:', ratePlans?.length || 0)

    // Get allocation buckets separately
    const { data: allocationBuckets, error: allocationError } = await supabase
      .from('allocation_buckets')
      .select(`
        *,
        time_slots (
          id,
          slot_name,
          slot_time,
          duration_minutes
        )
      `)
      .eq('product_variant_id', variant.id)

    if (allocationError) {
      console.error('Allocation buckets error:', allocationError)
    }
    console.log('Allocation buckets found:', allocationBuckets?.length || 0)

    // Get rate seasons, occupancies, and taxes/fees separately
    const { data: rateSeasons } = await supabase
      .from('rate_seasons')
      .select('*')
      .in('rate_plan_id', ratePlans?.map(rp => rp.id) || [])

    const { data: rateOccupancies } = await supabase
      .from('rate_occupancies')
      .select('*')
      .in('rate_plan_id', ratePlans?.map(rp => rp.id) || [])

    const { data: rateTaxesFees } = await supabase
      .from('rate_taxes_fees')
      .select('*')
      .in('rate_plan_id', ratePlans?.map(rp => rp.id) || [])

    // Combine the data
    const variantWithRelations = {
      ...variant,
      rate_plans: ratePlans?.map(ratePlan => ({
        ...ratePlan,
        rate_seasons: rateSeasons?.filter(rs => rs.rate_plan_id === ratePlan.id) || [],
        rate_occupancies: rateOccupancies?.filter(ro => ro.rate_plan_id === ratePlan.id) || [],
        rate_taxes_fees: rateTaxesFees?.filter(rtf => rtf.rate_plan_id === ratePlan.id) || []
      })) || [],
      allocation_buckets: allocationBuckets || []
    }

    return (
      <div className="container mx-auto py-6">
        <ProductVariantDetailsClient variant={variantWithRelations} />
      </div>
    )
  } catch (error) {
    console.error('Page error:', error)
    redirect('/products-variants')
  }
}
