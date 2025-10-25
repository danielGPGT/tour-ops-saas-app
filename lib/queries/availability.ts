import { createClient } from '@/lib/supabase/client'
import type { Availability, AvailabilityStats } from '@/lib/types/availability'

// Generate availability (calls RPC function)
export async function generateAvailability(
  inventoryId: string,
  dateFrom: string,
  dateTo: string,
  totalAvailable: number
) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('generate_availability', {
    p_allocation_inventory_id: inventoryId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_total_available: totalAvailable
  })
  
  if (error) throw error
  return data
}

// Get availability for inventory
export async function getAvailability(
  inventoryId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('allocation_inventory_id', inventoryId)
    .gte('availability_date', dateFrom)
    .lte('availability_date', dateTo)
    .order('availability_date')
  
  if (error) throw error
  return data as Availability[]
}

// Get availability for entire allocation (all options)
export async function getAllocationAvailability(
  allocationId: string,
  dateFrom: string,
  dateTo: string
) {
  const supabase = createClient()
  
  // First get all inventory IDs for this allocation
  const { data: inventory } = await supabase
    .from('allocation_inventory')
    .select('id, product_option_id, product_option:product_options(option_name, option_code)')
    .eq('contract_allocation_id', allocationId)
  
  if (!inventory) return []
  
  // Get availability for all inventory items
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .in('allocation_inventory_id', inventory.map(i => i.id))
    .gte('availability_date', dateFrom)
    .lte('availability_date', dateTo)
    .order('availability_date')
  
  if (error) throw error
  
  // Attach option info to each availability record
  return (data as Availability[]).map(avail => ({
    ...avail,
    option: inventory.find(i => i.id === avail.allocation_inventory_id)?.product_option
  }))
}

// Update single availability
export async function updateAvailability(
  id: string,
  updates: Partial<Availability>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as Availability
}

// Bulk update availability
export async function bulkUpdateAvailability(
  ids: string[],
  updates: Partial<Availability>
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('availability')
    .update(updates)
    .in('id', ids)
    .select()
  
  if (error) throw error
  return data as Availability[]
}

// Check availability (with lock for booking)
export async function checkAvailability(
  inventoryId: string,
  dateFrom: string,
  dateTo: string,
  quantity: number
) {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('check_availability_with_lock', {
    p_allocation_inventory_id: inventoryId,
    p_date_from: dateFrom,
    p_date_to: dateTo,
    p_quantity: quantity
  })
  
  if (error) throw error
  return data as boolean
}

// Get availability stats
export async function getAvailabilityStats(
  allocationId: string,
  dateFrom: string,
  dateTo: string
): Promise<AvailabilityStats> {
  const availability = await getAllocationAvailability(allocationId, dateFrom, dateTo)
  
  const stats: AvailabilityStats = {
    total_inventory: 0,
    total_available: 0,
    total_booked: 0,
    utilization_percentage: 0,
    sold_out_days: 0,
    low_availability_days: 0,
    closed_days: 0
  }
  
  availability.forEach(avail => {
    stats.total_inventory += avail.total_available
    stats.total_available += avail.available
    stats.total_booked += avail.booked
    
    if (avail.available === 0 && !avail.is_closed) {
      stats.sold_out_days++
    }
    if (avail.available > 0 && avail.available <= avail.total_available * 0.1) {
      stats.low_availability_days++
    }
    if (avail.is_closed) {
      stats.closed_days++
    }
  })
  
  if (stats.total_inventory > 0) {
    stats.utilization_percentage = (stats.total_booked / stats.total_inventory) * 100
  }
  
  return stats
}

// Get availability calendar data (grouped by date)
export async function getAvailabilityCalendar(
  allocationId: string,
  dateFrom: string,
  dateTo: string
) {
  const availability = await getAllocationAvailability(allocationId, dateFrom, dateTo)
  
  // Group by date
  const calendarData = new Map<string, any>()
  
  availability.forEach(avail => {
    const date = avail.availability_date
    if (!calendarData.has(date)) {
      calendarData.set(date, {
        date,
        total_available: 0,
        available: 0,
        booked: 0,
        provisional: 0,
        utilization_percentage: 0,
        is_closed: false,
        is_released: false,
        is_weekend: false,
        is_blackout: false,
        options: []
      })
    }
    
    const dayData = calendarData.get(date)!
    dayData.total_available += avail.total_available
    dayData.available += avail.available
    dayData.booked += avail.booked
    dayData.provisional += avail.provisional
    dayData.is_closed = dayData.is_closed || avail.is_closed
    dayData.is_released = dayData.is_released || avail.is_released
    dayData.options.push({
      option_name: avail.option?.option_name,
      option_code: avail.option?.option_code,
      total_available: avail.total_available,
      available: avail.available,
      booked: avail.booked,
      is_closed: avail.is_closed
    })
  })
  
  // Calculate utilization percentage for each day
  calendarData.forEach(dayData => {
    if (dayData.total_available > 0) {
      dayData.utilization_percentage = (dayData.booked / dayData.total_available) * 100
    }
  })
  
  return Array.from(calendarData.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}
