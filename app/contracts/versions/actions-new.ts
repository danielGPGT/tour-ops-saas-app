"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

// Validation schemas for contract versions
const ContractVersionPayloadSchema = z.object({
  contract_id: z.bigint(),
  valid_from: z.date(),
  valid_to: z.date(),
  commission_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).default("USD"),
  booking_cutoff_days: z.number().int().positive().optional(),
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
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', validatedData.contract_id.toString())
      .eq('org_id', orgId)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for overlapping date ranges
    const { data: overlappingVersion, error: overlapError } = await supabase
      .from('contract_versions')
      .select('id')
      .eq('contract_id', validatedData.contract_id.toString())
      .eq('org_id', orgId)
      .or(`and(valid_from.lte.${validatedData.valid_to.toISOString().split('T')[0]},valid_to.gte.${validatedData.valid_from.toISOString().split('T')[0]})`)
      .single();

    if (overlappingVersion) {
      throw new Error("A contract version already exists for this date range");
    }

    const { data: version, error } = await supabase
      .from('contract_versions')
      .insert({
        org_id: orgId,
        contract_id: validatedData.contract_id.toString(),
        valid_from: validatedData.valid_from.toISOString().split('T')[0],
        valid_to: validatedData.valid_to.toISOString().split('T')[0],
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract version: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return version;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateContractVersion(id: bigint, data: z.infer<typeof ContractVersionPayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = ContractVersionPayloadSchema.parse(data);
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if version exists and belongs to organization
    const { data: existingVersion, error: checkError } = await supabase
      .from('contract_versions')
      .select('id, contract_id')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check for overlapping date ranges (excluding current version)
    const { data: overlappingVersion, error: overlapError } = await supabase
      .from('contract_versions')
      .select('id')
      .eq('contract_id', validatedData.contract_id.toString())
      .eq('org_id', orgId)
      .neq('id', id.toString())
      .or(`and(valid_from.lte.${validatedData.valid_to.toISOString().split('T')[0]},valid_to.gte.${validatedData.valid_from.toISOString().split('T')[0]})`)
      .single();

    if (overlappingVersion) {
      throw new Error("A contract version already exists for this date range");
    }

    const { data: version, error } = await supabase
      .from('contract_versions')
      .update({
        contract_id: validatedData.contract_id.toString(),
        valid_from: validatedData.valid_from.toISOString().split('T')[0],
        valid_to: validatedData.valid_to.toISOString().split('T')[0],
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contract version: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return version;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteContractVersion(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if version exists and belongs to organization
    const { data: existingVersion, error: checkError } = await supabase
      .from('contract_versions')
      .select('id')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingVersion) {
      throw new Error("Contract version not found or does not belong to your organization");
    }

    // Check for related rate plans
    const { count: relatedRatePlans, error: ratePlansError } = await supabase
      .from('rate_plans')
      .select('*', { count: 'exact', head: true })
      .eq('contract_version_id', id.toString());

    if (ratePlansError) {
      console.error('Error checking rate plans:', ratePlansError);
    }

    if (relatedRatePlans && relatedRatePlans > 0) {
      throw new Error(
        `Cannot delete contract version because it has ${relatedRatePlans} associated rate plan(s). Please remove the rate plans first.`
      );
    }

    // Delete the version
    const { error } = await supabase
      .from('contract_versions')
      .delete()
      .eq('id', id.toString())
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete contract version: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true };
  } catch (error) {
    handleError(error, "deletion");
  }
}
