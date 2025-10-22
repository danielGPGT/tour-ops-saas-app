import { z } from 'zod'

export const bookingSchema = z.object({
  customer_id: z.string().uuid('Invalid customer ID'),
  travel_date_from: z.string().min(1, 'Travel start date is required'),
  travel_date_to: z.string().min(1, 'Travel end date is required'),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3, 'Currency must be 3 characters'),
  lead_passenger_name: z.string().min(2, 'Lead passenger name must be at least 2 characters').max(255, 'Lead passenger name is too long'),
  lead_passenger_email: z.string().email('Invalid email address'),
  payment_status: z.string().min(1, 'Payment status is required'),
  booking_items: z.array(z.object({
    product_id: z.string().uuid('Invalid product ID'),
    product_option_id: z.string().uuid('Invalid product option ID'),
    service_date_from: z.string().min(1, 'Service start date is required'),
    service_date_to: z.string().min(1, 'Service end date is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
    adults: z.number().min(0, 'Adults cannot be negative').max(100, 'Adults cannot exceed 100'),
    children: z.number().min(0, 'Children cannot be negative').max(100, 'Children cannot exceed 100')
  })).min(1, 'At least one booking item is required'),
  passengers: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
    last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
    date_of_birth: z.string().optional(),
    passport_number: z.string().optional(),
    passport_expiry: z.string().optional(),
    dietary_requirements: z.string().optional(),
    special_requests: z.string().optional(),
    is_lead_passenger: z.boolean().default(false)
  })).min(1, 'At least one passenger is required')
}).refine((data) => {
  const fromDate = new Date(data.travel_date_from)
  const toDate = new Date(data.travel_date_to)
  return toDate > fromDate
}, {
  message: 'Travel end date must be after travel start date',
  path: ['travel_date_to']
}).refine((data) => {
  // Check that service dates are within travel dates
  return data.booking_items.every(item => {
    const serviceFrom = new Date(item.service_date_from)
    const serviceTo = new Date(item.service_date_to)
    const travelFrom = new Date(data.travel_date_from)
    const travelTo = new Date(data.travel_date_to)
    
    return serviceFrom >= travelFrom && serviceTo <= travelTo
  })
}, {
  message: 'Service dates must be within travel dates',
  path: ['booking_items']
}).refine((data) => {
  // Check that total passengers match booking items
  const totalPassengers = data.passengers.length
  const totalAdults = data.booking_items.reduce((sum, item) => sum + item.adults, 0)
  const totalChildren = data.booking_items.reduce((sum, item) => sum + item.children, 0)
  
  return totalPassengers === (totalAdults + totalChildren)
}, {
  message: 'Number of passengers must match total adults and children in booking items',
  path: ['passengers']
}).refine((data) => {
  // Check that exactly one passenger is marked as lead
  const leadPassengers = data.passengers.filter(p => p.is_lead_passenger)
  return leadPassengers.length === 1
}, {
  message: 'Exactly one passenger must be marked as lead passenger',
  path: ['passengers']
})

export type BookingFormData = z.infer<typeof bookingSchema>

export const bookingItemSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  product_option_id: z.string().uuid('Invalid product option ID'),
  service_date_from: z.string().min(1, 'Service start date is required'),
  service_date_to: z.string().min(1, 'Service end date is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(100, 'Quantity cannot exceed 100'),
  adults: z.number().min(0, 'Adults cannot be negative').max(100, 'Adults cannot exceed 100'),
  children: z.number().min(0, 'Children cannot be negative').max(100, 'Children cannot exceed 100')
}).refine((data) => {
  const fromDate = new Date(data.service_date_from)
  const toDate = new Date(data.service_date_to)
  return toDate > fromDate
}, {
  message: 'Service end date must be after service start date',
  path: ['service_date_to']
})

export type BookingItemFormData = z.infer<typeof bookingItemSchema>

export const bookingPassengerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  date_of_birth: z.string().optional(),
  passport_number: z.string().optional(),
  passport_expiry: z.string().optional(),
  dietary_requirements: z.string().optional(),
  special_requests: z.string().optional(),
  is_lead_passenger: z.boolean().default(false)
})

export type BookingPassengerFormData = z.infer<typeof bookingPassengerSchema>
