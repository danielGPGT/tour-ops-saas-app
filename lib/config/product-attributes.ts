/**
 * Product Attribute Constants
 * 
 * This file contains constants for dropdown options, checkboxes, and other
 * static values used in product attribute forms.
 */

// ============================================================================
// ACCOMMODATION
// ============================================================================

export const ACCOMMODATION_PROPERTY_TYPES = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'hostel', label: 'Hostel' }
]

export const ACCOMMODATION_LOCATION_TYPES = [
  { value: 'city_center', label: 'City Center' },
  { value: 'beachfront', label: 'Beachfront' },
  { value: 'circuit_adjacent', label: 'Circuit Adjacent' },
  { value: 'other', label: 'Other' }
]

export const ACCOMMODATION_AMENITIES = [
  { value: 'wifi', label: 'WiFi' },
  { value: 'pool', label: 'Pool' },
  { value: 'gym', label: 'Gym' },
  { value: 'spa', label: 'Spa' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'bar', label: 'Bar' },
  { value: 'parking', label: 'Parking' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'room_service', label: 'Room Service' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'heating', label: 'Heating' },
  { value: 'tv', label: 'TV' },
  { value: 'minibar', label: 'Minibar' },
  { value: 'safe', label: 'Safe' },
  { value: 'balcony', label: 'Balcony' },
  { value: 'terrace', label: 'Terrace' }
]

// ============================================================================
// EVENT TICKETS
// ============================================================================

export const EVENT_CATEGORIES = [
  { value: 'grandstand', label: 'Grandstand' },
  { value: 'general_admission', label: 'General Admission' },
  { value: 'paddock_club', label: 'Paddock Club' },
  { value: 'vip', label: 'VIP' }
]

export const EVENT_STATUSES = [
  { value: 'reserved', label: 'Reserved' },
  { value: 'unreserved', label: 'Unreserved' }
]

export const EVENT_LOCATION_QUALITY = [
  { value: 'premium', label: 'Premium' },
  { value: 'standard', label: 'Standard' },
  { value: 'budget', label: 'Budget' }
]

export const EVENT_ACCESS_TYPES = [
  { value: 'full_weekend', label: 'Full Weekend' },
  { value: 'single_day', label: 'Single Day' },
  { value: 'practice_only', label: 'Practice Only' }
]

export const EVENT_DELIVERY_METHODS = [
  { value: 'collection_on_site', label: 'Collection on Site' },
  { value: 'postal', label: 'Postal' },
  { value: 'e_ticket', label: 'E-Ticket' }
]

// ============================================================================
// TRANSFERS
// ============================================================================

export const TRANSFER_TYPES = [
  { value: 'airport', label: 'Airport' },
  { value: 'circuit', label: 'Circuit' },
  { value: 'point_to_point', label: 'Point to Point' },
  { value: 'hourly', label: 'Hourly' }
]

export const TRANSFER_SERVICE_LEVELS = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'shuttle', label: 'Shuttle' }
]

export const TRANSFER_LOCATION_TYPES = [
  { value: 'airport', label: 'Airport' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'venue', label: 'Venue' },
  { value: 'address', label: 'Address' }
]

// ============================================================================
// TRANSPORT
// ============================================================================

export const TRANSPORT_MODES = [
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'ferry', label: 'Ferry' },
  { value: 'coach', label: 'Coach' }
]

export const TRANSPORT_ROUTE_TYPES = [
  { value: 'domestic', label: 'Domestic' },
  { value: 'international', label: 'International' },
  { value: 'regional', label: 'Regional' }
]

export const TRANSPORT_BOOKING_METHODS = [
  { value: 'via_broker', label: 'Via Broker' },
  { value: 'direct', label: 'Direct' },
  { value: 'api', label: 'API' }
]

// ============================================================================
// EXPERIENCES / ACTIVITIES
// ============================================================================

export const ACTIVITY_TYPES = [
  { value: 'tour', label: 'Tour' },
  { value: 'activity', label: 'Activity' },
  { value: 'dining', label: 'Dining' },
  { value: 'entertainment', label: 'Entertainment' }
]

export const ACTIVITY_CATEGORIES = [
  { value: 'sightseeing', label: 'Sightseeing' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'water_activity', label: 'Water Activity' }
]

export const ACTIVITY_GROUP_TYPES = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
  { value: 'group', label: 'Group' }
]

export const ACTIVITY_DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'challenging', label: 'Challenging' }
]

export const ACTIVITY_SEASONALITY = [
  { value: 'year_round', label: 'Year Round' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'peak_season_only', label: 'Peak Season Only' }
]

// ============================================================================
// EXTRAS
// ============================================================================

export const EXTRA_TYPES = [
  { value: 'airport_service', label: 'Airport Service' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'parking', label: 'Parking' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'service', label: 'Service' }
]

export const EXTRA_CATEGORIES = [
  { value: 'travel_convenience', label: 'Travel Convenience' },
  { value: 'event_related', label: 'Event Related' },
  { value: 'hotel_extra', label: 'Hotel Extra' },
  { value: 'service', label: 'Service' }
]

export const EXTRA_ENTRY_METHODS = [
  { value: 'voucher', label: 'Voucher' },
  { value: 'digital_pass', label: 'Digital Pass' },
  { value: 'physical_card', label: 'Physical Card' }
]

