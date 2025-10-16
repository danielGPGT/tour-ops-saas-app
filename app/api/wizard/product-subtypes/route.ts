import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');

    let subtypes = [];

    // Try to fetch product subtypes from database using Supabase
    try {
      const supabase = await createClient();
      
      const { data: subtypesData, error } = await supabase
        .from('product_subtypes')
        .select('*')
        .eq('product_type_code', productType)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.log('Product subtypes table not found or error:', error);
      } else {
        subtypes = subtypesData || [];
      }
    } catch (dbError) {
      console.log('Database connection error:', dbError);
    }

    // If no subtypes exist in DB, return default subtypes based on product type
    if (subtypes.length === 0) {
      const defaultSubtypes = getDefaultSubtypes(productType);
      
      return NextResponse.json({
        success: true,
        data: defaultSubtypes
      });
    }

    // Transform database records to wizard format
    const wizardSubtypes = subtypes.map(subtype => ({
      id: subtype.code,
      name: subtype.name,
      description: subtype.description || '',
      active: subtype.active
    }));

    return NextResponse.json({
      success: true,
      data: wizardSubtypes
    });

  } catch (error) {
    console.error('Error fetching product subtypes:', error);
    
    // Fallback to default subtypes even on error
    const { searchParams } = new URL(request.url);
    const productType = searchParams.get('productType');
    const defaultSubtypes = getDefaultSubtypes(productType);
    
    return NextResponse.json({
      success: true,
      data: defaultSubtypes
    });
  }
}

function getDefaultSubtypes(productType: string | null) {
  switch (productType) {
    case 'accommodation':
      return [
        { id: 'standard_room', name: 'Standard Room', description: 'Standard hotel room', active: true },
        { id: 'deluxe_room', name: 'Deluxe Room', description: 'Deluxe hotel room', active: true },
        { id: 'suite', name: 'Suite', description: 'Hotel suite', active: true },
        { id: 'apartment', name: 'Apartment', description: 'Self-contained apartment', active: true }
      ];
    
    case 'activity':
      return [
        { id: 'adult', name: 'Adult', description: 'Adult ticket', active: true },
        { id: 'child', name: 'Child', description: 'Child ticket', active: true },
        { id: 'family', name: 'Family', description: 'Family ticket (2 adults + 2 children)', active: true },
        { id: 'group', name: 'Group', description: 'Group ticket (10+ people)', active: true }
      ];
    
    case 'transfer':
      return [
        { id: 'sedan', name: 'Sedan', description: 'Private sedan (up to 4 people)', active: true },
        { id: 'suv', name: 'SUV', description: 'Private SUV (up to 6 people)', active: true },
        { id: 'van', name: 'Van', description: 'Private van (up to 8 people)', active: true },
        { id: 'coach', name: 'Coach', description: 'Shared coach/bus', active: true }
      ];
    
    case 'package':
      return [
        { id: 'standard', name: 'Standard', description: 'Standard package', active: true },
        { id: 'premium', name: 'Premium', description: 'Premium package with extras', active: true },
        { id: 'luxury', name: 'Luxury', description: 'Luxury package with all inclusions', active: true },
        { id: 'custom', name: 'Custom', description: 'Custom package', active: true }
      ];
    
    default:
      return [];
  }
}
