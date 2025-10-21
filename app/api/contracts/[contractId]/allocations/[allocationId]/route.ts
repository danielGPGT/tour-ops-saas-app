import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const updateAllocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  allocation_type: z.enum(['committed', 'freesale', 'on_request']).optional(),
  quantity: z.number().int().min(0).nullable().optional(),
  unit_cost: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  notes: z.string().optional(),
  stop_sell: z.boolean().optional(),
  blackout: z.boolean().optional(),
  release_period_hours: z.number().int().min(0).optional(),
  committed_cost: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; allocationId: string }> }
) {
  try {
    const { contractId, allocationId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get specific allocation
    const { data: allocation, error } = await supabase
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
      .eq('id', allocationId)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)
      .single()

    if (error) {
      console.error('Error fetching allocation:', error)
      return NextResponse.json({ error: 'Failed to fetch allocation' }, { status: 500 })
    }

    return NextResponse.json({ allocation })
  } catch (error: any) {
    console.error('Error in GET /api/contracts/[contractId]/allocations/[allocationId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; allocationId: string }> }
) {
  try {
    const { contractId, allocationId } = await params
    const body = await request.json()
    const validatedData = updateAllocationSchema.parse(body)

    const supabase = await createClient()

    // Update the allocation
    const { data: allocation, error } = await supabase
      .from('allocation_buckets')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', allocationId)
      .eq('contract_id', contractId)
      .select()
      .single()

    if (error) {
      console.error('Error updating allocation:', error)
      return NextResponse.json({ error: 'Failed to update allocation' }, { status: 500 })
    }

    return NextResponse.json({ allocation })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.flatten().fieldErrors 
      }, { status: 400 })
    }

    console.error('Error in PUT /api/contracts/[contractId]/allocations/[allocationId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string; allocationId: string }> }
) {
  try {
    const { contractId, allocationId } = await params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if allocation has bookings
    const { data: allocation } = await supabase
      .from('allocation_buckets')
      .select('booked, held')
      .eq('id', allocationId)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)
      .single()

    if (allocation && (allocation.booked > 0 || allocation.held > 0)) {
      return NextResponse.json({ 
        error: 'Cannot delete allocation with existing bookings or holds' 
      }, { status: 409 })
    }

    // Delete the allocation
    const { error } = await supabase
      .from('allocation_buckets')
      .delete()
      .eq('id', allocationId)
      .eq('org_id', orgId)
      .eq('contract_id', contractId)

    if (error) {
      console.error('Error deleting allocation:', error)
      return NextResponse.json({ error: 'Failed to delete allocation' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Allocation deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/contracts/[contractId]/allocations/[allocationId]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
