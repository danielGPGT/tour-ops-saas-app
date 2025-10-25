'use client'

import { useEffect, useRef } from 'react'

interface UseAutoSaveProps {
  wizardData: any
  currentStep: number
  isDirty: boolean
  onSave: (data: any) => void
}

export function useAutoSave({ wizardData, currentStep, isDirty, onSave }: UseAutoSaveProps) {
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedDataRef = useRef<any>(null)

  useEffect(() => {
    if (isDirty && wizardData) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        const draftData = {
          wizardData,
          currentStep,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }

        // Only save if data has actually changed
        if (JSON.stringify(draftData) !== JSON.stringify(lastSavedDataRef.current)) {
          onSave(draftData)
          lastSavedDataRef.current = draftData
        }
      }, 30000) // 30 seconds
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [isDirty, wizardData, currentStep, onSave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])
}
