"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AllocationsTable } from '@/components/allocations/allocations-table'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { SummaryCard } from '@/components/common/SummaryCard'
import { useAllocationsByContract } from '@/lib/hooks/useAllocations'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Plus, 
  Package, 
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface ContractAllocationsSectionProps {
  contractId: string
}

export function ContractAllocationsSection({ contractId }: ContractAllocationsSectionProps) {
  const router = useRouter()
  const { data: allocations = [], isLoading, error } = useAllocationsByContract(contractId)

  const handleCreateAllocation = () => {
    router.push(`/allocations/new?contract=${contractId}`)
  }

  const handleEditAllocation = (allocation: any) => {
    router.push(`/allocations/${allocation.id}/edit`)
  }

  // Calculate stats
  const totalAllocations = allocations.length
  const activeAllocations = allocations.filter(a => a.is_active).length
  const expiringSoon = allocations.filter(a => {
    const daysUntilEnd = Math.ceil((new Date(a.valid_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilEnd <= 30 && daysUntilEnd > 0
  }).length
  const expiredAllocations = allocations.filter(a => new Date(a.valid_to) < new Date()).length

  if (isLoading) {
    return <TableSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Error loading allocations</h3>
            <p className="mt-2 text-muted-foreground">
              {error.message || 'Failed to load allocations'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
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
          icon={<AlertCircle className="h-4 w-4" />}
          description="Allocations ending in 30 days"
          trend={expiringSoon > 0 ? 'down' : 'neutral'}
          variant={expiringSoon > 0 ? 'warning' : 'default'}
        />
        <SummaryCard
          title="Expired"
          value={expiredAllocations.toString()}
          icon={<AlertCircle className="h-4 w-4" />}
          description="Past their end date"
          trend={expiredAllocations > 0 ? 'down' : 'neutral'}
          variant={expiredAllocations > 0 ? 'destructive' : 'default'}
        />
      </div>

      {/* Allocations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Allocations</CardTitle>
            <Button onClick={handleCreateAllocation}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allocation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="No allocations yet"
              description="Create your first allocation to start managing inventory for this contract."
              action={
                <Button onClick={handleCreateAllocation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Allocation
                </Button>
              }
            />
          ) : (
            <AllocationsTable
              allocations={allocations}
              isLoading={isLoading}
              onEdit={handleEditAllocation}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}