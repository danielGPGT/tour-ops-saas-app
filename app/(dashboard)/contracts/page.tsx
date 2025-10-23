'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Building, DollarSign, Calendar, Trash2, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { SearchBar } from '@/components/common/SearchBar'
import { BulkActions } from '@/components/common/BulkActions'
import { SummaryCards } from '@/components/common/SummaryCards'
import { DataTable } from '@/components/common/DataTable'
import { ContractList } from '@/components/contracts/contract-list'
import { ContractCard } from '@/components/contracts/contract-card'
import { ContractStatusTimeline } from '@/components/contracts/contract-timeline'
import { ContractDialogForm } from '@/components/contracts/contract-dialog-form'
import { useContracts, useContractStats, useDeleteContract } from '@/lib/hooks/useContracts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { toast } from 'sonner'
import type { ContractFilters, ContractSort } from '@/lib/types/contract'

export default function ContractsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedContracts, setSelectedContracts] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<ContractFilters>({})
  const [sort, setSort] = React.useState<ContractSort>({ field: 'created_at', direction: 'desc' })
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table')

  const { data: contracts = [], isLoading, error } = useContracts(filters, sort)
  const { data: stats } = useContractStats()
  const { data: suppliers } = useSuppliers()
  const deleteContract = useDeleteContract()

  // Debug: Log the data to see what's being returned
  React.useEffect(() => {
    console.log('Contracts data:', contracts)
    console.log('Loading:', isLoading)
    console.log('Error:', error)
    console.log('Stats:', stats)
  }, [contracts, isLoading, error, stats])


  const filteredContracts = React.useMemo(() => {
    if (!searchTerm) return contracts
    
    return contracts.filter(contract => 
      contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [contracts, searchTerm])

  const handleDelete = async (id: string) => {
    try {
      await deleteContract.mutateAsync(id)
      toast.success('Contract deleted successfully')
    } catch (error) {
      toast.error('Failed to delete contract')
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedContracts.map(id => deleteContract.mutateAsync(id)))
      toast.success(`${selectedContracts.length} contracts deleted successfully`)
      setSelectedContracts([])
    } catch (error) {
      toast.error('Failed to delete contracts')
    }
  }

  const handleDuplicate = (id: string) => {
    // TODO: Implement duplicate functionality
    toast.info('Duplicate functionality coming soon')
  }

  const handleExport = (id: string) => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon')
  }

  const handleShare = (id: string) => {
    // TODO: Implement share functionality
    toast.info('Share functionality coming soon')
  }

  const summaryData = [
    {
      id: 'total-contracts',
      title: 'Total Contracts',
      value: stats?.total_contracts || 0,
      icon: <FileText className="h-4 w-4" />,
      color: 'blue'
    },
    {
      id: 'active-contracts',
      title: 'Active Contracts',
      value: stats?.active_contracts || 0,
      icon: <Building className="h-4 w-4" />,
      color: 'green'
    },
    {
      id: 'expired-contracts',
      title: 'Expired Contracts',
      value: stats?.expired_contracts || 0,
      icon: <Calendar className="h-4 w-4" />,
      color: 'red'
    },
    {
      id: 'draft-contracts',
      title: 'Draft Contracts',
      value: stats?.draft_contracts || 0,
      icon: <FileText className="h-4 w-4" />,
      color: 'yellow'
    }
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Error loading contracts</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contracts</h1>
          <p className="text-muted-foreground">Manage supplier contracts and agreements</p>
        </div>
        <ContractDialogForm
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Contract
            </Button>
          }
        />
      </div>
      {/* Summary Cards */}
      <SummaryCards cards={summaryData} />

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <SearchBar
          placeholder="Search contracts..."
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContracts.length > 0 && (
        <BulkActions
          selectedItems={selectedContracts}
          actions={[
            {
              id: 'delete',
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              variant: 'destructive',
              onClick: handleBulkDelete,
              requiresConfirmation: true,
              confirmationTitle: 'Delete Contracts',
              confirmationDescription: (items) => `Are you sure you want to delete ${items.length} contract${items.length !== 1 ? 's' : ''}? This action cannot be undone.`
            },
            {
              id: 'duplicate',
              label: 'Duplicate',
              icon: <Copy className="h-4 w-4" />,
              variant: 'outline',
              onClick: () => toast.info('Bulk duplicate coming soon')
            },
            {
              id: 'export',
              label: 'Export',
              icon: <Download className="h-4 w-4" />,
              variant: 'outline',
              onClick: () => toast.info('Bulk export coming soon')
            }
          ]}
          getItemName={(id) => {
            const contract = contracts.find(c => c.id === id)
            return contract?.contract_name || 'Unknown Contract'
          }}
          getItemId={(id) => id}
          entityName="contract"
          onSelectionClear={() => setSelectedContracts([])}
        />
      )}

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Contracts</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {viewMode === 'table' ? (
            <ContractList
              contracts={filteredContracts}
              selectedItems={(contracts || []).filter(c => selectedContracts.includes(c.id))}
              onSelectionChange={(items) => setSelectedContracts(items.map(c => c.id))}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onShare={handleShare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {viewMode === 'table' ? (
            <ContractList
              contracts={filteredContracts.filter(c => c.status === 'active')}
              selectedItems={(contracts || []).filter(c => selectedContracts.includes(c.id))}
              onSelectionChange={(items) => setSelectedContracts(items.map(c => c.id))}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onShare={handleShare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts
                .filter(c => c.status === 'active')
                .map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onExport={handleExport}
                    onShare={handleShare}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-4">
          {viewMode === 'table' ? (
            <ContractList
              contracts={filteredContracts.filter(c => c.status === 'expired')}
              selectedItems={(contracts || []).filter(c => selectedContracts.includes(c.id))}
              onSelectionChange={(items) => setSelectedContracts(items.map(c => c.id))}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onShare={handleShare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts
                .filter(c => c.status === 'expired')
                .map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onExport={handleExport}
                    onShare={handleShare}
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {viewMode === 'table' ? (
            <ContractList
              contracts={filteredContracts}
              selectedItems={(contracts || []).filter(c => selectedContracts.includes(c.id))}
              onSelectionChange={(items) => setSelectedContracts(items.map(c => c.id))}
              isLoading={isLoading}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onShare={handleShare}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContracts.map((contract) => (
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onExport={handleExport}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {!isLoading && filteredContracts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No contracts match your search criteria.' : 'Get started by creating your first contract.'}
          </p>
          <div className="flex justify-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => {
                console.log('Creating sample data...')
                // TODO: Implement sample data creation
                alert('Sample data creation not implemented yet. Please create a contract manually.')
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sample Data
            </Button>
            <Button onClick={() => router.push('/contracts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
