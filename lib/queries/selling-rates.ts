import { createClient } from '@/lib/supabase/client'

// ===== SELLING RATES QUERIES =====

export async function getSellingRates(
  organizationId: string,
  filters?: {
    product_id?: string
    product_option_id?: string
    is_active?: boolean
  }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('selling_rates')
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (filters?.product_id) {
    query = query.eq('product_id', filters.product_id)
  }
  
  if (filters?.product_option_id) {
    query = query.eq('product_option_id', filters.product_option_id)
  }
  
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

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
  return data
}

export async function createSellingRate(rate: {
  organization_id: string
  product_id: string
  product_option_id?: string
  rate_name: string
  rate_basis: string
  valid_from: string
  valid_to: string
  base_price: number
  currency: string
  markup_type?: string
  markup_amount?: number
  target_cost?: number
  pricing_details?: any
  is_active?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('selling_rates')
    .insert({
      organization_id: rate.organization_id,
      product_id: rate.product_id,
      product_option_id: rate.product_option_id || null,
      rate_name: rate.rate_name,
      rate_basis: rate.rate_basis,
      valid_from: rate.valid_from,
      valid_to: rate.valid_to,
      base_price: rate.base_price,
      currency: rate.currency,
      markup_type: rate.markup_type || null,
      markup_amount: rate.markup_amount || null,
      target_cost: rate.target_cost || null,
      pricing_details: rate.pricing_details || null,
      is_active: rate.is_active !== undefined ? rate.is_active : true
    })
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function updateSellingRate(id: string, updates: {
  rate_name?: string
  rate_basis?: string
  valid_from?: string
  valid_to?: string
  base_price?: number
  currency?: string
  markup_type?: string
  markup_amount?: number
  target_cost?: number
  pricing_details?: any
  is_active?: boolean
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('selling_rates')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .single()
  
  if (error) throw error
  return data
}

export async function deleteSellingRate(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('selling_rates')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getSellingRatesForProduct(
  productId: string,
  organizationId: string,
  productOptionId?: string,
  dateRange?: { start: string; end: string }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('selling_rates')
    .select(`
      *,
      product_option:product_options(id, option_name, option_code)
    `)
    .eq('product_id', productId)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('valid_from', { ascending: true })

  if (productOptionId) {
    query = query.eq('product_option_id', productOptionId)
  }

  if (dateRange) {
    query = query
      .lte('valid_from', dateRange.end)
      .gte('valid_to', dateRange.start)
  }

  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

export async function duplicateSellingRate(
  id: string, 
  updates: {
    rate_name?: string
    valid_from: string
    valid_to: string
    base_price?: number
  }
) {
  const supabase = createClient()
  
  // First get the original rate
  const { data: original, error: fetchError } = await supabase
    .from('selling_rates')
    .select('*')
    .eq('id', id)
    .single()
  
  if (fetchError) throw fetchError
  
  // Create the duplicate with updates
  const { data, error } = await supabase
    .from('selling_rates')
    .insert({
      organization_id: original.organization_id,
      product_id: original.product_id,
      product_option_id: original.product_option_id,
      rate_name: updates.rate_name || `${original.rate_name} (Copy)`,
      rate_basis: original.rate_basis,
      valid_from: updates.valid_from,
      valid_to: updates.valid_to,
      base_price: updates.base_price || original.base_price,
      currency: original.currency,
      markup_type: original.markup_type,
      markup_amount: original.markup_amount,
      target_cost: original.target_cost,
      pricing_details: original.pricing_details,
      is_active: true
    })
    .select(`
      *,
      product:products(id, name, code),
      product_option:product_options(id, option_name, option_code)
    `)
    .single()
  
  if (error) throw error
  return data
}

// Get rate comparison (selling vs supplier rates)
export async function getRateComparison(
  productId: string, 
  productOptionId: string,
  organizationId: string
) {
  const supabase = createClient()
  
  const [sellingRates, supplierRates] = await Promise.all([
    supabase
      .from('selling_rates')
      .select('*')
      .eq('product_id', productId)
      .eq('product_option_id', productOptionId)
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    supabase
      .from('supplier_rates')
      .select('*')
      .eq('product_id', productId)
      .eq('product_option_id', productOptionId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
  ])
  
  if (sellingRates.error) throw sellingRates.error
  if (supplierRates.error) throw supplierRates.error
  
  // Calculate margins and profit analysis
  const comparisons = sellingRates.data.map(selling => {
    const matching = supplierRates.data.find(supplier => 
      supplier.rate_basis === selling.rate_basis &&
      new Date(supplier.valid_from) <= new Date(selling.valid_to) &&
      new Date(supplier.valid_to) >= new Date(selling.valid_from)
    )
    
    return {
      selling_rate: selling,
      supplier_rate: matching,
      margin: matching ? selling.base_price - matching.base_cost : null,
      margin_percentage: matching ? 
        ((selling.base_price - matching.base_cost) / matching.base_cost * 100) : null,
      profit_per_unit: matching ? selling.base_price - matching.base_cost : null
    }
  })
  
  return comparisons
}

// Get selling rate stats for a product option
export async function getSellingRateStats(
  productId: string,
  productOptionId: string,
  organizationId: string
) {
  const supabase = createClient()
  
  const { data: rates, error } = await supabase
    .from('selling_rates')
    .select('*')
    .eq('product_id', productId)
    .eq('product_option_id', productOptionId)
    .eq('organization_id', organizationId)
  
  if (error) throw error
  
  const totalRates = rates.length
  const activeRates = rates.filter(r => r.is_active).length
  const averagePrice = rates.length > 0 ? 
    rates.reduce((sum, r) => sum + r.base_price, 0) / rates.length : 0
  const priceRange = rates.length > 0 ? {
    min: Math.min(...rates.map(r => r.base_price)),
    max: Math.max(...rates.map(r => r.base_price))
  } : { min: 0, max: 0 }
  
  return {
    totalRates,
    activeRates,
    averagePrice,
    priceRange,
    currency: rates[0]?.currency || 'GBP'
  }
}