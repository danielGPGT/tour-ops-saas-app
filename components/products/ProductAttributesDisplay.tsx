'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Building, 
  Calendar, 
  Clock, 
  Car, 
  Plane,
  Compass,
  Package,
  Star,
  MapPin,
  CheckCircle2,
  Users,
  Wifi,
  Waves,
  Dumbbell,
  Utensils,
  Coffee,
  Ticket,
  User
} from 'lucide-react'
import type { Product } from '@/lib/types/product'

interface ProductAttributesDisplayProps {
  product: Product
}

export function ProductAttributesDisplay({ product }: ProductAttributesDisplayProps) {
  const attributes = product.attributes || {}
  const productType = product.product_type?.type_code || product.product_type?.type_name?.toLowerCase() || ''

  // Accommodation
  if (productType === 'accommodation') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Property Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.property_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Property Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.property_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.star_rating && (
              <div>
                <Label className="text-xs text-muted-foreground">Star Rating</Label>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(attributes.star_rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-1 text-sm">({attributes.star_rating})</span>
                </div>
              </div>
            )}
            
            {attributes.check_in_time && (
              <div>
                <Label className="text-xs text-muted-foreground">Check-in</Label>
                <p className="mt-1 text-sm font-medium">{attributes.check_in_time}</p>
              </div>
            )}
            
            {attributes.check_out_time && (
              <div>
                <Label className="text-xs text-muted-foreground">Check-out</Label>
                <p className="mt-1 text-sm font-medium">{attributes.check_out_time}</p>
              </div>
            )}
          </div>
          
          {attributes.amenities && Array.isArray(attributes.amenities) && attributes.amenities.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Amenities</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {attributes.amenities.map((amenity: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Event Tickets
  if (productType === 'event') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Ticket Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.ticket_category && (
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.ticket_category}</Badge>
                </div>
              </div>
            )}
            
            {attributes.seating_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Seating</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.seating_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.venue_section && (
              <div>
                <Label className="text-xs text-muted-foreground">Venue Section</Label>
                <p className="mt-1 text-sm font-medium">{attributes.venue_section}</p>
              </div>
            )}
            
            {attributes.delivery_method && (
              <div>
                <Label className="text-xs text-muted-foreground">Delivery</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.delivery_method}</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transfers
  if (productType === 'transfer') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Transfer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.transfer_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Transfer Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.transfer_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.service_level && (
              <div>
                <Label className="text-xs text-muted-foreground">Service Level</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.service_level}</Badge>
                </div>
              </div>
            )}
            
            {attributes.route && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <p className="mt-1 text-sm font-medium">{attributes.route.from || 'N/A'}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <p className="mt-1 text-sm font-medium">{attributes.route.to || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Transport
  if (productType === 'transport') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Transport Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.transport_mode && (
              <div>
                <Label className="text-xs text-muted-foreground">Mode</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.transport_mode}</Badge>
                </div>
              </div>
            )}
            
            {attributes.route_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Route Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.route_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.origin_region && (
              <div>
                <Label className="text-xs text-muted-foreground">Origin</Label>
                <p className="mt-1 text-sm font-medium">{attributes.origin_region}</p>
              </div>
            )}
            
            {attributes.destination_region && (
              <div>
                <Label className="text-xs text-muted-foreground">Destination</Label>
                <p className="mt-1 text-sm font-medium">{attributes.destination_region}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Experiences
  if (productType === 'experience') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Experience Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.experience_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.experience_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.category && (
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.category}</Badge>
                </div>
              </div>
            )}
            
            {attributes.group_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Group Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.group_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.activity_level && (
              <div>
                <Label className="text-xs text-muted-foreground">Difficulty</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.activity_level}</Badge>
                </div>
              </div>
            )}
            
            {attributes.duration?.value && (
              <div>
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <p className="mt-1 text-sm font-medium">{attributes.duration.value} hours</p>
              </div>
            )}
            
            {attributes.capacity?.max_participants && (
              <div>
                <Label className="text-xs text-muted-foreground">Max Participants</Label>
                <p className="mt-1 text-sm font-medium">{attributes.capacity.max_participants}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extras
  if (productType === 'extra') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Extra Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {attributes.extra_type && (
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.extra_type}</Badge>
                </div>
              </div>
            )}
            
            {attributes.category && (
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <div className="mt-1">
                  <Badge variant="outline">{attributes.category}</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default: Show raw attributes if no specific type matched
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attributes</CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs bg-muted p-4 rounded overflow-auto">
          {JSON.stringify(attributes, null, 2)}
        </pre>
      </CardContent>
    </Card>
  )
}
