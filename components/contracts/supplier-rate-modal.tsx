"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Plus, Trash2, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProducts } from "@/lib/hooks/useProducts";
import { useProductOptions } from "@/lib/hooks/useProductOptions";

// Form validation schema
const supplierRateSchema = z.object({
  rate_name: z.string().min(1, "Rate name is required"),
  product_id: z.string().min(1, "Product is required"),
  product_option_id: z.string().optional(),
  contract_id: z.string().optional(),
  rate_basis: z.enum(["per_night", "per_person", "per_unit", "per_booking"]),
  base_cost: z.number().min(0, "Base cost must be positive"),
  currency: z.string().length(3, "Currency must be 3 characters"),
  valid_from: z.date(),
  valid_to: z.date(),
  is_active: z.boolean().default(true),
});

type SupplierRateFormValues = z.infer<typeof supplierRateSchema>;

// SupplierRate interface (simplified for the component)
interface SupplierRate {
  id?: string;
  organization_id?: string;
  product_id: string;
  product_option_id?: string;
  contract_id?: string;
  rate_name: string;
  rate_basis: "per_night" | "per_person" | "per_unit" | "per_booking";
  valid_from: string;
  valid_to: string;
  base_cost: number;
  currency: string;
  pricing_details?: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SupplierRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rate?: SupplierRate | null;
  contractId?: string;
  mode: "add" | "edit";
  onSave: (rate: SupplierRate) => Promise<void>;
}

