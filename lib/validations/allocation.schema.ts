import { z } from 'zod'

export const allocationSchema = z.object({
  contract_id: z.string().uuid('Please select a contract'),
  product_id: z.string().uuid('Please select a product'),
  allocation_name: z.string().min(3, 'Allocation name must be at least 3 characters'),
  allocation_type: z.enum(['allotment', 'free_sell', 'on_request']),
  
  // Dates
  valid_from: z.string().min(1, 'Start date is required'),
  valid_to: z.string().min(1, 'End date is required'),
  
  // Restrictions (optional, mainly for accommodation)
  min_nights: z.number().int().min(1).optional(),
  max_nights: z.number().int().min(1).optional(),
  min_advance_booking: z.number().int().min(1).optional(),
  max_advance_booking: z.number().int().min(1).optional(),
  
  // Release settings
  release_days: z.number().int().min(0).max(365).optional(),
  
  // DOW restrictions (stored as integer arrays in DB)
  dow_arrival: z.array(z.number().int().min(0).max(6)).optional(),
  dow_checkout: z.array(z.number().int().min(0).max(6)).optional(),
  
  // Overbooking
  allow_overbooking: z.boolean().optional(),
  overbooking_limit: z.number().int().min(0).optional(),
  
  // Terms (JSONB)
  terms: z.any().optional(),
  
  // Status
  is_active: z.boolean().optional()
}).refine(
  data => new Date(data.valid_to) >= new Date(data.valid_from),
  {
    message: 'End date must be after or equal to start date',
    path: ['valid_to']
  }
).refine(
  data => !data.min_nights || !data.max_nights || data.max_nights >= data.min_nights,
  {
    message: 'Max nights must be >= min nights',
    path: ['max_nights']
  }
)

export type AllocationFormData = z.infer<typeof allocationSchema>
