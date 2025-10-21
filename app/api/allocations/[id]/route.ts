import { NextRequest, NextResponse } from 'next/server';
import { getCurrentOrgId } from '@/lib/hooks/use-current-org';
import { prisma } from '@/lib/db-connection';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allocationId = parseInt(params.id);
    const orgId = await getCurrentOrgId();

    const allocation = await prisma.allocation_buckets.findUnique({
      where: { 
        id: allocationId,
        org_id: orgId
      },
      include: {
        suppliers: true,
        product_variants: {
          include: {
            products: true
          }
        }
      }
    });

    if (!allocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Get allocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch allocation' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allocationId = parseInt(params.id);
    const orgId = await getCurrentOrgId();
    const body = await request.json();
    const { quantity, unitCost, allocationType, stopSell, blackout } = body;

    // Check if allocation exists and belongs to org
    const existingAllocation = await prisma.allocation_buckets.findUnique({
      where: { 
        id: allocationId,
        org_id: orgId
      }
    });

    if (!existingAllocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Update allocation
    const updatedAllocation = await prisma.allocation_buckets.update({
      where: { id: allocationId },
      data: {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(unitCost !== undefined && { unit_cost: parseFloat(unitCost) }),
        ...(allocationType && { allocation_type: allocationType }),
        ...(stopSell !== undefined && { stop_sell: stopSell }),
        ...(blackout !== undefined && { blackout: blackout }),
        updated_at: new Date()
      }
    });

    return NextResponse.json(updatedAllocation);
  } catch (error) {
    console.error('Update allocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to update allocation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const allocationId = parseInt(params.id);
    const orgId = await getCurrentOrgId();

    // Check if allocation exists and belongs to org
    const existingAllocation = await prisma.allocation_buckets.findUnique({
      where: { 
        id: allocationId,
        org_id: orgId
      }
    });

    if (!existingAllocation) {
      return NextResponse.json(
        { error: 'Allocation not found' },
        { status: 404 }
      );
    }

    // Check if allocation has bookings
    if (existingAllocation.booked > 0) {
      return NextResponse.json(
        { error: 'Cannot delete allocation with existing bookings' },
        { status: 400 }
      );
    }

    // Delete allocation
    await prisma.allocation_buckets.delete({
      where: { id: allocationId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete allocation API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete allocation' },
      { status: 500 }
    );
  }
}
