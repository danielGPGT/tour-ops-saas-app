/**
 * Contract types matching the database schema
 * Based on regenerated types from Supabase database
 */

// Contract status enum from database
export type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled'

// Contract type enum
export type ContractType = 'net_rate' | 'commissionable' | 'allocation' | 'on_request' | string

/**
 * Main Contract interface matching database schema
 */
export interface Contract {
  // Core fields
  id: string
  organization_id: string
  supplier_id: string | null
  
  // Event linkage
  event_id: string | null
  
  // Contract basics
  contract_number: string
  contract_name: string | null
  contract_type: string | null
  
  // Validity dates
  valid_from: string
  valid_to: string
  
  // Financial
  currency: string | null
  total_cost: number | null
  commission_rate: number | null
  
  // Terms (TEXT fields)
  payment_terms: string | null
  cancellation_policy: string | null
  terms_and_conditions: string | null
  
  // Documents
  contract_files: any[] | null
  
  // Notes
  notes: string | null
  
  // Status
  status: ContractStatus | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

/**
 * Contract allocation type
 */
export type AllocationType = 'allotment' | 'batch' | 'free_sell' | 'on_request'

/**
 * Contract allocation matching database schema
 */
export interface ContractAllocation {
  // Core fields
  id: string
  organization_id: string
  contract_id: string
  product_id: string
  
  // Allocation details
  allocation_name: string | null
  allocation_type: string // Will be AllocationType in practice
  
  // Quantity
  total_quantity: number | null
  
  // Dates
  valid_from: string
  valid_to: string
  
  // Pricing
  total_cost: number | null
  cost_per_unit: number | null
  currency: string | null
  
  // Release days
  release_days: number | null
  
  // Notes
  notes: string | null
  
  // Status
  is_active: boolean | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
}

/**
 * Allocation inventory matching database schema
 */
export interface AllocationInventory {
  id: string
  contract_allocation_id: string // Fixed: was allocation_id
  product_option_id: string
  
  // Quantity tracking
  total_quantity: number
  available_quantity: number
  sold_quantity: number | null
  
  // Cost
  batch_cost_per_unit: number | null
  currency: string | null
  
  // Flags
  is_virtual_capacity: boolean | null
  minimum_viable_quantity: number | null
  
  // Notes
  notes: string | null
  
  // Status
  is_active: boolean | null
  
  // Audit
  created_at: string | null
  updated_at: string | null
}

/**
 * Supplier rate
 */
export interface SupplierRate {
  id: string
  contract_id: string
  product_id: string
  product_option_id: string
  rate_name: string
  valid_from: string
  valid_to: string
  rate_basis: 'per_night' | 'per_person' | 'per_unit'
  currency: string
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Form data for creating/updating a contract
 */
export interface ContractFormData {
  supplier_id: string | null
  event_id?: string | null
  contract_name?: string | null
  contract_type?: string | null
  valid_from: string
  valid_to: string
  currency?: string | null
  total_cost?: number | null
  commission_rate?: number | null
  payment_terms?: string | null
  cancellation_policy?: string | null
  terms_and_conditions?: string | null
  contract_files?: any[] | null
  notes?: string | null
  status?: ContractStatus | null
}

/**
 * Form data for creating/updating an allocation
 */
export interface ContractAllocationFormData {
  product_id: string
  allocation_name?: string | null
  allocation_type: AllocationType
  total_quantity?: number | null
  valid_from: string
  valid_to: string
  total_cost?: number | null
  cost_per_unit?: number | null
  currency?: string | null
  release_days?: number | null
  notes?: string | null
}

/**
 * Statistics about contracts
 */
export interface ContractStats {
  total_contracts: number
  active_contracts: number
  expired_contracts: number
  draft_contracts: number
  total_allocations: number
  total_value: number
  currency: string
}

/**
 * Search and filter types
 */
export interface ContractFilters {
  status?: ContractStatus[]
  supplier_id?: string
  event_id?: string
  date_from?: string
  date_to?: string
  currency?: string
  search?: string
}

export interface ContractSort {
  field: 'contract_name' | 'supplier_name' | 'valid_from' | 'valid_to' | 'status' | 'created_at'
  direction: 'asc' | 'desc'
}

// Legacy interfaces for backward compatibility (can be removed if not used)
export interface Supplier {
  id: string
  name: string
  code: string
  supplier_type: string
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  code: string
  product_type: string
  is_active: boolean
}

export interface ProductOption {
  id: string
  product_id: string
  option_name: string
  option_code: string
  is_active: boolean
}