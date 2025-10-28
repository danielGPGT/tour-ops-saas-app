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

// Supplier Rates for specific contract
export async function getContractSupplierRates(contractId: string) {
  const supabase = createClient()
  
  // Try to get the user's organization, but don't fail if it's not available
  const { data: profile } = await supabase.rpc('get_user_profile')
  
  let query = supabase
    .from('supplier_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name)
    `)
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

// ===== ALLOCATION STATS =====

export async function getAllocationStats(contractId: string) {
  const supabase = createClient()
  
  // Get all allocations for this contract with inventory data
  const { data: allocations, error: allocationsError } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      allocation_inventory(
        total_quantity,
        available_quantity,
        sold_quantity,
        batch_cost_per_unit
      )
    `)
    .eq('contract_id', contractId)
    .eq('is_active', true)
  
  if (allocationsError) throw allocationsError
  
  // Calculate totals
  let totalUnits = 0
  let soldUnits = 0
  let availableUnits = 0
  let totalCost = 0
  let allocationCount = allocations?.length || 0
  
  allocations?.forEach(allocation => {
    totalUnits += allocation.total_quantity || 0
    totalCost += allocation.total_cost || 0
    
    allocation.allocation_inventory?.forEach((inventory: any) => {
      soldUnits += inventory.sold_quantity || 0
      availableUnits += inventory.available_quantity || 0
    })
  })
  
  const soldPercentage = totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0
  const availablePercentage = totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0
  const avgCostPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0
  
  return {
    total_units: totalUnits,
    sold_units: soldUnits,
    available_units: availableUnits,
    sold_percentage: soldPercentage,
    available_percentage: availablePercentage,
    allocation_count: allocationCount,
    total_cost: totalCost,
    avg_cost_per_unit: avgCostPerUnit,
    currency: allocations?.[0]?.currency || 'GBP'
  }
}

// ===== ALLOCATION RELEASES =====

