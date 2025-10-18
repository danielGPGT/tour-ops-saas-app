import { createClient } from "@/utils/supabase/server";
import { RatesNewPageClient } from "@/components/rates-new/RatesNewPageClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function RatesNewPage({ 
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
  let ratePlans: any[] = [], totalCount = 0, suppliers: any[] = [], products: any[] = [], stats: any, hasDatabaseError = false;
  
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
        product_types(name, icon, color)
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (productsError) throw productsError;
    products = productsData || [];

    // Build rate plans query with related data
    let ratePlansQuery = supabase
      .from('rate_plans')
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
        contract_versions(
          id,
          valid_from,
          valid_to
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      ratePlansQuery = ratePlansQuery.or(`currency.ilike.%${q}%,inventory_model.ilike.%${q}%`);
    }

    // Add type filter
    if (type) {
      ratePlansQuery = ratePlansQuery.eq('inventory_model', type);
    }

    // Get total count
    const { count, error: countError } = await ratePlansQuery;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get rate plans with pagination
    const { data: ratePlansData, error: ratePlansError } = await ratePlansQuery
      .order('preferred', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (ratePlansError) throw ratePlansError;
    ratePlans = ratePlansData || [];

    // Get basic stats
    const { count: totalRatePlans } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const { count: committedRatePlans } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('inventory_model', 'committed');

    const { count: freesaleRatePlans } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('inventory_model', 'freesale');

    const { count: onRequestRatePlans } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('inventory_model', 'on_request');

    const { count: preferredRatePlans } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('preferred', true);

    stats = {
      totalCount: totalRatePlans || 0,
      committedCount: committedRatePlans || 0,
      freesaleCount: freesaleRatePlans || 0,
      onRequestCount: onRequestRatePlans || 0,
      preferredCount: preferredRatePlans || 0
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    ratePlans = [];
    totalCount = 0;
    suppliers = [];
    products = [];
    stats = {
      totalCount: 0,
      committedCount: 0,
      freesaleCount: 0,
      onRequestCount: 0,
      preferredCount: 0
    };
  }
  
  const totalPages = Math.ceil(totalCount / limit);
  
  // Calculate new rate plans this month
  const newThisMonth = ratePlans.filter(r => {
    const createdDate = new Date(r.created_at);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  // Calculate unique suppliers with rate plans
  const uniqueSuppliersWithRates = [...new Set(ratePlans.map(r => r.suppliers?.name).filter(Boolean))].length;

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <RatesNewPageClient
        ratePlans={ratePlans}
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
          preferredCount: stats?.preferredCount || 0,
          newThisMonth,
          uniqueSuppliersWithRates
        }}
      />
    </div>
  );
}
