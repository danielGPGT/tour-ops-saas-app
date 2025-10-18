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
import { FileText, Building2, Calendar, DollarSign, AlertCircle } from "lucide-react";

const contractSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  reference: z.string().min(1, "Contract reference is required"),
  status: z.enum(["draft", "active", "suspended", "expired"]),
  // Contract version fields
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_to: z.string().min(1, "Valid to date is required"),
  // Payment policy
  deposit_percentage: z.string().optional(),
  balance_days: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  // Cancellation policy
  free_cancellation_hours: z.string().optional(),
  late_cancellation_hours: z.string().optional(),
  no_show_charge: z.string().optional(),
  // Terms
  commission_rate: z.string().optional(),
  allocation_quantity: z.string().optional(),
  room_types: z.string().optional(),
  min_stay: z.string().optional(),
});

type ContractFormData = z.infer<typeof contractSchema>;

export interface ContractSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Array<{
    id: bigint;
    name: string;
    status: string;
  }>;
  contract?: any;
  onSuccess: () => void;
}

export function ContractSheet({
  open,
  onOpenChange,
  suppliers,
  contract,
  onSuccess
}: ContractSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      supplier_id: contract?.supplier_id?.toString() || "",
      reference: contract?.reference || "",
      status: contract?.status || "draft",
      valid_from: contract?.contract_versions?.[0]?.valid_from || "",
      valid_to: contract?.contract_versions?.[0]?.valid_to || "",
      deposit_percentage: contract?.contract_versions?.[0]?.payment_policy?.deposit || "",
      balance_days: contract?.contract_versions?.[0]?.payment_policy?.balance_days || "",
      currency: contract?.contract_versions?.[0]?.payment_policy?.currency || "GBP",
      free_cancellation_hours: contract?.contract_versions?.[0]?.cancellation_policy?.free_cancellation_hours || "",
      late_cancellation_hours: contract?.contract_versions?.[0]?.cancellation_policy?.late_cancellation_hours || "",
      no_show_charge: contract?.contract_versions?.[0]?.cancellation_policy?.no_show_charge || "",
      commission_rate: contract?.contract_versions?.[0]?.terms?.commission_rate || "",
      allocation_quantity: contract?.contract_versions?.[0]?.terms?.allocation_quantity || "",
      room_types: contract?.contract_versions?.[0]?.terms?.room_types || "",
      min_stay: contract?.contract_versions?.[0]?.terms?.min_stay || "",
    }
  });

  const onSubmit = async (data: ContractFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create/update the contract
      console.log('Contract data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
    } catch (error) {
      console.error('Error saving contract:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSupplier = suppliers.find(s => s.id.toString() === form.watch('supplier_id'));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {contract ? 'Edit Contract' : 'New Contract'}
          </SheetTitle>
          <SheetDescription>
            {contract 
              ? 'Update contract details and terms'
              : 'Create a new contract with a supplier'
            }
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Contract details and supplier information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contract Reference</FormLabel>
                        <FormControl>
                          <Input placeholder="CONTRACT-2024-001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Unique identifier for this contract
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Contract Period
                </CardTitle>
                <CardDescription>
                  Validity period for this contract version
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

            {/* Payment Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4" />
                  Payment Policy
                </CardTitle>
                <CardDescription>
                  Payment terms and conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="deposit_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit %</FormLabel>
                        <FormControl>
                          <Input placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="balance_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Balance Days</FormLabel>
                        <FormControl>
                          <Input placeholder="30" {...field} />
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
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Cancellation Policy
                </CardTitle>
                <CardDescription>
                  Cancellation terms and conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="free_cancellation_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Cancellation (hours)</FormLabel>
                        <FormControl>
                          <Input placeholder="48" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="late_cancellation_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Cancellation (hours)</FormLabel>
                        <FormControl>
                          <Input placeholder="24" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="no_show_charge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No Show Charge %</FormLabel>
                        <FormControl>
                          <Input placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contract Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Contract Terms
                </CardTitle>
                <CardDescription>
                  Specific terms for this contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="commission_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commission Rate %</FormLabel>
                        <FormControl>
                          <Input placeholder="15" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allocation_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allocation Quantity</FormLabel>
                        <FormControl>
                          <Input placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="room_types"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Types</FormLabel>
                        <FormControl>
                          <Input placeholder="twin, double, suite" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_stay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stay (nights)</FormLabel>
                        <FormControl>
                          <Input placeholder="2" {...field} />
                        </FormControl>
                        <FormMessage />
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
                {isSubmitting ? 'Saving...' : contract ? 'Update Contract' : 'Create Contract'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
