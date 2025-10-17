"use client";

import React from "react";
import { Package2, Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type Product = {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  product_types?: {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_default: boolean;
  };
  product_variants?: Array<{
    id: number;
    name: string;
    subtype: string;
    status: string;
  }>;
};

interface ProductVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddVariant: (productId: number) => void;
  onEditVariant: (variantId: number) => void;
  onDeleteVariant: (variantId: number) => void;
  onRefresh?: () => void;
}

export function ProductVariantsModal({
  isOpen,
  onClose,
  product,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
  onRefresh,
}: ProductVariantsModalProps) {
  if (!product) return null;

  const variants = product.product_variants || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            {product.name} - Variants
          </DialogTitle>
          <DialogDescription>
            Manage variants for this product. You can add, edit, or delete variants as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Product:</span>
                <span className="ml-2">{product.name}</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {product.product_types?.name || product.type}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge 
                  variant={product.status === "active" ? "default" : "secondary"}
                  className="ml-2 text-xs"
                >
                  {product.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Total Variants:</span>
                <span className="ml-2 font-medium">{variants.length}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Product Variants</h3>
            <Button
              onClick={() => onAddVariant(product.id)}
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>

          {/* Variants List */}
          {variants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No variants yet</p>
              <p className="text-sm">Get started by adding your first variant for this product.</p>
              <Button
                onClick={() => onAddVariant(product.id)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Variant
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Package2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{variant.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {variant.subtype && variant.subtype !== 'none' && (
                          <>
                            <span>Subtype: </span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {variant.subtype.replace('_', ' ')}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={variant.status === "active" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {variant.status}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditVariant(variant.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteVariant(variant.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
