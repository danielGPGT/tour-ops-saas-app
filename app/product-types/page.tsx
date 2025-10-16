import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { ProductTypesPageClient } from "@/components/product-types/ProductTypesPageClient";

export default async function ProductTypesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const orgId = 1; // TODO: from session
  const supabase = await createClient();

  // Execute queries with Supabase
  let productTypes: unknown[] = [], productSubtypes: unknown[] = [], totalCount = 0, stats: unknown, hasDatabaseError = false;
  
  try {
    // Get product types with subtype counts
    let productTypesQuery = supabase
      .from('product_types')
      .select(`
        *,
        product_subtypes(
          id,
          name,
          description,
          icon,
          is_default,
          created_at
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Add search conditions
    if (q) {
      productTypesQuery = productTypesQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Get paginated results
    const { data: productTypesData, error: productTypesError, count } = await productTypesQuery
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (productTypesError) throw productTypesError;
    productTypes = productTypesData || [];
    totalCount = count || 0;

    // Get all product subtypes for the modal
    const { data: productSubtypesData, error: productSubtypesError } = await supabase
      .from('product_subtypes')
      .select(`
        *,
        product_types(
          id,
          name
        )
      `)
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (productSubtypesError) throw productSubtypesError;
    productSubtypes = productSubtypesData || [];

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('product_types')
      .select('is_default')
      .eq('org_id', orgId);

    if (statsError) throw statsError;

    // Calculate stats
    const totalTypes = productTypesData?.length || 0;
    const defaultTypes = (statsData || []).filter(pt => pt.is_default).length;
    const customTypes = totalTypes - defaultTypes;

    stats = {
      totalCount: totalTypes,
      defaultCount: defaultTypes,
      customCount: customTypes
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    
    // Create fallback data
    productTypes = [];
    productSubtypes = [];
    totalCount = 0;
    stats = {
      totalCount: 0,
      defaultCount: 0,
      customCount: 0
    };
  }

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasDatabaseError={hasDatabaseError}
        />
      )}
      
      <Suspense fallback={<div>Loading...</div>}>
        <ProductTypesPageClient
          productTypes={productTypes}
          productSubtypes={productSubtypes}
          totalCount={totalCount}
          stats={stats}
          searchQuery={q}
          currentPage={page}
          itemsPerPage={limit}
        />
      </Suspense>
    </div>
  );
}
