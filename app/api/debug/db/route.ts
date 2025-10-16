import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Test basic database connection
    await prisma.$connect();
    
    // Test querying a simple table
    const orgCount = await prisma.organizations.count();
    
    // Test if new tables exist
    const hasInventoryPools = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'inventory_pools'
      ) as exists;
    `;
    
    const hasRoomAssignments = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'room_assignments'
      ) as exists;
    `;

    await prisma.$disconnect();

    return NextResponse.json({
      status: 'ok',
      connection: 'successful',
      organizations_count: orgCount,
      new_tables: {
        inventory_pools: hasInventoryPools[0]?.exists || false,
        room_assignments: hasRoomAssignments[0]?.exists || false,
      },
      message: 'Database connection successful'
    });
  } catch (error) {
    console.error('Database test error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        connection: 'failed',
        error: error instanceof Error ? error.message : 'Unknown database error',
        message: 'Database connection failed'
      },
      { status: 500 }
    );
  }
}
