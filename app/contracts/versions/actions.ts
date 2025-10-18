"use server";

import { createClient } from "@/utils/supabase/server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const DEFAULT_ORG_ID = BigInt(1); // TODO: from session

// Validation schemas
const ContractVersionPayloadSchema = z.object({
  contract_id: z.number(),
  valid_from: z.string().min(1, "Valid from date is required"),
  valid_to: z.string().min(1, "Valid to date is required"),
  cancellation_policy: z.object({}).default({}),
  attrition_policy: z.object({}).default({}),
  payment_terms: z.object({}).default({}),
  operational_terms: z.object({}).default({}),
  rate_modifiers: z.object({}).optional().default({}),
  additional_terms: z.object({}).default({}),
  supersedes_id: z.number().optional(),
}).refine((data) => {
  const fromDate = new Date(data.valid_from);
  const toDate = new Date(data.valid_to);
  return fromDate < toDate;
}, {
  message: "Valid from date must be before valid to date",
  path: ["valid_to"],
});

function handleError(error: unknown, operation: string) {
  console.error(`Contract version ${operation} error:`, error);
  
  if (error instanceof z.ZodError) {
    throw new Error(`${operation} failed: ${error.issues[0]?.message}`);
  }
  
  if (error instanceof Error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }

  throw new Error(`${operation} failed: Unknown error`);
}

