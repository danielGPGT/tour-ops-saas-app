"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Package2, Plus, Trash2 } from "lucide-react";
import { SheetForm } from "@/components/ui/SheetForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createProductVariant, updateProductVariant } from "@/app/products/actions";

interface ProductVariantSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
  productName?: string;
  variant?: {
    id: number;
    name: string;
    subtype: string;
    status: string;
    attributes: Record<string, any>;
  };
  onVariantCreated?: () => void;
  onVariantUpdated?: () => void;
}

export function ProductVariantSheet({ 
  isOpen, 
  onClose, 
  productId, 
  productName,
  variant,
  onVariantCreated,
  onVariantUpdated
}: ProductVariantSheetProps) {
  const router = useRouter();

  // Convert attributes object to array format for the form
  const attributesArray = variant?.attributes ? Object.entries(variant.attributes).map(([key, value]) => ({
    key,
    value: String(value),
    type: typeof value === 'number' ? 'number' as const : 
          typeof value === 'boolean' ? 'boolean' as const : 'text' as const
  })) : [];

  const initialValues = {
    name: variant?.name || "",
    status: variant?.status || "active",
    subtype: variant?.subtype || "none",
    attributes: attributesArray
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!values.name.trim() || !productId) {
      throw new Error("Please fill in all required fields");
    }

    // Convert attributes array to object
    const parsedAttributes = values.attributes.reduce((acc, attr) => {
      if (attr.key.trim()) {
        let value: any = attr.value;
        
        // Convert value based on type
        if (attr.type === 'number') {
          value = parseFloat(attr.value) || 0;
        } else if (attr.type === 'boolean') {
          value = attr.value === 'true';
        }
        
        acc[attr.key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    if (variant) {
      // Update existing variant
      await updateProductVariant(variant.id, {
        name: values.name,
        subtype: values.subtype,
        status: values.status,
        attributes: parsedAttributes
      });
      
      router.refresh();
      onVariantUpdated?.();
    } else {
      // Create new variant
      await createProductVariant({
        product_id: productId,
        name: values.name,
        status: values.status,
        attributes: parsedAttributes
      });
      
      router.refresh();
      onVariantCreated?.();
    }
  };

  return (
    <SheetForm
      trigger={null}
      title={
        <div className="flex items-center gap-2">
          <Package2 className="h-5 w-5" />
          {variant ? "Edit Product Variant" : "Add Product Variant"}
        </div>
      }
      description={
        productName && (
          <span>
            {variant ? "Edit variant for" : "Add a new variant to"} <strong>{productName}</strong>
          </span>
        )
      }
      initial={initialValues}
      onSubmit={handleSubmit}
      submitLabel={variant ? "Update Variant" : "Create Variant"}
      open={isOpen}
      onOpenChange={onClose}
      afterSubmit={() => onClose()}
    >
      {({ values, set }) => (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Variant Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Standard Room, Morning Tour, Economy Seat"
              required
            />
          </div>

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
                    <span>Variant is available</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Inactive
                    </Badge>
                    <span>Variant is hidden</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Attributes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("attributes", [...values.attributes, { key: "", value: "", type: "text" }])}
                className="flex items-center gap-1 h-8 text-xs"
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            
            {values.attributes.length === 0 ? (
              <div className="text-center py-3 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                No attributes added yet. Click "Add" to get started.
              </div>
            ) : (
              <div className="space-y-1">
                {values.attributes.map((attr, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Key (e.g., capacity)"
                      value={attr.key}
                      onChange={(e) => {
                        const newAttributes = [...values.attributes];
                        newAttributes[index].key = e.target.value;
                        set("attributes", newAttributes);
                      }}
                      className="w-32 text-sm"
                    />
                    
                    <Select
                      value={attr.type}
                      onValueChange={(value: 'text' | 'number' | 'boolean') => {
                        const newAttributes = [...values.attributes];
                        newAttributes[index].type = value;
                        set("attributes", newAttributes);
                      }}
                    >
                      <SelectTrigger className="w-20 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Num</SelectItem>
                        <SelectItem value="boolean">Bool</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {attr.type === 'boolean' ? (
                      <Select
                        value={attr.value}
                        onValueChange={(value) => {
                          const newAttributes = [...values.attributes];
                          newAttributes[index].value = value;
                          set("attributes", newAttributes);
                        }}
                      >
                        <SelectTrigger className="w-16 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">T</SelectItem>
                          <SelectItem value="false">F</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder={attr.type === 'number' ? '0' : 'Value'}
                        value={attr.value}
                        type={attr.type === 'number' ? 'number' : 'text'}
                        onChange={(e) => {
                          const newAttributes = [...values.attributes];
                          newAttributes[index].value = e.target.value;
                          set("attributes", newAttributes);
                        }}
                        className="flex-1 text-sm"
                      />
                    )}
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newAttributes = values.attributes.filter((_, i) => i !== index);
                        set("attributes", newAttributes);
                      }}
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Add custom attributes like capacity, amenities, features, etc.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Package2 className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {values.name || "Variant Name"}
                </span>
                <Badge 
                  variant={values.status === "active" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {values.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              {values.attributes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {values.attributes.map((attr, index) => (
                    attr.key.trim() && (
                      <Badge key={index} variant="outline" className="text-xs">
                        {attr.key}: {attr.value || "..."}
                      </Badge>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </SheetForm>
  );
}