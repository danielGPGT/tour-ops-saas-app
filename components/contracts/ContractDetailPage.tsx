'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Edit, 
  Plus, 
  History, 
  FileText, 
  DollarSign, 
  Calendar,
  User,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  ArrowLeft,
  Download,
  Upload,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { ContractSheetQuickForm } from './ContractSheetQuickForm'
import { ContractVersionManager } from './ContractVersionManager'
import { ContractDeadlinesManager } from './ContractDeadlinesManager'
import { toast } from 'sonner'

interface ContractDetailPageProps {
  contract: any
  suppliers: any[]
  onBack?: () => void
}

export function ContractDetailPage({ 
  contract, 
  suppliers, 
  onBack 
}: ContractDetailPageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [versions, setVersions] = useState<any[]>(contract?.contract_versions || [])
  const [deadlines, setDeadlines] = useState<any[]>(contract?.contract_deadlines || [])

  const handleEdit = () => {
    setEditSheetOpen(true)
  }

  const handleEditSuccess = () => {
    setEditSheetOpen(false)
    // Reload contract data
    window.location.reload()
  }

  const handleBack = () => {
    onBack?.() || router.back()
  }

  // Safety check - contract should always exist since it's passed from server
  if (!contract) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Contract not found</h3>
        <p className="text-muted-foreground mb-4">The contract you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'net_rate': return 'bg-green-100 text-green-800'
      case 'commissionable': return 'bg-blue-100 text-blue-800'
      case 'allocation': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const summaryCards = [
    {
      title: 'Status',
      value: contract.status,
      icon: <CheckCircle className="h-4 w-4" />,
      color: getStatusColor(contract.status)
    },
    {
      title: 'Type',
      value: contract.contract_type?.replace('_', ' ') || 'Not set',
      icon: <FileText className="h-4 w-4" />,
      color: getTypeColor(contract.contract_type)
    },
    {
      title: 'Versions',
      value: versions.length.toString(),
      icon: <History className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      title: 'Deadlines',
      value: deadlines.length.toString(),
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-orange-100 text-orange-800'
    }
  ]

  return (
    <EntityPageLayout
      title={contract.reference}
      subtitle={`${contract.suppliers?.name || 'Unknown Supplier'} • ${contract.contract_type?.replace('_', ' ') || 'Contract'}`}
      data={[]}
      columns={[]}
      selectedItems={[]}
      onSelectionChange={() => {}}
      getId={() => ''}
      bulkActions={[]}
      getItemName={() => ''}
      getItemId={() => ''}
      entityName="contract"
      onSelectionClear={() => {}}
      currentPage={1}
      totalPages={1}
      totalItems={1}
      itemsPerPage={1}
      onPageChange={() => {}}
      summaryCards={summaryCards}
      primaryAction={{
        label: 'Edit Contract',
        icon: <Edit className="h-4 w-4" />,
        onClick: handleEdit
      }}
      secondaryActions={[
        {
          label: 'Back to Contracts',
          icon: <ArrowLeft className="h-4 w-4" />,
          onClick: handleBack
        }
      ]}
    >
      {/* Contract Detail Tabs */}
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="terms">Terms</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Contract Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reference</label>
                      <p className="text-sm font-medium">{contract.reference}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                      <p className="text-sm font-medium">{contract.suppliers?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <Badge className={getTypeColor(contract.contract_type)}>
                        {contract.contract_type?.replace('_', ' ') || 'Not set'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
                      <p className="text-sm font-medium">
                        {contract.signed_date ? new Date(contract.signed_date).toLocaleDateString() : 'Not signed'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm font-medium">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document */}
              {contract.signed_document_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Signed Contract Document
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="font-medium">Contract Document</p>
                          <p className="text-sm text-muted-foreground">
                            Signed: {contract.signed_date ? new Date(contract.signed_date).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {contract.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Internal Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Terms Tab */}
          <TabsContent value="terms" className="mt-6">
            <div className="grid gap-6">
              {/* Terms and Conditions */}
              {contract.terms_and_conditions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Terms and Conditions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">{contract.terms_and_conditions}</pre>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Special Terms */}
              {contract.special_terms && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm">{contract.special_terms}</pre>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {!contract.terms_and_conditions && !contract.special_terms && (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No terms available</h3>
                    <p className="text-muted-foreground mb-4">
                      This contract doesn't have any terms and conditions or special terms defined.
                    </p>
                    <Button onClick={handleEdit} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Add Terms
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Versions Tab */}
          <TabsContent value="versions" className="mt-6">
            <ContractVersionManager
              contractId={BigInt(contract.id)}
              versions={versions}
              onCreateVersion={(versionData) => {
                console.log('Create version:', versionData)
                // TODO: Implement create version
              }}
              onEditVersion={(versionId, versionData) => {
                console.log('Edit version:', versionId, versionData)
                // TODO: Implement edit version
              }}
              onDeleteVersion={(versionId) => {
                console.log('Delete version:', versionId)
                // TODO: Implement delete version
              }}
              onActivateVersion={(versionId) => {
                console.log('Activate version:', versionId)
                // TODO: Implement activate version
              }}
            />
          </TabsContent>

          {/* Deadlines Tab */}
          <TabsContent value="deadlines" className="mt-6">
            <ContractDeadlinesManager
              contractId={BigInt(contract.id)}
              deadlines={deadlines}
              onCreateDeadline={(deadlineData) => {
                console.log('Create deadline:', deadlineData)
                // TODO: Implement create deadline
              }}
              onEditDeadline={(deadlineId, deadlineData) => {
                console.log('Edit deadline:', deadlineId, deadlineData)
                // TODO: Implement edit deadline
              }}
              onDeleteDeadline={(deadlineId) => {
                console.log('Delete deadline:', deadlineId)
                // TODO: Implement delete deadline
              }}
              onMarkComplete={(deadlineId) => {
                console.log('Mark deadline complete:', deadlineId)
                // TODO: Implement mark complete
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Contract Sheet */}
      <ContractSheetQuickForm
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        contractId={contract.id.toString()}
        suppliers={suppliers}
        onSuccess={handleEditSuccess}
      />
    </EntityPageLayout>
  )
}
