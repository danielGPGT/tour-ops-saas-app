"use client"

import React from 'react'
import { DataTable } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  Eye, 
  MapPin, 
  Star,
  Calendar,
  Clock,
  Car,
  Ticket,
  Package
} from 'lucide-react'
import { format } from 'date-fns'
import type { Product } from '@/lib/types/product'

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onView: (product: Product) => void
  onRowClick?: (product: Product) => void
  isLoading?: boolean
}

export function ProductList({ products, onEdit, onDelete, onView, onRowClick, isLoading }: ProductListProps) {
  const getProductTypeIcon = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'hotel':
        return <Star className="h-4 w-4" />
      case 'event_ticket':
        return <Ticket className="h-4 w-4" />
      case 'tour':
        return <Clock className="h-4 w-4" />
      case 'transfer':
        return <Car className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getProductTypeColor = (typeName: string) => {
    switch (typeName?.toLowerCase()) {
      case 'hotel':
        return 'bg-blue-100 text-blue-800'
      case 'event_ticket':
        return 'bg-purple-100 text-purple-800'
      case 'tour':
        return 'bg-green-100 text-green-800'
      case 'transfer':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const columns = [
    {
      key: 'image',
      header: 'Image',
      render: (product: Product) => (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.media && product.media.length > 0 ? (
            <img 
              src={product.media.find((img: any) => img.is_primary)?.url || product.media[0].url} 
              alt={product.media.find((img: any) => img.is_primary)?.alt || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Product',
      render: (product: Product) => (
        <div className="space-y-1">
          <div className="font-medium">{product.name}</div>
          <div className="text-sm text-muted-foreground">{product.code}</div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          {getProductTypeIcon(product.product_type?.type_name || '')}
          <Badge className={getProductTypeColor(product.product_type?.type_name || '')}>
            {product.product_type?.type_name || 'Unknown'}
          </Badge>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (product: Product) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>
            {product.location?.city && product.location?.country 
              ? `${product.location?.city}, ${product.location?.country}`
              : 'Not specified'
            }
          </span>
        </div>
      )
    },
    {
      key: 'attributes',
      header: 'Details',
      render: (product: Product) => {
        const { attributes } = product
        
        // Hotel specific
        if (product.product_type?.type_name?.toLowerCase() === 'hotel') {
          return (
            <div className="text-sm">
              {attributes.star_rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400" />
                  <span>{attributes.star_rating} stars</span>
                </div>
              )}
            </div>
          )
        }
        
        // Event specific
        if (product.product_type?.type_name?.toLowerCase() === 'event_ticket') {
          return (
            <div className="text-sm">
              {attributes.event_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(attributes.event_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>
          )
        }
        
        // Tour specific
        if (product.product_type?.type_name?.toLowerCase() === 'tour') {
          return (
            <div className="text-sm">
              {attributes.duration_hours && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{attributes.duration_hours}h</span>
                </div>
              )}
            </div>
          )
        }
        
        // Transfer specific
        if (product.product_type?.type_name?.toLowerCase() === 'transfer') {
          return (
            <div className="text-sm">
              {attributes.vehicle_type && (
                <div className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  <span>{attributes.vehicle_type}</span>
                </div>
              )}
            </div>
          )
        }
        
        return <span className="text-sm text-muted-foreground">—</span>
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (product: Product) => (
        <Badge className={getStatusColor(product.is_active)}>
          {product.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (product: Product) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(product.created_at), 'MMM dd, yyyy')}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(product)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (

          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading products...</p>
          </div>

    )
  }

  return (

        <DataTable
          columns={columns}
          data={products}
          emptyState={{
            icon: <Package className="h-8 w-8" />,
            title: "No products found",
            description: "Create your first product to get started"
          }}
        />
  )
}
