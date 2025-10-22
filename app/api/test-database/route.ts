import { NextResponse } from 'next/server';
import { createDatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const db = await createDatabaseService();
    
    // Test basic database connection
    const organizationId = '11111111-1111-1111-1111-111111111111';
    
    // Test getting organizations
    const organizations = await db.getOrganizations();
    
    // Test getting products
    const products = await db.getProducts(organizationId);
    
    // Test getting suppliers
    const suppliers = await db.getSuppliers(organizationId);
    
    // Test getting bookings
    const bookings = await db.getBookings(organizationId, 5);

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        organizations: organizations?.length || 0,
        products: products?.length || 0,
        suppliers: suppliers?.length || 0,
        bookings: bookings?.length || 0
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}
