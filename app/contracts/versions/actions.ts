"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const DEFAULT_ORG_ID = BigInt(1); // TODO: from session

// Validation schemas for contract versions (simplified MVP)
const ContractVersionPayloadSchema = z.object({
  contract_id: z.bigint(),
  valid_from: z.date(),
  valid_to: z.date(),
  commission_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).default("USD"),
  booking_cutoff_days: z.number().int().positive().optional(),
  // New multiple policies structure
  cancellation_policies: z.array(z.any()).default([]),
  payment_policies: z.array(z.any()).default([]),
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
    
    // Check if contract exists and belongs to organization
    const contract = await prisma.contracts.findFirst({
      where: {
        id: validatedData.contract_id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!contract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for overlapping date ranges
    const overlappingVersion = await prisma.contract_versions.findFirst({
      where: {
        contract_id: validatedData.contract_id,
        org_id: DEFAULT_ORG_ID,
        OR: [
          {
            valid_from: { lte: validatedData.valid_to },
            valid_to: { gte: validatedData.valid_from }
          }
        ]
      }
    });

    if (overlappingVersion) {
      throw new Error("A contract version already exists for this date range");
    }

    const contractVersion = await prisma.contract_versions.create({
      data: {
        org_id: DEFAULT_ORG_ID,
        contract_id: validatedData.contract_id,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to,
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        // New multiple policies structure
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contractVersion;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateContractVersion(id: bigint, data: z.infer<typeof ContractVersionPayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = ContractVersionPayloadSchema.parse(data);
    
    // Check if contract version exists and belongs to organization
    const existingVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      }
    });

    if (!existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check for overlapping date ranges (excluding current version)
    const overlappingVersion = await prisma.contract_versions.findFirst({
      where: {
        contract_id: validatedData.contract_id,
        org_id: DEFAULT_ORG_ID,
        id: { not: id },
        OR: [
          {
            valid_from: { lte: validatedData.valid_to },
            valid_to: { gte: validatedData.valid_from }
          }
        ]
      }
    });

    if (overlappingVersion) {
      throw new Error("Another contract version already exists for this date range");
    }

    const contractVersion = await prisma.contract_versions.update({
      where: { id },
      data: {
        contract_id: validatedData.contract_id,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to,
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        // New multiple policies structure
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies
      }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contractVersion;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteContractVersion(id: bigint, opts?: { redirect?: boolean }) {
  try {
    // Check if contract version exists and belongs to organization
    const existingVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contracts: {
          select: {
            reference: true
          }
        }
      }
    });

    if (!existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check for related rate plans
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

    await prisma.contract_versions.delete({
      where: { id }
    });

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
  } catch (error) {
    handleError(error, "deletion");
  }
}

export async function getContractVersionById(id: bigint) {
  try {
    const contractVersion = await prisma.contract_versions.findFirst({
      where: {
        id,
        org_id: DEFAULT_ORG_ID
      },
      include: {
        contracts: {
          select: {
            id: true,
            reference: true,
            supplier_id: true,
            suppliers: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return contractVersion;
  } catch (error) {
    handleError(error, "retrieval");
  }
}

export async function getContractVersionsByContractId(contractId: bigint) {
  try {
    const contractVersions = await prisma.contract_versions.findMany({
      where: {
        contract_id: contractId,
        org_id: DEFAULT_ORG_ID
      },
      orderBy: {
        valid_from: 'desc'
      }
    });

    return contractVersions;
  } catch (error) {
    handleError(error, "retrieval");
  }
}