import { z } from 'zod'

// Base schemas
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().optional()
})

export const contactInfoSchema = z.object({
  primary_contact: z.string().min(1, 'Primary contact is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: addressSchema,
  website: z.string().url('Invalid website URL').optional().or(z.literal(''))
})

export const paymentTermsSchema = z.object({
  payment_method: z.string().min(1, 'Payment method is required'),
  credit_days: z.number().min(0, 'Credit days must be 0 or greater').max(365, 'Credit days cannot exceed 365'),
  terms: z.string().optional()
})

export const contractTermsSchema = z.object({
  cancellation_policy: z.string().optional(),
  force_majeure: z.string().optional(),
  liability: z.string().optional(),
  insurance_requirements: z.string().optional(),
  special_conditions: z.string().optional()
})

// Main contract schema
export const contractSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier ID'),
  contract_name: z.string().min(2, 'Contract name must be at least 2 characters').max(100, 'Contract name cannot exceed 100 characters').optional(),
  contract_type: z.enum(['net_rate', 'commissionable', 'allocation', 'on_request'], {
    errorMap: () => ({ message: 'Contract type must be net_rate, commissionable, allocation, or on_request' })
  }),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  signed_date: z.string().optional(),
  currency: z.string().min(3, 'Currency code must be at least 3 characters').max(3, 'Currency code must be exactly 3 characters'),
  commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%').optional(),
  commission_type: z.enum(['percentage', 'fixed_amount', 'tiered', 'none'], {
    errorMap: () => ({ message: 'Commission type must be percentage, fixed_amount, tiered, or none' })
  }),
  booking_cutoff_days: z.number().min(1, 'Booking cutoff days must be at least 1').optional(),
  signed_document_url: z.string().url('Invalid document URL').optional(),
  terms_and_conditions: z.string().optional(),
  special_terms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'suspended'], {
    errorMap: () => ({ message: 'Status must be draft, active, expired, terminated, or suspended' })
  })
}).refine(
  (data) => {
    const fromDate = new Date(data.valid_from)
    const toDate = new Date(data.valid_to)
    return toDate > fromDate
  },
  {
    message: 'Valid to date must be after valid from date',
    path: ['valid_to']
  }
)

// Contract allocation schema
export const contractAllocationSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  allocation_name: z.string().min(2, 'Allocation name must be at least 2 characters').max(100, 'Allocation name cannot exceed 100 characters'),
  allocation_type: z.enum(['allotment', 'free_sell', 'on_request'], {
    errorMap: () => ({ message: 'Allocation type must be allotment, free_sell, or on_request' })
  }),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  min_nights: z.number().min(1, 'Minimum nights must be at least 1').optional(),
  max_nights: z.number().min(1, 'Maximum nights must be at least 1').optional(),
  release_days: z.number().min(0, 'Release days cannot be negative').max(365, 'Release days cannot exceed 365'),
  dow_arrival: z.array(z.string()).min(1, 'At least one day of week must be selected'),
  allow_overbooking: z.boolean().default(false)
}).refine(
  (data) => {
    const fromDate = new Date(data.valid_from)
    const toDate = new Date(data.valid_to)
    return toDate > fromDate
  },
  {
    message: 'Valid to date must be after valid from date',
    path: ['valid_to']
  }
).refine(
  (data) => {
    if (data.min_nights && data.max_nights) {
      return data.max_nights >= data.min_nights
    }
    return true
  },
  {
    message: 'Maximum nights must be greater than or equal to minimum nights',
    path: ['max_nights']
  }
)

// Supplier rate schema
export const rateOccupancyCostSchema = z.object({
  occupancy: z.number().min(1, 'Occupancy must be at least 1').max(10, 'Occupancy cannot exceed 10'),
  base_cost: z.number().min(0, 'Base cost cannot be negative'),
  adult_cost: z.number().min(0, 'Adult cost cannot be negative'),
  child_cost: z.number().min(0, 'Child cost cannot be negative'),
  board_basis: z.string().min(1, 'Board basis is required'),
  currency: z.string().min(3, 'Currency code must be at least 3 characters').max(3, 'Currency code must be exactly 3 characters')
})

export const supplierRateSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  product_option_id: z.string().uuid('Invalid product option ID'),
  rate_name: z.string().min(2, 'Rate name must be at least 2 characters').max(100, 'Rate name cannot exceed 100 characters'),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  rate_basis: z.enum(['per_room_per_night', 'per_ticket', 'per_person', 'per_booking'], {
    errorMap: () => ({ message: 'Rate basis must be per_room_per_night, per_ticket, per_person, or per_booking' })
  }),
  currency: z.string().min(3, 'Currency code must be at least 3 characters').max(3, 'Currency code must be exactly 3 characters'),
  priority: z.number().min(1, 'Priority must be at least 1').max(100, 'Priority cannot exceed 100'),
  occupancy_costs: z.array(rateOccupancyCostSchema).min(1, 'At least one occupancy cost must be defined')
}).refine(
  (data) => {
    const fromDate = new Date(data.valid_from)
    const toDate = new Date(data.valid_to)
    return toDate > fromDate
  },
  {
    message: 'Valid to date must be after valid from date',
    path: ['valid_to']
  }
)

// Update schemas (partial updates)
export const contractUpdateSchema = contractSchema.partial().omit({ supplier_id: true })
export const contractAllocationUpdateSchema = contractAllocationSchema.partial().omit({ product_id: true })
export const supplierRateUpdateSchema = supplierRateSchema.partial().omit({ product_id: true, product_option_id: true })

// Search and filter schemas
export const contractFiltersSchema = z.object({
  status: z.array(z.enum(['draft', 'active', 'expired', 'terminated', 'suspended'])).optional(),
  supplier_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  currency: z.string().optional(),
  search: z.string().optional()
})

export const contractSortSchema = z.object({
  field: z.enum(['contract_name', 'supplier_name', 'valid_from', 'valid_to', 'status', 'created_at']),
  direction: z.enum(['asc', 'desc'])
})

// Type exports
export type ContractFormData = z.infer<typeof contractSchema>
export type ContractAllocationFormData = z.infer<typeof contractAllocationSchema>
export type SupplierRateFormData = z.infer<typeof supplierRateSchema>
export type RateOccupancyCostFormData = z.infer<typeof rateOccupancyCostSchema>
export type ContractUpdateData = z.infer<typeof contractUpdateSchema>
export type ContractAllocationUpdateData = z.infer<typeof contractAllocationUpdateSchema>
export type SupplierRateUpdateData = z.infer<typeof supplierRateUpdateSchema>
export type ContractFilters = z.infer<typeof contractFiltersSchema>
export type ContractSort = z.infer<typeof contractSortSchema>