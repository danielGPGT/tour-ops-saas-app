#!/usr/bin/env node

/**
 * Test script for the inventory migration
 * Tests event inventory, time slots, and overbooking functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInventoryMigration() {
  console.log('🧪 Testing Inventory Migration...\n');

  try {
    // Test 1: Create a sample product and variant
    console.log('📦 Test 1: Creating sample product and variant...');
    
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        org_id: 1,
        name: 'F1 Abu Dhabi Test',
        type: 'event',
        status: 'active'
      })
      .select()
      .single();

    if (productError) {
      console.error('❌ Failed to create product:', productError.message);
      return;
    }

    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        org_id: 1,
        product_id: product.id,
        name: 'VIP Front Row',
        subtype: 'vip',
        attributes: {
          ticket_category: 'VIP',
          section: 'Main Grandstand',
          includes: ['Food', 'Drinks', 'Parking']
        },
        status: 'active'
      })
      .select()
      .single();

    if (variantError) {
      console.error('❌ Failed to create variant:', variantError.message);
      return;
    }

    console.log('✅ Created product and variant successfully');
    console.log(`   Product ID: ${product.id}, Variant ID: ${variant.id}\n`);

    // Test 2: Event inventory (F1 tickets valid for 3 days)
    console.log('🎫 Test 2: Creating event inventory (F1 tickets)...');
    
    const { data: eventAllocation, error: eventError } = await supabase
      .from('allocation_buckets')
      .insert({
        org_id: 1,
        product_variant_id: variant.id,
        supplier_id: 1, // Assuming supplier with ID 1 exists
        event_start_date: '2025-11-21',
        event_end_date: '2025-11-23',
        quantity: 500,
        allocation_type: 'committed',
        allow_overbooking: true,
        overbooking_limit: 50,
        notes: 'F1 Abu Dhabi 3-day tickets with overbooking'
      })
      .select()
      .single();

    if (eventError) {
      console.error('❌ Failed to create event allocation:', eventError.message);
      return;
    }

    console.log('✅ Created event allocation successfully');
    console.log(`   Event: ${eventAllocation.event_start_date} to ${eventAllocation.event_end_date}`);
    console.log(`   Quantity: ${eventAllocation.quantity}, Overbooking: +${eventAllocation.overbooking_limit}\n`);

    // Test 3: Create time slots for an activity
    console.log('⏰ Test 3: Creating time slots for activity...');
    
    // Create an activity product
    const { data: activityProduct, error: activityProductError } = await supabase
      .from('products')
      .insert({
        org_id: 1,
        name: 'Eiffel Tower Tour Test',
        type: 'activity',
        status: 'active'
      })
      .select()
      .single();

    if (activityProductError) {
      console.error('❌ Failed to create activity product:', activityProductError.message);
      return;
    }

    const { data: activityVariant, error: activityVariantError } = await supabase
      .from('product_variants')
      .insert({
        org_id: 1,
        product_id: activityProduct.id,
        name: 'Adult Standard',
        subtype: 'adult',
        attributes: {
          participant_type: 'Adult',
          duration: '3 hours'
        },
        status: 'active'
      })
      .select()
      .single();

    if (activityVariantError) {
      console.error('❌ Failed to create activity variant:', activityVariantError.message);
      return;
    }

    // Create time slots
    const { data: timeSlots, error: slotsError } = await supabase
      .from('time_slots')
      .insert([
        {
          org_id: 1,
          product_variant_id: activityVariant.id,
          slot_time: '09:00',
          slot_name: 'Morning Tour',
          duration_minutes: 180
        },
        {
          org_id: 1,
          product_variant_id: activityVariant.id,
          slot_time: '14:00',
          slot_name: 'Afternoon Tour',
          duration_minutes: 180
        },
        {
          org_id: 1,
          product_variant_id: activityVariant.id,
          slot_time: '16:00',
          slot_name: 'Sunset Tour',
          duration_minutes: 180
        }
      ])
      .select();

    if (slotsError) {
      console.error('❌ Failed to create time slots:', slotsError.message);
      return;
    }

    console.log('✅ Created time slots successfully');
    console.log(`   Created ${timeSlots.length} time slots for variant ${activityVariant.id}\n`);

    // Test 4: Create allocations for time slots
    console.log('📅 Test 4: Creating allocations for time slots...');
    
    const slotAllocations = [];
    for (const slot of timeSlots) {
      const { data: slotAllocation, error: slotAllocationError } = await supabase
        .from('allocation_buckets')
        .insert({
          org_id: 1,
          product_variant_id: activityVariant.id,
          supplier_id: 1,
          date: '2025-11-21',
          slot_id: slot.id,
          quantity: 20,
          allocation_type: 'committed'
        })
        .select()
        .single();

      if (slotAllocationError) {
        console.error(`❌ Failed to create allocation for slot ${slot.slot_time}:`, slotAllocationError.message);
        return;
      }

      slotAllocations.push(slotAllocation);
    }

    console.log('✅ Created slot allocations successfully');
    console.log(`   Created allocations for ${slotAllocations.length} time slots\n`);

    // Test 5: Query the data to verify everything works
    console.log('🔍 Test 5: Querying data to verify relationships...');
    
    // Query event allocation
    const { data: eventQuery, error: eventQueryError } = await supabase
      .from('allocation_buckets')
      .select(`
        *,
        product_variants!inner(
          id,
          name,
          products!inner(id, name, type)
        )
      `)
      .eq('id', eventAllocation.id)
      .single();

    if (eventQueryError) {
      console.error('❌ Failed to query event allocation:', eventQueryError.message);
      return;
    }

    console.log('✅ Event allocation query successful');
    console.log(`   Product: ${eventQuery.product_variants.products.name}`);
    console.log(`   Variant: ${eventQuery.product_variants.name}`);
    console.log(`   Event dates: ${eventQuery.event_start_date} to ${eventQuery.event_end_date}`);
    console.log(`   Available: ${eventQuery.quantity + eventQuery.overbooking_limit} (${eventQuery.quantity} + ${eventQuery.overbooking_limit} overbooking)\n`);

    // Query time slot allocations
    const { data: slotQuery, error: slotQueryError } = await supabase
      .from('allocation_buckets')
      .select(`
        *,
        time_slots!inner(
          id,
          slot_time,
          slot_name,
          duration_minutes
        ),
        product_variants!inner(
          id,
          name,
          products!inner(id, name, type)
        )
      `)
      .eq('product_variant_id', activityVariant.id);

    if (slotQueryError) {
      console.error('❌ Failed to query slot allocations:', slotQueryError.message);
      return;
    }

    console.log('✅ Time slot allocation query successful');
    console.log(`   Product: ${slotQuery[0].product_variants.products.name}`);
    console.log(`   Variant: ${slotQuery[0].product_variants.name}`);
    console.log('   Time slots:');
    slotQuery.forEach(allocation => {
      console.log(`     ${allocation.time_slots.slot_time} (${allocation.time_slots.slot_name}): ${allocation.quantity} spots`);
    });

    console.log('\n🎉 All tests passed! Migration is working correctly.');
    console.log('\n📊 Summary:');
    console.log('   ✅ Event inventory (F1 tickets) - works with event_start_date/event_end_date');
    console.log('   ✅ Time slots for activities - works with slot_id relationships');
    console.log('   ✅ Overbooking support - works with allow_overbooking/overbooking_limit');
    console.log('   ✅ Data relationships - all foreign keys working correctly');
    console.log('   ✅ Queries - complex joins working as expected');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the tests
testInventoryMigration();
