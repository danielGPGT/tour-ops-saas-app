const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('Checking F1 scenario data...\n');

  try {
    // Check suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', 100);

    if (suppliersError) throw suppliersError;
    console.log('Suppliers:', suppliers?.length || 0);
    if (suppliers) {
      suppliers.forEach(s => console.log(`  - ${s.name} (${s.id})`));
    }

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', 100);

    if (productsError) throw productsError;
    console.log('\nProducts:', products?.length || 0);
    if (products) {
      products.forEach(p => console.log(`  - ${p.name} (${p.type})`));
    }

    // Check product variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .eq('org_id', 100);

    if (variantsError) throw variantsError;
    console.log('\nProduct Variants:', variants?.length || 0);
    if (variants) {
      variants.forEach(v => console.log(`  - ${v.name} (${v.subtype})`));
    }

    // Check allocations
    const { data: allocations, error: allocationsError } = await supabase
      .from('allocation_buckets')
      .select('*')
      .eq('org_id', 100);

    if (allocationsError) throw allocationsError;
    console.log('\nAllocations:', allocations?.length || 0);
    if (allocations) {
      allocations.forEach(a => {
        const dateInfo = a.date ? `Date: ${a.date}` : `Event: ${a.event_start_date} to ${a.event_end_date}`;
        console.log(`  - ${a.product_variant_id} - ${dateInfo} - Qty: ${a.quantity}`);
      });
    }

    // Check packages
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select('*')
      .eq('org_id', 100);

    if (packagesError) throw packagesError;
    console.log('\nPackages:', packages?.length || 0);
    if (packages) {
      packages.forEach(p => console.log(`  - ${p.name}`));
    }

    // Check rate plans
    const { data: ratePlans, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select('*')
      .eq('org_id', 100);

    if (ratePlansError) throw ratePlansError;
    console.log('\nRate Plans:', ratePlans?.length || 0);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
