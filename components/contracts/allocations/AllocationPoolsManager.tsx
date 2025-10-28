'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Settings, 
  MoreVertical, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Target,
  Package,
  Layers,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { 
  useAllocationPools, 
  useCreateAllocationPool, 
  useUpdateAllocationPool,
  useDeleteAllocationPool,
  usePoolOptimizationData 
} from '@/lib/hooks/useContracts'
import { useAuth } from '@/lib/hooks/useAuth'
import { useProducts, useProductOptions } from '@/lib/hooks/useProducts'
import { toast } from 'sonner'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

interface AllocationPoolsManagerProps {
  contractId: string
}

const USAGE_STRATEGIES = [
  {
    value: 'lowest_cost',
    label: 'Lowest Cost First',
    description: 'Use cheapest allocations first',
    icon: '💰'
  },
  {
    value: 'nearest_expiry',
    label: 'Nearest Expiry First', 
    description: 'Use expiring allocations first',
    icon: '⏰'
  },
  {
    value: 'highest_margin',
    label: 'Highest Margin First',
    description: 'Use most profitable allocations first',
    icon: '📈'
  },
  {
    value: 'round_robin',
    label: 'Round Robin',
    description: 'Use allocations equally',
    icon: '🔄'
  }
] as const

interface PoolFormData {
  pool_name: string
  pool_code: string
  product_id: string
  product_option_id: string
  usage_strategy: string
}

