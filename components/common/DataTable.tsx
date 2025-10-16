"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, value: any) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  selectedItems: T[];
  onSelectionChange: (items: T[]) => void;
  getId: (item: T) => string | number;
  emptyState?: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  className?: string;
}

export function DataTable<T>({ 
  data, 
  columns, 
  selectedItems, 
  onSelectionChange, 
  getId,
  emptyState,
  className = ""
}: DataTableProps<T>) {
  const selectedIds = new Set(selectedItems.map(item => getId(item).toString()));
  const allSelected = data.length > 0 && data.every(item => selectedIds.has(getId(item).toString()));
  const someSelected = data.some(item => selectedIds.has(getId(item).toString()));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, ...data.filter(item => !selectedIds.has(getId(item).toString()))]);
    } else {
      onSelectionChange(selectedItems.filter(item => !data.some(dataItem => getId(dataItem) === getId(item))));
    }
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selectedItem => getId(selectedItem) !== getId(item)));
    }
  };

  const renderCellContent = (item: T, column: DataTableColumn<T>) => {
    const value = typeof column.key === 'string' ? (item as any)[column.key] : item[column.key];
    
    if (column.render) {
      return column.render(item, value);
    }
    
    // Default rendering
    if (value instanceof Date) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-sm text-muted-foreground">
              {format(new Date(value), "MMM d")}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{format(new Date(value), "MMM d, yyyy 'at' h:mm a")}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.length > 0 ? (
            value.slice(0, 2).map((v, index) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                {String(v)}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {value.length > 2 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{value.length - 2}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>More items: {value.slice(2).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }
    
    return <span className="text-sm">{String(value || '—')}</span>;
  };

  return (
    <TooltipProvider>
        
      <Table className={`bg-card shadow-sm rounded-md ${className}`}>
        <TableHeader className="">
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                    if (checkbox) {
                      checkbox.indeterminate = someSelected && !allSelected;
                    }
                  }
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {columns.map((column, index) => {
              // Determine alignment based on column width or content
              const isActionsColumn = column.header.toLowerCase().includes('actions');
              const isNumericColumn = column.header.toLowerCase().includes('created') || 
                                    column.header.toLowerCase().includes('updated') ||
                                    column.header.toLowerCase().includes('date') ||
                                    column.header.toLowerCase().includes('status') ||
                                    column.header.toLowerCase().includes('variants');
              
              const alignmentClass = isActionsColumn 
                ? "text-right" 
                : isNumericColumn 
                ? "text-center" 
                : "text-left";
              
              return (
                <TableHead 
                  key={index} 
                  className={`${column.width || ""} ${alignmentClass}`}
                >
                  {column.header}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={getId(item).toString()}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(getId(item).toString())}
                  onCheckedChange={(checked) => handleSelectItem(item, Boolean(checked))}
                />
              </TableCell>
              {columns.map((column, index) => {
                // Match alignment with header
                const isActionsColumn = column.header.toLowerCase().includes('actions');
                const isNumericColumn = column.header.toLowerCase().includes('created') || 
                                      column.header.toLowerCase().includes('updated') ||
                                      column.header.toLowerCase().includes('date') ||
                                      column.header.toLowerCase().includes('status') ||
                                      column.header.toLowerCase().includes('variants');
                
                const alignmentClass = isActionsColumn 
                  ? "text-right" 
                  : isNumericColumn 
                  ? "text-center" 
                  : "text-left";
                
                return (
                  <TableCell key={index} className={alignmentClass}>
                    {renderCellContent(item, column)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          {data.length === 0 && emptyState && (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  {emptyState.icon}
                  <div>
                    <p className="text-sm font-medium">{emptyState.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {emptyState.description}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
