export interface UserProfile {
  id: string
  auth_id: string
  email: string
  first_name: string
  last_name: string
  role: string
  permissions: Record<string, any> | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  organization: OrganizationInfo
}

export interface OrganizationInfo {
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

export interface TeamMember {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  avatar_url: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
}

export interface PendingInvitation {
  id: string
  email: string
  role: string
  invited_by: string
  invited_by_name: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  created_at: string
}

export interface ProfileUpdateData {
  first_name: string
  last_name: string
  phone?: string
  timezone?: string
  avatar_url?: string
}

export interface InviteTeamMemberData {
  email: string
  role: 'admin' | 'manager' | 'agent' | 'viewer'
  message?: string
  expires_days: number
}
