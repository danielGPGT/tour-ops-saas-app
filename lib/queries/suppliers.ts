import { createClient } from '@/lib/supabase/client'
import type { Supplier, SupplierFormData, SupplierStats } from '@/lib/types/supplier'

export async function getSuppliers(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data as Supplier[]
}

export async function getSupplier(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function createSupplier(supplier: SupplierFormData & { organization_id: string }) {
  const supabase = createClient()
  
  // Ensure required fields are present
  if (!supplier.name) {
    throw new Error('Supplier name is required')
  }
  if (!supplier.code) {
    throw new Error('Supplier code is required')
  }
  
  // Prepare the data for insertion, only including defined fields
  const insertData: any = {
    organization_id: supplier.organization_id,
    name: supplier.name,
    code: supplier.code
  }
  
  // Add optional fields only if they are defined
  if (supplier.supplier_type !== undefined && supplier.supplier_type !== null) {
    insertData.supplier_type = supplier.supplier_type
  }
  if (supplier.email !== undefined && supplier.email !== null && supplier.email !== '') {
    insertData.email = supplier.email
  }
  if (supplier.phone !== undefined && supplier.phone !== null && supplier.phone !== '') {
    insertData.phone = supplier.phone
  }
  if (supplier.address_line1 !== undefined && supplier.address_line1 !== null && supplier.address_line1 !== '') {
    insertData.address_line1 = supplier.address_line1
  }
  if (supplier.city !== undefined && supplier.city !== null && supplier.city !== '') {
    insertData.city = supplier.city
  }
  if (supplier.country !== undefined && supplier.country !== null && supplier.country !== '') {
    insertData.country = supplier.country
  }
  if (supplier.default_currency !== undefined && supplier.default_currency !== null) {
    insertData.default_currency = supplier.default_currency
  }
  if (supplier.notes !== undefined && supplier.notes !== null && supplier.notes !== '') {
    insertData.notes = supplier.notes
  }
  if (supplier.is_active !== undefined) {
    insertData.is_active = supplier.is_active
  }
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert(insertData)
    .select()
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function updateSupplier(id: string, updates: Partial<SupplierFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Supplier
}

export async function deleteSupplier(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('suppliers')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

export async function getSupplierStats(organizationId: string): Promise<SupplierStats> {
  const supabase = createClient()
  
  // Get total suppliers
  const { count: totalSuppliers } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  // Get active contracts count
  const { count: activeContracts } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')
  
  // Get total bookings this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', startOfMonth.toISOString())
  
  // Get average rating
  const { data: ratingData } = await supabase
    .from('suppliers')
    .select('rating')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .not('rating', 'is', null)
  
  const averageRating = ratingData && ratingData.length > 0
    ? ratingData.reduce((sum, supplier) => sum + (supplier.rating || 0), 0) / ratingData.length
    : 0
  
  return {
    total_suppliers: totalSuppliers || 0,
    active_contracts: activeContracts || 0,
    total_bookings: totalBookings || 0,
    average_rating: Math.round(averageRating * 10) / 10
  }
}

export async function searchSuppliers(organizationId: string, query: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    .order('name')
    .limit(10)
  
  if (error) throw error
  return data as Supplier[]
}
