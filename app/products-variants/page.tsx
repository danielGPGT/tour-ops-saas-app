import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Package, Globe, CheckCircle2, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { ProductsVariantsPageClient } from "@/components/products-variants/ProductsVariantsPageClient";
import { ProductsVariantsSearch } from "@/components/products-variants/ProductsVariantsSearch";
import { ProductsVariantsFilters } from "@/components/products-variants/ProductsVariantsFilters";
import { ClearSearchButton } from "@/components/products-variants/ClearSearchButton";
import { ProductsVariantsPageWithWizard } from "@/components/products-variants/ProductsVariantsPageWithWizard";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";

export default async function ProductsVariantsPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ q?: string; page?: string; type?: string; collection?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const orgId = 1; // TODO: from session
  const q = (resolvedSearchParams?.q ?? "").trim();
  const page = Math.max(1, parseInt(resolvedSearchParams?.page ?? "1"));
  const type = resolvedSearchParams?.type ?? "";
  const collection = resolvedSearchParams?.collection ?? "";
  const limit = 20;
  const offset = (page - 1) * limit;

  // Initialize Supabase client
  const supabase = await createClient();

  // Execute queries with Supabase
  let variants: any[] = [], totalCount = 0, activeCount = 0, hasDatabaseError = false;
  let productTypesData: any[] = [];
  let productCollectionsData: any[] = [];
  
  try {
    // Get available product types for filtering
    const { data: productTypesDataResult, error: productTypesError } = await supabase
      .from('product_types')
      .select('*')
      .eq('org_id', orgId);

    if (productTypesError) {
      console.error('Error fetching product types:', productTypesError);
      hasDatabaseError = true;
    } else {
      productTypesData = productTypesDataResult || [];
    }

    // Get available product collections for filtering
    const { data: productCollectionsDataResult, error: productCollectionsError } = await supabase
      .from('products')
      .select('id, name, type')
      .eq('org_id', orgId)
      .eq('status', 'active');

    if (productCollectionsError) {
      console.error('Error fetching product collections:', productCollectionsError);
      hasDatabaseError = true;
    } else {
      productCollectionsData = productCollectionsDataResult || [];
    }

    // Build query for variants with filters
    let query = supabase
      .from('product_variants')
      .select(`
        id,
        name,
        status,
        created_at,
        updated_at,
        org_id,
        product_id,
        attributes,
        images,
        products!inner(id, name, type, status),
        rate_plans(
          id,
          preferred,
          rate_doc,
          channels,
          markets,
          valid_from,
          valid_to
        )
      `, { count: 'exact' })
      .eq('org_id', orgId)
      .eq('products.status', 'active');

    // Apply search filter - search only on variant name
    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    // Apply type filter
    if (type && type !== 'all') {
      query = query.eq('products.type', type);
    }

    // Apply collection filter
    if (collection && collection !== 'all') {
      query = query.eq('products.id', collection);
    }

    // Get total count
    const { count, error: countError } = await query;
    if (countError) throw countError;
    totalCount = count || 0;

    // Get variants with pagination
    const { data: variantsData, error: variantsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (variantsError) throw variantsError;
    variants = variantsData || [];

    // Get active count
    let activeQuery = supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    // Apply search filter to active count query
    if (q) {
      activeQuery = activeQuery.ilike('name', `%${q}%`);
    }

    const { count: activeCountResult, error: activeError } = await activeQuery;
    if (activeError) throw activeError;
    activeCount = activeCountResult || 0;

  } catch (error) {
    console.error("Database connection error:", error);
    hasDatabaseError = true;
    variants = [];
    totalCount = 0;
    activeCount = 0;
    
    // If it's a search error, try without search
    if (q) {
      try {
        console.log("Retrying without search query...");
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('product_variants')
          .select(`
            id,
            name,
            status,
            created_at,
            updated_at,
            org_id,
            product_id,
            attributes,
            products!inner(id, name, type, status),
            rate_plans(
              id,
              preferred,
              rate_doc,
              channels,
              markets,
              valid_from,
              valid_to
            )
          `, { count: 'exact' })
          .eq('org_id', orgId)
          .eq('products.status', 'active')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
          
        if (!fallbackError) {
          variants = fallbackData || [];
          totalCount = variants.length;
          hasDatabaseError = false;
        }
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
      }
    }
  }

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {hasDatabaseError && (
          <DatabaseStatus 
            hasError={hasDatabaseError}
          />
        )}
        
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Products</h1>
            <p className="text-sm text-muted-foreground">
              {totalCount.toLocaleString()} total • {activeCount.toLocaleString()} active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ProductsVariantsSearch />
            <ProductsVariantsPageWithWizard />
          </div>
        </div>

        {/* Filters */}
        <ProductsVariantsFilters
          productTypes={productTypesData}
          productCollections={productCollectionsData}
          selectedType={type}
          selectedCollection={collection}
          searchQuery={q}
        />

        {/* Information Card */}
        {!q && (
          <Card className="border-primary bg-primary/10 dark:border-primary dark:bg-primary/10">
            <CardContent className="">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Package className="h-5 w-5 text-primary dark:text-primary mt-0.5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-primary dark:text-primary">Manage Your Product Catalog</h3>
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
                    Products are the sellable items in your inventory - hotel rooms, tour tickets, activities, transfers, 
                    and more. Here you can add, edit, and manage all your products with their pricing, availability, 
                    and distribution channels.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Set pricing and rates
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3 text-primary" />
                      Manage availability
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      Track performance
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results Info */}
        {q && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {hasDatabaseError ? (
                "Database connection error - search unavailable"
              ) : totalCount === 0 ? (
                <>No products found for "<span className="font-medium">{q}</span>"</>
              ) : (
                <>
                  {totalCount} product{totalCount !== 1 ? 's' : ''} found for "<span className="font-medium">{q}</span>"
                </>
              )}
            </p>
            {totalCount > 0 && !hasDatabaseError && <ClearSearchButton />}
          </div>
        )}

        {/* Products Table with Bulk Actions */}
        <ProductsVariantsPageClient 
          variants={variants}
        >
          {/* Compact Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, totalCount).toLocaleString()} of {totalCount.toLocaleString()} products
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  asChild={page > 1}
                >
                  {page > 1 ? (
                    <a href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : ''}${collection && collection !== 'all' ? `&collection=${encodeURIComponent(collection)}` : ''}`}>
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </a>
                  ) : (
                    <>
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Previous
                    </>
                  )}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  asChild={page < totalPages}
                >
                  {page < totalPages ? (
                    <a href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${type && type !== 'all' ? `&type=${encodeURIComponent(type)}` : ''}${collection && collection !== 'all' ? `&collection=${encodeURIComponent(collection)}` : ''}`}>
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </a>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </ProductsVariantsPageClient>
      </div>
    </TooltipProvider>
  );
}
