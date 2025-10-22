'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useContract, useUpdateContract, useDeleteContract } from '@/lib/hooks/useContracts'
import { useSuppliers } from '@/lib/hooks/useSuppliers'
import { PaymentSchedulesSection } from '@/components/contracts/payment-schedules-section'
import { CancellationPoliciesSection } from '@/components/contracts/cancellation-policies-section'
import { DeadlinesSection } from '@/components/contracts/deadlines-section'
import { CommissionTiersSection } from '@/components/contracts/commission-tiers-section'
import { ContractAllocationsSection } from '@/components/contracts/contract-allocations-section'
import { SupplierRatesSection } from '@/components/contracts/supplier-rates-section'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { InfoCard } from '@/components/common/InfoCard'
import { DetailRow } from '@/components/common/DetailRow'
import { EnterpriseInlineEdit } from '@/components/common/EnterpriseInlineEdit'
import { DatePicker } from '@/components/ui/date-picker'
import { StatsGrid } from '@/components/common/StatsGrid'
import { ActionButtons } from '@/components/common/ActionButtons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { InlineEditHint } from '@/components/common/InlineEditHint'
import { EmptyState } from '@/components/common/EmptyState'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  FileText, 
  Building, 
  Calendar, 
  DollarSign, 
  Users, 
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  Share2,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const contractId = params.id as string

  const { data: contract, isLoading, error } = useContract(contractId)
  const { data: suppliers } = useSuppliers()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()


  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    try {
      await deleteContract.mutateAsync(contractId)
      toast.success('Contract deleted successfully')
      router.push('/contracts')
    } catch (error) {
      toast.error('Failed to delete contract')
    }
    setDeleteDialogOpen(false)
  }

  const handleUpdate = async (field: string, value: any) => {
    console.log('🔄 handleUpdate called:', { field, value, contractId })
    try {
      console.log('📤 Calling updateContract.mutateAsync with:', {
        id: contractId,
        data: { [field]: value }
      })
      
      const result = await updateContract.mutateAsync({
        id: contractId,
        data: {
          [field]: value
        }
      })
      
      console.log('✅ updateContract.mutateAsync result:', result)
      toast.success('Contract updated successfully')
    } catch (error) {
      console.error('❌ Error updating contract:', error)
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      toast.error('Failed to update contract')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'draft': return <Edit className="h-4 w-4" />
      case 'expired': return <Clock className="h-4 w-4" />
      case 'terminated': return <XCircle className="h-4 w-4" />
      case 'suspended': return <AlertCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
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

  const getContractTypeColor = (type: string) => {
    switch (type) {
      case 'net_rate': return 'default'
      case 'commissionable': return 'secondary'
      case 'allocation': return 'outline'
      case 'on_request': return 'destructive'
      default: return 'default'
    }
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (error || !contract) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contract not found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            The contract you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button 
            onClick={() => router.push('/contracts')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contracts
          </Button>
        </div>
      </div>
    )
  }

  const supplier = suppliers?.find(s => s.id === contract.supplier_id)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {contract.contract_name || 'Unnamed Contract'}
                </span>
                <StatusBadge 
                  status={getStatusColor(contract.status)}
                  icon={getStatusIcon(contract.status)}
                >
                  {contract.status}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {contract.contract_number}
              </p>
            </div>
          </div>
        }
        description={`Contract details and management for ${contract.contract_name || 'this contract'}`}
        actions={
          <div className="flex items-center gap-2">
            <InlineEditHint />
            <ActionButtons
              onDelete={handleDelete}
              onDuplicate={() => toast.info('Duplicate functionality coming soon')}
              onExport={() => toast.info('Export functionality coming soon')}
              onShare={() => toast.info('Share functionality coming soon')}
              variant="compact"
              showEdit={false}
              showDelete={true}
              showDuplicate={true}
              showExport={true}
              showShare={true}
            />
          </div>
        }
        backButton={{
          onClick: () => router.push('/contracts'),
          label: 'Back to Contracts'
        }}
      />

      {/* Stats Grid */}
      <StatsGrid
        columns={4}
        stats={[
          {
            id: 'contract-type',
            label: 'Contract Type',
            value: contract.contract_type,
            icon: <FileText className="h-4 w-4" />
          },
          {
            id: 'valid-period',
            label: 'Valid Period',
            value: `${format(new Date(contract.valid_from), 'MMM dd, yyyy')} - ${format(new Date(contract.valid_to), 'MMM dd, yyyy')}`,
            icon: <Calendar className="h-4 w-4" />
          },
          {
            id: 'commission-rate',
            label: 'Commission Rate',
            value: contract.commission_rate ? `${contract.commission_rate}%` : 'N/A',
            icon: <DollarSign className="h-4 w-4" />
          },
          {
            id: 'currency',
            label: 'Currency',
            value: contract.currency,
            icon: <DollarSign className="h-4 w-4" />
          }
        ]}
      />

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="payments">Payment Schedule</TabsTrigger>
          <TabsTrigger value="cancellation">Cancellation Policy</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="commission">Commission Tiers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Basic Information */}
            <InfoCard
              title="Basic Information"
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Contract Name</label>
                  <EnterpriseInlineEdit
                    value={contract.contract_name || 'Unnamed Contract'}
                    onSave={(value) => handleUpdate('contract_name', value)}
                    placeholder="Enter contract name"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-muted-foreground">Contract Number</span>
                  <span className="text-sm">{contract.contract_number}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Contract Type</label>
                  <EnterpriseInlineEdit
                    value={contract.contract_type}
                    onSave={(value) => handleUpdate('contract_type', value)}
                    placeholder="Select contract type"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <EnterpriseInlineEdit
                    value={contract.status}
                    onSave={(value) => handleUpdate('status', value)}
                    placeholder="Select status"
                  />
                </div>
              </div>
            </InfoCard>

            {/* Supplier Information */}
            <InfoCard
              title="Supplier Information"
              icon={<Building className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <DetailRow
                  label="Supplier"
                  value={supplier?.name || 'Unknown Supplier'}
                />
                <DetailRow
                  label="Supplier Code"
                  value={supplier?.code || 'N/A'}
                />
                <DetailRow
                  label="Supplier Type"
                  value={supplier?.supplier_type || 'N/A'}
                />
                <DetailRow
                  label="Contact Email"
                  value={supplier?.contact_info?.email || 'N/A'}
                />
              </div>
            </InfoCard>
          </div>

          {/* Dates & Financial Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InfoCard
              title="Dates"
              icon={<Calendar className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Valid From</label>
                  {isLoading ? (
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  ) : (
                    <DatePicker
                      date={contract?.valid_from ? new Date(contract.valid_from) : undefined}
                      onDateChange={(date) => {
                        if (date) {
                          handleUpdate('valid_from', date.toISOString().split('T')[0])
                        }
                      }}
                      placeholder="Select valid from date"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Valid To</label>
                  {isLoading ? (
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  ) : (
                    <DatePicker
                      date={contract?.valid_to ? new Date(contract.valid_to) : undefined}
                      onDateChange={(date) => {
                        if (date) {
                          handleUpdate('valid_to', date.toISOString().split('T')[0])
                        }
                      }}
                      placeholder="Select valid to date"
                    />
                  )}
                </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
                  {isLoading ? (
                    <div className="h-10 w-full bg-muted animate-pulse rounded-md" />
                  ) : (
                    <DatePicker
                      date={contract?.signed_date ? new Date(contract.signed_date) : undefined}
                      onDateChange={(date) => {
                        if (date) {
                          handleUpdate('signed_date', date.toISOString().split('T')[0])
                        } else {
                          handleUpdate('signed_date', null)
                        }
                      }}
                      placeholder="Select signed date"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Booking Cutoff</label>
                  <EnterpriseInlineEdit
                    value={contract.booking_cutoff_days ? `${contract.booking_cutoff_days}` : ''}
                    onSave={(value) => handleUpdate('booking_cutoff_days', parseInt(value) || null)}
                    placeholder="Days before arrival"
                  />
                </div>
              </div>
            </InfoCard>

            <InfoCard
              title="Financial Information"
              icon={<DollarSign className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <EnterpriseInlineEdit
                    value={contract.currency || ''}
                    onSave={(value) => handleUpdate('currency', value)}
                    placeholder="Select currency"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                  <EnterpriseInlineEdit
                    value={contract.commission_rate ? `${contract.commission_rate}` : ''}
                    onSave={(value) => handleUpdate('commission_rate', parseFloat(value) || null)}
                    placeholder="Commission percentage"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Commission Type</label>
                  <EnterpriseInlineEdit
                    value={contract.commission_type || ''}
                    onSave={(value) => handleUpdate('commission_type', value)}
                    placeholder="Select commission type"
                  />
                </div>
              </div>
            </InfoCard>
          </div>
        </TabsContent>

        {/* Terms & Conditions Tab */}
        <TabsContent value="terms" className="space-y-6">
          <InfoCard
            title="Terms & Conditions"
            icon={<FileText className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Terms and Conditions</label>
                <EnterpriseInlineEdit
                  value={contract.terms_and_conditions || 'No terms specified'}
                  onSave={(value) => handleUpdate('terms_and_conditions', value)}
                  placeholder="Enter terms and conditions"
                  multiline
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Special Terms</label>
                <EnterpriseInlineEdit
                  value={contract.special_terms || 'No special terms'}
                  onSave={(value) => handleUpdate('special_terms', value)}
                  placeholder="Enter special terms"
                  multiline
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <EnterpriseInlineEdit
                  value={contract.notes || 'No notes'}
                  onSave={(value) => handleUpdate('notes', value)}
                  placeholder="Enter additional notes"
                  multiline
                />
              </div>
            </div>
          </InfoCard>
        </TabsContent>

        {/* Payment Schedule Tab */}
        <TabsContent value="payments" className="space-y-6">
          <PaymentSchedulesSection contractId={contract.id} currency={contract.currency} />
        </TabsContent>

        {/* Cancellation Policy Tab */}
        <TabsContent value="cancellation" className="space-y-6">
          <CancellationPoliciesSection contractId={contract.id} currency={contract.currency} />
        </TabsContent>

        {/* Allocations Tab */}
        <TabsContent value="allocations" className="space-y-6">
          <ContractAllocationsSection contractId={contract.id} />
        </TabsContent>

        {/* Deadlines Tab */}
        <TabsContent value="deadlines" className="space-y-6">
          <DeadlinesSection refType="contract" refId={contract.id} />
        </TabsContent>

        {/* Rates Tab */}
        <TabsContent value="rates" className="space-y-6">
          <SupplierRatesSection contractId={contract.id} />
        </TabsContent>

        {/* Commission Tiers Tab */}
        <TabsContent value="commission" className="space-y-6">
          <CommissionTiersSection contractId={contract.id} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract"
        description={`Are you sure you want to delete "${contract.contract_name || 'this contract'}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}