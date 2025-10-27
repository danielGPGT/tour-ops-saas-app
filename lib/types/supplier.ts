/**
 * Supplier type matching the database schema
 * Based on regenerated types from Supabase database
 */
export interface Supplier {
  // Core fields
  id: string
  organization_id: string
  name: string
  code: string
  supplier_type: string | null
  
  // Contact information (separate fields)
  email: string | null
  phone: string | null
  contact_info: Record<string, any> | null // JSONB for flexible contact data
  
  // Address (separate fields)
  address_line1: string | null
  city: string | null
  country: string | null
  
  // Settings
  default_currency: string | null
  is_active: boolean | null
  notes: string | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
}

/**
 * Contact information structure for JSONB contact_info field
 */
export interface ContactInfo {
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  [key: string]: any // Allow extra fields for flexibility
}

/**
 * Form data for creating/updating a supplier
 */
export interface SupplierFormData {
  // Required fields
  name: string
  code: string
  
  // Optional fields
  supplier_type?: string | null
  email?: string | null
  phone?: string | null
  address_line1?: string | null
  city?: string | null
  country?: string | null
  default_currency?: string | null
  notes?: string | null
  is_active?: boolean
}

/**
 * Statistics about suppliers
 */
export interface SupplierStats {
  total_suppliers: number
  active_suppliers: number
  total_contracts: number
  active_contracts: number
}
