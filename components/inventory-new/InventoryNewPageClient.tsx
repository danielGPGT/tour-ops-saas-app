"use client";

import React from "react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Plus, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  Zap
} from "lucide-react";
import { AllocationSheet } from "./AllocationSheet";
import { format } from "date-fns";

export interface Allocation {
  id: bigint;
  org_id: bigint;
  product_variant_id: bigint;
  supplier_id: bigint;
  date?: string;
  event_start_date?: string;
  event_end_date?: string;
  allocation_type: string;
  quantity?: number;
  booked: number;
  held: number;
  stop_sell: boolean;
  blackout: boolean;
  allow_overbooking: boolean;
  overbooking_limit?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  suppliers?: {
    id: bigint;
    name: string;
    status: string;
  };
  product_variants?: {
    id: bigint;
    name: string;
    subtype: string;
    products?: {
      id: bigint;
      name: string;
      type: string;
      product_types?: {
        name: string;
        icon: string;
        color: string;
      };
    };
  };
  time_slots?: {
    id: bigint;
    slot_time: string;
    slot_name?: string;
  };
}

export interface InventoryNewPageClientProps {
  allocations: Allocation[];
  suppliers: any[];
  products: any[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchParams: Record<string, string>;
  searchQuery: string;
  hasDatabaseError: boolean;
  stats: {
    totalCount: number;
    committedCount: number;
    freesaleCount: number;
    onRequestCount: number;
    totalQuantity: number;
    totalBooked: number;
    totalHeld: number;
    utilizationRate: number;
    newThisMonth: number;
    uniqueSuppliersWithAllocations: number;
  };
}

export function InventoryNewPageClient({
  allocations,
  suppliers,
  products,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  searchParams,
  searchQuery,
  hasDatabaseError,
  stats
}: InventoryNewPageClientProps) {
  const [selectedAllocations, setSelectedAllocations] = React.useState<Allocation[]>([]);
  const [allocationSheetOpen, setAllocationSheetOpen] = React.useState(false);
  const [editingAllocation, setEditingAllocation] = React.useState<Allocation | null>(null);

  // Table columns
  const columns: DataTableColumn<Allocation>[] = [
    {
      key: 'product_variants',
      header: 'Product',
      render: (allocation) => (
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
            allocation.product_variants?.products?.product_types?.color 
              ? `bg-${allocation.product_variants.products.product_types.color}-100 dark:bg-${allocation.product_variants.products.product_types.color}-900/20`
              : 'bg-primary/10'
          }`}>
            <Package className="h-3 w-3" />
          </div>
          <div>
            <p className="font-medium">{allocation.product_variants?.name || 'Unknown Product'}</p>
            <p className="text-sm text-muted-foreground">
              {allocation.product_variants?.products?.name || 'Unknown Product'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'suppliers',
      header: 'Supplier',
      render: (allocation) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{allocation.suppliers?.name || 'Unknown Supplier'}</p>
            <p className="text-sm text-muted-foreground">
              {allocation.allocation_type}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date/Period',
      render: (allocation) => {
        if (allocation.date) {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {format(new Date(allocation.date), "MMM d, yyyy")}
              </div>
              {allocation.time_slots && (
                <div className="text-muted-foreground">
                  {allocation.time_slots.slot_time} {allocation.time_slots.slot_name && `(${allocation.time_slots.slot_name})`}
                </div>
              )}
            </div>
          );
        } else if (allocation.event_start_date && allocation.event_end_date) {
          return (
            <div className="text-sm">
              <div className="font-medium">
                {format(new Date(allocation.event_start_date), "MMM d")} - {format(new Date(allocation.event_end_date), "MMM d, yyyy")}
              </div>
              <div className="text-muted-foreground">Event</div>
            </div>
          );
        }
        return <span className="text-sm text-muted-foreground">—</span>;
      }
    },
    {
      key: 'quantity',
      header: 'Availability',
      render: (allocation) => {
        const total = allocation.quantity || 0;
        const booked = allocation.booked || 0;
        const held = allocation.held || 0;
        const available = total - booked - held;
        const utilizationRate = total > 0 ? Math.round((booked / total) * 100) : 0;
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{available}</span>
              <span className="text-muted-foreground">/ {total}</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{booked} booked</span>
              {held > 0 && <span>• {held} held</span>}
            </div>
          </div>
        );
      }
    },
    {
      key: 'allocation_type',
      header: 'Type',
      render: (allocation) => {
        const typeConfig = {
          committed: { label: 'Committed', variant: 'default' as const, icon: CheckCircle2 },
          freesale: { label: 'Freesale', variant: 'secondary' as const, icon: RefreshCw },
          on_request: { label: 'On Request', variant: 'outline' as const, icon: AlertCircle }
        };
        
        const config = typeConfig[allocation.allocation_type as keyof typeof typeConfig] || typeConfig.committed;
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
      key: 'status',
      header: 'Status',
      render: (allocation) => (
        <div className="flex flex-wrap gap-1">
          {allocation.stop_sell && (
            <Badge variant="destructive" className="text-xs">Stop Sell</Badge>
          )}
          {allocation.blackout && (
            <Badge variant="outline" className="text-xs">Blackout</Badge>
          )}
          {allocation.allow_overbooking && (
            <Badge variant="secondary" className="text-xs">Overbooking</Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (allocation) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingAllocation(allocation);
              setAllocationSheetOpen(true);
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
      label: 'Stop Sell',
      icon: AlertCircle,
      onClick: () => console.log('Stop sell selected allocations'),
      variant: 'destructive' as const
    },
    {
      label: 'Bulk Update',
      icon: TrendingUp,
      onClick: () => console.log('Bulk update selected allocations'),
      variant: 'outline' as const
    },
    {
      label: 'Export',
      icon: BarChart3,
      onClick: () => console.log('Export selected allocations'),
      variant: 'secondary' as const
    }
  ];

  // Summary cards
  const summaryCards = [
    {
      id: 'total',
      title: 'Total Allocations',
      value: stats.totalCount,
      icon: <Package className="h-4 w-4" />,
      description: 'All allocation buckets'
    },
    {
      id: 'quantity',
      title: 'Total Quantity',
      value: stats.totalQuantity.toLocaleString(),
      icon: <Users className="h-4 w-4" />,
      description: 'Available units',
      iconBackgroundColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'booked',
      title: 'Booked',
      value: stats.totalBooked.toLocaleString(),
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Currently booked',
      iconBackgroundColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'utilization',
      title: 'Utilization',
      value: `${stats.utilizationRate}%`,
      icon: <Zap className="h-4 w-4" />,
      description: 'Overall utilization rate',
      iconBackgroundColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    }
  ];

  // Empty state
  const emptyState = {
    icon: <Package className="h-8 w-8 text-muted-foreground" />,
    title: "No allocations found",
    description: "Create your first allocation to start managing inventory."
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    window.location.href = `?${params.toString()}`;
  };

  const handleClearSearch = () => {
    window.location.href = '/inventory-new';
  };

  return (
    <EntityPageLayout
      title="Inventory Allocations"
      subtitle={`${stats.totalCount.toLocaleString()} allocations • ${stats.utilizationRate}% utilization`}
      searchPlaceholder="Search allocations..."
      searchParam="q"
      data={allocations}
      columns={columns}
      selectedItems={selectedAllocations}
      onSelectionChange={setSelectedAllocations}
      getId={(allocation) => allocation.id.toString()}
      emptyState={emptyState}
      bulkActions={bulkActions}
      getItemName={(allocation) => allocation.product_variants?.name || 'Unknown Product'}
      getItemId={(allocation) => allocation.id.toString()}
      entityName="allocation"
      onSelectionClear={() => setSelectedAllocations([])}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      searchParams={searchParams}
      summaryCards={summaryCards}
      primaryAction={{
        label: 'New Allocation',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setAllocationSheetOpen(true)
      }}
      secondaryActions={[
        {
          label: 'Bulk Import',
          icon: <TrendingUp className="h-4 w-4" />,
          onClick: () => console.log('Bulk import allocations')
        },
        {
          label: 'Calendar View',
          icon: <Calendar className="h-4 w-4" />,
          onClick: () => console.log('Open calendar view')
        }
      ]}
      searchQuery={searchQuery}
      onClearSearch={handleClearSearch}
    >
      {/* Allocation Sheet */}
      <AllocationSheet
        open={allocationSheetOpen}
        onOpenChange={setAllocationSheetOpen}
        suppliers={suppliers}
        products={products}
        allocation={editingAllocation}
        onSuccess={() => {
          setAllocationSheetOpen(false);
          setEditingAllocation(null);
          window.location.reload();
        }}
      />
    </EntityPageLayout>
  );
}
