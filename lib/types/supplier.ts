export interface Supplier {
  id: string
  organization_id: string
  name: string
  code: string
  supplier_type: string | null
  contact_info: ContactInfo | null
  payment_terms: string | null
  commission_rate: number | null
  rating: number | null
  total_bookings: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
}

export interface PaymentTerms {
  payment_method: string
  credit_days: number
  terms?: string
}

export interface SupplierFormData {
  name: string
  code: string
  supplier_type?: string
  contact_info?: {
    email: string
    phone: string
    address: string
    city: string
    state: string
    country: string
    postal_code: string
  }
  payment_terms?: string
  commission_rate?: number
  rating?: number
  is_active: boolean
}

export interface SupplierStats {
  total_suppliers: number
  active_contracts: number
  total_bookings: number
  average_rating: number
}
