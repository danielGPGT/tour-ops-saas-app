"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Ticket, 
  Car, 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  Calculator,
  Calendar,
  Users,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  AlertCircle,
  ShoppingCart
} from "lucide-react";

interface QuoteItem {
  id: string;
  productVariantId: number;
  productName: string;
  variantName: string;
  supplierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dateFrom?: string;
  dateTo?: string;
  occupancy?: number;
  attributes?: any;
  availability?: {
    available: number;
    total: number;
    status: 'available' | 'low' | 'sold_out';
  };
}

interface QuoteBuilderClientProps {
  products: any[];
  productVariants: any[];
  ratePlans: any[];
  rateOccupancies: any[];
  rateSeasons: any[];
  allocations: any[];
  packages: any[];
  suppliers: any[];
}

export function QuoteBuilderClient({
  products,
  productVariants,
  ratePlans,
  rateOccupancies,
  rateSeasons,
  allocations,
  packages,
  suppliers
}: QuoteBuilderClientProps) {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [selectedDates, setSelectedDates] = useState({
    checkIn: '2026-06-05',
    checkOut: '2026-06-07'
  });
  const [occupancy, setOccupancy] = useState(2);
  const [selectedPackage, setSelectedPackage] = useState<string>('');

  // Get pricing for a variant
  const getPricing = (variantId: number, occupancy: number, dates: any) => {
    const ratePlan = ratePlans.find(rp => rp.product_variant_id === variantId);
    
    if (!ratePlan) {
      // Return default pricing based on variant name
      const variant = productVariants.find(v => v.id === variantId);
      let defaultPrice = 500;
      
      if (variant?.name?.includes('Standard Room')) defaultPrice = 1000;
      else if (variant?.name?.includes('Deluxe Room')) defaultPrice = 1200;
      else if (variant?.name?.includes('Suite')) defaultPrice = 2000;
      else if (variant?.name?.includes('Grandstand')) defaultPrice = 500;
      else if (variant?.name?.includes('Turn 1')) defaultPrice = 400;
      else if (variant?.name?.includes('Marina')) defaultPrice = 350;
      else if (variant?.name?.includes('Champions Club')) defaultPrice = 800;
      else if (variant?.name?.includes('Yas Club')) defaultPrice = 600;
      else if (variant?.name?.includes('Paddock Club')) defaultPrice = 1500;
      else if (variant?.name?.includes('General Admission')) defaultPrice = 150;
      else if (variant?.name?.includes('Airport')) defaultPrice = 50;
      else if (variant?.name?.includes('Circuit')) defaultPrice = 30;
      else if (variant?.name?.includes('Shared Coach')) defaultPrice = 25;
      else if (variant?.name?.includes('VIP')) defaultPrice = 150;
      
      return {
        basePrice: defaultPrice,
        currency: 'GBP',
        model: 'committed',
        supplier: 'F1 Supplier'
      };
    }

    // Try to find occupancy-specific pricing
    const occupancyRate = rateOccupancies.find(ro => 
      ro.rate_plan_id === ratePlan.id && 
      occupancy >= ro.min_occupancy && 
      occupancy <= ro.max_occupancy
    );

    let basePrice = 0;
    if (occupancyRate) {
      basePrice = occupancyRate.base_amount || 0;
      if (occupancyRate.pricing_model === 'base_plus_pax' && occupancyRate.per_person_amount) {
        basePrice += (occupancy - 1) * occupancyRate.per_person_amount;
      }
    } else {
      // Use rate plan rate_doc or default pricing
      const rateDoc = ratePlan.rate_doc;
      if (rateDoc && typeof rateDoc === 'object') {
        basePrice = rateDoc.base_rate || rateDoc.room_type?.base_rate || 500;
      } else {
        // Default pricing based on variant name
        const variant = productVariants.find(v => v.id === variantId);
        basePrice = 500; // Default
        
        if (variant?.name?.includes('Standard Room')) basePrice = 1000;
        else if (variant?.name?.includes('Deluxe Room')) basePrice = 1200;
        else if (variant?.name?.includes('Suite')) basePrice = 2000;
        else if (variant?.name?.includes('Grandstand')) basePrice = 500;
        else if (variant?.name?.includes('Turn 1')) basePrice = 400;
        else if (variant?.name?.includes('Marina')) basePrice = 350;
        else if (variant?.name?.includes('Champions Club')) basePrice = 800;
        else if (variant?.name?.includes('Yas Club')) basePrice = 600;
        else if (variant?.name?.includes('Paddock Club')) basePrice = 1500;
        else if (variant?.name?.includes('General Admission')) basePrice = 150;
        else if (variant?.name?.includes('Airport')) basePrice = 50;
        else if (variant?.name?.includes('Circuit')) basePrice = 30;
        else if (variant?.name?.includes('Shared Coach')) basePrice = 25;
        else if (variant?.name?.includes('VIP')) basePrice = 150;
      }
    }

    return {
      basePrice,
      currency: ratePlan.currency || 'GBP',
      model: ratePlan.inventory_model || 'committed',
      supplier: ratePlan.suppliers?.name || 'Unknown Supplier'
    };
  };

  // Get availability for a variant
  const getAvailability = (variantId: number, dates: any) => {
    const relevantAllocations = allocations.filter(allocation => 
      allocation.product_variant_id === variantId &&
      (
        // Daily allocations (hotels, transfers) - check if any day falls within the date range
        (allocation.date && allocation.date >= dates.checkIn && allocation.date <= dates.checkOut) ||
        // Event allocations (tickets) - check if event overlaps with the date range
        (allocation.event_start_date && allocation.event_end_date && 
         allocation.event_start_date <= dates.checkOut && allocation.event_end_date >= dates.checkIn)
      )
    );

    // Debug logging
    if (variantId === 103) { // Main Grandstand tickets
      console.log('Debug getAvailability for variant 103:', {
        variantId,
        dates,
        totalAllocations: allocations.length,
        relevantAllocations: relevantAllocations.length,
        allocations: allocations.filter(a => a.product_variant_id === variantId)
      });
    }

    if (relevantAllocations.length === 0) return null;

    // Check if any allocation is freesale (unlimited capacity)
    const hasFreesale = relevantAllocations.some(alloc => alloc.quantity === null);
    if (hasFreesale) {
      return {
        available: 999, // Unlimited for freesale
        total: 999,
        status: 'available' as const
      };
    }

    const totalQuantity = relevantAllocations.reduce((sum, alloc) => sum + (alloc.quantity || 0), 0);
    const totalBooked = relevantAllocations.reduce((sum, alloc) => sum + (alloc.booked || 0), 0);
    const totalHeld = relevantAllocations.reduce((sum, alloc) => sum + (alloc.held || 0), 0);
    const available = totalQuantity - totalBooked - totalHeld;
    
    let status: 'available' | 'low' | 'sold_out' = 'available';
    if (available === 0) status = 'sold_out';
    else if (available < totalQuantity * 0.2) status = 'low';

    return {
      available,
      total: totalQuantity,
      status
    };
  };

  // Group variants by product type and filter by availability
  const variantsByType = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    productVariants.forEach(variant => {
      const type = variant.products?.type || 'unknown';
      const availability = getAvailability(variant.id, selectedDates);
      
      // Only show variants that have availability during the selected dates
      if (availability && (availability.available > 0 || availability.available === 999)) {
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(variant);
      }
    });
    return grouped;
  }, [productVariants, selectedDates, allocations]);

  // Add item to quote
  const addToQuote = (variant: any) => {
    const pricing = getPricing(variant.id, occupancy, selectedDates);
    const availability = getAvailability(variant.id, selectedDates);
    
    if (!pricing) return;

    const newItem: QuoteItem = {
      id: `${variant.id}-${Date.now()}`,
      productVariantId: variant.id,
      productName: variant.products?.name || 'Unknown Product',
      variantName: variant.name,
      supplierName: pricing.supplier || 'Unknown Supplier',
      quantity: 1,
      unitPrice: pricing.basePrice,
      totalPrice: pricing.basePrice,
      dateFrom: selectedDates.checkIn,
      dateTo: selectedDates.checkOut,
      occupancy,
      attributes: variant.attributes,
      availability
    };

    setQuoteItems(prev => [...prev, newItem]);
  };

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setQuoteItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity: newQuantity, totalPrice: item.unitPrice * newQuantity }
        : item
    ));
  };

  // Remove item from quote
  const removeFromQuote = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Add package to quote
  const addPackage = (packageId: string) => {
    const pkg = packages.find(p => p.id.toString() === packageId);
    if (!pkg) return;

    const packageItems: QuoteItem[] = pkg.package_components.map((component: any, index: number) => {
      const variant = productVariants.find(v => v.id === component.product_variant_id);
      const pricing = getPricing(component.product_variant_id, occupancy, selectedDates);
      const availability = getAvailability(component.product_variant_id, selectedDates);
      
      return {
        id: `${component.product_variant_id}-${Date.now()}-${index}`,
        productVariantId: component.product_variant_id,
        productName: variant?.products?.name || 'Unknown Product',
        variantName: variant?.name || 'Unknown Variant',
        supplierName: pricing?.supplier || 'Unknown Supplier',
        quantity: component.quantity || 1,
        unitPrice: pricing?.basePrice || 0,
        totalPrice: (pricing?.basePrice || 0) * (component.quantity || 1),
        dateFrom: selectedDates.checkIn,
        dateTo: selectedDates.checkOut,
        occupancy,
        attributes: variant?.attributes,
        availability
      };
    });

    setQuoteItems(prev => [...prev, ...packageItems]);
    setSelectedPackage('');
  };

  // Filter packages that are available during the selected dates
  const availablePackages = useMemo(() => {
    return packages.filter(pkg => {
      // Check if all components of the package are available
      return pkg.package_components.every((component: any) => {
        const availability = getAvailability(component.product_variant_id, selectedDates);
        return availability && (availability.available > 0 || availability.available === 999);
      });
    });
  }, [packages, selectedDates, allocations]);

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }, [quoteItems]);

  // Get icon for product type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accommodation': return <Building2 className="h-4 w-4" />;
      case 'event': return <Ticket className="h-4 w-4" />;
      case 'transfer': return <Car className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Debug Info */}
      <div className="lg:col-span-2 mb-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info</h3>
        <div className="text-sm space-y-1">
          <div>Rate Plans: {ratePlans.length}</div>
          <div>Rate Occupancies: {rateOccupancies.length}</div>
          <div>Product Variants: {productVariants.length}</div>
          <div>Allocations: {allocations.length}</div>
          <div>Packages: {packages.length}</div>
          <div>Available Packages: {availablePackages.length}</div>
          <div>Selected Dates: {selectedDates.checkIn} to {selectedDates.checkOut}</div>
          <div>Variants by Type: {Object.keys(variantsByType).join(', ')}</div>
        </div>
        <div className="mt-2 text-xs">
          <div>Product Variants: {productVariants.map(v => `${v.name} (${v.products?.type})`).join(', ')}</div>
        </div>
      </div>

      {/* Quote Builder */}
      <div className="lg:col-span-2 space-y-6">
        {/* Date and Occupancy Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="checkIn">Check-in Date</Label>
                <Input
                  id="checkIn"
                  type="date"
                  value={selectedDates.checkIn}
                  onChange={(e) => setSelectedDates(prev => ({ ...prev, checkIn: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="checkOut">Check-out Date</Label>
                <Input
                  id="checkOut"
                  type="date"
                  value={selectedDates.checkOut}
                  onChange={(e) => setSelectedDates(prev => ({ ...prev, checkOut: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="occupancy">Number of People</Label>
              <Input
                id="occupancy"
                type="number"
                min="1"
                max="10"
                value={occupancy}
                onChange={(e) => setOccupancy(parseInt(e.target.value) || 1)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Packages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Pre-built Packages
            </CardTitle>
            <CardDescription>
              Choose from our curated F1 Grand Prix packages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availablePackages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No packages available for the selected dates</p>
                  <p className="text-sm">Try adjusting your check-in/check-out dates</p>
                </div>
              ) : (
                availablePackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{pkg.name}</h4>
                    <p className="text-sm text-muted-foreground">{pkg.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {pkg.package_components?.length || 0} components
                      </Badge>
                      <Badge variant="secondary">{pkg.pricing_mode}</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => addPackage(pkg.id.toString())}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Package
                  </Button>
                </div>
              ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Products */}
        <Tabs defaultValue="accommodation" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="accommodation">Hotels</TabsTrigger>
            <TabsTrigger value="event">Tickets</TabsTrigger>
            <TabsTrigger value="transfer">Transfers</TabsTrigger>
            <TabsTrigger value="package">Packages</TabsTrigger>
          </TabsList>

          {Object.entries(variantsByType).map(([type, variants]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {variants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No {type} available for the selected dates</p>
                  <p className="text-sm">Try adjusting your check-in/check-out dates</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {variants.map((variant) => {
                  const pricing = getPricing(variant.id, occupancy, selectedDates);
                  const availability = getAvailability(variant.id, selectedDates);
                  
                  return (
                    <Card key={variant.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTypeIcon(type)}
                              <h4 className="font-medium">{variant.name}</h4>
                              <Badge variant="outline">{variant.products?.name}</Badge>
                            </div>
                            
                            {pricing && (
                              <div className="flex items-center gap-4 mb-2">
                                <span className="text-lg font-semibold">
                                  £{pricing.basePrice.toFixed(0)}
                                </span>
                                <Badge variant={pricing.model === 'committed' ? 'default' : 'secondary'}>
                                  {pricing.model}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {pricing.supplier}
                                </span>
                              </div>
                            )}

                            {availability && (
                              <div className="flex items-center gap-2 mb-2">
                                {availability.status === 'available' && (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                )}
                                {availability.status === 'low' && (
                                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                                )}
                                {availability.status === 'sold_out' && (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className={`text-sm ${
                                  availability.status === 'available' ? 'text-green-600' :
                                  availability.status === 'low' ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {availability.status === 'sold_out' ? 'Sold Out' :
                                   availability.status === 'low' ? `Only ${availability.available} left` :
                                   `${availability.available} available`}
                                </span>
                              </div>
                            )}

                            {variant.attributes && (
                              <div className="text-xs text-muted-foreground">
                                {Object.entries(variant.attributes).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {JSON.stringify(value)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => addToQuote(variant)}
                            disabled={!pricing || (availability?.status === 'sold_out')}
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Quote
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Quote Summary */}
      <div className="space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Quote Summary
            </CardTitle>
            <CardDescription>
              {quoteItems.length} item{quoteItems.length !== 1 ? 's' : ''} in your quote
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quoteItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Add items to build your quote
              </p>
            ) : (
              <>
                <div className="space-y-3">
                  {quoteItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.variantName}</h4>
                        <p className="text-xs text-muted-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.supplierName}</p>
                        {item.availability && (
                          <div className="flex items-center gap-1 mt-1">
                            {item.availability.status === 'available' && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            {item.availability.status === 'low' && (
                              <AlertCircle className="h-3 w-3 text-yellow-500" />
                            )}
                            {item.availability.status === 'sold_out' && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.availability.available} available
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-medium">
                            £{item.totalPrice.toFixed(0)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromQuote(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>£{totals.subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>£{totals.tax.toFixed(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>£{totals.total.toFixed(0)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    <Calculator className="h-4 w-4 mr-2" />
                    Generate Quote
                  </Button>
                  <Button variant="outline" className="w-full">
                    Save Quote
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
