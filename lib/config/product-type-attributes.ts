/**
 * Product Type Attributes Configuration
 * 
 * This file defines the attributes structure for each product type.
 * These attributes are stored in the products.attributes JSONB column.
 * 
 * Based on: docs/PRODUCT_TYPES_GUIDE.md
 */

import { z } from 'zod'

// ============================================================================
// ACCOMMODATION Attributes
// ============================================================================

export const accommodationProductAttributesSchema = z.object({
  // Property details
  property_type: z.enum(['hotel', 'apartment', 'villa', 'hostel']).optional(),
  star_rating: z.number().min(1).max(5).optional(),
  location_type: z.enum(['city_center', 'beachfront', 'circuit_adjacent', 'other']).optional(),
  
  // Distance to venue (for event-related accommodation)
  distance_to_venue: z.object({
    value: z.number(),
    unit: z.string(), // meters, km, etc.
    venue: z.string()
  }).optional(),
  
  // Check-in/out
  check_in_time: z.string().optional(), // e.g., "15:00"
  check_out_time: z.string().optional(), // e.g., "11:00"
  
  // Amenities
  amenities: z.array(z.string()).optional(),
  
  // Property info
  property_info: z.object({
    total_rooms: z.number().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional()
  }).optional(),
  
  // Policies
  cancellation_policy: z.string().optional(),
  minimum_stay: z.number().optional(),
  maximum_stay: z.number().optional()
}).optional()

export type AccommodationProductAttributes = z.infer<typeof accommodationProductAttributesSchema>

// ============================================================================
// EVENT TICKETS Attributes
// ============================================================================

export const eventProductAttributesSchema = z.object({
  // Ticket details
  ticket_category: z.enum(['grandstand', 'general_admission', 'paddock_club', 'vip']).optional(),
  venue_section: z.string().optional(), // e.g., "Grandstand K"
  seating_type: z.enum(['reserved', 'unreserved']).optional(),
  location_quality: z.enum(['premium', 'standard', 'budget']).optional(),
  
  // View quality
  view_quality: z.object({
    rating: z.number().min(1).max(10).optional(),
    description: z.string().optional()
  }).optional(),
  
  // Access
  access_type: z.enum(['full_weekend', 'single_day', 'practice_only']).optional(),
  
  // Event info
  event_info: z.object({
    event_name: z.string().optional(),
    event_dates: z.object({
      from: z.string().optional(),
      to: z.string().optional()
    }).optional(),
    sessions_included: z.array(z.string()).optional()
  }).optional(),
  
  // Includes/excludes
  includes: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  
  // Restrictions
  restrictions: z.object({
    age_limit: z.number().nullable().optional(),
    mobility_accessible: z.boolean().optional(),
    no_cameras: z.boolean().optional()
  }).optional(),
  
  // Delivery
  delivery_method: z.enum(['collection_on_site', 'postal', 'e_ticket']).optional(),
  terms: z.string().optional()
}).optional()

export type EventProductAttributes = z.infer<typeof eventProductAttributesSchema>

// ============================================================================
// TRANSFER Attributes
// ============================================================================

export const transferProductAttributesSchema = z.object({
  // Transfer details
  transfer_type: z.enum(['airport', 'circuit', 'point_to_point', 'hourly']).optional(),
  service_level: z.enum(['private', 'shared', 'shuttle']).optional(),
  
  // Route
  route: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    from_type: z.enum(['airport', 'hotel', 'venue', 'address']).optional(),
    to_type: z.enum(['airport', 'hotel', 'venue', 'address']).optional()
  }).optional(),
  
  // Distance/duration
  distance: z.object({
    value: z.number().optional(),
    unit: z.string().optional()
  }).optional(),
  
  duration: z.object({
    value: z.number().optional(),
    unit: z.string().optional(),
    traffic_dependent: z.boolean().optional()
  }).optional(),
  
  // Operating hours
  operates: z.object({
    days: z.array(z.string()).optional(),
    hours_start: z.string().optional(),
    hours_end: z.string().optional(),
    available_24_7: z.boolean().optional()
  }).optional(),
  
  // Vehicle types
  vehicle_types_available: z.array(z.string()).optional(),
  
  // Includes
  includes: z.array(z.string()).optional(),
  
  // Booking requirements
  booking_requirements: z.object({
    advance_booking_hours: z.number().optional(),
    requires_flight_details: z.boolean().optional(),
    requires_phone_number: z.boolean().optional()
  }).optional()
}).optional()

export type TransferProductAttributes = z.infer<typeof transferProductAttributesSchema>

// ============================================================================
// TRANSPORT Attributes
// ============================================================================

