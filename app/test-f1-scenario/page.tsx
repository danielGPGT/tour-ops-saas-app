import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Ticket, Car, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export default async function TestF1ScenarioPage() {
  const supabase = await createClient();
  const orgId = await getCurrentOrgId();

  // Test data retrieval for F1 scenario
  let suppliers: any[] = [];
  let contracts: any[] = [];
  let contractVersions: any[] = [];
  let products: any[] = [];
  let productVariants: any[] = [];
  let ratePlans: any[] = [];
  let rateOccupancies: any[] = [];
  let rateSeasons: any[] = [];
  let allocations: any[] = [];
  let packages: any[] = [];
  let packageComponents: any[] = [];
  let inventoryPools: any[] = [];
  let hasError = false;
  let errorMessage = "";

  try {
    // Get suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', orgId)
      .order('name');

    if (suppliersError) throw suppliersError;
    suppliers = suppliersData || [];

    // Get contracts
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (contractsError) throw contractsError;
    contracts = contractsData || [];

    // Get contract versions
    const { data: contractVersionsData, error: contractVersionsError } = await supabase
      .from('contract_versions')
      .select(`
        *,
        contracts(reference, suppliers(name))
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (contractVersionsError) throw contractVersionsError;
    contractVersions = contractVersionsData || [];

    // Get products
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

    // Get product variants
    const { data: productVariantsData, error: productVariantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, type),
        product_subtypes(name)
      `)
      .eq('org_id', orgId)
      .order('name');

    if (productVariantsError) throw productVariantsError;
    productVariants = productVariantsData || [];

    // Get rate plans
    const { data: ratePlansData, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select(`
        *,
        suppliers(name),
        product_variants(name),
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
          product_variants(name),
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
          product_variants(name),
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
        product_variants(name)
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
          product_variants(name)
        )
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (packagesError) throw packagesError;
    packages = packagesData || [];

    // Get package components
    const { data: packageComponentsData, error: packageComponentsError } = await supabase
      .from('package_components')
      .select(`
        *,
        packages(name),
        product_variants(name, products(name))
      `)
      .eq('org_id', orgId)
      .order('sequence');

    if (packageComponentsError) throw packageComponentsError;
    packageComponents = packageComponentsData || [];

    // Get inventory pools
    const { data: inventoryPoolsData, error: inventoryPoolsError } = await supabase
      .from('inventory_pools')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (inventoryPoolsError) throw inventoryPoolsError;
    inventoryPools = inventoryPoolsData || [];

  } catch (error) {
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('F1 Scenario Test Error:', error);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">F1 Grand Prix Scenario Test</h1>
          <p className="text-muted-foreground">
            Testing the complete Abu Dhabi F1 Grand Prix scenario setup
          </p>
        </div>
        <Badge variant={hasError ? "destructive" : "default"}>
          {hasError ? "Error" : "Connected"}
        </Badge>
      </div>

      {hasError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Database Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please check your database connection and run the F1 seed script.
            </p>
          </CardContent>
        </Card>
      )}

      {!hasError && (
        <>
          {/* Detailed Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                F1 Grand Prix Scenario - Detailed Overview
              </CardTitle>
              <CardDescription>
                Complete breakdown of suppliers, contracts, products, rates, allocations, and packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
                  <div className="text-sm text-muted-foreground">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{contracts.length}</div>
                  <div className="text-sm text-muted-foreground">Contracts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{products.length}</div>
                  <div className="text-sm text-muted-foreground">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{ratePlans.length}</div>
                  <div className="text-sm text-muted-foreground">Rate Plans</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{allocations.length}</div>
                  <div className="text-sm text-muted-foreground">Allocations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{packages.length}</div>
                  <div className="text-sm text-muted-foreground">Packages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">{inventoryPools.length}</div>
                  <div className="text-sm text-muted-foreground">Inventory Pools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">{packageComponents.length}</div>
                  <div className="text-sm text-muted-foreground">Package Components</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Suppliers ({suppliers.length})
              </CardTitle>
              <CardDescription>
                F1 Grand Prix suppliers including hotels, ticket providers, and transfer companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Channels: {supplier.channels?.join(', ') || 'None'}
                      </p>
                    </div>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Contracts ({contracts.length})
              </CardTitle>
              <CardDescription>
                Supplier contracts with terms, payment policies, and validity periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {contracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contract.reference}</p>
                      <p className="text-sm text-muted-foreground">
                        Supplier: {contract.suppliers?.name || 'Unknown'}
                      </p>
                    </div>
                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Products ({products.length})
              </CardTitle>
              <CardDescription>
                F1 Grand Prix products including accommodation, tickets, and transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {product.product_types?.name || product.type}
                      </p>
                    </div>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rate Plans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Rate Plans ({ratePlans.length})
              </CardTitle>
              <CardDescription>
                Pricing configurations for different products and suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {ratePlans.map((ratePlan) => (
                  <div key={ratePlan.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{ratePlan.product_variants?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        Supplier: {ratePlan.suppliers?.name || 'Unknown'} • 
                        Model: {ratePlan.inventory_model} • 
                        Currency: {ratePlan.currency}
                      </p>
                    </div>
                    <Badge variant={ratePlan.preferred ? 'default' : 'secondary'}>
                      {ratePlan.preferred ? 'Preferred' : 'Standard'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Allocations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Inventory Allocations ({allocations.length})
              </CardTitle>
              <CardDescription>
                Inventory allocation buckets for different products and dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {allocations.map((allocation) => (
                  <div key={allocation.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{allocation.product_variants?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {allocation.date || `${allocation.event_start_date} - ${allocation.event_end_date}`} • 
                        Type: {allocation.allocation_type} • 
                        Quantity: {allocation.quantity || 'Unlimited'}
                      </p>
                    </div>
                    <Badge variant={allocation.allocation_type === 'committed' ? 'default' : 'secondary'}>
                      {allocation.allocation_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Packages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Packages ({packages.length})
              </CardTitle>
              <CardDescription>
                F1 Grand Prix packages combining accommodation, tickets, and transfers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{pkg.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Components: {pkg.package_components?.length || 0} • 
                        Pricing: {pkg.pricing_mode}
                      </p>
                    </div>
                    <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                      {pkg.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Variants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                Product Variants ({productVariants.length})
              </CardTitle>
              <CardDescription>
                Detailed product variants with attributes and subtypes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {productVariants.map((variant) => (
                  <div key={variant.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{variant.name}</p>
                      <Badge variant={variant.status === 'active' ? 'default' : 'secondary'}>
                        {variant.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Product: {variant.products?.name} ({variant.products?.type})
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Subtype: {variant.subtype}
                    </p>
                    {variant.attributes && (
                      <div className="text-xs text-muted-foreground">
                        Attributes: {JSON.stringify(variant.attributes)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contract Versions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Contract Versions ({contractVersions.length})
              </CardTitle>
              <CardDescription>
                Detailed contract versions with terms, policies, and validity periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {contractVersions.map((version) => (
                  <div key={version.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{version.contracts?.reference}</p>
                      <Badge variant="outline">
                        {version.valid_from} to {version.valid_to}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Supplier: {version.contracts?.suppliers?.name}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Payment Policy: {JSON.stringify(version.payment_policy)}</div>
                      <div>Cancellation Policy: {JSON.stringify(version.cancellation_policy)}</div>
                      <div>Terms: {JSON.stringify(version.terms)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rate Occupancies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Rate Occupancies ({rateOccupancies.length})
              </CardTitle>
              <CardDescription>
                Detailed occupancy-based pricing for different room configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {rateOccupancies.map((occupancy) => (
                  <div key={occupancy.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {occupancy.min_occupancy}-{occupancy.max_occupancy} people
                      </p>
                      <Badge variant="outline">
                        {occupancy.pricing_model}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Product: {occupancy.rate_plans?.product_variants?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Supplier: {occupancy.rate_plans?.suppliers?.name}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Base: £{occupancy.base_amount} 
                      {occupancy.per_person_amount && ` + £${occupancy.per_person_amount} per person`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rate Seasons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Rate Seasons ({rateSeasons.length})
              </CardTitle>
              <CardDescription>
                Seasonal pricing periods with stay requirements and restrictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {rateSeasons.map((season) => (
                  <div key={season.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {season.season_from} to {season.season_to}
                      </p>
                      <Badge variant="outline">
                        Min Stay: {season.min_stay} nights
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Product: {season.rate_plans?.product_variants?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Supplier: {season.rate_plans?.suppliers?.name}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Max Stay: {season.max_stay} • Pax: {season.min_pax}-{season.max_pax} • DOW: {season.dow_mask}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Package Components */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Components ({packageComponents.length})
              </CardTitle>
              <CardDescription>
                Detailed breakdown of what's included in each package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {packageComponents.map((component) => (
                  <div key={component.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">
                        {component.sequence}. {component.product_variants?.name}
                      </p>
                      <Badge variant="outline">
                        Qty: {component.quantity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Package: {component.packages?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Product: {component.product_variants?.products?.name}
                    </p>
                    {component.pricing_overrides && Object.keys(component.pricing_overrides).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Overrides: {JSON.stringify(component.pricing_overrides)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Pools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Pools ({inventoryPools.length})
              </CardTitle>
              <CardDescription>
                Shared inventory pools for coordinated allocation management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {inventoryPools.map((pool) => (
                  <div key={pool.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{pool.name}</p>
                      <Badge variant={pool.status === 'active' ? 'default' : 'secondary'}>
                        {pool.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Supplier: {pool.suppliers?.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Type: {pool.pool_type} • Capacity: {pool.total_capacity || 'Unlimited'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Valid: {pool.valid_from} to {pool.valid_to}
                    </p>
                    {pool.notes && (
                      <p className="text-xs text-muted-foreground">{pool.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>F1 Grand Prix Scenario Summary</CardTitle>
              <CardDescription>
                Complete overview of the F1 Grand Prix scenario setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{suppliers.length}</p>
                  <p className="text-sm text-muted-foreground">Suppliers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{contracts.length}</p>
                  <p className="text-sm text-muted-foreground">Contracts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{contractVersions.length}</p>
                  <p className="text-sm text-muted-foreground">Contract Versions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{productVariants.length}</p>
                  <p className="text-sm text-muted-foreground">Product Variants</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{ratePlans.length}</p>
                  <p className="text-sm text-muted-foreground">Rate Plans</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{rateOccupancies.length}</p>
                  <p className="text-sm text-muted-foreground">Rate Occupancies</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{rateSeasons.length}</p>
                  <p className="text-sm text-muted-foreground">Rate Seasons</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{allocations.length}</p>
                  <p className="text-sm text-muted-foreground">Allocations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{packages.length}</p>
                  <p className="text-sm text-muted-foreground">Packages</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{packageComponents.length}</p>
                  <p className="text-sm text-muted-foreground">Package Components</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{inventoryPools.length}</p>
                  <p className="text-sm text-muted-foreground">Inventory Pools</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}