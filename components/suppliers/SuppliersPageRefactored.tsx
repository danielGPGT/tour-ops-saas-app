"use client";

import React from "react";
import { Building2, Globe, CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { BulkAction } from "@/components/common/BulkActions";
import { SummaryCard } from "@/components/common/SummaryCards";
import { SupplierActions } from "./SupplierActions";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
  created_at: Date;
};

interface SuppliersPageRefactoredProps {
  suppliers: Supplier[];
  selectedSuppliers: Supplier[];
  onSelectionChange: (suppliers: Supplier[]) => void;
  onSelectionClear: () => void;
  onBulkEdit: () => void;
  onBulkDelete: (suppliers: Supplier[]) => void;
  onBulkDuplicate: (suppliers: Supplier[]) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  searchParams?: Record<string, string>;
  searchQuery?: string;
  onClearSearch?: () => void;
  summaryStats: {
    totalCount: number;
    activeCount: number;
    totalChannels: number;
    newThisMonth: number;
  };
  onAddSupplier: () => void;
  children?: React.ReactNode;
}

export function SuppliersPageRefactored({
  suppliers,
  selectedSuppliers,
  onSelectionChange,
  onSelectionClear,
  onBulkEdit,
  onBulkDelete,
  onBulkDuplicate,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  searchParams,
  searchQuery,
  onClearSearch,
  summaryStats,
  onAddSupplier,
  children
}: SuppliersPageRefactoredProps) {
  // Define table columns
  const columns: DataTableColumn<Supplier>[] = [
    {
      key: "name",
      header: "Supplier",
      width: "w-[200px]",
      render: (supplier) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium text-sm">{supplier.name}</div>
        </div>
      )
    },
    {
      key: "channels",
      header: "Channels",
      width: "w-[150px]"
      // Uses default array rendering from DataTable
    },
    {
      key: "status",
      header: "Status",
      width: "w-[100px]",
      render: (supplier) => (
        supplier.status === "active" ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
            {supplier.status}
          </span>
        )
      )
    },
    {
      key: "created_at",
      header: "Created",
      width: "w-[120px]"
      // Uses default date rendering from DataTable
    },
    {
      key: "actions",
      header: "Actions",
      width: "w-[80px] text-right",
      render: (supplier) => (
        <div className="text-right">
          <SupplierActions supplier={{ 
            id: supplier.id, 
            name: supplier.name, 
            channels: supplier.channels ?? [], 
            status: supplier.status ?? undefined 
          }} />
        </div>
      )
    }
  ];

  // Define bulk actions
  const bulkActions: BulkAction<Supplier>[] = [
    {
      id: "edit",
      label: "Edit",
      icon: <Plus className="h-3 w-3" />,
      onClick: onBulkEdit
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <Plus className="h-3 w-3" />,
      onClick: onBulkDuplicate
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Plus className="h-3 w-3" />,
      variant: "destructive",
      requiresConfirmation: true,
      confirmationTitle: `Delete ${selectedSuppliers.length} Supplier${selectedSuppliers.length !== 1 ? 's' : ''}`,
      confirmationDescription: (suppliers) => 
        `Are you sure you want to delete ${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''}? This action cannot be undone.`,
      onClick: onBulkDelete
    }
  ];

  // Define summary cards
  const summaryCards: SummaryCard[] = [
    {
      id: "total",
      title: "Total Suppliers",
      value: summaryStats.totalCount,
      icon: <Building2 className="h-4 w-4 text-primary" />,
      description: "Active partnerships",
      trend: {
        value: "Growing network",
        icon: <TrendingUp className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-primary/10"
    },
    {
      id: "active",
      title: "Active Suppliers",
      value: summaryStats.activeCount,
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      description: `${summaryStats.totalCount > 0 ? Math.round((summaryStats.activeCount / summaryStats.totalCount) * 100) : 0}% active rate`,
      trend: {
        value: "Active partnerships",
        icon: <CheckCircle2 className="h-3 w-3 text-green-600" />
      },
      iconBackgroundColor: "bg-green-100"
    },
    {
      id: "channels",
      title: "Unique Channels",
      value: summaryStats.totalChannels,
      icon: <Globe className="h-4 w-4 text-blue-600" />,
      description: "Distribution networks",
      trend: {
        value: "Distribution networks",
        icon: <Globe className="h-3 w-3 text-muted-foreground" />
      },
      iconBackgroundColor: "bg-blue-100"
    },
    {
      id: "new",
      title: "New This Month",
      value: summaryStats.newThisMonth,
      icon: <Plus className="h-4 w-4 text-purple-600" />,
      description: "Growing network",
      trend: {
        value: "Growing network",
        icon: <TrendingUp className="h-3 w-3 text-green-600" />
      },
      iconBackgroundColor: "bg-purple-100"
    }
  ];

  return (
    <EntityPageLayout
      title="Suppliers"
      subtitle={`${summaryStats.totalCount.toLocaleString()} total • ${summaryStats.activeCount.toLocaleString()} active`}
      searchPlaceholder="Search suppliers..."
      searchParam="q"
      data={suppliers}
      columns={columns}
      selectedItems={selectedSuppliers}
      onSelectionChange={onSelectionChange}
      getId={(supplier) => supplier.id.toString()}
      emptyState={{
        icon: <Building2 className="h-8 w-8 text-muted-foreground" />,
        title: "No suppliers found",
        description: "Add your first supplier to get started"
      }}
      bulkActions={bulkActions}
      getItemName={(supplier) => supplier.name}
      getItemId={(supplier) => supplier.id.toString()}
      entityName="supplier"
      onSelectionClear={onSelectionClear}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={onPageChange}
      searchParams={searchParams}
      summaryCards={summaryCards}
      primaryAction={{
        label: "Add",
        icon: <Plus className="h-3 w-3" />,
        onClick: onAddSupplier
      }}
      searchQuery={searchQuery}
      onClearSearch={onClearSearch}
    >
      {children}
    </EntityPageLayout>
  );
}
