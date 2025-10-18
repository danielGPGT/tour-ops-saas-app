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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, DollarSign, AlertCircle, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

const versionSchema = z.object({
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

type VersionFormData = z.infer<typeof versionSchema>;

export interface ContractVersionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: any;
  onSuccess: () => void;
}

export function ContractVersionSheet({
  open,
  onOpenChange,
  contract,
  onSuccess
}: ContractVersionSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [versions, setVersions] = React.useState(contract?.contract_versions || []);

  const form = useForm<VersionFormData>({
    resolver: zodResolver(versionSchema),
    defaultValues: {
      valid_from: "",
      valid_to: "",
      deposit_percentage: "",
      balance_days: "",
      currency: "GBP",
      free_cancellation_hours: "",
      late_cancellation_hours: "",
      no_show_charge: "",
      commission_rate: "",
      allocation_quantity: "",
      room_types: "",
      min_stay: "",
    }
  });

  const onSubmit = async (data: VersionFormData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create a new contract version
      console.log('Version data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to local state for demo
      const newVersion = {
        id: Date.now(),
        valid_from: data.valid_from,
        valid_to: data.valid_to,
        cancellation_policy: {
          free_cancellation_hours: data.free_cancellation_hours,
          late_cancellation_hours: data.late_cancellation_hours,
          no_show_charge: data.no_show_charge,
        },
        payment_policy: {
          deposit_percentage: data.deposit_percentage,
          balance_days: data.balance_days,
          currency: data.currency,
        },
        terms: {
          commission_rate: data.commission_rate,
          allocation_quantity: data.allocation_quantity,
          room_types: data.room_types,
          min_stay: data.min_stay,
        }
      };
      
      setVersions([...versions, newVersion]);
      form.reset();
      
      onSuccess();
    } catch (error) {
      console.error('Error saving version:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVersionStatus = (version: any) => {
    const now = new Date();
    const from = new Date(version.valid_from);
    const to = new Date(version.valid_to);
    
    if (from > now) return { label: 'Future', variant: 'secondary' as const };
    if (to < now) return { label: 'Expired', variant: 'destructive' as const };
    return { label: 'Current', variant: 'default' as const };
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:w-[900px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Versions
          </SheetTitle>
          <SheetDescription>
            Manage contract versions for {contract?.reference || 'this contract'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Existing Versions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Existing Versions
              </CardTitle>
              <CardDescription>
                Current and historical contract versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {versions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version: any, index: number) => {
                      const status = getVersionStatus(version);
                      return (
                        <TableRow key={version.id || index}>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {format(new Date(version.valid_from), "MMM d, yyyy")}
                              </div>
                              <div className="text-muted-foreground">
                                to {format(new Date(version.valid_to), "MMM d, yyyy")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {version.terms?.commission_rate || '—'}%
                          </TableCell>
                          <TableCell>
                            {version.terms?.allocation_quantity || '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No versions found
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Version */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4" />
                Add New Version
              </CardTitle>
              <CardDescription>
                Create a new contract version with updated terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Version Period */}
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

                  {/* Payment Policy */}
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

                  {/* Contract Terms */}
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

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Clear
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Adding...' : 'Add Version'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
