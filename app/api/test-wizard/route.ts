import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test all wizard endpoints
    const tests = [
      {
        name: 'Product Types',
        endpoint: '/api/wizard/product-types',
        expectedFields: ['id', 'title', 'icon']
      },
      {
        name: 'Suppliers',
        endpoint: '/api/wizard/suppliers',
        expectedFields: ['id', 'name']
      },
      {
        name: 'Product Subtypes (Accommodation)',
        endpoint: '/api/wizard/product-subtypes?productType=accommodation',
        expectedFields: ['id', 'name', 'description']
      }
    ];

    const results = [];

    for (const test of tests) {
      try {
        const response = await fetch(`http://localhost:3000${test.endpoint}`);
        const data = await response.json();
        
        results.push({
          name: test.name,
          status: response.ok ? 'success' : 'error',
          endpoint: test.endpoint,
          statusCode: response.status,
          hasData: data.success && Array.isArray(data.data) && data.data.length > 0,
          sampleData: data.success && data.data.length > 0 ? data.data[0] : null
        });
      } catch (error) {
        results.push({
          name: test.name,
          status: 'error',
          endpoint: test.endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wizard API endpoints test results',
      tests: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to test wizard endpoints',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
