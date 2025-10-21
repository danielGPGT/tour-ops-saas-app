'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Edit, 
  ArrowLeft, 
  Building, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  FileText,
  Tag,
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  Download,
  Trash2,
  Plus, 
  History, 
  FileCheck,
  AlertTriangle,
  Save,
  X,
  Pencil,
  Package
} from 'lucide-react'
import { ContractSheetQuickForm } from './ContractSheetQuickForm'
// Removed ContractVersionManager - no longer needed
import { ContractDeadlinesTable } from './ContractDeadlinesTable'
import { AuditLogsTable } from './AuditLogsTable'
import { ContractLinkedProducts } from './ContractLinkedProducts'
import { ContractRatesManager } from './ContractRatesManager'
import { ContractAllocationsManager } from './ContractAllocationsManager'
import { SummaryCards } from '@/components/common/SummaryCards'
import { ContractStatusDropdown, ContractTypeDropdown } from '@/components/common/InlineDropdown'
import { createDeadline, updateDeadline, deleteDeadline, markDeadlineComplete, updateDeadlineStatus } from '@/app/contracts/deadlines/actions'
import { updateContract } from '@/app/contracts/actions'
// Removed contract version actions - no longer needed
import { toast } from 'sonner'
import { format } from 'date-fns'

// Validation schemas
const contractUpdateSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  status: z.enum(['active', 'inactive', 'draft', 'expired']),
  contract_type: z.enum(['net_rate', 'commissionable', 'allocation']).optional(),
  signed_date: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  special_terms: z.string().optional(),
  notes: z.string().optional(),
})

