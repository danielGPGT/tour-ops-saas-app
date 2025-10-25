'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

interface ExtractedContractData {
  supplier_name?: string
  supplier_id?: string
  contract_number?: string
  contract_name?: string
  contract_type?: string
  valid_from?: string
  valid_to?: string
  currency?: string
  total_value?: number
  payment_terms?: string
  cancellation_policy?: string
  commission_rate?: number
  allocations?: any[]
  payment_schedule?: any[]
  release_schedule?: any[]
  raw_text?: string
}

interface ExtractionResult {
  success: boolean
  confidence: number
  extracted: ExtractedContractData
  warnings: string[]
  document_url: string
  document_name: string
}

export function usePDFExtraction() {
  const [isExtracting, setIsExtracting] = useState(false)
  const { user } = useAuth()

  const extractFromPDF = async (file: File): Promise<ExtractionResult> => {
    setIsExtracting(true)

    try {
      console.log('🔐 AUTH CHECK:')
      console.log('👤 User object:', user)
      console.log('🆔 User ID:', user?.id)
      console.log('📧 User email:', user?.email)
      
      if (!user?.id) {
        console.error('❌ USER NOT AUTHENTICATED!')
        console.error('User object:', user)
        throw new Error('User not authenticated')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Let the API handle organization ID resolution
      // This avoids RLS issues on the client side
      const response = await fetch('/api/contracts/extract', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.id}`
        },
        body: formData
      })

      if (!response.ok) {
        let errorMessage = 'Failed to extract contract data'
        try {
          const error = await response.json()
          errorMessage = error.error || error.details || errorMessage
          console.error('API Error:', error)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('PDF extraction failed:', error)
      throw error

    } finally {
      setIsExtracting(false)
    }
  }

  return {
    extractFromPDF,
    isExtracting
  }
}
