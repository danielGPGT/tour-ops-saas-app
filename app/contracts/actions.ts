"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";
import { auditContractOperation } from "@/lib/audit";

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
  // Contract terms fields (moved from contract_versions)
  commission_rate: z.number().min(0).max(100).optional(),
  currency: z.string().length(3).default("USD"),
  booking_cutoff_days: z.number().int().positive().optional(),
  cancellation_policies: z.array(z.any()).default([]),
  payment_policies: z.array(z.any()).default([]),
  valid_from: z.date().optional(),
  valid_to: z.date().optional(),
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
        // Contract terms fields
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    // Create audit log
    await auditContractOperation('create', BigInt(contract.id), undefined, contract);

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
      .select('*')
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
        // Contract terms fields
        commission_rate: validatedData.commission_rate,
        currency: validatedData.currency,
        booking_cutoff_days: validatedData.booking_cutoff_days,
        cancellation_policies: validatedData.cancellation_policies,
        payment_policies: validatedData.payment_policies,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update contract: ${error.message}`);
    }

    // Create audit log
    await auditContractOperation('update', id, existingContract, contract);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return contract;
  } catch (error) {
    handleError(error, "update");
  }
}

export async function archiveContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check if already archived
    if (existingContract.status === 'archived') {
      throw new Error("Contract is already archived");
    }

    // Archive contract by updating status
    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to archive contract: ${error.message}`);
    }

    // Create audit log
    await auditContractOperation('archive', id, existingContract, contract);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true, contract };
  } catch (error) {
    handleError(error, "archiving");
  }
}

