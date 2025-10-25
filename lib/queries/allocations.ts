import { createClient } from '@/lib/supabase/client'
import type { ContractAllocation } from '@/lib/types/allocation'

// Get all allocations for organization
export async function getAllocations(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(id, name, code)
      ),
      product:products(
        id, 
        name, 
        code, 
        product_type_id,
        product_type:product_types(id, type_name)
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Get allocations for a specific contract
export async function getAllocationsByContract(contractId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      product:products(
        id, 
        name, 
        code, 
        product_type_id,
        product_type:product_types(id, type_name)
      )
    `)
    .eq('contract_id', contractId)
    .order('allocation_name')
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Get allocations for a specific product
export async function getAllocationsByProduct(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(id, name, code)
      )
    `)
    .eq('product_id', productId)
    .order('valid_from', { ascending: false })
  
  if (error) throw error
  return data as ContractAllocation[]
}

// Get single allocation with full details
export async function getAllocation(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('contract_allocations')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(id, name, code, contact_info)
      ),
      product:products(
        id,
        name,
        code,
        product_type_id,
        description,
        location,
        product_type:product_types(id, type_name)
      )
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Create allocation
export async function createAllocation(allocation: Partial<ContractAllocation>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .insert(allocation)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(id, name, code)
      ),
      product:products(
        id, 
        name, 
        code, 
        product_type_id,
        product_type:product_types(id, type_name)
      )
    `)
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Update allocation
export async function updateAllocation(id: string, updates: Partial<ContractAllocation>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('contract_allocations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        contract_name,
        supplier:suppliers(id, name, code)
      ),
      product:products(
        id, 
        name, 
        code, 
        product_type_id,
        product_type:product_types(id, type_name)
      )
    `)
    .single()
  
  if (error) throw error
  return data as ContractAllocation
}

// Delete allocation
export async function deleteAllocation(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('contract_allocations')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Generate allocation code
export async function generateAllocationCode(contractId: string, productId: string) {
  const supabase = createClient()
  
  // Get contract and product codes
  const { data: contract } = await supabase
    .from('contracts')
    .select('contract_number')
    .eq('id', contractId)
    .single()
  
  const { data: product } = await supabase
    .from('products')
    .select('code')
    .eq('id', productId)
    .single()
  
  if (!contract || !product) return 'ALLOC-001'
  
  // Generate code like: CTR-2025-001-HTL-001
  const contractPart = contract.contract_number.split('-').slice(0, 2).join('-')
  const productPart = product.code.split('-')[0]
  
  // Get count of allocations for this contract
  const { data: allocations } = await supabase
    .from('contract_allocations')
    .select('id')
    .eq('contract_id', contractId)
  
  const count = (allocations?.length || 0) + 1
  const countPadded = count.toString().padStart(3, '0')
  
  return `${contractPart}-${productPart}-${countPadded}`
}
