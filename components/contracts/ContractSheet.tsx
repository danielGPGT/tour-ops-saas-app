"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Clock, AlertCircle, FileText, Building2, Calendar, DollarSign, Percent } from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { createContract, updateContract, getContractById } from "@/app/contracts/actions";
import { toast } from "sonner";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
};

type ContractFormData = {
  supplier_id: bigint;
  reference: string;
  status: string;
  contract_type?: string;
  signed_date?: Date;
  notes?: string;
};

type Props = {
  trigger: React.ReactNode;
  contractId?: bigint;
  suppliers: Supplier[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ContractSheet({ trigger, contractId, suppliers, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!contractId;
  
  // Initial form data
  const initialFormData: ContractFormData = {
    supplier_id: suppliers[0]?.id || BigInt(0),
    reference: "",
    status: "active",
    contract_type: undefined,
    signed_date: undefined,
    notes: ""
  };

  // Load contract data when editing - we'll handle this in the SheetForm initial prop
  const [contractData, setContractData] = useState<ContractFormData | null>(null);
  
  useEffect(() => {
    if (isEditing && isOpen && contractId) {
      const loadContract = async () => {
        try {
          const contract = await getContractById(contractId);
          if (contract) {
            setContractData({
              supplier_id: contract.supplier_id,
              reference: contract.reference,
              status: contract.status,
              contract_type: contract.contract_type,
              signed_date: contract.signed_date ? new Date(contract.signed_date) : undefined,
              notes: contract.notes
            });
          }
        } catch (error) {
          toast.error("Failed to load contract details");
          console.error("Error loading contract:", error);
        }
      };
      loadContract();
    }
  }, [isEditing, isOpen, contractId]);

  const validateForm = (values: ContractFormData): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!values.supplier_id || values.supplier_id === BigInt(0)) {
      newErrors.supplier_id = "Supplier is required";
    }

    if (!values.reference.trim()) {
      newErrors.reference = "Contract reference is required";
    } else if (values.reference.trim().length < 2) {
      newErrors.reference = "Reference must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <TooltipProvider>
      <SheetForm
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={trigger}
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {isEditing ? "Edit Contract" : "Create Contract"}
          </div>
        }
        description="Manage contract details and terms"
        initial={contractData || initialFormData}
        onSubmit={async (values) => {
          if (!validateForm(values)) {
            toast.error("Please fix the errors below");
            return;
          }

          const payload = {
            supplier_id: values.supplier_id,
            reference: values.reference.trim(),
            status: values.status,
            contract_type: values.contract_type,
            signed_date: values.signed_date,
            notes: values.notes
          };

          if (isEditing && contractId) {
            await updateContract(contractId, payload, { redirect: false });
            toast.success("Contract updated successfully");
          } else {
            await createContract(payload, { redirect: false });
            toast.success("Contract created successfully");
          }

          onSuccess?.();
        }}
        afterSubmit={() => setIsOpen(false)}
      >
        {({ values, set }) => (
          <div className="space-y-6">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supplier *
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select the supplier for this contract</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              value={values.supplier_id.toString()}
              onValueChange={(value) => set('supplier_id', BigInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter(supplier => supplier.status === "active")
                  .map((supplier) => (
                    <SelectItem key={supplier.id.toString()} value={supplier.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {supplier.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {hasAttemptedSubmit && errors.supplier_id && (
              <p className="text-sm text-destructive">{errors.supplier_id}</p>
            )}
          </div>

          {/* Contract Reference */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contract Reference *
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Unique reference for this contract (e.g., "CONTRACT-2024-001")</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              value={values.reference}
              onChange={(e) => set('reference', e.target.value)}
              placeholder="CONTRACT-2024-001"
              className={hasAttemptedSubmit && errors.reference ? "border-destructive" : ""}
            />
            {hasAttemptedSubmit && errors.reference && (
              <p className="text-sm text-destructive">{errors.reference}</p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Contract Status
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Set the current status of this contract</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            
            <div className="space-y-2">
              <Select
                value={values.status}
                onValueChange={(value) => set('status', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="draft">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Draft
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Inactive
                    </div>
                  </SelectItem>
                  <SelectItem value="expired">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      Expired
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {values.status === "active" && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Active Contract</span>
                      <span className="text-xs text-muted-foreground">Contract is active and available for use</span>
                    </>
                  )}
                  {values.status === "draft" && (
                    <>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Draft Contract</span>
                      <span className="text-xs text-muted-foreground">Contract is in draft status</span>
                    </>
                  )}
                  {values.status === "inactive" && (
                    <>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Inactive Contract</span>
                      <span className="text-xs text-muted-foreground">Contract is temporarily disabled</span>
                    </>
                  )}
                  {values.status === "expired" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Expired Contract</span>
                      <span className="text-xs text-muted-foreground">Contract has expired</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contract Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Contract Type
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Type of contract affects pricing calculation</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              value={values.contract_type || ""}
              onValueChange={(value) => set('contract_type', value === "" ? undefined : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="net_rate">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Net Rate
                  </div>
                </SelectItem>
                <SelectItem value="commissionable">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-blue-600" />
                    Commissionable
                  </div>
                </SelectItem>
                <SelectItem value="allocation">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Allocation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signed Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Signed Date
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Date when contract was actually executed</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              type="date"
              value={values.signed_date ? values.signed_date.toISOString().split('T')[0] : ""}
              onChange={(e) => set('signed_date', e.target.value ? new Date(e.target.value) : undefined)}
              placeholder="Select signed date"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Additional notes and terms for this contract</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Textarea
              value={values.notes || ""}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Enter contract notes and terms..."
              rows={3}
            />
          </div>

          {/* Supplier Info */}
          {suppliers.find(s => s.id === values.supplier_id) && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Selected Supplier</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{suppliers.find(s => s.id === values.supplier_id)?.name}</p>
                <p className="text-xs text-muted-foreground">
                  Channels: {(suppliers.find(s => s.id === values.supplier_id)?.channels || []).join(", ") || "None"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: {suppliers.find(s => s.id === values.supplier_id)?.status || "Unknown"}
                </p>
              </div>
            </div>
          )}

          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}
