'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  Calendar, 
  Package, 
  Building, 
  Plus,
  Eye,
  Edit,
  ExternalLink,
  Clock,
  MapPin,
  ChevronDown,
  ChevronRight,
  Users,
  User,
  Calendar as CalendarIcon,
  Percent,
  Tag,
  Settings
} from 'lucide-react'
import { getContractRatePlans, getContractAllocations, getContractProductsStats } from '@/app/contracts/products/actions'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface ContractLinkedProductsProps {
  contractId: string
}

interface RatePlan {
  id: string
  inventory_model: string
  currency: string
  valid_from: string
  valid_to: string
  preferred: boolean
  priority: number
  markets: string[]
  channels: string[]
  rate_doc: any
  product_variants: {
    id: string
    name: string
    products: {
      id: string
      name: string
      type: string
    }
  }
  suppliers: {
    id: string
    name: string
  }
  contracts: {
    id: string
    reference: string
    status: string
  }
  created_at: string
  // Related rate data (these would come from separate queries)
  rate_seasons?: any[]
  rate_occupancies?: any[]
  rate_age_bands?: any[]
  rate_taxes_fees?: any[]
  rate_adjustments?: any[]
}

interface Allocation {
  id: string
  date: string
  allocation_type: string
  quantity: number
  booked: number
  held: number
  stop_sell: boolean
  blackout: boolean
  product_variants: {
    id: string
    name: string
    products: {
      id: string
      name: string
      type: string
    }
  }
  suppliers: {
    id: string
    name: string
  }
  created_at: string
}

interface ContractStats {
  ratePlansCount: number
  allocationsCount: number
  uniqueProductsCount: number
}

