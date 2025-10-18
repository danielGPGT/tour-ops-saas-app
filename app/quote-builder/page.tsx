import { createClient } from "@/utils/supabase/server";
import { QuoteBuilderClient } from "@/components/quote-builder/QuoteBuilderClient";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function QuoteBuilderPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();

  // Fetch all data needed for quote building
  let products: any[] = [];
  let productVariants: any[] = [];
  let ratePlans: any[] = [];
  let rateOccupancies: any[] = [];
  let rateSeasons: any[] = [];
  let allocations: any[] = [];
  let packages: any[] = [];
  let suppliers: any[] = [];
  let hasError = false;
  let errorMessage = "";

  try {
    // Get products with types
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_types(name, icon, color)
      `)
      .eq('org_id', orgId)
      .order('name');

    if (productsError) throw productsError;
    products = productsData || [];

    // Get product variants with products
    const { data: productVariantsData, error: productVariantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, type, product_types(name, icon, color))
      `)
      .eq('org_id', orgId)
      .order('name');

    if (productVariantsError) throw productVariantsError;
    productVariants = productVariantsData || [];

    // Get rate plans with suppliers and variants
    const { data: ratePlansData, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select(`
        *,
        suppliers(name),
        product_variants(name, products(name, type)),
        contract_versions(valid_from, valid_to)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (ratePlansError) throw ratePlansError;
    ratePlans = ratePlansData || [];

    // Get rate occupancies
    const { data: rateOccupanciesData, error: rateOccupanciesError } = await supabase
      .from('rate_occupancies')
      .select(`
        *,
        rate_plans(
          product_variants(name, products(name)),
          suppliers(name)
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (rateOccupanciesError) throw rateOccupanciesError;
    rateOccupancies = rateOccupanciesData || [];

    // Get rate seasons
    const { data: rateSeasonsData, error: rateSeasonsError } = await supabase
      .from('rate_seasons')
      .select(`
        *,
        rate_plans(
          product_variants(name, products(name)),
          suppliers(name)
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (rateSeasonsError) throw rateSeasonsError;
    rateSeasons = rateSeasonsData || [];

    // Get allocations
    const { data: allocationsData, error: allocationsError } = await supabase
      .from('allocation_buckets')
      .select(`
        *,
        suppliers(name),
        product_variants(name, products(name, type))
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (allocationsError) throw allocationsError;
    allocations = allocationsData || [];

    // Get packages
    const { data: packagesData, error: packagesError } = await supabase
      .from('packages')
      .select(`
        *,
        package_components(
          *,
          product_variants(name, products(name))
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (packagesError) throw packagesError;
    packages = packagesData || [];

    // Get suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .order('name');

    if (suppliersError) throw suppliersError;
    suppliers = suppliersData || [];

  } catch (error) {
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Quote Builder Error:', error);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">F1 Grand Prix Quote Builder</h1>
        <p className="text-muted-foreground">
          Build custom F1 Grand Prix packages with detailed pricing and availability
        </p>
      </div>

      {hasError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-destructive">Error Loading Data</h3>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
        </div>
      )}

      {!hasError && (
        <QuoteBuilderClient
          products={products}
          productVariants={productVariants}
          ratePlans={ratePlans}
          rateOccupancies={rateOccupancies}
          rateSeasons={rateSeasons}
          allocations={allocations}
          packages={packages}
          suppliers={suppliers}
        />
      )}
    </div>
  );
}
