import { z } from 'zod'

// Base schema (common fields)
const baseOptionSchema = z.object({
  option_name: z.string().min(2, 'Option name must be at least 2 characters'),
  option_code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  description: z.string().optional(),
  base_price_hint: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  is_active: z.boolean().default(true)
})

// Accommodation option schema
export const accommodationOptionSchema = baseOptionSchema.extend({
  bed_configuration: z.string().min(1, 'Bed configuration is required'),
  room_size_sqm: z.number().min(1).max(500).optional(),
  view_type: z.string().optional(),
  floor_range: z.string().optional(),
  standard_occupancy: z.number().int().min(1).max(20),
  max_occupancy: z.number().int().min(1).max(20),
  amenities: z.array(z.string()).optional()
}).refine(data => data.max_occupancy >= data.standard_occupancy, {
  message: 'Max occupancy must be >= standard occupancy',
  path: ['max_occupancy']
})

// Event option schema
export const eventOptionSchema = baseOptionSchema.extend({
  ticket_type: z.enum(['seated', 'standing', 'vip_lounge', 'hospitality', 'general']),
  section: z.string().optional(),
  seat_details: z.string().optional(),
  access_level: z.enum(['general', 'vip', 'premium', 'hospitality', 'backstage']),
  includes: z.array(z.string()).optional()
})

// Transfer option schema
export const transferOptionSchema = baseOptionSchema.extend({
  vehicle_type: z.enum(['sedan', 'suv', 'van', 'minibus', 'bus', 'luxury', 'limousine']),
  max_passengers: z.number().int().min(1).max(60),
  max_luggage: z.number().int().min(0).max(100),
  vehicle_features: z.array(z.string()).optional(),
  vehicle_class: z.enum(['economy', 'business', 'luxury', 'premium']).optional(),
  standard_occupancy: z.number().int().min(1).max(60)
}).refine(data => data.max_passengers >= data.standard_occupancy, {
  message: 'Max passengers must be >= standard occupancy',
  path: ['max_passengers']
})

// Activity option schema
export const activityOptionSchema = baseOptionSchema.extend({
  experience_type: z.enum(['group', 'private', 'self_guided', 'shared']),
  min_group_size: z.number().int().min(1).optional(),
  max_group_size: z.number().int().min(1).optional(),
  duration_hours: z.number().min(0.5).max(168), // Up to 7 days
  difficulty_level: z.enum(['easy', 'moderate', 'challenging', 'extreme']),
  standard_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  includes: z.array(z.string()).optional()
}).refine(data => {
  if (data.min_group_size && data.max_group_size) {
    return data.max_group_size >= data.min_group_size
  }
  return true
}, {
  message: 'Max group size must be >= min group size',
  path: ['max_group_size']
})

// Extra option schema
export const extraOptionSchema = baseOptionSchema.extend({
  extra_type: z.enum(['insurance', 'visa', 'equipment', 'service', 'upgrade', 'other']),
  unit_type: z.enum(['per_person', 'per_booking', 'per_day', 'per_item']),
  is_mandatory: z.boolean().default(false),
  coverage_details: z.string().optional(),
  validity_days: z.number().int().min(1).optional()
})

// Export types
export type AccommodationOptionFormData = z.infer<typeof accommodationOptionSchema>
export type EventOptionFormData = z.infer<typeof eventOptionSchema>
export type TransferOptionFormData = z.infer<typeof transferOptionSchema>
export type ActivityOptionFormData = z.infer<typeof activityOptionSchema>
export type ExtraOptionFormData = z.infer<typeof extraOptionSchema>
