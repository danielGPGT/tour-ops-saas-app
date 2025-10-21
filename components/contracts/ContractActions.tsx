"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Copy, Heart, MoreHorizontal, FileText, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { archiveContract, unarchiveContract, duplicateContract } from "@/app/contracts/actions";
import { toast } from "sonner";

type Contract = {
  id: number;
  reference: string;
  status?: string;
  supplier_id: number;
  contract_deadlines?: any[];
  signed_date?: string;
  contract_type?: string;
};

type Props = {
  contract: Contract;
  suppliers: Array<{ id: number; name: string; channels?: string[]; status?: string }>;
  onSuccess?: () => void;
};

export function ContractActions({ contract, suppliers, onSuccess }: Props) {
  const router = useRouter();
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [isArchiving, setIsArchiving] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);

  const handleEdit = () => {
    router.push(`/contracts/${contract.id}`);
  };

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await archiveContract(contract.id, { redirect: false });
      toast.success(`Contract "${contract.reference}" archived successfully`);
      setArchiveOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive contract");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    try {
      setIsArchiving(true);
      await unarchiveContract(contract.id, { redirect: false });
      toast.success(`Contract "${contract.reference}" restored successfully`);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore contract");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      setIsDuplicating(true);
      await duplicateContract(contract.id, { redirect: false });
      toast.success(`Contract "${contract.reference}" duplicated successfully`);
      onSuccess?.();
      // Refresh the page to show the new contract
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate contract");
    } finally {
      setIsDuplicating(false);
    }
  };


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {isDuplicating ? 'Copying...' : 'Make a copy'}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            <Heart className="h-4 w-4 mr-2" />
            Favorite
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {contract.status === 'archived' ? (
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); handleUnarchive(); }}
              disabled={isArchiving}
            >
              {isArchiving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArchiveRestore className="h-4 w-4 mr-2" />
              )}
              {isArchiving ? 'Restoring...' : 'Restore'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              className="text-orange-600 focus:text-orange-600"
              onClick={(e) => { e.stopPropagation(); setArchiveOpen(true); }}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Archive Confirmation */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Contract</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>Are you sure you want to archive this contract?</p>
                
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-semibold">{contract.reference}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>📅 {contract.contract_deadlines?.length || 0} deadlines</span>
                    <span>📄 {contract.contract_type || 'No type'}</span>
                    <span>📅 {contract.signed_date ? 'Signed' : 'Not signed'}</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-sm text-blue-800">
                    ℹ️ Archived contracts can be restored later. This will hide the contract from the main view.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleArchive}
              disabled={isArchiving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isArchiving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Contract
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
