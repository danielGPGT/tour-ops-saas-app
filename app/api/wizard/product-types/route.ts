import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    let productTypes = [];

    // Try to fetch product types from database using Supabase
    try {
      const supabase = await createClient();
      
      const { data: productTypesData, error } = await supabase
        .from('product_types')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.log('Product types table not found or error:', error);
      } else {
        productTypes = productTypesData || [];
      }
    } catch (dbError) {
      console.log('Database connection error:', dbError);
    }

    // If no product types exist in DB, return default types
    if (productTypes.length === 0) {
      const defaultTypes = [
        {
          id: 'accommodation',
          title: 'Hotel / Accommodation',
          description: 'Hotels, hostels, apartments, vacation rentals',
          icon: 'Building2',
          popular: true,
          examples: 'Standard Room, Deluxe Suite, Apartment',
          active: true,
          sort_order: 1
        },
        {
          id: 'activity',
          title: 'Activity / Experience', 
          description: 'Tours, excursions, attractions, events',
          icon: 'Ticket',
          popular: true,
          examples: 'City Tour, Museum Ticket, Cooking Class',
          active: true,
          sort_order: 2
        },
        {
          id: 'transfer',
          title: 'Transfer / Transport',
          description: 'Airport transfers, shuttles, private cars',
          icon: 'Car',
          popular: false,
          examples: 'Airport Shuttle, Private Transfer, Coach',
          active: true,
          sort_order: 3
        },
        {
          id: 'package',
          title: 'Multi-Day Package',
          description: 'Complete tours with accommodation, activities, transfers',
          icon: 'Package',
          popular: false,
          badge: 'Advanced',
          examples: '7-Day Italy Tour, Weekend Getaway',
          active: true,
          sort_order: 4
        }
      ];

      return NextResponse.json({
        success: true,
        data: defaultTypes
      });
    }

    // Transform database records to wizard format
    const wizardTypes = productTypes.map(type => ({
      id: type.code,
      title: type.name,
      description: type.description || '',
      icon: type.icon || '📦',
      popular: type.popular || false,
      badge: type.badge || null,
      examples: type.examples || '',
      active: type.active
    }));

    return NextResponse.json({
      success: true,
      data: wizardTypes
    });

  } catch (error) {
    console.error('Error fetching product types:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product types' 
      },
      { status: 500 }
    );
  }
}
