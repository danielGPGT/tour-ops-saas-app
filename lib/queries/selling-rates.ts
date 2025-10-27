import { createClient } from '@/lib/supabase/client'
import type { SellingRate, SellingRateFormData } from '@/lib/types/product'

/**
 * Get all selling rates for a product
 */
export async function getSellingRates(productId: string, productOptionId?: string) {
  const supabase = createClient()

  let query = supabase
    .from('selling_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .eq('product_id', productId)

  if (productOptionId) {
    query = query.eq('product_option_id', productOptionId)
  }

  const { data, error } = await query
    .order('valid_from', { ascending: false })

  if (error) throw error
  return data as SellingRate[]
}

/**
 * Get a single selling rate by ID
 */
export async function getSellingRate(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('selling_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as SellingRate
}

/**
 * Create a new selling rate
 */
export async function createSellingRate(data: {
  organization_id: string
  product_id: string
  product_option_id?: string | null
  rate_name?: string | null
  rate_basis: string
  valid_from: string | Date
  valid_to: string | Date
  base_price: number
  currency?: string | null
  markup_type?: string | null
  markup_amount?: number | null
  target_cost?: number | null
  pricing_details?: Record<string, any> | null
  is_active?: boolean
}) {
  const supabase = createClient()

  // Convert dates to ISO strings if they're Date objects
  const payload = {
    ...data,
    valid_from: data.valid_from instanceof Date ? data.valid_from.toISOString().split('T')[0] : data.valid_from,
    valid_to: data.valid_to instanceof Date ? data.valid_to.toISOString().split('T')[0] : data.valid_to,
    organization_id: data.organization_id
  }

  const { data: created, error } = await supabase
    .from('selling_rates')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return created as SellingRate
}

/**
 * Update a selling rate
 */
export async function updateSellingRate(id: string, updates: Partial<{
  rate_name?: string | null
  rate_basis?: string
  valid_from?: string | Date
  valid_to?: string | Date
  base_price?: number
  currency?: string | null
  markup_type?: string | null
  markup_amount?: number | null
  target_cost?: number | null
  pricing_details?: Record<string, any> | null
  is_active?: boolean
}>) {
  const supabase = createClient()

  // Convert dates to ISO strings if they're Date objects
  const payload: any = { ...updates }
  
  if (updates.valid_from instanceof Date) {
    payload.valid_from = updates.valid_from.toISOString().split('T')[0]
  }
  
  if (updates.valid_to instanceof Date) {
    payload.valid_to = updates.valid_to.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('selling_rates')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as SellingRate
}

/**
 * Delete a selling rate (soft delete by setting is_active to false)
 */
export async function deleteSellingRate(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('selling_rates')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}
