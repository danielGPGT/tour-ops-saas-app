'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AllocationForm } from '@/components/allocations/allocation-form'
import { PageHeader } from '@/components/common/PageHeader'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateAllocationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const contractId = searchParams.get('contract')
  const productId = searchParams.get('product')

  const handleSuccess = () => {
    router.push('/allocations')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Allocation"
        description="Set up a new inventory allocation for a contract and product"
        action={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <AllocationForm
        contractId={contractId || undefined}
        productId={productId || undefined}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
