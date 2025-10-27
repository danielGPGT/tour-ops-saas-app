/**
 * Product types matching the database schema
 * Based on regenerated types from Supabase database
 */

/**
 * Location structure (JSONB in database)
 */
export interface Location {
  city: string
  country: string
  lat?: number
  lng?: number
  address?: string
}

/**
 * Product type codes
 */
export type ProductTypeCode = 'accommodation' | 'event_ticket' | 'flight' | 'train' | 'transfer' | 'experience' | 'meal'

/**
 * Main Product interface matching database schema
 */
export interface Product {
  // Core fields
  id: string
  organization_id: string
  product_type_id: string
  // NOTE: No supplier_id - suppliers linked via contracts, not directly to products
  // This allows products to have multiple suppliers through different contracts
  
  // Basic info
  name: string
  code: string
  description: string | null
  
  // Location (JSONB)
  location: Location | Record<string, any> | null
  venue_name: string | null
  
  // Media & Tags (stored in attributes JSONB or as separate fields if added to schema)
  media?: Array<{
    url: string
    alt?: string
    is_primary?: boolean
  }>
  tags?: string[]
  
  // Details (JSONB for flexible attributes)
  attributes: Record<string, any> | null
  
  // Event linkage (optional)
  event_id: string | null
  
  // Status
  is_active: boolean | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

/**
 * Product Type interface
 */
export interface ProductType {
  id: string
  type_code: string
  type_name: string
  description: string | null
  icon: string | null
  is_active: boolean | null
}

/**
 * Product Option interface matching database schema
 * 
 * NOTE: Pricing is NOT stored in product_options. Use supplier_rates and selling_rates instead.
 * This enables seasonal pricing, multiple suppliers, audit trail, etc.
 */
export interface ProductOption {
  // Core fields
  id: string
  product_id: string
  
  // Option details
  option_name: string
  option_code: string
  description: string | null
  
  // NO PRICING HERE! ✅
  // Pricing is managed through supplier_rates (what supplier charges) and selling_rates (what you charge)
  // This enables:
  // - Seasonal pricing (different rates for different dates)
  // - Multiple suppliers for same product
  // - Audit trail (track which rate was used at booking)
  // - Occupancy-based pricing
  
  // Details (JSONB for flexible attributes)
  attributes: Record<string, any> | null
  
  // Images (stored in attributes.images)
  images?: Array<{
    url: string
    alt?: string
    is_primary?: boolean
  }>
  
  // Status
  is_active: boolean | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
}

/**
 * Selling Rate interface
 */
export interface SellingRate {
  id: string
  organization_id: string
  product_id: string
  product_option_id: string | null
  rate_name: string | null
  rate_basis: string
  valid_from: string
  valid_to: string
  base_price: number
  currency: string | null
  markup_type: string | null
  markup_amount: number | null
  pricing_details: Record<string, any> | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Form data for creating/updating a product
 */
export interface ProductFormData {
  name: string
  code: string
  product_type_id: string
  supplier_id?: string | null
  description?: string | null
  location?: Location | null
  venue_name?: string | null
  attributes?: Record<string, any> | null
  event_id?: string | null
  is_active?: boolean | null
}

/**
 * Form data for creating/updating a product option
 */
export interface ProductOptionFormData {
  option_name: string
  option_code: string
  description?: string | null
  base_price?: number | null
  base_cost?: number | null
  currency?: string | null
  attributes?: Record<string, any> | null
  is_active?: boolean | null
}

/**
 * Filter and sort types
 */
export interface ProductFilters {
  search?: string
  product_type_id?: string
  supplier_id?: string
  event_id?: string
  is_active?: boolean
  location?: {
    city?: string
    country?: string
  }
}

export interface ProductSort {
  field: 'name' | 'created_at' | 'updated_at'
  direction: 'asc' | 'desc'
}

/**
 * Rate basis types
 */
export type RateBasis = 'per_night' | 'per_person' | 'per_unit' | string