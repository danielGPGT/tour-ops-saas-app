# Audit Logging Guidelines

## 🎯 **CRITICAL RULE: Always Include Everything in Audit Logs**

Every single operation that modifies data MUST include comprehensive audit logging. This is non-negotiable for compliance, security, and debugging.

## 📋 **What Must Be Audited**

### **✅ ALWAYS Audit These Operations:**
- **Create** - New records, entities, relationships
- **Update** - Any field changes, status changes, modifications
- **Delete** - Record deletions, soft deletes
- **Status Changes** - Any state transitions
- **Bulk Operations** - Each item in bulk operations
- **Duplicate** - Record duplications
- **Import** - Data imports, file uploads
- **Export** - Data exports, downloads
- **Login/Logout** - User authentication events
- **Permission Changes** - Role assignments, access changes

### **❌ NEVER Skip Audit Logging For:**
- "Small" changes (every field change matters)
- "Internal" operations (all operations are important)
- "Temporary" data (temporary can become permanent)
- "Bulk" operations (each item needs individual logging)
- "System" operations (system actions need tracking)

## 🔧 **Implementation Pattern**

### **1. Always Use Audit Helper Functions**
```typescript
// ✅ CORRECT - Use specialized audit functions
await auditContractOperation('create', contractId, undefined, newContract);
await auditContractVersionOperation('update', versionId, contractId, oldVersion, newVersion);
await auditContractDeadlineOperation('status_change', deadlineId, contractId, oldDeadline, newDeadline);
```

### **2. Capture Before/After Values**
```typescript
// ✅ CORRECT - Always capture old and new values
const { data: existingRecord } = await supabase
  .from('table')
  .select('*')
  .eq('id', id.toString())
  .single();

// ... perform update ...

await auditOperation('update', id, existingRecord, updatedRecord);
```

### **3. Include All Context**
```typescript
// ✅ CORRECT - Include all relevant context
await createAuditLog({
  entityType: 'contract',
  entityId: contractId,
  action: 'update',
  oldValues: oldContract,
  newValues: newContract,
  changedFields: getChangedFields(oldContract, newContract),
  ipAddress: request?.headers.get('x-forwarded-for'),
  userAgent: request?.headers.get('user-agent'),
});
```

## 📊 **Audit Log Requirements**

### **Every Audit Log Must Include:**
- ✅ **Entity Type** - What was changed (contract, version, deadline, etc.)
- ✅ **Entity ID** - Which specific record
- ✅ **Action** - What operation (create, update, delete, status_change, etc.)
- ✅ **Old Values** - Complete state before change
- ✅ **New Values** - Complete state after change
- ✅ **Changed Fields** - Array of field names that changed
- ✅ **User ID** - Who made the change
- ✅ **Organization ID** - Which organization
- ✅ **Timestamp** - When the change occurred
- ✅ **IP Address** - Where the change came from
- ✅ **User Agent** - What client was used

### **Special Cases:**
- **Create Operations** - `oldValues: null`, `newValues: fullRecord`
- **Delete Operations** - `oldValues: fullRecord`, `newValues: null`
- **Bulk Operations** - Create individual audit log for each item
- **Status Changes** - Use `action: 'status_change'` for clarity

## 🚨 **Critical Rules**

### **1. NEVER Skip Audit Logging**
```typescript
// ❌ WRONG - Missing audit logging
const { data } = await supabase.from('contracts').update({...}).select();

// ✅ CORRECT - Always include audit logging
const { data } = await supabase.from('contracts').update({...}).select();
await auditContractOperation('update', id, oldValues, newValues);
```

### **2. Always Capture Old Values First**
```typescript
// ❌ WRONG - Getting old values after update
await supabase.from('table').update({...});
const oldValues = await getOldValues(); // Too late!

// ✅ CORRECT - Get old values before update
const oldValues = await supabase.from('table').select('*').eq('id', id).single();
await supabase.from('table').update({...});
```

### **3. Handle Audit Logging Errors Gracefully**
```typescript
// ✅ CORRECT - Don't let audit logging break main operations
try {
  await auditContractOperation('update', id, oldValues, newValues);
} catch (auditError) {
  console.error('Audit logging failed:', auditError);
  // Don't throw - main operation should still succeed
}
```

## 📈 **Audit Log Benefits**

### **Business Value:**
- **Compliance** - Meet regulatory requirements
- **Security** - Track suspicious activities
- **Debugging** - Trace issues and changes
- **Accountability** - Know who did what when
- **Analytics** - Understand usage patterns
- **Recovery** - Restore from audit trail

### **Technical Value:**
- **Change Tracking** - Complete history of all changes
- **User Attribution** - Know exactly who made changes
- **Data Integrity** - Verify data hasn't been tampered with
- **Performance Monitoring** - Track operation patterns
- **Error Investigation** - Trace back to root causes

## 🔍 **Audit Log Review Checklist**

Before deploying any new feature, verify:

- [ ] **All CRUD operations** have audit logging
- [ ] **Bulk operations** create individual audit logs
- [ ] **Status changes** are properly logged
- [ ] **Old values** are captured before updates
- [ ] **New values** are captured after updates
- [ ] **Changed fields** are identified and logged
- [ ] **User context** is included (user_id, ip, user_agent)
- [ ] **Error handling** doesn't break audit logging
- [ ] **Organization filtering** is applied
- [ ] **Audit logs are immutable** (cannot be modified)

## 🎯 **Remember: If It Changes Data, It Needs Audit Logging!**

Every single operation that modifies the database must be audited. There are no exceptions. This is critical for:
- **Security** - Track all access and changes
- **Compliance** - Meet audit requirements
- **Debugging** - Understand what happened
- **Accountability** - Know who did what
- **Recovery** - Restore from audit trail

## 📝 **Quick Reference**

### **Available Audit Functions:**
- `auditContractOperation()` - For contract operations
- `auditContractVersionOperation()` - For version operations  
- `auditContractDeadlineOperation()` - For deadline operations
- `createAuditLog()` - Generic audit logging
- `getAuditLogs()` - Retrieve audit logs

### **Common Actions:**
- `'create'` - New record creation
- `'update'` - Record modifications
- `'delete'` - Record deletion
- `'status_change'` - Status transitions
- `'duplicate'` - Record duplication
- `'bulk_update'` - Bulk modifications
- `'bulk_delete'` - Bulk deletions

---

**Remember: Audit logging is not optional - it's essential for a professional, secure, and compliant application!** 🛡️
