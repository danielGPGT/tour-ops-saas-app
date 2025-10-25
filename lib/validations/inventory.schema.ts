import { z } from 'zod'

export const allocationInventorySchema = z.object({
  product_option_id: z.string().min(1, 'Please select a product option'),
  total_quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10000),
  flexible_configuration: z.boolean().default(false),
  alternate_option_ids: z.array(z.string()).default([]),
  min_quantity_per_booking: z.number().int().min(1).default(1),
  max_quantity_per_booking: z.number().int().min(1).optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional()
}).refine(
  data => !data.max_quantity_per_booking || data.max_quantity_per_booking >= data.min_quantity_per_booking,
  {
    message: 'Max quantity per booking must be >= min quantity',
    path: ['max_quantity_per_booking']
  }
)

export const generateAvailabilitySchema = z.object({
  date_from: z.string().min(1, 'Start date is required'),
  date_to: z.string().min(1, 'End date is required')
}).refine(
  data => new Date(data.date_to) >= new Date(data.date_from),
  {
    message: 'End date must be after start date',
    path: ['date_to']
  }
)

export type AllocationInventoryFormData = z.infer<typeof allocationInventorySchema>
export type GenerateAvailabilityFormData = z.infer<typeof generateAvailabilitySchema>