export async function createContractVersion(data: z.infer<typeof ContractVersionPayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = ContractVersionPayloadSchema.parse(data);
    
    // Verify contract exists and belongs to organization
    const contract = await prisma.contracts.findFirst({
      where: {
        id: BigInt(validatedData.contract_id),
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!contract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for overlapping versions
    const overlappingVersions = await prisma.contract_versions.findMany({
      where: {
        contract_id: BigInt(validatedData.contract_id),
        org_id: DEFAULT_ORG_ID,
        OR: [
          {
            AND: [
              { valid_from: { lte: new Date(validatedData.valid_from) } },
              { valid_to: { gt: new Date(validatedData.valid_from) } }
            ]
          },
          {
            AND: [
              { valid_from: { lt: new Date(validatedData.valid_to) } },
              { valid_to: { gte: new Date(validatedData.valid_to) } }
            ]
          },
          {
            AND: [
              { valid_from: { gte: new Date(validatedData.valid_from) } },
              { valid_to: { lte: new Date(validatedData.valid_to) } }
            ]
          }
        ]
      }
    });

    if (overlappingVersions.length > 0) {
      const overlappingVersion = overlappingVersions[0];
      throw new Error(
        `A contract version already exists for this date range (${overlappingVersion.valid_from.toLocaleDateString()} - ${overlappingVersion.valid_to.toLocaleDateString()})`
      );
    }

    // Verify supersedes version exists and belongs to same contract
    if (validatedData.supersedes_id) {
      const supersedesVersion = await prisma.contract_versions.findFirst({
        where: {
          id: BigInt(validatedData.supersedes_id),
          contract_id: BigInt(validatedData.contract_id),
          org_id: DEFAULT_ORG_ID
        }
      });

      if (!supersedesVersion) {
        throw new Error("Supersedes version not found or does not belong to this contract");
      }
    }

    // Map new universal structure to existing database fields
    const policyData = {
      cancellation_policy: validatedData.cancellation_policy,
      attrition_policy: validatedData.attrition_policy,
      payment_terms: validatedData.payment_terms,
      operational_terms: validatedData.operational_terms,
      rate_modifiers: validatedData.rate_modifiers,
      additional_terms: validatedData.additional_terms
    };

    const contractVersion = await prisma.contract_versions.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        contract_id: BigInt(validatedData.contract_id),
        valid_from: new Date(validatedData.valid_from),
        valid_to: new Date(validatedData.valid_to),
        cancellation_policy: validatedData.cancellation_policy,
        payment_policy: validatedData.payment_terms, // Map to existing field
        terms: validatedData.additional_terms, // Map to existing field
        supersedes_id: validatedData.supersedes_id ? BigInt(validatedData.supersedes_id) : null
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contractVersion;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateContractVersion(id: number, data: Partial<z.infer<typeof ContractVersionPayloadSchema>>, opts?: { redirect?: boolean }) {
  try {
    // Check if version exists and belongs to organization
    const existingVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check if version has related rate plans
    const relatedRatePlans = await prisma.rate_plans.count({
      where: {
        contract_version_id: id
      }
    });

    if (relatedRatePlans > 0) {
      throw new Error(
        `Cannot update contract version because it has ${relatedRatePlans} associated rate plan(s). Contract versions with rate plans are immutable for data integrity.`
      );
    }

    // Validate partial data if provided
    const validatedData = ContractVersionPayloadSchema.partial().parse(data);

    // Check for overlapping versions (excluding current version)
    if (validatedData.valid_from || validatedData.valid_to) {
      const fromDate = validatedData.valid_from ? new Date(validatedData.valid_from) : existingVersion.valid_from;
      const toDate = validatedData.valid_to ? new Date(validatedData.valid_to) : existingVersion.valid_to;

      if (fromDate >= toDate) {
        throw new Error("Valid from date must be before valid to date");
      }

      const overlappingVersion = await prisma.contract_versions.findFirst({
        where: {
          contract_id: existingVersion.contract_id,
          org_id: DEFAULT_ORG_ID,
          id: { not: id },
          OR: [
            {
              AND: [
                { valid_from: { lte: fromDate } },
                { valid_to: { gt: fromDate } }
              ]
            },
            {
              AND: [
                { valid_from: { lt: toDate } },
                { valid_to: { gte: toDate } }
              ]
            },
            {
              AND: [
                { valid_from: { gte: fromDate } },
                { valid_to: { lte: toDate } }
              ]
            }
          ]
        }
      });

      if (overlappingVersion) {
        throw new Error(
          `A contract version already exists for this date range (${new Date(overlappingVersion.valid_from).toLocaleDateString()} - ${new Date(overlappingVersion.valid_to).toLocaleDateString()})`
        );
      }
    }

    const contractVersion = await prisma.contract_versions.update({
      where: { id },
      data: {
        ...(validatedData.valid_from && { valid_from: new Date(validatedData.valid_from) }),
        ...(validatedData.valid_to && { valid_to: new Date(validatedData.valid_to) }),
        ...(validatedData.cancellation_policy && { cancellation_policy: validatedData.cancellation_policy }),
        ...(validatedData.payment_policy && { payment_policy: validatedData.payment_policy }),
        ...(validatedData.terms && { terms: validatedData.terms }),
        ...(validatedData.supersedes_id !== undefined && { supersedes_id: validatedData.supersedes_id })
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contractVersion;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteContractVersion(id: number, opts?: { redirect?: boolean }) {
  try {
    // Check if version exists and belongs to organization
    const existingVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check for related records
    const relatedRatePlans = await prisma.rate_plans.count({
      where: {
        contract_version_id: id
      }
    });

    if (relatedRatePlans > 0) {
      throw new Error(
        `Cannot delete contract version because it has ${relatedRatePlans} associated rate plan(s). Please remove the rate plans first.`
      );
    }

    // Check if this version is superseded by other versions
    const supersedingVersions = await prisma.contract_versions.count({
      where: {
        supersedes_id: id
      }
    });

    if (supersedingVersions > 0) {
      throw new Error(
        `Cannot delete contract version because ${supersedingVersions} other version(s) reference it as a superseded version. Please update those versions first.`
      );
    }

    await prisma.contract_versions.delete({
      where: { id }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
  } catch (error) {
    handleError(error, "deletion");
  }
}

export async function getContractVersions(contractId: number) {
  try {
    const supabase = await createClient();
    
    const { data: versions, error } = await supabase
      .from('contract_versions')
      .select('*')
      .eq('contract_id', contractId)
      .eq('org_id', DEFAULT_ORG_ID)
      .order('valid_from', { ascending: false });

    if (error) throw error;
    return versions || [];
  } catch (error) {
    console.error("Contract versions retrieval error:", error);
    
    // Return empty array when database is not available
    return [];
  }
}

export async function getContractVersionById(id: bigint) {
  try {
    const version = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contracts: {
          select: {
            id: true,
            reference: true,
            suppliers: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        prev_version: {
          select: {
            id: true,
            valid_from: true,
            valid_to: true
          }
        },
        next_versions: {
          select: {
            id: true,
            valid_from: true,
            valid_to: true
          }
        },
        rate_plans: {
          select: {
            id: true,
            inventory_model: true,
            currency: true,
            valid_from: true,
            valid_to: true
          }
        }
      }
    });

    return version;
  } catch (error) {
    console.error("Contract version retrieval error:", error);
    
    // Return null when database is not available
    return null;
  }
}

// Helper function to get the current active version for a contract
export async function getCurrentContractVersion(contractId: bigint) {
  try {
    const currentDate = new Date();
    
    const version = await prisma.contract_versions.findFirst({
      where: {
        contract_id: contractId,
        org_id: DEFAULT_ORG_ID,
        valid_from: { lte: currentDate },
        valid_to: { gt: currentDate }
      },
      include: {
        contracts: {
          select: {
            id: true,
            reference: true,
            suppliers: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        valid_from: "desc"
      }
    });

    return version;
  } catch (error) {
    console.error("Current contract version retrieval error:", error);
    
    // Return null when database is not available
    return null;
  }
}

// Helper function to duplicate a contract version
export async function duplicateContractVersion(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const originalVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!originalVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Generate new date range (start from tomorrow, extend for same duration)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const duration = originalVersion.valid_to.getTime() - originalVersion.valid_from.getTime();
    const newValidTo = new Date(tomorrow.getTime() + duration);

    // Check for overlapping versions
    const overlappingVersion = await prisma.contract_versions.findFirst({
      where: {
        contract_id: originalVersion.contract_id,
        org_id: DEFAULT_ORG_ID,
        OR: [
          {
            AND: [
              { valid_from: { lte: tomorrow } },
              { valid_to: { gt: tomorrow } }
            ]
          },
          {
            AND: [
              { valid_from: { lt: newValidTo } },
              { valid_to: { gte: newValidTo } }
            ]
          },
          {
            AND: [
              { valid_from: { gte: tomorrow } },
              { valid_to: { lte: newValidTo } }
            ]
          }
        ]
      }
    });

    if (overlappingVersion) {
      throw new Error("A contract version already exists for the generated date range. Please adjust the dates manually.");
    }

    const duplicatedVersion = await prisma.contract_versions.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        contract_id: originalVersion.contract_id,
        valid_from: tomorrow,
        valid_to: newValidTo,
        cancellation_policy: originalVersion.cancellation_policy,
        payment_policy: originalVersion.payment_policy,
        terms: originalVersion.terms,
        supersedes_id: originalVersion.id // Link to the original version
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return duplicatedVersion;
  } catch (error) {
    handleError(error, "duplication");
  }
}

// Bulk Actions
export async function bulkUpdateContractVersions(versionIds: number[], updates: Partial<{
  valid_from: string;
  valid_to: string;
  cancellation_policy: Record<string, any>;
  payment_policy: Record<string, any>;
  terms: Record<string, any>;
}>) {
  try {
    if (versionIds.length === 0) {
      throw new Error("No contract versions selected");
    }

    const updatedVersions = await prisma.contractVersions.updateMany({
      where: {
        id: { in: versionIds },
        contracts: { org_id: DEFAULT_ORG_ID }
      },
      data: updates
    });

    revalidatePath("/contracts");
    return updatedVersions;
  } catch (error) {
    handleError(error, "bulk update");
  }
}

export async function bulkDeleteContractVersions(versionIds: number[]) {
  try {
    if (versionIds.length === 0) {
      throw new Error("No contract versions selected");
    }

    // Check for dependencies before deletion
    const versionsWithRatePlans = await prisma.contractVersions.findMany({
      where: {
        id: { in: versionIds },
        contracts: { org_id: DEFAULT_ORG_ID },
        rate_plans: { some: {} }
      },
      include: {
        contracts: { select: { reference: true } }
      }
    });

    if (versionsWithRatePlans.length > 0) {
      const references = versionsWithRatePlans.map(v => v.contracts.reference).join(", ");
      throw new Error(`Cannot delete versions with rate plans. Contract(s): ${references}`);
    }

    const deletedVersions = await prisma.contractVersions.deleteMany({
      where: {
        id: { in: versionIds },
        contracts: { org_id: DEFAULT_ORG_ID }
      }
    });

    revalidatePath("/contracts");
    return deletedVersions;
  } catch (error) {
    handleError(error, "bulk deletion");
  }
}

export async function bulkDuplicateContractVersions(versionIds: number[]) {
  try {
    if (versionIds.length === 0) {
      throw new Error("No contract versions selected");
    }

    const duplicatedVersions = [];
    
    for (const versionId of versionIds) {
      const duplicated = await duplicateContractVersion(versionId, { redirect: false });
      if (duplicated) {
        duplicatedVersions.push(duplicated);
      }
    }

    revalidatePath("/contracts");
    return duplicatedVersions;
  } catch (error) {
    handleError(error, "bulk duplication");
  }
}
