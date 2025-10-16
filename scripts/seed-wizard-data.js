#!/usr/bin/env node

/**
 * Seed Wizard Data Script
 * 
 * Populates the database with initial data for the product wizard
 * Run this after setting up your database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedWizardData() {
  console.log('🌱 Seeding wizard data...\n');

  try {
    // 1. Create or update product types
    console.log('📦 Creating product types...');
    
    const productTypes = [
      {
        code: 'accommodation',
        name: 'Hotel / Accommodation',
        description: 'Hotels, hostels, apartments, vacation rentals',
        icon: '🏨',
        popular: true,
        examples: 'Standard Room, Deluxe Suite, Apartment',
        active: true,
        sort_order: 1
      },
      {
        code: 'activity',
        name: 'Activity / Experience',
        description: 'Tours, excursions, attractions, events',
        icon: '🎭',
        popular: true,
        examples: 'City Tour, Museum Ticket, Cooking Class',
        active: true,
        sort_order: 2
      },
      {
        code: 'transfer',
        name: 'Transfer / Transport',
        description: 'Airport transfers, shuttles, private cars',
        icon: '🚐',
        popular: false,
        examples: 'Airport Shuttle, Private Transfer, Coach',
        active: true,
        sort_order: 3
      },
      {
        code: 'package',
        name: 'Multi-Day Package',
        description: 'Complete tours with accommodation, activities, transfers',
        icon: '📦',
        popular: false,
        badge: 'Advanced',
        examples: '7-Day Italy Tour, Weekend Getaway',
        active: true,
        sort_order: 4
      }
    ];

    for (const productType of productTypes) {
      await prisma.product_types.upsert({
        where: { code: productType.code },
        update: productType,
        create: productType
      });
    }

    // 2. Create product subtypes
    console.log('🏷️ Creating product subtypes...');
    
    const subtypes = [
      // Accommodation subtypes
      { product_type_code: 'accommodation', code: 'standard_room', name: 'Standard Room', description: 'Standard hotel room', active: true, sort_order: 1 },
      { product_type_code: 'accommodation', code: 'deluxe_room', name: 'Deluxe Room', description: 'Deluxe hotel room', active: true, sort_order: 2 },
      { product_type_code: 'accommodation', code: 'suite', name: 'Suite', description: 'Hotel suite', active: true, sort_order: 3 },
      { product_type_code: 'accommodation', code: 'apartment', name: 'Apartment', description: 'Self-contained apartment', active: true, sort_order: 4 },
      
      // Activity subtypes
      { product_type_code: 'activity', code: 'adult', name: 'Adult', description: 'Adult ticket', active: true, sort_order: 1 },
      { product_type_code: 'activity', code: 'child', name: 'Child', description: 'Child ticket', active: true, sort_order: 2 },
      { product_type_code: 'activity', code: 'family', name: 'Family', description: 'Family ticket (2 adults + 2 children)', active: true, sort_order: 3 },
      { product_type_code: 'activity', code: 'group', name: 'Group', description: 'Group ticket (10+ people)', active: true, sort_order: 4 },
      
      // Transfer subtypes
      { product_type_code: 'transfer', code: 'sedan', name: 'Sedan', description: 'Private sedan (up to 4 people)', active: true, sort_order: 1 },
      { product_type_code: 'transfer', code: 'suv', name: 'SUV', description: 'Private SUV (up to 6 people)', active: true, sort_order: 2 },
      { product_type_code: 'transfer', code: 'van', name: 'Van', description: 'Private van (up to 8 people)', active: true, sort_order: 3 },
      { product_type_code: 'transfer', code: 'coach', name: 'Coach', description: 'Shared coach/bus', active: true, sort_order: 4 },
      
      // Package subtypes
      { product_type_code: 'package', code: 'standard', name: 'Standard', description: 'Standard package', active: true, sort_order: 1 },
      { product_type_code: 'package', code: 'premium', name: 'Premium', description: 'Premium package with extras', active: true, sort_order: 2 },
      { product_type_code: 'package', code: 'luxury', name: 'Luxury', description: 'Luxury package with all inclusions', active: true, sort_order: 3 },
      { product_type_code: 'package', code: 'custom', name: 'Custom', description: 'Custom package', active: true, sort_order: 4 }
    ];

    for (const subtype of subtypes) {
      await prisma.product_subtypes.upsert({
        where: { 
          product_type_code_code: {
            product_type_code: subtype.product_type_code,
            code: subtype.code
          }
        },
        update: subtype,
        create: subtype
      });
    }

    // 3. Create sample suppliers
    console.log('🏢 Creating sample suppliers...');
    
    const suppliers = [
      {
        org_id: 1,
        name: 'Hotel ABC Ltd',
        contact_info: {
          email: 'contact@hotelabc.com',
          phone: '+44 20 1234 5678',
          address: '123 Hotel Street, London, UK'
        },
        status: 'active',
        channels: ['direct', 'agent'],
        terms: {}
      },
      {
        org_id: 1,
        name: 'Paris Tours Co',
        contact_info: {
          email: 'info@paristours.com',
          phone: '+33 1 23 45 67 89',
          address: '456 Tour Avenue, Paris, France'
        },
        status: 'active',
        channels: ['direct', 'agent'],
        terms: {}
      },
      {
        org_id: 1,
        name: 'Transport Solutions',
        contact_info: {
          email: 'bookings@transportsolutions.com',
          phone: '+44 20 9876 5432',
          address: '789 Transport Lane, Manchester, UK'
        },
        status: 'active',
        channels: ['direct', 'agent'],
        terms: {}
      }
    ];

    for (const supplier of suppliers) {
      await prisma.suppliers.upsert({
        where: { 
          org_id_name: {
            org_id: supplier.org_id,
            name: supplier.name
          }
        },
        update: supplier,
        create: supplier
      });
    }

    // 4. Create product templates
    console.log('📋 Creating product templates...');
    
    const templates = [
      {
        name: '3-Star Hotel Room',
        description: 'Standard hotel accommodation template',
        product_type: 'accommodation',
        template_data: {
          default_rate_plan: {
            inventory_model: 'committed',
            currency: 'GBP',
            markets: ['all'],
            channels: ['direct', 'agent']
          },
          default_occupancy: [
            { min_occupancy: 1, max_occupancy: 1, pricing_model: 'fixed', base_amount: 130 },
            { min_occupancy: 2, max_occupancy: 4, pricing_model: 'base_plus_pax', base_amount: 150, per_person_amount: 30 }
          ],
          suggested_margin: 0.20,
          default_taxes: [
            { name: 'City Tax', amount: 6, type: 'per_person_per_night' }
          ]
        },
        is_default: true
      },
      {
        name: 'Full-Day Activity',
        description: 'Day-long tour or activity template',
        product_type: 'activity',
        template_data: {
          default_rate_plan: {
            inventory_model: 'committed',
            currency: 'GBP',
            markets: ['all'],
            channels: ['direct', 'agent']
          },
          default_occupancy: [
            { min_occupancy: 1, max_occupancy: 20, pricing_model: 'per_person', base_amount: 50 }
          ],
          suggested_margin: 0.30
        },
        is_default: true
      },
      {
        name: 'Airport Transfer',
        description: 'Point-to-point transportation template',
        product_type: 'transfer',
        template_data: {
          default_rate_plan: {
            inventory_model: 'freesale',
            currency: 'GBP',
            markets: ['all'],
            channels: ['direct', 'agent']
          },
          default_occupancy: [
            { min_occupancy: 1, max_occupancy: 8, pricing_model: 'per_booking', base_amount: 80 }
          ],
          suggested_margin: 0.25
        },
        is_default: true
      }
    ];

    for (const template of templates) {
      await prisma.product_templates.upsert({
        where: { name: template.name },
        update: template,
        create: template
      });
    }

    console.log('\n✅ Wizard data seeded successfully!');
    console.log('\n🎯 Your wizard now has:');
    console.log('   • 4 product types (accommodation, activity, transfer, package)');
    console.log('   • 16 product subtypes (4 per type)');
    console.log('   • 3 sample suppliers');
    console.log('   • 3 product templates');
    console.log('\n🚀 You can now use the product wizard with real data!');
    console.log('   Visit: http://localhost:3000/products/wizard');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedWizardData();
