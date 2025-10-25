'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAllocation } from '@/lib/hooks/useAllocations'
import { useInventoryWithStats } from '@/lib/hooks/useAllocationInventory'
import { InventoryTable } from '@/components/allocations/inventory-table'
import { InventoryFormDialog } from '@/components/allocations/inventory-form-dialog'
import { GenerateAvailabilityDialog } from '@/components/allocations/generate-availability-dialog'
import { PageHeader } from '@/components/common/PageHeader'
import { SummaryCard } from '@/components/common/SummaryCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ArrowLeft,
  Plus,
  Package,
  Calendar,
  Settings,
  AlertTriangle,
  TrendingUp,
  Play,
  BarChart3
} from 'lucide-react'
import { format } from 'date-fns'
import type { AllocationInventory } from '@/lib/types/inventory'

export default function InventorySetupPage() {
  const params = useParams()
  const router = useRouter()
  const allocationId = params.id as string
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [editingInventory, setEditingInventory] = useState<AllocationInventory | null>(null)
  
  const { data: allocation, isLoading: allocationLoading } = useAllocation(allocationId)
  const { data: inventory = [], isLoading: inventoryLoading } = useInventoryWithStats(allocationId)

  const handleAddInventory = () => {
    setShowAddDialog(true)
  }

  const handleEditInventory = (inventory: AllocationInventory) => {
    setEditingInventory(inventory)
    setShowAddDialog(true)
  }

  const handleGenerateAvailability = (inventory: AllocationInventory) => {
    setShowGenerateDialog(true)
  }

  const handleGenerateAllAvailability = () => {
    setShowGenerateDialog(true)
  }

  const handleFormSuccess = () => {
    setShowAddDialog(false)
    setEditingInventory(null)
  }

  const handleGenerateSuccess = () => {
    setShowGenerateDialog(false)
  }

  const isLoading = allocationLoading || inventoryLoading


  const getTypeColor = (type: string) => {
    switch (type) {
      case 'allotment': return 'bg-blue-100 text-blue-800'
      case 'free_sell': return 'bg-green-100 text-green-800'
      case 'on_request': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!allocation) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold">Allocation not found</h3>
        <p className="mt-2 text-muted-foreground">
          The allocation you're looking for doesn't exist.
        </p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Setup"
        description={`Configure inventory for ${allocation.allocation_name}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={handleAddInventory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </div>
        }
      />

      {/* Allocation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Allocation Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Allocation Name</div>
              <div className="font-medium">{allocation.allocation_name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <Badge className={getTypeColor(allocation.allocation_type)}>
                {allocation.allocation_type?.replace('_', ' ').toUpperCase() || 'Unknown'}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Valid Period</div>
              <div className="font-medium">
                {format(new Date(allocation.valid_from), 'MMM d')} - {format(new Date(allocation.valid_to), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Quick Actions */}
      {inventory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button onClick={handleGenerateAllAvailability} variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Generate All Availability
              </Button>
              <Button 
                onClick={() => router.push(`/allocations/${allocationId}/availability`)}
                variant="outline"
              >
                <Calendar className="mr-2 h-4 w-4" />
                View Availability Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Inventory Configuration</CardTitle>
            <Button onClick={handleAddInventory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InventoryTable
            inventory={inventory}
            allocationId={allocationId}
            isLoading={inventoryLoading}
            onEdit={handleEditInventory}
            onGenerateAvailability={handleGenerateAvailability}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <InventoryFormDialog
        key={editingInventory?.id || 'new'}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        allocationId={allocationId}
        productId={allocation.product_id}
        inventory={editingInventory || undefined}
        onSuccess={handleFormSuccess}
      />

      <GenerateAvailabilityDialog
        key="generate-availability"
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        inventoryItems={inventory}
        allocationValidFrom={allocation.valid_from}
        allocationValidTo={allocation.valid_to}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  )
}
