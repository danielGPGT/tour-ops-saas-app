import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { ProductSubtypesPageClient } from "@/components/product-types/ProductSubtypesPageClient";

export default async function ProductSubtypesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const typeId = typeof params.type === "string" ? parseInt(params.type) : null;
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;
  const limit = 50;
  const offset = (page - 1) * limit;

  const orgId = 1; // TODO: from session
  const supabase = await createClient();

  // Execute queries with Supabase
  let productSubtypes: unknown[] = [], productTypes: unknown[] = [], selectedProductType: unknown = null, totalCount = 0, stats: unknown, hasDatabaseError = false;
  
  try {
    // Get product subtypes with pagination
    let subtypesQuery = supabase
      .from('product_subtypes')
      .select(`
        *,
        product_types(
          id,
          name,
          icon,
          color
        )
      `, { count: 'exact' })
      .eq('org_id', orgId);

    // Filter by product type if specified
    if (typeId) {
      subtypesQuery = subtypesQuery.eq('product_type_id', typeId);
    }

    // Add search conditions
    if (q) {
      subtypesQuery = subtypesQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Get paginated results
    const { data: subtypesData, error: subtypesError, count } = await subtypesQuery
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (subtypesError) throw subtypesError;
    productSubtypes = subtypesData || [];
    totalCount = count || 0;

    // Get all product types for the form
    const { data: productTypesData, error: productTypesError } = await supabase
      .from('product_types')
      .select('id, name, description, icon, color')
      .eq('org_id', orgId)
      .order('name', { ascending: true });

    if (productTypesError) throw productTypesError;
    productTypes = productTypesData || [];

    // Get selected product type if typeId is provided
    if (typeId) {
      const { data: selectedTypeData, error: selectedTypeError } = await supabase
        .from('product_types')
        .select('id, name, description, icon, color')
        .eq('id', typeId)
        .eq('org_id', orgId)
        .single();

      if (selectedTypeError) throw selectedTypeError;
      selectedProductType = selectedTypeData;
    }

    // Get stats
    const { data: statsData, error: statsError } = await supabase
      .from('product_subtypes')
      .select('is_default')
      .eq('org_id', orgId);

    if (statsError) throw statsError;

    // Calculate stats
    const totalSubtypes = productSubtypes.length;
    const defaultSubtypes = (statsData || []).filter(ps => ps.is_default).length;
    const customSubtypes = totalSubtypes - defaultSubtypes;

    stats = {
      totalCount: totalSubtypes,
      defaultCount: defaultSubtypes,
      customCount: customSubtypes
    };

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    
    // Create fallback data
    productSubtypes = [];
    productTypes = [];
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
        <ProductSubtypesPageClient
          productSubtypes={productSubtypes}
          productTypes={productTypes}
          selectedProductType={selectedProductType}
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
