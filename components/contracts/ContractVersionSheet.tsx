"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign, 
  Percent,
  Target,
  Shield,
  TrendingDown
} from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { createContractVersion, updateContractVersion, getContractVersionById } from "@/app/contracts/versions/actions";
import { toast } from "sonner";

type ContractVersionFormData = {
  contract_id: bigint;
  valid_from: Date;
  valid_to: Date;
  cancellation_policy?: Record<string, any>;
  payment_policy?: Record<string, any>;
  terms?: Record<string, any>;
  commission_rate?: number;
  currency: string;
  booking_cutoff_days?: number;
  // Attrition fields
  attrition_applies: boolean;
  committed_quantity?: number;
  minimum_pickup_percent?: number;
  penalty_calculation?: string;
  grace_allowance?: number;
  attrition_period_type?: string;
};

type Props = {
  trigger: React.ReactNode;
  contractId: bigint;
  versionId?: bigint;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ContractVersionSheet({ trigger, contractId, versionId, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!versionId;
  
  // Initial form data
  const initialFormData: ContractVersionFormData = {
    contract_id: contractId,
    valid_from: new Date(),
    valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    currency: "USD",
    attrition_applies: false
  };

  // Load contract version data when editing
  const [versionData, setVersionData] = useState<ContractVersionFormData | null>(null);
  
  useEffect(() => {
    if (isEditing && isOpen && versionId) {
      const loadVersion = async () => {
        try {
          const version = await getContractVersionById(versionId);
          if (version) {
            setVersionData({
              contract_id: version.contract_id,
              valid_from: new Date(version.valid_from),
              valid_to: new Date(version.valid_to),
              cancellation_policy: version.cancellation_policy,
              payment_policy: version.payment_policy,
              terms: version.terms,
              commission_rate: version.commission_rate,
              currency: version.currency,
              booking_cutoff_days: version.booking_cutoff_days,
              attrition_applies: version.attrition_applies,
              committed_quantity: version.committed_quantity,
              minimum_pickup_percent: version.minimum_pickup_percent,
              penalty_calculation: version.penalty_calculation,
              grace_allowance: version.grace_allowance,
              attrition_period_type: version.attrition_period_type
            });
          }
        } catch (error) {
          toast.error("Failed to load contract version details");
          console.error("Error loading version:", error);
        }
      };
      loadVersion();
    }
  }, [isEditing, isOpen, versionId]);

  const validateForm = (values: ContractVersionFormData): boolean => {
    const newErrors: Record<string, string> = {};

    // Date validation
    if (values.valid_to <= values.valid_from) {
      newErrors.valid_to = "End date must be after start date";
    }

    // Attrition validation
    if (values.attrition_applies) {
      if (!values.committed_quantity || values.committed_quantity <= 0) {
        newErrors.committed_quantity = "Committed quantity is required when attrition applies";
      }
      if (!values.minimum_pickup_percent || values.minimum_pickup_percent < 0 || values.minimum_pickup_percent > 100) {
        newErrors.minimum_pickup_percent = "Minimum pickup percent must be between 0 and 100";
      }
      if (!values.penalty_calculation) {
        newErrors.penalty_calculation = "Penalty calculation is required when attrition applies";
      }
      if (!values.attrition_period_type) {
        newErrors.attrition_period_type = "Attrition period type is required when attrition applies";
      }
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
            {isEditing ? "Edit Contract Version" : "Create Contract Version"}
          </div>
        }
        description="Manage contract version details, policies, and attrition tracking"
        initial={versionData || initialFormData}
        onSubmit={async (values) => {
          if (!validateForm(values)) {
            toast.error("Please fix the errors below");
            return;
          }

          const payload = {
            contract_id: values.contract_id,
            valid_from: values.valid_from,
            valid_to: values.valid_to,
            cancellation_policy: values.cancellation_policy,
            payment_policy: values.payment_policy,
            terms: values.terms,
            commission_rate: values.commission_rate,
            currency: values.currency,
            booking_cutoff_days: values.booking_cutoff_days,
            attrition_applies: values.attrition_applies,
            committed_quantity: values.committed_quantity,
            minimum_pickup_percent: values.minimum_pickup_percent,
            penalty_calculation: values.penalty_calculation,
            grace_allowance: values.grace_allowance,
            attrition_period_type: values.attrition_period_type
          };

          if (isEditing && versionId) {
            await updateContractVersion(versionId, payload, { redirect: false });
            toast.success("Contract version updated successfully");
          } else {
            await createContractVersion(payload, { redirect: false });
            toast.success("Contract version created successfully");
          }

          onSuccess?.();
        }}
        afterSubmit={() => setIsOpen(false)}
      >
        {({ values, set }) => (
          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Valid From *
                </Label>
                <Input
                  type="date"
                  value={values.valid_from.toISOString().split('T')[0]}
                  onChange={(e) => set('valid_from', new Date(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Valid To *
                </Label>
                <Input
                  type="date"
                  value={values.valid_to.toISOString().split('T')[0]}
                  onChange={(e) => set('valid_to', new Date(e.target.value))}
                />
                {hasAttemptedSubmit && errors.valid_to && (
                  <p className="text-sm text-destructive">{errors.valid_to}</p>
                )}
              </div>
            </div>

            {/* Commission Rate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Commission Rate (%)
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Commission rate for commissionable contracts (0-100%)</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={values.commission_rate || ""}
                onChange={(e) => set('commission_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="15.5"
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Currency
              </Label>
              <Select
                value={values.currency}
                onValueChange={(value) => set('currency', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Booking Cutoff */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Booking Cutoff (Days)
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Days before travel to cut off bookings</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                min="1"
                value={values.booking_cutoff_days || ""}
                onChange={(e) => set('booking_cutoff_days', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="7"
              />
            </div>

            {/* Attrition Section */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Attrition Tracking</h3>
              </div>

              {/* Attrition Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="attrition_applies"
                  checked={values.attrition_applies}
                  onCheckedChange={(checked) => set('attrition_applies', checked)}
                />
                <Label htmlFor="attrition_applies" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Attrition tracking applies to this contract version
                </Label>
              </div>

              {values.attrition_applies && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  {/* Committed Quantity */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Committed Quantity *
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total committed quantity (e.g., 100 rooms, 50 seats)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={values.committed_quantity || ""}
                      onChange={(e) => set('committed_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="100"
                    />
                    {hasAttemptedSubmit && errors.committed_quantity && (
                      <p className="text-sm text-destructive">{errors.committed_quantity}</p>
                    )}
                  </div>

                  {/* Minimum Pickup Percent */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Minimum Pickup %
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimum percentage to avoid penalties (e.g., 80%)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={values.minimum_pickup_percent || ""}
                      onChange={(e) => set('minimum_pickup_percent', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="80"
                    />
                    {hasAttemptedSubmit && errors.minimum_pickup_percent && (
                      <p className="text-sm text-destructive">{errors.minimum_pickup_percent}</p>
                    )}
                  </div>

                  {/* Penalty Calculation */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Penalty Calculation *
                    </Label>
                    <Select
                      value={values.penalty_calculation || ""}
                      onValueChange={(value) => set('penalty_calculation', value === "" ? undefined : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select penalty calculation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pay_for_unused">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-red-600" />
                            Pay for Unused
                          </div>
                        </SelectItem>
                        <SelectItem value="sliding_scale">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-orange-600" />
                            Sliding Scale
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed_fee">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-600" />
                            Fixed Fee
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {hasAttemptedSubmit && errors.penalty_calculation && (
                      <p className="text-sm text-destructive">{errors.penalty_calculation}</p>
                    )}
                  </div>

                  {/* Grace Allowance */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Grace Allowance
                      <Tooltip>
                        <TooltipTrigger>
                          <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Units allowed to miss before penalties apply</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={values.grace_allowance || ""}
                      onChange={(e) => set('grace_allowance', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="5"
                    />
                  </div>

                  {/* Attrition Period Type */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Period Type *
                    </Label>
                    <Select
                      value={values.attrition_period_type || ""}
                      onValueChange={(value) => set('attrition_period_type', value === "" ? undefined : value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select period type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            Monthly
                          </div>
                        </SelectItem>
                        <SelectItem value="seasonal">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            Seasonal
                          </div>
                        </SelectItem>
                        <SelectItem value="event">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-600" />
                            Event
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {hasAttemptedSubmit && errors.attrition_period_type && (
                      <p className="text-sm text-destructive">{errors.attrition_period_type}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}