type ContractUpdateData = z.infer<typeof contractUpdateSchema>

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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  // Removed versions state - no longer needed
  const [deadlines, setDeadlines] = useState<any[]>(contract?.contract_deadlines || [])
  
  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form setup for inline editing
  const form = useForm<ContractUpdateData>({
    resolver: zodResolver(contractUpdateSchema),
    defaultValues: {
      reference: contract?.reference || '',
      status: contract?.status || 'active',
      contract_type: contract?.contract_type || 'net_rate',
      signed_date: contract?.signed_date ? new Date(contract.signed_date).toISOString().split('T')[0] : '',
      terms_and_conditions: contract?.terms_and_conditions || '',
      special_terms: contract?.special_terms || '',
      notes: contract?.notes || '',
    }
  })

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'terms', 'rates', 'allocations', 'products', 'deadlines', 'analytics', 'audit'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleEdit = () => {
    setEditSheetOpen(true)
  }

  const handleEditSuccess = () => {
    setEditSheetOpen(false)
    router.refresh()
  }

  const handleBack = () => {
    onBack?.() || router.back()
  }

  // Inline editing handlers
  const handleStartEdit = (field: string) => {
    setEditingField(field)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    form.reset()
  }

  const handleSaveEdit = async (field: string) => {
    try {
      setIsSaving(true)
      const value = form.getValues(field as keyof ContractUpdateData)
      
      // Prepare update data based on the field being edited
      const updateData: any = {}
      
      switch (field) {
        case 'reference':
          updateData.reference = value
          break
        case 'status':
          updateData.status = value
          break
        case 'contract_type':
          updateData.contract_type = value
          break
        case 'signed_date':
          updateData.signed_date = value ? new Date(value) : null
          break
        case 'terms_and_conditions':
          updateData.terms_and_conditions = value
          break
        case 'special_terms':
          updateData.special_terms = value
          break
        case 'notes':
          updateData.notes = value
          break
        default:
          throw new Error(`Unknown field: ${field}`)
      }
      
      // Update the contract in the database
      await updateContract(BigInt(contract.id), {
        supplier_id: BigInt(contract.supplier_id),
        reference: updateData.reference ?? contract.reference,
        status: updateData.status ?? contract.status,
        contract_type: updateData.contract_type ?? contract.contract_type,
        signed_date: updateData.signed_date ?? (contract.signed_date ? new Date(contract.signed_date) : undefined),
        signed_document_url: contract.signed_document_url,
        terms_and_conditions: updateData.terms_and_conditions ?? contract.terms_and_conditions,
        special_terms: updateData.special_terms ?? contract.special_terms,
        notes: updateData.notes ?? contract.notes,
        currency: contract.currency || 'USD',
        cancellation_policies: contract.cancellation_policies || [],
        payment_policies: contract.payment_policies || [],
      }, { redirect: false })
      
      toast.success(`${field} updated successfully`)
      setEditingField(null)
      router.refresh()
    } catch (error) {
      toast.error(`Failed to update ${field}`)
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit(field)
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Inline editing components
  const InlineTextEditor = ({ field, value, placeholder, className = "" }: {
    field: string
    value: string
    placeholder?: string
    className?: string
  }) => {
    const isEditing = editingField === field
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            {...form.register(field as keyof ContractUpdateData)}
            onKeyDown={(e) => handleKeyDown(e, field)}
            className="flex-1"
            placeholder={placeholder}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => handleSaveEdit(field)}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    
    return (
      <div 
        className={`${className} cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors group flex items-center gap-2`}
        onClick={() => handleStartEdit(field)}
      >
        <span className="flex-1">{value || placeholder}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  const InlineSelectEditor = ({ field, value, options, className = "" }: {
    field: string
    value: string
    options: { value: string; label: string }[]
    className?: string
  }) => {
    const isEditing = editingField === field
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Select
            value={form.watch(field as keyof ContractUpdateData)}
            onValueChange={(value) => form.setValue(field as keyof ContractUpdateData, value)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={() => handleSaveEdit(field)}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    }
    
    const selectedOption = options.find(opt => opt.value === value)
    return (
      <div 
        className={`${className} cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors group flex items-center gap-2`}
        onClick={() => handleStartEdit(field)}
      >
        <span className="flex-1">{selectedOption?.label || value}</span>
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    )
  }

  const InlineTextareaEditor = ({ field, value, placeholder, className = "" }: {
    field: string
    value: string
    placeholder?: string
    className?: string
  }) => {
    const isEditing = editingField === field
    
    if (isEditing) {
      return (
        <div className="space-y-2">
          <Textarea
            {...form.register(field as keyof ContractUpdateData)}
            onKeyDown={(e) => handleKeyDown(e, field)}
            className="min-h-[100px]"
            placeholder={placeholder}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => handleSaveEdit(field)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelEdit}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )
    }
    
    return (
      <div 
        className={`${className} min-h-[100px] p-3 border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group`}
        onClick={() => handleStartEdit(field)}
      >
        {value ? (
          <div className="whitespace-pre-wrap text-sm">{value}</div>
        ) : (
          <div className="text-muted-foreground text-sm">{placeholder}</div>
        )}
        <div className="flex justify-end mt-2">
          <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    )
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
      case 'active': return 'bg-primary/10 text-primary'
      case 'draft': return 'bg-yellow-500/10 text-yellow-600'
      case 'expired': return 'bg-destructive/10 text-destructive'
      case 'inactive': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'net_rate': return 'bg-primary/10 text-primary'
      case 'commissionable': return 'bg-secondary/10 text-secondary'
      case 'allocation': return 'bg-accent text-accent-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  // Calculate analytics data
  const getAnalyticsData = () => {
    const totalRevenue = 0 // TODO: Calculate from bookings
    const totalBookings = 0 // TODO: Calculate from bookings
    const commissionRate = contract.commission_rate || 0 // Get from contract directly
    
    const pendingDeadlines = deadlines.filter(d => d.status === 'pending')
    const upcomingDeadlines = pendingDeadlines.filter(d => 
      new Date(d.deadline_date) >= new Date()
    )
    
    return {
      totalRevenue,
      totalBookings,
      commissionRate,
      totalDeadlines: deadlines.length,
      pendingDeadlines: pendingDeadlines.length,
      upcomingDeadlines: upcomingDeadlines.length
    }
  }

  const analytics = getAnalyticsData()

  // Summary cards data
  const summaryCards = [
    {
      id: 'status',
      title: 'Contract Status',
      value: contract.status,
      icon: <CheckCircle className="w-4 h-4 text-primary-600" />,
      change: contract.contract_type?.replace('_', ' ') || 'Not set',
      changeType: 'neutral' as const,
      description: `${contract.suppliers?.name || 'Unknown Supplier'}`
    },
    {
      id: 'commission',
      title: 'Commission Rate',
      value: `${analytics.commissionRate}%`,
      icon: <DollarSign className="w-4 h-4 text-primary-600" />,
      change: contract.currency || 'USD',
      changeType: 'neutral' as const,
      description: 'Contract commission rate'
    },
    {
      id: 'deadlines',
      title: 'Upcoming Deadlines',
      value: analytics.upcomingDeadlines.toString(),
      icon: <Calendar className="w-4 h-4 text-primary-600" />,
      change: `${analytics.pendingDeadlines} pending`,
      changeType: 'neutral' as const,
      description: 'Important dates and milestones'
    },
    {
      id: 'performance',
      title: 'Performance',
      value: `$${analytics.totalRevenue.toLocaleString()}`,
      icon: <BarChart3 className="w-4 h-4 text-primary-600" />,
      change: `${analytics.totalBookings} bookings`,
      changeType: 'positive' as const,
      description: 'Revenue and booking metrics'
    }
  ]

  const handleDocumentView = () => {
    if (contract.signed_document_url) {
      window.open(contract.signed_document_url, '_blank')
    }
  }

  const handleDocumentDownload = () => {
    if (contract.signed_document_url) {
      const link = document.createElement('a')
      link.href = contract.signed_document_url
      link.download = `contract-${contract.reference}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderDocumentManagement = () => {
    if (!contract.signed_document_url) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
          <p className="text-muted-foreground mb-4">
            Upload the signed contract document to keep it organized
          </p>
          <Button onClick={handleEdit} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )
    }

  return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">Signed Contract Document</p>
              <p className="text-sm text-muted-foreground">
                Signed: {contract.signed_date ? new Date(contract.signed_date).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDocumentView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button variant="outline" size="sm" onClick={handleDocumentDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <InlineTextEditor
                field="reference"
                value={contract.reference}
                placeholder="Enter contract reference"
                className="text-2xl font-bold text-foreground"
              />
              <ContractStatusDropdown
                value={contract.status}
                onValueChange={async (value) => {
                  form.setValue('status', value as 'active' | 'inactive' | 'draft' | 'expired')
                  await handleSaveEdit('status')
                }}
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
              />
            </div>
            <p className="text-foreground mt-1 flex flex-col">
              {contract.suppliers?.name || 'Unknown Supplier'} <span className="text-muted-foreground">Created {format(new Date(contract.created_at), 'MMM dd, yyyy')}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="mb-6">
        <SummaryCards cards={summaryCards} />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Terms
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Rates
          </TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Allocations
          </TabsTrigger>
          <TabsTrigger value="deadlines" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Deadlines
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Linked Products
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Audit Logs
          </TabsTrigger>
          </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Contract Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contract Details */}
              <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="w-5 h-5" />
                  Contract Details
                  </CardTitle>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Reference</label>
                      <InlineTextEditor
                        field="reference"
                        value={contract.reference}
                        placeholder="Enter contract reference"
                        className="text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <ContractTypeDropdown
                        value={contract.contract_type || 'net_rate'}
                        onValueChange={async (value) => {
                          form.setValue('contract_type', value as 'net_rate' | 'commissionable' | 'allocation')
                          await handleSaveEdit('contract_type')
                        }}
                        className="text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Supplier</label>
                      <p className="text-sm font-medium">{contract.suppliers?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <ContractStatusDropdown
                        value={contract.status}
                        onValueChange={async (value) => {
                          form.setValue('status', value as 'active' | 'inactive' | 'draft' | 'expired')
                          await handleSaveEdit('status')
                        }}
                        className="text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Signed Date</label>
                      <InlineTextEditor
                        field="signed_date"
                        value={contract.signed_date ? new Date(contract.signed_date).toISOString().split('T')[0] : ''}
                        placeholder="YYYY-MM-DD"
                        className="text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created</label>
                      <p className="text-sm font-medium">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Document Management */}
                <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                {renderDocumentManagement()}
                  </CardContent>
                </Card>
          </div>

          {/* Internal Notes */}
              {contract.notes && (
                <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Internal Notes
                </CardTitle>
                  </CardHeader>
                  <CardContent>
                <InlineTextareaEditor
                  field="notes"
                  value={contract.notes || ''}
                  placeholder="Add internal notes and comments about this contract..."
                  className="prose prose-sm max-w-none"
                />
                  </CardContent>
                </Card>
              )}
          </TabsContent>

        <TabsContent value="terms" className="space-y-6">
              {/* Terms and Conditions */}
                <Card>
                  <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms and Conditions
              </CardTitle>
              <CardDescription>
                Standard terms and conditions for this contract
              </CardDescription>
                  </CardHeader>
                  <CardContent>
              <InlineTextareaEditor
                field="terms_and_conditions"
                value={contract.terms_and_conditions || ''}
                placeholder="Add standard terms and conditions for this contract..."
                className="prose prose-sm max-w-none"
              />
                  </CardContent>
                </Card>

              {/* Special Terms */}
                <Card>
                  <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Special Terms
              </CardTitle>
              <CardDescription>
                Special terms, exceptions, and custom conditions
              </CardDescription>
                  </CardHeader>
                  <CardContent>
              <InlineTextareaEditor
                field="special_terms"
                value={contract.special_terms || ''}
                placeholder="Add special terms, exceptions, or custom conditions..."
                className="prose prose-sm max-w-none"
              />
                  </CardContent>
                </Card>

          {/* Internal Notes */}
          {contract.notes && (
                <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Internal Notes
                </CardTitle>
                <CardDescription>
                  Internal notes and comments about this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InlineTextareaEditor
                  field="notes"
                  value={contract.notes || ''}
                  placeholder="Add internal notes and comments about this contract..."
                  className="prose prose-sm max-w-none"
                />
                  </CardContent>
                </Card>
              )}
          </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <ContractRatesManager
            contractId={contract.id.toString()}
            supplierId={contract.supplier_id.toString()}
            orgId={contract.org_id.toString()}
          />
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6">
          <ContractAllocationsManager
            contractId={contract.id.toString()}
            supplierId={contract.supplier_id.toString()}
            orgId={contract.org_id.toString()}
          />
        </TabsContent>

        {/* Versions tab removed - no longer needed */}

        <TabsContent value="audit" className="space-y-6">
          <AuditLogsTable
            entityType="contract"
            entityId={BigInt(contract.id)}
            className="w-full"
            />
          </TabsContent>

        <TabsContent value="deadlines" className="space-y-6">
          <ContractDeadlinesTable
              contractId={BigInt(contract.id)}
              deadlines={deadlines}
            onCreateDeadline={async (deadlineData) => {
              try {
                await createDeadline({
                  ref_type: 'contract',
                  ref_id: BigInt(contract.id),
                  deadline_type: deadlineData.deadline_type,
                  deadline_date: deadlineData.deadline_date,
                  penalty_type: deadlineData.penalty_type,
                  penalty_value: deadlineData.penalty_value,
                  status: 'pending',
                  notes: deadlineData.notes,
                }, { redirect: false })
                
                // Update local state
                setDeadlines(prev => [...prev, {
                  id: BigInt(Date.now()), // Temporary ID
                  deadline_type: deadlineData.deadline_type,
                  deadline_date: deadlineData.deadline_date,
                  penalty_type: deadlineData.penalty_type,
                  penalty_value: deadlineData.penalty_value,
                  status: 'pending',
                  notes: deadlineData.notes,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }])
                
                toast.success('Deadline created successfully')
                router.refresh()
              } catch (error) {
                toast.error('Failed to create deadline')
                console.error('Create deadline error:', error)
              }
            }}
            onEditDeadline={async (deadlineId, deadlineData) => {
              try {
                await updateDeadline(deadlineId, {
                  deadline_type: deadlineData.deadline_type,
                  deadline_date: deadlineData.deadline_date,
                  penalty_type: deadlineData.penalty_type,
                  penalty_value: deadlineData.penalty_value,
                  status: deadlineData.status,
                  notes: deadlineData.notes,
                }, { redirect: false })
                
                // Update local state
                setDeadlines(prev => prev.map(d => 
                  d.id === deadlineId 
                    ? { ...d, ...deadlineData, updated_at: new Date().toISOString() }
                    : d
                ))
                
                toast.success('Deadline updated successfully')
                router.refresh()
              } catch (error) {
                toast.error('Failed to update deadline')
                console.error('Update deadline error:', error)
              }
            }}
            onDeleteDeadline={async (deadlineId) => {
              try {
                await deleteDeadline(deadlineId, { redirect: false })
                
                // Update local state
                setDeadlines(prev => prev.filter(d => d.id !== deadlineId))
                
                toast.success('Deadline deleted successfully')
                router.refresh()
              } catch (error) {
                toast.error('Failed to delete deadline')
                console.error('Delete deadline error:', error)
              }
            }}
            onMarkComplete={async (deadlineId) => {
              try {
                await markDeadlineComplete(deadlineId, { redirect: false })
                
                // Update local state
                setDeadlines(prev => prev.map(d => 
                  d.id === deadlineId 
                    ? { ...d, status: 'met', updated_at: new Date().toISOString() }
                    : d
                ))
                
                toast.success('Deadline marked as complete')
                router.refresh()
              } catch (error) {
                toast.error('Failed to mark deadline as complete')
                console.error('Mark complete error:', error)
              }
              }}
            />
          </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ContractLinkedProducts contractId={contract.id.toString()} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Contract Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Contract Performance
              </CardTitle>
              <CardDescription>
                Key metrics and performance indicators for this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">${analytics.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{analytics.totalBookings}</div>
                  <div className="text-sm text-muted-foreground">Bookings</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-accent-foreground">{analytics.commissionRate}%</div>
                  <div className="text-sm text-muted-foreground">Commission Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and changes to this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Edit className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Contract updated</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contract.updated_at), 'MMM dd, yyyy')} at {format(new Date(contract.updated_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-secondary/10 rounded-full">
                    <CheckCircle className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Contract created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(contract.created_at), 'MMM dd, yyyy')} at {format(new Date(contract.created_at), 'HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>
                Important dates and deadlines for this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deadlines.length > 0 ? (
                <div className="space-y-3">
                      {deadlines.slice(0, 3).map((deadline, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              deadline.status === 'pending' ? 'bg-yellow-500/10' :
                              deadline.status === 'met' ? 'bg-primary/10' :
                              'bg-destructive/10'
                            }`}>
                              <Calendar className={`h-4 w-4 ${
                                deadline.status === 'pending' ? 'text-yellow-600' :
                                deadline.status === 'met' ? 'text-primary' :
                                'text-destructive'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{deadline.deadline_type}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(deadline.deadline_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(deadline.status)}>
                            {deadline.status}
                          </Badge>
                        </div>
                      ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No deadlines set</h3>
                  <p className="text-muted-foreground mb-4">
                    Add important deadlines to track contract milestones
                  </p>
                  <Button 
                    onClick={() => setActiveTab('deadlines')} 
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deadlines
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent>
        </Tabs>

      {/* Edit Contract Sheet */}
      <ContractSheetQuickForm
        trigger={<div />}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        suppliers={suppliers}
        onSuccess={handleEditSuccess}
      />
    </>
  )
}
