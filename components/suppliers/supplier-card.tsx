'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Building, DollarSign } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierCardProps {
  supplier: Supplier
  onEdit?: () => void
  onView?: () => void
}

export function SupplierCard({ supplier, onEdit, onView }: SupplierCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {supplier.supplier_type || 'Not specified'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {supplier.code}
              </span>
            </CardDescription>
          </div>
          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
            {supplier.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
          <div className="space-y-2">
            {supplier.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.email}</span>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{supplier.phone}</span>
              </div>
            )}
            {(supplier.city || supplier.country) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {[supplier.city, supplier.country].filter(Boolean).join(', ') || 'No location'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Key Information</h4>
          <div className="space-y-2 text-sm">
            {supplier.default_currency && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>Default Currency: <strong>{supplier.default_currency}</strong></span>
              </div>
            )}
            {supplier.notes && (
              <div>
                <span className="font-medium">Notes:</span> {supplier.notes}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          {onView && (
            <Button variant="outline" size="sm" onClick={onView} className="flex-1">
              View Details
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
