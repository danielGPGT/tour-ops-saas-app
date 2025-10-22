'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ContractForm } from '@/components/contracts/contract-form'
import { PageHeader } from '@/components/common/PageHeader'
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NewContractPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/contracts')
  }

  const handleCancel = () => {
    router.push('/contracts')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Contract
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set up a new supplier contract with terms and conditions
              </p>
            </div>
          </div>
        }
        backButton={{
          href: '/contracts',
          label: 'Back to Contracts'
        }}
      />

      <ContractForm
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}