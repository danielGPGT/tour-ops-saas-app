'use client'

import { useState } from 'react'
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
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContractDocumentUpload } from './ContractDocumentUpload'
import { ContractDocumentViewer } from './ContractDocumentViewer'

interface ContractDetailViewProps {
  contract: any
  onEdit?: () => void
  onCreateVersion?: () => void
  onViewHistory?: () => void
  onBack?: () => void
}

export function ContractDetailView({ 
  contract, 
  onEdit, 
  onCreateVersion, 
  onViewHistory,
  onBack
}: ContractDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': 
        return {
          backgroundColor: 'var(--color-primary-100)',
          color: 'var(--color-primary-800)',
          borderColor: 'var(--color-primary-200)'
        }
      case 'inactive': 
        return {
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
          borderColor: 'var(--color-border)'
        }
      case 'expired': 
        return {
          backgroundColor: 'var(--color-destructive)',
          color: 'var(--color-primary-foreground)',
          borderColor: 'var(--color-destructive)'
        }
      case 'pending': 
        return {
          backgroundColor: 'var(--color-secondary-100)',
          color: 'var(--color-secondary-800)',
          borderColor: 'var(--color-secondary-200)'
        }
      default: 
        return {
          backgroundColor: 'var(--color-muted)',
          color: 'var(--color-muted-foreground)',
          borderColor: 'var(--color-border)'
        }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contracts
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{contract.name || 'Contract Details'}</h1>
            <Badge 
              className="px-3 py-1"
              style={getStatusStyle(contract.status)}
            >
              {contract.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Contract Reference: {contract.reference}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Building className="w-4 h-4" />
              <span>{contract.supplier_name}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>Created {formatDate(contract.created_at)}</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onViewHistory}>
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateVersion}>
            <Plus className="w-4 h-4 mr-2" />
            New Version
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Commission</p>
                <p className="text-2xl font-bold">{contract.commission}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Payment Terms</p>
                <p className="text-2xl font-bold">{contract.payment_terms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Versions</p>
                <p className="text-2xl font-bold">{contract.versions?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Rate Plans</p>
                <p className="text-2xl font-bold">{contract.rate_plans?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="rates">Rate Plans</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Supplier Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Supplier Name</label>
                  <p className="text-lg">{contract.supplier_name}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Contact Information</label>
                  <div className="space-y-1">
                    <p className="text-sm">{contract.supplier_email}</p>
                    <p className="text-sm">{contract.supplier_phone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Channels</label>
                  <div className="flex flex-wrap gap-2">
                    {contract.supplier_channels?.map((channel: string) => (
                      <Badge key={channel} variant="secondary">{channel}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Financial Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Commission Rate</label>
                    <p className="text-2xl font-bold text-green-600">{contract.commission}%</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                    <p className="text-lg">{contract.payment_terms}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Currency</label>
                  <p className="text-lg">{contract.currency || 'GBP'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="terms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Terms & Conditions</CardTitle>
              <CardDescription>
                Detailed terms and conditions for this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Commission Structure</h4>
                  <p className="text-sm text-muted-foreground">
                    {contract.commission}% commission on all bookings through this contract
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Payment Terms</h4>
                  <p className="text-sm text-muted-foreground">
                    Payment due within {contract.payment_terms} of invoice date
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Allocation Terms</h4>
                  <p className="text-sm text-muted-foreground">
                    {contract.allocation_terms || 'Standard allocation terms apply'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Cancellation Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Free Cancellation</span>
                    <Badge variant="outline">{contract.cancellation_policy?.free_cancellation || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Late Cancellation</span>
                    <Badge variant="outline">{contract.cancellation_policy?.late_cancellation || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">No Show Charge</span>
                    <Badge variant="destructive">{contract.cancellation_policy?.no_show || 'N/A'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Payment Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Deposit Required</span>
                    <Badge variant="outline">{contract.payment_policy?.deposit || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Balance Due</span>
                    <Badge variant="outline">{contract.payment_policy?.balance || 'N/A'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Currency</span>
                    <Badge variant="secondary">{contract.payment_policy?.currency || 'GBP'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Versions</CardTitle>
              <CardDescription>
                Version history and current active version
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {contract.versions?.map((version: any, index: number) => (
                    <div key={version.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">Version {version.version_number || index + 1}</h4>
                            {version.is_active && (
                              <Badge variant="default">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Valid from {formatDate(version.valid_from)} to {formatDate(version.valid_to)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {!version.is_active && (
                            <Button variant="outline" size="sm">
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Plans</CardTitle>
              <CardDescription>
                All rate plans associated with this contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contract.rate_plans?.map((ratePlan: any) => (
                  <div key={ratePlan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{ratePlan.product_variant_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {ratePlan.inventory_model} • {ratePlan.currency} • {ratePlan.markets?.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={ratePlan.preferred ? 'default' : 'secondary'}>
                          {ratePlan.preferred ? 'Preferred' : 'Alternative'}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Contract Documents</h3>
              <p className="text-muted-foreground">
                Upload and manage contract documents, terms sheets, and related files
              </p>
            </div>
            
            <ContractDocumentUpload
              contractId={contract.id}
              orgId={contract.org_id || 1}
              onUploadComplete={(documents) => {
                console.log('Documents uploaded:', documents)
                // Update contract with new documents
              }}
            />
            
            <ContractDocumentViewer
              contractId={contract.id}
              documents={contract.documents || []}
              onDocumentDelete={(documentId) => {
                console.log('Document deleted:', documentId)
                // Remove document from contract
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
