'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRangePicker } from '@/components/common/DateRangePicker'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  Settings,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3,
  MapPin,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { format, addDays, eachDayOfInterval } from 'date-fns'

// Validation schemas
const allocationBucketSchema = z.object({
  product_variant_id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allocation_type: z.enum(['committed', 'freesale', 'on_request']),
  quantity: z.number().int().min(0).nullable(),
  unit_cost: z.number().min(0),
  currency: z.string().min(3).max(3),
  notes: z.string().optional(),
  stop_sell: z.boolean().default(false),
  blackout: z.boolean().default(false),
  release_period_hours: z.number().int().min(0).optional(),
  committed_cost: z.boolean().default(false),
})

const bulkAllocationSchema = z.object({
  product_variant_id: z.number().int().positive(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  allocation_type: z.enum(['committed', 'freesale', 'on_request']),
  quantity: z.number().int().min(0).nullable(),
  unit_cost: z.number().min(0),
  currency: z.string().min(3).max(3),
  notes: z.string().optional(),
  stop_sell: z.boolean().default(false),
  blackout: z.boolean().default(false),
  release_period_hours: z.number().int().min(0).optional(),
  committed_cost: z.boolean().default(false),
  min_stay_days: z.number().int().min(1).optional(),
  max_stay_days: z.number().int().min(1).optional(),
  min_occupancy: z.number().int().min(1).optional(),
  max_occupancy: z.number().int().min(1).optional(),
})

type AllocationBucketData = z.infer<typeof allocationBucketSchema>
type BulkAllocationData = z.infer<typeof bulkAllocationSchema>

interface ProductVariant {
  id: number
  name: string
  product: {
    id: number
    name: string
    type: string
  }
}

interface AllocationBucket {
  id: number
  product_variant_id: number
  date: string
  allocation_type: string
  quantity?: number
  booked: number
  held: number
  unit_cost: number
  currency: string
  notes?: string
  stop_sell: boolean
  blackout: boolean
  release_period_hours?: number
  committed_cost: boolean
  created_at: string
  updated_at: string
  product_variants: ProductVariant
}

interface ContractAllocationsManagerProps {
  contractId: string
  supplierId: string
  orgId: string
}

export function ContractAllocationsManager({ contractId, supplierId, orgId }: ContractAllocationsManagerProps) {
  const [allocations, setAllocations] = useState<AllocationBucket[]>([])
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAllocation, setEditingAllocation] = useState<AllocationBucket | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedVariant, setSelectedVariant] = useState<string>('')

  // Forms
  const allocationForm = useForm<AllocationBucketData>({
    resolver: zodResolver(allocationBucketSchema),
    defaultValues: {
      currency: 'EUR',
      allocation_type: 'committed',
      quantity: null,
      unit_cost: 0,
      stop_sell: false,
      blackout: false,
      committed_cost: false,
    }
  })

  const bulkAllocationForm = useForm<BulkAllocationData>({
    resolver: zodResolver(bulkAllocationSchema),
    defaultValues: {
      currency: 'EUR',
      allocation_type: 'committed',
      quantity: null,
      unit_cost: 0,
      stop_sell: false,
      blackout: false,
      committed_cost: false,
    }
  })

  useEffect(() => {
    loadData()
  }, [contractId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadAllocations(),
        loadProductVariants()
      ])
    } catch (error) {
      toast.error('Failed to load data')
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllocations = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/allocations?orgId=${orgId}`)
      if (!response.ok) throw new Error('Failed to load allocations')
      const data = await response.json()
      setAllocations(data.allocations || [])
    } catch (error) {
      console.error('Load allocations error:', error)
      throw error
    }
  }

  const loadProductVariants = async () => {
    try {
      console.log('ContractAllocationsManager - Loading product variants for orgId:', orgId, 'supplierId:', supplierId)
      const response = await fetch(`/api/products/variants?orgId=${orgId}&supplierId=${supplierId}`)
      if (!response.ok) throw new Error('Failed to load product variants')
      const data = await response.json()
      console.log('ContractAllocationsManager - Product variants loaded:', data.variants)
      setProductVariants(data.variants || [])
    } catch (error) {
      console.error('Load variants error:', error)
      throw error
    }
  }

  const handleCreateAllocation = async (data: AllocationBucketData) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          supplier_id: parseInt(supplierId),
          contract_id: parseInt(contractId),
        })
      })

      if (!response.ok) throw new Error('Failed to create allocation')
      
      toast.success('Allocation created successfully')
      setIsCreateModalOpen(false)
      allocationForm.reset()
      await loadAllocations()
    } catch (error) {
      toast.error('Failed to create allocation')
      console.error('Create allocation error:', error)
    }
  }

  const handleBulkCreateAllocations = async (data: BulkAllocationData) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/allocations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          supplier_id: parseInt(supplierId),
          contract_id: parseInt(contractId),
        })
      })

      if (!response.ok) throw new Error('Failed to create bulk allocations')
      
      toast.success('Bulk allocations created successfully')
      setIsBulkCreateModalOpen(false)
      bulkAllocationForm.reset()
      await loadAllocations()
    } catch (error) {
      toast.error('Failed to create bulk allocations')
      console.error('Bulk create allocations error:', error)
    }
  }

  const handleUpdateAllocation = async (allocationId: number, data: Partial<AllocationBucketData>) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/allocations/${allocationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update allocation')
      
      toast.success('Allocation updated successfully')
      setEditingAllocation(null)
      await loadAllocations()
    } catch (error) {
      toast.error('Failed to update allocation')
      console.error('Update allocation error:', error)
    }
  }

  const handleDeleteAllocation = async (allocationId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/allocations/${allocationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete allocation')
      
      toast.success('Allocation deleted successfully')
      await loadAllocations()
    } catch (error) {
      toast.error('Failed to delete allocation')
      console.error('Delete allocation error:', error)
    }
  }

  const getAllocationTypeColor = (type: string) => {
    switch (type) {
      case 'committed': return 'bg-primary/10 text-primary'
      case 'freesale': return 'bg-green-500/10 text-green-600'
      case 'on_request': return 'bg-orange-500/10 text-orange-600'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getAvailabilityStatus = (allocation: AllocationBucket) => {
    if (allocation.blackout) return { status: 'blackout', color: 'bg-red-500/10 text-red-600' }
    if (allocation.stop_sell) return { status: 'stop_sell', color: 'bg-orange-500/10 text-orange-600' }
    if (!allocation.quantity) return { status: 'unlimited', color: 'bg-green-500/10 text-green-600' }
    
    const available = allocation.quantity - allocation.booked - allocation.held
    if (available <= 0) return { status: 'sold_out', color: 'bg-red-500/10 text-red-600' }
    if (available <= (allocation.quantity * 0.2)) return { status: 'low', color: 'bg-yellow-500/10 text-yellow-600' }
    return { status: 'available', color: 'bg-green-500/10 text-green-600' }
  }

  const calculateTotalAllocations = () => {
    return allocations.length
  }

  const calculateTotalQuantity = () => {
    return allocations.reduce((sum, allocation) => {
      return sum + (allocation.quantity || 0)
    }, 0)
  }

  const calculateTotalBooked = () => {
    return allocations.reduce((sum, allocation) => {
      return sum + allocation.booked
    }, 0)
  }

  const calculateTotalAvailable = () => {
    return allocations.reduce((sum, allocation) => {
      const quantity = allocation.quantity || 0
      return sum + (quantity - allocation.booked - allocation.held)
    }, 0)
  }

  const calculateTotalValue = () => {
    return allocations.reduce((sum, allocation) => {
      const quantity = allocation.quantity || 0
      return sum + (quantity * allocation.unit_cost)
    }, 0)
  }

  const getCalendarData = () => {
    const calendarData: Record<string, AllocationBucket[]> = {}
    
    allocations.forEach(allocation => {
      const date = allocation.date
      if (!calendarData[date]) {
        calendarData[date] = []
      }
      calendarData[date].push(allocation)
    })
    
    return calendarData
  }

  const filteredAllocations = selectedVariant && selectedVariant !== "all"
    ? allocations.filter(allocation => allocation.product_variant_id.toString() === selectedVariant)
    : allocations

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading allocations...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Block Allocations</h2>
          <p className="text-muted-foreground">
            Manage inventory allocations with min/max stay rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isBulkCreateModalOpen} onOpenChange={setIsBulkCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Create Allocations</DialogTitle>
                <DialogDescription>
                  Create multiple allocations for a date range
                </DialogDescription>
              </DialogHeader>
              <BulkCreateAllocationForm
                form={bulkAllocationForm}
                productVariants={productVariants}
                onSubmit={handleBulkCreateAllocations}
                onCancel={() => setIsBulkCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Allocation</DialogTitle>
                <DialogDescription>
                  Add a new allocation for this contract
                </DialogDescription>
              </DialogHeader>
              <CreateAllocationForm
                form={allocationForm}
                productVariants={productVariants}
                onSubmit={handleCreateAllocation}
                onCancel={() => setIsCreateModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label>Product Variant:</Label>
          <Select value={selectedVariant} onValueChange={setSelectedVariant}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All variants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All variants</SelectItem>
              {productVariants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id.toString()}>
                  {variant.name} ({variant.products.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalAllocations()}</p>
                <p className="text-sm text-muted-foreground">Total Allocations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalQuantity()}</p>
                <p className="text-sm text-muted-foreground">Total Quantity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalBooked()}</p>
                <p className="text-sm text-muted-foreground">Booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalAvailable()}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalValue().toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Allocations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Allocations Overview
          </CardTitle>
          <CardDescription>
            Manage all block allocations for this contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No allocations</h3>
              <p className="text-muted-foreground mb-4">
                Create your first allocation to start managing inventory
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Allocation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                  <TabsTrigger value="details">Detailed View</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Variant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Booked</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAllocations.map((allocation) => {
                        const availability = getAvailabilityStatus(allocation)
                        const available = (allocation.quantity || 0) - allocation.booked - allocation.held
                        
                        return (
                          <TableRow key={allocation.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{allocation.product_variants?.name || 'Unknown Variant'}</p>
                                <p className="text-sm text-muted-foreground">
                                  {allocation.product_variants?.products?.name || 'Unknown Product'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(allocation.date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <Badge className={getAllocationTypeColor(allocation.allocation_type)}>
                                {allocation.allocation_type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {allocation.quantity || 'Unlimited'}
                            </TableCell>
                            <TableCell>{allocation.booked}</TableCell>
                            <TableCell>{available}</TableCell>
                            <TableCell>
                              <Badge className={availability.color}>
                                {availability.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {allocation.unit_cost} {allocation.currency}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingAllocation(allocation)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAllocation(allocation.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="calendar" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Allocation Calendar
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              className="rounded-md border"
                              modifiers={{
                                hasAllocations: (date) => {
                                  const dateStr = format(date, 'yyyy-MM-dd')
                                  return getCalendarData()[dateStr] && getCalendarData()[dateStr].length > 0
                                }
                              }}
                              modifiersStyles={{
                                hasAllocations: {
                                  backgroundColor: 'hsl(var(--primary))',
                                  color: 'hsl(var(--primary-foreground))',
                                  fontWeight: 'bold'
                                }
                              }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <div>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Selected Date
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">
                                {format(selectedDate, 'MMMM dd, yyyy')}
                              </Label>
                            </div>
                            {(() => {
                              const dateStr = format(selectedDate, 'yyyy-MM-dd')
                              const dayAllocations = getCalendarData()[dateStr] || []
                              
                              if (dayAllocations.length === 0) {
                                return (
                                  <div className="text-center py-4">
                                    <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-muted-foreground text-sm">No allocations for this date</p>
                                  </div>
                                )
                              }
                              
                              return (
                                <div className="space-y-3">
                                  {dayAllocations.map((allocation) => {
                                    const availability = getAvailabilityStatus(allocation)
                                    const available = (allocation.quantity || 0) - allocation.booked - allocation.held
                                    
                                    return (
                                      <div key={allocation.id} className="p-3 border rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="font-medium text-sm">{allocation.product_variants?.name || 'Unknown Variant'}</p>
                                          <Badge className={availability.color}>
                                            {availability.status}
                                          </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                          <div>Available: {available}</div>
                                          <div>Booked: {allocation.booked}</div>
                                          <div>Cost: {allocation.unit_cost} {allocation.currency}</div>
                                          <div>Type: {allocation.allocation_type}</div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAllocations.map((allocation) => {
                      const availability = getAvailabilityStatus(allocation)
                      const available = (allocation.quantity || 0) - allocation.booked - allocation.held
                      
                      return (
                        <Card key={allocation.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">
                                {allocation.product_variants?.name || 'Unknown Variant'}
                              </CardTitle>
                              <Badge className={availability.color}>
                                {availability.status}
                              </Badge>
                            </div>
                            <CardDescription>
                              {allocation.product_variants?.products?.name || 'Unknown Product'} - {format(new Date(allocation.date), 'MMM dd, yyyy')}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Allocation Type</Label>
                                <Badge className={getAllocationTypeColor(allocation.allocation_type)}>
                                  {allocation.allocation_type}
                                </Badge>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Quantity</Label>
                                <p className="font-medium">{allocation.quantity || 'Unlimited'}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Booked</Label>
                                <p className="font-medium">{allocation.booked}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Available</Label>
                                <p className="font-medium">{available}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Unit Cost</Label>
                                <p className="font-medium">{allocation.unit_cost} {allocation.currency}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Total Value</Label>
                                <p className="font-medium">
                                  {((allocation.quantity || 0) * allocation.unit_cost).toLocaleString()} {allocation.currency}
                                </p>
                              </div>
                            </div>
                            {allocation.notes && (
                              <div>
                                <Label className="text-muted-foreground">Notes</Label>
                                <p className="text-sm">{allocation.notes}</p>
                              </div>
                            )}
                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingAllocation(allocation)}
                                className="w-full"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Allocation
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Allocation Modal */}
      {editingAllocation && (
        <Dialog open={!!editingAllocation} onOpenChange={() => setEditingAllocation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Allocation</DialogTitle>
              <DialogDescription>
                Update the allocation for {editingAllocation.product_variants.name}
              </DialogDescription>
            </DialogHeader>
            <EditAllocationForm
              allocation={editingAllocation}
              form={allocationForm}
              onSubmit={(data) => handleUpdateAllocation(editingAllocation.id, data)}
              onCancel={() => setEditingAllocation(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Create Allocation Form Component
function CreateAllocationForm({ 
  form, 
  productVariants, 
  onSubmit, 
  onCancel 
}: {
  form: any
  productVariants: ProductVariant[]
  onSubmit: (data: AllocationBucketData) => void
  onCancel: () => void
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_variant_id">Product Variant</Label>
          <Select
            value={form.watch('product_variant_id')?.toString()}
            onValueChange={(value) => form.setValue('product_variant_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product variant" />
            </SelectTrigger>
            <SelectContent>
              {productVariants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id.toString()}>
                  {variant.name} ({variant.products.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            {...form.register('date')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="allocation_type">Allocation Type</Label>
          <Select
            value={form.watch('allocation_type')}
            onValueChange={(value) => form.setValue('allocation_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="freesale">Freesale</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => form.setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity (leave empty for unlimited)</Label>
          <Input
            {...form.register('quantity', { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="Enter quantity or leave empty"
          />
        </div>
        <div>
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            {...form.register('unit_cost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          {...form.register('notes')}
          placeholder="Add notes about this allocation..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Allocation
        </Button>
      </div>
    </form>
  )
}

// Bulk Create Allocation Form Component
function BulkCreateAllocationForm({ 
  form, 
  productVariants, 
  onSubmit, 
  onCancel 
}: {
  form: any
  productVariants: ProductVariant[]
  onSubmit: (data: BulkAllocationData) => void
  onCancel: () => void
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_variant_id">Product Variant</Label>
          <Select
            value={form.watch('product_variant_id')?.toString()}
            onValueChange={(value) => form.setValue('product_variant_id', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select product variant" />
            </SelectTrigger>
            <SelectContent>
              {productVariants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id.toString()}>
                  {variant.name} ({variant.products.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="allocation_type">Allocation Type</Label>
          <Select
            value={form.watch('allocation_type')}
            onValueChange={(value) => form.setValue('allocation_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="freesale">Freesale</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <DateRangePicker
          label="Date Range"
          placeholder="Select date range for bulk allocation"
          value={form.watch('date_from') && form.watch('date_to') ? {
            from: new Date(form.watch('date_from')),
            to: new Date(form.watch('date_to'))
          } : undefined}
          onChange={(range) => {
            form.setValue('date_from', range?.from ? range.from.toISOString().split('T')[0] : '')
            form.setValue('date_to', range?.to ? range.to.toISOString().split('T')[0] : '')
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity (leave empty for unlimited)</Label>
          <Input
            {...form.register('quantity', { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="Enter quantity or leave empty"
          />
        </div>
        <div>
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            {...form.register('unit_cost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => form.setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="release_period_hours">Release Period (hours)</Label>
          <Input
            {...form.register('release_period_hours', { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="24"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_stay_days">Min Stay (days)</Label>
          <Input
            {...form.register('min_stay_days', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="1"
          />
        </div>
        <div>
          <Label htmlFor="max_stay_days">Max Stay (days)</Label>
          <Input
            {...form.register('max_stay_days', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="7"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="min_occupancy">Min Occupancy</Label>
          <Input
            {...form.register('min_occupancy', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="1"
          />
        </div>
        <div>
          <Label htmlFor="max_occupancy">Max Occupancy</Label>
          <Input
            {...form.register('max_occupancy', { valueAsNumber: true })}
            type="number"
            min="1"
            placeholder="2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          {...form.register('notes')}
          placeholder="Add notes about these allocations..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Bulk Allocations
        </Button>
      </div>
    </form>
  )
}

// Edit Allocation Form Component
function EditAllocationForm({ 
  allocation, 
  form, 
  onSubmit, 
  onCancel 
}: {
  allocation: AllocationBucket
  form: any
  onSubmit: (data: Partial<AllocationBucketData>) => void
  onCancel: () => void
}) {
  useEffect(() => {
    form.reset({
      product_variant_id: allocation.product_variant_id,
      date: allocation.date,
      allocation_type: allocation.allocation_type,
      quantity: allocation.quantity,
      unit_cost: allocation.unit_cost,
      currency: allocation.currency,
      notes: allocation.notes,
      stop_sell: allocation.stop_sell,
      blackout: allocation.blackout,
      release_period_hours: allocation.release_period_hours,
      committed_cost: allocation.committed_cost,
    })
  }, [allocation, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            {...form.register('date')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <Label htmlFor="allocation_type">Allocation Type</Label>
          <Select
            value={form.watch('allocation_type')}
            onValueChange={(value) => form.setValue('allocation_type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="freesale">Freesale</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity (leave empty for unlimited)</Label>
          <Input
            {...form.register('quantity', { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="Enter quantity or leave empty"
          />
        </div>
        <div>
          <Label htmlFor="unit_cost">Unit Cost</Label>
          <Input
            {...form.register('unit_cost', { valueAsNumber: true })}
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => form.setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="CHF">CHF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="release_period_hours">Release Period (hours)</Label>
          <Input
            {...form.register('release_period_hours', { valueAsNumber: true })}
            type="number"
            min="0"
            placeholder="24"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          {...form.register('notes')}
          placeholder="Add notes about this allocation..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Update Allocation
        </Button>
      </div>
    </form>
  )
}
