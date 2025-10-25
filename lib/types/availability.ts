export interface Availability {
  id: string
  allocation_inventory_id: string
  availability_date: string
  
  // Inventory
  total_available: number
  booked: number
  provisional: number
  held: number
  available: number
  
  // Controls
  is_closed: boolean
  is_released: boolean
  
  notes?: string
  updated_at: string
}

export interface AvailabilityCalendarDay {
  date: string
  total_available: number
  available: number
  booked: number
  provisional: number
  utilization_percentage: number
  is_closed: boolean
  is_released: boolean
  is_weekend: boolean
  is_blackout: boolean
}

export interface AvailabilityStats {
  total_inventory: number
  total_available: number
  total_booked: number
  utilization_percentage: number
  sold_out_days: number
  low_availability_days: number
  closed_days: number
}
