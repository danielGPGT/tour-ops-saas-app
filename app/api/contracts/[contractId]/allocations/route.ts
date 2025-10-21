import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'
import { eachDayOfInterval } from 'date-fns'

const createAllocationSchema = z.object({
  product_variant_id: z.number().int().positive(),
  supplier_id: z.number().int().positive(),
  contract_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allocation_type: z.enum(['committed', 'freesale', 'on_request']),
  quantity: z.number().int().min(0).nullable(),
  unit_cost: z.number().min(0),
  currency: z.string().min(3).max(3),
  notes: z.string().optional(),
  stop_sell: z.boolean().default(false),
  blackout: z.boolean().default(false),
  release_period_hours: z.number().int().min(0).optional(),
  committed_cost: z.boolean().default(false),
})

const bulkCreateAllocationSchema = z.object({
  product_variant_id: z.number().int().positive(),
  supplier_id: z.number().int().positive(),
  contract_id: z.number().int().positive(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allocation_type: z.enum(['committed', 'freesale', 'on_request']),
  quantity: z.number().int().min(0).nullable(),
  unit_cost: z.number().min(0),
  currency: z.string().min(3).max(3),
  notes: z.string().optional(),
  stop_sell: z.boolean().default(false),
  blackout: z.boolean().default(false),
  release_period_hours: z.number().int().min(0).optional(),
  committed_cost: z.boolean().default(false),
  min_stay_days: z.number().int().min(1).optional(),
  max_stay_days: z.number().int().min(1).optional(),
  min_occupancy: z.number().int().min(1).optional(),
  max_occupancy: z.number().int().min(1).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const productVariantId = searchParams.get('productVariantId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('allocation_buckets')
      .select(`
        *,
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
      .order('date', { ascending: true })

    // Apply filters
    if (productVariantId) {
      query = query.eq('product_variant_id', productVariantId)
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('date', dateTo)
    }

    const { data: allocations, error } = await query

    if (error) {
      console.error('Error fetching allocations:', error)
      return NextResponse.json({ error: 'Failed to fetch allocations' }, { status: 500 })
    }

    return NextResponse.json({ allocations: allocations || [] })
  } catch (error: any) {
    console.error('Error in GET /api/contracts/[contractId]/allocations:', error)
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
    
    // Check if this is a bulk create request
    if (body.date_from && body.date_to) {
      const validatedData = bulkCreateAllocationSchema.parse(body)
      return await handleBulkCreateAllocations(validatedData)
    } else {
      const validatedData = createAllocationSchema.parse(body)
      return await handleCreateAllocation(validatedData)
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.flatten().fieldErrors 
      }, { status: 400 })
    }

    console.error('Error in POST /api/contracts/[contractId]/allocations:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

async function handleCreateAllocation(data: z.infer<typeof createAllocationSchema>) {
  const supabase = await createClient()

  // Check if allocation already exists for this date and variant
  const { data: existing } = await supabase
    .from('allocation_buckets')
    .select('id')
    .eq('org_id', data.supplier_id) // This should be org_id from context
    .eq('product_variant_id', data.product_variant_id)
    .eq('supplier_id', data.supplier_id)
    .eq('contract_id', data.contract_id)
    .eq('date', data.date)
    .single()

  if (existing) {
    return NextResponse.json({ 
      error: 'Allocation already exists for this date and variant' 
    }, { status: 409 })
  }

  // Create the allocation
  const { data: allocation, error } = await supabase
    .from('allocation_buckets')
    .insert({
      org_id: data.supplier_id, // This should be org_id from context
      product_variant_id: data.product_variant_id,
      supplier_id: data.supplier_id,
      contract_id: data.contract_id,
      date: data.date,
      allocation_type: data.allocation_type,
      quantity: data.quantity,
      unit_cost: data.unit_cost,
      currency: data.currency,
      notes: data.notes,
      stop_sell: data.stop_sell,
      blackout: data.blackout,
      release_period_hours: data.release_period_hours,
      committed_cost: data.committed_cost,
      booked: 0,
      held: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating allocation:', error)
    return NextResponse.json({ error: 'Failed to create allocation' }, { status: 500 })
  }

  return NextResponse.json({ allocation }, { status: 201 })
}

async function handleBulkCreateAllocations(data: z.infer<typeof bulkCreateAllocationSchema>) {
  const supabase = await createClient()

  // Generate date range
  const startDate = new Date(data.date_from)
  const endDate = new Date(data.date_to)
  const dates = eachDayOfInterval({ start: startDate, end: endDate })

  // Prepare allocations to create
  const allocationsToCreate = dates.map(date => ({
    org_id: data.supplier_id, // This should be org_id from context
    product_variant_id: data.product_variant_id,
    supplier_id: data.supplier_id,
    contract_id: data.contract_id,
    date: date.toISOString().split('T')[0],
    allocation_type: data.allocation_type,
    quantity: data.quantity,
    unit_cost: data.unit_cost,
    currency: data.currency,
    notes: data.notes,
    stop_sell: data.stop_sell,
    blackout: data.blackout,
    release_period_hours: data.release_period_hours,
    committed_cost: data.committed_cost,
    booked: 0,
    held: 0,
    // Store block allocation rules in rate_doc or notes
    rate_doc: {
      min_stay_days: data.min_stay_days,
      max_stay_days: data.max_stay_days,
      min_occupancy: data.min_occupancy,
      max_occupancy: data.max_occupancy,
    }
  }))

  // Create all allocations
  const { data: allocations, error } = await supabase
    .from('allocation_buckets')
    .insert(allocationsToCreate)
    .select()

  if (error) {
    console.error('Error creating bulk allocations:', error)
    return NextResponse.json({ error: 'Failed to create bulk allocations' }, { status: 500 })
  }

  return NextResponse.json({ 
    allocations: allocations || [],
    message: `Created ${allocations?.length || 0} allocations`
  }, { status: 201 })
}
