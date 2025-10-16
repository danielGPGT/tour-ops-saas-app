"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Copy, Heart, MoreHorizontal, FileText, Settings } from "lucide-react";
import { deleteContract, duplicateContract } from "@/app/contracts/actions";
import { toast } from "sonner";

type Contract = {
  id: number;
  reference: string;
  status?: string;
  supplier_id: number;
};

type Props = {
  contract: Contract;
  suppliers: Array<{ id: number; name: string; channels?: string[]; status?: string }>;
  onEdit?: (contractId: number) => void;
  onSuccess?: () => void;
};

export function ContractActions({ contract, suppliers, onEdit, onSuccess }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleEdit = () => {
    onEdit?.(contract.id);
  };

  const handleDelete = async () => {
    try {
      await deleteContract(contract.id, { redirect: false });
      toast.success(`Contract "${contract.reference}" deleted successfully`);
      setDeleteOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete contract");
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateContract(contract.id, { redirect: false });
      toast.success(`Contract "${contract.reference}" duplicated successfully`);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate contract");
    }
  };

  const handleManageVersions = () => {
    router.push(`/contracts/${contract.id}/versions`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleManageVersions}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Versions
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Make a copy
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Heart className="h-4 w-4 mr-2" />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contract</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the contract <strong>"{contract.reference}"</strong>? 
              This action cannot be undone.
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <p><strong>Contract:</strong> {contract.reference}</p>
                <p><strong>Status:</strong> {contract.status || "Unknown"}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
