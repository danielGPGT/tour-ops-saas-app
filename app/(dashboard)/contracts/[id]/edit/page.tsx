'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContract } from '@/lib/hooks/useContracts'
import { ContractForm } from '@/components/contracts/contract-form'
import { PageHeader } from '@/components/common/PageHeader'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditContractPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const { data: contract, isLoading, error } = useContract(contractId)

  const handleSuccess = () => {
    router.push(`/contracts/${contractId}`)
  }

  const handleCancel = () => {
    router.push(`/contracts/${contractId}`)
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contract not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            The contract you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            onClick={() => router.push('/contracts')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Contract
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {contract.contract_name || contract.contract_number}
              </p>
            </div>
          </div>
        }
        backButton={{
          href: `/contracts/${contractId}`,
          label: 'Back to Contract'
        }}
      />

      <ContractForm
        contract={contract}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}