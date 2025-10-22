"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createDatabaseService } from "@/lib/database";

const DEFAULT_ORG_ID = '11111111-1111-1111-1111-111111111111'; // TODO: replace with org from session/tenant resolution

// Product Type Schema
const ProductTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
});

// Product Subtype Schema
const ProductSubtypeSchema = z.object({
  product_type_id: z.number().min(1, "Product type is required"),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().min(1, "Icon is required"),
});

// Create Product Type
export async function createProductType(formData: FormData) {
  try {
    const orgId = DEFAULT_ORG_ID;

    const validatedData = ProductTypeSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || "",
      icon: formData.get("icon"),
      color: formData.get("color"),
    });

    const db = await createDatabaseService();
    const supabase = db.getServerDatabase();

    const { data: productType, error } = await supabase
      .from('product_types')
      .insert({
        organization_id: orgId,
        type_name: validatedData.name,
        type_code: validatedData.name.toLowerCase().replace(/\s+/g, '-'),
        schema_definition: {
          description: validatedData.description,
          icon: validatedData.icon,
          color: validatedData.color
        },
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/product-types");
    return { success: true, data: productType };
  } catch (error) {
    console.error("Error creating product type:", error);
    return { success: false, error: "Failed to create product type" };
  }
}

// Update Product Type
export async function updateProductType(id: number, formData: FormData) {
  try {
    const orgId = DEFAULT_ORG_ID;

    const validatedData = ProductTypeSchema.parse({
      name: formData.get("name"),
      description: formData.get("description") || "",
      icon: formData.get("icon"),
      color: formData.get("color"),
    });

    // Check if it's a default type (can't edit defaults)
    const existingType = await prisma.product_types.findFirst({
      where: { id: BigInt(id), org_id: orgId },
    });

    if (!existingType) throw new Error("Product type not found");
    if (existingType.is_default) throw new Error("Cannot edit default product types");

    const productType = await prisma.product_types.update({
      where: { id: BigInt(id) },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        color: validatedData.color,
      },
    });

    revalidatePath("/product-types");
    return { success: true, data: productType };
  } catch (error) {
    console.error("Error updating product type:", error);
    return { success: false, error: "Failed to update product type" };
  }
}

// Delete Product Type
export async function deleteProductType(id: number) {
  try {
    const orgId = DEFAULT_ORG_ID;

    // Check if it's a default type (can't delete defaults)
    const existingType = await prisma.product_types.findFirst({
      where: { id: BigInt(id), org_id: orgId },
      include: {
        products: true,
      },
    });

    if (!existingType) throw new Error("Product type not found");
    if (existingType.is_default) throw new Error("Cannot delete default product types");

    // Check if any products are using this type
    if (existingType.products.length > 0) {
      throw new Error("Cannot delete product type that is in use by products");
    }

    await prisma.product_types.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/product-types");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product type:", error);
    return { success: false, error: "Failed to delete product type" };
  }
}

// Bulk delete product types
export async function bulkDeleteProductTypes(ids: number[]) {
  try {
    const orgId = DEFAULT_ORG_ID;

    // Check if any are default types or in use
    const typesToDelete = await prisma.product_types.findMany({
      where: { 
        id: { in: ids.map(id => BigInt(id)) },
        org_id: orgId 
      },
      include: {
        products: true,
      },
    });

    const errors: string[] = [];
    const validIds: bigint[] = [];

    for (const type of typesToDelete) {
      if (type.is_default) {
        errors.push(`Cannot delete default type: ${type.name}`);
      } else if (type.products.length > 0) {
        errors.push(`Cannot delete type in use: ${type.name}`);
      } else {
        validIds.push(type.id);
      }
    }

    if (validIds.length > 0) {
      await prisma.product_types.deleteMany({
        where: { id: { in: validIds } },
      });
    }

    revalidatePath("/product-types");
    
    if (errors.length > 0) {
      return { success: false, error: errors.join(", ") };
    }

    return { success: true };
  } catch (error) {
    console.error("Error bulk deleting product types:", error);
    return { success: false, error: "Failed to delete product types" };
  }
}

