'use client'

import { useState, useCallback, useEffect } from 'react'

interface WizardData {
  contract?: any
  allocations?: any[]
  rates?: any[]
  payments?: any[]
}

interface ExtractedData {
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
}

export function useContractWizard() {
  const [wizardData, setWizardData] = useState<WizardData>({})
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const updateWizardData = useCallback((section: keyof WizardData, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [section]: data
    }))
    setIsDirty(true)
    setHasUnsavedChanges(true)
  }, [])

  const resetWizard = useCallback(() => {
    setWizardData({})
    setExtractedData(null)
    setIsDirty(false)
    setHasUnsavedChanges(false)
  }, [])

  // Auto-save effect
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        // Simulate auto-save
        console.log('Auto-saving wizard data:', wizardData)
        setIsDirty(false)
        setHasUnsavedChanges(false)
      }, 30000) // 30 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [isDirty, wizardData])

  // Apply extracted data to wizard data
  useEffect(() => {
    if (extractedData?.extracted) {
      console.log('🔄 Applying extracted data to wizard:', extractedData.extracted)
      
      const extracted = extractedData.extracted
      const contractData = {
        supplier_name: extracted.supplier_name,
        supplier_id: extracted.supplier_id,
        contract_number: extracted.contract_number,
        contract_name: extracted.contract_name,
        contract_type: extracted.contract_type || 'allocation',
        valid_from: extracted.contract_dates?.valid_from,
        valid_to: extracted.contract_dates?.valid_to,
        signature_deadline: extracted.contract_dates?.signature_deadline,
        currency: extracted.currency || 'USD',
        total_value: extracted.total_value,
        payment_terms: extracted.payment_terms,
        billing_instructions: extracted.billing_instructions,
        cancellation_policy: extracted.cancellation_policy,
        attrition_policy: extracted.attrition_policy,
        service_charge: extracted.service_charge,
        tax_rate: extracted.tax_rate,
        commission_rate: extracted.commission_rate,
        special_terms: extracted.special_terms
      }

      updateWizardData('contract', contractData)

      if (extracted.payment_schedule) {
        updateWizardData('payments', extracted.payment_schedule)
      }
    }
  }, [extractedData, updateWizardData])

  return {
    wizardData,
    updateWizardData,
    resetWizard,
    extractedData,
    setExtractedData,
    isDirty,
    hasUnsavedChanges
  }
}
