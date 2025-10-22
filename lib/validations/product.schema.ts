import { z } from 'zod'

// Location schema
const locationSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
  venue_name: z.string().optional(),
  venue_address: z.string().optional()
})

// Product attributes schema
const productAttributesSchema = z.object({
  // Hotel specific
  star_rating: z.number().min(1).max(5).optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  amenities: z.array(z.string()).optional(),
  
  // Event specific
  event_date: z.string().optional(),
  venue: z.string().optional(),
  gates_open_time: z.string().optional(),
  event_type: z.string().optional(),
  
  // Tour specific
  duration_hours: z.number().min(0).optional(),
  meeting_point: z.string().optional(),
  inclusions: z.array(z.string()).optional(),
  exclusions: z.array(z.string()).optional(),
  difficulty_level: z.string().optional(),
  
  // Transfer specific
  vehicle_type: z.string().optional(),
  route: z.string().optional(),
  luggage_allowance: z.string().optional(),
  pickup_locations: z.array(z.string()).optional(),
  
  // Common
  tags: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  slug: z.string().optional()
})

// Main product schema
export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code must be less than 20 characters'),
  product_type_id: z.string().min(1, 'Product type is required'),
  description: z.string().optional(),
  location: locationSchema,
  attributes: productAttributesSchema,
  is_active: z.boolean().default(true)
})

// Product option schema
export const productOptionSchema = z.object({
  option_name: z.string().min(1, 'Option name is required'),
  option_code: z.string().min(1, 'Option code is required'),
  standard_occupancy: z.number().min(1, 'Standard occupancy must be at least 1'),
  max_occupancy: z.number().min(1, 'Max occupancy must be at least 1'),
  bed_configuration: z.string().optional(),
  is_active: z.boolean().default(true)
})

// Selling rate schema
export const sellingRateSchema = z.object({
  rate_name: z.string().min(1, 'Rate name is required'),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  rate_basis: z.enum(['per_room_per_night', 'per_ticket', 'per_person', 'per_booking']),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3, 'Currency must be 3 characters'),
  markup_type: z.enum(['fixed_amount', 'percentage']),
  markup_value: z.number().min(0, 'Markup value must be positive'),
  customer_type: z.enum(['B2C', 'B2B_agent', 'B2B_corporate']),
  min_pax: z.number().min(1).optional(),
  max_pax: z.number().min(1).optional(),
  dow_mask: z.string().optional(),
  priority: z.number().min(0, 'Priority must be non-negative'),
  is_active: z.boolean().default(true)
})

// Product type schema
export const productTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_active: z.boolean().default(true)
})

// Filter schema
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  product_type_id: z.string().optional(),
  is_active: z.boolean().optional(),
  location: z.object({
    city: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
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