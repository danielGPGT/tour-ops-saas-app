'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  Plus
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ReleaseWarningsWidget } from '@/components/dashboard/ReleaseWarningsWidget'
import { AllocationCard } from './AllocationCard'
import { AllocationFormDialog } from '@/components/contracts/allocations/AllocationFormDialog'
import { AllocationDetailsDrawer } from '@/components/contracts/allocations/AllocationDetailsDrawer'
import { format, differenceInDays, subDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface GlobalAllocationsPageClientProps {
  organizationId: string
}

interface GlobalAllocation {
  id: string
  allocation_name: string
  allocation_type: 'committed' | 'on_request' | 'free_sale'
  total_quantity: number
  sold_quantity?: number
  available_quantity?: number
  total_cost?: number
  cost_per_unit?: number
  currency: string
  valid_from: string
  valid_to: string
  release_days?: number
  status: string
  contract_id: string
  product_id: string
  created_at: string
  contract?: {
    id: string
    contract_name: string
    supplier?: {
      name: string
    }
  }
  product?: {
    id: string
    name: string
    code: string
    product_type: string
  }
  allocation_inventory?: Array<{
    total_quantity: number
    sold_quantity: number
    available_quantity: number
  }>
}

export function GlobalAllocationsPageClient({ organizationId }: GlobalAllocationsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [contractFilter, setContractFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  const { data: allocationsResponse, isLoading, error } = useQuery({
    queryKey: ['global-allocations', organizationId, searchTerm, contractFilter, statusFilter, typeFilter, urgencyFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        organization_id: organizationId,
        page: currentPage.toString(),
        page_size: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(contractFilter !== 'all' && { contract_id: contractFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { allocation_type: typeFilter }),
        ...(urgencyFilter !== 'all' && { urgency: urgencyFilter })
      })

      const response = await fetch(`/api/allocations/global?${params}`)
      if (!response.ok) throw new Error('Failed to fetch allocations')
      return response.json()
    },
    enabled: !!organizationId
  })

  // Get unique contracts for filter dropdown
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-list', organizationId], 
    queryFn: async () => {
      const response = await fetch(`/api/contracts?organization_id=${organizationId}&summary=true`)
      if (!response.ok) throw new Error('Failed to fetch contracts')
      const data = await response.json()
      return data.data || []
    },
    enabled: !!organizationId
  })

  const allocations: GlobalAllocation[] = allocationsResponse?.data || []
  const totalAllocations = allocationsResponse?.total || 0
  const totalPages = allocationsResponse?.totalPages || 0

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!allocations.length) {
      return {
        totalUnits: 0,
        soldUnits: 0,
        availableUnits: 0,
        totalCost: 0,
        utilizationRate: 0,
        urgentAllocations: 0,
        currency: 'GBP'
      }
    }

    let totalUnits = 0
    let soldUnits = 0
    let availableUnits = 0
    let totalCost = 0
    let urgentAllocations = 0
    const currencies = new Set<string>()

    allocations.forEach(allocation => {
      // Calculate inventory from allocation_inventory if available, otherwise use allocation totals
      if (allocation.allocation_inventory && allocation.allocation_inventory.length > 0) {
        allocation.allocation_inventory.forEach(inv => {
          totalUnits += inv.total_quantity || 0
          soldUnits += inv.sold_quantity || 0
          availableUnits += inv.available_quantity || 0
        })
      } else {
        totalUnits += allocation.total_quantity || 0
        soldUnits += allocation.sold_quantity || 0
        availableUnits += (allocation.available_quantity ?? allocation.total_quantity - (allocation.sold_quantity || 0))
      }

      totalCost += allocation.total_cost || 0
      if (allocation.currency) currencies.add(allocation.currency)

      // Check if urgent (release date within 7 days)
      if (allocation.release_days && allocation.valid_from) {
        const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
        const daysUntil = differenceInDays(releaseDate, new Date())
        if (daysUntil >= 0 && daysUntil <= 7 && availableUnits > 0) {
          urgentAllocations++
        }
      }
    })

    const utilizationRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0

    return {
      totalUnits,
      soldUnits,
      availableUnits,
      totalCost,
      utilizationRate,
      urgentAllocations,
      currency: Array.from(currencies)[0] || 'GBP'
    }
  }, [allocations])

  // Filter allocations for urgent releases (for warnings section)
  const urgentAllocations = React.useMemo(() => {
    return allocations.filter(allocation => {
      if (!allocation.release_days || !allocation.valid_from) return false
      
      const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
      const daysUntil = differenceInDays(releaseDate, new Date())
      const hasAvailableUnits = allocation.available_quantity && allocation.available_quantity > 0
      
      return daysUntil >= 0 && daysUntil <= 30 && hasAvailableUnits
    }).sort((a, b) => {
      const aDate = subDays(new Date(a.valid_from!), a.release_days!)
      const bDate = subDays(new Date(b.valid_from!), b.release_days!)
      return aDate.getTime() - bDate.getTime()
    })
  }, [allocations])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading allocations: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Global Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalAllocations} allocation{totalAllocations !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(summaryStats.utilizationRate)}%</div>
            <div className="mt-2">
              <Progress value={summaryStats.utilizationRate} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.soldUnits.toLocaleString()} sold, {summaryStats.availableUnits.toLocaleString()} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.currency} {Math.round(summaryStats.totalCost / 1000).toLocaleString()}k
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {summaryStats.currency} {summaryStats.totalUnits > 0 ? Math.round(summaryStats.totalCost / summaryStats.totalUnits).toLocaleString() : 0}/unit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summaryStats.urgentAllocations}
            </div>
            <p className="text-xs text-muted-foreground">
              Releasing within 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Release Warnings */}
      {urgentAllocations.length > 0 && (
        <Alert variant="destructive" className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900">Urgent Release Deadlines</AlertTitle>
          <AlertDescription className="text-orange-800">
            <div className="mt-2 space-y-2">
              {urgentAllocations.slice(0, 3).map(allocation => {
                const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days!)
                const daysUntil = differenceInDays(releaseDate, new Date())
                
                return (
                  <div key={allocation.id} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <div className="font-medium">{allocation.allocation_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {allocation.contract?.contract_name} • {allocation.available_quantity} units
                      </div>
                    </div>
                    <Badge variant={daysUntil <= 3 ? 'destructive' : 'secondary'}>
                      {daysUntil === 0 ? 'TODAY' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                    </Badge>
                  </div>
                )
              })}
              {urgentAllocations.length > 3 && (
                <div className="text-center pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setUrgencyFilter('urgent')}
                  >
                    + {urgentAllocations.length - 3} more urgent allocations
                  </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search allocations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Contract Filter */}
        <Select value={contractFilter} onValueChange={setContractFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Contracts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contracts</SelectItem>
            {contracts.map((contract: any) => (
              <SelectItem key={contract.id} value={contract.id}>
                {contract.contract_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="committed">Committed</SelectItem>
            <SelectItem value="on_request">On Request</SelectItem>
            <SelectItem value="free_sale">Free Sale</SelectItem>
          </SelectContent>
        </Select>

        {/* Urgency Filter */}
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            <SelectItem value="urgent">Urgent (≤7 days)</SelectItem>
            <SelectItem value="warning">Warning (≤30 days)</SelectItem>
            <SelectItem value="safe">Safe (&gt;30 days)</SelectItem>
          </SelectContent>
        </Select>

        {/* Create Button */}
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Allocation
        </Button>
      </div>

      {/* Allocations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : allocations.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Allocations Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || contractFilter !== 'all' || typeFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first allocation'
                }
              </p>
              {!searchTerm && contractFilter === 'all' && typeFilter === 'all' && urgencyFilter === 'all' && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Allocation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allocations.map(allocation => (
            <AllocationCard
              key={allocation.id}
              allocation={allocation}
              onSelect={() => setSelectedAllocation(allocation.id)}
              showContractInfo={true}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} • {totalAllocations} total allocations
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Allocation Dialog */}
      {isCreating && (
        <AllocationFormDialog
          contractId="" // Will need to be selected in the form
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            // Data will refresh automatically via React Query
          }}
        />
      )}

      {/* Allocation Details Drawer */}
      {selectedAllocation && (
        <AllocationDetailsDrawer
          allocationId={selectedAllocation}
          onClose={() => setSelectedAllocation(null)}
        />
      )}
    </div>
  )
}
