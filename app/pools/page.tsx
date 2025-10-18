import { createClient } from '@/utils/supabase/server';
import { PoolManagementClient } from '@/components/pools/PoolManagementClient';
import { getCurrentOrgId } from '@/lib/hooks/use-current-org';

export default async function PoolsPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();
  
  // Fetch pools with related data
  const { data: pools, error: poolsError } = await supabase
    .from('inventory_pools')
    .select(`
      *,
      suppliers(
        id,
        name
      ),
      pool_variants(
        id,
        product_variant_id,
        capacity_weight,
        cost_per_unit,
        sell_price_per_unit,
        priority,
        auto_allocate,
        status,
        product_variants(
          id,
          name,
          subtype
        )
      )
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (poolsError) {
    console.error('Error fetching pools:', poolsError);
  }

  // Fetch suppliers for the wizard
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (suppliersError) {
    console.error('Error fetching suppliers:', suppliersError);
  }

  // Fetch product variants for the wizard
  const { data: productVariants, error: variantsError } = await supabase
    .from('product_variants')
    .select('id, name, subtype')
    .eq('org_id', orgId)
    .order('name', { ascending: true });

  if (variantsError) {
    console.error('Error fetching product variants:', variantsError);
  }

  // Get latest utilization data for each pool
  const poolIds = pools?.map(p => p.id) || [];
  let utilizationData: any[] = [];
  
  if (poolIds.length > 0) {
    const { data: utilization, error: utilizationError } = await supabase
      .from('pool_utilization')
      .select('*')
      .in('inventory_pool_id', poolIds)
      .eq('org_id', orgId)
      .order('snapshot_date', { ascending: false });

    if (utilizationError) {
      console.error('Error fetching utilization:', utilizationError);
    } else {
      utilizationData = utilization || [];
    }
  }

  // Merge utilization data with pools
  const poolsWithUtilization = pools?.map(pool => {
    const latestUtilization = utilizationData
      .filter(u => u.inventory_pool_id === pool.id)
      .sort((a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime())[0];
    
    return {
      ...pool,
      utilization: latestUtilization
    };
  }) || [];

  return (
    <div className="container mx-auto py-6">
      <PoolManagementClient 
        initialPools={poolsWithUtilization}
        suppliers={suppliers || []}
        productVariants={productVariants || []}
      />
    </div>
  );
}
