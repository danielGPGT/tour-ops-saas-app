// ============================================
// DATABASE TYPES FOR TOUR OPERATOR SYSTEM
// Generated from the new PostgreSQL schema
// ============================================

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          company_registration: string | null
          tax_id: string | null
          email: string | null
          phone: string | null
          website: string | null
          address: any | null
          logo_url: string | null
          brand_colors: any | null
          default_currency: string
          timezone: string
          date_format: string
          subscription_plan: string
          subscription_status: string
          trial_ends_at: string | null
          subscription_ends_at: string | null
          features: any | null
          is_active: boolean
          onboarded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          company_registration?: string | null
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: any | null
          logo_url?: string | null
          brand_colors?: any | null
          default_currency?: string
          timezone?: string
          date_format?: string
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          features?: any | null
          is_active?: boolean
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          company_registration?: string | null
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          address?: any | null
          logo_url?: string | null
          brand_colors?: any | null
          default_currency?: string
          timezone?: string
          date_format?: string
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string | null
          subscription_ends_at?: string | null
          features?: any | null
          is_active?: boolean
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          password_hash: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          permissions: any | null
          is_active: boolean
          email_verified: boolean
          last_login_at: string | null
          failed_login_attempts: number
          locked_until: string | null
          password_reset_token: string | null
          password_reset_expires: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          password_hash?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          permissions?: any | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          password_hash?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          permissions?: any | null
          is_active?: boolean
          email_verified?: boolean
          last_login_at?: string | null
          failed_login_attempts?: number
          locked_until?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          organization_id: string
          name: string
          code: string
          supplier_type: string | null
          contact_info: any | null
          payment_terms: any | null
          commission_rate: number | null
          rating: number | null
          total_bookings: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          code: string
          supplier_type?: string | null
          contact_info?: any | null
          payment_terms?: any | null
          commission_rate?: number | null
          rating?: number | null
          total_bookings?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          code?: string
          supplier_type?: string | null
          contact_info?: any | null
          payment_terms?: any | null
          commission_rate?: number | null
          rating?: number | null
          total_bookings?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          organization_id: string
          supplier_id: string
          contract_number: string
          contract_name: string | null
          valid_from: string
          valid_to: string
          currency: string
          payment_terms: any | null
          cancellation_policy: any | null
          rooming_list_deadline: number | null
          cutoff_date: string | null
          commission_rate: number | null
          commission_type: string | null
          contract_files: any | null
          terms: string | null
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          supplier_id: string
          contract_number: string
          contract_name?: string | null
          valid_from: string
          valid_to: string
          currency?: string
          payment_terms?: any | null
          cancellation_policy?: any | null
          rooming_list_deadline?: number | null
          cutoff_date?: string | null
          commission_rate?: number | null
          commission_type?: string | null
          contract_files?: any | null
          terms?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          supplier_id?: string
          contract_number?: string
          contract_name?: string | null
          valid_from?: string
          valid_to?: string
          currency?: string
          payment_terms?: any | null
          cancellation_policy?: any | null
          rooming_list_deadline?: number | null
          cutoff_date?: string | null
          commission_rate?: number | null
          commission_type?: string | null
          contract_files?: any | null
          terms?: string | null
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_types: {
        Row: {
          id: string
          type_code: string
          type_name: string
          schema_definition: any | null
          is_active: boolean
        }
        Insert: {
          id?: string
          type_code: string
          type_name: string
          schema_definition?: any | null
          is_active?: boolean
        }
        Update: {
          id?: string
          type_code?: string
          type_name?: string
          schema_definition?: any | null
          is_active?: boolean
        }
      }
      products: {
        Row: {
          id: string
          organization_id: string
          product_type_id: string
          name: string
          code: string
          description: string | null
          location: any | null
          attributes: any | null
          media: any | null
          tags: string[] | null
          meta_title: string | null
          meta_description: string | null
          is_active: boolean
          is_featured: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          product_type_id: string
          name: string
          code: string
          description?: string | null
          location?: any | null
          attributes?: any | null
          media?: any | null
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          product_type_id?: string
          name?: string
          code?: string
          description?: string | null
          location?: any | null
          attributes?: any | null
          media?: any | null
          tags?: string[] | null
          meta_title?: string | null
          meta_description?: string | null
          is_active?: boolean
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          option_name: string
          option_code: string
          description: string | null
          standard_occupancy: number | null
          max_occupancy: number | null
          min_occupancy: number
          bed_configuration: string | null
          attributes: any | null
          inclusions: string[] | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          option_name: string
          option_code: string
          description?: string | null
          standard_occupancy?: number | null
          max_occupancy?: number | null
          min_occupancy?: number
          bed_configuration?: string | null
          attributes?: any | null
          inclusions?: string[] | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          option_name?: string
          option_code?: string
          description?: string | null
          standard_occupancy?: number | null
          max_occupancy?: number | null
          min_occupancy?: number
          bed_configuration?: string | null
          attributes?: any | null
          inclusions?: string[] | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      contract_allocations: {
        Row: {
          id: string
          organization_id: string
          contract_id: string
          product_id: string
          allocation_name: string | null
          allocation_type: 'committed' | 'free_sell' | 'on_request' | 'block'
          valid_from: string
          valid_to: string
          min_nights: number | null
          max_nights: number | null
          min_advance_booking: number | null
          max_advance_booking: number | null
          release_days: number | null
          dow_arrival: number[] | null
          dow_checkout: number[] | null
          allow_overbooking: boolean
          overbooking_limit: number | null
          terms: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contract_id: string
          product_id: string
          allocation_name?: string | null
          allocation_type: 'committed' | 'free_sell' | 'on_request' | 'block'
          valid_from: string
          valid_to: string
          min_nights?: number | null
          max_nights?: number | null
          min_advance_booking?: number | null
          max_advance_booking?: number | null
          release_days?: number | null
          dow_arrival?: number[] | null
          dow_checkout?: number[] | null
          allow_overbooking?: boolean
          overbooking_limit?: number | null
          terms?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contract_id?: string
          product_id?: string
          allocation_name?: string | null
          allocation_type?: 'committed' | 'free_sell' | 'on_request' | 'block'
          valid_from?: string
          valid_to?: string
          min_nights?: number | null
          max_nights?: number | null
          min_advance_booking?: number | null
          max_advance_booking?: number | null
          release_days?: number | null
          dow_arrival?: number[] | null
          dow_checkout?: number[] | null
          allow_overbooking?: boolean
          overbooking_limit?: number | null
          terms?: any | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      allocation_inventory: {
        Row: {
          id: string
          contract_allocation_id: string
          product_option_id: string
          total_quantity: number
          flexible_configuration: boolean
          alternate_option_ids: string[] | null
          notes: string | null
        }
        Insert: {
          id?: string
          contract_allocation_id: string
          product_option_id: string
          total_quantity: number
          flexible_configuration?: boolean
          alternate_option_ids?: string[] | null
          notes?: string | null
        }
        Update: {
          id?: string
          contract_allocation_id?: string
          product_option_id?: string
          total_quantity?: number
          flexible_configuration?: boolean
          alternate_option_ids?: string[] | null
          notes?: string | null
        }
      }
      availability: {
        Row: {
          id: string
          allocation_inventory_id: string
          availability_date: string
          total_available: number
          booked: number
          provisional: number
          held: number
          available: number
          is_closed: boolean
          close_reason: string | null
          last_modified: string
        }
        Insert: {
          id?: string
          allocation_inventory_id: string
          availability_date: string
          total_available: number
          booked?: number
          provisional?: number
          held?: number
          is_closed?: boolean
          close_reason?: string | null
          last_modified?: string
        }
        Update: {
          id?: string
          allocation_inventory_id?: string
          availability_date?: string
          total_available?: number
          booked?: number
          provisional?: number
          held?: number
          is_closed?: boolean
          close_reason?: string | null
          last_modified?: string
        }
      }
      bookings: {
        Row: {
          id: string
          organization_id: string
          booking_reference: string
          booking_status: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          customer_id: string | null
          customer_type: string | null
          package_id: string | null
          is_custom_package: boolean
          booking_date: string
          confirmed_at: string | null
          cancelled_at: string | null
          travel_date_from: string | null
          travel_date_to: string | null
          total_cost: number | null
          total_price: number | null
          margin: number | null
          currency: string
          lead_passenger_name: string | null
          lead_passenger_email: string | null
          lead_passenger_phone: string | null
          lead_passenger_details: any | null
          total_adults: number
          total_children: number
          total_infants: number
          customer_notes: string | null
          internal_notes: string | null
          special_requests: string | null
          source: string | null
          agent_reference: string | null
          payment_status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          booking_reference: string
          booking_status?: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          customer_id?: string | null
          customer_type?: string | null
          package_id?: string | null
          is_custom_package?: boolean
          booking_date?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
          travel_date_from?: string | null
          travel_date_to?: string | null
          total_cost?: number | null
          total_price?: number | null
          currency?: string
          lead_passenger_name?: string | null
          lead_passenger_email?: string | null
          lead_passenger_phone?: string | null
          lead_passenger_details?: any | null
          total_adults?: number
          total_children?: number
          total_infants?: number
          customer_notes?: string | null
          internal_notes?: string | null
          special_requests?: string | null
          source?: string | null
          agent_reference?: string | null
          payment_status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          booking_reference?: string
          booking_status?: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          customer_id?: string | null
          customer_type?: string | null
          package_id?: string | null
          is_custom_package?: boolean
          booking_date?: string
          confirmed_at?: string | null
          cancelled_at?: string | null
          travel_date_from?: string | null
          travel_date_to?: string | null
          total_cost?: number | null
          total_price?: number | null
          currency?: string
          lead_passenger_name?: string | null
          lead_passenger_email?: string | null
          lead_passenger_phone?: string | null
          lead_passenger_details?: any | null
          total_adults?: number
          total_children?: number
          total_infants?: number
          customer_notes?: string | null
          internal_notes?: string | null
          special_requests?: string | null
          source?: string | null
          agent_reference?: string | null
          payment_status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      booking_items: {
        Row: {
          id: string
          booking_id: string
          organization_id: string
          product_id: string
          product_option_id: string | null
          service_date_from: string
          service_date_to: string | null
          nights: number | null
          quantity: number
          adults: number
          children: number
          infants: number
          bed_configuration: string | null
          board_basis: string | null
          contract_allocation_id: string | null
          allocation_inventory_id: string | null
          supplier_id: string | null
          contract_id: string | null
          supplier_reference: string | null
          supplier_status: string | null
          unit_cost: number | null
          unit_price: number
          total_cost: number | null
          total_price: number
          currency: string
          taxes_fees: any | null
          item_status: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          is_sourced: boolean
          is_part_of_package: boolean
          passenger_names: string[] | null
          special_requests: string | null
          item_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          organization_id: string
          product_id: string
          product_option_id?: string | null
          service_date_from: string
          service_date_to?: string | null
          quantity?: number
          adults?: number
          children?: number
          infants?: number
          bed_configuration?: string | null
          board_basis?: string | null
          contract_allocation_id?: string | null
          allocation_inventory_id?: string | null
          supplier_id?: string | null
          contract_id?: string | null
          supplier_reference?: string | null
          supplier_status?: string | null
          unit_cost?: number | null
          unit_price: number
          total_cost?: number | null
          total_price: number
          currency?: string
          taxes_fees?: any | null
          item_status?: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          is_sourced?: boolean
          is_part_of_package?: boolean
          passenger_names?: string[] | null
          special_requests?: string | null
          item_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          organization_id?: string
          product_id?: string
          product_option_id?: string | null
          service_date_from?: string
          service_date_to?: string | null
          quantity?: number
          adults?: number
          children?: number
          infants?: number
          bed_configuration?: string | null
          board_basis?: string | null
          contract_allocation_id?: string | null
          allocation_inventory_id?: string | null
          supplier_id?: string | null
          contract_id?: string | null
          supplier_reference?: string | null
          supplier_status?: string | null
          unit_cost?: number | null
          unit_price?: number
          total_cost?: number | null
          total_price?: number
          currency?: string
          taxes_fees?: any | null
          item_status?: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
          is_sourced?: boolean
          is_part_of_package?: boolean
          passenger_names?: string[] | null
          special_requests?: string | null
          item_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          organization_id: string
          customer_type: string
          first_name: string | null
          last_name: string | null
          company_name: string | null
          email: string | null
          phone: string | null
          address: any | null
          preferences: any | null
          marketing_consent: boolean
          source: string | null
          loyalty_tier: string | null
          total_bookings: number
          total_spent: number
          is_active: boolean
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_type?: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          email?: string | null
          phone?: string | null
          address?: any | null
          preferences?: any | null
          marketing_consent?: boolean
          source?: string | null
          loyalty_tier?: string | null
          total_bookings?: number
          total_spent?: number
          is_active?: boolean
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_type?: string
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          email?: string | null
          phone?: string | null
          address?: any | null
          preferences?: any | null
          marketing_consent?: boolean
          source?: string | null
          loyalty_tier?: string | null
          total_bookings?: number
          total_spent?: number
          is_active?: boolean
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      vw_booking_summary: {
        Row: {
          id: string
          organization_id: string
          booking_reference: string
          booking_status: string
          customer_id: string | null
          customer_name: string | null
          travel_date_from: string | null
          travel_date_to: string | null
          total_passengers: number | null
          total_cost: number | null
          total_price: number | null
          margin: number | null
          margin_percent: number | null
          currency: string
          booking_date: string
          item_count: number | null
          unsourced_items: number | null
          created_by_name: string | null
        }
      }
      vw_inventory_status: {
        Row: {
          organization_name: string
          product_name: string
          option_name: string
          allocation_name: string | null
          availability_date: string
          total_available: number
          booked: number
          provisional: number
          held: number
          available: number
          utilization_percent: number | null
          is_closed: boolean
        }
      }
    }
    Functions: {
      check_availability: {
        Args: {
          p_allocation_inventory_id: string
          p_date_from: string
          p_date_to: string
          p_quantity: number
        }
        Returns: {
          date: string
          available: number
          can_book: boolean
        }[]
      }
    }
    Enums: {
      allocation_type: 'committed' | 'free_sell' | 'on_request' | 'block'
      booking_status: 'quote' | 'provisional' | 'confirmed' | 'cancelled' | 'no_show' | 'completed'
    }
  }
}

// ============================================
// CONVENIENCE TYPES
// ============================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Common entity types
export type Organization = Tables<'organizations'>
export type User = Tables<'users'>
export type Supplier = Tables<'suppliers'>
export type Contract = Tables<'contracts'>
export type Product = Tables<'products'>
export type ProductOption = Tables<'product_options'>
export type ProductType = Tables<'product_types'>
export type ContractAllocation = Tables<'contract_allocations'>
export type AllocationInventory = Tables<'allocation_inventory'>
export type Availability = Tables<'availability'>
export type Booking = Tables<'bookings'>
export type BookingItem = Tables<'booking_items'>
export type Customer = Tables<'customers'>

// View types
export type BookingSummary = Database['public']['Views']['vw_booking_summary']['Row']
export type InventoryStatus = Database['public']['Views']['vw_inventory_status']['Row']

// Enum types
export type AllocationType = Enums<'allocation_type'>
export type BookingStatus = Enums<'booking_status'>