export function AllocationPoolsManager({ contractId }: AllocationPoolsManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  
  const { profile } = useAuth()
  
  const { data: pools = [], isLoading } = useAllocationPools(profile?.organization_id || '', undefined)
  const createPool = useCreateAllocationPool()
  const updatePool = useUpdateAllocationPool()
  const deletePool = useDeleteAllocationPool()
  
  const handleCreatePool = async (data: PoolFormData) => {
    if (!profile?.organization_id) {
      toast.error('Organization not found')
      return
    }
    
    try {
      // Validate required fields
      if (!data.product_id) {
        toast.error('Please select a product')
        return
      }
      
      await createPool.mutateAsync({
        organization_id: profile.organization_id,
        product_id: data.product_id,
        product_option_id: data.product_option_id && data.product_option_id !== '' && data.product_option_id !== 'all' ? data.product_option_id : undefined,
        pool_name: data.pool_name,
        pool_code: data.pool_code && data.pool_code !== '' ? data.pool_code : undefined,
        usage_strategy: data.usage_strategy
      })
      
      toast.success('Pool created successfully')
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating pool:', error)
      toast.error('Failed to create pool')
    }
  }
  
  const handleDeletePool = async (poolId: string) => {
    try {
      await deletePool.mutateAsync(poolId)
      toast.success('Pool deleted successfully')
    } catch (error) {
      console.error('Error deleting pool:', error)
      toast.error('Failed to delete pool')
    }
  }
  
  if (isLoading || !profile?.organization_id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Allocation Pools</CardTitle>
          <CardDescription>Loading pools...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Allocation Pools
            </CardTitle>
            <CardDescription>
              Optimize inventory usage across multiple contracts
            </CardDescription>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Pool
              </Button>
            </DialogTrigger>
            <PoolFormDialog
              onSubmit={handleCreatePool}
              onCancel={() => setIsCreating(false)}
              isLoading={createPool.isPending}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Allocation Pools</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Create pools to group allocations across contracts and optimize inventory usage with smart strategies.
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Pool
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool: any) => (
              <PoolCard
                key={pool.id}
                pool={pool}
                onEdit={() => setSelectedPool(pool.id)}
                onDelete={() => handleDeletePool(pool.id)}
                onView={() => setSelectedPool(pool.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {selectedPool && (
        <PoolDetailsDialog
          poolId={selectedPool}
          onClose={() => setSelectedPool(null)}
        />
      )}
    </Card>
  )
}

interface PoolCardProps {
  pool: any
  onEdit: () => void
  onDelete: () => void
  onView: () => void
}

function PoolCard({ pool, onEdit, onDelete, onView }: PoolCardProps) {
  const memberCount = pool.allocation_pool_members?.length || 0
  const strategy = USAGE_STRATEGIES.find(s => s.value === pool.usage_strategy)
  
  // Calculate pool totals
  let totalCapacity = 0
  let totalAvailable = 0
  let totalSold = 0
  let totalCost = 0
  
  pool.allocation_pool_members?.forEach((member: any) => {
    const allocation = member.contract_allocation
    if (allocation) {
      totalCapacity += allocation.total_quantity || 0
      totalCost += allocation.total_cost || 0
      
      allocation.allocation_inventory?.forEach((inv: any) => {
        totalAvailable += inv.available_quantity || 0
        totalSold += inv.sold_quantity || 0
      })
    }
  })
  
  const utilizationRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0
  const currency = pool.allocation_pool_members?.[0]?.contract_allocation?.currency || 'GBP'
  
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{pool.pool_name}</h3>
              {pool.pool_code && (
                <Badge variant="outline" className="text-xs">
                  {pool.pool_code}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                {strategy?.icon} {strategy?.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {pool.product?.name}
              </div>
              {pool.product_option && (
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  {pool.product_option.option_name}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {memberCount} allocation{memberCount !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Pool Stats */}
            <div className="grid grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-semibold">{totalCapacity}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-orange-600">{totalSold}</div>
                <div className="text-xs text-muted-foreground">Sold</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{totalAvailable}</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{currency} {Math.round(totalCost).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Investment</div>
              </div>
            </div>
            
            {/* Utilization Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Utilization</span>
                <span>{utilizationRate.toFixed(1)}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Pool
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Manage Members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Pool
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

interface PoolFormDialogProps {
  onSubmit: (data: PoolFormData) => void
  onCancel: () => void
  isLoading: boolean
  pool?: any
}

function PoolFormDialog({ onSubmit, onCancel, isLoading, pool }: PoolFormDialogProps) {
  const [formData, setFormData] = useState<PoolFormData>({
    pool_name: pool?.pool_name || '',
    pool_code: pool?.pool_code || '',
    product_id: pool?.product_id || '',
    product_option_id: pool?.product_option_id || 'all',
    usage_strategy: pool?.usage_strategy || 'lowest_cost'
  })
  
  const { data: products, isLoading: productsLoading } = useProducts()
  const { data: productOptions, isLoading: optionsLoading } = useProductOptions(formData.product_id)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.pool_name.trim()) {
      toast.error('Pool name is required')
      return
    }
    
    if (!formData.product_id) {
      toast.error('Please select a product')
      return
    }
    
    onSubmit(formData)
  }
  
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {pool ? 'Edit Pool' : 'Create Allocation Pool'}
        </DialogTitle>
        <DialogDescription>
          Group allocations together and configure usage strategy
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pool_name">Pool Name *</Label>
          <Input
            id="pool_name"
            value={formData.pool_name}
            onChange={(e) => setFormData(prev => ({ ...prev, pool_name: e.target.value }))}
            placeholder="e.g., Monaco GP Hotel Pool"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="pool_code">Pool Code</Label>
          <Input
            id="pool_code"
            value={formData.pool_code}
            onChange={(e) => setFormData(prev => ({ ...prev, pool_code: e.target.value }))}
            placeholder="e.g., MGP-HTL"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product_id">Product *</Label>
          <Select
            value={formData.product_id}
            onValueChange={(value) => setFormData(prev => ({ 
              ...prev, 
              product_id: value,
              product_option_id: 'all' // Reset to all options when product changes
            }))}
            disabled={productsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products?.data?.map((product: any) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-2">
                    <span>{product.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {product.code}
                    </Badge>
                  </div>
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="product_option_id">Product Option (Optional)</Label>
          <Select
            value={formData.product_option_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, product_option_id: value }))}
            disabled={!formData.product_id || optionsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select option (or leave blank for all)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All options</SelectItem>
              {productOptions?.map((option: any) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.option_name}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">
            Leave blank to pool all options for this product
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="usage_strategy">Usage Strategy</Label>
          <Select
            value={formData.usage_strategy}
            onValueChange={(value) => setFormData(prev => ({ ...prev, usage_strategy: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USAGE_STRATEGIES.map(strategy => (
                <SelectItem key={strategy.value} value={strategy.value}>
                  <div className="flex items-center gap-2">
                    <span>{strategy.icon}</span>
                    <div className="text-left">
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-muted-foreground">{strategy.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || !formData.product_id}>
            {isLoading ? 'Creating...' : pool ? 'Update Pool' : 'Create Pool'}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}

interface PoolDetailsDialogProps {
  poolId: string
  onClose: () => void
}

function PoolDetailsDialog({ poolId, onClose }: PoolDetailsDialogProps) {
  const { data: optimization, isLoading } = usePoolOptimizationData(poolId)
  
  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Pool Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-32 bg-muted/50 rounded animate-pulse" />
            <div className="h-48 bg-muted/50 rounded animate-pulse" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }
  
  const { pool, metrics } = optimization || {}
  const strategy = USAGE_STRATEGIES.find(s => s.value === pool?.usage_strategy)
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {pool?.pool_name}
          </DialogTitle>
          <DialogDescription>
            {strategy?.icon} {strategy?.label} • {metrics?.member_count} allocations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Pool Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{metrics?.total_capacity}</div>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{metrics?.total_sold}</div>
                <p className="text-xs text-muted-foreground">Sold Units</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{metrics?.total_available}</div>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {metrics?.currency} {Math.round(metrics?.total_cost || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total Investment</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pool Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall utilization</span>
                  <span className="font-medium">{metrics?.utilization_rate?.toFixed(1)}%</span>
                </div>
                <Progress value={metrics?.utilization_rate} className="h-3" />
                <div className="text-xs text-muted-foreground">
                  Average cost per unit: {metrics?.currency} {Math.round(metrics?.avg_cost_per_unit || 0)}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Member Allocations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pool Members</CardTitle>
              <CardDescription>Allocations in this pool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pool?.allocation_pool_members?.map((member: any) => {
                  const allocation = member.contract_allocation
                  if (!allocation) return null
                  
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
                    <div key={member.id} className="border rounded p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{allocation.allocation_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {allocation.contract?.supplier?.name} • Priority: {member.priority}
                          </div>
                        </div>
                        <Badge variant={
                          allocation.allocation_type === 'committed' ? 'default' :
                          allocation.allocation_type === 'on_request' ? 'secondary' : 'outline'
                        }>
                          {allocation.allocation_type}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
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
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Utilization</span>
                          <span>{utilization.toFixed(1)}%</span>
                        </div>
                        <Progress value={utilization} className="h-1.5" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
