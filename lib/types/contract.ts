export interface Contract {
  id: string
  organization_id: string
  supplier_id: string
  contract_number: string
  contract_name?: string
  
  // Contract Type (NEW)
  contract_type: 'net_rate' | 'commissionable' | 'allocation' | 'on_request'
  
  // Dates
  valid_from: string
  valid_to: string
  signed_date?: string
  
  // Financial
  currency: string
  commission_rate?: number
  commission_type: 'percentage' | 'fixed_amount' | 'tiered' | 'none'
  
  // Operational
  booking_cutoff_days?: number
  
  // Documents
  signed_document_url?: string
  contract_files?: any[]
  
  // Terms
  terms_and_conditions?: string
  special_terms?: string
  notes?: string
  
  // Status
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended'
  
  // Audit
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
  
  // Relations
  supplier?: Supplier
  allocations?: ContractAllocation[]
  rates?: SupplierRate[]
  payment_schedules?: ContractPaymentSchedule[]
  cancellation_policies?: ContractCancellationPolicy[]
  commission_tiers?: ContractCommissionTier[]
}

export interface Supplier {
  id: string
  name: string
  code: string
  supplier_type: string
  contact_info: ContactInfo
  is_active: boolean
}

export interface ContactInfo {
  primary_contact: string
  email: string
  phone: string
  address: Address
  website?: string
}

export interface Address {
  street?: string
  city: string
  country: string
  postal_code?: string
}

export interface PaymentTerms {
  payment_method: string
  credit_days: number
  terms: string
}

export interface ContractTerms {
  cancellation_policy: string
  force_majeure: string
  liability: string
  insurance_requirements: string
  special_conditions: string
}

export interface ContractAttachment {
  id: string
  filename: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_at: string
}

export interface ContractAllocation {
  id: string
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
  
  // Relations
  product?: Product
  inventory?: AllocationInventory[]
}

export interface Product {
  id: string
  name: string
  code: string
  product_type: string
  location: Location
  is_active: boolean
}

export interface Location {
  address: string
  city: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface AllocationInventory {
  id: string
  allocation_id: string
  product_option_id: string
  total_quantity: number
  flexible_configuration: boolean
  alternate_option_ids: string[]
  created_at: string
  updated_at: string
  
  // Relations
  product_option?: ProductOption
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
}

export interface SupplierRate {
  id: string
  contract_id: string
  product_id: string
  product_option_id: string
  rate_name: string
  valid_from: string
  valid_to: string
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations
  product?: Product
  product_option?: ProductOption
  occupancy_costs?: RateOccupancyCost[]
}

export interface RateOccupancyCost {
  id: string
  supplier_rate_id: string
  occupancy: number
  base_cost: number
  adult_cost: number
  child_cost: number
  board_basis: string
  currency: string
}

// New related types for the updated schema
export interface ContractPaymentSchedule {
  id: string
  contract_id: string
  payment_stage: string
  payment_type: 'percentage' | 'fixed_amount'
  percentage?: number
  fixed_amount?: number
  due_type: 'days_before_arrival' | 'days_after_booking' | 'fixed_date'
  days_before?: number
  days_after?: number
  due_date?: string
  description?: string
  is_mandatory: boolean
  sort_order: number
  created_at: string
}

export interface ContractCancellationPolicy {
  id: string
  contract_id: string
  days_before_from?: number
  days_before_to?: number
  penalty_type: 'none' | 'percentage' | 'fixed_amount' | 'forfeit_deposit' | 'forfeit_all'
  penalty_percentage?: number
  penalty_amount?: number
  description?: string
  applies_to: 'all' | 'deposit_only' | 'balance_only'
  sort_order: number
  created_at: string
}

export interface ContractCommissionTier {
  id: string
  contract_id: string
  revenue_from: number
  revenue_to?: number
  commission_rate: number
  sort_order: number
  created_at: string
}

export interface ContractDeadline {
  id: string
  organization_id: string
  ref_type: 'contract' | 'allocation' | 'booking'
  ref_id: string
  deadline_type: string
  deadline_date?: string
  days_before_arrival?: number
  calculate_from?: 'arrival' | 'departure' | 'booking_date'
  penalty_type?: 'none' | 'percentage' | 'fixed_amount' | 'forfeit_deposit' | 'forfeit_all'
  penalty_value?: number
  penalty_description?: string
  status: 'pending' | 'met' | 'missed' | 'waived' | 'not_applicable'
  actioned_at?: string
  actioned_by?: string
  reminder_sent_at?: string
  notification_days_before: number
  notes?: string
  created_at: string
  updated_at: string
}

// Form data types
export interface ContractFormData {
  supplier_id: string
  contract_name?: string
  contract_type: 'net_rate' | 'commissionable' | 'allocation' | 'on_request'
  valid_from: string
  valid_to: string
  signed_date?: string
  currency: string
  commission_rate?: number
  commission_type: 'percentage' | 'fixed_amount' | 'tiered' | 'none'
  booking_cutoff_days?: number
  signed_document_url?: string
  terms_and_conditions?: string
  special_terms?: string
  notes?: string
  status: 'draft' | 'active' | 'expired' | 'terminated' | 'suspended'
}

export interface ContractAllocationFormData {
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
}

export interface SupplierRateFormData {
  product_id: string
  product_option_id: string
  rate_name: string
  valid_from: string
  valid_to: string
  rate_basis: 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'
  currency: string
  priority: number
  occupancy_costs: RateOccupancyCostFormData[]
}

export interface RateOccupancyCostFormData {
  occupancy: number
  base_cost: number
  adult_cost: number
  child_cost: number
  board_basis: string
  currency: string
}

// Status and filter types
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'suspended'
export type ContractType = 'net_rate' | 'commissionable' | 'allocation' | 'on_request'
export type AllocationType = 'allotment' | 'free_sell' | 'on_request'
export type RateBasis = 'per_room_per_night' | 'per_ticket' | 'per_person' | 'per_booking'

// Statistics types
export interface ContractStats {
  total_contracts: number
  active_contracts: number
  expired_contracts: number
  draft_contracts: number
  terminated_contracts: number
  suspended_contracts: number
  total_allocations: number
  total_rates: number
  total_value: number
  currency: string
}

// Search and filter types
export interface ContractFilters {
  status?: ContractStatus[]
  supplier_id?: string
  date_from?: string
  date_to?: string
  currency?: string
  search?: string
}

export interface ContractSort {
  field: 'contract_name' | 'supplier_name' | 'valid_from' | 'valid_to' | 'status' | 'created_at'
  direction: 'asc' | 'desc'
}