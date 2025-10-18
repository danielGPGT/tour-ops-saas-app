"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schemas
const SupplierPayloadSchema = z.object({
  name: z.string().min(1, "Supplier name is required").min(2, "Supplier name must be at least 2 characters").max(100, "Supplier name too long").trim(),
  channels: z.array(z.string()).min(1, "At least one distribution channel is required"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  terms: z.record(z.string(), z.any()).optional().default({}),
});

type SupplierPayload = z.infer<typeof SupplierPayloadSchema>;

const DEFAULT_ORG_ID = BigInt(1); // TODO: replace with org from session/tenant resolution

// Error handling helper
function handleError(error: unknown, operation: string) {
  console.error(`Supplier ${operation} error:`, error);
  if (error instanceof z.ZodError) {
    throw new Error(error.issues[0]?.message || `Invalid ${operation} data`);
  }
  if (error instanceof Error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }
  throw new Error(`${operation} failed: Unknown error`);
}

export async function createSupplier(data: SupplierPayload, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = SupplierPayloadSchema.parse(data);
    
    // Check for duplicate names within organization
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        org_id: DEFAULT_ORG_ID,
        name: { equals: validatedData.name, mode: "insensitive" }
      }
    });

    if (existingSupplier) {
      throw new Error(`A supplier with the name "${validatedData.name}" already exists`);
    }

    const rec = await prisma.suppliers.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        name: validatedData.name,
        channels: validatedData.channels,
        status: validatedData.status,
        terms: validatedData.terms as any
      }
    });

    revalidatePath("/suppliers");
    if (opts?.redirect ?? true) redirect("/suppliers");
    return rec;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateSupplier(id: bigint, data: SupplierPayload, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = SupplierPayloadSchema.parse(data);
    
    // Check if supplier exists and belongs to organization
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!existingSupplier) {
      throw new Error("Supplier not found or you don't have permission to edit it");
    }

    // Check for duplicate names (excluding current supplier)
    const duplicateSupplier = await prisma.suppliers.findFirst({
      where: {
        org_id: DEFAULT_ORG_ID,
        name: { equals: validatedData.name, mode: "insensitive" },
        id: { not: id }
      }
    });

    if (duplicateSupplier) {
      throw new Error(`A supplier with the name "${validatedData.name}" already exists`);
    }

    const rec = await prisma.suppliers.update({
      where: { id },
      data: {
        name: validatedData.name,
        channels: validatedData.channels,
        status: validatedData.status,
        terms: validatedData.terms as any
      }
    });

    revalidatePath("/suppliers");
    if (opts?.redirect ?? true) redirect("/suppliers");
    return rec;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteSupplier(id: bigint) {
  try {
    // Check if supplier exists and belongs to organization
    const existingSupplier = await prisma.suppliers.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contracts: true,
        rate_plans: true,
        allocation_buckets: true,
        booking_items: true
      }
    });

    if (!existingSupplier) {
      throw new Error("Supplier not found or you don't have permission to delete it");
    }

    // Check for related data that would prevent deletion
    const relatedDataCount = 
      existingSupplier.contracts.length +
      existingSupplier.rate_plans.length +
      existingSupplier.allocation_buckets.length +
      existingSupplier.booking_items.length;

    if (relatedDataCount > 0) {
      throw new Error(
        `Cannot delete supplier "${existingSupplier.name}" because it has ${relatedDataCount} related records. ` +
        "Please remove all contracts, rate plans, allocations, and bookings first."
      );
    }

    await prisma.suppliers.delete({ where: { id } });
    revalidatePath("/suppliers");
  } catch (error) {
    handleError(error, "deletion");
  }
}

// Additional helper functions for better UX
export async function getSupplierById(id: bigint) {
  try {
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return supplier;
  } catch (error) {
    handleError(error, "retrieval");
  }
}

export async function duplicateSupplier(id: bigint, opts?: { redirect?: boolean }) {
  try {
    // Get the original supplier
    const originalSupplier = await prisma.suppliers.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!originalSupplier) {
      throw new Error("Supplier not found or you don't have permission to duplicate it");
    }

    // Create a copy with "Copy of" prefix
    const copyName = `Copy of ${originalSupplier.name}`;
    
    // Check if a copy with this name already exists
    const existingCopy = await prisma.suppliers.findFirst({
      where: {
        org_id: DEFAULT_ORG_ID,
        name: { equals: copyName, mode: "insensitive" }
      }
    });

    let finalName = copyName;
    if (existingCopy) {
      // If copy exists, add a number suffix
      let counter = 1;
      do {
        finalName = `Copy of ${originalSupplier.name} (${counter})`;
        counter++;
        const checkCopy = await prisma.suppliers.findFirst({
          where: {
            org_id: DEFAULT_ORG_ID,
            name: { equals: finalName, mode: "insensitive" }
          }
        });
        if (!checkCopy) break;
      } while (counter < 100); // Prevent infinite loop
    }

    const duplicatedSupplier = await prisma.suppliers.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        name: finalName,
        channels: originalSupplier.channels,
        status: originalSupplier.status,
        terms: originalSupplier.terms || {},
        // Note: We don't copy contracts, rate plans, etc. as those are typically unique relationships
      }
    });

    revalidatePath("/suppliers");
    if (opts?.redirect ?? true) redirect("/suppliers");
    return duplicatedSupplier;
  } catch (error) {
    handleError(error, "duplication");
  }
}

