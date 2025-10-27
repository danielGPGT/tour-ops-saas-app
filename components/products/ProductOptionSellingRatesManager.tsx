'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, DollarSign, Calendar, CheckCircle, XCircle, Clock, Target, TrendingUp, Users, Package, MapPin, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/common/EmptyState'
import { InlineEdit } from '@/components/common/InlineEdit'
import { InlineDropdown } from '@/components/common/InlineDropdown'
import { formatCurrency } from '@/lib/utils/formatting'
import { formatDate } from '@/lib/utils/formatting'
import { useSellingRates, useCreateSellingRate, useUpdateSellingRate, useDeleteSellingRate } from '@/lib/hooks/useProducts'
import type { SellingRate } from '@/lib/types/product'
import type { ProductOption } from '@/lib/types/product-option'
import { SellingRateStep } from '@/components/products/forms/selling-rate-step'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sellingRateSchema, getDefaultRateBasis } from '@/lib/validations/selling-rate.schema'
import type { SellingRateFormData } from '@/lib/validations/selling-rate.schema'
import type { Product } from '@/lib/types/product'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface ProductOptionSellingRatesManagerProps {
  productId: string
  productOption: ProductOption
  productType?: string
  product: Product
}

export function ProductOptionSellingRatesManager({
  productId,
  productOption,
  productType,
  product
}: ProductOptionSellingRatesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<SellingRate | null>(null)
  
  const { data: sellingRates, isLoading } = useSellingRates(productId, productOption.id)
  const createSellingRate = useCreateSellingRate()
  const updateSellingRate = useUpdateSellingRate()
  const deleteSellingRate = useDeleteSellingRate()

  // Form for creating/editing selling rates
  const form = useForm({
    resolver: zodResolver(sellingRateSchema),
    defaultValues: {
      rate_name: '',
      rate_basis: getDefaultRateBasis(productType || 'accommodation'),
      valid_from: new Date(),
      valid_to: new Date(),
      base_price: 0,
      currency: 'GBP',
      markup_type: null,
      markup_amount: 0,
      target_cost: null,
      pricing_details: {
        minimum_nights: 3,
        maximum_nights: 14,
        daily_rates: {}
      },
      is_active: true
    }
  })

  const handleCreateRate = async (data: any) => {
    try {
      await createSellingRate.mutateAsync({
        product_id: productId,
        product_option_id: productOption.id,
        ...data
      })
      setIsCreateDialogOpen(false)
      form.reset()
    } catch (error) {
      console.error('Error creating selling rate:', error)
    }
  }

  const handleUpdateRate = async (data: any) => {
    if (!editingRate) return
    
    try {
      await updateSellingRate.mutateAsync({
        id: editingRate.id,
        data
      })
      setEditingRate(null)
      form.reset()
    } catch (error) {
      console.error('Error updating selling rate:', error)
    }
  }

  const handleDeleteRate = async (rateId: string) => {
    if (confirm('Are you sure you want to delete this selling rate?')) {
      try {
        await deleteSellingRate.mutateAsync(rateId)
      } catch (error) {
        console.error('Error deleting selling rate:', error)
      }
    }
  }

  const openEditDialog = (rate: SellingRate) => {
    setEditingRate(rate)
    form.reset({
      rate_name: rate.rate_name || '',
      rate_basis: rate.rate_basis,
      valid_from: new Date(rate.valid_from),
      valid_to: new Date(rate.valid_to),
      base_price: rate.base_price,
      currency: rate.currency || 'GBP',
      markup_type: rate.markup_type,
      markup_amount: rate.markup_amount || 0,
      target_cost: rate.pricing_details?.target_cost || null,
      pricing_details: rate.pricing_details || {
        minimum_nights: 3,
        maximum_nights: 14,
        daily_rates: {}
      },
      is_active: rate.is_active ?? true
    })
  }

  const closeEditDialog = () => {
    setEditingRate(null)
    form.reset()
  }

  // Helper function to update selling rate fields
  const updateSellingRateField = async (rateId: string, field: string, value: any) => {
    try {
      await updateSellingRate.mutateAsync({
        id: rateId,
        data: { [field]: value }
      })
    } catch (error) {
      console.error('Error updating selling rate field:', error)
    }
  }

  // Helper function to update pricing details
  const updatePricingDetails = async (rateId: string, field: string, value: any) => {
    try {
      const currentRate = sellingRates?.find(r => r.id === rateId)
      const currentDetails = currentRate?.pricing_details || {}
      const newDetails = { ...currentDetails, [field]: value }
      
      await updateSellingRate.mutateAsync({
        id: rateId,
        data: { pricing_details: newDetails }
      })
    } catch (error) {
      console.error('Error updating pricing details:', error)
    }
  }

  // Helper function to toggle selling rate active status
  const toggleSellingRateStatus = async (rateId: string, isActive: boolean) => {
    try {
      await updateSellingRate.mutateAsync({
        id: rateId,
        data: { is_active: isActive }
      })
    } catch (error) {
      console.error('Error toggling selling rate status:', error)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selling Rates</CardTitle>
          <CardDescription>Manage pricing for this product option</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading selling rates...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Selling Rates</CardTitle>
              <CardDescription>Manage pricing for this product option</CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!sellingRates || sellingRates.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="h-12 w-12" />}
              title="No selling rates"
              description="Create your first selling rate to start pricing this product option"
              action={{
                label: 'Create Rate',
                onClick: () => setIsCreateDialogOpen(true),
                icon: <Plus className="h-4 w-4 mr-2" />
              }}
            />
          ) : (
            <div className="space-y-6">
              {sellingRates.map((rate) => (
                <Card key={rate.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <InlineEdit
                            value={rate.rate_name || 'Unnamed Rate'}
                            onSave={async (value) => await updateSellingRateField(rate.id, 'rate_name', value)}
                            placeholder="Enter rate name"
                            className="text-lg font-semibold"
                          />
                          <Badge variant={rate.is_active ? 'default' : 'secondary'}>
                            {rate.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Created {formatDate(rate.created_at || '')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Updated {formatDate(rate.updated_at || '')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rate.is_active || false}
                          onCheckedChange={(checked) => toggleSellingRateStatus(rate.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(rate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRate(rate.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>Rate Basis</span>
                        </div>
                        <InlineDropdown
                          value={rate.rate_basis}
                          onValueChange={(value) => updateSellingRateField(rate.id, 'rate_basis', value)}
                          options={[
                            { value: 'per_night', label: 'Per Night' },
                            { value: 'per_person', label: 'Per Person' },
                            { value: 'per_booking', label: 'Per Booking' },
                            { value: 'per_unit', label: 'Per Unit' },
                            { value: 'per_day', label: 'Per Day' }
                          ]}
                          placeholder="Select basis"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          <span>Base Price</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <InlineDropdown
                            value={rate.currency || 'GBP'}
                            onValueChange={(value) => updateSellingRateField(rate.id, 'currency', value)}
                            options={[
                              { value: 'GBP', label: 'GBP (£)' },
                              { value: 'USD', label: 'USD ($)' },
                              { value: 'EUR', label: 'EUR (€)' },
                              { value: 'AUD', label: 'AUD (A$)' },
                              { value: 'CAD', label: 'CAD (C$)' }
                            ]}
                            placeholder="Currency"
                          />
                          <InlineEdit
                            value={rate.base_price.toString()}
                            onSave={async (value) => await updateSellingRateField(rate.id, 'base_price', parseFloat(value) || 0)}
                            placeholder="0.00"
                            validation={(value) => {
                              if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                                return 'Please enter a valid price'
                              }
                              return null
                            }}
                            className="font-medium"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Valid From</span>
                        </div>
                        <InlineEdit
                          value={formatDate(rate.valid_from)}
                          onSave={async (value) => {
                            const date = new Date(value)
                            if (!isNaN(date.getTime())) {
                              await updateSellingRateField(rate.id, 'valid_from', date.toISOString().split('T')[0])
                            }
                          }}
                          placeholder="Select date"
                          validation={(value) => {
                            const date = new Date(value)
                            if (isNaN(date.getTime())) {
                              return 'Please enter a valid date'
                            }
                            return null
                          }}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Valid To</span>
                        </div>
                        <InlineEdit
                          value={formatDate(rate.valid_to)}
                          onSave={async (value) => {
                            const date = new Date(value)
                            if (!isNaN(date.getTime())) {
                              await updateSellingRateField(rate.id, 'valid_to', date.toISOString().split('T')[0])
                            }
                          }}
                          placeholder="Select date"
                          validation={(value) => {
                            const date = new Date(value)
                            if (isNaN(date.getTime())) {
                              return 'Please enter a valid date'
                            }
                            return null
                          }}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Pricing Details - Dynamic based on rate_basis */}
                    <div className="space-y-6">
                      <h4 className="font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Pricing Details
                      </h4>
                      
                      {/* Basic Pricing Fields - Always visible */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Target Cost - Always visible */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span>Target Cost</span>
                          </div>
                          <InlineEdit
                            value={rate.pricing_details?.target_cost?.toString() || ''}
                            onSave={async (value) => await updatePricingDetails(rate.id, 'target_cost', value ? parseFloat(value) : null)}
                            placeholder="Enter target cost"
                            validation={(value) => {
                              if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
                                return 'Please enter a valid cost'
                              }
                              return null
                            }}
                            className="font-medium"
                          />
                        </div>

                        {/* Min/Max Nights - Only for per_night and per_day */}
                        {['per_night', 'per_day'].includes(rate.rate_basis) && (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Min {rate.rate_basis === 'per_night' ? 'Nights' : 'Days'}</span>
                              </div>
                              <InlineEdit
                                value={rate.pricing_details?.minimum_nights?.toString() || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'minimum_nights', value ? parseInt(value) : null)}
                                placeholder={`Enter min ${rate.rate_basis === 'per_night' ? 'nights' : 'days'}`}
                                validation={(value) => {
                                  if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                                    return 'Please enter a valid number'
                                  }
                                  return null
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>Max {rate.rate_basis === 'per_night' ? 'Nights' : 'Days'}</span>
                              </div>
                              <InlineEdit
                                value={rate.pricing_details?.maximum_nights?.toString() || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'maximum_nights', value ? parseInt(value) : null)}
                                placeholder={`Enter max ${rate.rate_basis === 'per_night' ? 'nights' : 'days'}`}
                                validation={(value) => {
                                  if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                                    return 'Please enter a valid number'
                                  }
                                  return null
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Min/Max Days - Only for per_day */}
                        {rate.rate_basis === 'per_day' && (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Min Days</span>
                              </div>
                              <InlineEdit
                                value={rate.pricing_details?.minimum_days?.toString() || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'minimum_days', value ? parseInt(value) : null)}
                                placeholder="Enter min days"
                                validation={(value) => {
                                  if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                                    return 'Please enter a valid number'
                                  }
                                  return null
                                }}
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>Max Days</span>
                              </div>
                              <InlineEdit
                                value={rate.pricing_details?.maximum_days?.toString() || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'maximum_days', value ? parseInt(value) : null)}
                                placeholder="Enter max days"
                                validation={(value) => {
                                  if (value && (isNaN(parseInt(value)) || parseInt(value) < 0)) {
                                    return 'Please enter a valid number'
                                  }
                                  return null
                                }}
                              />
                            </div>
                          </>
                        )}

                        {/* Markup Type */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>Markup Type</span>
                          </div>
                          <InlineDropdown
                            value={rate.markup_type || 'none'}
                            onValueChange={(value) => updateSellingRateField(rate.id, 'markup_type', value === 'none' ? null : value)}
                            options={[
                              { value: 'none', label: 'None' },
                              { value: 'percentage', label: 'Percentage' },
                              { value: 'fixed', label: 'Fixed Amount' }
                            ]}
                            placeholder="Select type"
                          />
                        </div>

                        {/* Markup Amount */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>Markup Amount</span>
                          </div>
                          <InlineEdit
                            value={rate.markup_amount?.toString() || ''}
                            onSave={async (value) => await updateSellingRateField(rate.id, 'markup_amount', value ? parseFloat(value) : null)}
                            placeholder="Enter markup"
                            validation={(value) => {
                              if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
                                return 'Please enter a valid amount'
                              }
                              return null
                            }}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Advanced Options - In Accordions */}
                      <Accordion type="multiple" className="w-full">
                        {/* Daily Rates Management */}
                        <AccordionItem value="daily-rates">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Daily Rates ({Object.keys(rate.pricing_details?.daily_rates || {}).length} dates)</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Daily Rates ({Object.keys(rate.pricing_details?.daily_rates || {}).length} dates)</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {/* TODO: Open daily rates editor */}}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Daily Rates
                          </Button>
                        </div>
                        
                        {rate.pricing_details?.daily_rates && Object.keys(rate.pricing_details.daily_rates).length > 0 ? (
                          <div className="space-y-2">
                            {Object.entries(rate.pricing_details.daily_rates).slice(0, 5).map(([date, price]: [string, any]) => (
                              <div key={date} className="flex items-center justify-between bg-muted p-3 rounded">
                                <span className="font-medium">{formatDate(date)}</span>
                                <div className="flex items-center gap-2">
                                  <InlineEdit
                                    value={price.toString()}
                                    onSave={async (value) => {
                                      const newDailyRates = { ...rate.pricing_details?.daily_rates }
                                      newDailyRates[date] = parseFloat(value) || 0
                                      await updatePricingDetails(rate.id, 'daily_rates', newDailyRates)
                                    }}
                                    placeholder="0.00"
                                    validation={(value) => {
                                      if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                                        return 'Please enter a valid price'
                                      }
                                      return null
                                    }}
                                    className="font-medium text-right"
                                  />
                                  <span className="text-sm text-muted-foreground">{rate.currency || 'GBP'}</span>
                                </div>
                              </div>
                            ))}
                            {Object.keys(rate.pricing_details.daily_rates).length > 5 && (
                              <div className="text-center text-muted-foreground text-sm py-2">
                                +{Object.keys(rate.pricing_details.daily_rates).length - 5} more dates
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No daily rates configured. Click "Edit Daily Rates" to add them.
                          </div>
                        )}
                      </div>
                          </AccordionContent>
                        </AccordionItem>

                      {/* Occupancy Pricing Management */}
                      <AccordionItem value="occupancy-pricing">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Occupancy Pricing ({rate.pricing_details?.occupancy_pricing?.length || 0} configs)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Add new occupancy config */}}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Config
                            </Button>
                          </div>
                      <div className="space-y-4">
                        
                        {rate.pricing_details?.occupancy_pricing && rate.pricing_details.occupancy_pricing.length > 0 ? (
                          <div className="space-y-3">
                            {rate.pricing_details.occupancy_pricing.map((config: any, index: number) => (
                              <div key={index} className="bg-muted p-4 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Configuration {index + 1}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {/* TODO: Remove config */}}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Config Name</label>
                                    <InlineEdit
                                      value={config.config_name || ''}
                                      onSave={async (value) => {
                                        const newOccupancy = [...(rate.pricing_details?.occupancy_pricing || [])]
                                        newOccupancy[index] = { ...newOccupancy[index], config_name: value }
                                        await updatePricingDetails(rate.id, 'occupancy_pricing', newOccupancy)
                                      }}
                                      placeholder="e.g., Double"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Adults</label>
                                    <InlineEdit
                                      value={config.adults?.toString() || ''}
                                      onSave={async (value) => {
                                        const newOccupancy = [...(rate.pricing_details?.occupancy_pricing || [])]
                                        newOccupancy[index] = { ...newOccupancy[index], adults: parseInt(value) || 0 }
                                        await updatePricingDetails(rate.id, 'occupancy_pricing', newOccupancy)
                                      }}
                                      placeholder="2"
                                      validation={(value) => {
                                        if (isNaN(parseInt(value)) || parseInt(value) < 0) {
                                          return 'Please enter a valid number'
                                        }
                                        return null
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Children</label>
                                    <InlineEdit
                                      value={config.children?.toString() || ''}
                                      onSave={async (value) => {
                                        const newOccupancy = [...(rate.pricing_details?.occupancy_pricing || [])]
                                        newOccupancy[index] = { ...newOccupancy[index], children: parseInt(value) || 0 }
                                        await updatePricingDetails(rate.id, 'occupancy_pricing', newOccupancy)
                                      }}
                                      placeholder="0"
                                      validation={(value) => {
                                        if (isNaN(parseInt(value)) || parseInt(value) < 0) {
                                          return 'Please enter a valid number'
                                        }
                                        return null
                                      }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Multiplier</label>
                                    <InlineEdit
                                      value={config.multiplier?.toString() || ''}
                                      onSave={async (value) => {
                                        const newOccupancy = [...(rate.pricing_details?.occupancy_pricing || [])]
                                        newOccupancy[index] = { ...newOccupancy[index], multiplier: parseFloat(value) || 1.0 }
                                        await updatePricingDetails(rate.id, 'occupancy_pricing', newOccupancy)
                                      }}
                                      placeholder="1.0"
                                      validation={(value) => {
                                        if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                                          return 'Please enter a valid multiplier'
                                        }
                                        return null
                                      }}
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Description</label>
                                  <InlineEdit
                                    value={config.description || ''}
                                    onSave={async (value) => {
                                      const newOccupancy = [...(rate.pricing_details?.occupancy_pricing || [])]
                                      newOccupancy[index] = { ...newOccupancy[index], description: value }
                                      await updatePricingDetails(rate.id, 'occupancy_pricing', newOccupancy)
                                    }}
                                    placeholder="Optional description"
                                    multiline
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No occupancy configurations. Click "Add Config" to create them.
                          </div>
                        )}
                      </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Extras Management */}
                      <AccordionItem value="extras">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>Extras ({rate.pricing_details?.extras?.length || 0} items)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Add new extra */}}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Extra
                            </Button>
                          </div>
                      <div className="space-y-4">
                        
                        {rate.pricing_details?.extras && rate.pricing_details.extras.length > 0 ? (
                          <div className="space-y-3">
                            {rate.pricing_details.extras.map((extra: any, index: number) => (
                              <div key={index} className="bg-muted p-4 rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Extra {index + 1}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {/* TODO: Remove extra */}}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Name</label>
                                    <InlineEdit
                                      value={extra.name || ''}
                                      onSave={async (value) => {
                                        const newExtras = [...(rate.pricing_details?.extras || [])]
                                        newExtras[index] = { ...newExtras[index], name: value }
                                        await updatePricingDetails(rate.id, 'extras', newExtras)
                                      }}
                                      placeholder="e.g., Early Check-in"
                                    />
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Price</label>
                                    <div className="flex items-center gap-2">
                                      <InlineEdit
                                        value={extra.price?.toString() || ''}
                                        onSave={async (value) => {
                                          const newExtras = [...(rate.pricing_details?.extras || [])]
                                          newExtras[index] = { ...newExtras[index], price: parseFloat(value) || 0 }
                                          await updatePricingDetails(rate.id, 'extras', newExtras)
                                        }}
                                        placeholder="0.00"
                                        validation={(value) => {
                                          if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
                                            return 'Please enter a valid price'
                                          }
                                          return null
                                        }}
                                        className="font-medium"
                                      />
                                      <span className="text-sm text-muted-foreground">{rate.currency || 'GBP'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-muted-foreground">Description</label>
                                  <InlineEdit
                                    value={extra.description || ''}
                                    onSave={async (value) => {
                                      const newExtras = [...(rate.pricing_details?.extras || [])]
                                      newExtras[index] = { ...newExtras[index], description: value }
                                      await updatePricingDetails(rate.id, 'extras', newExtras)
                                    }}
                                    placeholder="Optional description"
                                    multiline
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <label className="text-xs text-muted-foreground">Available</label>
                                  <Switch
                                    checked={extra.available !== false}
                                    onCheckedChange={(checked) => {
                                      const newExtras = [...(rate.pricing_details?.extras || [])]
                                      newExtras[index] = { ...newExtras[index], available: checked }
                                      updatePricingDetails(rate.id, 'extras', newExtras)
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No extras configured. Click "Add Extra" to create them.
                          </div>
                        )}
                      </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Policies & Terms Management */}
                      <AccordionItem value="policies">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            <span>Policies & Terms</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Cancellation Policy</label>
                              <InlineEdit
                                value={rate.pricing_details?.cancellation_policy || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'cancellation_policy', value || null)}
                                placeholder="e.g., Free cancellation up to 30 days before arrival"
                                multiline
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Payment Terms</label>
                              <InlineEdit
                                value={rate.pricing_details?.payment_terms || ''}
                                onSave={async (value) => await updatePricingDetails(rate.id, 'payment_terms', value || null)}
                                placeholder="e.g., 30% deposit at booking, balance due 30 days before arrival"
                                multiline
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Inclusions Management */}
                      <AccordionItem value="inclusions">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>Inclusions ({rate.pricing_details?.inclusions?.length || 0} items)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="flex items-center justify-between mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* TODO: Add new inclusion */}}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Inclusion
                            </Button>
                          </div>
                      <div className="space-y-4">
                        
                        {rate.pricing_details?.inclusions && rate.pricing_details.inclusions.length > 0 ? (
                          <div className="space-y-2">
                            {rate.pricing_details.inclusions.map((inclusion: string, index: number) => (
                              <div key={index} className="flex items-center gap-2 bg-muted p-3 rounded">
                                <InlineEdit
                                  value={inclusion}
                                  onSave={async (value) => {
                                    const newInclusions = [...(rate.pricing_details?.inclusions || [])]
                                    newInclusions[index] = value
                                    await updatePricingDetails(rate.id, 'inclusions', newInclusions)
                                  }}
                                  placeholder="e.g., Daily breakfast"
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {/* TODO: Remove inclusion */}}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No inclusions configured. Click "Add Inclusion" to create them.
                          </div>
                        )}
                      </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    </div>

                    {/* Margin Calculation */}
                    {rate.pricing_details?.target_cost && rate.base_price > 0 && (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            <span>Expected Margin</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(rate.base_price - rate.pricing_details.target_cost, rate.currency || 'GBP')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rate.pricing_details.target_cost > 0 
                                ? `${(((rate.base_price - rate.pricing_details.target_cost) / rate.pricing_details.target_cost) * 100).toFixed(1)}%`
                                : 'N/A'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Rate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Selling Rate</DialogTitle>
            <DialogDescription>
              Set up pricing for {productOption.option_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use the comprehensive universal selling rate form below to configure pricing for {productOption.option_name}.
              The form adapts based on your product type and rate basis selection.
            </div>
            <SellingRateStep
              form={form}
              product={product}
              onSubmit={handleCreateRate}
              onBack={() => setIsCreateDialogOpen(false)}
              isSubmitting={createSellingRate.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={!!editingRate} onOpenChange={closeEditDialog}>
        <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Selling Rate</DialogTitle>
            <DialogDescription>
              Update pricing for {productOption.option_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Update pricing for {productOption.option_name}. The form adapts based on your rate basis selection.
            </div>
            <SellingRateStep
              form={form}
              product={product}
              onSubmit={handleUpdateRate}
              onBack={closeEditDialog}
              isSubmitting={updateSellingRate.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
