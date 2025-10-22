import { createDatabaseService } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const db = await createDatabaseService();
    
    // For now, using a hardcoded organization ID
    // In production, this would come from the authenticated user's session
    const organizationId = '11111111-1111-1111-1111-111111111111';
    
    const suppliers = await db.getSuppliers(organizationId);

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Unexpected error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, code, supplier_type, contact_info, commission_rate } = await request.json();
    
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json({ success: false, error: 'Name and code are required' }, { status: 400 });
    }

    const db = await createDatabaseService();
    const supabase = await db.getServerDatabase();
    
    // For now, using a hardcoded organization ID
    const organizationId = '11111111-1111-1111-1111-111111111111';
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        code: code.trim(),
        supplier_type: supplier_type || null,
        contact_info: contact_info || null,
        commission_rate: commission_rate || null,
        is_active: true
      })
      .select('id, name, code, supplier_type, is_active')
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error creating supplier:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
