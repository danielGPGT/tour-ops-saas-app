import { createClient } from "@/utils/supabase/server";
import { getCurrentOrgId } from "@/lib/hooks/use-current-org";

export interface AuditLogData {
  entityType: string;
  entityId: bigint;
  action: 'create' | 'update' | 'delete' | 'status_change' | 'duplicate' | 'bulk_update' | 'bulk_delete' | 'archive' | 'unarchive' | 'bulk_archive' | 'bulk_unarchive';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    // Get current user info if available
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        org_id: orgId,
        user_id: user?.id || null,
        entity_type: data.entityType,
        entity_id: data.entityId.toString(),
        action: data.action,
        old_values: data.oldValues || null,
        new_values: data.newValues || null,
        changed_fields: data.changedFields || [],
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      });

    if (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: bigint,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const orgId = await getCurrentOrgId();
    const supabase = await createClient();
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    if (entityId) {
      query = query.eq('entity_id', entityId.toString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

// Helper function to get changed fields between two objects
export function getChangedFields(oldValues: Record<string, any>, newValues: Record<string, any>): string[] {
  const changedFields: string[] = [];
  
  // Check for changed fields
  for (const key in newValues) {
    if (oldValues[key] !== newValues[key]) {
      changedFields.push(key);
    }
  }
  
  // Check for removed fields
  for (const key in oldValues) {
    if (!(key in newValues)) {
      changedFields.push(key);
    }
  }
  
  return changedFields;
}

// Helper function to create audit log for contract operations
export async function auditContractOperation(
  action: AuditLogData['action'],
  contractId: bigint,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  request?: Request
) {
  const changedFields = oldValues && newValues ? getChangedFields(oldValues, newValues) : [];
  
  await createAuditLog({
    entityType: 'contract',
    entityId: contractId,
    action,
    oldValues,
    newValues,
    changedFields,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

// Helper function to create audit log for contract version operations
export async function auditContractVersionOperation(
  action: AuditLogData['action'],
  versionId: bigint,
  contractId: bigint,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  request?: Request
) {
  const changedFields = oldValues && newValues ? getChangedFields(oldValues, newValues) : [];
  
  await createAuditLog({
    entityType: 'contract_version',
    entityId: versionId,
    action,
    oldValues,
    newValues,
    changedFields,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}

// Helper function to create audit log for contract deadline operations
export async function auditContractDeadlineOperation(
  action: AuditLogData['action'],
  deadlineId: bigint,
  contractId: bigint,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
  request?: Request
) {
  const changedFields = oldValues && newValues ? getChangedFields(oldValues, newValues) : [];
  
  await createAuditLog({
    entityType: 'contract_deadline',
    entityId: deadlineId,
    action,
    oldValues,
    newValues,
    changedFields,
    ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
    userAgent: request?.headers.get('user-agent') || undefined,
  });
}
