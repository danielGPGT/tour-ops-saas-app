"use client";

import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SearchBar } from "./SearchBar";
import { DataTable } from "./DataTable";
import { BulkActions } from "./BulkActions";
import { Pagination } from "./Pagination";
import { SummaryCards } from "./SummaryCards";
import { SummaryCardsSkeleton } from "./LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export interface EntityPageLayoutProps<T> {
  // Page header
  title: string;
  subtitle?: string;
  
  // Search
  searchPlaceholder?: string;
  searchParam?: string;
  
  // Table
  data: T[];
  columns: any[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  getId: (item: T) => string | number;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  onRowClick?: (item: T) => void;
  
  // Bulk actions
  bulkActions: any[];
  getItemName: (item: T) => string;
  getItemId: (item: T) => string | number;
  entityName: string;
  onSelectionClear: () => void;
  isLoading?: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  searchParams?: Record<string, string>;
  
  // Summary cards
  summaryCards?: any[];
  
  // Actions
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
  
  // Search results info
  searchQuery?: string;
  onClearSearch?: () => void;
  
  // Custom content
  children?: React.ReactNode;
  
  className?: string;
}

export function EntityPageLayout<T>({
  title,
  subtitle,
  searchPlaceholder = "Search...",
  searchParam = "q",
  data,
  columns,
  selectedItems,
  onSelectionChange,
  getId,
  emptyState,
  onRowClick,
  bulkActions,
  getItemName,
  getItemId,
  entityName,
  onSelectionClear,
  isLoading = false,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  searchParams = {},
  summaryCards,
  primaryAction,
  secondaryActions,
  searchQuery,
  onClearSearch,
  children,
  className = ""
}: EntityPageLayoutProps<T>) {
  return (
    <TooltipProvider>
      <div className={`space-y-4 ${className}`}>
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SearchBar 
              placeholder={searchPlaceholder}
              searchParam={searchParam}
              className=""
            />
            {secondaryActions?.map((action, index) => (
              <Button 
                key={index}
                size="sm" 
                variant="outline"
                className="h-8 gap-1"
                onClick={action.onClick}
              >
                {action.icon || <Plus className="h-3 w-3" />}
                {action.label}
              </Button>
            ))}
            {primaryAction && (
              <Button 
                size="sm" 
                className="h-8 gap-1"
                onClick={primaryAction.onClick}
              >
                {primaryAction.icon || <Plus className="h-3 w-3" />}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {isLoading ? (
          <SummaryCardsSkeleton />
        ) : (
          summaryCards && summaryCards.length > 0 && (
            <SummaryCards cards={summaryCards} />
          )
        )}

        {/* Search Results Info */}
        {searchQuery && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {totalItems === 0 ? (
                <>No {entityName}s found for "<span className="font-medium">{searchQuery}</span>"</>
              ) : (
                <>
                  {totalItems} {entityName}{totalItems !== 1 ? 's' : ''} found for "<span className="font-medium">{searchQuery}</span>"
                </>
              )}
            </p>
            {totalItems > 0 && onClearSearch && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClearSearch}
                className="h-8 text-muted-foreground hover:text-foreground"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Bulk Actions */}
        <BulkActions
          selectedItems={selectedItems}
          actions={bulkActions}
          getItemName={getItemName}
          getItemId={getItemId}
          entityName={entityName}
          onSelectionClear={onSelectionClear}
          isLoading={isLoading}
        />

        {/* Data Table */}
        <DataTable
          data={data}
          columns={columns}
          selectedItems={selectedItems}
          onSelectionChange={onSelectionChange}
          getId={getId}
          emptyState={emptyState}
          onRowClick={onRowClick}
          isLoading={isLoading}
        />

        {/* Custom Content (like modals) */}
        {children}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          searchParams={searchParams}
        />
      </div>
    </TooltipProvider>
  );
}