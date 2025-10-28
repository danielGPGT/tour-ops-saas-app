import { createDatabaseService } from '@/lib/database';
import { NextRequest } from 'next/server';
import { withAuth, withRole, successResponse, errorResponse, validateRequestBody } from '@/lib/auth/api-middleware';
import { supplierSchema } from '@/lib/validations/supplier.schema';

export const GET = withAuth(async (request: NextRequest, context) => {
  try {
    const db = await createDatabaseService();
    
    // Use authenticated user's organization ID
    const suppliers = await db.getSuppliers(context.organizationId);

    return successResponse(suppliers, 'Suppliers retrieved successfully');
  } catch (error) {
    console.error('Unexpected error fetching suppliers:', error);
    return errorResponse(
      'Failed to fetch suppliers',
      'FETCH_ERROR',
      500
    );
  }
});

// Only admins and owners can create suppliers
export const POST = withRole(['admin', 'owner'], async (request: NextRequest, context) => {
  try {
    // Validate request body
    const { data: supplierData, error: validationError } = await validateRequestBody(
      request,
      supplierSchema
    );

    if (validationError) {
      return validationError;
    }

    const db = await createDatabaseService();
    const supabase = await db.getServerDatabase();
    
    // Check if supplier code already exists in organization
    const { data: existingSupplier } = await supabase
      .from('suppliers')
      .select('id')
      .eq('organization_id', context.organizationId)
      .eq('code', supplierData!.code.trim())
      .single();

    if (existingSupplier) {
      return errorResponse(
        'Supplier with this code already exists',
        'DUPLICATE_CODE',
        400
      );
    }
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        organization_id: context.organizationId,
        name: supplierData!.name.trim(),
        code: supplierData!.code.trim(),
        supplier_type: supplierData!.supplier_type || null,
        contact_info: supplierData!.contact_info || null,
        default_currency: supplierData!.default_currency || 'USD',
        email: supplierData!.email || null,
        phone: supplierData!.phone || null,
        is_active: true
      })
      .select('id, name, code, supplier_type, default_currency, email, phone, is_active')
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return errorResponse(
        'Failed to create supplier',
        'CREATE_ERROR',
        500,
        error.message
      );
    }

    return successResponse(supplier, 'Supplier created successfully', 201);
  } catch (error) {
    console.error('Unexpected error creating supplier:', error);
    return errorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
});
