import { z } from 'zod'

export const customerSchema = z.object({
  customer_type: z.enum(['B2C', 'B2B'], {
    required_error: 'Please select a customer type'
  }),
  title: z.string().optional(),
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(100, 'First name is too long'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').max(100, 'Last name is too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  company_name: z.string().optional(),
  company_registration: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    postal_code: z.string().optional()
  }),
  preferences: z.object({
    preferred_contact_method: z.enum(['email', 'phone', 'sms']).optional(),
    preferred_language: z.string().optional(),
    dietary_requirements: z.string().optional(),
    special_requests: z.string().optional()
  }).optional(),
  marketing_consent: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Notes are too long').optional()
}).refine((data) => {
  // If B2B, company_name should be required
  if (data.customer_type === 'B2B' && !data.company_name) {
    return false
  }
  return true
}, {
  message: 'Company name is required for B2B customers',
  path: ['company_name']
})

export type CustomerFormData = z.infer<typeof customerSchema>

export const customerContactSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required'),
    postal_code: z.string().optional()
  })
})

export const customerPreferencesSchema = z.object({
  preferred_contact_method: z.enum(['email', 'phone', 'sms']).optional(),
  preferred_language: z.string().optional(),
  dietary_requirements: z.string().optional(),
  special_requests: z.string().optional()
})

export type CustomerContactData = z.infer<typeof customerContactSchema>
export type CustomerPreferencesData = z.infer<typeof customerPreferencesSchema>
