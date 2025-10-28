'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Minus, 
  ArrowUpDown, 
  Package, 
  Users, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react'
import { 
  useAllocationPools,
  useAddAllocationToPool,
  useRemoveAllocationFromPool,
  useUpdatePoolMemberPriority,
  useContractAllocations
} from '@/lib/hooks/useContracts'
import { useAuth } from '@/lib/hooks/useAuth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AllocationPoolMemberManagerProps {
  allocationId?: string
  poolId?: string
  onClose: () => void
  mode: 'add_to_pool' | 'manage_pool_members'
}

export function AllocationPoolMemberManager({ 
  allocationId, 
  poolId, 
  onClose, 
  mode 
}: AllocationPoolMemberManagerProps) {
  const [selectedPoolId, setSelectedPoolId] = useState(poolId || '')
  const [priority, setPriority] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const { profile } = useAuth()
  
  const { data: pools = [] } = useAllocationPools(profile?.organization_id!)
  const addToPool = useAddAllocationToPool()
  const removeFromPool = useRemoveAllocationFromPool()
  const updatePriority = useUpdatePoolMemberPriority()
  
  const handleAddToPool = async () => {
    if (!allocationId || !selectedPoolId) return
    
    setIsLoading(true)
    try {
      await addToPool.mutateAsync({
        poolId: selectedPoolId,
        allocationId,
        priority
      })
      
      toast.success('Allocation added to pool')
      onClose()
    } catch (error) {
      console.error('Error adding to pool:', error)
      toast.error('Failed to add allocation to pool')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleRemoveFromPool = async (memberPoolId: string, memberAllocationId: string) => {
    setIsLoading(true)
    try {
      await removeFromPool.mutateAsync({
        poolId: memberPoolId,
        allocationId: memberAllocationId
      })
      
      toast.success('Allocation removed from pool')
    } catch (error) {
      console.error('Error removing from pool:', error)
      toast.error('Failed to remove allocation from pool')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleUpdatePriority = async (memberPoolId: string, memberAllocationId: string, newPriority: number) => {
    try {
      await updatePriority.mutateAsync({
        poolId: memberPoolId,
        allocationId: memberAllocationId,
        priority: newPriority
      })
      
      toast.success('Priority updated')
    } catch (error) {
      console.error('Error updating priority:', error)
      toast.error('Failed to update priority')
    }
  }
  
  if (mode === 'add_to_pool') {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Pool</DialogTitle>
            <DialogDescription>
              Add this allocation to an existing pool for optimized usage
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Pool</Label>
              <Select value={selectedPoolId} onValueChange={setSelectedPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a pool" />
                </SelectTrigger>
                <SelectContent>
                  {pools.map((pool: any) => (
                    <SelectItem key={pool.id} value={pool.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{pool.pool_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {pool.allocation_pool_members?.length || 0} members
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input
                type="number"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <div className="text-xs text-muted-foreground">
                Lower numbers = higher priority (0 = highest)
              </div>
            </div>
            
            {selectedPoolId && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This allocation will be available for bookings through the selected pool's usage strategy.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddToPool} 
                disabled={!selectedPoolId || isLoading}
              >
                {isLoading ? 'Adding...' : 'Add to Pool'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  // Pool members management mode
  const selectedPool = pools.find((p: any) => p.id === poolId)
  const members = selectedPool?.allocation_pool_members || []
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Pool Members
          </DialogTitle>
          <DialogDescription>
            {selectedPool?.pool_name} • {members.length} allocation{members.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Allocations</h3>
              <p className="text-muted-foreground">
                This pool doesn't have any allocations yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {members
                .sort((a: any, b: any) => a.priority - b.priority)
                .map((member: any, index: number) => {
                  const allocation = member.contract_allocation
                  if (!allocation) return null
                  
                  return (
                    <MemberCard
                      key={member.id}
                      member={member}
                      allocation={allocation}
                      index={index}
                      onRemove={() => handleRemoveFromPool(poolId!, allocation.id)}
                      onUpdatePriority={(newPriority) => 
                        handleUpdatePriority(poolId!, allocation.id, newPriority)
                      }
                      isLoading={isLoading}
                    />
                  )
                })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface MemberCardProps {
  member: any
  allocation: any
  index: number
  onRemove: () => void
  onUpdatePriority: (priority: number) => void
  isLoading: boolean
}

function MemberCard({ 
  member, 
  allocation, 
  index, 
  onRemove, 
  onUpdatePriority, 
  isLoading 
}: MemberCardProps) {
  const [editingPriority, setEditingPriority] = useState(false)
  const [newPriority, setNewPriority] = useState(member.priority)
  
  const handleSavePriority = () => {
    onUpdatePriority(newPriority)
    setEditingPriority(false)
  }
  
  const handleCancelPriority = () => {
    setNewPriority(member.priority)
    setEditingPriority(false)
  }
  
  // Calculate inventory totals
  const totalInventory = allocation.allocation_inventory?.reduce(
    (sum: number, inv: any) => sum + inv.total_quantity, 0
  ) || 0
  const availableInventory = allocation.allocation_inventory?.reduce(
    (sum: number, inv: any) => sum + inv.available_quantity, 0
  ) || 0
  const soldInventory = allocation.allocation_inventory?.reduce(
    (sum: number, inv: any) => sum + inv.sold_quantity, 0
  ) || 0
  
  const utilization = totalInventory > 0 ? (soldInventory / totalInventory) * 100 : 0
  
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <h4 className="font-medium">{allocation.allocation_name}</h4>
              <div className="text-sm text-muted-foreground">
                {allocation.contract?.supplier?.name}
              </div>
            </div>
            <Badge variant={
              allocation.allocation_type === 'committed' ? 'default' :
              allocation.allocation_type === 'on_request' ? 'secondary' : 'outline'
            }>
              {allocation.allocation_type}
            </Badge>
          </div>
          
          {/* Inventory Stats */}
          <div className="grid grid-cols-4 gap-3 text-sm mb-3">
            <div className="text-center">
              <div className="font-medium">{totalInventory}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">{soldInventory}</div>
              <div className="text-xs text-muted-foreground">Sold</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">{availableInventory}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {allocation.currency} {Math.round(allocation.cost_per_unit || 0)}
              </div>
              <div className="text-xs text-muted-foreground">Per Unit</div>
            </div>
          </div>
          
          {/* Priority Management */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground">Priority:</Label>
            {editingPriority ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newPriority}
                  onChange={(e) => setNewPriority(parseInt(e.target.value) || 0)}
                  className="w-20 h-7 text-sm"
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={handleSavePriority}>
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelPriority}>
                    ×
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {member.priority}
                </Badge>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setEditingPriority(true)}
                  className="h-6 px-2"
                >
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={isLoading}
          className="text-destructive hover:text-destructive"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Utilization Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>Utilization</span>
          <span>{utilization.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all" 
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
