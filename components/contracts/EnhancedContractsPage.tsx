'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  Filter, 
  Building, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'
import { ContractWizard } from './ContractWizard'
import { ContractDetailView } from './ContractDetailView'
import { ContractVersionManager } from './ContractVersionManager'
import { ContractTermsEditor } from './ContractTermsEditor'
import { DataTable } from '@/components/common/DataTable'
import { SummaryCards } from '@/components/common/SummaryCards'
import { SearchBar } from '@/components/common/SearchBar'
import { DatabaseStatus } from '@/components/common/DatabaseStatus'
import { Edit, Eye } from 'lucide-react'

interface EnhancedContractsPageProps {
  contracts: any[]
  suppliers: any[]
  stats: any
  hasDatabaseError: boolean
  searchQuery: string
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function EnhancedContractsPage({
  contracts,
  suppliers,
  stats,
  hasDatabaseError,
  searchQuery,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage
}: EnhancedContractsPageProps) {
  const [viewMode, setViewMode] = useState<'list' | 'wizard' | 'detail' | 'versions' | 'terms'>('list')
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState(searchQuery)

  const handleCreateContract = () => {
    setViewMode('wizard')
  }

  const handleViewContract = (contract: any) => {
    setSelectedContract(contract)
    setViewMode('detail')
  }

  const handleEditContract = (contract: any) => {
    setSelectedContract(contract)
    setViewMode('wizard')
  }

  const handleViewVersions = (contract: any) => {
    setSelectedContract(contract)
    setViewMode('versions')
  }

  const handleEditTerms = (contract: any) => {
    setSelectedContract(contract)
    setViewMode('terms')
  }

  const handleWizardComplete = (contractData: any) => {
    // Handle contract creation/update
    console.log('Contract data:', contractData)
    setViewMode('list')
  }

  const handleWizardCancel = () => {
    setViewMode('list')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedContract(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Summary Cards Data
  const summaryCards = [
    {
      id: 'total-contracts',
      title: 'Total Contracts',
      value: stats.totalCount,
      icon: <FileText className="w-5 h-5 text-primary" />,
      description: 'All contracts',
      trend: {
        value: '+12%',
        icon: <TrendingUp className="w-3 h-3" />,
        color: 'text-green-600'
      }
    },
    {
      id: 'active-contracts',
      title: 'Active Contracts',
      value: stats.activeCount,
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      description: 'Currently active',
      trend: {
        value: '+8%',
        icon: <TrendingUp className="w-3 h-3" />,
        color: 'text-green-600'
      }
    },
    {
      id: 'total-suppliers',
      title: 'Total Suppliers',
      value: suppliers.length,
      icon: <Building className="w-5 h-5 text-blue-600" />,
      description: 'With contracts',
      trend: {
        value: '+3%',
        icon: <TrendingUp className="w-3 h-3" />,
        color: 'text-green-600'
      }
    },
    {
      id: 'avg-commission',
      title: 'Avg Commission',
      value: '15.2%',
      icon: <DollarSign className="w-5 h-5 text-purple-600" />,
      description: 'Across all contracts',
      trend: {
        value: '-0.5%',
        icon: <TrendingUp className="w-3 h-3" />,
        color: 'text-red-600'
      }
    }
  ]

  // Table Columns
  const columns = [
    {
      key: 'reference',
      header: 'Reference',
      render: (contract: any) => (
        <div className="font-medium">{contract.reference}</div>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (contract: any) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-muted-foreground" />
          <span>{contract.suppliers?.name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (contract: any) => (
        <Badge className={getStatusColor(contract.status)}>
          {contract.status}
        </Badge>
      )
    },
    {
      key: 'commission',
      header: 'Commission',
      render: (contract: any) => (
        <div className="text-sm font-medium">
          {contract.commission || 'N/A'}%
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (contract: any) => (
        <div className="text-sm text-muted-foreground">
          {formatDate(contract.created_at)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (contract: any) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewContract(contract)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditContract(contract)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  if (hasDatabaseError) {
    return <DatabaseStatus />
  }

  // Render different views based on viewMode
  if (viewMode === 'wizard') {
    return (
      <ContractWizard
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
        initialData={selectedContract}
      />
    )
  }

  if (viewMode === 'detail' && selectedContract) {
    return (
      <ContractDetailView
        contract={selectedContract}
        onEdit={() => handleEditContract(selectedContract)}
        onCreateVersion={() => handleViewVersions(selectedContract)}
        onViewHistory={() => handleViewVersions(selectedContract)}
      />
    )
  }

  if (viewMode === 'versions' && selectedContract) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Contract Versions</h1>
            <p className="text-muted-foreground">
              Manage versions for {selectedContract.reference}
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            Back to Contracts
          </Button>
        </div>
        <ContractVersionManager
          contractId={selectedContract.id}
          versions={selectedContract.contract_versions || []}
          onCreateVersion={(versionData) => console.log('Create version:', versionData)}
          onEditVersion={(versionId, versionData) => console.log('Edit version:', versionId, versionData)}
          onDeleteVersion={(versionId) => console.log('Delete version:', versionId)}
          onActivateVersion={(versionId) => console.log('Activate version:', versionId)}
        />
      </div>
    )
  }

  if (viewMode === 'terms' && selectedContract) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Contract Terms</h1>
            <p className="text-muted-foreground">
              Edit terms for {selectedContract.reference}
            </p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>
            Back to Contracts
          </Button>
        </div>
        <ContractTermsEditor
          contractId={selectedContract.id}
          terms={selectedContract.terms || {}}
          onSave={(terms) => console.log('Save terms:', terms)}
          onCancel={handleBackToList}
        />
      </div>
    )
  }

  // Default list view
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Contracts</h1>
          <p className="text-muted-foreground">
            Manage supplier contracts and agreements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button onClick={handleCreateContract}>
            <Plus className="w-4 h-4 mr-2" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <SearchBar
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Status
              </Button>
              <Button variant="outline" size="sm">
                <Building className="w-4 h-4 mr-2" />
                Supplier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts</CardTitle>
          <CardDescription>
            {totalItems} contracts found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={contracts}
            columns={columns}
            selectedItems={[]}
            onSelectionChange={() => {}}
            getId={(contract) => contract.id}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
