'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Target, 
  Package, 
  BarChart3,
  PieChart,
  AlertTriangle
} from 'lucide-react'
import { useSellingRates, useSellingRateStats, useRateComparison } from '@/lib/hooks/useSellingRates'
import { useAuth } from '@/lib/hooks/useAuth'
import { SellingRatesTable } from './SellingRatesTable'
import { SellingRateFormDialog } from './SellingRateFormDialog'
import { SellingRateDetailsDrawer } from './SellingRateDetailsDrawer'
import { RateComparisonView } from './RateComparisonView'
import { BulkSellingRateOperations } from './BulkSellingRateOperations'
import { ProfitAnalysisCard } from './ProfitAnalysisCard'
import type { Product } from '@/lib/types/product'
import type { ProductOption } from '@/lib/types/product-option'

interface ProductSellingRatesManagerProps {
  product: Product
  productOption: ProductOption
}

export function ProductSellingRatesManager({ product, productOption }: ProductSellingRatesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [rateBasisFilter, setRateBasisFilter] = useState<'all' | 'per_night' | 'per_person' | 'per_unit' | 'per_booking'>('all')
  const [selectedRates, setSelectedRates] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null)
  const [showBulkOperations, setShowBulkOperations] = useState(false)
  const [activeTab, setActiveTab] = useState('rates')

  const { organizationId } = useAuth()

  // Get selling rates for this product option
  const { data: rates = [], isLoading, error } = useSellingRates(organizationId!, {
    product_id: product.id,
    product_option_id: productOption.id,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active'
  })

  // Get rate stats
  const { data: stats } = useSellingRateStats(product.id, productOption.id, organizationId!)

  // Get rate comparison data
  const { data: comparison } = useRateComparison(product.id, productOption.id, organizationId!)

  // Filter rates based on search and filters
  const filteredRates = useMemo(() => {
    let filtered = rates

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(rate => 
        rate.rate_name?.toLowerCase().includes(search) ||
        rate.product?.name?.toLowerCase().includes(search) ||
        rate.product_option?.option_name?.toLowerCase().includes(search)
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
    const totalValue = filteredRates.reduce((sum, rate) => sum + (rate.base_price || 0), 0)
    const avgPrice = totalRates > 0 ? totalValue / totalRates : 0

    // Calculate profit margins if we have comparison data
    let avgMargin = 0
    let totalMargin = 0
    
    if (comparison && comparison.length > 0) {
      const marginsWithData = comparison.filter(c => c.margin !== null)
      if (marginsWithData.length > 0) {
        totalMargin = marginsWithData.reduce((sum, c) => sum + (c.margin || 0), 0)
        avgMargin = totalMargin / marginsWithData.length
      }
    }

    return {
      totalRates,
      activeRates,
      totalValue,
      avgPrice,
      totalMargin,
      avgMargin,
      currency: filteredRates[0]?.currency || 'GBP'
    }
  }, [filteredRates, comparison])

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
        <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <div className="text-destructive">Error loading selling rates</div>
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
                  {summaryStats.currency} {Math.round(summaryStats.avgPrice).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Avg Price</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-2xl font-bold text-blue-600">
                  {summaryStats.currency} {Math.round(summaryStats.avgMargin).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Selling Rates - {productOption.option_name}
              </CardTitle>
              <CardDescription>
                Manage customer-facing pricing for {product.name}
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rates">Rates Table</TabsTrigger>
              <TabsTrigger value="comparison">Rate Comparison</TabsTrigger>
              <TabsTrigger value="analysis">Profit Analysis</TabsTrigger>
            </TabsList>

            {/* Rates Table Tab */}
            <TabsContent value="rates" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rates..."
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
                    <SelectItem value="per_booking">Per Booking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rates Table */}
              <SellingRatesTable
                rates={filteredRates}
                isLoading={isLoading}
                selectedRates={selectedRates}
                onRateSelect={handleRateSelect}
                onBulkSelect={handleBulkSelect}
                comparison={comparison}
              />

              {/* No Results */}
              {!isLoading && filteredRates.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No selling rates found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {rates.length === 0 
                      ? "No selling rates have been created for this product option yet"
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
            </TabsContent>

            {/* Rate Comparison Tab */}
            <TabsContent value="comparison" className="space-y-4">
              <RateComparisonView
                comparison={comparison}
                isLoading={isLoading}
              />
            </TabsContent>

            {/* Profit Analysis Tab */}
            <TabsContent value="analysis" className="space-y-4">
              <ProfitAnalysisCard
                rates={filteredRates}
                comparison={comparison}
                stats={stats}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Rate Dialog */}
      {isCreating && (
        <SellingRateFormDialog
          product={product}
          productOption={productOption}
          onClose={() => setIsCreating(false)}
          onSuccess={() => setIsCreating(false)}
        />
      )}

      {/* Rate Details Drawer */}
      {selectedRateId && (
        <SellingRateDetailsDrawer
          rateId={selectedRateId}
          onClose={() => setSelectedRateId(null)}
        />
      )}

      {/* Bulk Operations Dialog */}
      {showBulkOperations && (
        <BulkSellingRateOperations
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
