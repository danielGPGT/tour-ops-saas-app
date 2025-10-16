import { NextRequest, NextResponse } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { checkEnvironment } from '@/lib/env-check';

export async function POST(request: NextRequest) {
  try {
    // Check environment first
    const envCheck = checkEnvironment();
    if (!envCheck.isValid) {
      console.error('Environment issues:', envCheck.issues);
      return NextResponse.json(
        { 
          error: 'Database configuration issue. Please check your environment variables.',
          details: envCheck.issues 
        },
        { status: 500 }
      );
    }

    const wizardData = await request.json();
    
    // In a real app, you'd get this from the auth session
    const session = {
      org_id: 1, // Would come from auth context
      user_id: 1  // Would come from auth context
    };
    
    const result = await ProductService.createProductFromWizardData(wizardData, session);
    
    if (result.success) {
      return NextResponse.json(result, { status: 201 });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create product' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('API Error creating product:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL.';
      } else if (error.message.includes('relation') || error.message.includes('table')) {
        errorMessage = 'Database schema issue. Please run the database migration.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
