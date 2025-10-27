import { z } from 'zod'

// Rate basis enum
export const rateBasisEnum = z.enum([
  'per_night',
  'per_person', 
  'per_booking',
  'per_unit',
  'per_vehicle'
])

// Markup type enum
export const markupTypeEnum = z.enum(['percentage', 'fixed', 'null'])

// Base selling rate schema
export const sellingRateSchema = z.object({
  rate_name: z.string().min(1, 'Rate name is required').max(255).optional().or(z.literal('')),
  rate_basis: rateBasisEnum,
  valid_from: z.date({
    required_error: 'Valid from date is required'
  }),
  valid_to: z.date({
    required_error: 'Valid to date is required'
  }),
  base_price: z.number().positive('Base price must be greater than 0'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('GBP'),
  markup_type: markupTypeEnum.nullable().optional(),
  markup_amount: z.number().min(0).optional().nullable(),
  target_cost: z.number().positive('Target cost must be greater than 0').optional().nullable(),
  pricing_details: z.object({
    minimum_nights: z.number().min(1).optional().nullable(),
    maximum_nights: z.number().min(1).optional().nullable(),
    daily_rates: z.record(z.any()).optional().nullable(),
  }).passthrough().optional().nullable(),
  is_active: z.boolean().default(true)
}).refine(
  (data) => data.valid_to >= data.valid_from,
  {
    message: 'Valid to date must be after valid from date',
    path: ['valid_to']
  }
).refine(
  (data) => !data.target_cost || data.target_cost < data.base_price,
  {
    message: 'Target cost should be less than base price',
    path: ['target_cost']
  }
).refine(
  (data) => {
    if (data.pricing_details?.minimum_nights && data.pricing_details?.maximum_nights) {
      return data.pricing_details.maximum_nights >= data.pricing_details.minimum_nights
    }
    return true
  },
  {
    message: 'Maximum nights must be >= minimum nights',
    path: ['pricing_details', 'maximum_nights']
  }
)

// Export types
export type SellingRateFormData = z.infer<typeof sellingRateSchema>

// Helper functions
export function getDefaultRateBasis(productTypeCode: string): 'per_night' | 'per_person' | 'per_booking' | 'per_unit' | 'per_vehicle' {
  const defaults: Record<string, 'per_night' | 'per_person' | 'per_booking' | 'per_unit' | 'per_vehicle'> = {
    accommodation: 'per_night',
    event_tickets: 'per_unit',
    event: 'per_unit',
    transfers: 'per_booking',
    transfer: 'per_booking',
    transport: 'per_person',
    experiences: 'per_booking',
    experience: 'per_booking',
    extras: 'per_person',
    extra: 'per_person'
  }
  
  return defaults[productTypeCode] || 'per_unit'
}
