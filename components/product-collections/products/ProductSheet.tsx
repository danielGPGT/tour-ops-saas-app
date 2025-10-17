"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package, Building2, Activity, Calendar, Car, Gift, Bed, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SheetForm } from "@/components/ui/SheetForm";
import { createProduct, updateProduct } from "@/app/products/actions";

type Product = {
  id: number;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type ProductType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
};

interface ProductSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  productTypes?: ProductType[];
}

export function ProductSheet({ isOpen, onClose, product, productTypes = [] }: ProductSheetProps) {
  const router = useRouter();
  const isEditing = !!product;

  // Dynamic icon resolver function
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      Building2,
      Activity,
      Calendar,
      Car,
      Gift,
      Bed,
      Users,
      Clock,
      Package
    };
    return iconMap[iconName] || Package;
  };

  const initialValues = {
    name: product?.name || "",
    type: product?.type || "",
    status: product?.status || "active"
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!values.name.trim() || !values.type) {
      throw new Error("Please fill in all required fields");
    }

    if (isEditing && product) {
      await updateProduct(product.id, values);
    } else {
      await createProduct(values);
    }
    
    router.refresh();
  };

  const selectedType = productTypes.find(t => t.value === initialValues.type);
  const TypeIcon = selectedType?.icon || Package;

  return (
    <SheetForm
      trigger={null}
      title={
        <div className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5" />
          {isEditing ? "Edit Product" : "Create Product"}
        </div>
      }
      description={
        isEditing 
          ? "Update product information and settings."
          : "Create a new product in your catalog. You can add variants after creation."
      }
      initial={initialValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Update Product" : "Create Product"}
      open={isOpen}
      onOpenChange={onClose}
      afterSubmit={() => onClose()}
    >
      {({ values, set }) => {
        const currentSelectedType = productTypes.find(t => t.value === values.type);
        const CurrentTypeIcon = currentSelectedType?.icon || Package;

        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Product Type *</Label>
              <Select
                value={values.type}
                onValueChange={(value) => set("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => {
                    const Icon = getIcon(type.icon);
                    return (
                      <SelectItem key={type.id} value={type.name}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {currentSelectedType && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CurrentTypeIcon className="h-4 w-4" />
                  <span className="font-medium text-sm">{currentSelectedType.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{currentSelectedType.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) => set("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs bg-primary-100 text-primary-800">
                        Active
                      </Badge>
                      <span>Product is active and available</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="inactive">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                      <span>Product is hidden from catalog</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Next Steps</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Add product variants (room types, seat classes, etc.)</li>
                <li>• Create rate plans with suppliers</li>
                <li>• Set up availability and allocation</li>
                <li>• Configure pricing and seasons</li>
              </ul>
            </div>
          </div>
        );
      }}
    </SheetForm>
  );
}
