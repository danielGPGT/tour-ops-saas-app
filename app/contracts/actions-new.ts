"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

// Validation schemas
const ContractPayloadSchema = z.object({
  supplier_id: z.bigint(),
  reference: z.string().min(1, "Contract reference is required").trim(),
  status: z.enum(["active", "inactive", "draft", "expired"]).default("active"),
  contract_type: z.enum(["net_rate", "commissionable", "allocation"]).optional(),
  signed_date: z.date().optional(),
  signed_document_url: z.string().url().optional(),
  terms_and_conditions: z.string().optional(),
  special_terms: z.string().optional(),
  notes: z.string().optional(),
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
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check for duplicate reference within supplier
    const { data: existingContract, error: duplicateError } = await supabase
      .from('contracts')
      .select('id')
      .eq('org_id', orgId)
      .eq('supplier_id', validatedData.supplier_id.toString())
      .eq('reference', validatedData.reference)
      .single();

    if (existingContract) {
      throw new Error(`A contract with reference "${validatedData.reference}" already exists for this supplier`);
    }

    // Verify supplier exists and belongs to organization
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', validatedData.supplier_id.toString())
      .eq('org_id', orgId)
      .single();

    if (supplierError || !supplier) {
      throw new Error("Supplier not found or does not belong to your organization");
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        org_id: orgId,
        supplier_id: validatedData.supplier_id.toString(),
        reference: validatedData.reference,
        status: validatedData.status,
        contract_type: validatedData.contract_type,
        signed_date: validatedData.signed_date,
        signed_document_url: validatedData.signed_document_url,
        terms_and_conditions: validatedData.terms_and_conditions,
        special_terms: validatedData.special_terms,
        notes: validatedData.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

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
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check for duplicate reference within supplier (excluding current contract)
    const { data: duplicateContract, error: duplicateError } = await supabase
      .from('contracts')
      .select('id')
      .eq('org_id', orgId)
      .eq('supplier_id', validatedData.supplier_id.toString())
      .eq('reference', validatedData.reference)
      .neq('id', id.toString())
      .single();

    if (duplicateContract) {
      throw new Error(`A contract with reference "${validatedData.reference}" already exists for this supplier`);
    }

    // Verify supplier exists and belongs to organization
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', validatedData.supplier_id.toString())
      .eq('org_id', orgId)
      .single();

    if (supplierError || !supplier) {
      throw new Error("Supplier not found or does not belong to your organization");
    }

    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        supplier_id: validatedData.supplier_id.toString(),
        reference: validatedData.reference,
        status: validatedData.status,
        contract_type: validatedData.contract_type,
        signed_date: validatedData.signed_date,
        signed_document_url: validatedData.signed_document_url,
        terms_and_conditions: validatedData.terms_and_conditions,
        special_terms: validatedData.special_terms,
        notes: validatedData.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contract: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contract;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function deleteContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('id, reference')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
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
        `Cannot delete contract "${existingContract.reference}" because it has ${relatedRatePlans} associated rate plan(s). Please remove the rate plans first.`
      );
    }

    // Delete contract (cascade will handle versions and deadlines)
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id.toString())
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete contract: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true };
  } catch (error) {
    handleError(error, "deletion");
  }
}

export async function getContractById(id: bigint) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        suppliers(*),
        contract_versions(*),
        contract_deadlines(*)
      `)
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch contract: ${error.message}`);
    }

    return contract;
  } catch (error) {
    handleError(error, "fetching");
  }
}

export async function getContractsStats() {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get total contracts
    const { count: totalContracts, error: totalError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Get active contracts
    const { count: activeContracts, error: activeError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    // Get contracts by type
    const { data: contractsByType, error: typeError } = await supabase
      .from('contracts')
      .select('contract_type')
      .eq('org_id', orgId);

    const typeStats = contractsByType?.reduce((acc: any, contract: any) => {
      acc[contract.contract_type || 'unknown'] = (acc[contract.contract_type || 'unknown'] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      total: totalContracts || 0,
      active: activeContracts || 0,
      inactive: (totalContracts || 0) - (activeContracts || 0),
      byType: typeStats
    };
  } catch (error) {
    handleError(error, "fetching stats");
  }
}

export async function duplicateContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get the original contract
    const { data: originalContract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (fetchError || !originalContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Create a duplicate with modified reference
    const duplicateData = {
      ...originalContract,
      reference: `${originalContract.reference} (Copy)`,
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Remove the id field so it creates a new record
    delete duplicateData.id;

    const { data: newContract, error: createError } = await supabase
      .from('contracts')
      .insert(duplicateData)
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to duplicate contract: ${createError.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return newContract;
  } catch (error) {
    handleError(error, "duplication");
  }
}

export async function bulkUpdateContracts(ids: bigint[], updates: Partial<z.infer<typeof ContractPayloadSchema>>, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId)
      .select();

    if (error) {
      throw new Error(`Failed to update contracts: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return data;
  } catch (error) {
    handleError(error, "bulk update");
  }
}

export async function bulkDeleteContracts(ids: bigint[], opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('contracts')
      .delete()
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete contracts: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true };
  } catch (error) {
    handleError(error, "bulk deletion");
  }
}

export async function bulkDuplicateContracts(ids: bigint[], opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get the original contracts
    const { data: originalContracts, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (fetchError || !originalContracts) {
      throw new Error("Failed to fetch contracts for duplication");
    }

    // Create duplicates with modified references
    const duplicateData = originalContracts.map(contract => ({
      ...contract,
      reference: `${contract.reference} (Copy)`,
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })).map(({ id, ...contract }) => contract); // Remove id field

    const { data: newContracts, error: createError } = await supabase
      .from('contracts')
      .insert(duplicateData)
      .select();

    if (createError) {
      throw new Error(`Failed to duplicate contracts: ${createError.message}`);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return newContracts;
  } catch (error) {
    handleError(error, "bulk duplication");
  }
}