export const transportProductAttributesSchema = z.object({
  // Transport details
  transport_mode: z.enum(['flight', 'train', 'ferry', 'coach']).optional(),
  route_type: z.enum(['domestic', 'international', 'regional']).optional(),
  
  // Regions
  origin_region: z.string().optional(),
  destination_region: z.string().optional(),
  
  // Typical routes
  typical_routes: z.array(z.string()).optional(),
  
  // Service info
  service_info: z.object({
    booking_method: z.enum(['via_broker', 'direct', 'api']).optional(),
    brokers: z.array(z.string()).optional(),
    advance_booking_required: z.boolean().optional(),
    minimum_booking_days: z.number().optional()
  }).optional(),
  
  // General info
  general_info: z.object({
    baggage_typical: z.string().optional(),
    flight_duration_approx: z.string().optional(),
    frequency: z.string().optional()
  }).optional(),
  
  // Requirements
  requires_passenger_details: z.boolean().optional(),
  requires_passport_info: z.boolean().optional()
}).optional()

export type TransportProductAttributes = z.infer<typeof transportProductAttributesSchema>

// ============================================================================
// EXPERIENCE Attributes
// ============================================================================

export const experienceProductAttributesSchema = z.object({
  // Experience details
  experience_type: z.enum(['tour', 'activity', 'dining', 'entertainment']).optional(),
  category: z.enum(['sightseeing', 'adventure', 'cultural', 'water_activity']).optional(),
  
  // Duration
  duration: z.object({
    value: z.number().optional(),
    unit: z.string().optional(),
    flexible: z.boolean().optional()
  }).optional(),
  
  // Group type
  group_type: z.enum(['private', 'shared', 'group']).optional(),
  activity_level: z.enum(['easy', 'moderate', 'challenging']).optional(),
  
  // Location
  location: z.object({
    meeting_point: z.string().optional(),
    coverage_area: z.string().optional()
  }).optional(),
  
  // Schedule
  schedule: z.object({
    operates: z.array(z.string()).optional(),
    start_times: z.array(z.string()).optional(),
    flexible_start_time: z.boolean().optional(),
    seasonal: z.object({
      high_season: z.string().optional(),
      low_season: z.string().optional()
    }).optional()
  }).optional(),
  
  // Capacity
  capacity: z.object({
    min_participants: z.number().optional(),
    max_participants: z.number().optional(),
    private_booking_available: z.boolean().optional()
  }).optional(),
  
  // Includes/excludes
  includes: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
  
  // Requirements
  requirements: z.object({
    minimum_age: z.number().optional(),
    fitness_level: z.string().optional(),
    dress_code: z.string().optional()
  }).optional(),
  
  // Policies
  cancellation_policy: z.string().optional(),
  weather_dependent: z.boolean().optional(),
  languages_available: z.array(z.string()).optional()
}).optional()

export type ExperienceProductAttributes = z.infer<typeof experienceProductAttributesSchema>

// ============================================================================
// EXTRA Attributes
// ============================================================================

export const extraProductAttributesSchema = z.object({
  // Extra details
  extra_type: z.enum(['airport_service', 'insurance', 'parking', 'merchandise', 'service']).optional(),
  category: z.enum(['travel_convenience', 'event_related', 'hotel_extra', 'service']).optional(),
  
  // Location
  location: z.object({
    venue: z.string().optional(),
    terminal: z.string().optional(),
    area: z.string().optional()
  }).optional(),
  
  // Service details
  service_details: z.object({
    lounge_name: z.string().optional(),
    operator: z.string().optional(),
    size: z.string().optional()
  }).optional(),
  
  // Facilities
  facilities: z.array(z.string()).optional(),
  
  // Access info
  access_info: z.object({
    entry_method: z.enum(['voucher', 'digital_pass', 'physical_card']).optional(),
    valid_hours: z.string().optional(),
    access_duration: z.string().optional(),
    re_entry: z.boolean().optional()
  }).optional(),
  
  // Eligibility
  eligibility: z.object({
    requires_flight_ticket: z.boolean().optional(),
    min_age: z.number().nullable().optional(),
    dress_code: z.string().optional()
  }).optional(),
  
  // Booking
  advance_booking_required: z.boolean().optional(),
  booking_deadline_hours: z.number().optional()
}).optional()

export type ExtraProductAttributes = z.infer<typeof extraProductAttributesSchema>

// ============================================================================
// Product Type Schema Map
// ============================================================================

export const productTypeSchemas = {
  accommodation: accommodationProductAttributesSchema,
  event: eventProductAttributesSchema,
  transfer: transferProductAttributesSchema,
  transport: transportProductAttributesSchema,
  experience: experienceProductAttributesSchema,
  extra: extraProductAttributesSchema
} as const

export type ProductType = keyof typeof productTypeSchemas

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the attribute schema for a product type
 */
export function getProductTypeSchema(type: string) {
  const schema = productTypeSchemas[type as ProductType]
  return schema || z.any().optional()
}

/**
 * Validate product attributes for a given type
 */
export function validateProductAttributes(type: string, attributes: unknown) {
  const schema = getProductTypeSchema(type)
  return schema.safeParse(attributes)
}
