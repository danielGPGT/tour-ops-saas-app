'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, MapPin, Phone, Mail, Globe, Building } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatting'
import type { Supplier } from '@/lib/types/supplier'

interface SupplierCardProps {
  supplier: Supplier
  onEdit?: () => void
  onView?: () => void
}

export function SupplierCard({ supplier, onEdit, onView }: SupplierCardProps) {
  const { contact_info, payment_terms } = supplier

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {supplier.supplier_type}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {supplier.code}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {supplier.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{supplier.rating}</span>
              </div>
            )}
            <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
              {supplier.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Contact Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{contact_info?.primary_contact || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{contact_info?.email || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{contact_info?.phone || 'Not specified'}</span>
            </div>
            {contact_info?.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={contact_info.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {contact_info.website}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {[
                  contact_info.address?.street,
                  contact_info.address?.city,
                  contact_info.address?.country
                ].filter(Boolean).join(', ') || 'No address provided'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Payment Terms</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Method:</span> {payment_terms?.payment_method || 'Not specified'}
            </div>
            <div>
              <span className="font-medium">Credit Days:</span> {payment_terms?.credit_days || 0} days
            </div>
            {payment_terms?.terms && (
              <div>
                <span className="font-medium">Terms:</span> {payment_terms.terms}
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Bookings:</span>
              <div className="text-lg font-semibold">{supplier.total_bookings}</div>
            </div>
            {supplier.commission_rate && (
              <div>
                <span className="font-medium">Commission Rate:</span>
                <div className="text-lg font-semibold">{supplier.commission_rate}%</div>
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
