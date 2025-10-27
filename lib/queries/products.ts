import { createClient } from '@/lib/supabase/client'
import type { Product, ProductType, ProductOption, SellingRate, ProductFilters, ProductSort } from '@/lib/types/product'

// Get all products for an organization with pagination
export async function getProducts(
  organizationId: string, 
  filters?: ProductFilters, 
  sort?: ProductSort,
  page: number = 1,
  pageSize: number = 100
) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(*),
      event:events(event_name, event_code)
    `)
    .eq('organization_id', organizationId)
  
  // Apply filters
  if (filters?.search) {
    // Include event search in general search
    query = query.or(
      `name.ilike.%${filters.search}%,` +
      `code.ilike.%${filters.search}%,` +
      `description.ilike.%${filters.search}%,` +
      `event.event_name.ilike.%${filters.search}%`
    )
  }
  
  if (filters?.event_id) {
    query = query.eq('event_id', filters.event_id)
  }
  
  if (filters?.product_type_id) {
    query = query.eq('product_type_id', filters.product_type_id)
  }
  
  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active)
  }
  
  if (filters?.location?.city) {
    query = query.eq('location->city', filters.location.city)
  }
  
  if (filters?.location?.country) {
    query = query.eq('location->country', filters.location.country)
  }
  
  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }
  
  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('name')
  }
  
  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) throw error
  
  // Get total count for pagination
  let countQuery = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  
  if (filters?.search) {
    countQuery = countQuery.or(
      `name.ilike.%${filters.search}%,` +
      `code.ilike.%${filters.search}%,` +
      `description.ilike.%${filters.search}%,` +
      `event.event_name.ilike.%${filters.search}%`
    )
  }
  
  if (filters?.event_id) {
    countQuery = countQuery.eq('event_id', filters.event_id)
  }
  
  if (filters?.product_type_id) {
    countQuery = countQuery.eq('product_type_id', filters.product_type_id)
  }
  
  if (filters?.is_active !== undefined) {
    countQuery = countQuery.eq('is_active', filters.is_active)
  }
  
  const { count: totalCount } = await countQuery
  
  return {
    data: data as Product[],
    totalCount: totalCount || 0,
    page,
    pageSize,
    totalPages: Math.ceil((totalCount || 0) / pageSize)
  }
}

// Get single product by ID
export async function getProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Product
}

// Create new product
export async function createProduct(product: Partial<Product>) {
  console.log('createProduct called with:', product)
  const supabase = createClient()
  
  const insertData = {
    ...product,
    media: [], // Start with empty media - will be uploaded separately
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  console.log('Inserting product with data:', insertData)
  
  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single()
  
  console.log('Supabase response:', { data, error })
  
  if (error) {
    console.error('Supabase error:', error)
    throw error
  }
  
  console.log('Product created successfully:', data)
  return data as Product
}

// Update product
export async function updateProduct(id: string, updates: Partial<Product>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      product_type:product_types(*)
    `)
    .single()
  
  if (error) throw error
  return data as Product
}

// Delete product (soft delete)
export async function deleteProduct(id: string) {
  let supabase
  try {
    supabase = createClient()
    console.log('Supabase client created successfully for delete')
  } catch (error) {
    console.error('Error creating Supabase client for delete:', error)
    throw new Error('Failed to create Supabase client for delete')
  }
  
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

// Get product types
export async function getProductTypes() {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_types')
    .select('*')
    .eq('is_active', true)
    .order('type_name')
  
  if (error) throw error
  return data as ProductType[]
}

// Create product type
export async function createProductType(productType: Partial<ProductType>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_types')
    .insert(productType)
    .select()
    .single()
  
  if (error) throw error
  return data as ProductType
}

// Get product options for a product
export async function getProductOptions(productId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_options')
    .select('*')
    .eq('product_id', productId)
    .order('created_at')
  
  if (error) throw error
  return data as ProductOption[]
}

// Create product option
export async function createProductOption(option: Partial<ProductOption>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_options')
    .insert(option)
    .select()
    .single()
  
  if (error) throw error
  return data as ProductOption
}

// Update product option
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

// Delete product option
export async function deleteProductOption(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('product_options')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

// Get selling rates for a product
export async function getSellingRates(productId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('selling_rates')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('priority')
  
  if (error) throw error
  return data as SellingRate[]
}

// Create selling rate
export async function createSellingRate(rate: Partial<SellingRate>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('selling_rates')
    .insert(rate)
    .select()
    .single()
  
  if (error) throw error
  return data as SellingRate
}

// Update selling rate
export async function updateSellingRate(id: string, updates: Partial<SellingRate>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('selling_rates')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as SellingRate
}

// Delete selling rate
export async function deleteSellingRate(id: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('selling_rates')
    .update({ is_active: false })
    .eq('id', id)
  
  if (error) throw error
}

// Get product statistics
export async function getProductStats(organizationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('is_active, product_type_id, product_type:product_types(type_name)')
    .eq('organization_id', organizationId)
  
  if (error) throw error
  
  const stats = {
    totalCount: data.length,
    activeCount: data.filter(p => p.is_active).length,
    inactiveCount: data.filter(p => !p.is_active).length,
    byType: data.reduce((acc, product) => {
      const typeName = product.product_type?.type_name || 'Unknown'
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  return stats
}