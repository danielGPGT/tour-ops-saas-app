import { createClient } from '@/lib/supabase/client'
import type { AllocationInventory, InventoryWithStats } from '@/lib/types/inventory'

// Get inventory for an allocation
export async function getAllocationInventory(allocationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      )
    `)
    .eq('contract_allocation_id', allocationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AllocationInventory[]
}

// Get inventory with stats (availability data)
export async function getInventoryWithStats(allocationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      )
    `)
    .eq('contract_allocation_id', allocationId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch alternate option details for items with flexible configuration
  const enrichedData = await Promise.all(
    data.map(async (item) => {
      if (item.flexible_configuration && item.alternate_option_ids?.length > 0) {
        // Fetch alternate option details
        const { data: alternateOptions } = await supabase
          .from('product_options')
          .select('id, option_name, option_code')
          .in('id', item.alternate_option_ids)

        return {
          ...item,
          alternate_options: alternateOptions || []
        }
      }
      return {
        ...item,
        alternate_options: []
      }
    })
  )

  // For now, return the data as-is. In a full implementation, you'd join with availability data
  // to calculate stats like total_available, total_booked, utilization_percentage
  return enrichedData as InventoryWithStats[]
}

// Get single inventory item
export async function getInventoryItem(inventoryId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      )
    `)
    .eq('id', inventoryId)
    .single()

  if (error) throw error
  return data as AllocationInventory
}

// Create inventory item
export async function createInventoryItem(inventory: Partial<AllocationInventory>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('allocation_inventory')
    .insert(inventory)
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      )
    `)
    .single()

  if (error) throw error
  return data as AllocationInventory
}

// Update inventory item
export async function updateInventoryItem(id: string, updates: Partial<AllocationInventory>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('allocation_inventory')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      )
    `)
    .single()

  if (error) throw error
  return data as AllocationInventory
}

// Delete inventory item
export async function deleteInventoryItem(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('allocation_inventory')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Generate availability for inventory items
export async function generateAvailability(data: { 
  inventoryIds: string[]; 
  dateFrom: string; 
  dateTo: string 
}) {
  const supabase = createClient()
  
  // Call the RPC function to generate availability
  const { data: result, error } = await supabase.rpc('generate_availability', {
    inventory_ids: data.inventoryIds,
    date_from: data.dateFrom,
    date_to: data.dateTo
  })

  if (error) throw error
  return result
}

// Get product options for a specific product
export async function getProductOptions(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select(`
      *,
      product:products(
        id,
        name,
        code,
        product_type:product_types(id, type_name)
      )
    `)
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('option_name')

  if (error) throw error
  return data
}

// Get all inventory across all allocations
export async function getAllInventory() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('allocation_inventory')
    .select(`
      *,
      product_option:product_options(
        id,
        option_name,
        option_code,
        standard_occupancy,
        max_occupancy,
        product:products(
          id,
          name,
          code,
          product_type:product_types(id, type_name)
        )
      ),
      allocation:contract_allocations(
        id,
        allocation_name,
        allocation_type,
        valid_from,
        valid_to
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch alternate option details for items with flexible configuration
  const enrichedData = await Promise.all(
    data.map(async (item) => {
      if (item.flexible_configuration && item.alternate_option_ids?.length > 0) {
        // Fetch alternate option details
        const { data: alternateOptions } = await supabase
          .from('product_options')
          .select('id, option_name, option_code')
          .in('id', item.alternate_option_ids)

        return {
          ...item,
          alternate_options: alternateOptions || []
        }
      }
      return {
        ...item,
        alternate_options: []
      }
    })
  )

  return enrichedData as InventoryWithStats[]
}