export interface Customer {
  id: string
  organization_id: string
  customer_type: 'B2C' | 'B2B'
  title?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  company_name?: string
  company_registration?: string
  address: CustomerAddress
  preferences?: CustomerPreferences
  marketing_consent: boolean
  tags: string[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerAddress {
  street?: string
  city: string
  country: string
  postal_code?: string
}

export interface CustomerPreferences {
  preferred_contact_method: 'email' | 'phone' | 'sms'
  preferred_language: string
  dietary_requirements?: string
  special_requests?: string
}

export interface CustomerFormData {
  customer_type: 'B2C' | 'B2B'
  title?: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  date_of_birth?: string
  company_name?: string
  company_registration?: string
  address: CustomerAddress
  preferences?: CustomerPreferences
  marketing_consent: boolean
  tags: string[]
  notes?: string
}

export interface CustomerStats {
  total_customers: number
  b2c_customers: number
  b2b_customers: number
  active_customers: number
}
