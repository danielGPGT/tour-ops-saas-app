export interface Organization {
  id: string
  name: string
  slug: string
  email: string | null
  logo_url: string | null
  default_currency: string
  timezone: string
  subscription_plan: string
  subscription_status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  name: string
  email: string
  logo_url: string | null
  default_currency: string
  timezone: string
  subscription_plan: string
}

export interface OrganizationStats {
  total_users: number
  active_users: number
  pending_invitations: number
  total_bookings: number
  monthly_revenue: number
  subscription_status: string
}
