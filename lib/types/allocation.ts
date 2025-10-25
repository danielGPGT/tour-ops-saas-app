export type AllocationType = 'hotel_allocation' | 'purchased_inventory' | 'on_request' | 'unlimited'
export type ReleaseType = 'days_before_arrival' | 'fixed_date'
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export interface ContractAllocation {
  id: string
  organization_id: string
  contract_id?: string // Optional for direct purchases
  supplier_id: string // Always required
  product_id: string
  allocation_name: string
  allocation_type: AllocationType
  
  // Purchase tracking (for purchased_inventory)
  purchase_date?: string
  purchase_reference?: string // Invoice number, PO number
  
  // Dates
  valid_from: string
  valid_to: string
  
  // Simple inventory tracking (for purchased_inventory)
  total_quantity?: number
  available_quantity?: number
  sold_quantity?: number
  
  // Cost tracking
  cost_per_unit?: number
  total_cost?: number
  currency?: string
  
  // Hotel-specific fields (nullable for other types)
  min_nights?: number
  max_nights?: number
  min_advance_booking?: number
  max_advance_booking?: number
  release_days?: number
  dow_arrival?: number[]
  dow_checkout?: number[]
  blackout_dates?: string[]
  
  // Overbooking (for hotel_allocation)
  allow_overbooking?: boolean
  overbooking_limit?: number
  
  // Terms (JSONB)
  terms?: any
  
  // Status
  is_active?: boolean
  notes?: string
  
  created_at: string
  updated_at: string
  
  // Relations
  contract?: {
    id: string
    contract_number: string
    contract_name: string
    supplier: {
      id: string
      name: string
      code: string
    }
  }
  supplier?: {
    id: string
    name: string
    code: string
  }
  product?: {
    id: string
    name: string
    code: string
    product_type: string
  }
}

export interface AllocationSummary {
  allocation: ContractAllocation
  total_inventory: number
  options_count: number
  availability_generated: boolean
  date_range_days: number
}
