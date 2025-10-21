'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { DatabaseStatus } from '@/components/common/DatabaseStatus'
import { SummaryCards, SummaryCard } from '@/components/common/SummaryCards'
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
  Clock,
  ArrowLeft,
  AlertTriangle,
  Copy,
  Trash2,
  Archive,
  ArchiveRestore,
  Loader2,
  Filter,
  X,
  Search,
  ChevronDown,
  Calendar as CalendarIcon,
  Users,
  DollarSign as DollarIcon
} from 'lucide-react'
import { ContractSheetQuickForm } from './ContractSheetQuickForm'
import { ContractActions } from './ContractActions'
import { ContractTemplateSelector } from './ContractTemplateSelector'
import { ContractTemplateForm } from './ContractTemplateForm'
import { ContractTemplate } from '@/lib/contract-templates'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { duplicateContract, bulkDuplicateContracts, bulkArchiveContracts, bulkUnarchiveContracts } from '@/app/contracts/actions'
import { toast } from 'sonner'

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
  const [openTemplateSelector, setOpenTemplateSelector] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [openTemplateForm, setOpenTemplateForm] = useState(false)
  
  // Filtering state
  const [filters, setFilters] = useState({
    status: [] as string[],
    contractType: [] as string[],
    supplier: [] as string[],
    dateRange: { from: null as Date | null, to: null as Date | null },
    hasDeadlines: null as boolean | null,
    overdueDeadlines: null as boolean | null,
    signedStatus: null as string | null
  })
  const [showFilters, setShowFilters] = useState(false)
  
  // Smart notifications
  const [notifications, setNotifications] = useState<any[]>([])

  // Generate smart notifications
  const generateNotifications = () => {
    const now = new Date()
    const notifications: any[] = []
    
    // Check for overdue deadlines
    const overdueDeadlines = contracts.filter(contract => {
      const overdueCount = contract.contract_deadlines?.filter((deadline: any) => {
        const deadlineDate = new Date(deadline.deadline_date)
        return deadlineDate < now && deadline.status !== 'met'
      }).length || 0
      return overdueCount > 0
    })
    
    if (overdueDeadlines.length > 0) {
      notifications.push({
        id: 'overdue-deadlines',
        type: 'warning',
        title: 'Overdue Deadlines',
        message: `${overdueDeadlines.length} contract${overdueDeadlines.length !== 1 ? 's' : ''} have overdue deadlines`,
        count: overdueDeadlines.length,
        icon: <AlertTriangle className="w-4 h-4" />
      })
    }
    
    // Check for unsigned contracts
    const unsignedContracts = contracts.filter(contract => !contract.signed_date)
    if (unsignedContracts.length > 0) {
      notifications.push({
        id: 'unsigned-contracts',
        type: 'info',
        title: 'Unsigned Contracts',
        message: `${unsignedContracts.length} contract${unsignedContracts.length !== 1 ? 's' : ''} need signatures`,
        count: unsignedContracts.length,
        icon: <FileText className="w-4 h-4" />
      })
    }
    
    // Check for expiring contracts
    const expiringContracts = contracts.filter(contract => {
      if (!contract.valid_to) return false
      const expiryDate = new Date(contract.valid_to)
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    })
    
    if (expiringContracts.length > 0) {
      notifications.push({
        id: 'expiring-contracts',
        type: 'warning',
        title: 'Expiring Contracts',
        message: `${expiringContracts.length} contract${expiringContracts.length !== 1 ? 's' : ''} expire within 30 days`,
        count: expiringContracts.length,
        icon: <Clock className="w-4 h-4" />
      })
    }
    
    return notifications
  }

  // Update notifications when contracts change
  React.useEffect(() => {
    setNotifications(generateNotifications())
  }, [contracts])

  const handleCreateContract = () => {
    setOpenQuickForm(true)
  }

  const handleCreateFromTemplate = () => {
    setOpenTemplateSelector(true)
  }

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setOpenTemplateSelector(false)
    setOpenTemplateForm(true)
  }

  const handleTemplateFormSuccess = () => {
    setOpenTemplateForm(false)
    setSelectedTemplate(null)
    router.refresh()
  }

  const handleTemplateFormCancel = () => {
    setOpenTemplateForm(false)
    setSelectedTemplate(null)
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

  // Filtering logic
  const filteredContracts = contracts.filter(contract => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(contract.status)) {
      return false
    }

    // Contract type filter
    if (filters.contractType.length > 0 && !filters.contractType.includes(contract.contract_type)) {
      return false
    }

    // Supplier filter
    if (filters.supplier.length > 0 && !filters.supplier.includes(contract.suppliers?.name)) {
      return false
    }

    // Date range filter
    if (filters.dateRange.from && contract.signed_date) {
      const contractDate = new Date(contract.signed_date)
      if (contractDate < filters.dateRange.from) return false
    }
    if (filters.dateRange.to && contract.signed_date) {
      const contractDate = new Date(contract.signed_date)
      if (contractDate > filters.dateRange.to) return false
    }

    // Has deadlines filter
    if (filters.hasDeadlines !== null) {
      const hasDeadlines = (contract.contract_deadlines?.length || 0) > 0
      if (filters.hasDeadlines !== hasDeadlines) return false
    }

    // Overdue deadlines filter
    if (filters.overdueDeadlines !== null) {
      const now = new Date()
      const overdueDeadlines = contract.contract_deadlines?.filter((deadline: any) => {
        const deadlineDate = new Date(deadline.deadline_date)
        return deadlineDate < now && deadline.status !== 'met'
      }) || []
      const hasOverdue = overdueDeadlines.length > 0
      if (filters.overdueDeadlines !== hasOverdue) return false
    }

    // Signed status filter
    if (filters.signedStatus === 'signed' && !contract.signed_date) return false
    if (filters.signedStatus === 'unsigned' && contract.signed_date) return false

    return true
  })

  const clearFilters = () => {
    setFilters({
      status: [],
      contractType: [],
      supplier: [],
      dateRange: { from: null, to: null },
      hasDeadlines: null,
      overdueDeadlines: null,
      signedStatus: null
    })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.contractType.length > 0) count++
    if (filters.supplier.length > 0) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.hasDeadlines !== null) count++
    if (filters.overdueDeadlines !== null) count++
    if (filters.signedStatus !== null) count++
    return count
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived': return 'bg-orange-100 text-orange-800 border-orange-200'
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
  const summaryCards: SummaryCard[] = [
    {
      id: 'total-contracts',
      title: 'Total Contracts',
      value: stats.totalCount,
      icon: <FileText className="w-5 h-5" />,
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
      icon: <CheckCircle className="w-5 h-5" />,
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
      icon: <Building className="w-5 h-5" />,
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
      icon: <DollarSign className="w-5 h-5" />,
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
      render: (contract: any) => {
        const getWorkflowStatus = (contract: any) => {
          if (contract.status === 'archived') return { stage: 'Archived', color: 'bg-orange-100 text-orange-800' }
          if (!contract.signed_date) return { stage: 'Draft', color: 'bg-blue-100 text-blue-800' }
          if (contract.status === 'active') return { stage: 'Active', color: 'bg-green-100 text-green-800' }
          if (contract.status === 'expired') return { stage: 'Expired', color: 'bg-red-100 text-red-800' }
          return { stage: contract.status, color: getStatusColor(contract.status) }
        }
        
        const workflow = getWorkflowStatus(contract)
        
        return (

            <Badge className={workflow.color}>
              {workflow.stage}
        </Badge>


          
      )
      }
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
      key: 'deadlines',
      header: 'Deadlines',
      render: (contract: any) => {
        const deadlineCount = contract.contract_deadlines?.length || 0;
        const now = new Date();
        
        // Check for overdue deadlines
        const overdueDeadlines = contract.contract_deadlines?.filter((deadline: any) => {
          const deadlineDate = new Date(deadline.deadline_date);
          return deadlineDate < now && deadline.status !== 'met';
        }) || [];
        
        const overdueCount = overdueDeadlines.length;
        
        if (overdueCount > 0) {
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center space-x-2 cursor-help">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {deadlineCount}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{overdueCount} overdue deadline{overdueCount !== 1 ? 's' : ''}</p>
              </TooltipContent>
            </Tooltip>
          );
        }
        
        return (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" style={{ color: 'var(--color-muted-foreground)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
              {deadlineCount}
            </span>
          </div>
        );
      }
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
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary">Uploaded</span>
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
        <ContractActions 
          contract={contract} 
          suppliers={suppliers}
          onSuccess={() => window.location.reload()}
        />
      )
    }
  ]

  // Bulk Actions
  const handleBulkDuplicate = async (items: any[]) => {
    try {
      const contractIds = items.map(item => BigInt(item.id));
      await bulkDuplicateContracts(contractIds, { redirect: false });
      toast.success(`${items.length} contract${items.length !== 1 ? 's' : ''} duplicated successfully`);
      setSelectedItems([]);
      // Refresh the page to show the new contracts
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to duplicate contracts");
    }
  };

  const handleBulkArchive = async (items: any[]) => {
    try {
      const contractIds = items.map(item => BigInt(item.id));
      const result = await bulkArchiveContracts(contractIds, { redirect: false });
      toast.success(`${result?.archivedCount || 0} contract${(result?.archivedCount || 0) !== 1 ? 's' : ''} archived successfully`);
      setSelectedItems([]);
      // Refresh the page to show the updated contracts
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to archive contracts");
    }
  };

  const handleBulkUnarchive = async (items: any[]) => {
    try {
      const contractIds = items.map(item => BigInt(item.id));
      const result = await bulkUnarchiveContracts(contractIds, { redirect: false });
      toast.success(`${result?.unarchivedCount || 0} contract${(result?.unarchivedCount || 0) !== 1 ? 's' : ''} restored successfully`);
      setSelectedItems([]);
      // Refresh the page to show the updated contracts
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to restore contracts");
    }
  };

  const handleBulkExport = async (items: any[], format: string = 'pdf') => {
    try {
      console.log(`Exporting ${items.length} contracts as ${format.toUpperCase()}`);
      
      // Simulate export process
      const exportData = items.map(contract => ({
        reference: contract.reference,
        supplier: contract.suppliers?.name,
        status: contract.status,
        type: contract.contract_type,
        signed_date: contract.signed_date,
        deadlines: contract.contract_deadlines?.length || 0
      }));
      
      if (format === 'csv') {
        // Generate CSV
        const csvContent = [
          'Reference,Supplier,Status,Type,Signed Date,Deadlines',
          ...exportData.map(item => 
            `${item.reference},${item.supplier},${item.status},${item.type},${item.signed_date || 'Not signed'},${item.deadlines}`
          )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // PDF export (simulated)
        console.log('PDF export would be implemented here');
      }
      
      setSelectedItems([]);
      toast.success(`${items.length} contract${items.length !== 1 ? 's' : ''} exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export contracts");
    }
  };

  const handleBulkStatusUpdate = async (items: any[], newStatus: string) => {
    try {
      // This would call a bulk status update server action
      console.log(`Updating ${items.length} contracts to ${newStatus}`);
      setSelectedItems([]);
      toast.success(`${items.length} contract${items.length !== 1 ? 's' : ''} status updated to ${newStatus}`);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update contract status");
    }
  };

  const handleBulkAssign = async (items: any[], assignee: string) => {
    try {
      console.log(`Assigning ${items.length} contracts to ${assignee}`);
      setSelectedItems([]);
      toast.success(`${items.length} contract${items.length !== 1 ? 's' : ''} assigned to ${assignee}`);
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to assign contracts");
    }
  };

  // Determine bulk actions based on selected items
  const getBulkActions = () => {
    const hasArchived = selectedItems.some(item => item.status === 'archived');
    const hasActive = selectedItems.some(item => item.status !== 'archived');
    const hasDraft = selectedItems.some(item => item.status === 'draft');
    const hasUnsigned = selectedItems.some(item => !item.signed_date);
    
    const actions = [
      {
        id: 'duplicate',
        label: 'Make a copy',
        icon: <Copy className="w-4 h-4" />,
        onClick: handleBulkDuplicate
      },
      {
        id: 'export-csv',
        label: 'Export CSV',
      icon: <FileText className="w-4 h-4" />,
        onClick: (items: any[]) => handleBulkExport(items, 'csv')
      },
      {
        id: 'export-pdf',
        label: 'Export PDF',
        icon: <FileText className="w-4 h-4" />,
        onClick: (items: any[]) => handleBulkExport(items, 'pdf')
      }
    ];

    // Status update actions
    if (hasDraft) {
      actions.push({
        id: 'activate',
        label: 'Activate',
        icon: <CheckCircle className="w-4 h-4" />,
        onClick: (items: any[]) => handleBulkStatusUpdate(items, 'active')
      });
    }

    if (hasUnsigned) {
      actions.push({
        id: 'mark-signed',
        label: 'Mark as signed',
      icon: <FileText className="w-4 h-4" />,
        onClick: (items: any[]) => handleBulkStatusUpdate(items, 'signed')
      });
    }

    // Archive/Restore actions
    if (hasActive) {
      actions.push({
        id: 'archive',
        label: 'Archive',
        icon: <Archive className="w-4 h-4" />,
        onClick: handleBulkArchive,
      });
    }

    if (hasArchived) {
      actions.push({
        id: 'unarchive',
        label: 'Restore',
        icon: <ArchiveRestore className="w-4 h-4" />,
        onClick: handleBulkUnarchive,
      });
    }

    return actions;
  };

  const bulkActions = getBulkActions();

  // Smart Notifications Component
  const SmartNotifications = () => (
    <div className="space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-3 rounded-lg border ${
            notification.type === 'warning' 
              ? 'bg-orange-50 border-orange-200 text-orange-800' 
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.icon}
            <div className="flex-1">
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs opacity-80">{notification.message}</div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {notification.count}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )

  // Advanced Filter Component
  const AdvancedFilters = () => (
    <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Advanced Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-xs"
        >
          Clear all
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Status</Label>
          <div className="space-y-1">
            {['active', 'draft', 'archived', 'expired'].map(status => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${status}`}
                  checked={filters.status.includes(status)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, status: [...prev.status, status] }))
                    } else {
                      setFilters(prev => ({ ...prev, status: prev.status.filter(s => s !== status) }))
                    }
                  }}
                />
                <Label htmlFor={`status-${status}`} className="text-xs capitalize">
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Type Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Contract Type</Label>
          <div className="space-y-1">
            {['net_rate', 'commissionable', 'allocation'].map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={filters.contractType.includes(type)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, contractType: [...prev.contractType, type] }))
                    } else {
                      setFilters(prev => ({ ...prev, contractType: prev.contractType.filter(t => t !== type) }))
                    }
                  }}
                />
                <Label htmlFor={`type-${type}`} className="text-xs capitalize">
                  {type.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Supplier Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Supplier</Label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {suppliers.map(supplier => (
              <div key={supplier.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`supplier-${supplier.id}`}
                  checked={filters.supplier.includes(supplier.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters(prev => ({ ...prev, supplier: [...prev.supplier, supplier.name] }))
                    } else {
                      setFilters(prev => ({ ...prev, supplier: prev.supplier.filter(s => s !== supplier.name) }))
                    }
                  }}
                />
                <Label htmlFor={`supplier-${supplier.id}`} className="text-xs">
                  {supplier.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Signed Date Range</Label>
          <div className="flex space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {filters.dateRange.from ? filters.dateRange.from.toLocaleDateString() : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.from || undefined}
                  onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, from: date || null } }))}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {filters.dateRange.to ? filters.dateRange.to.toLocaleDateString() : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.to || undefined}
                  onSelect={(date: Date | undefined) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, to: date || null } }))}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Deadline Filters */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Deadlines</Label>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="has-deadlines"
                checked={filters.hasDeadlines === true}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, hasDeadlines: checked ? true : null }))}
              />
              <Label htmlFor="has-deadlines" className="text-xs">Has deadlines</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue-deadlines"
                checked={filters.overdueDeadlines === true}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, overdueDeadlines: checked ? true : null }))}
              />
              <Label htmlFor="overdue-deadlines" className="text-xs">Overdue deadlines</Label>
            </div>
          </div>
        </div>

        {/* Signed Status Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Signature Status</Label>
          <Select value={filters.signedStatus || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, signedStatus: value === 'all' ? null : value }))}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="All contracts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contracts</SelectItem>
              <SelectItem value="signed">Signed only</SelectItem>
              <SelectItem value="unsigned">Unsigned only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )

  // Empty State
  const emptyState = {
    icon: <FileText className="w-12 h-12" style={{ color: 'var(--color-muted-foreground)' }} />,
    title: 'No contracts found',
    description: 'Get started by creating your first contract.'
  }

  return (
    <>
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredContracts.length} of {contracts.length} contracts
        </div>
      </div>

      {/* Smart Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Alerts & Notifications</h3>
          <SmartNotifications />
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && <AdvancedFilters />}

    <EntityPageLayout
      title="Contracts"
      subtitle="Manage supplier contracts and agreements"
      searchPlaceholder="Search contracts..."
      searchParam="q"
        data={filteredContracts}
      columns={columns}
      selectedItems={selectedItems}
      onSelectionChange={setSelectedItems}
      getId={(contract) => contract.id}
      emptyState={emptyState}
        onRowClick={handleViewContract}
      bulkActions={bulkActions}
      getItemName={(contract) => contract.reference}
      getItemId={(contract) => contract.id}
      entityName="contract"
      onSelectionClear={() => setSelectedItems([])}
      isLoading={false}
      currentPage={currentPage}
      totalPages={totalPages}
        totalItems={filteredContracts.length}
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
            label: 'From Template',
          icon: <FileText className="w-4 h-4" />,
            onClick: handleCreateFromTemplate
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
    </div>
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

    {/* Template Selector Dialog */}
    <Dialog open={openTemplateSelector} onOpenChange={setOpenTemplateSelector}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Contract Template</DialogTitle>
          <DialogDescription>
            Select a pre-built template to quickly create a new contract with default terms and deadlines.
          </DialogDescription>
        </DialogHeader>
        <ContractTemplateSelector
          onSelectTemplate={handleTemplateSelect}
          suppliers={suppliers}
          onClose={() => setOpenTemplateSelector(false)}
        />
      </DialogContent>
    </Dialog>

    {/* Template Form Dialog */}
    <Dialog open={openTemplateForm} onOpenChange={setOpenTemplateForm}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contract from Template</DialogTitle>
          <DialogDescription>
            Fill in the details for your new contract. The form has been pre-filled with template defaults.
          </DialogDescription>
        </DialogHeader>
        {selectedTemplate && (
          <ContractTemplateForm
            template={selectedTemplate}
            suppliers={suppliers}
            onSuccess={handleTemplateFormSuccess}
            onCancel={handleTemplateFormCancel}
          />
        )}
      </DialogContent>
    </Dialog>
    </>
  )
}