export function SupplierRateModal({
  open,
  onOpenChange,
  rate,
  contractId,
  mode,
  onSave,
}: SupplierRateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch products and options
  const { data: products = [] } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const { data: productOptions = [], isLoading: optionsLoading, error: optionsError } = useProductOptions(selectedProductId);
  
  // Debug logging
  useEffect(() => {
    if (selectedProductId) {
      console.log('Selected Product ID:', selectedProductId);
      console.log('Product Options:', productOptions);
      if (optionsError) {
        console.error('Error loading options:', optionsError);
      }
    }
  }, [selectedProductId, productOptions, optionsError]);
  
  // Pricing details state
  const [occupancyPricing, setOccupancyPricing] = useState<Record<string, any>>({});
  const [datePricing, setDatePricing] = useState<Record<string, number>>({});
  const [vehicleRates, setVehicleRates] = useState<Record<string, any>>({});
  const [agePricing, setAgePricing] = useState<Record<string, any>>({});
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [includes, setIncludes] = useState<string[]>([]);
  const [excludes, setExcludes] = useState<string[]>([]);

  // Form
  const form = useForm<SupplierRateFormValues>({
    resolver: zodResolver(supplierRateSchema),
    defaultValues: {
      rate_name: "",
      rate_basis: "per_night",
      base_cost: 0,
      currency: "EUR",
      is_active: true,
      contract_id: contractId,
    },
  });

  // Load existing rate data
  useEffect(() => {
    if (rate && mode === "edit") {
      const validFrom = rate.valid_from ? new Date(rate.valid_from) : undefined;
      const validTo = rate.valid_to ? new Date(rate.valid_to) : undefined;
      
      form.reset({
        rate_name: rate.rate_name || "",
        product_id: rate.product_id || "",
        product_option_id: rate.product_option_id,
        contract_id: rate.contract_id,
        rate_basis: rate.rate_basis || "per_night",
        base_cost: rate.base_cost || 0,
        currency: rate.currency || "USD",
        valid_from: validFrom,
        valid_to: validTo,
        is_active: rate.is_active !== undefined ? rate.is_active : true,
      });

      // Set selected product ID to load product options
      if (rate.product_id) {
        setSelectedProductId(rate.product_id);
      }

      // Load pricing details
      if (rate.pricing_details) {
        setOccupancyPricing(rate.pricing_details.occupancy_pricing || {});
        setDatePricing(rate.pricing_details.dates || {});
        setVehicleRates(rate.pricing_details.vehicle_rates || {});
        setAgePricing(rate.pricing_details.age_pricing || {});
        setExtras(rate.pricing_details.extras || {});
        setIncludes(rate.pricing_details.includes || []);
        setExcludes(rate.pricing_details.excludes || []);
      }
    } else {
      // Reset for new rate
      setSelectedProductId("");
      setOccupancyPricing({});
      setDatePricing({});
      setVehicleRates({});
      setAgePricing({});
      setExtras({});
      setIncludes([]);
      setExcludes([]);
    }
  }, [rate, mode, form, open]);

  const onSubmit = async (values: SupplierRateFormValues) => {
    setIsLoading(true);
    
    try {
      const rateData: SupplierRate = {
        ...values,
        id: rate?.id,
        organization_id: rate?.organization_id,
        valid_from: format(values.valid_from, "yyyy-MM-dd"),
        valid_to: format(values.valid_to, "yyyy-MM-dd"),
        pricing_details: {
          occupancy_pricing: Object.keys(occupancyPricing).length > 0 ? occupancyPricing : undefined,
          dates: Object.keys(datePricing).length > 0 ? datePricing : undefined,
          vehicle_rates: Object.keys(vehicleRates).length > 0 ? vehicleRates : undefined,
          age_pricing: Object.keys(agePricing).length > 0 ? agePricing : undefined,
          extras: Object.keys(extras).length > 0 ? extras : undefined,
          includes: includes.length > 0 ? includes : undefined,
          excludes: excludes.length > 0 ? excludes : undefined,
        },
        created_at: rate?.created_at,
        updated_at: new Date().toISOString(),
      };

      await onSave(rateData);
      
      toast.success(mode === "add" ? "Rate created successfully" : "Rate updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save rate");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for managing pricing details
  const addOccupancyType = () => {
    const type = `occupancy_${Object.keys(occupancyPricing).length + 1}`;
    setOccupancyPricing({
      ...occupancyPricing,
      [type]: {
        adults: 2,
        children: 0,
        cost_per_night: form.getValues("base_cost"),
        notes: "",
      },
    });
  };

  const updateOccupancy = (type: string, field: string, value: any) => {
    setOccupancyPricing({
      ...occupancyPricing,
      [type]: {
        ...occupancyPricing[type],
        [field]: value,
      },
    });
  };

  const deleteOccupancy = (type: string) => {
    const { [type]: _, ...rest } = occupancyPricing;
    setOccupancyPricing(rest);
  };

  const addVehicle = () => {
    const vehicle = `vehicle_${Object.keys(vehicleRates).length + 1}`;
    setVehicleRates({
      ...vehicleRates,
      [vehicle]: {
        passengers: "1-4",
        cost_per_transfer: form.getValues("base_cost"),
        notes: "",
      },
    });
  };

  const addAgeCategory = () => {
    const category = `category_${Object.keys(agePricing).length + 1}`;
    setAgePricing({
      ...agePricing,
      [category]: {
        age_range: "0-12",
        cost: form.getValues("base_cost"),
        notes: "",
      },
    });
  };

  const addExtra = () => {
    const extra = `extra_${Object.keys(extras).length + 1}`;
    setExtras({
      ...extras,
      [extra]: 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Supplier Rate" : "Edit Supplier Rate"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Create a new supplier rate with flexible pricing options."
              : "Update the supplier rate details and pricing structure."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Details</h3>

              <FormField
                control={form.control}
                name="rate_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Fairmont Standard - Monaco GP 2025"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedProductId(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="product_option_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Option</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedProductId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue 
                              placeholder={
                                !selectedProductId 
                                  ? "Select a product first" 
                                  : optionsLoading 
                                  ? "Loading options..." 
                                  : productOptions.length === 0 
                                  ? "No options available" 
                                  : "Select option (optional)"
                              } 
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {optionsError ? (
                            <div className="p-2 text-sm text-red-600">
                              Error loading options: {optionsError.message}
                            </div>
                          ) : productOptions.length === 0 && selectedProductId ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No options available for this product
                            </div>
                          ) : (
                            productOptions.map((option) => (
                              <SelectItem key={option.id} value={option.id}>
                                {option.option_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rate_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Basis *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="per_night">Per Night</SelectItem>
                          <SelectItem value="per_person">Per Person</SelectItem>
                          <SelectItem value="per_unit">Per Unit</SelectItem>
                          <SelectItem value="per_booking">Per Booking</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Cost *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid From *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Valid To *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        This rate can be used for new bookings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Advanced Pricing Options - Accordion */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Pricing Details</h3>
                <Badge variant="outline">Optional</Badge>
              </div>

              <Accordion type="multiple" className="w-full">
                {/* Multi-Occupancy Pricing */}
                <AccordionItem value="occupancy">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      Multi-Occupancy Pricing
                      {Object.keys(occupancyPricing).length > 0 && (
                        <Badge variant="secondary">
                          {Object.keys(occupancyPricing).length} types
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Define different rates based on number of guests (hotels)
                      </p>

                      {Object.keys(occupancyPricing).length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Adults</TableHead>
                              <TableHead>Children</TableHead>
                              <TableHead>Cost/Night</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(occupancyPricing).map(([type, pricing]: [string, any]) => (
                              <TableRow key={type}>
                                <TableCell>
                                  <Input
                                    value={type}
                                    onChange={(e) => {
                                      const newType = e.target.value;
                                      const { [type]: value, ...rest } = occupancyPricing;
                                      setOccupancyPricing({ ...rest, [newType]: value });
                                    }}
                                    placeholder="e.g. double"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={pricing.adults}
                                    onChange={(e) =>
                                      updateOccupancy(type, "adults", parseInt(e.target.value) || 1)
                                    }
                                    min={1}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={pricing.children || 0}
                                    onChange={(e) =>
                                      updateOccupancy(type, "children", parseInt(e.target.value) || 0)
                                    }
                                    min={0}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={pricing.cost_per_night}
                                    onChange={(e) =>
                                      updateOccupancy(type, "cost_per_night", parseFloat(e.target.value) || 0)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={pricing.notes || ""}
                                    onChange={(e) =>
                                      updateOccupancy(type, "notes", e.target.value)
                                    }
                                    placeholder="Optional notes"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteOccupancy(type)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOccupancyType}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Occupancy Type
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Vehicle Rates */}
                <AccordionItem value="vehicles">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      Vehicle Rates
                      {Object.keys(vehicleRates).length > 0 && (
                        <Badge variant="secondary">
                          {Object.keys(vehicleRates).length} vehicles
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Define rates for different vehicle types (transfers)
                      </p>

                      {Object.keys(vehicleRates).length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Vehicle Type</TableHead>
                              <TableHead>Capacity</TableHead>
                              <TableHead>Cost/Transfer</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(vehicleRates).map(([vehicle, details]: [string, any]) => (
                              <TableRow key={vehicle}>
                                <TableCell>
                                  <Input
                                    value={vehicle}
                                    onChange={(e) => {
                                      const newVehicle = e.target.value;
                                      const { [vehicle]: value, ...rest } = vehicleRates;
                                      setVehicleRates({ ...rest, [newVehicle]: value });
                                    }}
                                    placeholder="e.g. Mercedes E-Class"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={details.passengers}
                                    onChange={(e) => {
                                      setVehicleRates({
                                        ...vehicleRates,
                                        [vehicle]: { ...details, passengers: e.target.value },
                                      });
                                    }}
                                    placeholder="e.g. 1-3"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={details.cost_per_transfer}
                                    onChange={(e) => {
                                      setVehicleRates({
                                        ...vehicleRates,
                                        [vehicle]: {
                                          ...details,
                                          cost_per_transfer: parseFloat(e.target.value) || 0,
                                        },
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={details.notes || ""}
                                    onChange={(e) => {
                                      setVehicleRates({
                                        ...vehicleRates,
                                        [vehicle]: { ...details, notes: e.target.value },
                                      });
                                    }}
                                    placeholder="Optional notes"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const { [vehicle]: _, ...rest } = vehicleRates;
                                      setVehicleRates(rest);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addVehicle}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle Type
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Age-Based Pricing */}
                <AccordionItem value="age">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      Age-Based Pricing
                      {Object.keys(agePricing).length > 0 && (
                        <Badge variant="secondary">
                          {Object.keys(agePricing).length} categories
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Define rates for different age groups (tickets)
                      </p>

                      {Object.keys(agePricing).length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead>Age Range</TableHead>
                              <TableHead>Cost</TableHead>
                              <TableHead>Notes</TableHead>
                              <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(agePricing).map(([category, details]: [string, any]) => (
                              <TableRow key={category}>
                                <TableCell>
                                  <Input
                                    value={category}
                                    onChange={(e) => {
                                      const newCategory = e.target.value;
                                      const { [category]: value, ...rest } = agePricing;
                                      setAgePricing({ ...rest, [newCategory]: value });
                                    }}
                                    placeholder="e.g. adult"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={details.age_range}
                                    onChange={(e) => {
                                      setAgePricing({
                                        ...agePricing,
                                        [category]: { ...details, age_range: e.target.value },
                                      });
                                    }}
                                    placeholder="e.g. 13+"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={details.cost}
                                    onChange={(e) => {
                                      setAgePricing({
                                        ...agePricing,
                                        [category]: {
                                          ...details,
                                          cost: parseFloat(e.target.value) || 0,
                                        },
                                      });
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={details.notes || ""}
                                    onChange={(e) => {
                                      setAgePricing({
                                        ...agePricing,
                                        [category]: { ...details, notes: e.target.value },
                                      });
                                    }}
                                    placeholder="Optional notes"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const { [category]: _, ...rest } = agePricing;
                                      setAgePricing(rest);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAgeCategory}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Age Category
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Extras & Add-ons */}
                <AccordionItem value="extras">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      Extras & Add-ons
                      {Object.keys(extras).length > 0 && (
                        <Badge variant="secondary">
                          {Object.keys(extras).length} extras
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        Additional items and supplements
                      </p>

                      {Object.keys(extras).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(extras).map(([extra, cost]) => (
                            <div key={extra} className="flex items-center gap-2">
                              <Input
                                value={extra}
                                onChange={(e) => {
                                  const newExtra = e.target.value;
                                  const { [extra]: value, ...rest } = extras;
                                  setExtras({ ...rest, [newExtra]: value });
                                }}
                                placeholder="Extra name"
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => {
                                  setExtras({
                                    ...extras,
                                    [extra]: parseFloat(e.target.value) || 0,
                                  });
                                }}
                                placeholder="Cost"
                                className="w-32"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const { [extra]: _, ...rest } = extras;
                                  setExtras(rest);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExtra}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Extra
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Inclusions & Exclusions */}
                <AccordionItem value="inclusions">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      Inclusions & Exclusions
                      {(includes.length > 0 || excludes.length > 0) && (
                        <Badge variant="secondary">
                          {includes.length + excludes.length} items
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {/* Inclusions */}
                      <div className="space-y-2">
                        <Label>Included</Label>
                        {includes.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newIncludes = [...includes];
                                newIncludes[idx] = e.target.value;
                                setIncludes(newIncludes);
                              }}
                              placeholder="e.g. Breakfast included"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setIncludes(includes.filter((_, i) => i !== idx));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIncludes([...includes, ""])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Inclusion
                        </Button>
                      </div>

                      {/* Exclusions */}
                      <div className="space-y-2">
                        <Label>Excluded</Label>
                        {excludes.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              value={item}
                              onChange={(e) => {
                                const newExcludes = [...excludes];
                                newExcludes[idx] = e.target.value;
                                setExcludes(newExcludes);
                              }}
                              placeholder="e.g. City tax"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setExcludes(excludes.filter((_, i) => i !== idx));
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setExcludes([...excludes, ""])}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Exclusion
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : mode === "add" ? "Create Rate" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
