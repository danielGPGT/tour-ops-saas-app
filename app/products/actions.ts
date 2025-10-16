"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

const DEFAULT_ORG_ID = 1; // TODO: Get from session

// Product validation schemas
const ProductPayloadSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  type: z.enum(["accommodation", "activity", "event", "transfer", "package"]),
  status: z.enum(["active", "inactive"]).default("active"),
  product_type_id: z.number().optional()
});

const ProductVariantPayloadSchema = z.object({
  product_id: z.number(),
  name: z.string().min(1, "Variant name is required").max(255),
  subtype: z.enum(["room_category", "seat_tier", "time_slot", "none"]).optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  attributes: z.record(z.string(), z.any()).default({})
});

// Product CRUD operations
export async function createProduct(values: z.infer<typeof ProductPayloadSchema>) {
  const supabase = await createClient();
  
  try {
    const validatedData = ProductPayloadSchema.parse(values);
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        org_id: DEFAULT_ORG_ID,
        name: validatedData.name,
        type: validatedData.type,
        status: validatedData.status,
        product_type_id: validatedData.product_type_id
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, product: data };
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product");
  }
}

export async function updateProduct(id: number, values: z.infer<typeof ProductPayloadSchema>) {
  const supabase = await createClient();
  
  try {
    const validatedData = ProductPayloadSchema.parse(values);
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: validatedData.name,
        type: validatedData.type,
        status: validatedData.status
      })
      .eq('id', id)
      .eq('org_id', DEFAULT_ORG_ID)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, data };
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
  }
}

export async function deleteProduct(id: number) {
  const supabase = await createClient();
  
  try {
    // Check if product has variants
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', id)
      .eq('org_id', DEFAULT_ORG_ID);

    if (variantsError) throw variantsError;

    if (variants && variants.length > 0) {
      throw new Error("Cannot delete product with existing variants");
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('org_id', DEFAULT_ORG_ID);

    if (error) throw error;

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

// Product Variant CRUD operations
export async function createProductVariant(values: z.infer<typeof ProductVariantPayloadSchema>) {
  const supabase = await createClient();
  
  try {
    const validatedData = ProductVariantPayloadSchema.parse(values);
    
    // Get the product to determine appropriate subtype
    const { data: product } = await supabase
      .from('products')
      .select('type')
      .eq('id', validatedData.product_id)
      .single();
    
    // Auto-determine subtype based on product type if not provided
    let subtype = validatedData.subtype;
    if (!subtype && product) {
      switch (product.type) {
        case 'accommodation':
          subtype = 'room_category';
          break;
        case 'transfer':
          subtype = 'seat_tier';
          break;
        case 'activity':
        case 'event':
          subtype = 'time_slot';
          break;
        default:
          subtype = 'none';
      }
    }
    
    const { data, error } = await supabase
      .from('product_variants')
      .insert({
        org_id: DEFAULT_ORG_ID,
        product_id: validatedData.product_id,
        name: validatedData.name,
        subtype: subtype || 'none',
        status: validatedData.status,
        attributes: validatedData.attributes
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, data };
  } catch (error) {
    console.error("Error creating product variant:", error);
    throw new Error("Failed to create product variant");
  }
}

export async function updateProductVariant(id: number, values: Partial<z.infer<typeof ProductVariantPayloadSchema>>) {
  const supabase = await createClient();
  
  try {
    const updateData: any = {};
    
    if (values.name !== undefined) updateData.name = values.name;
    if (values.subtype !== undefined) updateData.subtype = values.subtype;
    if (values.status !== undefined) updateData.status = values.status;
    if (values.attributes !== undefined) updateData.attributes = values.attributes;
    
    const { data, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', DEFAULT_ORG_ID)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, data };
  } catch (error) {
    console.error("Error updating product variant:", error);
    throw new Error("Failed to update product variant");
  }
}

export async function deleteProductVariant(id: number) {
  const supabase = await createClient();
  
  try {
    // Check if variant has rate plans
    const { data: ratePlans, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select('id')
      .eq('product_variant_id', id)
      .eq('org_id', DEFAULT_ORG_ID);

    if (ratePlansError) throw ratePlansError;

    if (ratePlans && ratePlans.length > 0) {
      throw new Error("Cannot delete variant with existing rate plans");
    }

    // Check if variant has allocation buckets
    const { data: allocations, error: allocationsError } = await supabase
      .from('allocation_buckets')
      .select('id')
      .eq('product_variant_id', id)
      .eq('org_id', DEFAULT_ORG_ID);

    if (allocationsError) throw allocationsError;

    if (allocations && allocations.length > 0) {
      throw new Error("Cannot delete variant with existing availability data");
    }

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id)
      .eq('org_id', DEFAULT_ORG_ID);

    if (error) throw error;

    revalidatePath('/products');
    return { success: true };
  } catch (error) {
    console.error("Error deleting product variant:", error);
    throw error;
  }
}

// Bulk operations
export async function bulkUpdateProducts(productIds: number[], updates: Partial<z.infer<typeof ProductPayloadSchema>>) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .in('id', productIds)
      .eq('org_id', DEFAULT_ORG_ID)
      .select();

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, updated: data?.length || 0 };
  } catch (error) {
    console.error("Error bulk updating products:", error);
    throw new Error("Failed to bulk update products");
  }
}

export async function bulkDeleteProducts(productIds: number[]) {
  const supabase = await createClient();
  
  try {
    // Check for variants first
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('product_id')
      .in('product_id', productIds)
      .eq('org_id', DEFAULT_ORG_ID);

    if (variantsError) throw variantsError;

    const productsWithVariants = new Set(variants?.map(v => v.product_id) || []);
    const productsWithoutVariants = productIds.filter(id => !productsWithVariants.has(id));

    if (productsWithoutVariants.length === 0) {
      throw new Error("Selected products have variants and cannot be deleted");
    }

    if (productsWithoutVariants.length < productIds.length) {
      throw new Error(`Only ${productsWithoutVariants.length} of ${productIds.length} products can be deleted (others have variants)`);
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productsWithoutVariants)
      .eq('org_id', DEFAULT_ORG_ID);

    if (error) throw error;

    revalidatePath('/products');
    return { success: true, deleted: productsWithoutVariants.length };
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    throw error;
  }
}
