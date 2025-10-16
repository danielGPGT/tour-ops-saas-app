"use client";

import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Copy, Heart, Trash2 } from "lucide-react";
import { SupplierSheet } from "./SupplierSheet";
import { deleteSupplier, duplicateSupplier } from "@/app/suppliers/actions";
import { toast } from "sonner";

type Supplier = {
  id: bigint;
  name: string;
  channels?: string[];
  status?: string;
};

type Props = {
  supplier: Supplier;
};

export function SupplierActions({ supplier }: Props) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      await deleteSupplier(supplier.id);
      setDeleteOpen(false);
      toast.success("Supplier deleted successfully");
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete supplier");
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateSupplier(supplier.id, { redirect: false });
      toast.success(`Supplier duplicated successfully`);
    } catch (error) {
      console.error('Duplicate failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to duplicate supplier");
    }
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
    toast.info("Favorite functionality coming soon!");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleDuplicate}
          >
            <Copy className="h-4 w-4 mr-2" />
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleFavorite}
          >
            <Heart className="h-4 w-4 mr-2" />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <SupplierSheet
        trigger={<div style={{ display: 'none' }} />}
        supplier={supplier}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{supplier.name}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