export async function getAllocationReleases(allocationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_releases')
    .select('*')
    .eq('contract_allocation_id', allocationId)
    .order('release_date', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createAllocationRelease(release: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_releases')
    .insert(release)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAllocationRelease(id: string, updates: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_releases')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAllocationRelease(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('allocation_releases')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== ALLOCATION POOLS =====

export async function getAllocationPools(organizationId: string, productId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('allocation_pools')
    .select(`
      *,
      product:products(name, code),
      product_option:product_options(option_name),
      allocation_pool_members(
        id,
        priority,
        units_used,
        is_active,
        contract_allocation:contract_allocations(
          id,
          allocation_name,
          total_quantity,
          total_cost,
          currency,
          valid_from,
          valid_to,
          allocation_type,
          contract:contracts(supplier:suppliers(name))
        )
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (productId) {
    query = query.eq('product_id', productId)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function getAllocationPool(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_pools')
    .select(`
      *,
      product:products(name, code),
      product_option:product_options(option_name),
      allocation_pool_members(
        id,
        priority,
        units_used,
        is_active,
        created_at,
        contract_allocation:contract_allocations(
          id,
          allocation_name,
          total_quantity,
          total_cost,
          currency,
          cost_per_unit,
          valid_from,
          valid_to,
          allocation_type,
          release_days,
          contract:contracts(
            contract_name,
            supplier:suppliers(name)
          ),
          allocation_inventory(
            total_quantity,
            available_quantity,
            sold_quantity
          )
        )
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createAllocationPool(pool: {
  organization_id: string
  product_id: string
  product_option_id?: string
  pool_name: string
  pool_code?: string
  usage_strategy: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_pools')
    .insert(pool)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAllocationPool(id: string, updates: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_pools')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAllocationPool(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('allocation_pools')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== ALLOCATION POOL MEMBERS =====

export async function addAllocationToPool(poolId: string, allocationId: string, priority: number = 0) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_pool_members')
    .insert({
      allocation_pool_id: poolId,
      contract_allocation_id: allocationId,
      priority
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function removeAllocationFromPool(poolId: string, allocationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('allocation_pool_members')
    .delete()
    .eq('allocation_pool_id', poolId)
    .eq('contract_allocation_id', allocationId)
  
  if (error) throw error
}

export async function updatePoolMemberPriority(poolId: string, allocationId: string, priority: number) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_pool_members')
    .update({ priority })
    .eq('allocation_pool_id', poolId)
    .eq('contract_allocation_id', allocationId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getPoolOptimizationData(poolId: string) {
  const supabase = createClient()
  
  // Get pool with all member allocations and their current utilization
  const { data: pool, error } = await supabase
    .from('allocation_pools')
    .select(`
      *,
      allocation_pool_members(
        id,
        priority,
        units_used,
        contract_allocation:contract_allocations(
          id,
          allocation_name,
          total_quantity,
          total_cost,
          cost_per_unit,
          currency,
          valid_from,
          valid_to,
          release_days,
          allocation_inventory(
            total_quantity,
            available_quantity,
            sold_quantity
          )
        )
      )
    `)
    .eq('id', poolId)
    .single()
  
  if (error) throw error
  
  // Calculate optimization metrics
  const members = pool?.allocation_pool_members || []
  let totalCapacity = 0
  let totalAvailable = 0
  let totalSold = 0
  let totalCost = 0
  let earliestRelease: Date | null = null
  let latestExpiry: Date | null = null
  
  members.forEach((member: any) => {
    const allocation = member.contract_allocation
    if (!allocation) return
    
    totalCapacity += allocation.total_quantity || 0
    totalCost += allocation.total_cost || 0
    
    // Sum inventory quantities
    allocation.allocation_inventory?.forEach((inv: any) => {
      totalAvailable += inv.available_quantity || 0
      totalSold += inv.sold_quantity || 0
    })
    
    // Track release dates
    if (allocation.release_days && allocation.valid_from) {
      const releaseDate = new Date(allocation.valid_from)
      releaseDate.setDate(releaseDate.getDate() - allocation.release_days)
      
      if (!earliestRelease || releaseDate < earliestRelease) {
        earliestRelease = releaseDate
      }
    }
    
    // Track expiry dates
    if (allocation.valid_to) {
      const expiryDate = new Date(allocation.valid_to)
      if (!latestExpiry || expiryDate > latestExpiry) {
        latestExpiry = expiryDate
      }
    }
  })
  
  const utilizationRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0
  const avgCostPerUnit = totalCapacity > 0 ? totalCost / totalCapacity : 0
  
  return {
    pool,
    metrics: {
      total_capacity: totalCapacity,
      total_available: totalAvailable,
      total_sold: totalSold,
      total_cost: totalCost,
      utilization_rate: utilizationRate,
      avg_cost_per_unit: avgCostPerUnit,
      member_count: members.length,
      earliest_release: earliestRelease,
      latest_expiry: latestExpiry,
      currency: members[0]?.contract_allocation?.currency || 'GBP'
    }
  }
}

// ===== SINGLE ALLOCATION WITH INVENTORY =====

export async function getAllocationDetails(allocationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      product:products(
        id,
        name,
        code
      ),
      allocation_inventory(
        *,
        product_option:product_options(
          id,
          option_name,
          option_code,
          attributes
        )
      )
    `)
    .eq('id', allocationId)
    .single()
  
  if (error) throw error
  return data
}

// ===== ALLOCATION INVENTORY =====

export async function getAllocationInventory(allocationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code
      )
    `)
    .eq('contract_allocation_id', allocationId)
  
  if (error) throw error
  return data || []
}

export async function createAllocationInventory(inventory: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_inventory')
    .insert(inventory)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAllocationInventory(id: string, updates: any) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('allocation_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAllocationInventory(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('allocation_inventory')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ===== AVAILABILITY CALENDAR =====

export async function getAvailabilityCalendar(
  allocationInventoryId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('allocation_inventory_id', allocationInventoryId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getAvailabilityForAllocation(
  allocationId: string,
  startDate: string,
  endDate: string
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availability')
    .select(`
      *,
      allocation_inventory:allocation_inventory(
        id,
        total_quantity,
        product_option:product_options(
          id,
          option_name,
          option_code
        )
      )
    `)
    .eq('allocation_inventory.contract_allocation_id', allocationId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function createAvailabilityRecord(availability: {
  allocation_inventory_id: string
  date: string
  total_available: number
  available: number
  booked?: number
  is_closed?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availability')
    .insert({
      allocation_inventory_id: availability.allocation_inventory_id,
      date: availability.date,
      total_available: availability.total_available,
      available: availability.available,
      booked: availability.booked || 0,
      is_closed: availability.is_closed || false
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateAvailabilityRecord(id: string, updates: {
  total_available?: number
  available?: number
  booked?: number
  is_closed?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('availability')
    .update({
      ...updates,
      last_modified: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteAvailabilityRecord(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function bulkCreateAvailability(
  allocationInventoryId: string,
  dateRange: { start: string; end: string },
  defaultAvailable: number
) {
  const supabase = createClient()
  
  // Generate availability records for each date in range
  const startDate = new Date(dateRange.start)
  const endDate = new Date(dateRange.end)
  const records = []
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    records.push({
      allocation_inventory_id: allocationInventoryId,
      date: date.toISOString().split('T')[0],
      total_available: defaultAvailable,
      available: defaultAvailable,
      booked: 0,
      is_closed: false
    })
  }
  
  const { data, error } = await supabase
    .from('availability')
    .insert(records)
    .select()
  
  if (error) throw error
  return data || []
}

export async function getAvailabilitySummary(allocationId: string) {
  const supabase = createClient()
  
  // Get summary stats for all availability records for this allocation
  const { data, error } = await supabase
    .rpc('get_availability_summary', {
      allocation_id: allocationId
    })
  
  if (error) {
    console.warn('RPC function not available, falling back to basic query')
    
    // Fallback to basic aggregation
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('availability')
      .select(`
        total_available,
        available,
        booked,
        is_closed,
        allocation_inventory:allocation_inventory!inner(
          contract_allocation_id
        )
      `)
      .eq('allocation_inventory.contract_allocation_id', allocationId)
    
    if (fallbackError) throw fallbackError
    
    // Calculate summary manually
    const summary = {
      total_days: fallbackData?.length || 0,
      total_capacity: fallbackData?.reduce((sum, item) => sum + (item.total_available || 0), 0) || 0,
      total_booked: fallbackData?.reduce((sum, item) => sum + (item.booked || 0), 0) || 0,
      total_available: fallbackData?.reduce((sum, item) => sum + (item.available || 0), 0) || 0,
      closed_days: fallbackData?.filter(item => item.is_closed).length || 0
    }
    
    return summary
  }
  
  return data
}

// ===== SUPPLIER RATES =====

export async function getSupplierRates(
  organizationId: string,
  filters?: {
    product_id?: string
    contract_id?: string
    supplier_id?: string
    is_active?: boolean
  }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('supplier_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number, supplier_id),
      supplier:suppliers(id, name, code)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id)
  }
  
  if (filters?.contract_id) {
    query = query.eq('contract_id', filters.contract_id)
  }
  
  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id)
  }
  
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function getSupplierRate(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('supplier_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number, supplier_id),
      supplier:suppliers(id, name, code)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createSupplierRate(rate: {
  organization_id: string
  product_id: string
  product_option_id?: string
  contract_id?: string
  supplier_id?: string
  rate_name: string
  rate_basis: string
  valid_from: string
  valid_to: string
  base_cost: number
  currency: string
  pricing_details?: any
  is_active?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('supplier_rates')
    .insert({
      organization_id: rate.organization_id,
      product_id: rate.product_id,
      product_option_id: rate.product_option_id || null,
      contract_id: rate.contract_id || null,
      supplier_id: rate.supplier_id || null,
      rate_name: rate.rate_name,
      rate_basis: rate.rate_basis,
      valid_from: rate.valid_from,
      valid_to: rate.valid_to,
      base_cost: rate.base_cost,
      currency: rate.currency,
      pricing_details: rate.pricing_details || null,
      is_active: rate.is_active !== undefined ? rate.is_active : true
    })
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number, supplier_id),
      supplier:suppliers(id, name, code)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function updateSupplierRate(id: string, updates: {
  rate_name?: string
  rate_basis?: string
  valid_from?: string
  valid_to?: string
  base_cost?: number
  currency?: string
  pricing_details?: any
  is_active?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('supplier_rates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number, supplier_id),
      supplier:suppliers(id, name, code)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteSupplierRate(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('supplier_rates')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getSupplierRatesByContract(contractId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('supplier_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      supplier:suppliers(id, name, code)
    `)
    .eq('contract_id', contractId)
    .eq('is_active', true)
    .order('valid_from', { ascending: true })
  
  if (error) throw error
  return data || []
}

export async function getSupplierRatesForProduct(
  productId: string,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('supplier_rates')
    .select(`
      *,
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number),
      supplier:suppliers(id, name, code)
    `)
    .eq('product_id', productId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('valid_from', { ascending: true })

  if (dateRange) {
    query = query
      .lte('valid_from', dateRange.end)
      .gte('valid_to', dateRange.start)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function duplicateSupplierRate(
  id: string, 
  updates: {
    rate_name?: string
    valid_from: string
    valid_to: string
    base_cost?: number
  }
) {
  const supabase = createClient()
  
  // First get the original rate
  const { data: original, error: fetchError } = await supabase
    .from('supplier_rates')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Create the duplicate with updates
  const { data, error } = await supabase
    .from('supplier_rates')
    .insert({
      organization_id: original.organization_id,
      product_id: original.product_id,
      product_option_id: original.product_option_id,
      contract_id: original.contract_id,
      supplier_id: original.supplier_id,
      rate_name: updates.rate_name || `${original.rate_name} (Copy)`,
      rate_basis: original.rate_basis,
      valid_from: updates.valid_from,
      valid_to: updates.valid_to,
      base_cost: updates.base_cost || original.base_cost,
      currency: original.currency,
      pricing_details: original.pricing_details,
      is_active: true
    })
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code),
      contract:contracts(id, contract_number, supplier_id),
      supplier:suppliers(id, name, code)
    `)
    .single()
  
  if (error) throw error
  return data
}
