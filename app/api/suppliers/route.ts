import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = 1; // TODO: Get from session

  try {
    const supabase = await createClient();
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, name, status, created_at')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Unexpected error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const orgId = 1; // TODO: Get from session

  try {
    const { name, email, phone } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        org_id: orgId,
        name: name.trim(),
        terms: {
          contact_email: email || null,
          contact_phone: phone || null
        },
        status: 'active'
      })
      .select('id, name, status')
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