// Create Product Subtype
export async function createProductSubtype(formData: FormData) {
  try {
    const orgId = DEFAULT_ORG_ID;

    const validatedData = ProductSubtypeSchema.parse({
      product_type_id: Number(formData.get("product_type_id")),
      name: formData.get("name"),
      description: formData.get("description") || "",
      icon: formData.get("icon"),
    });

    const productSubtype = await prisma.product_subtypes.create({
      data: {
        org_id: orgId,
        product_type_id: BigInt(validatedData.product_type_id),
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
        is_default: false, // Custom subtypes are never default
      },
    });

    revalidatePath("/product-types");
    return { success: true, data: productSubtype };
  } catch (error) {
    console.error("Error creating product subtype:", error);
    return { success: false, error: "Failed to create product subtype" };
  }
}

// Update Product Subtype
export async function updateProductSubtype(id: number, formData: FormData) {
  try {
    const orgId = DEFAULT_ORG_ID;

    const validatedData = ProductSubtypeSchema.parse({
      product_type_id: Number(formData.get("product_type_id")),
      name: formData.get("name"),
      description: formData.get("description") || "",
      icon: formData.get("icon"),
    });

    // Check if it's a default subtype (can't edit defaults)
    const existingSubtype = await prisma.product_subtypes.findFirst({
      where: { id: BigInt(id), org_id: orgId },
    });

    if (!existingSubtype) throw new Error("Product subtype not found");
    if (existingSubtype.is_default) throw new Error("Cannot edit default product subtypes");

    const productSubtype = await prisma.product_subtypes.update({
      where: { id: BigInt(id) },
      data: {
        product_type_id: BigInt(validatedData.product_type_id),
        name: validatedData.name,
        description: validatedData.description,
        icon: validatedData.icon,
      },
    });

    revalidatePath("/product-types");
    return { success: true, data: productSubtype };
  } catch (error) {
    console.error("Error updating product subtype:", error);
    return { success: false, error: "Failed to update product subtype" };
  }
}

// Delete Product Subtype
export async function deleteProductSubtype(id: number) {
  try {
    const orgId = DEFAULT_ORG_ID;

    // Check if it's a default subtype (can't delete defaults)
    const existingSubtype = await prisma.product_subtypes.findFirst({
      where: { id: BigInt(id), org_id: orgId },
      include: {
        product_variants: true,
      },
    });

    if (!existingSubtype) throw new Error("Product subtype not found");
    if (existingSubtype.is_default) throw new Error("Cannot delete default product subtypes");

    // Check if any variants are using this subtype
    if (existingSubtype.product_variants.length > 0) {
      throw new Error("Cannot delete product subtype that is in use by variants");
    }

    await prisma.product_subtypes.delete({
      where: { id: BigInt(id) },
    });

    revalidatePath("/product-types");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product subtype:", error);
    return { success: false, error: "Failed to delete product subtype" };
  }
}

// Bulk delete product subtypes
export async function bulkDeleteProductSubtypes(ids: number[]) {
  try {
    const orgId = DEFAULT_ORG_ID;

    // Check if any are default subtypes or in use
    const subtypesToDelete = await prisma.product_subtypes.findMany({
      where: { 
        id: { in: ids.map(id => BigInt(id)) },
        org_id: orgId 
      },
      include: {
        product_variants: true,
      },
    });

    const errors: string[] = [];
    const validIds: bigint[] = [];

    for (const subtype of subtypesToDelete) {
      if (subtype.is_default) {
        errors.push(`Cannot delete default subtype: ${subtype.name}`);
      } else if (subtype.product_variants.length > 0) {
        errors.push(`Cannot delete subtype in use: ${subtype.name}`);
      } else {
        validIds.push(subtype.id);
      }
    }

    if (validIds.length > 0) {
      await prisma.product_subtypes.deleteMany({
        where: { id: { in: validIds } },
      });
    }

    revalidatePath("/product-types");
    
    if (errors.length > 0) {
      return { success: false, error: errors.join(", ") };
    }

    return { success: true };
  } catch (error) {
    console.error("Error bulk deleting product subtypes:", error);
    return { success: false, error: "Failed to delete product subtypes" };
  }
}