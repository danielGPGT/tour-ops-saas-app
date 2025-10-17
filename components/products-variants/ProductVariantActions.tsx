"use client";

import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Copy, Heart, Trash2, Eye, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ProductVariant = {
  id: number;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  product_id?: number;
  attributes?: any;
  images?: any[];
  products: {
    id: number;
    name: string;
    type: string;
    status: string;
  };
  rate_plans: Array<{
    id: number;
    preferred: boolean;
    rate_doc: any;
    channels: string[];
    markets: string[];
    valid_from: string;
    valid_to: string;
  }>;
};

type Props = {
  variant: ProductVariant;
  onEdit?: (variant: ProductVariant) => void;
};

export function ProductVariantActions({ variant, onEdit }: Props) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      // TODO: Implement delete API call
      console.log("Delete variant:", variant.id);
      setDeleteOpen(false);
      toast.success("Product variant deleted successfully");
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to delete product variant");
    }
  };

  const handleDuplicate = async () => {
    try {
      // TODO: Implement duplicate API call
      console.log("Duplicate variant:", variant.id);
      toast.success(`Product variant "${variant.name}" duplicated successfully`);
    } catch (error) {
      console.error('Duplicate failed:', error);
      toast.error(error instanceof Error ? error.message : "Failed to duplicate product variant");
    }
  };

  const handleFavorite = () => {
    // TODO: Implement favorite functionality
    toast.info("Favorite functionality coming soon!");
  };

  const handleView = () => {
    router.push(`/products-variants/${variant.id}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(variant);
    } else {
      console.log("Edit variant:", variant.id);
      toast.info("Edit functionality coming soon!");
    }
  };

  const handleViewRates = () => {
    router.push(`/products-variants/${variant.id}?tab=rates`);
  };

  const handleViewInventory = () => {
    router.push(`/products-variants/${variant.id}?tab=inventory`);
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
            onClick={handleView}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleViewRates}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            View Rates
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleViewInventory}
          >
            <Package className="h-4 w-4 mr-2" />
            View Inventory
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={handleEdit}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{variant.name}"</strong>? This action cannot be undone.
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
