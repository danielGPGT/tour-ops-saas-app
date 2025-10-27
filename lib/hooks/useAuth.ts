'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/lib/types/user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  const loadUserProfile = async (authId: string) => {
    try {
      // First, try to get user by email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser?.email) {
        console.error('No email found in auth user')
        return
      }
      
      // Query users table by email
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
          updated_at,
          organization:organizations(
            id,
            name,
            slug,
            is_active
          )
        `)
        .eq('email', authUser.email)
        .single()
      
      if (error) {
        console.error('Error loading user profile:', error)
        console.error('Auth user email:', authUser.email)
        return
      }
      
      console.log('Loaded user profile:', data)
      console.log('Organization data:', data?.organization)
      setProfile(data)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const requireAuth = () => {
    if (!loading && !user) {
      router.push('/login')
    }
  }

  return {
    user,
    profile,
    loading,
    signOut,
    requireAuth,
    isAuthenticated: !!user,
    isProfileLoaded: !!profile
  }
}