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
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Package, 
  Calendar,
  Users,
  TrendingUp,
  Settings,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// Validation schemas
const ratePlanSchema = z.object({
  product_variant_id: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valid_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inventory_model: z.enum(['committed', 'freesale', 'on_request']),
  markets: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
  priority: z.number().int().min(1).max(1000).default(100),
  rate_doc: z.record(z.any()).optional(),
})

const rateOccupancySchema = z.object({
  min_occupancy: z.number().int().min(1),
  max_occupancy: z.number().int().min(1),
  pricing_model: z.enum(['fixed', 'base_plus_pax', 'per_person']),
  base_amount: z.number().min(0),
  per_person_amount: z.number().min(0).optional(),
})

const rateSeasonSchema = z.object({
  season_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  season_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dow_mask: z.number().int().min(0).max(127).default(127),
  min_stay: z.number().int().min(1).optional(),
  max_stay: z.number().int().min(1).optional(),
  min_pax: z.number().int().min(1).optional(),
  max_pax: z.number().int().min(1).optional(),
})

const rateTaxFeeSchema = z.object({
  name: z.string().min(1),
  jurisdiction: z.string().optional(),
  inclusive: z.boolean().default(false),
  calc_base: z.enum(['base_rate', 'total_rate', 'per_person']),
  amount_type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  rounding_rule: z.string().optional(),
})

type RatePlanData = z.infer<typeof ratePlanSchema>
type RateOccupancyData = z.infer<typeof rateOccupancySchema>
type RateSeasonData = z.infer<typeof rateSeasonSchema>
type RateTaxFeeData = z.infer<typeof rateTaxFeeSchema>

interface ProductVariant {
  id: number
  name: string
  products: {
    id: number
    name: string
    type: string
  }
}

interface SupplierRate {
  id: number
  product_variant_id: number
  currency: string
  valid_from: string
  valid_to: string
  inventory_model: string
  markets: string[]
  channels: string[]
  priority: number
  rate_doc: any
  created_at: string
  updated_at: string
  rate_occupancies: RateOccupancy[]
  rate_seasons: RateSeason[]
  rate_taxes_fees: RateTaxFee[]
  product_variants: ProductVariant
}

interface RateOccupancy {
  id: number
  min_occupancy: number
  max_occupancy: number
  pricing_model: string
  base_amount: number
  per_person_amount?: number
}

interface RateSeason {
  id: number
  season_from: string
  season_to: string
  dow_mask: number
  min_stay?: number
  max_stay?: number
  min_pax?: number
  max_pax?: number
}

interface RateTaxFee {
  id: number
  name: string
  jurisdiction?: string
  inclusive: boolean
  calc_base: string
  amount_type: string
  value: number
  rounding_rule?: string
}

interface ContractRatesManagerProps {
  contractId: string
  supplierId: string
  orgId: string
}

