"use client";

import React from "react";
import { SuppliersTable } from "./SuppliersTable";
import { BulkActions } from "./BulkActions";
import { BulkEditModal } from "./BulkEditModal";
import { bulkUpdateSuppliers } from "@/app/suppliers/actions";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
  created_at: Date;
};

type Props = {
  suppliers: Supplier[];
  children: React.ReactNode; // For pagination and other server components
};

export function SuppliersPageClient({ suppliers, children }: Props) {
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<Supplier[]>([]);
  const [bulkEditOpen, setBulkEditOpen] = React.useState(false);

  const handleBulkEdit = () => {
    setBulkEditOpen(true);
  };

  const handleBulkUpdate = async (updates: { channels?: string[]; status?: string }) => {
    const supplierIds = selectedSuppliers.map(s => s.id);
    await bulkUpdateSuppliers(supplierIds, updates);
    setSelectedSuppliers([]); // Clear selection after update
  };

  const handleBulkDelete = () => {
    // This will be handled by the BulkActions component
    console.log("Bulk delete:", selectedSuppliers);
  };

  const handleBulkDuplicate = () => {
    // This will be handled by the BulkActions component
    console.log("Bulk duplicate:", selectedSuppliers);
  };

  const handleSelectionClear = () => {
    setSelectedSuppliers([]);
  };

  return (
    <>
      <BulkActions
        selectedSuppliers={selectedSuppliers}
        onBulkEdit={handleBulkEdit}
        onBulkDelete={handleBulkDelete}
        onBulkDuplicate={handleBulkDuplicate}
        onSelectionClear={handleSelectionClear}
      />
      
      <SuppliersTable
        suppliers={suppliers}
        selectedSuppliers={selectedSuppliers}
        onSelectionChange={setSelectedSuppliers}
      />
      
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedSuppliers={selectedSuppliers}
        onBulkUpdate={handleBulkUpdate}
      />
      
      {children}
    </>
  );
}
