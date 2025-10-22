'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { InvitationData } from '@/lib/types/auth'

export function useInvitation() {
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const validateToken = useCallback(async (token: string) => {
    if (!token) {
      setError('No invitation token provided')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_token', {
        p_token: token
      })

      if (rpcError) {
        throw rpcError
      }

      if (!data) {
        throw new Error('No data returned from validation')
      }

      if (!data.is_valid) {
        setError(data.error_message || 'Invalid invitation token')
        setInvitation(null)
        return
      }

      setInvitation(data)
      setError(null)
    } catch (error) {
      console.error('Error validating invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to validate invitation')
      setInvitation(null)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const clearInvitation = useCallback(() => {
    setInvitation(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    invitation,
    loading,
    error,
    validateToken,
    clearInvitation,
    isValid: !!invitation?.is_valid
  }
}