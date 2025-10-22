'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Building, 
  Calendar, 
  DollarSign, 
  FileText, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ActionButtons } from '@/components/common/ActionButtons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { Contract } from '@/types/contract'

interface ContractListProps {
  contracts: Contract[]
  isLoading?: boolean
  selectedItems?: Contract[]
  onSelectionChange?: (items: Contract[]) => void
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onExport?: (id: string) => void
  onShare?: (id: string) => void
}

export function ContractList({ 
  contracts, 
  isLoading = false,
  selectedItems = [],
  onSelectionChange,
  onDelete,
  onDuplicate,
  onExport,
  onShare
}: ContractListProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [selectedContract, setSelectedContract] = React.useState<Contract | null>(null)

  const handleDelete = (contract: Contract) => {
    setSelectedContract(contract)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedContract && onDelete) {
      onDelete(selectedContract.id)
    }
    setDeleteDialogOpen(false)
    setSelectedContract(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'destructive'
      case 'draft': return 'warning'
      case 'terminated': return 'secondary'
      case 'suspended': return 'warning'
      default: return 'secondary'
    }
  }

  const columns = [
    {
      key: 'contract_name',
      header: 'Contract Name',
      render: (contract: Contract) => (
        <div className="space-y-1">
          <div className="font-medium">{contract.contract_name || 'Unnamed Contract'}</div>
          <div className="text-sm text-muted-foreground">
            {contract.contract_number}
          </div>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (contract: Contract) => (
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{contract.supplier?.name || 'Unknown Supplier'}</div>
            <div className="text-sm text-muted-foreground">
              {contract.supplier?.code || 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'valid_period',
      header: 'Valid Period',
      render: (contract: Contract) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {format(new Date(contract.valid_from), 'MMM dd, yyyy')}
          </div>
          <div className="text-sm text-muted-foreground">
            to {format(new Date(contract.valid_to), 'MMM dd, yyyy')}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (contract: Contract) => (
        <StatusBadge 
          status={getStatusColor(contract.status)}
          size="sm"
        >
          {contract.status}
        </StatusBadge>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (contract: Contract) => (
        <Badge variant="outline" className="font-mono">
          {contract.currency}
        </Badge>
      ),
    },
    {
      key: 'commission_rate',
      header: 'Commission',
      render: (contract: Contract) => (
        <div className="text-sm">
          {contract.commission_rate ? `${contract.commission_rate}%` : 'N/A'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (contract: Contract) => (
        <ActionButtons
          onView={() => router.push(`/contracts/${contract.id}`)}
          onEdit={() => router.push(`/contracts/${contract.id}/edit`)}
          onDelete={() => handleDelete(contract)}
          onDuplicate={() => onDuplicate?.(contract.id)}
          onExport={() => onExport?.(contract.id)}
          onShare={() => onShare?.(contract.id)}
          showEdit={true}
          showDelete={true}
          showDuplicate={true}
          showExport={true}
          showShare={true}
          size="sm"
          variant="compact"
        />
      ),
    },
  ]

  if (isLoading) {
    return <DataTable columns={columns} data={[]} isLoading={true} />
  }

  return (
    <>
      <DataTable 
        columns={columns} 
        data={contracts} 
        selectedItems={selectedItems}
        onSelectionChange={onSelectionChange}
        getId={(contract) => contract.id}
        onRowClick={(contract) => router.push(`/contracts/${contract.id}`)}
        isLoading={isLoading}
      />
      
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract"
        description={`Are you sure you want to delete "${selectedContract?.contract_name}"? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </>
  )
}

// Contract Card Component for grid view
export function ContractCard({ contract }: { contract: Contract }) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'expired': return 'destructive'
      case 'draft': return 'warning'
      case 'terminated': return 'secondary'
      case 'suspended': return 'warning'
      default: return 'secondary'
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{contract.contract_name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {contract.contract_number}
              </div>
            </div>
            <StatusBadge 
              status={getStatusColor(contract.status)}
              size="sm"
            >
              {contract.status}
            </StatusBadge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Supplier Info */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{contract.supplier?.name}</div>
              <div className="text-sm text-muted-foreground">
                {contract.supplier?.code}
              </div>
            </div>
          </div>

          {/* Valid Period */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {format(new Date(contract.valid_from), 'MMM dd, yyyy')} - {format(new Date(contract.valid_to), 'MMM dd, yyyy')}
            </div>
          </div>

          {/* Currency & Commission */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono">
              {contract.currency}
            </Badge>
            {contract.commission_rate && (
              <div className="text-sm text-muted-foreground">
                {contract.commission_rate}% commission
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/${contract.id}`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract"
        description={`Are you sure you want to delete "${contract.contract_name}"? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          // TODO: Implement delete
          setDeleteDialogOpen(false)
        }}
        variant="destructive"
      />
    </>
  )
}
