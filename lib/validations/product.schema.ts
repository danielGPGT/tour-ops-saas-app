import { z } from 'zod'

// Location schema
const locationSchema = z.object({
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  address: z.string().optional()
})

// Image schema
const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string(),
  is_primary: z.boolean()
})

// Hotel attributes
const hotelAttributesSchema = z.object({
  star_rating: z.number().min(1).max(5),
  check_in_time: z.string(),
  check_out_time: z.string(),
  amenities: z.array(z.string()),
  property_type: z.enum(['hotel', 'resort', 'apartment', 'villa']),
  chain: z.string().optional()
})

// Event ticket attributes
const eventTicketAttributesSchema = z.object({
  event_name: z.string().min(1),
  event_date: z.string(),
  venue_name: z.string().min(1),
  venue_capacity: z.number().int().min(1),
  event_type: z.enum(['sports', 'concert', 'exhibition', 'theater', 'other']),
  gates_open_time: z.string(),
  event_start_time: z.string()
})

// Tour attributes
const tourAttributesSchema = z.object({
  duration_hours: z.number().min(0),
  duration_days: z.number().min(0),
  meeting_point: z.string(),
  meeting_time: z.string(),
  end_point: z.string(),
  tour_type: z.enum(['group', 'private', 'self_guided']),
  inclusions: z.array(z.string()),
  exclusions: z.array(z.string()),
  max_group_size: z.number().int().min(1)
})

// Transfer attributes
const transferAttributesSchema = z.object({
  vehicle_type: z.enum(['sedan', 'suv', 'van', 'bus']),
  max_passengers: z.number().int().min(1),
  max_luggage: z.number().int().min(0),
  from_location: z.string(),
  to_location: z.string(),
  distance_km: z.number().min(0),
  duration_minutes: z.number().int().min(0),
  transfer_type: z.enum(['airport', 'hotel', 'point_to_point'])
})

// Main product schema
export const productSchema = z.object({
  product_type_id: z.string().uuid('Please select a product type'),
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  location: locationSchema,
  attributes: z.any(),  // Validated based on product type
  tags: z.array(z.string()).default([]),
  media: z.array(imageSchema).default([]),
  is_active: z.boolean().default(true)
})

// Product option schema
export const productOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name is required'),
  option_code: z.string().min(2).max(20),
  description: z.string().optional(),
  standard_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  bed_configuration: z.string().optional(),
  attributes: z.any(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true)
}).refine(data => data.max_occupancy >= data.standard_occupancy, {
  message: 'Max occupancy must be >= standard occupancy',
  path: ['max_occupancy']
})

// Selling rate schema
export const sellingRateSchema = z.object({
  rate_name: z.string().min(1, 'Rate name is required'),
  rate_code: z.string().min(1, 'Rate code is required'),
  valid_from: z.string().min(1, 'Valid from date is required'),
  valid_to: z.string().min(1, 'Valid to date is required'),
  rate_basis: z.enum(['per_room_per_night', 'per_ticket', 'per_person', 'per_booking']),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3, 'Currency must be 3 characters'),
  customer_type: z.enum(['b2c', 'b2b_agent', 'b2b_corporate']),
  dow_mask: z.array(z.string()).default([]),
  min_nights: z.number().int().min(0).optional(),
  max_nights: z.number().int().min(0).optional(),
  min_pax: z.number().int().min(0).optional(),
  max_pax: z.number().int().min(0).optional(),
  priority: z.number().int().min(0, 'Priority must be non-negative'),
  is_active: z.boolean().default(true)
})

// Product type schema
export const productTypeSchema = z.object({
  type_name: z.enum(['hotel', 'event_ticket', 'tour', 'transfer']),
  type_code: z.enum(['HTL', 'TKT', 'TOR', 'TRF']),
  type_category: z.enum(['accommodation', 'activity', 'transport']),
  attributes_schema: z.any(),
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

// Export individual attribute schemas
export {
  hotelAttributesSchema,
  eventTicketAttributesSchema,
  tourAttributesSchema,
  transferAttributesSchema
}