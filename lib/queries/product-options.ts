import { createClient } from '@/lib/supabase/client'
import type { ProductOption } from '@/lib/types/product-option'

// Get all options for a product
export async function getProductOptions(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true })
    .order('option_name', { ascending: true })
  
  if (error) throw error
  return data as ProductOption[]
}

// Get single option
export async function getProductOption(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Create option
export async function createProductOption(option: Partial<ProductOption>) {
  const supabase = createClient()
  
  // Get max sort_order for this product
  const { data: maxSort } = await supabase
    .from('product_options')
    .select('sort_order')
    .eq('product_id', option.product_id!)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()
  
  const nextSortOrder = maxSort ? maxSort.sort_order + 1 : 0
  
  const { data, error } = await supabase
    .from('product_options')
    .insert({
      ...option,
      sort_order: option.sort_order ?? nextSortOrder
    })
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Update option
export async function updateProductOption(id: string, updates: Partial<ProductOption>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('product_options')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Delete option
export async function deleteProductOption(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('product_options')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Reorder options
export async function reorderProductOptions(productId: string, optionIds: string[]) {
  const supabase = createClient()
  
  // Update sort_order for each option
  const updates = optionIds.map((id, index) => ({
    id,
    sort_order: index
  }))
  
  for (const update of updates) {
    await supabase
      .from('product_options')
      .update({ sort_order: update.sort_order })
      .eq('id', update.id)
  }
}

// Duplicate option
export async function duplicateProductOption(id: string) {
  const supabase = createClient()
  
  // Get original option
  const original = await getProductOption(id)
  
  // Create duplicate with modified name
  const { id: _, created_at, updated_at, ...duplicateData } = original
  
  return createProductOption({
    ...duplicateData,
    option_name: `${original.option_name} (Copy)`,
    option_code: `${original.option_code}-COPY`
  })
}
