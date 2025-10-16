"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Globe, CheckCircle2 } from "lucide-react";
import { SupplierActions } from "./SupplierActions";
import { format } from "date-fns";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
  terms?: any;
  created_at: Date;
};

type Props = {
  suppliers: Supplier[];
  selectedSuppliers: Supplier[];
  onSelectionChange: (suppliers: Supplier[]) => void;
};

export function SuppliersTable({ suppliers, selectedSuppliers, onSelectionChange }: Props) {
  const selectedIds = new Set(selectedSuppliers.map(s => s.id.toString()));
  const allSelected = suppliers.length > 0 && suppliers.every(s => selectedIds.has(s.id.toString()));
  const someSelected = suppliers.some(s => selectedIds.has(s.id.toString()));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSuppliers, ...suppliers.filter(s => !selectedIds.has(s.id.toString()))]);
    } else {
      onSelectionChange(selectedSuppliers.filter(s => !suppliers.some(supplier => supplier.id === s.id)));
    }
  };

  const handleSelectSupplier = (supplier: Supplier, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedSuppliers, supplier]);
    } else {
      onSelectionChange(selectedSuppliers.filter(s => s.id !== supplier.id));
    }
  };

  return (
    <TooltipProvider>
      <Table className="bg-card shadow-sm rounded-lg">
        <TableHeader>
          <TableRow className="">
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[200px]">Supplier</TableHead>
            <TableHead className="w-[180px]">Contact</TableHead>
            <TableHead className="w-[150px]">Channels</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[120px]">Created</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((s) => (
            <TableRow key={s.id.toString()}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(s.id.toString())}
                  onCheckedChange={(checked) => handleSelectSupplier(s, Boolean(checked))}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="font-medium text-sm">{s.name}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  {s.terms?.contact_email ? (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Email:</span> {s.terms.contact_email}
                    </div>
                  ) : null}
                  {s.terms?.contact_phone ? (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Phone:</span> {s.terms.contact_phone}
                    </div>
                  ) : null}
                  {!s.terms?.contact_email && !s.terms?.contact_phone && (
                    <div className="text-xs text-muted-foreground">—</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(s.channels ?? []).length > 0 ? (
                    (s.channels ?? []).slice(0, 2).map((c) => (
                      <Tooltip key={c}>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {c}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{c === 'b2c' ? 'Business to Consumer' : 
                               c === 'b2b' ? 'Business to Business' : 
                               `Distribution channel: ${c}`}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {(s.channels ?? []).length > 2 && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          +{(s.channels ?? []).length - 2}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>More channels: {(s.channels ?? []).slice(2).join(', ')}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {s.status === "active" ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {s.status}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Tooltip>
                  <TooltipTrigger>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(s.created_at), "MMM d")}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{format(new Date(s.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-right">
                <SupplierActions supplier={{ 
                  id: s.id, 
                  name: s.name, 
                  channels: s.channels ?? [], 
                  status: s.status ?? undefined 
                }} />
              </TableCell>
            </TableRow>
          ))}
          {suppliers.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">No suppliers found</p>
                    <p className="text-xs text-muted-foreground">
                      Add your first supplier to get started
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
