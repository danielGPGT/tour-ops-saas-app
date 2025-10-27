import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(50, 'Code is too long'),
  supplier_type: z.string().max(50, 'Supplier type is too long').optional(),
  
  // Contact information - direct fields
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  
  // Address - direct fields
  address_line1: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().max(2, 'Country must be a 2-character ISO code').optional().or(z.literal('')),
  
  // Additional fields
  default_currency: z.string().max(10, 'Currency code is too long').optional(),
  notes: z.string().optional().or(z.literal('')),
  
  // Status
  is_active: z.boolean().default(true)
})

export type SupplierFormData = z.infer<typeof supplierSchema>

// Legacy schemas for backward compatibility (if still needed elsewhere)
export const supplierContactSchema = z.object({
  primary_contact: z.string().min(1, 'Primary contact is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    postal_code: z.string().optional()
  }),
  website: z.string().url('Invalid website URL').optional().or(z.literal(''))
})

export const supplierPaymentSchema = z.object({
  payment_method: z.string().min(1, 'Payment method is required'),
  credit_days: z.number().min(0, 'Credit days must be 0 or more').max(365, 'Credit days cannot exceed 365'),
  terms: z.string().optional()
})

export type SupplierContactData = z.infer<typeof supplierContactSchema>
export type SupplierPaymentData = z.infer<typeof supplierPaymentSchema>
