"use client";

import React, { useState, useEffect } from "react";
import { Calendar, FileText, AlertCircle, Building2, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SheetForm } from "@/components/ui/SheetForm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { createContractVersion, updateContractVersion, getContractVersionById } from "@/app/contracts/versions/actions";
import { toast } from "sonner";

type ContractVersionFormData = {
  contract_id: bigint;
  valid_from: string;
  valid_to: string;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
  supersedes_id?: bigint;
};

type ContractVersion = {
  id: bigint;
  contract_id: bigint;
  valid_from: Date;
  valid_to: Date;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
  supersedes_id?: bigint;
  created_at: Date;
  updated_at: Date;
};

type Contract = {
  id: bigint;
  reference: string;
  suppliers: {
    id: bigint;
    name: string;
  };
};

type Props = {
  trigger: React.ReactNode;
  contractId: bigint;
  contractVersionId?: bigint;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ContractVersionSheet({ 
  trigger, 
  contractId, 
  contractVersionId, 
  open, 
  onOpenChange, 
  onSuccess 
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contract, setContract] = useState<Contract | null>(null);

  const isEditing = !!contractVersionId;

  const initialFormData: ContractVersionFormData = {
    contract_id: contractId,
    valid_from: "",
    valid_to: "",
    cancellation_policy: {},
    payment_policy: {},
    terms: {},
    supersedes_id: undefined
  };

  const [versionData, setVersionData] = useState<ContractVersionFormData | null>(null);

  // Load contract and version data
  useEffect(() => {
    if (isOpen && contractId) {
      const loadData = async () => {
        try {
          if (isEditing && contractVersionId) {
            const version = await getContractVersionById(contractVersionId);
            if (version) {
              setContract({
                id: version.contracts.id,
                reference: version.contracts.reference,
                suppliers: version.contracts.suppliers
              });
              
              setVersionData({
                contract_id: version.contract_id,
                valid_from: version.valid_from.toISOString().split('T')[0],
                valid_to: version.valid_to.toISOString().split('T')[0],
                cancellation_policy: version.cancellation_policy as Record<string, any>,
                payment_policy: version.payment_policy as Record<string, any>,
                terms: version.terms as Record<string, any>,
                supersedes_id: version.supersedes_id
              });
            }
          } else {
            // For new versions, set default date range (today to 1 year from now)
            const today = new Date();
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(today.getFullYear() + 1);
            
            setVersionData({
              ...initialFormData,
              valid_from: today.toISOString().split('T')[0],
              valid_to: oneYearFromNow.toISOString().split('T')[0]
            });
            
            // Load contract info for display
            // Note: In a real app, you'd fetch this from the contracts API
            setContract({
              id: contractId,
              reference: `Contract-${contractId}`,
              suppliers: { id: BigInt(1), name: "Sample Supplier" }
            });
          }
        } catch (error) {
          toast.error("Failed to load contract version details");
          console.error("Error loading data:", error);
        }
      };
      loadData();
    }
  }, [isOpen, contractId, contractVersionId, isEditing]);

  const validateForm = (values: ContractVersionFormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.valid_from.trim()) {
      newErrors.valid_from = "Valid from date is required";
    }

    if (!values.valid_to.trim()) {
      newErrors.valid_to = "Valid to date is required";
    }

    if (values.valid_from && values.valid_to) {
      const fromDate = new Date(values.valid_from);
      const toDate = new Date(values.valid_to);
      
      if (fromDate >= toDate) {
        newErrors.valid_to = "Valid to date must be after valid from date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (values: ContractVersionFormData) => {
    setHasAttemptedSubmit(true);
    
    if (!validateForm(values)) {
      toast.error("Please fix the errors below");
      return;
    }

    const payload = {
      contract_id: values.contract_id,
      valid_from: values.valid_from.trim(),
      valid_to: values.valid_to.trim(),
      cancellation_policy: values.cancellation_policy,
      payment_policy: values.payment_policy,
      terms: values.terms,
      supersedes_id: values.supersedes_id
    };

    try {
      if (isEditing && contractVersionId) {
        await updateContractVersion(contractVersionId, payload, { redirect: false });
        toast.success("Contract version updated successfully");
      } else {
        await createContractVersion(payload, { redirect: false });
        toast.success("Contract version created successfully");
      }
      
      onSuccess?.();
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contract version");
    }
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
            {isEditing ? "Edit Contract Version" : "Create Contract Version"}
          </div>
        }
        description="Manage contract version details and effective dates"
        initial={versionData || initialFormData}
        onSubmit={handleSubmit}
        afterSubmit={() => setIsOpen(false)}
      >
        {({ values, set }) => (
          <div className="space-y-6">
            {/* Contract Info */}
            {contract && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Contract</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{contract.reference}</p>
                  <p className="text-xs text-muted-foreground">
                    Supplier: {contract.suppliers.name}
                  </p>
                </div>
              </div>
            )}

            {/* Valid From Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Valid From *
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Date when this contract version becomes effective</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="date"
                value={values.valid_from}
                onChange={(e) => set('valid_from', e.target.value)}
                className={hasAttemptedSubmit && errors.valid_from ? "border-destructive" : ""}
              />
              {hasAttemptedSubmit && errors.valid_from && (
                <p className="text-sm text-destructive">{errors.valid_from}</p>
              )}
            </div>

            {/* Valid To Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Valid To *
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Date when this contract version expires</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="date"
                value={values.valid_to}
                onChange={(e) => set('valid_to', e.target.value)}
                className={hasAttemptedSubmit && errors.valid_to ? "border-destructive" : ""}
              />
              {hasAttemptedSubmit && errors.valid_to && (
                <p className="text-sm text-destructive">{errors.valid_to}</p>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Cancellation Policy
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Terms and conditions for cancellations</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                value={JSON.stringify(values.cancellation_policy, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    set('cancellation_policy', parsed);
                  } catch {
                    // Invalid JSON, keep as is for now
                  }
                }}
                placeholder='{"free_cancellation_days": 7, "cancellation_fee_percent": 10}'
                className="min-h-[100px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Enter cancellation policy as JSON (e.g., free cancellation days, fees, etc.)
              </p>
            </div>

            {/* Payment Policy */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Payment Policy
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Payment terms and conditions</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                value={JSON.stringify(values.payment_policy, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    set('payment_policy', parsed);
                  } catch {
                    // Invalid JSON, keep as is for now
                  }
                }}
                placeholder='{"deposit_percent": 20, "final_payment_days": 30}'
                className="min-h-[100px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Enter payment policy as JSON (e.g., deposit requirements, payment terms, etc.)
              </p>
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Terms & Conditions
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Additional terms and conditions</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Textarea
                value={JSON.stringify(values.terms, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    set('terms', parsed);
                  } catch {
                    // Invalid JSON, keep as is for now
                  }
                }}
                placeholder='{"liability_limits": 100000, "insurance_required": true}'
                className="min-h-[100px] font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Enter terms and conditions as JSON (e.g., liability, insurance, etc.)
              </p>
            </div>

            {/* Version Status */}
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Version Status</span>
              </div>
              <div className="space-y-1">
                {values.valid_from && values.valid_to && (
                  <>
                    <p className="text-sm">
                      <span className="font-medium">Duration:</span>{" "}
                      {(() => {
                        const fromDate = new Date(values.valid_from);
                        const toDate = new Date(values.valid_to);
                        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} days`;
                      })()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{" "}
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const now = new Date();
                          const fromDate = new Date(values.valid_from);
                          const toDate = new Date(values.valid_to);
                          
                          if (now < fromDate) return "Future";
                          if (now > toDate) return "Expired";
                          return "Active";
                        })()}
                      </Badge>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}
