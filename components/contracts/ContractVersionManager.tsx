// Deprecated: replaced by ContractManagerPage versions tab

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractVersionManagerProps {
  contractId: number
  versions: any[]
  onCreateVersion: (versionData: any) => void
  onEditVersion: (versionId: number, versionData: any) => void
  onDeleteVersion: (versionId: number) => void
  onActivateVersion: (versionId: number) => void
}

export function ContractVersionManager({
  contractId,
  versions,
  onCreateVersion,
  onEditVersion,
  onDeleteVersion,
  onActivateVersion
}: ContractVersionManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingVersion, setEditingVersion] = useState<any>(null)
  const [newVersion, setNewVersion] = useState({
    valid_from: '',
    valid_to: '',
    cancellation_policy: {},
    payment_policy: {},
    terms: {}
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getVersionStatus = (version: any) => {
    const now = new Date()
    const validFrom = new Date(version.valid_from)
    const validTo = new Date(version.valid_to)
    
    if (version.is_active) return 'active'
    if (validFrom > now) return 'future'
    if (validTo < now) return 'expired'
    return 'inactive'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'future': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCreateVersion = () => {
    onCreateVersion({
      ...newVersion,
      contract_id: contractId
    })
    setNewVersion({
      valid_from: '',
      valid_to: '',
      cancellation_policy: {},
      payment_policy: {},
      terms: {}
    })
    setIsCreateDialogOpen(false)
  }

  const handleEditVersion = (version: any) => {
    setEditingVersion(version)
  }

  const handleSaveEdit = () => {
    if (editingVersion) {
      onEditVersion(editingVersion.id, editingVersion)
      setEditingVersion(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contract Versions</h2>
          <p className="text-muted-foreground">
            Manage contract versions and their validity periods
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Contract Version</DialogTitle>
              <DialogDescription>
                Create a new version of this contract with updated terms and policies
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">Valid From</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={newVersion.valid_from}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid_to">Valid To</Label>
                  <Input
                    id="valid_to"
                    type="date"
                    value={newVersion.valid_to}
                    onChange={(e) => setNewVersion(prev => ({ ...prev, valid_to: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Cancellation Policy</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="free_cancellation">Free Cancellation</Label>
                    <Input
                      id="free_cancellation"
                      placeholder="48 hours"
                      value={newVersion.cancellation_policy?.free_cancellation || ''}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        cancellation_policy: {
                          ...prev.cancellation_policy,
                          free_cancellation: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="late_cancellation">Late Cancellation</Label>
                    <Input
                      id="late_cancellation"
                      placeholder="24 hours"
                      value={newVersion.cancellation_policy?.late_cancellation || ''}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        cancellation_policy: {
                          ...prev.cancellation_policy,
                          late_cancellation: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="no_show">No Show Charge</Label>
                    <Input
                      id="no_show"
                      placeholder="100% charge"
                      value={newVersion.cancellation_policy?.no_show || ''}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        cancellation_policy: {
                          ...prev.cancellation_policy,
                          no_show: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Payment Policy</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deposit">Deposit Required</Label>
                    <Input
                      id="deposit"
                      placeholder="50% on booking"
                      value={newVersion.payment_policy?.deposit || ''}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        payment_policy: {
                          ...prev.payment_policy,
                          deposit: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Balance Due</Label>
                    <Input
                      id="balance"
                      placeholder="30 days before arrival"
                      value={newVersion.payment_policy?.balance || ''}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        payment_policy: {
                          ...prev.payment_policy,
                          balance: e.target.value
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      className="w-full p-2 border rounded-md"
                      value={newVersion.payment_policy?.currency || 'GBP'}
                      onChange={(e) => setNewVersion(prev => ({
                        ...prev,
                        payment_policy: {
                          ...prev.payment_policy,
                          currency: e.target.value
                        }
                      }))}
                    >
                      <option value="GBP">GBP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="terms">Additional Terms</Label>
                <Textarea
                  id="terms"
                  placeholder="Enter any additional terms..."
                  value={newVersion.terms?.additional || ''}
                  onChange={(e) => setNewVersion(prev => ({
                    ...prev,
                    terms: {
                      ...prev.terms,
                      additional: e.target.value
                    }
                  }))}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateVersion}>
                  Create Version
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Versions List */}
      <div className="space-y-4">
        {versions.map((version) => {
          const status = getVersionStatus(version)
          return (
            <Card key={version.id} className={cn(
              "transition-all duration-200",
              status === 'active' && "ring-2 ring-green-200"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium">
                        Version {version.version_number || versions.indexOf(version) + 1}
                      </h3>
                      <Badge className={cn("px-2 py-1", getStatusColor(status))}>
                        {status}
                      </Badge>
                      {version.is_active && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(version.valid_from)} - {formatDate(version.valid_to)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Created {formatDate(version.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Cancellation Policy</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Free: {version.cancellation_policy?.free_cancellation || 'N/A'}</p>
                          <p>Late: {version.cancellation_policy?.late_cancellation || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Payment Policy</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Deposit: {version.payment_policy?.deposit || 'N/A'}</p>
                          <p>Balance: {version.payment_policy?.balance || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Terms</p>
                        <div className="text-sm text-muted-foreground">
                          <p>Commission: {version.terms?.commission || 'N/A'}</p>
                          <p>Allocation: {version.terms?.allocation || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!version.is_active && status !== 'expired' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActivateVersion(version.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditVersion(version)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* Clone version logic */}}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Clone
                    </Button>
                    {!version.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteVersion(version.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Version Dialog */}
      {editingVersion && (
        <Dialog open={!!editingVersion} onOpenChange={() => setEditingVersion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Contract Version</DialogTitle>
              <DialogDescription>
                Update the terms and policies for this version
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_valid_from">Valid From</Label>
                  <Input
                    id="edit_valid_from"
                    type="date"
                    value={editingVersion.valid_from}
                    onChange={(e) => setEditingVersion(prev => ({ ...prev, valid_from: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_valid_to">Valid To</Label>
                  <Input
                    id="edit_valid_to"
                    type="date"
                    value={editingVersion.valid_to}
                    onChange={(e) => setEditingVersion(prev => ({ ...prev, valid_to: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingVersion(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
