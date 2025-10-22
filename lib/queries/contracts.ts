import { createClient } from '@/lib/supabase/client'
import type { 
  Contract, 
  ContractFormData, 
  ContractAllocationFormData, 
  SupplierRateFormData,
  ContractFilters,
  ContractSort,
  ContractStats
} from '@/lib/types/contract'

// Get all contracts for an organization
export async function getContracts(
  organizationId: string,
  filters?: ContractFilters,
  sort?: ContractSort
) {
  const supabase = createClient()
  
  let query = supabase
    .from('contracts')
    .select(`
      *,
      suppliers!contracts_supplier_id_fkey(
        id,
        name,
        code,
        supplier_type,
        contact_info,
        is_active
      )
    `)
    .eq('organization_id', organizationId)

  // Apply filters
  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }
  
  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }
  
  if (filters?.date_from) {
    query = query.gte('valid_from', filters.date_from)
  }
  
  if (filters?.date_to) {
    query = query.lte('valid_to', filters.date_to)
  }
  
  if (filters?.currency) {
    query = query.eq('currency', filters.currency)
  }
  
  if (filters?.search) {
    query = query.or(`contract_name.ilike.%${filters.search}%,contract_number.ilike.%${filters.search}%`)
  }

  // Apply sorting
  if (sort) {
    const sortField = sort.field === 'supplier_name' ? 'supplier.name' : sort.field
    query = query.order(sortField, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  
  if (error) throw error
  
  // Transform the data to match our Contract interface
  return data?.map(contract => ({
    ...contract,
    supplier: contract.suppliers,
    supplier_name: contract.suppliers?.name || 'N/A'
  })) as Contract[]
}

// Get a single contract by ID
export async function getContract(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      suppliers!contracts_supplier_id_fkey(
        id,
        name,
        code,
        supplier_type,
        contact_info,
        is_active
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  
  // Transform the data to match our Contract interface
  return {
    ...data,
    supplier: data.suppliers,
    supplier_name: data.suppliers?.name || 'N/A'
  } as Contract
}

// Create a new contract
export async function createContract(contract: ContractFormData & { organization_id: string }) {
  const supabase = createClient()
  
  // Generate contract number
  const contractNumber = await generateContractNumber(contract.supplier_id)
  
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      ...contract,
      contract_number: contractNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data as Contract
}

// Update a contract
export async function updateContract(id: string, updates: Partial<ContractFormData>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contracts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Contract
}

// Delete a contract (soft delete)
export async function deleteContract(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('contracts')
    .update({ 
      status: 'terminated',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

// Contract Allocations
export async function getContractAllocations(contractId: string) {
  const supabase = createClient()
  
  // Try to get the user's organization, but don't fail if it's not available
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  let query = supabase
    .from('contract_allocations')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
  
  // Only add organization filter if we have a valid profile
  if (profile && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching contract allocations:', error)
    throw error
  }
  return data || []
}

export async function createContractAllocation(
  contractId: string, 
  allocation: ContractAllocationFormData & { organization_id: string }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .insert({
      ...allocation,
      contract_id: contractId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateContractAllocation(
  id: string, 
  updates: Partial<ContractAllocationFormData>
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteContractAllocation(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('contract_allocations')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

// Supplier Rates
export async function getSupplierRates(contractId: string) {
  const supabase = createClient()
  
  // Try to get the user's organization, but don't fail if it's not available
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  let query = supabase
    .from('supplier_rates')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
  
  // Only add organization filter if we have a valid profile
  if (profile && profile.organization_id) {
    query = query.eq('organization_id', profile.organization_id)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching supplier rates:', error)
    throw error
  }
  return data || []
}

export async function createSupplierRate(
  contractId: string,
  rate: SupplierRateFormData & { organization_id: string }
) {
  const supabase = createClient()
  
  const { data: rateData, error: rateError } = await supabase
    .from('supplier_rates')
    .insert({
      ...rate,
      contract_id: contractId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (rateError) throw rateError
  
  // Create occupancy costs
  if (rate.occupancy_costs && rate.occupancy_costs.length > 0) {
    const { error: costsError } = await supabase
      .from('rate_occupancy_costs')
      .insert(
        rate.occupancy_costs.map((cost: any) => ({
          ...cost,
          supplier_rate_id: rateData.id
        }))
      )
    
    if (costsError) throw costsError
  }
  
  return rateData
}

export async function updateSupplierRate(
  id: string,
  updates: Partial<SupplierRateFormData>
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('supplier_rates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteSupplierRate(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('supplier_rates')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
  
  if (error) throw error
}

// Get contract statistics
export async function getContractStats(organizationId: string): Promise<ContractStats> {
  const supabase = createClient()
  
  // Get basic contract counts
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select('status, currency')
    .eq('organization_id', organizationId)
  
  if (contractsError) throw contractsError
  
  // Get allocation count
  const { count: allocationsCount, error: allocationsError } = await supabase
    .from('contract_allocations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  
  if (allocationsError) throw allocationsError
  
  // Get rates count
  const { count: ratesCount, error: ratesError } = await supabase
    .from('supplier_rates')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  
  if (ratesError) throw ratesError
  
  // Calculate statistics
  const stats: ContractStats = {
    total_contracts: contracts?.length || 0,
    active_contracts: contracts?.filter(c => c.status === 'active').length || 0,
    expired_contracts: contracts?.filter(c => c.status === 'expired').length || 0,
    draft_contracts: contracts?.filter(c => c.status === 'draft').length || 0,
    terminated_contracts: contracts?.filter(c => c.status === 'terminated').length || 0,
    suspended_contracts: contracts?.filter(c => c.status === 'suspended').length || 0,
    total_allocations: allocationsCount || 0,
    total_rates: ratesCount || 0,
    total_value: 0, // TODO: Calculate from rates
    currency: contracts?.[0]?.currency || 'USD'
  }
  
  return stats
}

// Helper function to generate contract number
async function generateContractNumber(supplierId: string): Promise<string> {
  const supabase = createClient()
  
  // Get supplier code
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('code')
    .eq('id', supplierId)
    .single()
  
  if (supplierError) throw supplierError
  
  // Get current year
  const year = new Date().getFullYear()
  
  // Get count of contracts for this supplier this year
  const { count, error: countError } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', supplierId)
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`)
  
  if (countError) throw countError
  
  // Generate contract number: SUPPLIER_CODE-YYYY-XXXX
  const sequence = String((count || 0) + 1).padStart(4, '0')
  return `${supplier.code}-${year}-${sequence}`
}

// ===== PAYMENT SCHEDULES =====

export async function getPaymentSchedules(contractId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_payment_schedules')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order')
  
  if (error) throw error
  return data
}

export async function createPaymentSchedule(schedule: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_payment_schedules')
    .insert(schedule)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updatePaymentSchedule(id: string, updates: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_payment_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deletePaymentSchedule(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_payment_schedules')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== CANCELLATION POLICIES =====

export async function getCancellationPolicies(contractId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_cancellation_policies')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order')
  
  if (error) throw error
  return data
}

export async function createCancellationPolicy(policy: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_cancellation_policies')
    .insert(policy)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCancellationPolicy(id: string, updates: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_cancellation_policies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCancellationPolicy(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_cancellation_policies')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== DEADLINES =====

export async function getDeadlines(refType: string, refId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_deadlines')
    .select('*')
    .eq('ref_type', refType)
    .eq('contract_id', refId)
    .order('deadline_date')
  
  if (error) throw error
  return data
}

export async function createDeadline(deadline: Partial<any>) {
  const supabase = createClient()
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  const { data, error } = await supabase
    .from('contract_deadlines')
    .insert({
      ...deadline,
      organization_id: profile.organization.id,
      contract_id: deadline.ref_id  // Map ref_id to contract_id
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateDeadline(id: string, updates: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_deadlines')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteDeadline(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_deadlines')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== COMMISSION TIERS =====

export async function getCommissionTiers(contractId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_commission_tiers')
    .select('*')
    .eq('contract_id', contractId)
    .order('sort_order')
  
  if (error) throw error
  return data
}

export async function createCommissionTier(tier: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_commission_tiers')
    .insert(tier)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateCommissionTier(id: string, updates: Partial<any>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_commission_tiers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteCommissionTier(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_commission_tiers')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
