"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Type, Building2, Activity, Calendar, Car, Gift, Bed, Users, Clock, Package } from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createProductType, updateProductType } from "@/app/product-types/actions";

type ProductType = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

interface ProductTypeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productType?: ProductType;
}

// Available icons for product types
const availableIcons = [
  { value: "Building2", label: "Building", icon: Building2 },
  { value: "Activity", label: "Activity", icon: Activity },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Car", label: "Car", icon: Car },
  { value: "Gift", label: "Gift", icon: Gift },
  { value: "Bed", label: "Bed", icon: Bed },
  { value: "Users", label: "Users", icon: Users },
  { value: "Clock", label: "Clock", icon: Clock },
  { value: "Package", label: "Package", icon: Package },
  { value: "Type", label: "Type", icon: Type },
];

// Available color themes
const colorThemes = [
  { value: "bg-blue-100 text-blue-800", label: "Blue", preview: "bg-blue-500" },
  { value: "bg-green-100 text-green-800", label: "Green", preview: "bg-green-500" },
  { value: "bg-purple-100 text-purple-800", label: "Purple", preview: "bg-purple-500" },
  { value: "bg-orange-100 text-orange-800", label: "Orange", preview: "bg-orange-500" },
  { value: "bg-pink-100 text-pink-800", label: "Pink", preview: "bg-pink-500" },
  { value: "bg-red-100 text-red-800", label: "Red", preview: "bg-red-500" },
  { value: "bg-yellow-100 text-yellow-800", label: "Yellow", preview: "bg-yellow-500" },
  { value: "bg-gray-100 text-gray-800", label: "Gray", preview: "bg-gray-500" },
];

export function ProductTypeSheet({ isOpen, onClose, productType }: ProductTypeSheetProps) {
  const router = useRouter();
  const isEditing = !!productType;

  const initialValues = {
    name: productType?.name || "",
    description: productType?.description || "",
    icon: productType?.icon || "Type",
    color: productType?.color || "bg-blue-100 text-blue-800"
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!values.name.trim()) {
      throw new Error("Please enter a product type name");
    }

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("icon", values.icon);
      formData.append("color", values.color);

      let result;
      if (isEditing && productType) {
        result = await updateProductType(productType.id, formData);
      } else {
        result = await createProductType(formData);
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to save product type");
      }

      router.refresh();
      onClose();
    } catch (error) {
      console.error("Error saving product type:", error);
      throw error;
    }
  };

  return (
    <SheetForm
      trigger={null}
      title={
        <div className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          {isEditing ? "Edit Product Type" : "Create Product Type"}
        </div>
      }
      description={
        isEditing
          ? "Update the product type information and settings."
          : "Create a new product type to organize your catalog. Product types help categorize your offerings."
      }
      initial={initialValues}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Update Product Type" : "Create Product Type"}
      open={isOpen}
      onOpenChange={onClose}
      afterSubmit={() => onClose()}
    >
      {({ values, set }) => (
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g., Accommodation, Activity, Event"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe what this product type represents..."
                rows={3}
              />
            </div>
          </div>

          {/* Visual Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Visual Settings</h3>
            
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
                  {availableIcons.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <SelectItem key={iconOption.value} value={iconOption.value}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{iconOption.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color Theme</Label>
              <Select
                value={values.color}
                onValueChange={(value) => set("color", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent>
                  {colorThemes.map((colorOption) => (
                    <SelectItem key={colorOption.value} value={colorOption.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${colorOption.preview}`} />
                        <span>{colorOption.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                {(() => {
                  const IconComponent = availableIcons.find(i => i.value === values.icon)?.icon || Type;
                  return <IconComponent className="h-4 w-4 text-muted-foreground" />;
                })()}
                <span className={`px-2 py-1 rounded text-xs font-medium ${values.color}`}>
                  {values.name || "Product Type Name"}
                </span>
              </div>
              {values.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {values.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </SheetForm>
  );
}
