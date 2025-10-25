'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAllocationsByContract } from '@/lib/hooks/useAllocations'
import { useContract } from '@/lib/hooks/useContracts'
import { AllocationsTable } from '@/components/allocations/allocations-table'
import { PageHeader } from '@/components/common/PageHeader'
import { SummaryCard } from '@/components/common/SummaryCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, Calendar, AlertTriangle, Plus } from 'lucide-react'

export default function ContractAllocationsPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string
  
  const { data: contract, isLoading: contractLoading } = useContract(contractId)
  const { data: allocations, isLoading: allocationsLoading } = useAllocationsByContract(contractId)
  
  const isLoading = contractLoading || allocationsLoading

  // Calculate stats
  const totalAllocations = allocations?.length || 0
  const activeAllocations = allocations?.filter(a => a.is_active).length || 0
  const expiringSoon = allocations?.filter(a => {
    const daysUntilEnd = Math.ceil((new Date(a.valid_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilEnd <= 30 && daysUntilEnd > 0
  }).length || 0
  const expiredAllocations = allocations?.filter(a => new Date(a.valid_to) < new Date()).length || 0

  const handleCreateAllocation = () => {
    router.push(`/allocations/new?contract=${contractId}`)
  }

  const handleEditAllocation = (allocation: any) => {
    router.push(`/allocations/${allocation.id}/edit`)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contract Allocations"
        description={`Manage inventory allocations for ${contract?.contract_name}`}
        action={
          <Button onClick={handleCreateAllocation}>
            <Plus className="mr-2 h-4 w-4" />
            Add Allocation
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Allocations"
          value={totalAllocations.toString()}
          icon={<Package className="h-4 w-4" />}
          description="All allocations for this contract"
        />
        <SummaryCard
          title="Active Allocations"
          value={activeAllocations.toString()}
          icon={<Calendar className="h-4 w-4" />}
          description="Currently active allocations"
          trend={activeAllocations > 0 ? 'up' : 'neutral'}
        />
        <SummaryCard
          title="Expiring Soon"
          value={expiringSoon.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Allocations ending in 30 days"
          trend={expiringSoon > 0 ? 'down' : 'neutral'}
          variant={expiringSoon > 0 ? 'warning' : 'default'}
        />
        <SummaryCard
          title="Expired"
          value={expiredAllocations.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Past their end date"
          trend={expiredAllocations > 0 ? 'down' : 'neutral'}
          variant={expiredAllocations > 0 ? 'destructive' : 'default'}
        />
      </div>

      {/* Contract Info */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{contract?.contract_name}</h3>
            <p className="text-sm text-muted-foreground">
              Contract #{contract?.contract_number} • {contract?.supplier?.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={contract?.is_active ? 'default' : 'secondary'}>
              {contract?.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Allocations</h3>
            <Button variant="outline" onClick={handleCreateAllocation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allocation
            </Button>
          </div>
          
          <AllocationsTable
            allocations={allocations || []}
            isLoading={allocationsLoading}
            onEdit={handleEditAllocation}
          />
        </div>
      </div>
    </div>
  )
}
