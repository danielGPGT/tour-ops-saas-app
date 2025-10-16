"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Tag, Bed, Users, Clock, Package, Settings, Star, Heart } from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProductSubtype, updateProductSubtype } from "@/app/product-types/actions";

interface ProductType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface ProductSubtype {
  id: number;
  org_id: number;
  product_type_id: number;
  name: string;
  description: string;
  icon: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductSubtypeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productSubtype?: ProductSubtype;
  productTypes: ProductType[];
  defaultProductTypeId?: number;
}

export function ProductSubtypeSheet({ 
  isOpen, 
  onClose, 
  productSubtype,
  productTypes,
  defaultProductTypeId
}: ProductSubtypeSheetProps) {
  const router = useRouter();
  const isEditing = !!productSubtype;

  const initialValues = {
    product_type_id: productSubtype?.product_type_id || defaultProductTypeId || "",
    name: productSubtype?.name || "",
    description: productSubtype?.description || "",
    icon: productSubtype?.icon || "Tag"
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!values.product_type_id || !values.name.trim()) {
      throw new Error("Please fill in all required fields");
    }

    const formData = new FormData();
    formData.append("product_type_id", values.product_type_id.toString());
    formData.append("name", values.name);
    formData.append("description", values.description);
    formData.append("icon", values.icon);

    if (isEditing) {
      await updateProductSubtype(productSubtype.id, formData);
    } else {
      await createProductSubtype(formData);
    }
    
    router.refresh();
  };

  // Icon options for subtypes
  const iconOptions = [
    { value: "Tag", label: "Tag", icon: Tag },
    { value: "Bed", label: "Bed", icon: Bed },
    { value: "Users", label: "Users", icon: Users },
    { value: "Clock", label: "Clock", icon: Clock },
    { value: "Package", label: "Package", icon: Package },
    { value: "Settings", label: "Settings", icon: Settings },
    { value: "Star", label: "Star", icon: Star },
    { value: "Heart", label: "Heart", icon: Heart }
  ];

  return (
    <SheetForm
      trigger={null}
      title={
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {isEditing ? "Edit Product Subtype" : "Add Product Subtype"}
        </div>
      }
      description={
        isEditing 
          ? "Update the product subtype details below."
          : "Create a new product subtype to categorize variants within product types."
      }
      initial={initialValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Update Subtype" : "Create Subtype"}
      open={isOpen}
      onOpenChange={onClose}
      afterSubmit={() => onClose()}
    >
      {({ values, set }) => (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="product_type_id">Product Type *</Label>
            <Select
              value={values.product_type_id.toString()}
              onValueChange={(value) => set("product_type_id", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {productTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{type.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({type.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Subtype Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., room_category, seat_tier, time_slot"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this subtype"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select
              value={values.icon}
              onValueChange={(value) => set("icon", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {values.name || "Subtype Name"}
                </span>
              </div>
              {values.description && (
                <p className="text-xs text-muted-foreground">
                  {values.description}
                </p>
              )}
              {values.product_type_id && (
                <p className="text-xs text-muted-foreground mt-1">
                  For: {productTypes.find(t => t.id === parseInt(values.product_type_id.toString()))?.name || "Selected Product Type"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </SheetForm>
  );
}
