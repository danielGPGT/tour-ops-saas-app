"use client";

import React from "react";
import { EntityPageLayout } from "@/components/common/EntityPageLayout";
import { DataTableColumn } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Plus, 
  Building2, 
  Package, 
  Star, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Globe
} from "lucide-react";
import { RatePlanSheet } from "./RatePlanSheet";
import { format } from "date-fns";

export interface RatePlan {
  id: bigint;
  org_id: bigint;
  product_variant_id: bigint;
  supplier_id: bigint;
  contract_version_id: bigint;
  inventory_model: string;
  currency: string;
  markets: string[];
  channels: string[];
  preferred: boolean;
  valid_from: string;
  valid_to: string;
  rate_doc: any;
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
  contract_versions?: {
    id: bigint;
    valid_from: string;
    valid_to: string;
  };
}

export interface RatesNewPageClientProps {
  ratePlans: RatePlan[];
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
    preferredCount: number;
    newThisMonth: number;
    uniqueSuppliersWithRates: number;
  };
}

export function RatesNewPageClient({
  ratePlans,
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
}: RatesNewPageClientProps) {
  const [selectedRatePlans, setSelectedRatePlans] = React.useState<RatePlan[]>([]);
  const [ratePlanSheetOpen, setRatePlanSheetOpen] = React.useState(false);
  const [editingRatePlan, setEditingRatePlan] = React.useState<RatePlan | null>(null);

  // Table columns
  const columns: DataTableColumn<RatePlan>[] = [
    {
      key: 'product_variants',
      header: 'Product',
      render: (ratePlan) => (
        <div className="flex items-center gap-2">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${
            ratePlan.product_variants?.products?.product_types?.color 
              ? `bg-${ratePlan.product_variants.products.product_types.color}-100 dark:bg-${ratePlan.product_variants.products.product_types.color}-900/20`
              : 'bg-primary/10'
          }`}>
            <Package className="h-3 w-3" />
          </div>
          <div>
            <p className="font-medium">{ratePlan.product_variants?.name || 'Unknown Product'}</p>
            <p className="text-sm text-muted-foreground">
              {ratePlan.product_variants?.products?.name || 'Unknown Product'}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'suppliers',
      header: 'Supplier',
      render: (ratePlan) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{ratePlan.suppliers?.name || 'Unknown Supplier'}</p>
            <p className="text-sm text-muted-foreground">
              {ratePlan.currency} • {ratePlan.inventory_model}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'inventory_model',
      header: 'Model',
      render: (ratePlan) => {
        const modelConfig = {
          committed: { label: 'Committed', variant: 'default' as const, icon: CheckCircle2 },
          freesale: { label: 'Freesale', variant: 'secondary' as const, icon: RefreshCw },
          on_request: { label: 'On Request', variant: 'outline' as const, icon: AlertCircle }
        };
        
        const config = modelConfig[ratePlan.inventory_model as keyof typeof modelConfig] || modelConfig.committed;
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
      key: 'markets',
      header: 'Markets',
      render: (ratePlan) => (
        <div className="flex flex-wrap gap-1">
          {ratePlan.markets?.slice(0, 2).map((market, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {market}
            </Badge>
          ))}
          {ratePlan.markets?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{ratePlan.markets.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'valid_from',
      header: 'Valid Period',
      render: (ratePlan) => (
        <div className="text-sm">
          <div className="font-medium">
            {format(new Date(ratePlan.valid_from), "MMM d, yyyy")}
          </div>
          <div className="text-muted-foreground">
            to {format(new Date(ratePlan.valid_to), "MMM d, yyyy")}
          </div>
        </div>
      )
    },
    {
      key: 'preferred',
      header: 'Priority',
      render: (ratePlan) => (
        <div className="flex items-center gap-1">
          {ratePlan.preferred && (
            <Badge variant="default" className="gap-1">
              <Star className="h-3 w-3" />
              Preferred
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (ratePlan) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingRatePlan(ratePlan);
              setRatePlanSheetOpen(true);
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
      label: 'Set Preferred',
      icon: Star,
      onClick: () => console.log('Set selected as preferred'),
      variant: 'default' as const
    },
    {
      label: 'Duplicate',
      icon: RefreshCw,
      onClick: () => console.log('Duplicate selected rate plans'),
      variant: 'outline' as const
    },
    {
      label: 'Archive',
      icon: AlertCircle,
      onClick: () => console.log('Archive selected rate plans'),
      variant: 'destructive' as const
    }
  ];

  // Summary cards
  const summaryCards = [
    {
      id: 'total',
      title: 'Total Rate Plans',
      value: stats.totalCount,
      icon: <DollarSign className="h-4 w-4" />,
      description: 'All rate plans'
    },
    {
      id: 'committed',
      title: 'Committed',
      value: stats.committedCount,
      icon: <CheckCircle2 className="h-4 w-4" />,
      description: 'Fixed allocation',
      iconBackgroundColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      id: 'freesale',
      title: 'Freesale',
      value: stats.freesaleCount,
      icon: <RefreshCw className="h-4 w-4" />,
      description: 'Unlimited availability',
      iconBackgroundColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      id: 'on_request',
      title: 'On Request',
      value: stats.onRequestCount,
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Must confirm',
      iconBackgroundColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    }
  ];

  // Empty state
  const emptyState = {
    icon: <DollarSign className="h-8 w-8 text-muted-foreground" />,
    title: "No rate plans found",
    description: "Create your first rate plan to start managing pricing."
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    window.location.href = `?${params.toString()}`;
  };

  const handleClearSearch = () => {
    window.location.href = '/rates-new';
  };

  return (
    <EntityPageLayout
      title="Rate Plans"
      subtitle={`${stats.totalCount.toLocaleString()} total • ${stats.preferredCount.toLocaleString()} preferred`}
      searchPlaceholder="Search rate plans..."
      searchParam="q"
      data={ratePlans}
      columns={columns}
      selectedItems={selectedRatePlans}
      onSelectionChange={setSelectedRatePlans}
      getId={(ratePlan) => ratePlan.id.toString()}
      emptyState={emptyState}
      bulkActions={bulkActions}
      getItemName={(ratePlan) => ratePlan.product_variants?.name || 'Unknown Product'}
      getItemId={(ratePlan) => ratePlan.id.toString()}
      entityName="rate plan"
      onSelectionClear={() => setSelectedRatePlans([])}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      searchParams={searchParams}
      summaryCards={summaryCards}
      primaryAction={{
        label: 'New Rate Plan',
        icon: <Plus className="h-4 w-4" />,
        onClick: () => setRatePlanSheetOpen(true)
      }}
      secondaryActions={[
        {
          label: 'Import',
          icon: <TrendingUp className="h-4 w-4" />,
          onClick: () => console.log('Import rate plans')
        }
      ]}
      searchQuery={searchQuery}
      onClearSearch={handleClearSearch}
    >
      {/* Rate Plan Sheet */}
      <RatePlanSheet
        open={ratePlanSheetOpen}
        onOpenChange={setRatePlanSheetOpen}
        suppliers={suppliers}
        products={products}
        ratePlan={editingRatePlan}
        onSuccess={() => {
          setRatePlanSheetOpen(false);
          setEditingRatePlan(null);
          window.location.reload();
        }}
      />
    </EntityPageLayout>
  );
}
