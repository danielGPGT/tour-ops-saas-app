export interface Booking {
  id: string
  organization_id: string
  booking_reference: string
  booking_status: 'provisional' | 'confirmed' | 'cancelled'
  customer_id: string
  booking_date: string
  travel_date_from: string
  travel_date_to: string
  total_cost: number
  total_price: number
  margin: number
  currency: string
  lead_passenger_name: string
  lead_passenger_email: string
  payment_status: string
  created_at: string
  updated_at: string
  customer?: {
    id: string
    name: string
    email: string
  }
  booking_items?: BookingItem[]
}

export interface BookingItem {
  id: string
  booking_id: string
  organization_id: string
  product_id: string
  product_option_id: string
  service_date_from: string
  service_date_to: string
  nights: number
  quantity: number
  adults: number
  children: number
  supplier_id: string
  contract_id: string
  allocation_inventory_id: string
  unit_cost: number
  unit_price: number
  total_cost: number
  total_price: number
  cost_currency: string
  price_currency: string
  base_currency: string
  margin_base: number
  item_status: 'provisional' | 'confirmed' | 'cancelled'
  created_at: string
  updated_at: string
  product?: {
    id: string
    name: string
    code: string
  }
  product_option?: {
    id: string
    option_name: string
    option_code: string
  }
  supplier?: {
    id: string
    name: string
    code: string
  }
}

export interface BookingPassenger {
  id: string
  booking_id: string
  title: string
  first_name: string
  last_name: string
  date_of_birth?: string
  passport_number?: string
  passport_expiry?: string
  dietary_requirements?: string
  special_requests?: string
  is_lead_passenger: boolean
  created_at: string
  updated_at: string
}

export interface BookingFormData {
  customer_id: string
  travel_date_from: string
  travel_date_to: string
  currency: string
  lead_passenger_name: string
  lead_passenger_email: string
  payment_status: string
  booking_items: BookingItemFormData[]
  passengers: BookingPassengerFormData[]
}

export interface BookingItemFormData {
  product_id: string
  product_option_id: string
  service_date_from: string
  service_date_to: string
  quantity: number
  adults: number
  children: number
}

export interface BookingPassengerFormData {
  title: string
  first_name: string
  last_name: string
  date_of_birth?: string
  passport_number?: string
  passport_expiry?: string
  dietary_requirements?: string
  special_requests?: string
  is_lead_passenger: boolean
}

export interface BookingStats {
  total_bookings: number
  today_bookings: number
  today_revenue: number
  pending_confirmations: number
  cancellations: number
}
