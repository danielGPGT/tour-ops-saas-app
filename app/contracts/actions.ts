"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const DEFAULT_ORG_ID = BigInt(1); // TODO: from session

// Validation schemas
const ContractPayloadSchema = z.object({
  supplier_id: z.bigint(),
  reference: z.string().min(1, "Contract reference is required").trim(),
  status: z.enum(["active", "inactive", "draft", "expired"]).default("active"),
});

function handleError(error: unknown, operation: string) {
  console.error(`Contract ${operation} error:`, error);
  
  if (error instanceof z.ZodError) {
    throw new Error(`${operation} failed: ${error.issues[0]?.message}`);
  }
  
  if (error instanceof Error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }

  throw new Error(`${operation} failed: Unknown error`);
}

export async function createContract(data: z.infer<typeof ContractPayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = ContractPayloadSchema.parse(data);
    
    // Check for duplicate reference within supplier
    const existingContract = await prisma.contracts.findFirst({
      where: {
        org_id: DEFAULT_ORG_ID,
        supplier_id: validatedData.supplier_id,
        reference: validatedData.reference
      }
    });

    if (existingContract) {
      throw new Error(`A contract with reference "${validatedData.reference}" already exists for this supplier`);
    }

    // Verify supplier exists and belongs to organization
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: validatedData.supplier_id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!supplier) {
      throw new Error("Supplier not found or does not belong to your organization");
    }

    const contract = await prisma.contracts.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        supplier_id: validatedData.supplier_id,
        reference: validatedData.reference,
        status: validatedData.status
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contract;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateContract(id: bigint, data: z.infer<typeof ContractPayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = ContractPayloadSchema.parse(data);
    
    // Check if contract exists and belongs to organization
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for duplicate reference within supplier (excluding current contract)
    const duplicateContract = await prisma.contracts.findFirst({
      where: {
        org_id: DEFAULT_ORG_ID,
        supplier_id: validatedData.supplier_id,
        reference: validatedData.reference,
        id: { not: id }
      }
    });

    if (duplicateContract) {
      throw new Error(`A contract with reference "${validatedData.reference}" already exists for this supplier`);
    }

    // Verify supplier exists and belongs to organization
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: validatedData.supplier_id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!supplier) {
      throw new Error("Supplier not found or does not belong to your organization");
    }

    const contract = await prisma.contracts.update({
      where: { id },
      data: {
        supplier_id: validatedData.supplier_id,
        reference: validatedData.reference,
        status: validatedData.status
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contract;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    // Check if contract exists and belongs to organization
    const existingContract = await prisma.contracts.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contract_versions: true,
        suppliers: true
      }
    });

    if (!existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for related records
    const relatedRatePlans = await prisma.rate_plans.count({
      where: {
        contract_version: {
          contract_id: id
        }
      }
    });

    if (relatedRatePlans > 0) {
      throw new Error(
        `Cannot delete contract "${existingContract.reference}" because it has ${relatedRatePlans} associated rate plan(s). Please remove the rate plans first.`
      );
    }

    await prisma.contracts.delete({
      where: { id }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
  } catch (error) {
    handleError(error, "deletion");
  }
}

export async function getContractById(id: bigint) {
  try {
    const contract = await prisma.contracts.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        suppliers: {
          select: {
            id: true,
            name: true,
            channels: true,
            status: true
          }
        }
      }
    });

    return contract;
  } catch (error) {
    handleError(error, "retrieval");
  }
}

export async function getContractsStats() {
  try {
    const [totalCount, activeCount, draftCount, expiredCount] = await Promise.all([
      prisma.contracts.count({
        where: { org_id: DEFAULT_ORG_ID }
      }),
      prisma.contracts.count({
        where: { 
          org_id: DEFAULT_ORG_ID,
          status: "active"
        }
      }),
      prisma.contracts.count({
        where: { 
          org_id: DEFAULT_ORG_ID,
          status: "draft"
        }
      }),
      prisma.contracts.count({
        where: { 
          org_id: DEFAULT_ORG_ID,
          status: "expired"
        }
      })
    ]);

    return {
      totalCount,
      activeCount,
      draftCount,
      expiredCount
    };
  } catch (error) {
    console.error("Contract stats retrieval error:", error);
    
    // Return default stats when database is not available
    return {
      totalCount: 0,
      activeCount: 0,
      draftCount: 0,
      expiredCount: 0
    };
  }
}

