import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Ticket, Car, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default async function TestMonacoScenarioPage() {
  const supabase = await createClient();

  // Test data retrieval for Monaco scenario
  let suppliers: any[] = [];
  let contracts: any[] = [];
  let products: any[] = [];
  let productVariants: any[] = [];
  let ratePlans: any[] = [];
  let allocations: any[] = [];
  let packages: any[] = [];
  let hasError = false;
  let errorMessage = "";

  try {
    // Get suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('org_id', 200)
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
      .eq('org_id', 200)
      .order('created_at', { ascending: false });

    if (contractsError) throw contractsError;
    contracts = contractsData || [];

    // Get products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', 200)
      .order('name');

    if (productsError) throw productsError;
    products = productsData || [];

    // Get product variants
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, type)
      `)
      .eq('org_id', 200)
      .order('name');

    if (variantsError) throw variantsError;
    productVariants = variantsData || [];

    // Get rate plans
    const { data: ratePlansData, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select(`
        *,
        suppliers(name)
      `)
      .eq('org_id', 200)
      .order('created_at', { ascending: false });

    if (ratePlansError) throw ratePlansError;
    ratePlans = ratePlansData || [];

    // Get allocations
    const { data: allocationsData, error: allocationsError } = await supabase
      .from('allocation_buckets')
      .select('*')
      .eq('org_id', 200)
      .order('created_at', { ascending: false });

    if (allocationsError) throw allocationsError;
    allocations = allocationsData || [];

    // Get packages
    const { data: packagesData, error: packagesError } = await supabase
      .from('packages')
      .select(`
        *,
        package_components(
          product_variants(
            name,
            products(name)
          )
        )
      `)
      .eq('org_id', 200)
      .order('created_at', { ascending: false });

    if (packagesError) throw packagesError;
    packages = packagesData || [];

  } catch (error) {
    hasError = true;
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Monaco Scenario Test Error:', error);
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Monaco Grand Prix 2026 Scenario Test</h1>
        <p className="text-muted-foreground">Testing the complete Monaco Grand Prix scenario setup</p>
        {hasError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">Server Monaco Scenario Test Error: {errorMessage}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Suppliers ({suppliers.length})
            </CardTitle>
            <CardDescription>
              Monaco Grand Prix suppliers including hotels, ticket providers, and transfer companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{supplier.name}</p>
                    <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                      {supplier.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Channels: {supplier.channels?.join(', ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {supplier.city}, {supplier.country}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Contracts ({contracts.length})
            </CardTitle>
            <CardDescription>
              Supplier contracts with terms, payment policies, and validity periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {contracts.map((contract) => (
                <div key={contract.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{contract.contract_number}</p>
                    <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Supplier: {contract.suppliers?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {contract.title}
                  </p>
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
              Monaco Grand Prix products including accommodation, tickets, and transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {products.map((product) => (
                <div key={product.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{product.name}</p>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Type: {product.type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {product.location}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
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
                  <p className="text-sm text-muted-foreground">
                    Subtype: {variant.subtype}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Rate Plans ({ratePlans.length})
            </CardTitle>
            <CardDescription>
              Pricing configurations for different products and suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {ratePlans.slice(0, 10).map((ratePlan) => (
                <div key={ratePlan.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Rate Plan #{ratePlan.id}</p>
                    <Badge variant={ratePlan.preferred ? 'default' : 'secondary'}>
                      {ratePlan.preferred ? 'Preferred' : 'Standard'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Supplier: {ratePlan.suppliers?.name}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Model: {ratePlan.inventory_model} • Currency: {ratePlan.currency}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Valid: {ratePlan.valid_from} to {ratePlan.valid_to}
                  </p>
                </div>
              ))}
              {ratePlans.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {ratePlans.length - 10} more rate plans
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Allocations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Inventory Allocations ({allocations.length})
            </CardTitle>
            <CardDescription>
              Inventory allocation buckets for different products and dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {allocations.slice(0, 10).map((allocation) => (
                <div key={allocation.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Variant #{allocation.product_variant_id}</p>
                    <Badge variant={allocation.allocation_type === 'committed' ? 'default' : 'secondary'}>
                      {allocation.allocation_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {allocation.date ? `Date: ${allocation.date}` : `Event: ${allocation.event_start_date} to ${allocation.event_end_date}`}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Type: {allocation.allocation_type} • Quantity: {allocation.quantity || 'Unlimited'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {allocation.allocation_type} {allocation.quantity ? `(${allocation.quantity} units)` : '(unlimited)'}
                  </p>
                </div>
              ))}
              {allocations.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {allocations.length - 10} more allocations
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Monaco Grand Prix Packages ({packages.length})
            </CardTitle>
            <CardDescription>
              Monaco Grand Prix packages combining accommodation, tickets, and transfers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{pkg.name}</p>
                    <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                      {pkg.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Components: {pkg.package_components?.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Pricing: {pkg.pricing_model}
                  </p>
                  {pkg.package_components && pkg.package_components.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Includes:</p>
                      <div className="space-y-1">
                        {pkg.package_components.slice(0, 3).map((component: any, index: number) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            • {component.quantity}x {component.product_variants?.name}
                          </p>
                        ))}
                        {pkg.package_components.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            ... and {pkg.package_components.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monaco Grand Prix Scenario Summary</CardTitle>
          <CardDescription>
            Complete overview of the Monaco Grand Prix scenario setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-sm text-muted-foreground">Suppliers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{contracts.length}</div>
              <div className="text-sm text-muted-foreground">Contracts</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{products.length}</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">{productVariants.length}</div>
              <div className="text-sm text-muted-foreground">Variants</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{ratePlans.length}</div>
              <div className="text-sm text-muted-foreground">Rate Plans</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-600">{allocations.length}</div>
              <div className="text-sm text-muted-foreground">Allocations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">{packages.length}</div>
              <div className="text-sm text-muted-foreground">Packages</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