export function ContractLinkedProducts({ contractId }: ContractLinkedProductsProps) {
  const router = useRouter()
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [stats, setStats] = useState<ContractStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rate-plans' | 'allocations'>('rate-plans')

  useEffect(() => {
    loadData()
  }, [contractId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load stats first
      const statsResult = await getContractProductsStats(contractId)
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Load rate plans
      const ratePlansResult = await getContractRatePlans({ contractId, limit: 10 })
      if (ratePlansResult.success) {
        setRatePlans(ratePlansResult.data)
      }

      // Load allocations
      const allocationsResult = await getContractAllocations({ contractId, limit: 10 })
      if (allocationsResult.success) {
        setAllocations(allocationsResult.data)
      }
    } catch (error) {
      console.error('Error loading contract products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInventoryModelColor = (model: string) => {
    switch (model) {
      case 'committed': return 'bg-green-100 text-green-800 border-green-200'
      case 'freesale': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'on_request': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'archived': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityStatus = (allocation: Allocation) => {
    const available = allocation.quantity - allocation.booked - allocation.held
    const percentage = (available / allocation.quantity) * 100
    
    if (allocation.blackout) return { status: 'blackout', color: 'bg-red-100 text-red-800 border-red-200' }
    if (allocation.stop_sell) return { status: 'stop sell', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    if (percentage < 20) return { status: 'low', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    if (percentage === 0) return { status: 'sold out', color: 'bg-red-100 text-red-800 border-red-200' }
    return { status: 'available', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rate Plans</p>
                <p className="text-2xl font-bold">{stats?.ratePlansCount || 0}</p>
                <p className="text-xs text-muted-foreground">Using this contract</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allocations</p>
                <p className="text-2xl font-bold">{stats?.allocationsCount || 0}</p>
                <p className="text-xs text-muted-foreground">Inventory buckets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{stats?.uniqueProductsCount || 0}</p>
                <p className="text-xs text-muted-foreground">Unique products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('rate-plans')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'rate-plans'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Rate Plans ({stats?.ratePlansCount || 0})
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'allocations'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Allocations ({stats?.allocationsCount || 0})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'rate-plans' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Rate Plans Using This Contract
                </CardTitle>
                <CardDescription>
                  Pricing structures linked to this contract
                </CardDescription>
              </div>
              <Button 
                onClick={() => router.push(`/products?create=true&contract_id=${contractId}`)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Rate Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ratePlans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rate plans linked yet</h3>
                <p className="text-muted-foreground mb-4">
                  Rate plans using this contract will appear here. You can create rate plans in the Products section and link them to this contract, or create them directly from this contract.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => router.push(`/products?create=true&contract_id=${contractId}`)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rate Plan
                  </Button>
                  <Button 
                    onClick={() => router.push('/products')}
                    variant="ghost"
                  >
                    View All Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Accordion type="multiple" className="space-y-2">
                {ratePlans.map((ratePlan) => (
                  <AccordionItem key={ratePlan.id} value={ratePlan.id} className="border rounded-lg">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full mr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-medium">{ratePlan.product_variants.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {ratePlan.product_variants.products.type}
                              </Badge>
                              <Badge className={`text-xs ${getInventoryModelColor(ratePlan.inventory_model)}`}>
                                {ratePlan.inventory_model.replace('_', ' ')}
                              </Badge>
                              {ratePlan.preferred && (
                                <Badge variant="secondary" className="text-xs">Preferred</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {ratePlan.suppliers.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ratePlan.valid_from), 'MMM dd')} - {format(new Date(ratePlan.valid_to), 'MMM dd, yyyy')}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {ratePlan.currency}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/products/${ratePlan.product_variants.id}?tab=rates`)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/products/${ratePlan.product_variants.id}?tab=rates&edit=${ratePlan.id}`)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-6">
                        {/* Basic Rate Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Rate Configuration
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Priority:</span>
                                <span>{ratePlan.priority}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Markets:</span>
                                <div className="flex gap-1">
                                  {ratePlan.markets?.map((market, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{market}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Channels:</span>
                                <div className="flex gap-1">
                                  {ratePlan.channels?.map((channel, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">{channel}</Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              Rate Details
                            </h5>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Currency:</span>
                                <span>{ratePlan.currency}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span>{format(new Date(ratePlan.created_at), 'MMM dd, yyyy')}</span>
                              </div>
                              {ratePlan.rate_doc && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Base Rate:</span>
                                  <span className="font-medium">
                                    {ratePlan.currency} {ratePlan.rate_doc.base || 'N/A'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Rate Document Details */}
                        {ratePlan.rate_doc && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Tag className="h-4 w-4" />
                              Rate Structure
                            </h5>
                            <div className="bg-muted/50 rounded-lg p-3">
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(ratePlan.rate_doc, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Contract Information */}
                        <div className="space-y-3">
                          <h5 className="font-medium text-sm flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Contract Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-sm">
                              <div className="text-muted-foreground mb-1">Contract Reference</div>
                              <div className="font-medium">{ratePlan.contracts.reference}</div>
                            </div>
                            <div className="text-sm">
                              <div className="text-muted-foreground mb-1">Contract Status</div>
                              <Badge className={getStatusColor(ratePlan.contracts.status)}>
                                {ratePlan.contracts.status}
                              </Badge>
                            </div>
                            <div className="text-sm">
                              <div className="text-muted-foreground mb-1">Contract ID</div>
                              <div className="font-mono text-xs">{ratePlan.contracts.id}</div>
                            </div>
                          </div>
                        </div>

                        {/* Rate Seasons */}
                        {ratePlan.rate_seasons && ratePlan.rate_seasons.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Rate Seasons ({ratePlan.rate_seasons.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {ratePlan.rate_seasons.map((season: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Period:</span>
                                      <span>{format(new Date(season.season_from), 'MMM dd')} - {format(new Date(season.season_to), 'MMM dd')}</span>
                                    </div>
                                    {season.min_stay && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Stay:</span>
                                        <span>{season.min_stay} nights</span>
                                      </div>
                                    )}
                                    {season.min_pax && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Pax:</span>
                                        <span>{season.min_pax}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rate Occupancies */}
                        {ratePlan.rate_occupancies && ratePlan.rate_occupancies.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Occupancy Pricing ({ratePlan.rate_occupancies.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {ratePlan.rate_occupancies.map((occupancy: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Occupancy:</span>
                                      <span>{occupancy.min_occupancy} - {occupancy.max_occupancy} people</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Model:</span>
                                      <span>{occupancy.pricing_model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Base:</span>
                                      <span className="font-medium">{ratePlan.currency} {occupancy.base_amount}</span>
                                    </div>
                                    {occupancy.per_person_amount && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Per Person:</span>
                                        <span>{ratePlan.currency} {occupancy.per_person_amount}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rate Age Bands */}
                        {ratePlan.rate_age_bands && ratePlan.rate_age_bands.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Age Bands ({ratePlan.rate_age_bands.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {ratePlan.rate_age_bands.map((ageBand: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Age:</span>
                                      <span>{ageBand.label}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Range:</span>
                                      <span>{ageBand.min_age} - {ageBand.max_age} years</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <span>{ageBand.price_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Value:</span>
                                      <span className="font-medium">{ageBand.value}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rate Taxes & Fees */}
                        {ratePlan.rate_taxes_fees && ratePlan.rate_taxes_fees.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Percent className="h-4 w-4" />
                              Taxes & Fees ({ratePlan.rate_taxes_fees.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {ratePlan.rate_taxes_fees.map((tax: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Name:</span>
                                      <span>{tax.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <span>{tax.amount_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Value:</span>
                                      <span className="font-medium">{tax.value}</span>
                                    </div>
                                    {tax.inclusive && (
                                      <Badge variant="outline" className="text-xs">Inclusive</Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rate Adjustments */}
                        {ratePlan.rate_adjustments && ratePlan.rate_adjustments.length > 0 && (
                          <div className="space-y-3">
                            <h5 className="font-medium text-sm flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Rate Adjustments ({ratePlan.rate_adjustments.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {ratePlan.rate_adjustments.map((adjustment: any, idx: number) => (
                                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                                  <div className="text-sm space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Scope:</span>
                                      <span>{adjustment.scope}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Type:</span>
                                      <span>{adjustment.adjustment_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Value:</span>
                                      <span className="font-medium">{adjustment.value}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Priority:</span>
                                      <span>{adjustment.priority}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {stats && stats.ratePlansCount > ratePlans.length && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push(`/products?contract_id=${contractId}&view=rates`)}
                  >
                    View All {stats.ratePlansCount} Rate Plans
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Allocation Buckets Using This Contract
                </CardTitle>
                <CardDescription>
                  Inventory management linked to this contract
                </CardDescription>
              </div>
              <Button 
                onClick={() => router.push(`/products?view=allocations&contract_id=${contractId}`)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Manage Allocations
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {allocations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No allocations linked yet</h3>
                <p className="text-muted-foreground mb-4">
                  Allocation buckets using this contract will appear here. Currently, all allocations in your system are standalone (not linked to contracts). You can link existing allocations to this contract or create new ones.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={() => router.push(`/products?view=allocations&contract_id=${contractId}`)}
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Manage Allocations
                  </Button>
                  <Button 
                    onClick={() => router.push('/products')}
                    variant="ghost"
                  >
                    View All Products
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {allocations.map((allocation) => {
                  const availability = getAvailabilityStatus(allocation)
                  const available = allocation.quantity - allocation.booked - allocation.held
                  return (
                    <div key={allocation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{allocation.product_variants.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {allocation.product_variants.products.type}
                          </Badge>
                          <Badge className={`text-xs ${availability.color}`}>
                            {availability.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {allocation.suppliers.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(allocation.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {available} / {allocation.quantity} available
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/products/${allocation.product_variants.id}?tab=allocations`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/products/${allocation.product_variants.id}?tab=allocations&edit=${allocation.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
                {stats && stats.allocationsCount > allocations.length && (
                  <div className="text-center pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/products?contract_id=${contractId}&view=allocations`)}
                    >
                      View All {stats.allocationsCount} Allocations
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
