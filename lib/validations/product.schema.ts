import { z } from 'zod'

// Location schema
const locationSchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional()
})

// Main product schema - MATCHES DATABASE SCHEMA
export const productSchema = z.object({
  product_type_id: z.string().uuid('Please select a product type'),
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  code: z.string().min(2).max(100),
  description: z.string().optional(),
  supplier_id: z.string().uuid().optional().nullable(),
  venue_name: z.string().optional().nullable(),
  event_id: z.string().uuid().optional().nullable(),
  location: locationSchema.optional().nullable(),
  attributes: z.any().optional().nullable(),
  is_active: z.boolean().default(true)
})

// Product option schema - MATCHES DATABASE SCHEMA
export const productOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name is required'),
  option_code: z.string().min(2).max(100),
  description: z.string().optional().nullable(),
  base_price: z.number().optional().nullable(),
  base_cost: z.number().optional().nullable(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional().nullable(),
  attributes: z.any().optional().nullable(),
  is_active: z.boolean().default(true)
})

// Selling rate schema
export const sellingRateSchema = z.object({
  rate_name: z.string().min(1, 'Rate name is required'),
  rate_basis: z.enum(['per_night', 'per_person', 'per_unit', 'per_booking']),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  base_price: z.number().min(0, 'Base price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters'),
  markup_type: z.enum(['fixed_amount', 'percentage']).optional().nullable(),
  markup_amount: z.number().optional().nullable(),
  pricing_details: z.any().optional().nullable(),
  is_active: z.boolean().default(true)
})

// Product type schema
export const productTypeSchema = z.object({
  type_name: z.string(),
  type_code: z.string(),
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  is_active: z.boolean().default(true)
})

// Filter schema
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  product_type_id: z.string().optional(),
  supplier_id: z.string().optional(),
  event_id: z.string().optional(),
  is_active: z.boolean().optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional()
  }).optional()
})

// Sort schema
export const productSortSchema = z.object({
  field: z.enum(['name', 'created_at', 'updated_at']),
  direction: z.enum(['asc', 'desc'])
})

// Type exports
export type ProductFormData = z.infer<typeof productSchema>
export type ProductOptionFormData = z.infer<typeof productOptionSchema>
export type SellingRateFormData = z.infer<typeof sellingRateSchema>
export type ProductTypeFormData = z.infer<typeof productTypeSchema>
export type ProductFilters = z.infer<typeof productFiltersSchema>
export type ProductSort = z.infer<typeof productSortSchema>