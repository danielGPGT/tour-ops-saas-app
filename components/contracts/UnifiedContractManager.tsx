"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  CheckCircle2, Clock, AlertCircle, FileText, Building2, Plus, Edit, Trash2, 
  Calendar, DollarSign, Percent, Target, Shield, TrendingDown, Copy, Eye,
  CalendarDays, CreditCard, Users, Settings, ArrowLeft, ArrowRight
} from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createContract, updateContract, getContractById } from "@/app/contracts/actions";

// Validation schemas
const contractSchema = z.object({
  supplier_id: z.bigint().min(1, "Supplier is required"),
  reference: z.string().min(1, "Contract reference is required").trim(),
  status: z.enum(["active", "inactive", "draft", "expired"]).default("active"),
  contract_type: z.enum(["net_rate", "commissionable", "allocation"]).optional(),
  signed_date: z.date().optional(),
  notes: z.string().optional(),
});

const contractVersionSchema = z.object({
  contract_id: z.bigint(),
  valid_from: z.date(),
  valid_to: z.date(),
  commission_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).default("USD"),
  booking_cutoff_days: z.number().int().positive().optional(),
  // Attrition fields
  attrition_applies: z.boolean().default(false),
  committed_quantity: z.number().int().positive().optional(),
  minimum_pickup_percent: z.number().min(0).max(100).optional(),
  penalty_calculation: z.enum(["pay_for_unused", "sliding_scale", "fixed_fee"]).optional(),
  grace_allowance: z.number().int().min(0).optional(),
  attrition_period_type: z.enum(["monthly", "seasonal", "event"]).optional(),
  // Policies
  cancellation_policy: z.record(z.any()).optional(),
  payment_policy: z.record(z.any()).optional(),
  terms: z.record(z.any()).optional(),
});
import { 
  createContractVersion, updateContractVersion, deleteContractVersion, 
  getContractVersionsByContractId 
} from "@/app/contracts/versions/actions";
import { toast } from "sonner";
import { format } from "date-fns";

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

type ContractVersionFormData = {
  contract_id: bigint;
  valid_from: Date;
  valid_to: Date;
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
  // Policies
  cancellation_policy?: Record<string, any>;
  payment_policy?: Record<string, any>;
  terms?: Record<string, any>;
};

type ContractVersion = {
  id: bigint;
  contract_id: bigint;
  valid_from: string;
  valid_to: string;
  commission_rate?: number;
  currency: string;
  booking_cutoff_days?: number;
  attrition_applies: boolean;
  committed_quantity?: number;
  minimum_pickup_percent?: number;
  penalty_calculation?: string;
  grace_allowance?: number;
  attrition_period_type?: string;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
  created_at: string;
  updated_at: string;
};

