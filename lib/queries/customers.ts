import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerFormData, CustomerStats } from '@/lib/types/customer'

export async function getCustomers(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Customer[]
}

export async function getCustomer(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Customer
}

export async function createCustomer(customer: CustomerFormData & { organization_id: string }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single()
  
  if (error) throw error
  return data as Customer
}

export async function updateCustomer(id: string, updates: Partial<CustomerFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Customer
}

export async function deleteCustomer(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('customers')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

export async function getCustomerStats(organizationId: string): Promise<CustomerStats> {
  const supabase = createClient()
  
  // Get total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
  
  // Get B2C customers
  const { count: b2cCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('customer_type', 'B2C')
  
  // Get B2B customers
  const { count: b2bCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .eq('customer_type', 'B2B')
  
  // Get active customers (those with bookings)
  const { data: activeCustomerIds } = await supabase
    .from('bookings')
    .select('customer_id')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
  
  const uniqueActiveCustomers = new Set(activeCustomerIds?.map(b => b.customer_id) || [])
  
  return {
    total_customers: totalCustomers || 0,
    b2c_customers: b2cCustomers || 0,
    b2b_customers: b2bCustomers || 0,
    active_customers: uniqueActiveCustomers.size
  }
}

export async function searchCustomers(organizationId: string, query: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company_name.ilike.%${query}%`)
    .order('first_name')
    .limit(10)
  
  if (error) throw error
  return data as Customer[]
}
