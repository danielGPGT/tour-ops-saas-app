'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAllocations } from '@/lib/hooks/useAllocations'
import { AllocationsTable } from '@/components/allocations/allocations-table'
import { PageHeader } from '@/components/common/PageHeader'
import { SummaryCard } from '@/components/common/SummaryCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

export default function AllocationsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const { data: allocations = [], isLoading } = useAllocations()

  const handleCreateAllocation = () => {
    router.push('/allocations/new')
  }

  // Filter allocations
  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = allocation.allocation_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allocation.product?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || allocation.allocation_type === typeFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && allocation.is_active) ||
                         (statusFilter === 'inactive' && !allocation.is_active)
    
    return matchesSearch && matchesType && matchesStatus
  })

  // Calculate stats
  const totalAllocations = allocations.length
  const activeAllocations = allocations.filter(a => a.is_active).length
  const expiringSoon = allocations.filter(a => {
    const daysUntilEnd = Math.ceil((new Date(a.valid_to).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilEnd <= 30 && daysUntilEnd > 0
  }).length
  const expiredAllocations = allocations.filter(a => new Date(a.valid_to) < new Date()).length

  const allocationTypeCounts = allocations.reduce((acc, allocation) => {
    acc[allocation.allocation_type] = (acc[allocation.allocation_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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
        title="Allocations"
        description="Manage inventory allocations across all contracts"
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
          description="All allocations in the system"
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

      {/* Allocation Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Allotments"
          value={allocationTypeCounts.allotment?.toString() || '0'}
          icon={<Package className="h-4 w-4" />}
          description="Fixed inventory blocks"
          variant="default"
        />
        <SummaryCard
          title="Free Sell"
          value={allocationTypeCounts.free_sell?.toString() || '0'}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Unlimited availability"
          variant="default"
        />
        <SummaryCard
          title="On Request"
          value={allocationTypeCounts.on_request?.toString() || '0'}
          icon={<AlertTriangle className="h-4 w-4" />}
          description="Manual confirmation required"
          variant="default"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search allocations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="allotment">Allotment</SelectItem>
            <SelectItem value="free_sell">Free Sell</SelectItem>
            <SelectItem value="on_request">On Request</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Allocations Table */}
      <AllocationsTable
        allocations={filteredAllocations}
        isLoading={isLoading}
      />
    </div>
  )
}