export async function bulkUpdateSuppliers(
  supplierIds: bigint[], 
  updates: { channels?: string[]; status?: string }
) {
  try {
    // Validate input
    if (!supplierIds || supplierIds.length === 0) {
      throw new Error("No suppliers selected for bulk update");
    }

    // Check if all suppliers belong to the organization
    const existingSuppliers = await prisma.suppliers.findMany({
      where: {
        id: { in: supplierIds },
        org_id: DEFAULT_ORG_ID
      },
      select: { id: true }
    });

    if (existingSuppliers.length !== supplierIds.length) {
      throw new Error("Some suppliers not found or you don't have permission to update them");
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.channels !== undefined) {
      updateData.channels = updates.channels;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }

    // Perform bulk update
    const result = await prisma.suppliers.updateMany({
      where: {
        id: { in: supplierIds },
        org_id: DEFAULT_ORG_ID
      },
      data: updateData
    });

    revalidatePath("/suppliers");
    return result;
  } catch (error) {
    handleError(error, "bulk update");
  }
}

export async function bulkDeleteSuppliers(supplierIds: bigint[]) {
  try {
    // Validate input
    if (!supplierIds || supplierIds.length === 0) {
      throw new Error("No suppliers selected for deletion");
    }

    // Check if all suppliers exist and belong to the organization
    const existingSuppliers = await prisma.suppliers.findMany({
      where: {
        id: { in: supplierIds },
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contracts: true,
        rate_plans: true,
        allocation_buckets: true,
        booking_items: true
      }
    });

    if (existingSuppliers.length !== supplierIds.length) {
      throw new Error("Some suppliers not found or you don't have permission to delete them");
    }

    // Check for suppliers with related data that would prevent deletion
    const suppliersWithDependencies = existingSuppliers.filter(supplier => {
      const relatedDataCount = 
        supplier.contracts.length +
        supplier.rate_plans.length +
        supplier.allocation_buckets.length +
        supplier.booking_items.length;
      return relatedDataCount > 0;
    });

    if (suppliersWithDependencies.length > 0) {
      const supplierNames = suppliersWithDependencies.map(s => s.name).join(', ');
      throw new Error(
        `Cannot delete suppliers with related data: ${supplierNames}. ` +
        "Please remove all contracts, rate plans, allocations, and bookings first."
      );
    }

    // Perform bulk deletion
    const result = await prisma.suppliers.deleteMany({
      where: {
        id: { in: supplierIds },
        org_id: DEFAULT_ORG_ID
      }
    });

    revalidatePath("/suppliers");
    return result;
  } catch (error) {
    handleError(error, "bulk deletion");
  }
}

export async function bulkDuplicateSuppliers(supplierIds: bigint[]) {
  try {
    // Validate input
    if (!supplierIds || supplierIds.length === 0) {
      throw new Error("No suppliers selected for duplication");
    }

    // Get all suppliers to duplicate
    const suppliersToDuplicate = await prisma.suppliers.findMany({
      where: {
        id: { in: supplierIds },
        org_id: DEFAULT_ORG_ID
      }
    });

    if (suppliersToDuplicate.length !== supplierIds.length) {
      throw new Error("Some suppliers not found or you don't have permission to duplicate them");
    }

    // Create duplicates with smart naming
    const duplicatePromises = suppliersToDuplicate.map(async (originalSupplier) => {
      // Generate unique name for the copy
      const baseName = `Copy of ${originalSupplier.name}`;
      let finalName = baseName;
      let counter = 1;

      // Check for existing copies and find a unique name
      while (counter < 100) { // Prevent infinite loop
        const existingCopy = await prisma.suppliers.findFirst({
          where: {
            org_id: DEFAULT_ORG_ID,
            name: { equals: finalName, mode: "insensitive" }
          }
        });

        if (!existingCopy) break;

        finalName = counter === 1 ? baseName : `Copy of ${originalSupplier.name} (${counter})`;
        counter++;
      }

      return prisma.suppliers.create({
        data: {
          org_id: DEFAULT_ORG_ID,
          name: finalName,
          channels: originalSupplier.channels,
          status: originalSupplier.status,
          terms: originalSupplier.terms || {},
        }
      });
    });

    // Execute all duplications
    const duplicatedSuppliers = await Promise.all(duplicatePromises);

    revalidatePath("/suppliers");
    return duplicatedSuppliers;
  } catch (error) {
    handleError(error, "bulk duplication");
  }
}

export async function getSuppliersStats() {
  try {
    const [totalCount, activeCount, inactiveCount] = await Promise.all([
      prisma.suppliers.count({ where: { org_id: DEFAULT_ORG_ID } }),
      prisma.suppliers.count({ where: { org_id: DEFAULT_ORG_ID, status: "active" } }),
      prisma.suppliers.count({ where: { org_id: DEFAULT_ORG_ID, status: "inactive" } })
    ]);

    return {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      activeRate: totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
    };
  } catch (error) {
    console.error("Supplier stats retrieval error:", error);
    
    // Return default stats when database is not available
    return {
      total: 0,
      active: 0,
      inactive: 0,
      activeRate: 0
    };
  }
}