type Props = {
  trigger: React.ReactNode;
  contractId?: bigint;
  suppliers: Supplier[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
};

export function UnifiedContractManager({ trigger, contractId, suppliers, open, onOpenChange, onSuccess }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const [activeTab, setActiveTab] = useState("contract");
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [editingVersionId, setEditingVersionId] = useState<bigint | null>(null);
  const [showVersionForm, setShowVersionForm] = useState(false);

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
              status: contract.status,
              contract_type: contract.contract_type,
              signed_date: contract.signed_date ? new Date(contract.signed_date) : undefined,
              notes: contract.notes
            });
          }
          
          // Load versions
          const contractVersions = await getContractVersionsByContractId(contractId);
          setVersions(contractVersions || []);
        } catch (error) {
          toast.error("Failed to load contract details");
          console.error("Error loading contract:", error);
        }
      };
      loadContract();
    }
  }, [isEditing, isOpen, contractId]);

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
        const contractVersions = await getContractVersionsByContractId(contractId);
        setVersions(contractVersions || []);
      }
      
      setShowVersionForm(false);
      setEditingVersionId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save contract version");
    }
  };

  const handleVersionDelete = async (versionId: bigint) => {
    try {
      await deleteContractVersion(versionId, { redirect: false });
      toast.success("Contract version deleted successfully");
      
      // Reload versions
      if (contractId) {
        const contractVersions = await getContractVersionsByContractId(contractId);
        setVersions(contractVersions || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contract version");
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
        description="Manage contract details, versions, and attrition tracking"
        initial={contractData || initialFormData}
        onSubmit={async (values) => {
          const payload = {
            supplier_id: values.supplier_id,
            reference: values.reference.trim(),
            status: values.status,
            contract_type: values.contract_type,
            signed_date: values.signed_date,
            notes: values.notes
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
        className="max-w-6xl"
      >
        {({ values, set }) => (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contract" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contract Details
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Versions ({versions.length})
                </TabsTrigger>
                <TabsTrigger value="attrition" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Attrition
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contract" className="space-y-6">
                <ContractDetailsTab 
                  values={values} 
                  set={set} 
                  suppliers={suppliers}
                  isEditing={isEditing}
                />
              </TabsContent>

              <TabsContent value="versions" className="space-y-6">
                <ContractVersionsTab
                  contractId={contractId}
                  versions={versions}
                  isEditing={isEditing}
                  onEditVersion={(versionId) => {
                    setEditingVersionId(versionId);
                    setShowVersionForm(true);
                  }}
                  onDeleteVersion={handleVersionDelete}
                  onAddVersion={() => {
                    setEditingVersionId(null);
                    setShowVersionForm(true);
                  }}
                />
              </TabsContent>

              <TabsContent value="attrition" className="space-y-6">
                <AttritionOverviewTab versions={versions} />
              </TabsContent>
            </Tabs>

            {/* Version Form Modal */}
            {showVersionForm && (
              <VersionFormModal
                contractId={contractId!}
                versionId={editingVersionId}
                onClose={() => {
                  setShowVersionForm(false);
                  setEditingVersionId(null);
                }}
                onSubmit={handleVersionSubmit}
              />
            )}
          </div>
        )}
      </SheetForm>
    </TooltipProvider>
  );
}

// Contract Details Tab Component
function ContractDetailsTab({ values, set, suppliers, isEditing }: {
  values: ContractFormData;
  set: (field: keyof ContractFormData, value: any) => void;
  suppliers: Supplier[];
  isEditing: boolean;
}) {
  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: values,
  });

  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
            <CardDescription>Contract details and supplier information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Supplier *
                    </FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => {
                        field.onChange(BigInt(value));
                        set('supplier_id', BigInt(value));
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a supplier" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contract Reference *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="CONTRACT-2024-001"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          set('reference', e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Status
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        set('status', value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Contract Type
                    </FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => {
                        const newValue = value === "" ? undefined : value;
                        field.onChange(newValue);
                        set('contract_type', newValue);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="net_rate">Net Rate</SelectItem>
                        <SelectItem value="commissionable">Commissionable</SelectItem>
                        <SelectItem value="allocation">Allocation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signed_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Signed Date
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? field.value.toISOString().split('T')[0] : ""}
                        onChange={(e) => {
                          const newValue = e.target.value ? new Date(e.target.value) : undefined;
                          field.onChange(newValue);
                          set('signed_date', newValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter contract notes and terms..."
                      rows={3}
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        set('notes', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Supplier Info */}
        {suppliers.find(s => s.id === values.supplier_id) && (
          <Card>
            <CardHeader>
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
      </div>
    </Form>
  );
}

// Contract Versions Tab Component
function ContractVersionsTab({ 
  contractId, 
  versions, 
  isEditing, 
  onEditVersion, 
  onDeleteVersion, 
  onAddVersion 
}: {
  contractId?: bigint;
  versions: ContractVersion[];
  isEditing: boolean;
  onEditVersion: (versionId: bigint) => void;
  onDeleteVersion: (versionId: bigint) => void;
  onAddVersion: () => void;
}) {
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

  if (!isEditing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Save the contract first to manage versions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contract Versions</h3>
          <p className="text-sm text-muted-foreground">
            Manage different versions with varying terms, policies, and attrition settings
          </p>
        </div>
        <Button onClick={onAddVersion} className="gap-2">
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
              <Card key={version.id.toString()} className={isLatest ? "ring-2 ring-primary/20" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        Version {version.id.toString()}
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
                        onClick={() => onEditVersion(version.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteVersion(version.id)}
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {version.commission_rate && (
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{version.commission_rate}% commission</span>
                      </div>
                    )}
                    {version.currency && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{version.currency}</span>
                      </div>
                    )}
                    {version.booking_cutoff_days && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm">{version.booking_cutoff_days} days cutoff</span>
                      </div>
                    )}
                    {version.attrition_applies && (
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <span className="text-sm">Attrition tracking</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Attrition Overview Tab Component
function AttritionOverviewTab({ versions }: { versions: ContractVersion[] }) {
  const attritionVersions = versions.filter(v => v.attrition_applies);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Attrition Overview</h3>
        <p className="text-sm text-muted-foreground">
          Track committed quantities and minimum pickup requirements across all contract versions
        </p>
      </div>

      {attritionVersions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No attrition tracking configured</p>
              <p className="text-sm">Add attrition settings to contract versions to track commitments</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attritionVersions.map((version) => (
            <Card key={version.id.toString()}>
              <CardHeader>
                <CardTitle className="text-sm">Version {version.id.toString()}</CardTitle>
                <CardDescription>
                  {format(new Date(version.valid_from), "MMM dd, yyyy")} - {format(new Date(version.valid_to), "MMM dd, yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Committed Quantity</Label>
                    <p className="text-sm font-medium">{version.committed_quantity || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Minimum Pickup</Label>
                    <p className="text-sm font-medium">{version.minimum_pickup_percent || 'N/A'}%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Penalty Type</Label>
                    <p className="text-sm font-medium">{version.penalty_calculation || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Period Type</Label>
                    <p className="text-sm font-medium">{version.attrition_period_type || 'N/A'}</p>
                  </div>
                </div>
                {version.grace_allowance && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Grace Allowance</Label>
                    <p className="text-sm font-medium">{version.grace_allowance} units</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Version Form Modal Component
function VersionFormModal({ 
  contractId, 
  versionId, 
  onClose, 
  onSubmit 
}: {
  contractId: bigint;
  versionId: bigint | null;
  onClose: () => void;
  onSubmit: (values: ContractVersionFormData) => void;
}) {
  const [values, setValues] = useState<ContractVersionFormData>({
    contract_id: contractId,
    valid_from: new Date(),
    valid_to: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    currency: "USD",
    attrition_applies: false
  });

  const isEditing = !!versionId;

  const form = useForm<ContractVersionFormData>({
    resolver: zodResolver(contractVersionSchema),
    defaultValues: values,
  });

  const handleSubmit = (data: ContractVersionFormData) => {
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {isEditing ? "Edit Contract Version" : "Create Contract Version"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure version details, policies, and attrition tracking
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value.toISOString().split('T')[0]}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
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
                      <FormLabel>Valid To *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value.toISOString().split('T')[0]}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Commission & Currency */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commission_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="15.5"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                      <FormLabel>Currency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Booking Cutoff */}
              <FormField
                control={form.control}
                name="booking_cutoff_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Cutoff (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="7"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attrition Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Attrition Tracking</h3>
                </div>

                <FormField
                  control={form.control}
                  name="attrition_applies"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Switch
                          id="attrition_applies"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel htmlFor="attrition_applies" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Attrition tracking applies to this contract version
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("attrition_applies") && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="committed_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Committed Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                placeholder="100"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minimum_pickup_percent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Pickup %</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="80"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="penalty_calculation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Penalty Calculation</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select penalty type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pay_for_unused">Pay for Unused</SelectItem>
                                <SelectItem value="sliding_scale">Sliding Scale</SelectItem>
                                <SelectItem value="fixed_fee">Fixed Fee</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="attrition_period_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Period Type</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={(value) => field.onChange(value === "" ? undefined : value)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select period type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="seasonal">Seasonal</SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="grace_allowance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grace Allowance</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="5"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? "Update Version" : "Create Version"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
