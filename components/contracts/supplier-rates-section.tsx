"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/common/EmptyState'
import { TableSkeleton } from '@/components/common/LoadingSkeleton'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EnterpriseInlineEdit } from '@/components/common/EnterpriseInlineEdit'
import { SupplierRateModal } from '@/components/contracts/supplier-rate-modal'
import { useSupplierRates, useCreateSupplierRate, useUpdateSupplierRate, useDeleteSupplierRate } from '@/lib/hooks/useContracts'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { 
  Plus, 
  Edit, 
  Trash2, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Package,
  ChevronDown,
  ChevronUp,
  Users,
  Car,
  Baby,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'

interface SupplierRatesSectionProps {
  contractId: string
  organizationId?: string
}

export function SupplierRatesSection({ contractId, organizationId }: SupplierRatesSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingRate, setEditingRate] = useState<any>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [rateToDelete, setRateToDelete] = useState<string | null>(null)

  const { data: rates = [], isLoading, error } = useSupplierRates(contractId)
  const createRate = useCreateSupplierRate()
  const updateRate = useUpdateSupplierRate()
  const deleteRate = useDeleteSupplierRate()

  const handleEdit = (rate: any) => {
    setEditingRate(rate)
    setShowForm(true)
  }

  const handleDelete = (rateId: string) => {
    setRateToDelete(rateId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!rateToDelete) return

    try {
      await deleteRate.mutateAsync(rateToDelete)
      toast.success('Supplier rate deleted successfully')
      setDeleteDialogOpen(false)
      setRateToDelete(null)
    } catch (error) {
      toast.error('Failed to delete supplier rate')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingRate(null)
  }

  const handleSaveRate = async (rateData: any) => {
    try {
      if (editingRate) {
        await updateRate.mutateAsync({
          id: editingRate.id,
          data: rateData
        })
        toast.success('Supplier rate updated successfully')
      } else {
        await createRate.mutateAsync({
          ...rateData,
          contract_id: contractId,
          organization_id: organizationId || ''
        })
        toast.success('Supplier rate created successfully')
      }
      handleFormSuccess()
    } catch (error) {
      toast.error('Failed to save supplier rate')
      throw error // Re-throw to let modal handle the error
    }
  }

  const handleInlineUpdate = async (rateId: string, field: string, value: any) => {
    try {
      await updateRate.mutateAsync({
        id: rateId,
        data: { [field]: value }
      })
      toast.success('Rate updated successfully')
    } catch (error) {
      toast.error('Failed to update rate')
      throw error
    }
  }

  const getRateBasisBadge = (rateBasis: string) => {
    const variants = {
      per_person: 'default',
      per_room: 'secondary',
      per_booking: 'outline',
      per_night: 'destructive'
    } as const

    return (
      <Badge variant={variants[rateBasis as keyof typeof variants] || 'outline'}>
        {rateBasis?.replace('_', ' ').toUpperCase() || 'Unknown'}
      </Badge>
    )
  }

  if (isLoading) {
    return <TableSkeleton rows={5} columns={7} />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading supplier rates: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <SupplierRateModal
        open={showForm}
        onOpenChange={setShowForm}
        rate={editingRate}
        contractId={contractId}
        mode={editingRate ? "edit" : "add"}
        onSave={handleSaveRate}
      />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Rates</h3>
          <p className="text-sm text-muted-foreground">
            Manage supplier rates and pricing for products in this contract
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Rate
        </Button>
      </div>

      {rates.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="No Supplier Rates"
          description="Add supplier rates to define pricing for products in this contract."
          action={{
            label: "Add Supplier Rate",
            onClick: () => setShowForm(true),
            icon: <Plus className="h-4 w-4" />
          }}
        />
      ) : (
        <Accordion type="multiple" className="">
          {rates.map((rate: any) => (
            <AccordionItem key={rate.id} value={rate.id} className="">
              <Card className="py-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-8">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={rate.is_active ? "default" : "secondary"}>
                          {rate.is_active ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                        <EnterpriseInlineEdit
                          value={rate.rate_name || 'Unnamed Rate'}
                          onSave={(value) => handleInlineUpdate(rate.id, 'rate_name', value)}
                          className="font-semibold text-base"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {rate.product?.name || 'Unknown Product'}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1">
                  
                          {rate.base_cost?.toFixed(2)} {rate.currency}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(rate.valid_from), 'MMM dd')} - {format(new Date(rate.valid_to), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rate.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Left Column - Basic Info */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Basic Information
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Rate Basis:</span>
                              <span>{getRateBasisBadge(rate.rate_basis)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valid From:</span>
                              <span>{format(new Date(rate.valid_from), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valid To:</span>
                              <span>{format(new Date(rate.valid_to), 'MMM dd, yyyy')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Currency:</span>
                              <Badge variant="outline">{rate.currency}</Badge>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Product Details
                          </h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Product:</span>
                              <span className="font-medium">{rate.product?.name || 'N/A'}</span>
                            </div>
                            {rate.product?.code && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Product Code:</span>
                                <span>{rate.product.code}</span>
                              </div>
                            )}
                            {rate.product_option && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Option:</span>
                                <span className="font-medium">{rate.product_option.option_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Pricing */}
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Pricing Information
                          </h5>
                          <div className="space-y-2">
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="text-sm text-muted-foreground mb-2">Base Cost</div>
                              <div className="flex items-baseline gap-2">
                                <EnterpriseInlineEdit
                                  value={rate.base_cost?.toString() || '0'}
                                  onSave={(value) => handleInlineUpdate(rate.id, 'base_cost', parseFloat(value))}
                                  type="number"
                                  className="text-xl font-bold"
                                />
                                <span className="text-sm text-muted-foreground">{rate.currency} per {rate.rate_basis?.replace('per_', '').replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Pricing Details */}
                        {rate.pricing_details && Object.keys(rate.pricing_details).length > 0 && (
                          <div>
                            <h5 className="text-sm font-semibold mb-3">Additional Pricing</h5>
                            <div className="space-y-3 text-sm">
                              {/* Multi-Occupancy Pricing */}
                              {rate.pricing_details.occupancy_pricing && Object.keys(rate.pricing_details.occupancy_pricing).length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="font-medium">Multi-Occupancy Pricing</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-2">
                                    {Object.entries(rate.pricing_details.occupancy_pricing).map(([key, pricing]: [string, any]) => (
                                      <div key={key} className="p-2 bg-muted/50 rounded text-xs">
                                        <div className="font-medium">{key}</div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-muted-foreground">{pricing.adults} adults, {pricing.children || 0} children</span>
                                          <span className="font-medium">{pricing.cost_per_night?.toFixed(2)} {rate.currency}/night</span>
                                        </div>
                                        {pricing.notes && (
                                          <div className="text-muted-foreground mt-1 italic">{pricing.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Vehicle Rates */}
                              {rate.pricing_details.vehicle_rates && Object.keys(rate.pricing_details.vehicle_rates).length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <Car className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="font-medium">Vehicle Rates</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-2">
                                    {Object.entries(rate.pricing_details.vehicle_rates).map(([key, details]: [string, any]) => (
                                      <div key={key} className="p-2 bg-muted/50 rounded text-xs">
                                        <div className="font-medium">{key}</div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-muted-foreground">{details.passengers} passengers</span>
                                          <span className="font-medium">{details.cost_per_transfer?.toFixed(2)} {rate.currency}</span>
                                        </div>
                                        {details.notes && (
                                          <div className="text-muted-foreground mt-1 italic">{details.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Age-Based Pricing */}
                              {rate.pricing_details.age_pricing && Object.keys(rate.pricing_details.age_pricing).length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <Baby className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="font-medium">Age-Based Pricing</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-2">
                                    {Object.entries(rate.pricing_details.age_pricing).map(([key, details]: [string, any]) => (
                                      <div key={key} className="p-2 bg-muted/50 rounded text-xs">
                                        <div className="font-medium">{key}</div>
                                        <div className="flex justify-between mt-1">
                                          <span className="text-muted-foreground">Age {details.age_range}</span>
                                          <span className="font-medium">{details.cost?.toFixed(2)} {rate.currency}</span>
                                        </div>
                                        {details.notes && (
                                          <div className="text-muted-foreground mt-1 italic">{details.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Extras */}
                              {rate.pricing_details.extras && Object.keys(rate.pricing_details.extras).length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <Plus className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                    <div className="flex-1">
                                      <div className="font-medium">Extras & Add-ons</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {Object.entries(rate.pricing_details.extras).map(([key, cost]: [string, any]) => (
                                      <div key={key} className="flex justify-between p-2 bg-muted/50 rounded text-xs">
                                        <span>{key}</span>
                                        <span className="font-medium">{cost?.toFixed(2)} {rate.currency}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Inclusions */}
                              {rate.pricing_details.includes && rate.pricing_details.includes.length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                                    <div className="flex-1">
                                      <div className="font-medium">Included</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {rate.pricing_details.includes.map((item: string, idx: number) => (
                                      <div key={idx} className="p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs text-green-900 dark:text-green-400">
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Exclusions */}
                              {rate.pricing_details.excludes && rate.pricing_details.excludes.length > 0 && (
                                <div>
                                  <div className="flex items-start gap-2 mb-2">
                                    <XCircle className="h-4 w-4 mt-0.5 text-red-600" />
                                    <div className="flex-1">
                                      <div className="font-medium">Excluded</div>
                                    </div>
                                  </div>
                                  <div className="ml-6 space-y-1">
                                    {rate.pricing_details.excludes.map((item: string, idx: number) => (
                                      <div key={idx} className="p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs text-red-900 dark:text-red-400">
                                        {item}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Supplier Rate"
        description="Are you sure you want to delete this supplier rate? This action cannot be undone."
        onConfirm={confirmDelete}
      />
    </div>
  )
}