// Bulk operations
export async function bulkUpdateContracts(contractIds: bigint[], updates: { status?: string }) {
  try {
    if (!contractIds.length) {
      throw new Error("No contracts selected");
    }

    // Validate all contracts belong to organization
    const contracts = await prisma.contracts.findMany({
      where: {
        id: { in: contractIds },
        org_id: DEFAULT_ORG_ID
      }
    });

    if (contracts.length !== contractIds.length) {
      throw new Error("Some contracts not found or do not belong to your organization");
    }

    const result = await prisma.contracts.updateMany({
      where: {
        id: { in: contractIds },
        org_id: DEFAULT_ORG_ID
      },
      data: updates
    });

    revalidatePath("/contracts");
    return result;
  } catch (error) {
    handleError(error, "bulk update");
  }
}

export async function bulkDeleteContracts(contractIds: bigint[]) {
  try {
    if (!contractIds.length) {
      throw new Error("No contracts selected");
    }

    // Validate all contracts belong to organization
    const contracts = await prisma.contracts.findMany({
      where: {
        id: { in: contractIds },
        org_id: DEFAULT_ORG_ID
      },
      include: {
        suppliers: {
          select: { name: true }
        }
      }
    });

    if (contracts.length !== contractIds.length) {
      throw new Error("Some contracts not found or do not belong to your organization");
    }

    // Check for related records
    const relatedRatePlans = await prisma.rate_plans.count({
      where: {
        contract_version: {
          contract_id: { in: contractIds }
        }
      }
    });

    if (relatedRatePlans > 0) {
      throw new Error(
        `Cannot delete selected contracts because ${relatedRatePlans} associated rate plan(s) exist. Please remove the rate plans first.`
      );
    }

    const result = await prisma.contracts.deleteMany({
      where: {
        id: { in: contractIds },
        org_id: DEFAULT_ORG_ID
      }
    });

    revalidatePath("/contracts");
    return result;
  } catch (error) {
    handleError(error, "bulk deletion");
  }
}

export async function duplicateContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const originalContract = await prisma.contracts.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        suppliers: {
          select: { name: true }
        }
      }
    });

    if (!originalContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Generate unique reference
    let newReference = `Copy of ${originalContract.reference}`;
    let counter = 1;
    
    while (true) {
      const existingContract = await prisma.contracts.findFirst({
        where: {
          org_id: DEFAULT_ORG_ID,
          supplier_id: originalContract.supplier_id,
          reference: newReference
        }
      });

      if (!existingContract) break;
      
      newReference = `Copy of ${originalContract.reference} (${counter})`;
      counter++;
    }

    const duplicatedContract = await prisma.contracts.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        supplier_id: originalContract.supplier_id,
        reference: newReference,
        status: "draft" // Start as draft when duplicating
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return duplicatedContract;
  } catch (error) {
    handleError(error, "duplication");
  }
}

export async function bulkDuplicateContracts(contractIds: bigint[]) {
  try {
    if (!contractIds.length) {
      throw new Error("No contracts selected");
    }

    // Get all contracts to duplicate
    const contractsToDuplicate = await prisma.contracts.findMany({
      where: {
        id: { in: contractIds },
        org_id: DEFAULT_ORG_ID
      },
      include: {
        suppliers: {
          select: { name: true }
        }
      }
    });

    if (contractsToDuplicate.length !== contractIds.length) {
      throw new Error("Some contracts not found or do not belong to your organization");
    }

    // Duplicate each contract with unique references
    const duplicatePromises = contractsToDuplicate.map(async (originalContract) => {
      // Generate unique reference for each contract
      let newReference = `Copy of ${originalContract.reference}`;
      let counter = 1;
      
      while (true) {
        const existingContract = await prisma.contracts.findFirst({
          where: {
            org_id: DEFAULT_ORG_ID,
            supplier_id: originalContract.supplier_id,
            reference: newReference
          }
        });

        if (!existingContract) break;
        
        newReference = `Copy of ${originalContract.reference} (${counter})`;
        counter++;
      }

      return prisma.contracts.create({
        data: {
          org_id: DEFAULT_ORG_ID,
          supplier_id: originalContract.supplier_id,
          reference: newReference,
          status: "draft" // Start as draft when duplicating
        }
      });
    });

    const duplicatedContracts = await Promise.all(duplicatePromises);
    revalidatePath("/contracts");
    return duplicatedContracts;
  } catch (error) {
    handleError(error, "bulk duplication");
  }
}
