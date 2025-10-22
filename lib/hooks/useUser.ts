'use client'

import { useAuth } from './useAuth'

export function useUser() {
  const { profile, loading, isAuthenticated } = useAuth()
  
  return {
    user: profile,
    loading,
    isAuthenticated,
    organization: profile?.organization || null
  }
}