'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  ArrowLeft, 
  Package2, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Image as ImageIcon,
  Tag,
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { SmartProductWizard } from '@/components/wizards/SmartProductWizard'
import { SummaryCards } from '@/components/common/SummaryCards'
import { DataTable } from '@/components/common/DataTable'
import { format } from 'date-fns'

interface ProductVariantDetailsClientProps {
  variant: {
    id: number
    name: string
    description?: string
    status: string
    attributes?: any
    images?: any[]
    created_at: string
    updated_at: string
    products: {
      id: number
      name: string
      type: string
      status: string
    }
    rate_plans: Array<{
      id: number
      name: string
      preferred: boolean
      inventory_model: string
      currency: string
      valid_from: string
      valid_to: string
      channels: string[]
      markets: string[]
      rate_doc: any
      suppliers: {
        id: number
        name: string
        status: string
      }
      rate_seasons: Array<{
        id: number
        name: string
        start_date: string
        end_date: string
        rate_multiplier: number
      }>
      rate_occupancies: Array<{
        id: number
        occupancy_type: string
        min_occupancy: number
        max_occupancy: number
        base_rate: number
        supplement_rate: number
      }>
      rate_taxes_fees: Array<{
        id: number
        name: string
        type: string
        amount: number
        percentage: number
        mandatory: boolean
      }>
    }>
    allocation_buckets: Array<{
      id: number
      date: string
      event_start_date?: string
      event_end_date?: string
      slot_id?: number
      quantity: number
      booked: number
      held: number
      stop_sell: boolean
      blackout: boolean
      time_slots?: {
        id: number
        slot_name: string
        slot_time: string
        duration_minutes: number
      }
    }>
  }
}

