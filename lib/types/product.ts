export interface Product {
  id: string
  organization_id: string
  product_type_id: string
  name: string
  code: string
  description?: string
  location: Location
  attributes: any  // Type-specific attributes
  tags: string[]
  media: Array<{
    url: string
    alt: string
    is_primary: boolean
  }>
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  product_type?: ProductType
}

export type ProductTypeCode = 'accommodation' | 'event' | 'activity' | 'transfer' | 'package' | 'tickets & passes'
export type ProductCategory = 'accommodation' | 'activity' | 'transport'

export interface ProductType {
  id: string
  type_name: ProductTypeCode
  type_code: string
  type_category: ProductCategory
  attributes_schema: any
  is_active: boolean
}

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  description?: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration?: string
  attributes: any  // Type-specific attributes
  sort_order: number
  is_active: boolean
}

export interface Location {
  city: string
  country: string
  lat?: number
  lng?: number
  address?: string
}

// Type-specific attributes
export interface HotelAttributes {
  star_rating: number
  check_in_time: string
  check_out_time: string
  amenities: string[]
  property_type: string  // 'hotel', 'resort', 'apartment'
  chain?: string
}

export interface EventTicketAttributes {
  event_name: string
  event_date: string
  venue_name: string
  venue_capacity: number
  event_type: string  // 'sports', 'concert', 'exhibition'
  gates_open_time: string
  event_start_time: string
}

export interface TourAttributes {
  duration_hours: number
  duration_days: number
  meeting_point: string
  meeting_time: string
  end_point: string
  tour_type: string  // 'group', 'private', 'self_guided'
  inclusions: string[]
  exclusions: string[]
  max_group_size: number
}

export interface TransferAttributes {
  vehicle_type: string  // 'sedan', 'suv', 'van', 'bus'
  max_passengers: number
  max_luggage: number
  from_location: string
  to_location: string
  distance_km: number
  duration_minutes: number
  transfer_type: string  // 'airport', 'hotel', 'point_to_point'
}

export type RateBasis = 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'

export interface SellingRate {
  id: string
  organization_id: string
  product_id: string
  product_option_id: string
  rate_name: string
  rate_code: string
  valid_from: string
  valid_to: string
  rate_basis: RateBasis
  currency: string
  customer_type: 'b2c' | 'b2b_agent' | 'b2b_corporate'
  dow_mask: string[]
  min_nights?: number
  max_nights?: number
  min_pax?: number
  max_pax?: number
  priority: number
  is_active: boolean
}

// Form data types
export interface ProductFormData {
  name: string
  code: string
  product_type_id: string
  description?: string
  location: Location
  attributes: any  // Type-specific attributes
  tags: string[]
  media: Array<{
    url: string
    alt: string
    is_primary: boolean
  }>
  is_active: boolean
}

export interface ProductOptionFormData {
  option_name: string
  option_code: string
  description?: string
  standard_occupancy: number
  max_occupancy: number
  bed_configuration?: string
  attributes: any  // Type-specific attributes
  sort_order: number
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