'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Search, Filter, Calendar, DollarSign, TrendingUp, Package } from 'lucide-react'
import { useSupplierRatesByContract, useSupplierRates } from '@/lib/hooks/useContracts'
import { useAuth } from '@/lib/hooks/useAuth'
import { SupplierRatesTable } from './SupplierRatesTable'
import { SupplierRateFormDialog } from './SupplierRateFormDialog'
import { SupplierRateDetailsDrawer } from './SupplierRateDetailsDrawer'
import { BulkRateOperations } from './BulkRateOperations'

interface ContractSupplierRatesTabProps {
  contractId: string
  contract?: any
}

export function ContractSupplierRatesTab({ contractId, contract }: ContractSupplierRatesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [rateBasisFilter, setRateBasisFilter] = useState<'all' | 'per_night' | 'per_person' | 'per_unit'>('all')
  const [selectedRates, setSelectedRates] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [showBulkOperations, setShowBulkOperations] = useState(false)

  const { organizationId } = useAuth()

  // Get supplier rates for this contract
  const { data: rates = [], isLoading, error } = useSupplierRates(organizationId!, {
    contract_id: contractId,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  })

  // Filter rates based on search and filters
  const filteredRates = useMemo(() => {
    let filtered = rates

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(rate => 
        rate.rate_name?.toLowerCase().includes(search) ||
        rate.product?.name?.toLowerCase().includes(search) ||
        rate.product_option?.option_name?.toLowerCase().includes(search) ||
        rate.supplier?.name?.toLowerCase().includes(search)
      )
    }

    if (rateBasisFilter !== 'all') {
      filtered = filtered.filter(rate => rate.rate_basis === rateBasisFilter)
    }

    return filtered
  }, [rates, searchTerm, rateBasisFilter])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRates = filteredRates.length
    const activeRates = filteredRates.filter(r => r.is_active).length
    const totalValue = filteredRates.reduce((sum, rate) => sum + (rate.base_cost || 0), 0)
    const avgCost = totalRates > 0 ? totalValue / totalRates : 0

    const ratesByBasis = filteredRates.reduce((acc, rate) => {
      acc[rate.rate_basis] = (acc[rate.rate_basis] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalRates,
      activeRates,
      totalValue,
      avgCost,
      ratesByBasis,
      currency: filteredRates[0]?.currency || 'GBP'
    }
  }, [filteredRates])

  const handleCreateRate = () => {
    setIsCreating(true)
  }

  const handleRateSelect = (rateId: string) => {
    setSelectedRateId(rateId)
  }

  const handleBulkSelect = (rateIds: string[]) => {
    setSelectedRates(rateIds)
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-destructive">Error loading supplier rates</div>
        <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">{summaryStats.totalRates}</p>
                <p className="text-xs text-muted-foreground">Total Rates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold text-green-600">{summaryStats.activeRates}</p>
                <p className="text-xs text-muted-foreground">Active Rates</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">
                  {summaryStats.currency} {summaryStats.totalValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold">
                  {summaryStats.currency} {Math.round(summaryStats.avgCost).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Avg Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Rates</CardTitle>
              <CardDescription>
                Manage pricing from suppliers for this contract
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedRates.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkOperations(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Bulk Actions ({selectedRates.length})
                </Button>
              )}
              <Button onClick={handleCreateRate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rate
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rates, products, suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={rateBasisFilter} onValueChange={(value: any) => setRateBasisFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rate Types</SelectItem>
                <SelectItem value="per_night">Per Night</SelectItem>
                <SelectItem value="per_person">Per Person</SelectItem>
                <SelectItem value="per_unit">Per Unit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rates Table */}
          <SupplierRatesTable
            rates={filteredRates}
            isLoading={isLoading}
            selectedRates={selectedRates}
            onRateSelect={handleRateSelect}
            onBulkSelect={handleBulkSelect}
          />

          {/* No Results */}
          {!isLoading && filteredRates.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No rates found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {rates.length === 0 
                  ? "No supplier rates have been created for this contract yet"
                  : "No rates match your current filters"
                }
              </p>
              {rates.length === 0 && (
                <Button onClick={handleCreateRate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rate
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Rate Dialog */}
      {isCreating && (
        <SupplierRateFormDialog
          contractId={contractId}
          contract={contract}
          onClose={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      )}

      {/* Rate Details Drawer */}
      {selectedRateId && (
        <SupplierRateDetailsDrawer
          rateId={selectedRateId}
          onClose={() => setSelectedRateId(null)}
        />
      )}

      {/* Bulk Operations Dialog */}
      {showBulkOperations && (
        <BulkRateOperations
          rateIds={selectedRates}
          onClose={() => setShowBulkOperations(false)}
          onComplete={() => {
            setShowBulkOperations(false)
            setSelectedRates([])
          }}
        />
      )}
    </div>
  )
}
