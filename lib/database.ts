// ============================================
// DATABASE CONNECTION UTILITIES
// Direct Supabase connection for tour operator system
// ============================================

import { createClient } from '@/utils/supabase/server'
import { createClient as createBrowserClient } from '@/utils/supabase/client'
import { Database } from './types/database'

// Server-side database client
export const getServerDatabase = async () => {
  return await createClient()
}

// Client-side database client
export const getClientDatabase = () => {
  return createBrowserClient()
}

// ============================================
// QUERY HELPERS
// ============================================

export class DatabaseService {
  private supabase: any

  constructor(supabase: any) {
    this.supabase = supabase
  }

  getServerDatabase() {
    return this.supabase
  }

  // ============================================
  // ORGANIZATIONS
  // ============================================

  async getOrganizations() {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  async getOrganization(id: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getOrganizationBySlug(slug: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // USERS
  // ============================================

  async getUsers(organizationId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('first_name, last_name')

    if (error) throw error
    return data
  }

  async getUser(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // SUPPLIERS
  // ============================================

  async getSuppliers(organizationId: string) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select(`
        *,
        contracts (
          id,
          contract_number,
          contract_name,
          status,
          valid_from,
          valid_to
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  async getSupplier(id: string) {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select(`
        *,
        contracts (
          id,
          contract_number,
          contract_name,
          status,
          valid_from,
          valid_to
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(organizationId: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        product_types (
          id,
          type_code,
          type_name
        ),
        product_options (
          id,
          option_name,
          option_code,
          standard_occupancy,
          max_occupancy,
          is_active
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  async getProduct(id: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        product_types (
          id,
          type_code,
          type_name
        ),
        product_options (
          id,
          option_name,
          option_code,
          standard_occupancy,
          max_occupancy,
          is_active
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async getProductTypes() {
    const { data, error } = await this.supabase
      .from('product_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name')

    if (error) throw error
    return data
  }

  // ============================================
  // BOOKINGS
  // ============================================

  async getBookings(organizationId: string, limit = 50, offset = 0) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email
        ),
        booking_items (
          id,
          product_id,
          product_option_id,
          service_date_from,
          service_date_to,
          quantity,
          adults,
          children,
          infants,
          unit_cost,
          unit_price,
          total_cost,
          total_price,
          item_status,
          is_sourced
        )
      `)
      .eq('organization_id', organizationId)
      .order('booking_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  async getBooking(id: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        booking_items (
          id,
          product_id,
          product_option_id,
          service_date_from,
          service_date_to,
          quantity,
          adults,
          children,
          infants,
          unit_cost,
          unit_price,
          total_cost,
          total_price,
          item_status,
          is_sourced,
          special_requests,
          item_notes
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // AVAILABILITY
  // ============================================

  async getAvailability(allocationInventoryId: string, dateFrom: string, dateTo: string) {
    const { data, error } = await this.supabase
      .from('availability')
      .select(`
        *,
        allocation_inventory (
          id,
          total_quantity,
          flexible_configuration,
          contract_allocations (
            id,
            allocation_name,
            allocation_type,
            allow_overbooking,
            overbooking_limit
          )
        )
      `)
      .eq('allocation_inventory_id', allocationInventoryId)
      .gte('availability_date', dateFrom)
      .lte('availability_date', dateTo)
      .order('availability_date')

    if (error) throw error
    return data
  }

  // ============================================
  // CUSTOMERS
  // ============================================

  async getCustomers(organizationId: string) {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('first_name, last_name')

    if (error) throw error
    return data
  }

  async getCustomer(id: string) {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // ============================================
  // SEARCH & FILTERING
  // ============================================

  async searchProducts(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        product_types (
          id,
          type_code,
          type_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,code.ilike.%${query}%,description.ilike.%${query}%`)
      .order('name')
      .limit(20)

    if (error) throw error
    return data
  }

  async searchBookings(organizationId: string, query: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', organizationId)
      .or(`booking_reference.ilike.%${query}%,lead_passenger_name.ilike.%${query}%,lead_passenger_email.ilike.%${query}%`)
      .order('booking_date', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  async getBookingStats(organizationId: string) {
    const { data, error } = await this.supabase
      .from('vw_booking_summary')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error
    return data
  }

  async getInventoryStats(organizationId: string) {
    const { data, error } = await this.supabase
      .from('vw_inventory_status')
      .select('*')

    if (error) throw error
    return data
  }
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const createDatabaseService = async () => {
  const supabase = await getServerDatabase()
  return new DatabaseService(supabase)
}

export const createClientDatabaseService = () => {
  const supabase = getClientDatabase()
  return new DatabaseService(supabase)
}
