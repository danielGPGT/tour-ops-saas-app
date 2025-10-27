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
          title: 'Accommodation',
          description: 'Hotels, apartments, villas, and lodging. Complex pricing with occupancy variations, contracted allocations, and inventory management.',
          icon: 'bed',
          popular: true,
          examples: 'Standard Room, Deluxe Suite, Villa',
          active: true,
          sort_order: 1
        },
        {
          id: 'event',
          title: 'Event Tickets',
          description: 'Race tickets, grandstand seats, paddock passes. Simple per-unit pricing with batch inventory allocations.',
          icon: 'ticket',
          popular: true,
          examples: 'Grandstand K, Paddock Club, VIP',
          active: true,
          sort_order: 2
        },
        {
          id: 'transfer',
          title: 'Transfers',
          description: 'Airport transfers, circuit shuttles, ground transport. On-request products with no inventory, priced per booking or per vehicle.',
          icon: 'car',
          popular: true,
          examples: 'Airport Transfer, Private Car, Shared Shuttle',
          active: true,
          sort_order: 3
        },
        {
          id: 'transport',
          title: 'Transport',
          description: 'Flights, trains, ferries. Dynamic products with generic catalog entries and specific details in transport_segments. Quoted per customer, no inventory.',
          icon: 'plane',
          popular: false,
          examples: 'Flight Package, Train Ticket, Ferry',
          active: true,
          sort_order: 4
        },
        {
          id: 'experience',
          title: 'Experiences',
          description: 'Tours, activities, yacht charters, helicopter rides. On-request products, typically priced per booking or per person, no inventory.',
          icon: 'compass',
          popular: true,
          examples: 'Yacht Tour, Helicopter Flight, Wine Tasting',
          active: true,
          sort_order: 5
        },
        {
          id: 'extra',
          title: 'Extras',
          description: 'Supplementary items and add-ons like lounge access, insurance, parking, merchandise. Simple products, typically on-request, high margins.',
          icon: 'package',
          popular: false,
          examples: 'Lounge Access, Insurance, Parking',
          active: true,
          sort_order: 6
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
