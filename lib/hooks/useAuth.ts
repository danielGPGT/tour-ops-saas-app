'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/types/user'

export interface AuthError {
  code: string
  message: string
  details?: any
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: AuthError | null
  isAuthenticated: boolean
  isProfileLoaded: boolean
  organizationId: string | null
  userRole: string | null
}

export interface AuthActions {
  signOut: () => Promise<void>
  requireAuth: () => void
  clearError: () => void
  refreshProfile: () => Promise<void>
  hasRole: (role: string | string[]) => boolean
  canEditContracts: () => boolean
  canCreateBookings: () => boolean
}

export type UseAuthReturn = AuthState & AuthActions

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AuthError | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const setAuthError = useCallback((code: string, message: string, details?: any) => {
    setError({ code, message, details })
  }, [])

  const loadUserProfile = useCallback(async (authUser: User) => {
    try {
      if (!authUser?.email) {
        setAuthError('NO_EMAIL', 'No email found in user account')
        return
      }
      
      // Query users table by auth_id - simplified to avoid RLS issues
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          organization_id,
          email,
          first_name,
          last_name,
          role,
          is_active,
          email_verified,
          created_at,
          updated_at
        `)
        .eq('auth_id', authUser.id)
        .eq('is_active', true)
        .single()
      
      if (error) {
        console.error('Profile load error:', error)
        setAuthError(
          'PROFILE_NOT_FOUND',
          'User profile not found or inactive',
          { authId: authUser.id, email: authUser.email }
        )
        return
      }

      // Fetch organization data separately to avoid RLS join issues
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, is_active')
        .eq('id', data.organization_id)
        .single()

      if (orgError || !orgData?.is_active) {
        console.error('Organization error:', orgError)
        setAuthError('ORG_INACTIVE', 'Organization not found or inactive')
        return
      }

      // Combine user and organization data
      const profileData = {
        ...data,
        organization: orgData
      }
      
      setProfile(profileData)
      clearError()
    } catch (err) {
      console.error('Error loading user profile:', err)
      setAuthError('PROFILE_LOAD_ERROR', 'Failed to load user profile')
    }
  }, [supabase, setAuthError, clearError])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user)
    }
  }, [user, loadUserProfile])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setAuthError('SESSION_ERROR', 'Failed to get session', error)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setProfile(null)
          clearError()
        }
        
        setLoading(false)
      } catch (err) {
        console.error('Session initialization error:', err)
        setAuthError('INIT_ERROR', 'Authentication initialization failed')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setProfile(null)
          clearError()
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, loadUserProfile, clearError, setAuthError])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        setAuthError('SIGNOUT_ERROR', 'Failed to sign out', error)
        return
      }
      
      setUser(null)
      setProfile(null)
      clearError()
      router.push('/login')
    } catch (err) {
      console.error('Error signing out:', err)
      setAuthError('SIGNOUT_ERROR', 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }, [supabase, router, clearError, setAuthError])

  const requireAuth = useCallback(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const hasRole = useCallback((requiredRole: string | string[]): boolean => {
    if (!profile?.role) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(profile.role)
  }, [profile?.role])

  const canEditContracts = useCallback((): boolean => {
    return hasRole(['owner', 'admin'])
  }, [hasRole])

  const canCreateBookings = useCallback((): boolean => {
    return hasRole(['owner', 'admin', 'agent'])
  }, [hasRole])

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isProfileLoaded: !!profile,
    organizationId: profile?.organization_id ?? null,
    userRole: profile?.role ?? null,
    signOut,
    requireAuth,
    clearError,
    refreshProfile,
    hasRole,
    canEditContracts,
    canCreateBookings
  }
}