export function ContractRatesManager({ contractId, supplierId, orgId }: ContractRatesManagerProps) {
  const [rates, setRates] = useState<SupplierRate[]>([])
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRate, setEditingRate] = useState<SupplierRate | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Forms
  const ratePlanForm = useForm<RatePlanData>({
    resolver: zodResolver(ratePlanSchema),
    defaultValues: {
      currency: 'EUR',
      inventory_model: 'committed',
      priority: 100,
      valid_from: '',
      valid_to: '',
      markets: [],
      channels: [],
      rate_doc: {},
    }
  })

  const occupancyForm = useForm<RateOccupancyData>({
    resolver: zodResolver(rateOccupancySchema),
    defaultValues: {
      min_occupancy: 1,
      max_occupancy: 2,
      pricing_model: 'fixed',
      base_amount: 0,
      per_person_amount: 0,
    }
  })

  const seasonForm = useForm<RateSeasonData>({
    resolver: zodResolver(rateSeasonSchema),
    defaultValues: {
      dow_mask: 127,
      season_from: '',
      season_to: '',
    }
  })

  const taxFeeForm = useForm<RateTaxFeeData>({
    resolver: zodResolver(rateTaxFeeSchema),
    defaultValues: {
      inclusive: false,
      calc_base: 'base_rate',
      amount_type: 'fixed',
      value: 0,
    }
  })

  useEffect(() => {
    loadData()
  }, [contractId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadSupplierRates(),
        loadProductVariants()
      ])
    } catch (error) {
      toast.error('Failed to load data')
      console.error('Load data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSupplierRates = async () => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/rates?orgId=${orgId}`)
      if (!response.ok) throw new Error('Failed to load rates')
      const data = await response.json()
      setRates(data.rates || [])
    } catch (error) {
      console.error('Load rates error:', error)
      throw error
    }
  }

  const loadProductVariants = async () => {
    try {
      console.log('Loading product variants for orgId:', orgId, 'supplierId:', supplierId)
      const response = await fetch(`/api/products/variants?orgId=${orgId}&supplierId=${supplierId}`)
      if (!response.ok) throw new Error('Failed to load product variants')
      const data = await response.json()
      console.log('Product variants loaded:', data.variants)
      setProductVariants(data.variants || [])
    } catch (error) {
      console.error('Load variants error:', error)
      throw error
    }
  }

  const handleCreateRate = async (data: RatePlanData) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          supplier_id: parseInt(supplierId),
          contract_id: parseInt(contractId),
          rate_type: 'supplier_rate',
        })
      })

      if (!response.ok) throw new Error('Failed to create rate')
      
      toast.success('Supplier rate created successfully')
      setIsCreateModalOpen(false)
      ratePlanForm.reset()
      await loadSupplierRates()
    } catch (error) {
      toast.error('Failed to create supplier rate')
      console.error('Create rate error:', error)
    }
  }

  const handleUpdateRate = async (rateId: number, data: Partial<RatePlanData>) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/rates/${rateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update rate')
      
      toast.success('Supplier rate updated successfully')
      setEditingRate(null)
      await loadSupplierRates()
    } catch (error) {
      toast.error('Failed to update supplier rate')
      console.error('Update rate error:', error)
    }
  }

  const handleDeleteRate = async (rateId: number) => {
    try {
      const response = await fetch(`/api/contracts/${contractId}/rates/${rateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete rate')
      
      toast.success('Supplier rate deleted successfully')
      await loadSupplierRates()
    } catch (error) {
      toast.error('Failed to delete supplier rate')
      console.error('Delete rate error:', error)
    }
  }

  const getInventoryModelColor = (model: string) => {
    switch (model) {
      case 'committed': return 'bg-primary/10 text-primary'
      case 'freesale': return 'bg-green-500/10 text-green-600'
      case 'on_request': return 'bg-orange-500/10 text-orange-600'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getPricingModelColor = (model: string) => {
    switch (model) {
      case 'fixed': return 'bg-blue-500/10 text-blue-600'
      case 'base_plus_pax': return 'bg-purple-500/10 text-purple-600'
      case 'per_person': return 'bg-pink-500/10 text-pink-600'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const calculateTotalRates = () => {
    return rates.length
  }

  const calculateActiveRates = () => {
    const now = new Date()
    return rates.filter(rate => {
      const validFrom = new Date(rate.valid_from)
      const validTo = new Date(rate.valid_to)
      return validFrom <= now && validTo >= now
    }).length
  }

  const calculateTotalVariants = () => {
    const uniqueVariants = new Set(rates.map(rate => rate.product_variant_id))
    return uniqueVariants.size
  }

  const calculateAverageMargin = () => {
    // TODO: Calculate from master rates vs supplier rates
    return 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading supplier rates...</span>
      </div>
    )
  }

  console.log('ContractRatesManager render - productVariants:', productVariants)
  console.log('ContractRatesManager render - rates:', rates)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Supplier Rates</h2>
          <p className="text-muted-foreground">
            Manage cost rates and pricing for this contract
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Supplier Rate</DialogTitle>
              <DialogDescription>
                Add a new supplier rate for this contract
              </DialogDescription>
            </DialogHeader>
            <CreateRateForm
              form={ratePlanForm}
              productVariants={productVariants}
              onSubmit={handleCreateRate}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalRates()}</p>
                <p className="text-sm text-muted-foreground">Total Rates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{calculateActiveRates()}</p>
                <p className="text-sm text-muted-foreground">Active Rates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{calculateTotalVariants()}</p>
                <p className="text-sm text-muted-foreground">Product Variants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{calculateAverageMargin()}%</p>
                <p className="text-sm text-muted-foreground">Avg Margin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Supplier Rates Overview
          </CardTitle>
          <CardDescription>
            Manage all supplier rates for this contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No supplier rates</h3>
              <p className="text-muted-foreground mb-4">
                Create your first supplier rate to start managing costs
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier Rate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Rate Details</TabsTrigger>
                  <TabsTrigger value="occupancies">Occupancies</TabsTrigger>
                  <TabsTrigger value="seasons">Seasons</TabsTrigger>
                  <TabsTrigger value="taxes">Taxes & Fees</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Variant</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Valid Period</TableHead>
                        <TableHead>Inventory Model</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Base Rate</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map((rate) => (
                        <TableRow key={rate.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rate.product_variants?.name || 'Unknown Variant'}</p>
                              <p className="text-sm text-muted-foreground">
                                {rate.product_variants?.products?.name || 'Unknown Product'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rate.currency}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{format(new Date(rate.valid_from), 'MMM dd, yyyy')}</p>
                              <p className="text-muted-foreground">
                                to {format(new Date(rate.valid_to), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getInventoryModelColor(rate.inventory_model)}>
                              {rate.inventory_model}
                            </Badge>
                          </TableCell>
                          <TableCell>{rate.priority}</TableCell>
                          <TableCell>
                            {rate.rate_occupancies.length > 0 ? (
                              <div className="space-y-1">
                                {rate.rate_occupancies.map((occ) => (
                                  <div key={occ.id} className="text-sm">
                                    <span className="font-medium">{occ.base_amount}</span>
                                    <span className="text-muted-foreground ml-1">
                                      ({occ.pricing_model})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">No rates</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRate(rate)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteRate(rate.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rates.map((rate) => (
                      <Card key={rate.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">
                            {rate.product_variants?.name || 'Unknown Variant'}
                          </CardTitle>
                          <CardDescription>
                            {rate.product_variants?.products?.name || 'Unknown Product'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-muted-foreground">Currency</Label>
                              <p className="font-medium">{rate.currency}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Priority</Label>
                              <p className="font-medium">{rate.priority}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Inventory Model</Label>
                              <Badge className={getInventoryModelColor(rate.inventory_model)}>
                                {rate.inventory_model}
                              </Badge>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Valid Period</Label>
                              <p className="font-medium">
                                {format(new Date(rate.valid_from), 'MMM dd')} - {format(new Date(rate.valid_to), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingRate(rate)}
                              className="w-full"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Rate
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="occupancies" className="space-y-4">
                  <div className="space-y-4">
                    {rates.map((rate) => (
                      <Card key={rate.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {rate.product_variants?.name || 'Unknown Variant'} - Occupancy Rates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {rate.rate_occupancies.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Min/Max Occupancy</TableHead>
                                  <TableHead>Pricing Model</TableHead>
                                  <TableHead>Base Amount</TableHead>
                                  <TableHead>Per Person</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rate.rate_occupancies.map((occ) => (
                                  <TableRow key={occ.id}>
                                    <TableCell>
                                      {occ.min_occupancy} - {occ.max_occupancy} people
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={getPricingModelColor(occ.pricing_model)}>
                                        {occ.pricing_model}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                      {occ.base_amount} {rate.currency}
                                    </TableCell>
                                    <TableCell>
                                      {occ.per_person_amount ? 
                                        `${occ.per_person_amount} ${rate.currency}` : 
                                        'N/A'
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-4">
                              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">No occupancy rates defined</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="seasons" className="space-y-4">
                  <div className="space-y-4">
                    {rates.map((rate) => (
                      <Card key={rate.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {rate.product_variants?.name || 'Unknown Variant'} - Seasonal Rates
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {rate.rate_seasons.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Season Period</TableHead>
                                  <TableHead>Days of Week</TableHead>
                                  <TableHead>Min/Max Stay</TableHead>
                                  <TableHead>Min/Max Pax</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rate.rate_seasons.map((season) => (
                                  <TableRow key={season.id}>
                                    <TableCell>
                                      {format(new Date(season.season_from), 'MMM dd')} - {format(new Date(season.season_to), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                      {season.dow_mask === 127 ? 'All days' : `${season.dow_mask} days`}
                                    </TableCell>
                                    <TableCell>
                                      {season.min_stay ? `${season.min_stay}` : 'No min'} - {season.max_stay ? `${season.max_stay}` : 'No max'} nights
                                    </TableCell>
                                    <TableCell>
                                      {season.min_pax ? `${season.min_pax}` : 'No min'} - {season.max_pny ? `${season.max_pax}` : 'No max'} people
                                    </TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-4">
                              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">No seasonal rates defined</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="taxes" className="space-y-4">
                  <div className="space-y-4">
                    {rates.map((rate) => (
                      <Card key={rate.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {rate.product_variants?.name || 'Unknown Variant'} - Taxes & Fees
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {rate.rate_taxes_fees.length > 0 ? (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Jurisdiction</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Inclusive</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {rate.rate_taxes_fees.map((tax) => (
                                  <TableRow key={tax.id}>
                                    <TableCell className="font-medium">{tax.name}</TableCell>
                                    <TableCell>{tax.jurisdiction || 'N/A'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{tax.calc_base}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {tax.amount_type === 'percentage' ? 
                                        `${tax.value}%` : 
                                        `${tax.value} ${rate.currency}`
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={tax.inclusive ? 'default' : 'secondary'}>
                                        {tax.inclusive ? 'Inclusive' : 'Exclusive'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button size="sm" variant="outline">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          ) : (
                            <div className="text-center py-4">
                              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">No taxes & fees defined</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Rate Modal */}
      {editingRate && (
        <Dialog open={!!editingRate} onOpenChange={() => setEditingRate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier Rate</DialogTitle>
              <DialogDescription>
                Update the supplier rate for {editingRate.product_variants?.name || 'Unknown Variant'}
              </DialogDescription>
            </DialogHeader>
            <EditRateForm
              rate={editingRate}
              form={ratePlanForm}
              onSubmit={(data) => handleUpdateRate(editingRate.id, data)}
              onCancel={() => setEditingRate(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// Create Rate Form Component
function CreateRateForm({ 
  form, 
  productVariants, 
  onSubmit, 
  onCancel 
}: {
  form: any
  productVariants: ProductVariant[]
  onSubmit: (data: RatePlanData) => void
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
          <Label htmlFor="valid_from">Valid From</Label>
          <Input
            {...form.register('valid_from')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <Label htmlFor="valid_to">Valid To</Label>
          <Input
            {...form.register('valid_to')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="inventory_model">Inventory Model</Label>
          <Select
            value={form.watch('inventory_model')}
            onValueChange={(value) => form.setValue('inventory_model', value)}
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
          <Label htmlFor="priority">Priority</Label>
          <Input
            {...form.register('priority', { valueAsNumber: true })}
            type="number"
            min="1"
            max="1000"
            placeholder="100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Create Rate
        </Button>
      </div>
    </form>
  )
}

// Edit Rate Form Component
function EditRateForm({ 
  rate, 
  form, 
  onSubmit, 
  onCancel 
}: {
  rate: SupplierRate
  form: any
  onSubmit: (data: Partial<RatePlanData>) => void
  onCancel: () => void
}) {
  useEffect(() => {
    form.reset({
      currency: rate.currency,
      valid_from: rate.valid_from,
      valid_to: rate.valid_to,
      inventory_model: rate.inventory_model,
      priority: rate.priority,
      markets: rate.markets,
      channels: rate.channels,
      rate_doc: rate.rate_doc,
    })
  }, [rate, form])

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
          <Label htmlFor="priority">Priority</Label>
          <Input
            {...form.register('priority', { valueAsNumber: true })}
            type="number"
            min="1"
            max="1000"
            placeholder="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valid_from">Valid From</Label>
          <Input
            {...form.register('valid_from')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
        <div>
          <Label htmlFor="valid_to">Valid To</Label>
          <Input
            {...form.register('valid_to')}
            type="date"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="inventory_model">Inventory Model</Label>
        <Select
          value={form.watch('inventory_model')}
          onValueChange={(value) => form.setValue('inventory_model', value)}
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

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Update Rate
        </Button>
      </div>
    </form>
  )
}
