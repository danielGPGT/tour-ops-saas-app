"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, FileText, Building2, Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractVersionSheet } from "./ContractVersionSheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { BulkAction } from "@/components/common/BulkActions";
import { SummaryCard } from "@/components/common/SummaryCards";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteContractVersion, duplicateContractVersion, bulkUpdateContractVersions, bulkDeleteContractVersions, bulkDuplicateContractVersions } from "@/app/contracts/versions/actions";
import { toast } from "sonner";

type Contract = {
  id: number;
  reference: string;
  status: string;
  created_at: string;
  updated_at: string;
  suppliers: {
    id: number;
    name: string;
    channels?: string[];
    status?: string;
  };
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

type Props = {
  contract: Contract;
  versions: ContractVersion[];
};

export function ContractVersionsPageClient({ contract, versions }: Props) {
  const router = useRouter();
  const [selectedVersions, setSelectedVersions] = useState<ContractVersion[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editVersionId, setEditVersionId] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleEdit = (versionId: number) => {
    setEditVersionId(versionId);
    setEditModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setEditVersionId(null);
  };

  // Calculate version statistics
  const now = new Date();
  const activeVersions = versions.filter(v => {
    const fromDate = new Date(v.valid_from);
    const toDate = new Date(v.valid_to);
    return fromDate <= now && toDate > now;
  });

  const futureVersions = versions.filter(v => {
    const fromDate = new Date(v.valid_from);
    return fromDate > now;
  });

  const expiredVersions = versions.filter(v => {
    const toDate = new Date(v.valid_to);
    return toDate <= now;
  });

  // Summary cards
  const summaryCards: SummaryCard[] = [
    {
      id: "total-versions",
      title: "Total Versions",
      value: versions.length.toString(),
      icon: <FileText className="h-4 w-4" />,
      description: versions.length === 1 ? "version" : "versions",
      trend: null
    },
    {
      id: "active-versions",
      title: "Active Versions",
      value: activeVersions.length.toString(),
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: "Currently effective",
      trend: { 
        value: `${Math.round((activeVersions.length / versions.length) * 100)}% active rate`, 
        icon: <CheckCircle2 className="h-3 w-3" />, 
        color: "text-primary-600" 
      }
    },
    {
      id: "future-versions",
      title: "Future Versions",
      value: futureVersions.length.toString(),
      icon: <Calendar className="h-4 w-4" />,
      description: "Scheduled versions",
      trend: null
    },
    {
      id: "expired-versions",
      title: "Expired Versions",
      value: expiredVersions.length.toString(),
      icon: <Clock className="h-4 w-4" />,
      description: "Past versions",
      trend: null
    }
  ];

  // Bulk actions
  const bulkActions: BulkAction<ContractVersion>[] = [
    {
      id: "edit",
      label: "Edit Selected",
      icon: FileText,
      variant: "default",
      action: async (selectedItems) => {
        // For now, just show a message - could implement bulk edit modal
        toast.info(`Bulk edit ${selectedItems.length} versions - Feature coming soon`);
      }
    },
    {
      id: "duplicate",
      label: "Duplicate Selected",
      icon: FileText,
      variant: "outline",
      action: async (selectedItems) => {
        try {
          await bulkDuplicateContractVersions(selectedItems.map(v => v.id));
          toast.success(`Duplicated ${selectedItems.length} contract versions`);
          handleSuccess();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to duplicate versions");
        }
      }
    },
    {
      id: "delete",
      label: "Delete Selected",
      icon: FileText,
      variant: "destructive",
      action: async (selectedItems) => {
        try {
          await bulkDeleteContractVersions(selectedItems.map(v => v.id));
          toast.success(`Deleted ${selectedItems.length} contract versions`);
          handleSuccess();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete versions");
        }
      }
    }
  ];

  // Table columns
  const columns: DataTableColumn<ContractVersion>[] = [
    {
      key: "valid_period",
      header: "Valid Period",
      width: "w-[200px]",
      render: (version) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {format(new Date(version.valid_from), "MMM dd, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>to</span>
            <span>{format(new Date(version.valid_to), "MMM dd, yyyy")}</span>
          </div>
        </div>
      )
    },
    {
      key: "duration",
      header: "Duration",
      width: "w-[100px]",
      render: (version) => {
        const diffTime = Math.abs(new Date(version.valid_to).getTime() - new Date(version.valid_from).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let duration = "1 day";
        if (diffDays > 1 && diffDays < 30) duration = `${diffDays} days`;
        else if (diffDays < 365) duration = `${Math.round(diffDays / 30)} months`;
        else duration = `${Math.round(diffDays / 365)} years`;
        
        return <span className="text-sm">{duration}</span>;
      }
    },
    {
      key: "status",
      header: "Status",
      width: "w-[100px]",
      render: (version) => {
        const now = new Date();
        const fromDate = new Date(version.valid_from);
        const toDate = new Date(version.valid_to);
        
        let status = "Future";
        let variant: "default" | "secondary" | "outline" = "outline";
        let color = "text-secondary-600";
        
        if (now > toDate) {
          status = "Expired";
          variant = "secondary";
          color = "text-muted-foreground";
        } else if (fromDate <= now && toDate > now) {
          status = "Active";
          variant = "default";
          color = "text-primary-600";
        }
        
        return (
          <Badge variant={variant} className={color}>
            {status}
          </Badge>
        );
      }
    },
         {
           key: "policies",
           header: "Policies",
           width: "w-[150px]",
           render: (version) => {
             const policyCount = [
               version.cancellation_policy,
               version.attrition_policy,
               version.payment_terms,
               version.operational_terms,
               version.additional_terms
             ].filter(policy => policy && Object.keys(policy).length > 0).length;
             
             return (
               <div className="space-y-1">
                 {policyCount > 0 ? (
                   <Badge variant="outline" className="text-xs">
                     {policyCount} polic{policyCount !== 1 ? 'ies' : 'y'}
                   </Badge>
                 ) : (
                   <span className="text-xs text-muted-foreground">No policies</span>
                 )}
               </div>
             );
           }
         },
         {
           key: "rate_plans",
           header: "Rate Plans",
           width: "w-[100px]",
           render: (version) => {
             const ratePlansCount = version.rate_plans?.length || 0;
             
             return (
               <div className="space-y-1">
                 {ratePlansCount > 0 ? (
                   <div className="flex items-center gap-1">
                     <Badge variant="outline" className="text-xs">
                       {ratePlansCount} plan{ratePlansCount !== 1 ? 's' : ''}
                     </Badge>
                     {version.rate_plans?.some((rp: any) => rp.preferred) && (
                       <Badge variant="default" className="text-xs" style={{ backgroundColor: 'var(--color-primary-600)', color: 'var(--color-primary-foreground)' }}>
                         Preferred
                       </Badge>
                     )}
                   </div>
                 ) : (
                   <span className="text-xs text-muted-foreground">No plans</span>
                 )}
               </div>
             );
           }
         },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]",
      render: (version) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(version.created_at), "MMM d, yyyy")}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[120px] text-right",
      render: (version) => (
        <div className="flex items-center justify-end gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(version.id)}
                  className="h-8 w-8 p-0"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit version</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await duplicateContractVersion(version.id, { redirect: false });
                      toast.success("Contract version duplicated successfully");
                      handleSuccess();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to duplicate version");
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duplicate version</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    try {
                      await deleteContractVersion(version.id, { redirect: false });
                      toast.success("Contract version deleted successfully");
                      handleSuccess();
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Failed to delete version");
                    }
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <AlertCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete version</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/contracts")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Button>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Contract Versions
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{contract.reference}</span>
              <span>•</span>
              <span>{contract.suppliers.name}</span>
              <Badge variant="outline" className="text-xs">
                {contract.status}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Version
        </Button>
      </div>

      {/* Use EntityPageLayout */}
      <EntityPageLayout
        title=""
        subtitle=""
        primaryAction={{
          label: "Add Version",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateModalOpen(true)
        }}
        data={versions}
        columns={columns}
        selectedItems={selectedVersions}
        onSelectionChange={setSelectedVersions}
        bulkActions={bulkActions}
        getItemName={(version) => `Version ${version.id}`}
        getId={(version) => version.id}
        getItemId={(version) => version.id}
        entityName="contract version"
        onSelectionClear={() => setSelectedVersions([])}
        currentPage={1}
        totalPages={1}
        totalItems={versions.length}
        itemsPerPage={versions.length}
        onPageChange={() => {}}
        summaryCards={summaryCards}
        emptyState={{
          icon: <FileText className="h-8 w-8" />,
          title: "No contract versions found",
          description: "Create the first version to get started"
        }}
      />

      {/* Create Version Modal */}
      <ContractVersionSheet
        trigger={<div style={{ display: 'none' }} />}
        contractId={contract.id}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleSuccess}
      />

      {/* Edit Version Modal */}
      {editVersionId && (
        <ContractVersionSheet
          trigger={<div style={{ display: 'none' }} />}
          contractId={contract.id}
          contractVersionId={editVersionId}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
