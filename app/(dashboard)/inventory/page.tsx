'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAllInventory } from '@/lib/hooks/useAllocationInventory'
import { GlobalInventoryTable } from '@/components/inventory/global-inventory-table'
import { InventoryStatsCards } from '@/components/inventory/inventory-stats-cards'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Package,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Calendar,
  Users
} from 'lucide-react'

export default function InventoryDashboardPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productTypeFilter, setProductTypeFilter] = useState('all')
  const [allocationFilter, setAllocationFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const { data: allInventory = [], isLoading } = useAllInventory()

  const handleRefresh = () => {
    // Refresh data
    window.location.reload()
  }

  const handleExport = () => {
    // Export inventory data
    console.log('Export inventory data')
  }

  const handleViewAllocation = (allocationId: string) => {
    router.push(`/allocations/${allocationId}`)
  }

  const handleViewInventory = (allocationId: string) => {
    router.push(`/allocations/${allocationId}/inventory`)
  }

  // Calculate global stats
  const totalInventoryItems = allInventory.length
  const totalQuantity = allInventory.reduce((sum, item) => sum + item.total_quantity, 0)
  const activeItems = allInventory.filter(item => item.is_active).length
  const flexibleItems = allInventory.filter(item => item.flexible_configuration).length
  const availabilityGenerated = allInventory.filter(item => item.availability_generated).length

  // Filter data based on search and filters
  const filteredInventory = allInventory.filter(item => {
    const matchesSearch = 
      item.product_option?.option_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_option?.option_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_option?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_option?.product?.code?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && item.is_active) ||
      (statusFilter === 'inactive' && !item.is_active) ||
      (statusFilter === 'flexible' && item.flexible_configuration) ||
      (statusFilter === 'generated' && item.availability_generated)

    const matchesProductType = productTypeFilter === 'all' || 
      item.product_option?.product?.product_type?.type_name === productTypeFilter

    return matchesSearch && matchesStatus && matchesProductType
  })

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
        title="Inventory Dashboard"
        description="Global view of all inventory across all allocations"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} className="border-primary/20 text-primary hover:bg-primary/5">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport} className="border-secondary/20 text-secondary hover:bg-secondary/5">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        }
      />

      {/* Global Stats */}
      <InventoryStatsCards
        totalItems={totalInventoryItems}
        totalQuantity={totalQuantity}
        activeItems={activeItems}
        flexibleItems={flexibleItems}
        availabilityGenerated={availabilityGenerated}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            productTypeFilter={productTypeFilter}
            onProductTypeFilterChange={setProductTypeFilter}
            allocationFilter={allocationFilter}
            onAllocationFilterChange={setAllocationFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Analytics</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Inventory Items</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {filteredInventory.length} of {totalInventoryItems} items
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <GlobalInventoryTable
                inventory={filteredInventory}
                isLoading={isLoading}
                onViewAllocation={handleViewAllocation}
                onViewInventory={handleViewInventory}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Inventory by Product Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Chart component would go here
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Utilization Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Chart component would go here
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Inventory Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Alert system would go here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
