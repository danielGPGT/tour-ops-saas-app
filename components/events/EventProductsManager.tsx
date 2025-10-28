'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  Plus, 
  Package, 
  Unlink, 
  ExternalLink,
  Filter,
  Building2,
  DollarSign,
  BarChart3
} from 'lucide-react'
import { useEventProducts, useLinkProductToEvent, useUnlinkProductFromEvent, useBulkLinkProducts, useBulkUnlinkProducts } from '@/lib/hooks/useEvents'
import { useProducts } from '@/lib/hooks/useProducts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface EventProductsManagerProps {
  eventId: string
  organizationId: string
}

export function EventProductsManager({ eventId, organizationId }: EventProductsManagerProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const router = useRouter()

  const { data: linkedProducts = [], isLoading: loadingLinked } = useEventProducts(eventId)
  const { data: allProductsResponse, isLoading: loadingAll } = useProducts(
    organizationId,
    { search: searchTerm, product_type: typeFilter !== 'all' ? typeFilter : undefined },
    undefined,
    1,
    50
  )

  const allProducts = allProductsResponse?.data || []
  const linkProduct = useLinkProductToEvent()
  const unlinkProduct = useUnlinkProductFromEvent()
  const bulkLinkProducts = useBulkLinkProducts()
  const bulkUnlinkProducts = useBulkUnlinkProducts()

  // Get available products (not already linked)
  const linkedProductIds = new Set(linkedProducts.map(p => p.id))
  const availableProducts = allProducts.filter(p => !linkedProductIds.has(p.id))

  const handleLinkProduct = async (productId: string) => {
    try {
      await linkProduct.mutateAsync({ eventId, productId })
      toast.success('Product linked to event')
    } catch (error: any) {
      console.error('Error linking product:', error)
      toast.error('Failed to link product: ' + (error.message || 'Unknown error'))
    }
  }

  const handleUnlinkProduct = async (productId: string) => {
    try {
      await unlinkProduct.mutateAsync({ eventId, productId })
      toast.success('Product unlinked from event')
    } catch (error: any) {
      console.error('Error unlinking product:', error)
      toast.error('Failed to unlink product: ' + (error.message || 'Unknown error'))
    }
  }

  const handleBulkLink = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product')
      return
    }

    try {
      await bulkLinkProducts.mutateAsync({ eventId, productIds: selectedProducts })
      toast.success(`${selectedProducts.length} products linked to event`)
      setSelectedProducts([])
      setShowLinkDialog(false)
    } catch (error: any) {
      console.error('Error bulk linking products:', error)
      toast.error('Failed to link products: ' + (error.message || 'Unknown error'))
    }
  }

  const handleProductSelect = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

  // Get unique product types for filter
  const productTypes = Array.from(new Set(allProducts.map(p => p.product_type).filter(Boolean)))

  if (loadingLinked) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Linked Products</h3>
          <p className="text-sm text-muted-foreground">
            Products available for this event ({linkedProducts.length} linked)
          </p>
        </div>
        <Button onClick={() => setShowLinkDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Link Products
        </Button>
      </div>

      {/* Linked Products List */}
      {linkedProducts.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Products Linked</h3>
              <p className="text-muted-foreground mb-4">
                Link products to this event to manage their inventory and allocations
              </p>
              <Button onClick={() => setShowLinkDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Link Your First Product
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linkedProducts.map(product => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{product.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {product.product_type}
                      </Badge>
                      <span className="text-xs">Code: {product.code}</span>
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlinkProduct(product.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Product Stats */}
                {product.contract_allocations && product.contract_allocations.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-sm font-semibold">
                        {product.contract_allocations.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Allocations</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-sm font-semibold">
                        {product.contract_allocations.reduce((sum: number, alloc: any) => 
                          sum + (alloc.total_quantity || 0), 0
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Total Units</div>
                    </div>
                    <div className="p-2 bg-muted/50 rounded">
                      <div className="text-sm font-semibold">
                        {product.product_options?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Options</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No allocations yet
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/products/${product.id}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Product
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/products/${product.id}?tab=allocations`)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Allocations
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link Products Dialog */}
      {showLinkDialog && (
        <Dialog open onOpenChange={setShowLinkDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Link Products to Event</DialogTitle>
              <DialogDescription>
                Select products to link to this event
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Search and Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {productTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Available Products */}
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {loadingAll ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm || typeFilter !== 'all' 
                        ? 'No products match your search'
                        : 'All products are already linked to this event'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableProducts.map(product => (
                      <div key={product.id} className="p-4 hover:bg-muted/30">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => 
                              handleProductSelect(product.id, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">{product.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {product.product_type}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Code: {product.code}
                            </p>
                            {product.attributes?.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {product.attributes.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkLink}
                    disabled={selectedProducts.length === 0 || bulkLinkProducts.isPending}
                  >
                    {bulkLinkProducts.isPending ? 'Linking...' : 'Link Selected'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
