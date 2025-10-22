import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255, 'Name is too long'),
  code: z.string().min(2, 'Code must be at least 2 characters').max(50, 'Code is too long'),
  supplier_type: z.string().max(50, 'Supplier type is too long').optional(),
  contact_info: z.object({
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),
    postal_code: z.string().optional().or(z.literal(''))
  }).optional(),
  payment_terms: z.string().optional(),
  commission_rate: z.number().min(0, 'Commission rate cannot be negative').max(999.99, 'Commission rate cannot exceed 999.99%').optional(),
  rating: z.number().min(0, 'Rating must be at least 0').max(9.99, 'Rating cannot exceed 9.99').optional(),
  is_active: z.boolean().default(true)
})

export type SupplierFormData = z.infer<typeof supplierSchema>

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
