export interface ContractAllocation {
  id: string
  organization_id: string
  contract_id: string
  product_id: string
  allocation_name: string
  allocation_type: 'allotment' | 'free_sell' | 'on_request'
  valid_from: string
  valid_to: string
  min_nights?: number
  max_nights?: number
  release_days: number
  dow_arrival: string[]
  allow_overbooking: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AllocationInventory {
  id: string
  contract_allocation_id: string
  product_option_id: string
  total_quantity: number
  flexible_configuration: boolean
  alternate_option_ids: string[]
  created_at: string
  updated_at: string
}

export interface Availability {
  id: string
  allocation_inventory_id: string
  availability_date: string
  total_available: number
  booked: number
  provisional: number
  held: number
  available: number
  is_closed: boolean
  is_released: boolean
  created_at: string
  updated_at: string
}

export interface AvailabilityFormData {
  allocation_inventory_id: string
  availability_date: string
  total_available: number
  is_closed: boolean
}

export interface BulkAvailabilityUpdate {
  allocation_inventory_id: string
  dates: string[]
  total_available: number
  is_closed: boolean
}
