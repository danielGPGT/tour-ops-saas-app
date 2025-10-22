export interface Product {
  id: string
  organization_id: string
  product_type_id: string
  name: string
  code: string
  description?: string
  location: Location
  attributes: ProductAttributes
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  product_type?: ProductType
  product_options?: ProductOption[]
  selling_rates?: SellingRate[]
}

export interface ProductType {
  id: string
  organization_id: string
  name: string
  code: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Location {
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  coordinates?: {
    lat: number
    lng: number
  }
  venue_name?: string
  venue_address?: string
}

export interface ProductAttributes {
  // Hotel specific
  star_rating?: number
  check_in_time?: string
  check_out_time?: string
  amenities?: string[]
  
  // Event specific
  event_date?: string
  venue?: string
  gates_open_time?: string
  event_type?: string
  
  // Tour specific
  duration_hours?: number
  meeting_point?: string
  inclusions?: string[]
  exclusions?: string[]
  difficulty_level?: string
  
  // Transfer specific
  vehicle_type?: string
  route?: string
  luggage_allowance?: string
  pickup_locations?: string[]
  
  // Common
  tags?: string[]
  seo_title?: string
  seo_description?: string
  slug?: string
}

export interface SellingRate {
  id: string
  organization_id: string
  product_id: string
  product_option_id?: string
  rate_name: string
  valid_from: string
  valid_to: string
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: string
  markup_type: 'fixed_amount' | 'percentage'
  markup_value: number
  customer_type: 'B2C' | 'B2B_agent' | 'B2B_corporate'
  min_pax?: number
  max_pax?: number
  dow_mask?: string // Days of week mask
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form data types
export interface ProductFormData {
  name: string
  code: string
  product_type_id: string
  description?: string
  location: Location
  attributes: ProductAttributes
  is_active: boolean
}

export interface ProductOptionFormData {
  option_name: string
  option_code: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration?: string
  is_active: boolean
}

export interface SellingRateFormData {
  rate_name: string
  valid_from: string
  valid_to: string
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: string
  markup_type: 'fixed_amount' | 'percentage'
  markup_value: number
  customer_type: 'B2C' | 'B2B_agent' | 'B2B_corporate'
  min_pax?: number
  max_pax?: number
  dow_mask?: string
  priority: number
  is_active: boolean
}

// Filter and sort types
export interface ProductFilters {
  search?: string
  product_type_id?: string
  is_active?: boolean
  location?: {
    city?: string
    country?: string
  }
  tags?: string[]
}

export interface ProductSort {
  field: 'name' | 'created_at' | 'updated_at'
  direction: 'asc' | 'desc'
}