"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText, Building2, CheckCircle2, Clock, AlertCircle, TrendingUp, Plus } from "lucide-react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DatabaseStatus } from "@/components/common/DatabaseStatus";
import { DataTableColumn } from "@/components/common/DataTable";
import { BulkAction } from "@/components/common/BulkActions";
import { SummaryCard } from "@/components/common/SummaryCards";
import { ContractActions } from "./ContractActions";
import { UnifiedContractSheet } from "./UnifiedContractSheet";
import { ContractVersionDetailsModal } from "./ContractVersionDetailsModal";
import { bulkUpdateContracts, bulkDeleteContracts, bulkDuplicateContracts } from "@/app/contracts/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

type Contract = {
  id: number;
  reference: string;
  status: string;
  supplier_id: number;
  created_at: string;
  suppliers: {
    id: number;
    name: string;
    channels?: string[];
    status?: string;
  };
  contract_versions?: Array<{
    id: number;
    valid_from: string;
    valid_to: string;
    cancellation_policy: Record<string, any>;
    payment_policy: Record<string, any>;
    terms: Record<string, any>;
    rate_plans?: Array<{
      id: number;
      inventory_model: string;
      currency: string;
      markets: string[];
      channels: string[];
      preferred: boolean;
      valid_from: string;
      valid_to: string;
    }>;
  }>;
};

type Supplier = {
  id: number;
  name: string;
  channels?: string[];
  status?: string;
};

interface ContractsPageClientProps {
  contracts: Contract[];
  suppliers: Supplier[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchParams: Record<string, string>;
  searchQuery?: string;
  hasDatabaseError?: boolean;
  stats: {
    totalCount: number;
    activeCount: number;
    draftCount: number;
    expiredCount: number;
    newThisMonth: number;
    uniqueSuppliersWithContracts: number;
  };
}

export function ContractsPageClient({
  contracts,
  suppliers,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  searchParams,
  searchQuery,
  hasDatabaseError,
  stats
}: ContractsPageClientProps) {
  const router = useRouter();
  const [selectedContracts, setSelectedContracts] = React.useState<Contract[]>([]);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editContractId, setEditContractId] = React.useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [viewDetailsContractId, setViewDetailsContractId] = React.useState<number | null>(null);
  const [viewDetailsModalOpen, setViewDetailsModalOpen] = React.useState(false);

