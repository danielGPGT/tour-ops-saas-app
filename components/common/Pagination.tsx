"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  searchParams?: Record<string, string>;
  className?: string;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange,
  searchParams = {},
  className = ""
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const buildUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `?${params.toString()}`;
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <p className="text-sm text-muted-foreground">
        Showing {startItem.toLocaleString()} to {endItem.toLocaleString()} of {totalItems.toLocaleString()} items
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <a href={buildUrl(currentPage - 1)}>
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </a>
          ) : (
            <>
              <ChevronLeft className="h-3 w-3 mr-1" />
              Previous
            </>
          )}
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          asChild={currentPage < totalPages}
        >
          {currentPage < totalPages ? (
            <a href={buildUrl(currentPage + 1)}>
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </a>
          ) : (
            <>
              Next
              <ChevronRight className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
