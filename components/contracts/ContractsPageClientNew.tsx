'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { DatabaseStatus } from '@/components/common/DatabaseStatus'
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
import { ContractSheetQuickForm } from './ContractSheetQuickForm'

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

export function ContractsPageClientNew({
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
  const [openQuickForm, setOpenQuickForm] = useState(false)

  const handleCreateContract = () => {
    setOpenQuickForm(true)
  }

  const handleViewContract = (contract: any) => {
    router.push(`/contracts/${contract.id}`)
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
      key: 'contract_type',
      header: 'Type',
      render: (contract: any) => (
        <div className="text-sm font-medium">
          {contract.contract_type ? (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              contract.contract_type === 'net_rate' ? 'bg-green-100 text-green-800' :
              contract.contract_type === 'commissionable' ? 'bg-blue-100 text-blue-800' :
              contract.contract_type === 'allocation' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {contract.contract_type.replace('_', ' ')}
            </span>
          ) : (
            <span className="text-muted-foreground">Not set</span>
          )}
        </div>
      )
    },
    {
      key: 'signed_date',
      header: 'Signed',
      render: (contract: any) => (
        <div className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {contract.signed_date ? formatDate(contract.signed_date) : 'Not signed'}
        </div>
      )
    },
    {
      key: 'document',
      header: 'Document',
      render: (contract: any) => (
        <div className="flex items-center space-x-2">
          {contract.signed_document_url ? (
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-600">Uploaded</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">None</span>
            </div>
          )}
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
            onClick={() => handleViewContract(contract)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-4 h-4" />
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
    <>
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
    <ContractSheetQuickForm
      suppliers={suppliers}
      trigger={<span />}
      open={openQuickForm}
      onOpenChange={setOpenQuickForm}
      onSuccess={() => {
        setOpenQuickForm(false)
        router.refresh()
      }}
    />
    </>
  )
}