  // Define table columns
  const columns: DataTableColumn<Contract>[] = [
    {
      key: "reference",
      header: "Contract Reference",
      width: "w-[200px]",
      render: (contract) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium text-sm">{contract.reference}</div>
        </div>
      )
    },
    {
      key: "suppliers",
      header: "Supplier",
      width: "w-[180px]",
      render: (contract) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium text-sm">{contract.suppliers.name}</div>
            <div className="text-xs text-muted-foreground">
              {(contract.suppliers.channels || []).join(", ") || "No channels"}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (contract) => {
        const statusConfig = {
          active: { 
            variant: "default" as const, 
            className: "bg-primary-100 text-primary-800 hover:bg-primary-100",
            icon: CheckCircle2,
            label: "Active"
          },
          draft: { 
            variant: "secondary" as const, 
            className: "",
            icon: FileText,
            label: "Draft"
          },
          inactive: { 
            variant: "secondary" as const, 
            className: "",
            icon: Clock,
            label: "Inactive"
          },
          expired: { 
            variant: "destructive" as const, 
            className: "",
            icon: AlertCircle,
            label: "Expired"
          }
        };

        const config = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft;
        const Icon = config.icon;

        return (
          <Badge variant={config.variant} className={`text-xs ${config.className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: "current_version",
      header: "Current Version",
      width: "w-[140px]",
      render: (contract) => {
        const currentVersion = contract.contract_versions?.[0];
        if (!currentVersion) {
          return (
            <div className="text-sm text-muted-foreground">
              No active version
            </div>
          );
        }

        const now = new Date();
        const validUntil = new Date(currentVersion.valid_to);
        const isExpiringSoon = validUntil.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 days

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                v{contract.contract_versions?.length || 1}
              </Badge>
              {isExpiringSoon && (
                <AlertCircle className="h-3 w-3 text-secondary-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Until {validUntil.toLocaleDateString()}
            </div>
          </div>
        );
      }
    },
    {
      key: "version_details",
      header: "Version Details",
      width: "w-[160px]",
      render: (contract) => {
        const currentVersion = contract.contract_versions?.[0];
        if (!currentVersion) {
          return (
            <div className="text-sm text-muted-foreground">
              No policies configured
            </div>
          );
        }

        const policyCount = [
          currentVersion.cancellation_policy,
          currentVersion.payment_policy,
          currentVersion.terms
        ].filter(policy => policy && Object.keys(policy).length > 0).length;

        const ratePlanCount = currentVersion.rate_plans?.length || 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {policyCount} polic{policyCount !== 1 ? 'ies' : 'y'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ratePlanCount} rate plan{ratePlanCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        );
      }
    },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]",
      render: (contract) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(contract.created_at), "MMM d, yyyy")}
        </span>
      )
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[120px] text-right",
      render: (contract) => {
        const currentVersion = contract.contract_versions?.[0];
        
        return (
          <div className="flex items-center justify-end gap-1">
            {currentVersion && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewDetailsContractId(contract.id);
                  setViewDetailsModalOpen(true);
                }}
                className="h-8 px-2 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Details
              </Button>
            )}
            <ContractActions 
              contract={contract} 
              suppliers={suppliers}
              onEdit={(contractId) => {
                setEditContractId(contractId);
                setEditModalOpen(true);
              }}
              onSuccess={() => {
                setSelectedContracts([]);
                router.refresh();
              }}
            />
          </div>
        );
      }
    }
  ];

  // Define bulk actions
  const bulkActions: BulkAction<Contract>[] = [
    {
      id: "activate",
      label: "Activate",
      icon: <CheckCircle2 className="h-3 w-3" />,
      onClick: async (contracts) => {
        try {
          const contractIds = contracts.map(c => c.id);
          await bulkUpdateContracts(contractIds, { status: "active" });
          toast.success(`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} activated successfully`);
          setSelectedContracts([]);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to activate contracts");
        }
      }
    },
    {
      id: "draft",
      label: "Set to Draft",
      icon: <FileText className="h-3 w-3" />,
      onClick: async (contracts) => {
        try {
          const contractIds = contracts.map(c => c.id);
          await bulkUpdateContracts(contractIds, { status: "draft" });
          toast.success(`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} set to draft successfully`);
          setSelectedContracts([]);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to update contracts");
        }
      }
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <Plus className="h-3 w-3" />,
      onClick: async (contracts) => {
        try {
          const contractIds = contracts.map(c => c.id);
          await bulkDuplicateContracts(contractIds);
          toast.success(`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} duplicated successfully`);
          setSelectedContracts([]);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to duplicate contracts");
        }
      }
    },
    {
      id: "delete",
      label: "Delete",
      icon: <AlertCircle className="h-3 w-3" />,
      variant: "destructive",
      requiresConfirmation: true,
      confirmationTitle: `Delete ${selectedContracts.length} Contract${selectedContracts.length !== 1 ? 's' : ''}`,
      confirmationDescription: (contracts) => 
        `Are you sure you want to delete ${contracts.length} contract${contracts.length !== 1 ? 's' : ''}? This action cannot be undone.`,
      onClick: async (contracts) => {
        try {
          const contractIds = contracts.map(c => c.id);
          await bulkDeleteContracts(contractIds);
          toast.success(`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} deleted successfully`);
          setSelectedContracts([]);
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to delete contracts");
        }
      }
    }
  ];

  // Define summary cards
  const summaryCards: SummaryCard[] = [
    {
      id: "total",
      title: "Total Contracts",
      value: stats.totalCount,
      icon: <FileText className="h-4 w-4 text-primary" />,
      description: "Contract agreements",
      trend: {
        value: "Active agreements",
        icon: <TrendingUp className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-primary/10"
    },
    {
      id: "active",
      title: "Active Contracts",
      value: stats.activeCount,
      icon: <CheckCircle2 className="h-4 w-4 text-primary-600" />,
      description: `${stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0}% active rate`,
      trend: {
        value: "Active agreements",
        icon: <CheckCircle2 className="h-3 w-3 text-primary-600" />
      },
      iconBackgroundColor: "bg-primary-100"
    },
    {
      id: "suppliers",
      title: "Suppliers with Contracts",
      value: stats.uniqueSuppliersWithContracts,
      icon: <Building2 className="h-4 w-4 text-secondary-600" />,
      description: "Supplier partnerships",
      trend: {
        value: "Supplier partnerships",
        icon: <Building2 className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-secondary-100"
    },
    {
      id: "new",
      title: "New This Month",
      value: stats.newThisMonth,
      icon: <Plus className="h-4 w-4 text-purple-600" />,
      description: "Growing network",
      trend: {
        value: "Growing network",
        icon: <TrendingUp className="h-3 w-3 text-primary-600" />
      },
      iconBackgroundColor: "bg-purple-100"
    }
  ];

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/contracts?${params.toString()}`);
  };

  const handleClearSearch = () => {
    router.push('/contracts');
  };

  return (
    <div className="space-y-4">
      {hasDatabaseError && (
        <DatabaseStatus 
          hasError={hasDatabaseError}
          onRetry={() => router.refresh()}
        />
      )}
      
      <EntityPageLayout
        title="Contracts"
        subtitle={`${stats.totalCount.toLocaleString()} total • ${stats.activeCount.toLocaleString()} active`}
        searchPlaceholder="Search contracts..."
        searchParam="q"
        data={contracts}
        columns={columns}
        selectedItems={selectedContracts}
        onSelectionChange={setSelectedContracts}
        getId={(contract) => contract.id.toString()}
        emptyState={{
          icon: <FileText className="h-8 w-8 text-muted-foreground" />,
          title: "No contracts found",
          description: hasDatabaseError ? "Database connection error. Please check your configuration." : "Create your first contract to get started"
        }}
        bulkActions={bulkActions}
        getItemName={(contract) => contract.reference}
        getItemId={(contract) => contract.id.toString()}
        entityName="contract"
        onSelectionClear={() => setSelectedContracts([])}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        searchParams={searchParams}
        summaryCards={summaryCards}
        primaryAction={{
          label: "Add Contract",
          icon: <Plus className="h-3 w-3" />,
          onClick: () => setCreateModalOpen(true)
        }}
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
      >
      {/* Create Contract Modal */}
      <UnifiedContractSheet
        trigger={<div style={{ display: 'none' }} />}
        suppliers={suppliers}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false);
          setSelectedContracts([]);
          router.refresh();
        }}
      />
      
      {/* Edit Contract Modal */}
      {editContractId && (
        <UnifiedContractSheet
          trigger={<div style={{ display: 'none' }} />}
          contractId={editContractId}
          suppliers={suppliers}
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSuccess={() => {
            setEditModalOpen(false);
            setEditContractId(null);
            setSelectedContracts([]);
            router.refresh();
          }}
        />
      )}
      
      {/* Version Details Modal */}
      <ContractVersionDetailsModal
        contract={contracts.find(c => c.id === viewDetailsContractId) || null}
        open={viewDetailsModalOpen}
        onOpenChange={setViewDetailsModalOpen}
        onManageVersions={(contractId) => {
          setViewDetailsModalOpen(false);
          router.push(`/contracts/${contractId}/versions`);
        }}
      />
      </EntityPageLayout>
    </div>
  );
}