export async function unarchiveContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .single();

    if (checkError || !existingContract) {
      throw new Error("Contract not found or does not belong to your organization");
    }

    // Check if not archived
    if (existingContract.status !== 'archived') {
      throw new Error("Contract is not archived");
    }

    // Unarchive contract by updating status to draft
    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id.toString())
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to unarchive contract: ${error.message}`);
    }

    // Create audit log
    await auditContractOperation('unarchive', id, existingContract, contract);

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true, contract };
  } catch (error) {
    handleError(error, "unarchiving");
  }
}

export async function deleteContract(id: bigint, opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Check if contract exists and belongs to organization
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('*')
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
      .eq('contract_id', id.toString());

    if (ratePlansError) {
      console.error('Error checking rate plans:', ratePlansError);
    }

    // Check for related allocation buckets
    const { count: relatedAllocations, error: allocationsError } = await supabase
      .from('allocation_buckets')
      .select('*', { count: 'exact', head: true })
      .eq('contract_id', id.toString());

    if (allocationsError) {
      console.error('Error checking allocation buckets:', allocationsError);
    }

    // Check for related bookings (through booking items)
    const { count: relatedBookings, error: bookingsError } = await supabase
      .from('booking_items')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', existingContract.supplier_id);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
    }

    // Build error message for any related data
    const relatedItems = [];
    if (relatedRatePlans && relatedRatePlans > 0) {
      relatedItems.push(`${relatedRatePlans} rate plan(s)`);
    }
    if (relatedAllocations && relatedAllocations > 0) {
      relatedItems.push(`${relatedAllocations} allocation bucket(s)`);
    }
    if (relatedBookings && relatedBookings > 0) {
      relatedItems.push(`${relatedBookings} booking(s)`);
    }

    if (relatedItems.length > 0) {
      throw new Error(
        `Cannot delete contract "${existingContract.reference}" because it has ${relatedItems.join(', ')}. Please remove these items first.`
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

    // Create audit log
    await auditContractOperation('delete', id, existingContract, undefined);

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

    // Fetch deadlines for the original contract
    const { data: deadlines, error: deadlinesFetchError } = await supabase
      .from('contract_deadlines')
      .select('*')
      .eq('org_id', orgId)
      .eq('ref_type', 'contract')
      .eq('ref_id', originalContract.id);

    if (!deadlinesFetchError && deadlines && deadlines.length > 0) {
      // Duplicate deadlines for the new contract
      const deadlineDuplicates = deadlines.map((deadline: any) => ({
        org_id: orgId,
        ref_type: 'contract',
        ref_id: newContract.id,
        deadline_type: deadline.deadline_type,
        deadline_date: deadline.deadline_date,
        penalty_type: deadline.penalty_type,
        penalty_value: deadline.penalty_value,
        status: 'pending', // Reset status to pending for new contract
        notes: deadline.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: deadlinesError } = await supabase
        .from('contract_deadlines')
        .insert(deadlineDuplicates);

      if (deadlinesError) {
        console.warn('Failed to duplicate contract deadlines:', deadlinesError);
        // Don't throw error here as the contract was created successfully
      }
    }

    // Create audit log
    await auditContractOperation('duplicate', BigInt(newContract.id), originalContract, newContract);

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

    // Create audit logs for each updated contract
    for (const contract of data || []) {
      await auditContractOperation('bulk_update', BigInt(contract.id), undefined, contract);
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return data;
  } catch (error) {
    handleError(error, "bulk update");
  }
}

export async function bulkArchiveContracts(ids: bigint[], opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get contracts before archiving for audit logs
    const { data: contractsToArchive, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (fetchError) {
      throw new Error(`Failed to fetch contracts for archiving: ${fetchError.message}`);
    }

    // Filter out already archived contracts
    const contractsToArchiveFiltered = contractsToArchive?.filter(contract => contract.status !== 'archived') || [];
    
    if (contractsToArchiveFiltered.length === 0) {
      throw new Error("No contracts to archive (all are already archived)");
    }

    const { data: archivedContracts, error } = await supabase
      .from('contracts')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .in('id', contractsToArchiveFiltered.map(c => c.id))
      .eq('org_id', orgId)
      .select();

    if (error) {
      throw new Error(`Failed to archive contracts: ${error.message}`);
    }

    // Create audit logs for each archived contract
    for (const contract of archivedContracts || []) {
      const originalContract = contractsToArchiveFiltered.find(c => c.id === contract.id);
      if (originalContract) {
        await auditContractOperation('bulk_archive', BigInt(contract.id), originalContract, contract);
      }
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true, archivedCount: archivedContracts?.length || 0 };
  } catch (error) {
    handleError(error, "bulk archiving");
  }
}

export async function bulkUnarchiveContracts(ids: bigint[], opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get contracts before unarchiving for audit logs
    const { data: contractsToUnarchive, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (fetchError) {
      throw new Error(`Failed to fetch contracts for unarchiving: ${fetchError.message}`);
    }

    // Filter to only archived contracts
    const contractsToUnarchiveFiltered = contractsToUnarchive?.filter(contract => contract.status === 'archived') || [];
    
    if (contractsToUnarchiveFiltered.length === 0) {
      throw new Error("No archived contracts to unarchive");
    }

    const { data: unarchivedContracts, error } = await supabase
      .from('contracts')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .in('id', contractsToUnarchiveFiltered.map(c => c.id))
      .eq('org_id', orgId)
      .select();

    if (error) {
      throw new Error(`Failed to unarchive contracts: ${error.message}`);
    }

    // Create audit logs for each unarchived contract
    for (const contract of unarchivedContracts || []) {
      const originalContract = contractsToUnarchiveFiltered.find(c => c.id === contract.id);
      if (originalContract) {
        await auditContractOperation('bulk_unarchive', BigInt(contract.id), originalContract, contract);
      }
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return { success: true, unarchivedCount: unarchivedContracts?.length || 0 };
  } catch (error) {
    handleError(error, "bulk unarchiving");
  }
}

export async function bulkDeleteContracts(ids: bigint[], opts?: { redirect?: boolean }) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get contracts before deletion for audit logs
    const { data: contractsToDelete, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (fetchError) {
      throw new Error(`Failed to fetch contracts for deletion: ${fetchError.message}`);
    }

    // Check for related data for each contract
    const contractsWithRelatedData = [];
    
    for (const contract of contractsToDelete || []) {
      const relatedItems = [];
      
      // Check for rate plans
      const { count: relatedRatePlans } = await supabase
        .from('rate_plans')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contract.id);
      
      if (relatedRatePlans && relatedRatePlans > 0) {
        relatedItems.push(`${relatedRatePlans} rate plan(s)`);
      }
      
      // Check for allocation buckets
      const { count: relatedAllocations } = await supabase
        .from('allocation_buckets')
        .select('*', { count: 'exact', head: true })
        .eq('contract_id', contract.id);
      
      if (relatedAllocations && relatedAllocations > 0) {
        relatedItems.push(`${relatedAllocations} allocation bucket(s)`);
      }
      
      // Check for bookings
      const { count: relatedBookings } = await supabase
        .from('booking_items')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', contract.supplier_id);
      
      if (relatedBookings && relatedBookings > 0) {
        relatedItems.push(`${relatedBookings} booking(s)`);
      }
      
      if (relatedItems.length > 0) {
        contractsWithRelatedData.push({
          contract,
          relatedItems
        });
      }
    }

    // If any contracts have related data, throw error
    if (contractsWithRelatedData.length > 0) {
      const errorMessages = contractsWithRelatedData.map(({ contract, relatedItems }) => 
        `"${contract.reference}" (${relatedItems.join(', ')})`
      );
      
      throw new Error(
        `Cannot delete ${contractsWithRelatedData.length} contract(s) because they have related data: ${errorMessages.join('; ')}. Please remove the related data first.`
      );
    }

    const { error } = await supabase
      .from('contracts')
      .delete()
      .in('id', ids.map(id => id.toString()))
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete contracts: ${error.message}`);
    }

    // Create audit logs for each deleted contract
    for (const contract of contractsToDelete || []) {
      await auditContractOperation('bulk_delete', BigInt(contract.id), contract, undefined);
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

    // Fetch deadlines for each original contract
    for (let i = 0; i < (newContracts || []).length; i++) {
      const newContract = newContracts[i];
      const originalContract = originalContracts[i];
      
      // Create audit log
      await auditContractOperation('duplicate', BigInt(newContract.id), originalContract, newContract);
      
      // Fetch deadlines for this original contract
      const { data: deadlines, error: deadlinesFetchError } = await supabase
        .from('contract_deadlines')
        .select('*')
        .eq('org_id', orgId)
        .eq('ref_type', 'contract')
        .eq('ref_id', originalContract.id);

      if (!deadlinesFetchError && deadlines && deadlines.length > 0) {
        // Duplicate deadlines for the new contract
        const deadlineDuplicates = deadlines.map((deadline: any) => ({
          org_id: orgId,
          ref_type: 'contract',
          ref_id: newContract.id,
          deadline_type: deadline.deadline_type,
          deadline_date: deadline.deadline_date,
          penalty_type: deadline.penalty_type,
          penalty_value: deadline.penalty_value,
          status: 'pending', // Reset status to pending for new contract
          notes: deadline.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: deadlinesError } = await supabase
          .from('contract_deadlines')
          .insert(deadlineDuplicates);

        if (deadlinesError) {
          console.warn(`Failed to duplicate deadlines for contract ${newContract.id}:`, deadlinesError);
          // Don't throw error here as the contract was created successfully
        }
      }
    }

    revalidatePath("/contracts");
    if (opts?.redirect ?? true) redirect("/contracts");
    return newContracts;
  } catch (error) {
    handleError(error, "bulk duplication");
  }
}
