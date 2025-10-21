'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Edit, Trash2, Building2, DollarSign, Users, TrendingUp } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Supplier {
  id: number;
  name: string;
  status: string;
}

interface ProductVariant {
  id: number;
  name: string;
  products: {
    id: number;
    name: string;
    type: string;
  };
}

interface Allocation {
  id: number;
  product_variant_id: number;
  supplier_id: number;
  date: string;
  quantity: number;
  booked: number;
  held: number;
  unit_cost: number;
  currency: string;
  stop_sell: boolean;
  blackout: boolean;
  suppliers: {
    name: string;
  };
  product_variants: {
    name: string;
    products: {
      name: string;
    };
  };
}

interface AllocationManagerProps {
  productVariantId?: number;
  supplierId?: number;
}

export function AllocationManager({ productVariantId, supplierId }: AllocationManagerProps) {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<Allocation | null>(null);
  const [filters, setFilters] = useState({
    productVariantId: productVariantId || '',
    supplierId: supplierId || '',
    dateFrom: '',
    dateTo: ''
  });

  // Form state for creating/editing allocations
  const [formData, setFormData] = useState({
    productVariantId: productVariantId || '',
    supplierId: '',
    dateFrom: new Date(),
    dateTo: new Date(),
    quantity: 10,
    unitCost: '',
    allocationType: 'committed' as 'committed' | 'on_request' | 'freesale'
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch allocations
      const allocationParams = new URLSearchParams();
      if (filters.productVariantId) allocationParams.set('productVariantId', filters.productVariantId);
      if (filters.supplierId) allocationParams.set('supplierId', filters.supplierId);
      if (filters.dateFrom) allocationParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) allocationParams.set('dateTo', filters.dateTo);

      const [allocationsRes, suppliersRes, variantsRes] = await Promise.all([
        fetch(`/api/allocations?${allocationParams}`),
        fetch('/api/suppliers'),
        fetch('/api/products/variants')
      ]);

      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json();
        setAllocations(allocationsData);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData);
      }

      if (variantsRes.ok) {
        const variantsData = await variantsRes.json();
        setProductVariants(variantsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllocation = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productVariantId: parseInt(formData.productVariantId),
          supplierId: parseInt(formData.supplierId),
          startDate: formData.dateFrom.toISOString(),
          endDate: formData.dateTo.toISOString(),
          quantity: formData.quantity,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
          allocationType: formData.allocationType
        })
      });

      if (response.ok) {
        toast.success('Allocation created successfully');
        setIsCreateDialogOpen(false);
        fetchData();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create allocation');
      }
    } catch (error) {
      console.error('Failed to create allocation:', error);
      toast.error('Failed to create allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAllocation = async () => {
    if (!selectedAllocation) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/allocations/${selectedAllocation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: formData.quantity,
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : selectedAllocation.unit_cost,
          allocationType: formData.allocationType
        })
      });

      if (response.ok) {
        toast.success('Allocation updated successfully');
        setIsEditDialogOpen(false);
        setSelectedAllocation(null);
        fetchData();
        resetForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update allocation');
      }
    } catch (error) {
      console.error('Failed to update allocation:', error);
      toast.error('Failed to update allocation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllocation = async (allocationId: number) => {
    if (!confirm('Are you sure you want to delete this allocation?')) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/allocations/${allocationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Allocation deleted successfully');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete allocation');
      }
    } catch (error) {
      console.error('Failed to delete allocation:', error);
      toast.error('Failed to delete allocation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productVariantId: productVariantId || '',
      supplierId: '',
      dateFrom: new Date(),
      dateTo: new Date(),
      quantity: 10,
      unitCost: '',
      allocationType: 'committed'
    });
  };

  const openEditDialog = (allocation: Allocation) => {
    setSelectedAllocation(allocation);
    setFormData({
      productVariantId: allocation.product_variant_id.toString(),
      supplierId: allocation.supplier_id.toString(),
      dateFrom: new Date(allocation.date),
      dateTo: new Date(allocation.date),
      quantity: allocation.quantity,
      unitCost: allocation.unit_cost.toString(),
      allocationType: 'committed'
    });
    setIsEditDialogOpen(true);
  };

  const getAvailabilityStatus = (allocation: Allocation) => {
    const available = allocation.quantity - allocation.booked - allocation.held;
    const percentage = (available / allocation.quantity) * 100;
    
    if (allocation.stop_sell) return { status: 'Stop Sell', color: 'bg-gray-100 text-gray-800' };
    if (allocation.blackout) return { status: 'Blackout', color: 'bg-gray-100 text-gray-800' };
    if (available === 0) return { status: 'Sold Out', color: 'bg-red-100 text-red-800' };
    if (percentage < 20) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'Available', color: 'bg-green-100 text-green-800' };
  };

  const totalDays = allocations.length;
  const totalQuantity = allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
  const totalBooked = allocations.reduce((sum, alloc) => sum + alloc.booked, 0);
  const totalAvailable = totalQuantity - totalBooked;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Allocation Management</CardTitle>
              <CardDescription>
                Manage inventory allocations across suppliers
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Allocation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="productVariant">Product Variant</Label>
              <Select 
                value={filters.productVariantId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, productVariantId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All variants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All variants</SelectItem>
                  {productVariants.map(variant => (
                    <SelectItem key={variant.id} value={variant.id.toString()}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select 
                value={filters.supplierId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, supplierId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All suppliers</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalDays}</div>
              <div className="text-sm text-muted-foreground">Total Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalQuantity}</div>
              <div className="text-sm text-muted-foreground">Total Quantity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalAvailable}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalBooked}</div>
              <div className="text-sm text-muted-foreground">Booked</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Supplier</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Quantity</th>
                  <th className="text-left p-4">Available</th>
                  <th className="text-left p-4">Cost</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(allocation => {
                  const status = getAvailabilityStatus(allocation);
                  const available = allocation.quantity - allocation.booked - allocation.held;
                  
                  return (
                    <tr key={allocation.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{allocation.product_variants.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {allocation.product_variants.products.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {allocation.suppliers.name}
                        </div>
                      </td>
                      <td className="p-4">
                        {format(new Date(allocation.date), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {allocation.quantity}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {available}/{allocation.quantity}
                          </div>
                          <div className="w-16 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(available / allocation.quantity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {allocation.unit_cost.toFixed(2)} {allocation.currency}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={status.color}>
                          {status.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(allocation)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAllocation(allocation.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Allocation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Allocation</DialogTitle>
            <DialogDescription>
              Add inventory allocation for a supplier and product variant
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productVariant">Product Variant</Label>
                <Select 
                  value={formData.productVariantId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, productVariantId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {productVariants.map(variant => (
                      <SelectItem key={variant.id} value={variant.id.toString()}>
                        {variant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select 
                  value={formData.supplierId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateFrom">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateFrom ? format(formData.dateFrom, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateFrom}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, dateFrom: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="dateTo">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dateTo ? format(formData.dateTo, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dateTo}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, dateTo: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Daily Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="unitCost">Unit Cost (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
                  placeholder="Auto-detect from rate plan"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="allocationType">Allocation Type</Label>
              <Select 
                value={formData.allocationType} 
                onValueChange={(value: 'committed' | 'on_request' | 'freesale') => 
                  setFormData(prev => ({ ...prev, allocationType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="committed">Committed</SelectItem>
                  <SelectItem value="on_request">On Request</SelectItem>
                  <SelectItem value="freesale">Freesale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Days: {Math.ceil((formData.dateTo.getTime() - formData.dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1}</div>
                <div>Total slots: {(Math.ceil((formData.dateTo.getTime() - formData.dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1) * formData.quantity}</div>
                {formData.unitCost && (
                  <div>Total cost: ${((Math.ceil((formData.dateTo.getTime() - formData.dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1) * formData.quantity * parseFloat(formData.unitCost)).toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAllocation} disabled={loading}>
              {loading ? 'Creating...' : 'Create Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allocation</DialogTitle>
            <DialogDescription>
              Update allocation details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={(e) => setFormData(prev => ({ ...prev, unitCost: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditAllocation} disabled={loading}>
              {loading ? 'Updating...' : 'Update Allocation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
