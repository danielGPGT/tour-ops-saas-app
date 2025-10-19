'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { DatabaseStatus } from '@/components/common/DatabaseStatus'
import { ContractWizard } from './ContractWizard'
import { ContractDetailView } from './ContractDetailView'
import { ContractVersionManager } from './ContractVersionManager'
import { ContractTermsEditor } from './ContractTermsEditor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Building, 
  FileText, 
  DollarSign,
  CheckCircle,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  Calendar,
  Clock,
  ArrowLeft
} from 'lucide-react'

interface ContractsPageClientProps {
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

export function ContractsPageClient({
  contracts,
  suppliers,
  stats,
  hasDatabaseError,
  searchQuery,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage
}: ContractsPageClientProps) {
  const router = useRouter()
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'wizard' | 'detail' | 'versions' | 'terms'>('list')
  const [selectedContract, setSelectedContract] = useState<any>(null)

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
    console.log('Contract data:', contractData)
    setViewMode('list')
    // Refresh the page or update the contracts list
    router.refresh()
  }

  const handleWizardCancel = () => {
    setViewMode('list')
  }

  const handleBackToList = () => {
    setViewMode('list')
    setSelectedContract(null)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    router.push(`/contracts?${params.toString()}`)
  }

  const handleClearSearch = () => {
    router.push('/contracts')
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
        onBack={handleBackToList}
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
            <ArrowLeft className="w-4 h-4 mr-2" />
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
            <ArrowLeft className="w-4 h-4 mr-2" />
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

  // Summary Cards Data
  const summaryCards = [
    {
      id: 'total-contracts',
      title: 'Total Contracts',
      value: stats.totalCount,
      icon: <FileText className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />,
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
      icon: <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />,
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
      icon: <Building className="w-5 h-5" style={{ color: 'var(--color-secondary-600)' }} />,
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
      icon: <DollarSign className="w-5 h-5" style={{ color: 'var(--color-primary-600)' }} />,
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
        <div className="font-medium" style={{ color: 'var(--color-foreground)' }}>
          {contract.reference}
        </div>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (contract: any) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
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
        <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
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
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditContract(contract)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ]

  // Bulk Actions
  const bulkActions = [
    {
      label: 'Delete',
      icon: <FileText className="w-4 h-4" />,
      onClick: (items: any[]) => {
        console.log('Delete contracts:', items)
        setSelectedItems([])
      }
    },
    {
      label: 'Export',
      icon: <FileText className="w-4 h-4" />,
      onClick: (items: any[]) => {
        console.log('Export contracts:', items)
        setSelectedItems([])
      }
    }
  ]

  // Empty State
  const emptyState = {
    icon: <FileText className="w-12 h-12" style={{ color: 'var(--color-muted-foreground)' }} />,
    title: 'No contracts found',
    description: 'Get started by creating your first contract.'
  }

  return (
      <EntityPageLayout
        title="Contracts"
      subtitle="Manage supplier contracts and agreements"
        searchPlaceholder="Search contracts..."
        searchParam="q"
        data={contracts}
        columns={columns}
      selectedItems={selectedItems}
      onSelectionChange={setSelectedItems}
      getId={(contract) => contract.id}
      emptyState={emptyState}
        bulkActions={bulkActions}
        getItemName={(contract) => contract.reference}
      getItemId={(contract) => contract.id}
        entityName="contract"
      onSelectionClear={() => setSelectedItems([])}
      isLoading={false}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
      searchParams={{}}
        summaryCards={summaryCards}
        primaryAction={{
        label: 'New Contract',
        icon: <Plus className="w-4 h-4" />,
        onClick: handleCreateContract
      }}
      secondaryActions={[
        {
          label: 'Filter',
          icon: <FileText className="w-4 h-4" />,
          onClick: () => console.log('Filter contracts')
        },
        {
          label: 'Export',
          icon: <FileText className="w-4 h-4" />,
          onClick: () => console.log('Export contracts')
        }
      ]}
        searchQuery={searchQuery}
        onClearSearch={handleClearSearch}
    />
  )
}