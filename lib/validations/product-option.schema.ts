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

// Accommodation option schema - UPDATED to match guide
// Note: Option-specific attributes are stored in the attributes JSONB field
export const accommodationOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    room_type: z.enum(['standard', 'deluxe', 'suite', 'junior_suite']).optional(),
    bed_configuration: z.string().optional(), // king, queen, twin, double
    view_type: z.string().optional(), // city, sea, garden, partial_sea
    room_size_sqm: z.number().min(1).max(500).optional(),
    floor_preference: z.enum(['low', 'mid', 'high', 'no_preference']).optional(),
    smoking: z.boolean().optional(),
    accessible: z.boolean().optional(),
    max_occupancy: z.number().int().min(1).max(20).optional(),
    standard_occupancy: z.number().int().min(1).max(20).optional(),
    extra_bed_available: z.boolean().optional(),
    room_amenities: z.array(z.string()).optional(),
    nights: z.number().int().min(1).optional(), // Duration
    includes: z.array(z.string()).optional()
  }).optional().nullable()
})

// Event option schema - UPDATED to match guide
export const eventOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    ticket_type: z.enum(['3_day', 'sunday_only', 'saturday_sunday']).optional(),
    seat_category: z.enum(['standard', 'premium', 'vip']).optional(),
    age_category: z.enum(['adult', 'child', 'concession']).optional(),
    days_included: z.array(z.string()).optional(),
    sessions: z.array(z.string()).optional(),
    seat_details: z.object({
      row: z.string().optional(),
      section: z.string().optional(),
      entrance: z.string().optional()
    }).optional(),
    requires_id: z.boolean().optional(),
    digital_ticket: z.boolean().optional(),
    physical_ticket: z.boolean().optional()
  }).optional().nullable()
})

// Transport option schema
export const transportOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    service_class: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
    ticket_flexibility: z.enum(['flexible', 'semi_flexible', 'non_flexible']).optional(),
    typical_airlines: z.array(z.string()).optional()
  }).optional().nullable()
})

// Transfer option schema - UPDATED to match guide
export const transferOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    vehicle_type: z.string().optional(),
    vehicle_class: z.string().optional(),
    capacity: z.object({
      passengers: z.number().int().min(1).max(60).optional(),
      luggage_large: z.number().int().min(0).optional(),
      luggage_small: z.number().int().min(0).optional()
    }).optional(),
    vehicle_features: z.array(z.string()).optional(),
    driver_info: z.object({
      uniformed: z.boolean().optional(),
      english_speaking: z.boolean().optional(),
      professional_license: z.boolean().optional()
    }).optional(),
    pricing_basis: z.enum(['per_vehicle', 'per_person']).optional(),
    additional_stops: z.object({
      allowed: z.boolean().optional(),
      max_stops: z.number().int().optional(),
      additional_cost: z.number().optional()
    }).optional(),
    child_seats: z.object({
      available: z.boolean().optional(),
      cost_per_seat: z.number().optional()
    }).optional()
  }).optional().nullable()
})

// Experience option schema - UPDATED to match guide
export const experienceOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    option_type: z.enum(['duration', 'group_size', 'service_level']).optional(),
    duration_hours: z.number().min(0.5).max(168).optional(),
    yacht_type: z.string().optional(),
    capacity_details: z.object({
      max_guests: z.number().int().min(1).optional(),
      crew: z.number().int().optional(),
      cabins: z.number().int().optional()
    }).optional(),
    route: z.object({
      departure: z.string().optional(),
      stops: z.array(z.string()).optional(),
      return: z.string().optional()
    }).optional(),
    includes_specific: z.array(z.string()).optional(),
    customization_available: z.boolean().optional(),
    special_occasions: z.object({
      birthday: z.boolean().optional(),
      proposal: z.boolean().optional(),
      anniversary: z.boolean().optional(),
      custom_decoration: z.number().optional()
    }).optional()
  }).optional().nullable()
})

// Extra option schema - UPDATED to match guide
export const extraOptionSchema = baseOptionSchema.extend({
  attributes: z.object({
    extra_type: z.enum(['airport_service', 'insurance', 'parking', 'merchandise', 'service']).optional(),
    access_type: z.enum(['departure', 'arrival', 'both']).optional(),
    visit_count: z.enum(['single', 'return']).optional(),
    includes: z.array(z.string()).optional(),
    restrictions: z.object({
      alcohol_included: z.boolean().optional(),
      guest_policy: z.string().optional(),
      max_stay_hours: z.number().optional()
    }).optional(),
    validity: z.object({
      valid_on_date: z.boolean().optional(),
      flexible_time: z.boolean().optional(),
      expiry: z.string().optional()
    }).optional()
  }).optional().nullable()
})

// Export types
export type AccommodationOptionFormData = z.infer<typeof accommodationOptionSchema>
export type EventOptionFormData = z.infer<typeof eventOptionSchema>
export type TransportOptionFormData = z.infer<typeof transportOptionSchema>
export type TransferOptionFormData = z.infer<typeof transferOptionSchema>
export type ExperienceOptionFormData = z.infer<typeof experienceOptionSchema>
export type ExtraOptionFormData = z.infer<typeof extraOptionSchema>

// Alias for backward compatibility
export const activityOptionSchema = experienceOptionSchema
export type ActivityOptionFormData = ExperienceOptionFormData
