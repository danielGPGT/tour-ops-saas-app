"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SheetForm } from "@/components/ui/SheetForm";
import { z } from "zod";
import { createSupplier, updateSupplier } from "@/app/suppliers/actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Building2, Globe, Info, CheckCircle2, Clock } from "lucide-react";

type Props = {
  trigger: React.ReactNode;
  supplier?: { id: bigint; name: string; channels?: string[]; status?: string; terms?: any };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SupplierSheet({ trigger, supplier, open: controlledOpen, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [name, setName] = React.useState(supplier?.name ?? "");
  const [b2c, setB2c] = React.useState<boolean>((supplier?.channels ?? []).includes("b2c"));
  const [b2b, setB2b] = React.useState<boolean>((supplier?.channels ?? []).includes("b2b"));
  const [status, setStatus] = React.useState<boolean>(supplier?.status === "active");
  const [terms, setTerms] = React.useState<any>(supplier?.terms || {});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = React.useState(false);
  const isEdit = Boolean(supplier);

  React.useEffect(() => {
    setName(supplier?.name ?? "");
    setB2c((supplier?.channels ?? []).includes("b2c"));
    setB2b((supplier?.channels ?? []).includes("b2b"));
    setStatus(supplier?.status === "active");
    setTerms(supplier?.terms || {});
    setHasAttemptedSubmit(false); // Reset validation state when form opens
  }, [supplier, open]);

  return (
    <TooltipProvider>
      <SheetForm
        trigger={trigger}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isEdit ? "Edit Supplier" : "New Supplier"}
          </div>
        }
        description="Provide basic supplier details and distribution channels."
        initial={{ name, b2c, b2b, status }}
        submitLabel={isEdit ? 'Save changes' : 'Create supplier'}
        open={open}
        onOpenChange={setOpen}
        onSubmit={async (values: any) => {
          // Mark that user has attempted to submit
          setHasAttemptedSubmit(true);
          
          // Enhanced validation for required name
          const schema = z.object({ 
            name: z.string().min(1, 'Supplier name is required').min(2, 'Name must be at least 2 characters long').trim(),
            b2c: z.boolean(),
            b2b: z.boolean()
          });
          const parsed = schema.safeParse({ 
            name: values.name,
            b2c: values.b2c,
            b2b: values.b2b
          });
          if (!parsed.success) throw new Error(parsed.error.issues[0]?.message);
          
          // Build channels array from checkboxes
          const channels = [];
          if (values.b2c) channels.push('b2c');
          if (values.b2b) channels.push('b2b');
          
          // Validate at least one channel is selected
          if (channels.length === 0) {
            throw new Error('At least one distribution channel is required');
          }
          
          const payload = { 
            name: values.name.trim(), // Trim whitespace
            channels,
            status: (values.status ? 'active' : 'inactive') as 'active' | 'inactive',
            terms: terms
          };
          if (isEdit && supplier) await updateSupplier(supplier.id, payload, { redirect: false });
          else await createSupplier(payload, { redirect: false });
        }}
      >
        {({ values, set }) => (
          <div className="space-y-6">
            {/* Information Section */}


            <div className="grid gap-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Supplier Name
                    <span className="text-red-500">*</span>
                    <Tooltip>
                      <TooltipTrigger>
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Enter the supplier's business name (required)</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    id="name"
                    value={values.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g., DirectEvents, Hotel Paradise, Tour Company"
                    className="text-base"
                    required
                  />
                  {hasAttemptedSubmit && !values.name && (
                    <p className="text-sm text-red-600">Supplier name is required</p>
                  )}
                </div>
            
            <div className="grid gap-3">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Distribution Channels
                <span className="text-red-500">*</span>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select at least one distribution channel (required)</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="b2c"
                    checked={values.b2c}
                    onCheckedChange={(checked) => set('b2c', Boolean(checked))}
                  />
                  <Label htmlFor="b2c" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    B2C (Business to Consumer)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="b2b"
                    checked={values.b2b}
                    onCheckedChange={(checked) => set('b2b', Boolean(checked))}
                  />
                  <Label htmlFor="b2b" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    B2B (Business to Business)
                  </Label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Select the distribution channels this supplier uses
              </p>
              {hasAttemptedSubmit && !values.b2c && !values.b2b && (
                <p className="text-sm text-red-600">At least one distribution channel is required</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Status
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle to set supplier as active or inactive</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch
                  id="status"
                  checked={values.status}
                  onCheckedChange={(checked) => set('status', checked)}
                />
                <div className="flex items-center gap-2">
                  {values.status ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Active</span>
                      <span className="text-xs text-muted-foreground">Supplier is active and available</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Inactive</span>
                      <span className="text-xs text-muted-foreground">Supplier is temporarily disabled</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Terms Section */}
            <div className="grid gap-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Contact Information
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Primary contact details for this supplier</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@supplier.com"
                value={terms.contact_email || ""}
                onChange={(e) => setTerms({...terms, contact_email: e.target.value})}
              />
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={terms.contact_phone || ""}
                onChange={(e) => setTerms({...terms, contact_phone: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="special_requirements" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Special Requirements
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Any special requirements or notes for this supplier</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <textarea
                id="special_requirements"
                placeholder="e.g., Minimum 48-hour notice required, Weekend surcharges apply, etc."
                value={terms.special_requirements || ""}
                onChange={(e) => setTerms({...terms, special_requirements: e.target.value})}
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {isEdit && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Editing supplier ID: {supplier?.id.toString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}


