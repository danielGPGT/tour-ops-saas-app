import { createClient } from "@/utils/supabase/server";
import { ProductsPageClient } from "@/components/products/ProductsPageClient";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";

export default async function ProductsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; page?: string; type?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const orgId = 1; // TODO: from session
  const q = (resolvedSearchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1"));
  const type = resolvedSearchParams?.type ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  // Initialize Supabase client
  const supabase = await createClient();

  // Execute queries with Supabase
  let products: unknown[] = [], totalCount = 0, stats: unknown, hasDatabaseError = false;
  let productTypesData: unknown[] = [];
  
  try {
    // Get available product types for filtering
    const { data: productTypesDataResult, error: productTypesError } = await supabase
      .from('product_types')
      .select('*')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (productTypesError) throw productTypesError;
    productTypesData = productTypesDataResult || [];


    // Build products query with variant counts and product types
    let productsQuery = supabase
      .from('products')
      .select(`
        *,
        product_types(
          id,
          name,
          description,
          icon,
          color,
          is_default
        ),
        product_variants(
          id,
          name,
          subtype,
          status
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      productsQuery = productsQuery.or(`name.ilike.%${q}%,type.ilike.%${q}%`);
    }

    // Add type filter
    if (type) {
      productsQuery = productsQuery.eq('type', type);
    }

    // Get total count
    const { count, error: countError } = await productsQuery;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get paginated results
    const { data: productsData, error: productsError } = await productsQuery
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (productsError) throw productsError;
    products = productsData || [];

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('products')
      .select('type, status')
      .eq('org_id', orgId);

    if (statsError) throw statsError;

    // Calculate stats
    const totalProducts = productsData?.length || 0;
    const activeProducts = productsData?.filter(p => p.status === 'active').length || 0;
    const typeCounts = (statsData || []).reduce((acc: any, product: any) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {});

    stats = {
      totalCount: totalProducts,
      activeCount: activeProducts,
      typeCounts
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    
    // Create fallback data
    products = [];
    totalCount = 0;
    productTypesData = [];
    // productSubtypesData = [];
    stats = {
      totalCount: 0,
      activeCount: 0,
      typeCounts: {}
    };
  }

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <ProductsPageClient
        products={products}
        totalCount={totalCount}
        stats={stats}
        productTypes={productTypesData}
        searchQuery={q}
        currentPage={page}
        currentType={type}
        itemsPerPage={limit}
      />
    </div>
  );
}
