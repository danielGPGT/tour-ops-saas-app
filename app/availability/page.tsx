import { CalendarView } from '@/components/availability/CalendarView';
import { AllocationManager } from '@/components/availability/AllocationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Building2, TrendingUp, Users } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { getCurrentOrgId } from '@/lib/hooks/use-current-org';

export default async function AvailabilityPage({ 
  searchParams 
}: { 
  searchParams?: Promise<{ variant?: string; view?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const selectedVariantId = resolvedSearchParams?.variant ? parseInt(resolvedSearchParams.variant) : undefined;
  const view = resolvedSearchParams?.view || 'calendar';

  const orgId = await getCurrentOrgId();
  const supabase = await createClient();

  // Fetch product variants for the dropdown
  let productVariants: any[] = [];
  let selectedVariant: any = null;

  try {
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select(`
        id,
        name,
        products (
          id,
          name,
          type
        )
      `)
      .eq('org_id', orgId)
      .eq('status', 'active')
      .order('name');

    if (!variantsError && variantsData) {
      productVariants = variantsData;
      selectedVariant = selectedVariantId ? 
        productVariants.find(v => v.id === selectedVariantId) : 
        productVariants[0];
    }
  } catch (error) {
    console.error('Failed to fetch product variants:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Availability & Allocations
              </CardTitle>
              <CardDescription>
                Master rates with supplier breakdown and inventory management
              </CardDescription>
            </div>
            
            {selectedVariant && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {selectedVariant.name}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {selectedVariant.products?.type || 'Product'}
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Product Variant Selector */}
      {productVariants.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Product Variant:</span>
              <div className="flex gap-2 flex-wrap">
                {productVariants.map(variant => (
                  <Button
                    key={variant.id}
                    variant={selectedVariantId === variant.id ? "default" : "outline"}
                    size="sm"
                    asChild
                  >
                    <a href={`?variant=${variant.id}&view=${view}`}>
                      {variant.name}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {selectedVariant ? (
        <Tabs value={view} className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar" asChild>
              <a href={`?variant=${selectedVariantId}&view=calendar`}>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </a>
            </TabsTrigger>
            <TabsTrigger value="allocations" asChild>
              <a href={`?variant=${selectedVariantId}&view=allocations`}>
                <Building2 className="h-4 w-4 mr-2" />
                Allocation Manager
              </a>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>
                  Visual calendar showing master rates with supplier breakdown. 
                  Click any date to see detailed supplier information and margins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarView 
                  productVariantId={selectedVariant.id}
                  productName={selectedVariant.name}
                  onDateSelect={(date, dayData) => {
                    console.log('Selected date:', date, 'Data:', dayData);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Allocation Manager</CardTitle>
                <CardDescription>
                  Manage inventory allocations across suppliers. 
                  Add, edit, and monitor supplier-specific inventory with cost tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AllocationManager 
                  productVariantId={selectedVariant.id}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Product Variants Found</h3>
                <p className="text-muted-foreground">
                  Create product variants first to manage availability and allocations.
                </p>
              </div>
              <Button asChild>
                <a href="/products">Go to Products</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Master Rate + Supplier Rates Works</CardTitle>
          <CardDescription>
            Understanding the allocation and pricing system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Master Rate (Selling Price)
              </h4>
              <p className="text-sm text-muted-foreground">
                The price customers pay. Defined once per product variant, 
                used across all suppliers.
              </p>
              <div className="text-xs bg-green-50 p-2 rounded">
                Example: €50 per person
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Supplier Rates (Your Costs)
              </h4>
              <p className="text-sm text-muted-foreground">
                What you pay each supplier. Different suppliers 
                can have different costs for the same product.
              </p>
              <div className="text-xs bg-blue-50 p-2 rounded">
                Supplier A: €30<br />
                Supplier B: €35<br />
                Supplier C: €40
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Allocations (Inventory)
              </h4>
              <p className="text-sm text-muted-foreground">
                Inventory buckets per supplier per date. 
                System auto-selects best supplier during booking.
              </p>
              <div className="text-xs bg-yellow-50 p-2 rounded">
                Supplier A: 5 slots<br />
                Supplier B: 10 slots<br />
                Total: 15 available
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Booking Flow</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Customer sees master rate (€50) and total availability (15 slots)</li>
              <li>2. Customer books 4 people for €200 total</li>
              <li>3. System auto-selects best supplier (Supplier A: €30 cost, €20 margin)</li>
              <li>4. Allocation updated: Supplier A now has 1 slot remaining</li>
              <li>5. Booking confirmed with €80 total margin</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
