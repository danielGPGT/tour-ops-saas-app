"use client";

import React from "react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Building2, Calendar, DollarSign, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { ContractSheet } from "./ContractSheet";
import { ContractVersionSheet } from "./ContractVersionSheet";
import { format } from "date-fns";

export interface Contract {
  id: bigint;
  org_id: bigint;
  supplier_id: bigint;
  reference: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  suppliers?: {
    id: bigint;
    name: string;
    status: string;
  };
  contract_versions?: Array<{
    id: bigint;
    valid_from: string;
    valid_to: string;
    cancellation_policy: any;
    payment_policy: any;
    terms: any;
  }>;
}

export interface ContractsNewPageClientProps {
  contracts: Contract[];
  suppliers: any[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchParams: Record<string, string>;
  searchQuery: string;
  hasDatabaseError: boolean;
  stats: {
    totalCount: number;
    activeCount: number;
    draftCount: number;
    expiredCount: number;
    newThisMonth: number;
    uniqueSuppliersWithContracts: number;
  };
}

export function ContractsNewPageClient({
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
}: ContractsNewPageClientProps) {
  const [selectedContracts, setSelectedContracts] = React.useState<Contract[]>([]);
  const [contractSheetOpen, setContractSheetOpen] = React.useState(false);
  const [versionSheetOpen, setVersionSheetOpen] = React.useState(false);
  const [editingContract, setEditingContract] = React.useState<Contract | null>(null);

  // Table columns
  const columns: DataTableColumn<Contract>[] = [
    {
      key: 'reference',
      header: 'Contract',
      render: (contract) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{contract.reference}</p>
            <p className="text-sm text-muted-foreground">
              {contract.suppliers?.name || 'Unknown Supplier'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (contract) => {
        const statusConfig = {
          active: { label: 'Active', variant: 'default' as const, icon: CheckCircle2 },
          draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
          expired: { label: 'Expired', variant: 'destructive' as const, icon: XCircle },
          suspended: { label: 'Suspended', variant: 'outline' as const, icon: AlertCircle }
        };
        
        const config = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft;
        const Icon = config.icon;
        
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      }
    },
    {
      key: 'contract_versions',
      header: 'Versions',
      render: (contract) => {
        const versions = contract.contract_versions || [];
        const currentVersion = versions.find(v => 
          new Date(v.valid_from) <= new Date() && new Date(v.valid_to) >= new Date()
        );
        
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{versions.length}</span>
            {currentVersion && (
              <Badge variant="outline" className="text-xs">
                Current
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (contract) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(contract.created_at), "MMM d, yyyy")}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (contract) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingContract(contract);
              setVersionSheetOpen(true);
            }}
            className="h-8 px-2"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Versions
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingContract(contract);
              setContractSheetOpen(true);
            }}
            className="h-8 px-2"
          >
            Edit
          </Button>
        </div>
      )
    }
  ];

  // Bulk actions
  const bulkActions = [
    {
      label: 'Activate',
      icon: CheckCircle2,
      onClick: () => console.log('Activate selected contracts'),
      variant: 'default' as const
    },
    {
      label: 'Suspend',
      icon: AlertCircle,
      onClick: () => console.log('Suspend selected contracts'),
      variant: 'outline' as const
    },
    {
      label: 'Archive',
      icon: XCircle,
      onClick: () => console.log('Archive selected contracts'),
      variant: 'destructive' as const
    }
  ];

  // Summary cards
  const summaryCards = [
    {
      id: 'total',
      title: 'Total Contracts',
      value: stats.totalCount,
      icon: <FileText className="h-4 w-4" />,
      description: 'All contracts'
    },
    {
      id: 'active',
      title: 'Active',
      value: stats.activeCount,
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Currently active',
      iconBackgroundColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'draft',
      title: 'Draft',
      value: stats.draftCount,
      icon: <Clock className="h-4 w-4" />,
      description: 'In progress',
      iconBackgroundColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      id: 'expired',
      title: 'Expired',
      value: stats.expiredCount,
      icon: <XCircle className="h-4 w-4" />,
      description: 'No longer valid',
      iconBackgroundColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  // Empty state
  const emptyState = {
    icon: <FileText className="h-8 w-8 text-muted-foreground" />,
    title: "No contracts found",
    description: "Create your first contract to get started with supplier management."
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    window.location.href = `?${params.toString()}`;
  };

  const handleClearSearch = () => {
    window.location.href = '/contracts-new';
  };

  return (
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
      emptyState={emptyState}
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
        label: 'New Contract',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setContractSheetOpen(true)
      }}
      secondaryActions={[
        {
          label: 'Import',
          icon: <Building2 className="h-4 w-4" />,
          onClick: () => console.log('Import contracts')
        }
      ]}
      searchQuery={searchQuery}
      onClearSearch={handleClearSearch}
    >
      {/* Contract Sheet */}
      <ContractSheet
        open={contractSheetOpen}
        onOpenChange={setContractSheetOpen}
        suppliers={suppliers}
        contract={editingContract}
        onSuccess={() => {
          setContractSheetOpen(false);
          setEditingContract(null);
          window.location.reload();
        }}
      />

      {/* Contract Version Sheet */}
      <ContractVersionSheet
        open={versionSheetOpen}
        onOpenChange={setVersionSheetOpen}
        contract={editingContract}
        onSuccess={() => {
          setVersionSheetOpen(false);
          setEditingContract(null);
          window.location.reload();
        }}
      />
    </EntityPageLayout>
  );
}
