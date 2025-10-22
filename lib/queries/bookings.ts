import { createClient } from '@/lib/supabase/client'
import type { Booking, BookingFormData, BookingStats } from '@/lib/types/booking'

export async function getBookings(organizationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email),
      booking_items(
        *,
        product:products(id, name, code),
        product_option:product_options(id, option_name, option_code),
        supplier:suppliers(id, name, code)
      )
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Booking[]
}

export async function getBooking(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customers(id, first_name, last_name, email, phone, company_name),
      booking_items(
        *,
        product:products(id, name, code),
        product_option:product_options(id, option_name, option_code),
        supplier:suppliers(id, name, code)
      ),
      booking_passengers(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Booking
}

export async function createBooking(booking: BookingFormData & { organization_id: string }) {
  const supabase = createClient()
  
  // Start a transaction-like operation
  const { data: bookingData, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      organization_id: booking.organization_id,
      customer_id: booking.customer_id,
      travel_date_from: booking.travel_date_from,
      travel_date_to: booking.travel_date_to,
      currency: booking.currency,
      lead_passenger_name: booking.lead_passenger_name,
      lead_passenger_email: booking.lead_passenger_email,
      payment_status: booking.payment_status,
      booking_status: 'provisional',
      booking_reference: generateBookingReference()
    })
    .select()
    .single()
  
  if (bookingError) throw bookingError
  
  // Create booking items
  const bookingItems = booking.booking_items.map(item => ({
    booking_id: bookingData.id,
    organization_id: booking.organization_id,
    product_id: item.product_id,
    product_option_id: item.product_option_id,
    service_date_from: item.service_date_from,
    service_date_to: item.service_date_to,
    nights: calculateNights(item.service_date_from, item.service_date_to),
    quantity: item.quantity,
    adults: item.adults,
    children: item.children,
    item_status: 'provisional'
  }))
  
  const { error: itemsError } = await supabase
    .from('booking_items')
    .insert(bookingItems)
  
  if (itemsError) throw itemsError
  
  // Create passengers
  const passengers = booking.passengers.map(passenger => ({
    booking_id: bookingData.id,
    title: passenger.title,
    first_name: passenger.first_name,
    last_name: passenger.last_name,
    date_of_birth: passenger.date_of_birth,
    passport_number: passenger.passport_number,
    passport_expiry: passenger.passport_expiry,
    dietary_requirements: passenger.dietary_requirements,
    special_requests: passenger.special_requests,
    is_lead_passenger: passenger.is_lead_passenger
  }))
  
  const { error: passengersError } = await supabase
    .from('booking_passengers')
    .insert(passengers)
  
  if (passengersError) throw passengersError
  
  return bookingData
}

export async function updateBooking(id: string, updates: Partial<BookingFormData>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, first_name, last_name, email),
      booking_items(
        *,
        product:products(id, name, code),
        product_option:product_options(id, option_name, option_code),
        supplier:suppliers(id, name, code)
      )
    `)
    .single()
  
  if (error) throw error
  return data as Booking
}

export async function deleteBooking(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('bookings')
    .update({ booking_status: 'cancelled' })
    .eq('id', id)
  
  if (error) throw error
}

export async function getBookingStats(organizationId: string): Promise<BookingStats> {
  const supabase = createClient()
  
  // Get total bookings
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
  
  // Get today's bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const { count: todayBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
  
  // Get today's revenue
  const { data: todayRevenueData } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('organization_id', organizationId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
  
  const todayRevenue = todayRevenueData?.reduce((sum, booking) => sum + booking.total_price, 0) || 0
  
  // Get pending confirmations
  const { count: pendingConfirmations } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('booking_status', 'provisional')
  
  // Get cancellations this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count: cancellations } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('booking_status', 'cancelled')
    .gte('created_at', startOfMonth.toISOString())
  
  return {
    total_bookings: totalBookings || 0,
    today_bookings: todayBookings || 0,
    today_revenue: todayRevenue,
    pending_confirmations: pendingConfirmations || 0,
    cancellations: cancellations || 0
  }
}

// Helper functions
function generateBookingReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `BK${timestamp}${random}`
}

function calculateNights(checkIn: string, checkOut: string): number {
  const fromDate = new Date(checkIn)
  const toDate = new Date(checkOut)
  const diffTime = toDate.getTime() - fromDate.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
