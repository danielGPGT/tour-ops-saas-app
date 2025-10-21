import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const updateRatePlanSchema = z.object({
  currency: z.string().min(3).max(3).optional(),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  inventory_model: z.enum(['committed', 'freesale', 'on_request']).optional(),
  markets: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(1000).optional(),
  rate_doc: z.record(z.any()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; rateId: string }> }
) {
  try {
    const { contractId, rateId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get specific rate plan
    const { data: ratePlan, error } = await supabase
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
      .eq('id', rateId)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)
      .single()

    if (error) {
      console.error('Error fetching rate plan:', error)
      return NextResponse.json({ error: 'Failed to fetch rate plan' }, { status: 500 })
    }

    return NextResponse.json({ ratePlan })
  } catch (error: any) {
    console.error('Error in GET /api/contracts/[contractId]/rates/[rateId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; rateId: string }> }
) {
  try {
    const { contractId, rateId } = await params
    const body = await request.json()
    const validatedData = updateRatePlanSchema.parse(body)

    const supabase = await createClient()

    // Update the rate plan
    const { data: ratePlan, error } = await supabase
      .from('rate_plans')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rateId)
      .eq('contract_id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error updating rate plan:', error)
      return NextResponse.json({ error: 'Failed to update rate plan' }, { status: 500 })
    }

    return NextResponse.json({ ratePlan })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.flatten().fieldErrors 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/contracts/[contractId]/rates/[rateId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; rateId: string }> }
) {
  try {
    const { contractId, rateId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Delete the rate plan (this will cascade delete related records)
    const { error } = await supabase
      .from('rate_plans')
      .delete()
      .eq('id', rateId)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)

    if (error) {
      console.error('Error deleting rate plan:', error)
      return NextResponse.json({ error: 'Failed to delete rate plan' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Rate plan deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/contracts/[contractId]/rates/[rateId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
