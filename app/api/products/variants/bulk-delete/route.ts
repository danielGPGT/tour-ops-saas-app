import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 });
    }

    const supabase = await createClient();
    const orgId = 1; // TODO: from session

    // Delete variants (this will cascade to related records)
    const { error } = await supabase
      .from('product_variants')
      .delete()
      .in('id', ids)
      .eq('org_id', orgId);

    if (error) {
      console.error('Error deleting variants:', error);
      return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
