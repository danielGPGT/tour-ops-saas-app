"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DollarSign, 
  Building2, 
  Package, 
  Calendar, 
  Globe, 
  Star,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

const ratePlanSchema = z.object({
  product_variant_id: z.string().min(1, "Product variant is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  contract_version_id: z.string().min(1, "Contract version is required"),
  inventory_model: z.enum(["committed", "freesale", "on_request"]),
  currency: z.string().min(1, "Currency is required"),
  markets: z.array(z.string()).min(1, "At least one market is required"),
  channels: z.array(z.string()).min(1, "At least one channel is required"),
  preferred: z.boolean(),
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_to: z.string().min(1, "Valid to date is required"),
  // Rate document fields
  base_rate: z.string().optional(),
  markup_percentage: z.string().optional(),
  seasonal_adjustments: z.boolean(),
  occupancy_pricing: z.boolean(),
  age_bands: z.boolean(),
  taxes_fees: z.boolean(),
});

type RatePlanFormData = z.infer<typeof ratePlanSchema>;

export interface RatePlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Array<{
    id: bigint;
    name: string;
    status: string;
  }>;
  products: Array<{
    id: bigint;
    name: string;
    type: string;
    product_types?: {
      name: string;
      icon: string;
      color: string;
    };
    product_variants?: Array<{
      id: bigint;
      name: string;
      subtype: string;
    }>;
  }>;
  ratePlan?: any;
  onSuccess: () => void;
}

export function RatePlanSheet({
  open,
  onOpenChange,
  suppliers,
  products,
  ratePlan,
  onSuccess
}: RatePlanSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<string>("");

  const form = useForm<RatePlanFormData>({
    resolver: zodResolver(ratePlanSchema),
    defaultValues: {
      product_variant_id: ratePlan?.product_variant_id?.toString() || "",
      supplier_id: ratePlan?.supplier_id?.toString() || "",
      contract_version_id: ratePlan?.contract_version_id?.toString() || "",
      inventory_model: ratePlan?.inventory_model || "committed",
      currency: ratePlan?.currency || "GBP",
      markets: ratePlan?.markets || ["UK"],
      channels: ratePlan?.channels || ["b2b"],
      preferred: ratePlan?.preferred || false,
      valid_from: ratePlan?.valid_from || "",
      valid_to: ratePlan?.valid_to || "",
      base_rate: ratePlan?.rate_doc?.base_rate || "",
      markup_percentage: ratePlan?.rate_doc?.markup_percentage || "",
      seasonal_adjustments: ratePlan?.rate_doc?.seasonal_adjustments || false,
      occupancy_pricing: ratePlan?.rate_doc?.occupancy_pricing || false,
      age_bands: ratePlan?.rate_doc?.age_bands || false,
      taxes_fees: ratePlan?.rate_doc?.taxes_fees || false,
    }
  });

  const onSubmit = async (data: RatePlanFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create/update the rate plan
      console.log('Rate plan data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error('Error saving rate plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductData = products.find(p => p.id.toString() === selectedProduct);
  const availableVariants = selectedProductData?.product_variants || [];

  const inventoryModelConfig = {
    committed: { label: 'Committed', description: 'Fixed allocation from supplier', icon: CheckCircle2 },
    freesale: { label: 'Freesale', description: 'Unlimited availability', icon: RefreshCw },
    on_request: { label: 'On Request', description: 'Must confirm with supplier', icon: AlertCircle }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {ratePlan ? 'Edit Rate Plan' : 'New Rate Plan'}
          </SheetTitle>
          <SheetDescription>
            {ratePlan 
              ? 'Update rate plan details and pricing'
              : 'Create a new rate plan for a product and supplier'
            }
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Product & Supplier
                </CardTitle>
                <CardDescription>
                  Select the product and supplier for this rate plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="product_variant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        const product = products.find(p => p.product_variants?.some(v => v.id.toString() === value));
                        setSelectedProduct(product?.id.toString() || "");
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product variant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <div key={product.id}>
                              <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                {product.name}
                              </div>
                              {product.product_variants?.map((variant) => (
                                <SelectItem key={variant.id.toString()} value={variant.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{variant.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {variant.subtype}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id.toString()} value={supplier.id.toString()}>
                              <div className="flex items-center gap-2">
                                <span>{supplier.name}</span>
                                <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                                  {supplier.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Inventory Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Inventory Model
                </CardTitle>
                <CardDescription>
                  How this rate plan handles inventory allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="inventory_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory Model</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(inventoryModelConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{config.label}</div>
                                  <div className="text-sm text-muted-foreground">{config.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Markets & Channels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  Markets & Channels
                </CardTitle>
                <CardDescription>
                  Target markets and distribution channels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferred"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Preferred Rate Plan
                          </FormLabel>
                          <FormDescription>
                            This rate plan will be prioritized
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Validity Period
                </CardTitle>
                <CardDescription>
                  When this rate plan is valid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid From</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="valid_to"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valid To</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Pricing Configuration
                </CardTitle>
                <CardDescription>
                  Configure pricing rules and adjustments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="base_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Rate</FormLabel>
                        <FormControl>
                          <Input placeholder="100.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="markup_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markup %</FormLabel>
                        <FormControl>
                          <Input placeholder="25" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seasonal_adjustments"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Seasonal Adjustments</FormLabel>
                          <FormDescription>
                            Different rates for different seasons
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occupancy_pricing"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Occupancy Pricing</FormLabel>
                          <FormDescription>
                            Different rates for different group sizes
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age_bands"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Age Bands</FormLabel>
                          <FormDescription>
                            Different rates for different age groups
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxes_fees"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Taxes & Fees</FormLabel>
                          <FormDescription>
                            Additional charges and taxes
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : ratePlan ? 'Update Rate Plan' : 'Create Rate Plan'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
