import { NextRequest } from 'next/server';
import { ProductService } from '@/lib/services/product-service';
import { checkEnvironment } from '@/lib/env-check';
import { withAuth, successResponse, errorResponse, validateRequestBody } from '@/lib/auth/api-middleware';
import { z } from 'zod';

// Define validation schema for wizard data
const wizardDataSchema = z.object({
  productType: z.string().min(1, 'Product type is required'),
  productName: z.string().min(1, 'Product name is required'),
  // Add other required fields based on your wizard structure
}).passthrough(); // Allow additional fields

export const POST = withAuth(async (request: NextRequest, context) => {
  try {
    // Check environment first
    const envCheck = checkEnvironment();
    if (!envCheck.isValid) {
      console.error('Environment issues:', envCheck.issues);
      return errorResponse(
        'Database configuration issue. Please check your environment variables.',
        'ENV_CONFIG_ERROR',
        500,
        envCheck.issues
      );
    }

    // Validate request body
    const { data: wizardData, error: validationError } = await validateRequestBody(
      request,
      wizardDataSchema
    );

    if (validationError) {
      return validationError;
    }

    // Use authenticated session data
    const session = {
      org_id: context.organizationId,
      user_id: context.userId
    };
    
    const result = await ProductService.createProductFromWizardData(wizardData!, session);
    
    if (result.success) {
      return successResponse(result, 'Product created successfully', 201);
    } else {
      return errorResponse(
        result.error || 'Failed to create product',
        'CREATION_FAILED',
        400
      );
    }
  } catch (error) {
    console.error('API Error creating product:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';
    
    if (error instanceof Error) {
      if (error.message.includes('connect')) {
        errorMessage = 'Database connection failed. Please check your DATABASE_URL.';
        errorCode = 'DB_CONNECTION_ERROR';
      } else if (error.message.includes('relation') || error.message.includes('table')) {
        errorMessage = 'Database schema issue. Please run the database migration.';
        errorCode = 'DB_SCHEMA_ERROR';
      } else {
        errorMessage = error.message;
      }
    }
    
    return errorResponse(errorMessage, errorCode, 500);
  }
});
