export interface AllocationInventory {
  id: string
  contract_allocation_id: string
  product_option_id: string
  
  // Quantity
  total_quantity: number
  
  // Flexible config
  flexible_configuration: boolean
  alternate_option_ids: string[]
  
  // Booking limits
  min_quantity_per_booking: number
  max_quantity_per_booking: number
  
  // Status
  is_active: boolean
  notes?: string
  
  created_at: string
  updated_at: string
  
  // Relations
  product_option?: {
    id: string
    option_name: string
    option_code: string
    standard_occupancy: number
    max_occupancy: number
  }
  
  // Alternate options (for flexible configuration)
  alternate_options?: {
    id: string
    option_name: string
    option_code: string
  }[]
}

export interface InventoryWithStats extends AllocationInventory {
  availability_generated: boolean
  total_available: number
  total_booked: number
  utilization_percentage: number
}