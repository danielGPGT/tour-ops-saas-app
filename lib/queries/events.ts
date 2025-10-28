import { createClient } from '@/lib/supabase/client'

export interface EventFilters {
  date_range?: {
    start: string
    end: string
  }
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
  location?: string
  search?: string
}

export interface EventSort {
  field: 'name' | 'start_date' | 'end_date' | 'created_at'  
  direction: 'asc' | 'desc'
}

// ===== EVENTS QUERIES =====

export async function getEvents(
  organizationId: string, 
  filters?: EventFilters, 
  sort?: EventSort,
  page: number = 1,
  pageSize: number = 20
) {
  const supabase = createClient()
  
  let query = supabase
    .from('events')
    .select(`
      id,
      name,
      code,
      description,
      event_type,
      start_date,
      end_date,
      location,
      venue,
      status,
      metadata,
      organization_id,
      created_at,
      updated_at,
      _count_products:product_events(count),
      _count_contracts:contracts(count)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)

  // Apply filters
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,code.ilike.%${filters.search}%`)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.location) {
    query = query.ilike('location', `%${filters.location}%`)
  }

  if (filters?.date_range) {
    query = query
      .gte('start_date', filters.date_range.start)
      .lte('end_date', filters.date_range.end)
  }

  // Apply sorting
  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc' })
  } else {
    query = query.order('start_date', { ascending: true })
  }

  // Apply pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }

  return {
    data: data || [],
    count,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
    currentPage: page,
    pageSize
  }
}

export async function getEvent(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      name,
      code,
      description, 
      event_type,
      start_date,
      end_date,
      location,
      venue,
      status,
      metadata,
      organization_id,
      created_at,
      updated_at,
      product_events(
        id,
        product:products(
          id,
          name,
          code,
          product_type,
          status,
          _count_allocations:contract_allocations(count),
          _count_options:product_options(count)
        )
      ),
      contracts(
        id,
        contract_name,
        supplier:suppliers(name),
        total_value,
        status,
        valid_from,
        valid_to,
        _count_allocations:contract_allocations(count)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    throw error
  }

  return data
}

export async function createEvent(event: {
  organization_id: string
  name: string
  code?: string
  description?: string
  event_type: string
  start_date: string
  end_date: string
  location: string
  venue?: string
  status?: string
  metadata?: any
}) {
  const supabase = createClient()

  // Auto-generate code if not provided
  if (!event.code) {
    const baseCode = event.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 10)
    event.code = `${baseCode}-${new Date().getFullYear()}`
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      ...event,
      status: event.status || 'upcoming'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    throw error
  }

  return data
}

export async function updateEvent(id: string, updates: {
  name?: string
  code?: string
  description?: string
  event_type?: string
  start_date?: string
  end_date?: string
  location?: string
  venue?: string
  status?: string
  metadata?: any
}) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    throw error
  }

  return data
}

export async function deleteEvent(id: string) {
  const supabase = createClient()

  // Soft delete
  const { error } = await supabase
    .from('events')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error deleting event:', error)
    throw error
  }

  return true
}

// ===== EVENT-PRODUCT RELATIONSHIPS =====

export async function linkProductToEvent(eventId: string, productId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_events')
    .insert({
      event_id: eventId,
      product_id: productId
    })
    .select()
    .single()

  if (error) {
    console.error('Error linking product to event:', error)
    throw error
  }

  return data
}

export async function unlinkProductFromEvent(eventId: string, productId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('product_events')
    .delete()
    .eq('event_id', eventId)
    .eq('product_id', productId)

  if (error) {
    console.error('Error unlinking product from event:', error)
    throw error
  }

  return true
}

export async function getEventProducts(eventId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_events')
    .select(`
      id,
      product:products(
        id,
        name,
        code,
        product_type,
        status,
        attributes,
        contract_allocations(
          id,
          allocation_name,
          total_quantity,
          total_cost,
          currency,
          status,
          valid_from,
          valid_to,
          release_days
        ),
        product_options(
          id,
          option_name,
          code,
          status
        )
      )
    `)
    .eq('event_id', eventId)

  if (error) {
    console.error('Error fetching event products:', error)
    throw error
  }

  return data?.map(item => item.product) || []
}

export async function getProductEvents(productId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_events')
    .select(`
      id,
      event:events(
        id,
        name,
        code,
        start_date,
        end_date,
        location,
        status
      )
    `)
    .eq('product_id', productId)

  if (error) {
    console.error('Error fetching product events:', error)
    throw error
  }

  return data?.map(item => item.event) || []
}

// ===== EVENT ANALYTICS =====

export async function getEventAnalytics(eventId: string) {
  const supabase = createClient()

  // Get event summary data
  const { data: event } = await supabase
    .from('events')
    .select(`
      id,
      name,
      start_date,
      end_date,
      status
    `)
    .eq('id', eventId)
    .single()

  if (!event) return null

  // Get products and allocations for this event
  const { data: productData } = await supabase
    .from('product_events')
    .select(`
      product:products(
        id,
        name,
        product_type,
        contract_allocations(
          id,
          total_quantity,
          total_cost,
          currency,
          status,
          allocation_inventory(
            total_quantity,
            sold_quantity,
            available_quantity
          )
        )
      )
    `)
    .eq('event_id', eventId)

  const products = productData?.map(item => item.product) || []

  // Calculate totals
  let totalProducts = products.length
  let totalAllocations = 0
  let totalUnits = 0
  let totalSold = 0
  let totalAvailable = 0
  let totalCost = 0
  let currencies = new Set<string>()

  products.forEach(product => {
    if (product?.contract_allocations) {
      product.contract_allocations.forEach((allocation: any) => {
        if (allocation.status === 'active') {
          totalAllocations++
          totalUnits += allocation.total_quantity || 0
          totalCost += allocation.total_cost || 0
          if (allocation.currency) currencies.add(allocation.currency)

          // Sum inventory quantities
          if (allocation.allocation_inventory) {
            allocation.allocation_inventory.forEach((inv: any) => {
              totalSold += inv.sold_quantity || 0
              totalAvailable += inv.available_quantity || 0
            })
          }
        }
      })
    }
  })

  const utilizationRate = totalUnits > 0 ? (totalSold / totalUnits) * 100 : 0

  // Get product type breakdown
  const productTypeBreakdown = products.reduce((acc: any, product: any) => {
    const type = product?.product_type || 'unknown'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  return {
    event,
    summary: {
      total_products: totalProducts,
      total_allocations: totalAllocations,
      total_units: totalUnits,
      total_sold: totalSold,
      total_available: totalAvailable,
      total_cost: totalCost,
      primary_currency: Array.from(currencies)[0] || 'GBP',
      utilization_rate: utilizationRate
    },
    product_type_breakdown: productTypeBreakdown,
    products
  }
}

// ===== UPCOMING EVENTS =====

export async function getUpcomingEvents(organizationId: string, limit: number = 5) {
  const supabase = createClient()
  
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      name,
      code,
      start_date,
      end_date,
      location,
      status,
      _count_products:product_events(count)
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .gte('start_date', today)
    .order('start_date', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching upcoming events:', error)
    throw error
  }

  return data || []
}