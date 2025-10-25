export type ProductType = 'accommodation' | 'event' | 'transfer' | 'activity' | 'extra'

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  description?: string
  
  // Occupancy
  standard_occupancy: number
  max_occupancy: number
  
  // Accommodation-specific
  bed_type?: string
  bed_quantity?: string
  additional_bed?: string
  bed_configuration?: string
  view_type?: string
  
  // Event-specific
  ticket_type?: string
  section?: string
  seat_details?: string
  access_level?: string
  
  // Transfer-specific
  vehicle_type?: string
  max_passengers?: number
  max_luggage?: number
  vehicle_features?: string[]
  
  // Activity-specific
  experience_type?: string
  min_group_size?: number
  max_group_size?: number
  duration_hours?: number
  difficulty_level?: string
  
  // Extra-specific
  extra_type?: string
  unit_type?: string
  is_mandatory?: boolean
  
  // Common
  base_price_hint?: number
  currency?: string
  attributes?: any
  images?: Array<{
    url: string
    alt: string
    is_primary: boolean
  }>
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Accommodation-specific form data
export interface AccommodationOptionData {
  option_name: string
  option_code: string
  description?: string
  bed_configuration: string
  room_size_sqm?: number
  view_type?: string
  floor_range?: string
  standard_occupancy: number
  max_occupancy: number
  amenities?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

// Event-specific form data
export interface EventOptionData {
  option_name: string
  option_code: string
  description?: string
  ticket_type: string
  section?: string
  seat_details?: string
  access_level: string
  includes?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

// Transfer-specific form data
export interface TransferOptionData {
  option_name: string
  option_code: string
  description?: string
  vehicle_type: string
  max_passengers: number
  vehicle_features?: string[]
  vehicle_class?: string
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

// Activity-specific form data
export interface ActivityOptionData {
  option_name: string
  option_code: string
  description?: string
  experience_type: string
  min_group_size?: number
  max_group_size?: number
  duration_hours: number
  difficulty_level: string
  standard_occupancy: number
  max_occupancy: number
  includes?: string[]
  base_price_hint?: number
  currency?: string
  is_active: boolean
}

// Extra-specific form data
export interface ExtraOptionData {
  option_name: string
  option_code: string
  description?: string
  extra_type: string
  unit_type: string
  is_mandatory?: boolean
  coverage_details?: string
  validity_days?: number
  base_price_hint?: number
  currency?: string
  is_active: boolean
}
