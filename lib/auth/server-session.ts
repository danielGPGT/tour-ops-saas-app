import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export interface AuthSession {
  user: User
  organizationId: string
  userId: string
  userRole: string
  isActive: boolean
}

/**
 * Get authenticated user session with organization context
 * Throws error if user is not authenticated or doesn't have valid org access
 */
export async function getServerSession(): Promise<AuthSession> {
  const supabase = await createClient()
  
  // Get the authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // Get user profile with organization info
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(`
      id,
      organization_id,
      role,
      is_active,
      email_verified,
      organization:organizations!inner(
        id,
        name,
        is_active
      )
    `)
    .eq('auth_id', user.id)
    .eq('is_active', true)
    .single()

  if (profileError || !profile) {
    console.error('Profile error:', profileError)
    throw new Error('User profile not found or inactive')
  }

  // Check if organization is active
  if (!profile.organization?.is_active) {
    throw new Error('Organization is inactive')
  }

  return {
    user,
    organizationId: profile.organization_id,
    userId: profile.id,
    userRole: profile.role || 'agent',
    isActive: profile.is_active
  }
}

/**
 * Get session with redirect on failure (for pages)
 */
export async function getServerSessionOrRedirect(): Promise<AuthSession> {
  try {
    return await getServerSession()
  } catch (error) {
    console.error('Auth error:', error)
    redirect('/login')
  }
}

/**
 * Get optional session without throwing (for public pages)
 */
export async function getOptionalServerSession(): Promise<AuthSession | null> {
  try {
    return await getServerSession()
  } catch (error) {
    return null
  }
}

/**
 * Check if user has required role
 */
export function hasRole(session: AuthSession, requiredRole: string | string[]): boolean {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
  return roles.includes(session.userRole)
}

/**
 * Check if user can edit contracts
 */
export function canEditContracts(session: AuthSession): boolean {
  return hasRole(session, ['owner', 'admin'])
}

/**
 * Check if user can create bookings
 */
export function canCreateBookings(session: AuthSession): boolean {
  return hasRole(session, ['owner', 'admin', 'agent'])
}

/**
 * Check if user can view reports
 */
export function canViewReports(session: AuthSession): boolean {
  return hasRole(session, ['owner', 'admin'])
}

/**
 * Get organization-scoped database client
 * All queries will be automatically filtered by organization
 */
export async function getOrgScopedClient() {
  const session = await getServerSession()
  const supabase = await createClient()
  
  return {
    supabase,
    session,
    organizationId: session.organizationId
  }
}
