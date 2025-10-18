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
  Package, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Users,
  Zap
} from "lucide-react";

const allocationSchema = z.object({
  product_variant_id: z.string().min(1, "Product variant is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  allocation_type: z.enum(["committed", "freesale", "on_request"]),
  // Date fields - either single date or event period
  date: z.string().optional(),
  event_start_date: z.string().optional(),
  event_end_date: z.string().optional(),
  time_slot_id: z.string().optional(),
  // Quantity and booking
  quantity: z.string().optional(),
  booked: z.string().optional(),
  held: z.string().optional(),
  // Status flags
  stop_sell: z.boolean(),
  blackout: z.boolean(),
  allow_overbooking: z.boolean(),
  overbooking_limit: z.string().optional(),
  // Notes
  notes: z.string().optional(),
}).refine((data) => {
  // Either date or event dates must be provided
  if (!data.date && (!data.event_start_date || !data.event_end_date)) {
    return false;
  }
  return true;
}, {
  message: "Either date or event period must be provided",
  path: ["date"]
});

type AllocationFormData = z.infer<typeof allocationSchema>;

export interface AllocationSheetProps {
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
  allocation?: any;
  onSuccess: () => void;
}

export function AllocationSheet({
  open,
  onOpenChange,
  suppliers,
  products,
  allocation,
  onSuccess
}: AllocationSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<string>("");
  const [allocationType, setAllocationType] = React.useState<string>("committed");

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      product_variant_id: allocation?.product_variant_id?.toString() || "",
      supplier_id: allocation?.supplier_id?.toString() || "",
      allocation_type: allocation?.allocation_type || "committed",
      date: allocation?.date || "",
      event_start_date: allocation?.event_start_date || "",
      event_end_date: allocation?.event_end_date || "",
      time_slot_id: allocation?.time_slot_id?.toString() || "",
      quantity: allocation?.quantity?.toString() || "",
      booked: allocation?.booked?.toString() || "0",
      held: allocation?.held?.toString() || "0",
      stop_sell: allocation?.stop_sell || false,
      blackout: allocation?.blackout || false,
      allow_overbooking: allocation?.allow_overbooking || false,
      overbooking_limit: allocation?.overbooking_limit?.toString() || "",
      notes: allocation?.notes || "",
    }
  });

  const onSubmit = async (data: AllocationFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create/update the allocation
      console.log('Allocation data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error('Error saving allocation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductData = products.find(p => p.id.toString() === selectedProduct);
  const availableVariants = selectedProductData?.product_variants || [];

  const allocationTypeConfig = {
    committed: { label: 'Committed', description: 'Fixed allocation from supplier', icon: CheckCircle2 },
    freesale: { label: 'Freesale', description: 'Unlimited availability', icon: RefreshCw },
    on_request: { label: 'On Request', description: 'Must confirm with supplier', icon: AlertCircle }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {allocation ? 'Edit Allocation' : 'New Allocation'}
          </SheetTitle>
          <SheetDescription>
            {allocation 
              ? 'Update allocation details and availability'
              : 'Create a new inventory allocation'
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
                  Select the product and supplier for this allocation
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

            {/* Allocation Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Allocation Type
                </CardTitle>
                <CardDescription>
                  How this allocation handles inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="allocation_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allocation Type</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setAllocationType(value);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(allocationTypeConfig).map(([key, config]) => (
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

            {/* Date/Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Date/Period
                </CardTitle>
                <CardDescription>
                  When this allocation is valid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date (for daily inventory)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Leave empty if this is an event-based allocation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="event_start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          For multi-day events
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="event_end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          For multi-day events
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="time_slot_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Slot (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="9:00 AM" {...field} />
                      </FormControl>
                      <FormDescription>
                        For activities with specific time slots
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Quantity & Booking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Quantity & Booking
                </CardTitle>
                <CardDescription>
                  Set availability and current booking status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="booked"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booked</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="held"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Held</FormLabel>
                        <FormControl>
                          <Input placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status & Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" />
                  Status & Controls
                </CardTitle>
                <CardDescription>
                  Control availability and booking behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stop_sell"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Stop Sell</FormLabel>
                          <FormDescription>
                            Prevent new bookings
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="blackout"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Blackout</FormLabel>
                          <FormDescription>
                            Block this date completely
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allow_overbooking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow Overbooking</FormLabel>
                        <FormDescription>
                          Allow bookings beyond available quantity
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch('allow_overbooking') && (
                  <FormField
                    control={form.control}
                    name="overbooking_limit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overbooking Limit</FormLabel>
                        <FormControl>
                          <Input placeholder="10" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximum overbooking allowed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Additional notes and information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Additional notes about this allocation..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                {isSubmitting ? 'Saving...' : allocation ? 'Update Allocation' : 'Create Allocation'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