export function ProductVariantDetailsClient({ variant }: ProductVariantDetailsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showEditWizard, setShowEditWizard] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['overview', 'rates', 'inventory'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleEditComplete = () => {
    setShowEditWizard(false)
    router.refresh()
  }

  const handleEditCancel = () => {
    setShowEditWizard(false)
  }

  const getAvailabilityStatus = (bucket: any) => {
    const available = bucket.quantity - bucket.booked - bucket.held
    const percentage = (available / bucket.quantity) * 100
    
    if (bucket.blackout) return { status: 'blackout', color: 'bg-gray-500' }
    if (bucket.stop_sell) return { status: 'stop_sell', color: 'bg-red-500' }
    if (percentage === 0) return { status: 'sold_out', color: 'bg-red-500' }
    if (percentage < 20) return { status: 'low', color: 'bg-yellow-500' }
    return { status: 'available', color: 'bg-green-500' }
  }

  // Calculate analytics data
  const getAnalyticsData = () => {
    const totalInventory = variant.allocation_buckets?.reduce((sum, bucket) => sum + bucket.quantity, 0) || 0
    const totalBooked = variant.allocation_buckets?.reduce((sum, bucket) => sum + bucket.booked, 0) || 0
    const totalHeld = variant.allocation_buckets?.reduce((sum, bucket) => sum + bucket.held, 0) || 0
    const availableInventory = totalInventory - totalBooked - totalHeld
    const occupancyRate = totalInventory > 0 ? ((totalBooked + totalHeld) / totalInventory) * 100 : 0
    
    const activeRatePlans = variant.rate_plans?.filter(rp => rp.valid_to >= new Date().toISOString()) || []
    const preferredRatePlan = variant.rate_plans?.find(rp => rp.preferred)
    
    return {
      totalInventory,
      totalBooked,
      totalHeld,
      availableInventory,
      occupancyRate,
      activeRatePlans: activeRatePlans.length,
      preferredRatePlan,
      imagesCount: variant.images?.length || 0,
      attributesCount: Object.keys(variant.attributes || {}).length
    }
  }

  const analytics = getAnalyticsData()

  const renderAttributes = () => {
    if (!variant.attributes || Object.keys(variant.attributes).length === 0) {
      return (
        <div className="text-center py-8">
          <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No attributes defined</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(variant.attributes).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium capitalize text-foreground">
              {key.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-muted-foreground">
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderImages = () => {
    if (!variant.images || variant.images.length === 0) {
      return (
        <div className="text-center py-8">
          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No images uploaded</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {variant.images.map((image: any, index: number) => (
          <div key={index} className="relative group">
            <img
              src={image.url || image.preview}
              alt={image.alt_text || `Image ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border hover:scale-105 transition-transform"
            />
            {image.is_primary && (
              <Badge className="absolute top-1 left-1 text-xs bg-primary">Primary</Badge>
            )}
          </div>
        ))}
      </div>
    )
  }

  const getRatePlanColumns = () => [
    {
      key: 'id',
      header: 'Rate Plan',
      render: (ratePlan: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">#{ratePlan.id}</span>
          {ratePlan.preferred && (
            <Badge className="text-xs bg-primary">
              <Star className="w-3 h-3 mr-1" />
              Preferred
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (ratePlan: any) => (
        <div className="text-sm">
          {ratePlan.suppliers?.name || 'Unknown'}
        </div>
      )
    },
    {
      key: 'inventory_model',
      header: 'Model',
      render: (ratePlan: any) => (
        <Badge variant="outline" className="text-xs">
          {ratePlan.inventory_model}
        </Badge>
      )
    },
    {
      key: 'currency',
      header: 'Currency',
      render: (ratePlan: any) => (
        <span className="text-sm font-medium">{ratePlan.currency}</span>
      )
    },
    {
      key: 'validity',
      header: 'Valid Period',
      render: (ratePlan: any) => (
        <div className="text-sm">
          <div>{format(new Date(ratePlan.valid_from), 'MMM dd, yyyy')}</div>
          <div className="text-muted-foreground">to {format(new Date(ratePlan.valid_to), 'MMM dd, yyyy')}</div>
        </div>
      )
    },
    {
      key: 'channels',
      header: 'Channels',
      render: (ratePlan: any) => (
        <div className="flex flex-wrap gap-1">
          {ratePlan.channels?.slice(0, 2).map((channel: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {channel}
            </Badge>
          ))}
          {ratePlan.channels && ratePlan.channels.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{ratePlan.channels.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'components',
      header: 'Components',
      render: (ratePlan: any) => (
        <div className="flex gap-2 text-xs">
          <span className="text-primary-600">{ratePlan.rate_occupancies?.length || 0} occ</span>
          <span className="text-primary-600">{ratePlan.rate_seasons?.length || 0} seasons</span>
          <span className="text-primary-600">{ratePlan.rate_taxes_fees?.length || 0} taxes</span>
        </div>
      )
    }
  ]

  const renderRatePlans = () => {
    if (!variant.rate_plans || variant.rate_plans.length === 0) {
      return (
        <div className="text-center py-8">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No rate plans configured</p>
        </div>
      )
    }

    return (
      <DataTable
        data={variant.rate_plans}
        columns={getRatePlanColumns()}
        selectedItems={[]}
        onSelectionChange={() => {}}
        getId={(ratePlan) => ratePlan.id}
        emptyState={{
          icon: <DollarSign className="w-8 h-8" />,
          title: "No rate plans",
          description: "No rate plans have been configured for this product variant."
        }}
      />
    )
  }

  const getInventoryColumns = () => [
    {
      key: 'date',
      header: 'Date',
      render: (bucket: any) => (
        <div className="text-sm">
          <div className="font-medium">
            {format(new Date(bucket.date || bucket.event_start_date || new Date()), 'MMM dd, yyyy')}
          </div>
          {bucket.time_slots && (
            <div className="text-xs text-muted-foreground">
              {bucket.time_slots.slot_name} ({bucket.time_slots.slot_time})
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (bucket: any) => {
        const status = getAvailabilityStatus(bucket)
        const available = bucket.quantity - bucket.booked - bucket.held
        const percentage = bucket.quantity > 0 ? (available / bucket.quantity) * 100 : 0
        
        return (
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <div className="text-sm">
              <div className="font-medium">{status.status.replace('_', ' ')}</div>
              <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (bucket: any) => {
        const available = bucket.quantity - bucket.booked - bucket.held
        return (
          <div className="text-sm">
            <div className="font-medium text-primary-600">{available}</div>
            <div className="text-xs text-muted-foreground">of {bucket.quantity} total</div>
          </div>
        )
      }
    },
    {
      key: 'booked',
      header: 'Booked',
      render: (bucket: any) => (
        <div className="text-sm">
          <div className="font-medium text-primary-700">{bucket.booked}</div>
          {bucket.held > 0 && (
            <div className="text-xs text-primary-500">{bucket.held} held</div>
          )}
        </div>
      )
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (bucket: any) => (
        <div className="flex gap-1">
          {bucket.stop_sell && (
            <Badge variant="destructive" className="text-xs">Stop Sell</Badge>
          )}
          {bucket.blackout && (
            <Badge variant="secondary" className="text-xs">Blackout</Badge>
          )}
          {!bucket.stop_sell && !bucket.blackout && (
            <Badge variant="outline" className="text-xs">Active</Badge>
          )}
        </div>
      )
    }
  ]

  const renderInventory = () => {
    if (!variant.allocation_buckets || variant.allocation_buckets.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No inventory configured</p>
        </div>
      )
    }

    // Show recent inventory (last 7 days)
    const recentBuckets = variant.allocation_buckets
      .filter(bucket => {
        const dateStr = bucket.date || bucket.event_start_date
        if (!dateStr) return false
        const bucketDate = new Date(dateStr)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return bucketDate >= weekAgo
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.event_start_date || 0)
        const dateB = new Date(b.date || b.event_start_date || 0)
        return dateB.getTime() - dateA.getTime()
      })

    return (
      <DataTable
        data={recentBuckets}
        columns={getInventoryColumns()}
        selectedItems={[]}
        onSelectionChange={() => {}}
        getId={(bucket) => bucket.id}
        emptyState={{
          icon: <BarChart3 className="w-8 h-8" />,
          title: "No inventory",
          description: "No inventory records found for this product variant."
        }}
      />
    )
  }

  // Summary cards data
  const summaryCards = [
    {
      id: 'inventory',
      title: 'Total Inventory',
      value: analytics.totalInventory.toLocaleString(),
      icon: <Package2 className="w-4 h-4 text-primary-600" />,
      change: '+12%',
      changeType: 'positive' as const,
      description: `${analytics.availableInventory} available`
    },
    {
      id: 'occupancy',
      title: 'Occupancy Rate',
      value: `${analytics.occupancyRate.toFixed(1)}%`,
      icon: <TrendingUp className="w-4 h-4 text-primary-600" />,
      change: '+5.2%',
      changeType: 'positive' as const,
      description: `${analytics.totalBooked} booked, ${analytics.totalHeld} held`
    },
    {
      id: 'rate-plans',
      title: 'Active Rate Plans',
      value: analytics.activeRatePlans.toString(),
      icon: <DollarSign className="w-4 h-4 text-primary-600" />,
      change: '2 plans',
      changeType: 'neutral' as const,
      description: analytics.preferredRatePlan ? `Preferred: Rate Plan #${analytics.preferredRatePlan.id}` : 'No preferred plan'
    },
    {
      id: 'content',
      title: 'Content',
      value: `${analytics.imagesCount} images`,
      icon: <ImageIcon className="w-4 h-4 text-primary-600" />,
      change: `${analytics.attributesCount} attributes`,
      changeType: 'neutral' as const,
      description: 'Product details & media'
    }
  ]

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{variant.name}</h1>
              <Badge 
                variant={variant.status === 'active' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {variant.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {variant.products.name} • {variant.products.type} • Created {format(new Date(variant.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowEditWizard(true)} 
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
        >
          <Edit className="w-4 h-4" />
          Edit Variant
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="mb-6">
        <SummaryCards cards={summaryCards} />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Package2 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Rate Plans
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Inventory
          </TabsTrigger>  
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Images & Attributes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Images */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ImageIcon className="w-5 h-5" />
                  Images
                  {analytics.imagesCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{analytics.imagesCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderImages()}
              </CardContent>
            </Card>

            {/* Attributes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5" />
                  Attributes
                  {analytics.attributesCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{analytics.attributesCount}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderAttributes()}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {variant.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{variant.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5" />
                Rate Plans
                <Badge variant="secondary" className="text-xs">{analytics.activeRatePlans}</Badge>
              </CardTitle>
              <CardDescription>
                Pricing configurations and distribution channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderRatePlans()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5" />
                Inventory & Allocation
                <Badge variant="secondary" className="text-xs">{variant.allocation_buckets?.length || 0}</Badge>
              </CardTitle>
              <CardDescription>
                Recent availability and allocation status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderInventory()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Wizard */}
      {showEditWizard && (
        <SmartProductWizard
          isOpen={showEditWizard}
          onCancel={handleEditCancel}
          onComplete={handleEditComplete}
          existingVariant={{
            ...variant,
            product_id: variant.products.id,
            attributes: variant.attributes || {}
          }}
        />
      )}
    </>
  )
}
