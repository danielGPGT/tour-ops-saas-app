import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const createRatePlanSchema = z.object({
  product_variant_id: z.number().int().positive(),
  supplier_id: z.number().int().positive(),
  contract_id: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inventory_model: z.enum(['committed', 'freesale', 'on_request']),
  markets: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(1000).default(100),
  rate_type: z.enum(['supplier_rate', 'master_rate']),
  rate_doc: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all supplier rates for this contract
    const { data: rates, error } = await supabase
      .from('rate_plans')
      .select(`
        *,
        rate_occupancies (
          id,
          min_occupancy,
          max_occupancy,
          pricing_model,
          base_amount,
          per_person_amount
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
        product_variants (
          id,
          name,
          products (
            id,
            name,
            type
          )
        )
      `)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)
      .eq('rate_type', 'supplier_rate')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching rates:', error)
      return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 })
    }

    return NextResponse.json({ rates: rates || [] })
  } catch (error: any) {
    console.error('Error in GET /api/contracts/[contractId]/rates:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params
    const body = await request.json()
    const validatedData = createRatePlanSchema.parse(body)

    const supabase = await createClient()

    // Create the rate plan
    const { data: ratePlan, error } = await supabase
      .from('rate_plans')
      .insert({
        org_id: validatedData.supplier_id, // This should be org_id from context
        product_variant_id: validatedData.product_variant_id,
        supplier_id: validatedData.supplier_id,
        contract_id: validatedData.contract_id,
        currency: validatedData.currency,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to,
        inventory_model: validatedData.inventory_model,
        markets: validatedData.markets || [],
        channels: validatedData.channels || [],
        priority: validatedData.priority,
        rate_type: validatedData.rate_type,
        rate_doc: validatedData.rate_doc || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating rate plan:', error)
      return NextResponse.json({ error: 'Failed to create rate plan' }, { status: 500 })
    }

    return NextResponse.json({ ratePlan }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.flatten().fieldErrors 
      }, { status: 400 })
    }

    console.error('Error in POST /api/contracts/[contractId]/rates:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
