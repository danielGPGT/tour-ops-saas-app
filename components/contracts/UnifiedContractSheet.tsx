"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, Clock, AlertCircle, FileText, Building2, Plus, Edit, Trash2, 
  Calendar, CalendarDays, Copy, Eye, EyeOff, CreditCard, Users, Settings
} from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { createContract, updateContract, getContractById } from "@/app/contracts/actions";
import { 
  createContractVersion, updateContractVersion, deleteContractVersion, 
  duplicateContractVersion, getContractVersions 
} from "@/app/contracts/versions/actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { UniversalPolicyForm } from "./UniversalPolicyForm";

type Supplier = {
  id: number;
  name: string;
  channels?: string[];
  status?: string;
};

type ContractFormData = {
  supplier_id: number;
  reference: string;
  status: string;
};

type ContractVersion = {
  id: number;
  contract_id: number;
  valid_from: string;
  valid_to: string;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
  supersedes_id?: number;
  created_at: string;
  updated_at: string;
};

type ContractVersionFormData = {
  valid_from: string;
  valid_to: string;
  cancellation_policy: any;
  attrition_policy: any;
  payment_terms: any;
  operational_terms: any;
  rate_modifiers?: any;
  additional_terms: any;
  supersedes_id?: number;
};

type Props = {
  trigger: React.ReactNode;
  contractId?: number;
  suppliers: Supplier[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function UnifiedContractSheet({ trigger, contractId, suppliers, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("contract");
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [editingVersionId, setEditingVersionId] = useState<number | null>(null);
  const [showVersionForm, setShowVersionForm] = useState(false);

  const isEditing = !!contractId;
  
  // Initial form data
  const initialFormData: ContractFormData = {
    supplier_id: suppliers[0]?.id || 0,
    reference: "",
    status: "active"
  };

  // Load contract data when editing
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
              status: contract.status
            });
          }
          
          // Load versions
          const contractVersions = await getContractVersions(contractId);
          setVersions(contractVersions || []);
        } catch (error) {
          toast.error("Failed to load contract details");
          console.error("Error loading contract:", error);
        }
      };
      loadContract();
    }
  }, [isEditing, isOpen, contractId]);

  const validateContractForm = (values: ContractFormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.supplier_id || values.supplier_id === 0) {
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

  const validateVersionForm = (values: ContractVersionFormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!values.valid_from) {
      newErrors.valid_from = "Valid from date is required";
    }

    if (!values.valid_to) {
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

  const getVersionStatus = (version: ContractVersion) => {
    const now = new Date();
    const fromDate = new Date(version.valid_from);
    const toDate = new Date(version.valid_to);
    
    if (now < fromDate) {
      return { status: "Future", variant: "outline" as const, color: "text-blue-600" };
    }
    if (now > toDate) {
      return { status: "Expired", variant: "secondary" as const, color: "text-gray-600" };
    }
    return { status: "Active", variant: "default" as const, color: "text-green-600" };
  };

  const handleVersionSubmit = async (values: ContractVersionFormData) => {
    if (!validateVersionForm(values)) {
      toast.error("Please fix the errors below");
      return;
    }

    try {
      if (editingVersionId) {
        await updateContractVersion(editingVersionId, values, { redirect: false });
        toast.success("Contract version updated successfully");
      } else {
        if (!contractId) {
          toast.error("Contract ID is required to create a version");
          return;
        }
        await createContractVersion({ ...values, contract_id: contractId }, { redirect: false });
        toast.success("Contract version created successfully");
      }

      // Reload versions
      if (contractId) {
        const contractVersions = await getContractVersions(contractId);
        setVersions(contractVersions || []);
      }
      
      setShowVersionForm(false);
      setEditingVersionId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contract version");
    }
  };

  const handleVersionDelete = async (versionId: number) => {
    try {
      await deleteContractVersion(versionId, { redirect: false });
      toast.success("Contract version deleted successfully");
      
      // Reload versions
      if (contractId) {
        const contractVersions = await getContractVersions(contractId);
        setVersions(contractVersions || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contract version");
    }
  };

  const handleVersionDuplicate = async (versionId: number) => {
    try {
      await duplicateContractVersion(versionId, { redirect: false });
      toast.success("Contract version duplicated successfully");
      
      // Reload versions
      if (contractId) {
        const contractVersions = await getContractVersions(contractId);
        setVersions(contractVersions || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate contract version");
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
            {isEditing ? "Edit Contract & Versions" : "Create Contract"}
          </div>
        }
        description="Manage contract details and versions"
        initial={contractData || initialFormData}
        onSubmit={async (values) => {
          if (!validateContractForm(values)) {
            toast.error("Please fix the errors below");
            return;
          }

          const payload = {
            supplier_id: values.supplier_id,
            reference: values.reference.trim(),
            status: values.status
          };

          try {
            if (isEditing && contractId) {
              await updateContract(contractId, payload, { redirect: false });
              toast.success("Contract updated successfully");
            } else {
              await createContract(payload, { redirect: false });
              toast.success("Contract created successfully");
            }

            onSuccess?.();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save contract");
          }
        }}
        afterSubmit={() => setIsOpen(false)}
        className="max-w-4xl"
      >
        {({ values, set }) => (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="contract" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contract Details
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Versions ({versions.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contract" className="space-y-6">
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
                    onValueChange={(value) => set('supplier_id', parseInt(value))}
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

                {/* Status */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Contract Status
                  </Label>
                  
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
                </div>

                {/* Supplier Info */}
                {suppliers.find(s => s.id === values.supplier_id) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Selected Supplier
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="font-medium">{suppliers.find(s => s.id === values.supplier_id)?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Channels: {(suppliers.find(s => s.id === values.supplier_id)?.channels || []).join(", ") || "None"}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {suppliers.find(s => s.id === values.supplier_id)?.status || "Unknown"}
                      </Badge>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="versions" className="space-y-6">
                {!isEditing ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Save the contract first to manage versions</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Add Version Button */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">Contract Versions</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage different versions of this contract with different terms and policies
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setShowVersionForm(true);
                          setEditingVersionId(null);
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Version
                      </Button>
                    </div>

                    {/* Versions List */}
                    <div className="space-y-4">
                      {versions.length === 0 ? (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-center text-muted-foreground">
                              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No contract versions found</p>
                              <p className="text-sm">Create the first version to get started</p>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        versions.map((version) => {
                          const versionStatus = getVersionStatus(version);
                          const isLatest = versions.indexOf(version) === 0;
                          
                          return (
                            <Card key={version.id} className={isLatest ? "ring-2 ring-primary/20" : ""}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm">
                                      Version {version.id}
                                      {isLatest && (
                                        <Badge variant="default" className="ml-2 text-xs">
                                          Latest
                                        </Badge>
                                      )}
                                    </CardTitle>
                                    <Badge variant={versionStatus.variant} className={versionStatus.color}>
                                      {versionStatus.status}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingVersionId(version.id);
                                        setShowVersionForm(true);
                                      }}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleVersionDuplicate(version.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleVersionDelete(version.id)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Valid From</Label>
                                    <p className="text-sm font-medium">
                                      {format(new Date(version.valid_from), "MMM dd, yyyy")}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Valid To</Label>
                                    <p className="text-sm font-medium">
                                      {format(new Date(version.valid_to), "MMM dd, yyyy")}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {Object.keys(version.cancellation_policy).length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Cancellation Policy
                                    </Badge>
                                  )}
                                  {Object.keys(version.payment_policy).length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Payment Policy
                                    </Badge>
                                  )}
                                  {Object.keys(version.terms).length > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      Terms & Conditions
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>

                    {/* Version Form Modal */}
                    {showVersionForm && (
                      <VersionForm
                        contractId={contractId!}
                        versionId={editingVersionId}
                        onClose={() => {
                          setShowVersionForm(false);
                          setEditingVersionId(null);
                        }}
                        onSubmit={handleVersionSubmit}
                      />
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}

// Version Form Component
type VersionFormProps = {
  contractId: number;
  versionId?: number | null;
  onClose: () => void;
  onSubmit: (values: ContractVersionFormData) => void;
};

function VersionForm({ contractId, versionId, onClose, onSubmit }: VersionFormProps) {
  const [values, setValues] = useState<ContractVersionFormData>({
    valid_from: "",
    valid_to: "",
    cancellation_policy: {},
    attrition_policy: {},
    payment_terms: {},
    operational_terms: {},
    rate_modifiers: {},
    additional_terms: {}
  });
  const [showPolicyForm, setShowPolicyForm] = useState(false);

  const isEditing = !!versionId;

  const handlePolicySave = (policyData: any) => {
    setValues({
      ...values,
      cancellation_policy: policyData.cancellation_policy,
      attrition_policy: policyData.attrition_policy,
      payment_terms: policyData.payment_terms,
      operational_terms: policyData.operational_terms,
      rate_modifiers: policyData.rate_modifiers,
      additional_terms: policyData.additional_terms
    });
    setShowPolicyForm(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-sm">
          {isEditing ? "Edit Contract Version" : "Create Contract Version"}
        </CardTitle>
        <CardDescription>
          Set the validity period and policies for this contract version
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valid From *</Label>
            <Input
              type="date"
              value={values.valid_from}
              onChange={(e) => setValues({ ...values, valid_from: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Valid To *</Label>
            <Input
              type="date"
              value={values.valid_to}
              onChange={(e) => setValues({ ...values, valid_to: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Policies & Terms</Label>
              <p className="text-sm text-muted-foreground">
                Configure detailed cancellation, payment, and legal terms
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPolicyForm(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {Object.keys(values.cancellation_policy).length > 0 ? "Edit Policies" : "Configure Policies"}
            </Button>
          </div>

          {/* Policy Summary */}
          {(Object.keys(values.cancellation_policy).length > 0 || 
            Object.keys(values.payment_terms).length > 0 || 
            Object.keys(values.operational_terms).length > 0 ||
            values.attrition_policy?.enabled) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(values.cancellation_policy).length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Cancellation</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {values.cancellation_policy.rules?.length || 0} rules
                    </p>
                  </CardContent>
                </Card>
              )}
              {values.attrition_policy?.enabled && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Attrition</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min {values.attrition_policy.minimum_quantity} units
                    </p>
                  </CardContent>
                </Card>
              )}
              {Object.keys(values.payment_terms).length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Payment</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {values.payment_terms.customer?.deposit_percent || 0}% deposit
                    </p>
                  </CardContent>
                </Card>
              )}
              {Object.keys(values.operational_terms).length > 0 && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Operational</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {values.operational_terms.minimum_lead_time || "Not set"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(values)}>
            {isEditing ? "Update Version" : "Create Version"}
          </Button>
        </div>

        {/* Policy Form Modal */}
        {showPolicyForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <UniversalPolicyForm
                  initialData={{
                    cancellation_policy: values.cancellation_policy,
                    attrition_policy: values.attrition_policy,
                    payment_terms: values.payment_terms,
                    operational_terms: values.operational_terms,
                    rate_modifiers: values.rate_modifiers,
                    additional_terms: values.additional_terms
                  }}
                  onSave={handlePolicySave}
                  onCancel={() => setShowPolicyForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
