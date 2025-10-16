"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Copy, Pencil, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { bulkDeleteSuppliers, bulkDuplicateSuppliers } from "@/app/suppliers/actions";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
};

type Props = {
  selectedSuppliers: Supplier[];
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  onBulkDuplicate: () => void;
  onSelectionClear: () => void;
};

export function BulkActions({ selectedSuppliers, onBulkEdit, onBulkDelete, onBulkDuplicate, onSelectionClear }: Props) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const selectedCount = selectedSuppliers.length;

  if (selectedCount === 0) return null;

  const handleBulkDelete = async () => {
    setIsLoading(true);
    try {
      const supplierIds = selectedSuppliers.map(s => s.id);
      await bulkDeleteSuppliers(supplierIds);
      toast.success(`${selectedCount} supplier${selectedCount !== 1 ? 's' : ''} deleted successfully`);
      setDeleteOpen(false);
      onSelectionClear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDuplicate = async () => {
    setIsLoading(true);
    try {
      const supplierIds = selectedSuppliers.map(s => s.id);
      await bulkDuplicateSuppliers(supplierIds);
      toast.success(`${selectedCount} supplier${selectedCount !== 1 ? 's' : ''} duplicated successfully`);
      onSelectionClear();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 border rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount} supplier{selectedCount !== 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onBulkEdit}
          className="h-8 gap-1"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleBulkDuplicate}
          disabled={isLoading}
          className="h-8 gap-1"
        >
          <Copy className="h-3 w-3" />
          {isLoading ? "Duplicating..." : "Duplicate"}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedCount} supplier{selectedCount !== 1 ? 's' : ''}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Supplier{selectedCount !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedCount} supplier{selectedCount !== 1 ? 's' : ''}</strong>? 
              This action cannot be undone.
              {selectedCount <= 5 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Suppliers to be deleted:</p>
                  <ul className="text-sm text-muted-foreground mt-1">
                    {selectedSuppliers.map(s => (
                      <li key={s.id.toString()}>• {s.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isLoading}>
              {isLoading ? "Deleting..." : `Delete ${selectedCount} supplier${selectedCount !== 1 ? 's' : ''}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
