"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";
import { auditContractDeadlineOperation } from "@/lib/audit";

const DEFAULT_ORG_ID = BigInt(1); // TODO: from session

// Validation schemas for contract deadlines
const DeadlinePayloadSchema = z.object({
  ref_type: z.enum(["contract", "version"]).default("contract"),
  ref_id: z.bigint(),
  deadline_type: z.string().min(1, "Deadline type is required"),
  deadline_date: z.string().min(1, "Deadline date is required"),
  penalty_type: z.enum(["none", "fixed", "percentage"]).default("none"),
  penalty_value: z.number().min(0).default(0),
  status: z.enum(["pending", "met", "missed", "waived"]).default("pending"),
  notes: z.string().optional(),
});

const DeadlineUpdateSchema = z.object({
  deadline_type: z.string().min(1, "Deadline type is required").optional(),
  deadline_date: z.string().min(1, "Deadline date is required").optional(),
  penalty_type: z.enum(["none", "fixed", "percentage"]).optional(),
  penalty_value: z.number().min(0).optional(),
  status: z.enum(["pending", "met", "missed", "waived"]).optional(),
  notes: z.string().optional(),
});

function handleError(error: unknown, operation: string) {
  console.error(`Deadline ${operation} error:`, error);
  
  if (error instanceof z.ZodError) {
    throw new Error(`${operation} failed: ${error.issues[0]?.message}`);
  }
  
  if (error instanceof Error) {
    throw new Error(`${operation} failed: ${error.message}`);
  }

  throw new Error(`${operation} failed: Unknown error`);
}

export async function createDeadline(data: z.infer<typeof DeadlinePayloadSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = DeadlinePayloadSchema.parse(data);
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Verify the reference exists and belongs to organization
    if (validatedData.ref_type === "contract") {
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('id')
        .eq('id', validatedData.ref_id.toString())
        .eq('org_id', orgId)
        .single();

      if (contractError || !contract) {
        throw new Error("Contract not found or does not belong to your organization");
      }
    }

    const { data: deadline, error } = await supabase
      .from('contract_deadlines')
      .insert({
        org_id: orgId,
        ref_type: validatedData.ref_type,
        ref_id: validatedData.ref_id.toString(),
        deadline_type: validatedData.deadline_type,
        deadline_date: validatedData.deadline_date,
        penalty_type: validatedData.penalty_type,
        penalty_value: validatedData.penalty_value,
        status: validatedData.status,
        notes: validatedData.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create deadline: ${error.message}`);
    }

    // Create audit log
    await auditContractDeadlineOperation('create', BigInt(deadline.id), validatedData.ref_id, undefined, deadline);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return deadline;
  } catch (error) {
    handleError(error, "creation");
  }
}

export async function updateDeadline(id: bigint, data: z.infer<typeof DeadlineUpdateSchema>, opts?: { redirect?: boolean }) {
  try {
    // Validate input data
    const validatedData = DeadlineUpdateSchema.parse(data);
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Check if deadline exists and belongs to organization
    const { data: existingDeadline, error: checkError } = await supabase
      .from('contract_deadlines')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingDeadline) {
      throw new Error("Deadline not found or does not belong to your organization");
    }

    const { data: deadline, error } = await supabase
      .from('contract_deadlines')
      .update({
        deadline_type: validatedData.deadline_type,
        deadline_date: validatedData.deadline_date,
        penalty_type: validatedData.penalty_type,
        penalty_value: validatedData.penalty_value,
        status: validatedData.status,
        notes: validatedData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deadline: ${error.message}`);
    }

    // Create audit log
    await auditContractDeadlineOperation('update', id, BigInt(existingDeadline.ref_id), existingDeadline, deadline);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return deadline;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteDeadline(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Check if deadline exists and belongs to organization
    const { data: existingDeadline, error: checkError } = await supabase
      .from('contract_deadlines')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingDeadline) {
      throw new Error("Deadline not found or does not belong to your organization");
    }

    const { error } = await supabase
      .from('contract_deadlines')
      .delete()
      .eq('id', id.toString())
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete deadline: ${error.message}`);
    }

    // Create audit log
    await auditContractDeadlineOperation('delete', id, BigInt(existingDeadline.ref_id), existingDeadline, undefined);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true };
  } catch (error) {
    handleError(error, "deletion");
  }
}

export async function markDeadlineComplete(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Check if deadline exists and belongs to organization
    const { data: existingDeadline, error: checkError } = await supabase
      .from('contract_deadlines')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingDeadline) {
      throw new Error("Deadline not found or does not belong to your organization");
    }

    if (existingDeadline.status !== 'pending') {
      throw new Error("Only pending deadlines can be marked as complete");
    }

    const { data: deadline, error } = await supabase
      .from('contract_deadlines')
      .update({
        status: 'met',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark deadline as complete: ${error.message}`);
    }

    // Create audit log
    await auditContractDeadlineOperation('status_change', id, BigInt(existingDeadline.ref_id), existingDeadline, deadline);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return deadline;
  } catch (error) {
    handleError(error, "marking complete");
  }
}

export async function updateDeadlineStatus(id: bigint, status: 'pending' | 'met' | 'missed' | 'waived', opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();

    // Check if deadline exists and belongs to organization
    const { data: existingDeadline, error: checkError } = await supabase
      .from('contract_deadlines')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingDeadline) {
      throw new Error("Deadline not found or does not belong to your organization");
    }

    const { data: deadline, error } = await supabase
      .from('contract_deadlines')
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update deadline status: ${error.message}`);
    }

    // Create audit log
    await auditContractDeadlineOperation('status_change', id, BigInt(existingDeadline.ref_id), existingDeadline, deadline);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return deadline;
  } catch (error) {
    handleError(error, "status update");
  }
}
