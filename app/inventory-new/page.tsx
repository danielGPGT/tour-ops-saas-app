import { createClient } from "@/utils/supabase/server";
import { InventoryNewPageClient } from "@/components/inventory-new/InventoryNewPageClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function InventoryNewPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; page?: string; type?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const orgId = await getCurrentOrgId();
  const q = (resolvedSearchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1"));
  const type = resolvedSearchParams?.type ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  // Initialize Supabase client
  const supabase = await createClient();

  // Execute queries with Supabase
  let allocations: any[] = [], totalCount = 0, suppliers: any[] = [], products: any[] = [], stats: any, hasDatabaseError = false;
  
  try {
    // Get suppliers for the form
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (suppliersError) throw suppliersError;
    suppliers = suppliersData || [];

    // Get products for the form
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_types(name, icon, color),
        product_variants(
          id,
          name,
          subtype
        )
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (productsError) throw productsError;
    products = productsData || [];

    // Build allocations query with related data
    let allocationsQuery = supabase
      .from('allocation_buckets')
      .select(`
        *,
        suppliers(
          id,
          name,
          status
        ),
        product_variants(
          id,
          name,
          subtype,
          products(
            id,
            name,
            type,
            product_types(
              name,
              icon,
              color
            )
          )
        ),
        time_slots(
          id,
          slot_time,
          slot_name
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      allocationsQuery = allocationsQuery.or(`allocation_type.ilike.%${q}%,notes.ilike.%${q}%`);
    }

    // Add type filter
    if (type) {
      allocationsQuery = allocationsQuery.eq('allocation_type', type);
    }

    // Get total count
    const { count, error: countError } = await allocationsQuery;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get allocations with pagination
    const { data: allocationsData, error: allocationsError } = await allocationsQuery
      .order('date', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (allocationsError) throw allocationsError;
    allocations = allocationsData || [];

    // Get basic stats
    const { count: totalAllocations } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const { count: committedAllocations } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('allocation_type', 'committed');

    const { count: freesaleAllocations } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('allocation_type', 'freesale');

    const { count: onRequestAllocations } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('allocation_type', 'on_request');

    // Calculate total quantity and booked
    const { data: quantityData } = await supabase
      .from('allocation_buckets')
      .select('quantity, booked, held')
      .eq('org_id', orgId);

    const totalQuantity = quantityData?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    const totalBooked = quantityData?.reduce((sum, item) => sum + (item.booked || 0), 0) || 0;
    const totalHeld = quantityData?.reduce((sum, item) => sum + (item.held || 0), 0) || 0;

    stats = {
      totalCount: totalAllocations || 0,
      committedCount: committedAllocations || 0,
      freesaleCount: freesaleAllocations || 0,
      onRequestCount: onRequestAllocations || 0,
      totalQuantity,
      totalBooked,
      totalHeld,
      utilizationRate: totalQuantity > 0 ? Math.round((totalBooked / totalQuantity) * 100) : 0
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    allocations = [];
    totalCount = 0;
    suppliers = [];
    products = [];
    stats = {
      totalCount: 0,
      committedCount: 0,
      freesaleCount: 0,
      onRequestCount: 0,
      totalQuantity: 0,
      totalBooked: 0,
      totalHeld: 0,
      utilizationRate: 0
    };
  }
  
  const totalPages = Math.ceil(totalCount / limit);
  
  // Calculate new allocations this month
  const newThisMonth = allocations.filter(a => {
    const createdDate = new Date(a.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate unique suppliers with allocations
  const uniqueSuppliersWithAllocations = [...new Set(allocations.map(a => a.suppliers?.name).filter(Boolean))].length;

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <InventoryNewPageClient
        allocations={allocations}
        suppliers={suppliers}
        products={products}
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        itemsPerPage={limit}
        searchParams={resolvedSearchParams || {}}
        searchQuery={q}
        hasDatabaseError={hasDatabaseError}
        stats={{
          totalCount,
          committedCount: stats?.committedCount || 0,
          freesaleCount: stats?.freesaleCount || 0,
          onRequestCount: stats?.onRequestCount || 0,
          totalQuantity: stats?.totalQuantity || 0,
          totalBooked: stats?.totalBooked || 0,
          totalHeld: stats?.totalHeld || 0,
          utilizationRate: stats?.utilizationRate || 0,
          newThisMonth,
          uniqueSuppliersWithAllocations
        }}
      />
    </div>
  );
}
