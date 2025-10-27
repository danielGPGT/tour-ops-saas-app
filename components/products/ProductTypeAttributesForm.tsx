'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ACCOMMODATION_PROPERTY_TYPES, 
  ACCOMMODATION_AMENITIES,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  TRANSFER_TYPES,
  ACTIVITY_TYPES,
  ACTIVITY_DIFFICULTY_LEVELS,
  ACTIVITY_GROUP_TYPES,
  ACTIVITY_SEASONALITY
} from '@/lib/config/product-attributes'

interface ProductTypeAttributesFormProps {
  productType: string
  form?: UseFormReturn<any>
}

export function ProductTypeAttributesForm({ productType, form }: ProductTypeAttributesFormProps) {
  // Support both useFormContext (if wrapped in FormProvider) or passed form
  const attributes = form ? form.watch('attributes') || {} : {}
  
  if (!form) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Form context not available</p>
      </div>
    )
  }

  // Handle nested attribute updates
  const updateAttribute = (field: string, value: any) => {
    form.setValue(`attributes.${field}`, value, { shouldValidate: true })
  }

  const updateNestedAttribute = (parent: string, field: string, value: any) => {
    const current = attributes[parent] || {}
    form.setValue(`attributes.${parent}`, { ...current, [field]: value }, { shouldValidate: true })
  }

  const updateArrayAttribute = (field: string, value: string, checked: boolean) => {
    const current = (attributes[field] as string[]) || []
    const updated = checked
      ? [...current, value]
      : current.filter(v => v !== value)
    form.setValue(`attributes.${field}`, updated, { shouldValidate: true })
  }

  // Accommodation
  if (productType === 'accommodation') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Property Type</Label>
            <Select
              value={attributes.property_type || ''}
              onValueChange={(v) => updateAttribute('property_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOMMODATION_PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Star Rating</Label>
            <Select
              value={attributes.star_rating?.toString() || ''}
              onValueChange={(v) => updateAttribute('star_rating', parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((star) => (
                  <SelectItem key={star} value={star.toString()}>
                    {star} Star{star > 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Check-in Time</Label>
            <Input
              type="time"
              value={attributes.check_in_time || ''}
              onChange={(e) => updateAttribute('check_in_time', e.target.value)}
              placeholder="15:00"
            />
          </div>

          <div>
            <Label>Check-out Time</Label>
            <Input
              type="time"
              value={attributes.check_out_time || ''}
              onChange={(e) => updateAttribute('check_out_time', e.target.value)}
              placeholder="11:00"
            />
          </div>
        </div>

        <div>
          <Label>Amenities</Label>
          <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-4">
            {ACCOMMODATION_AMENITIES.map((amenity) => (
              <div key={amenity.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity.value}`}
                  checked={(attributes.amenities as string[])?.includes(amenity.value)}
                  onCheckedChange={(checked) =>
                    updateArrayAttribute('amenities', amenity.value, checked as boolean)
                  }
                />
                <Label htmlFor={`amenity-${amenity.value}`} className="cursor-pointer text-sm">
                  {amenity.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Event
  if (productType === 'event') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ticket Category</Label>
            <Select
              value={attributes.ticket_category || ''}
              onValueChange={(v) => updateAttribute('ticket_category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grandstand">Grandstand</SelectItem>
                <SelectItem value="general_admission">General Admission</SelectItem>
                <SelectItem value="paddock_club">Paddock Club</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Venue Section</Label>
            <Input
              value={attributes.venue_section || ''}
              onChange={(e) => updateAttribute('venue_section', e.target.value)}
              placeholder="e.g., Grandstand K"
            />
          </div>

          <div>
            <Label>Seating Type</Label>
            <Select
              value={attributes.seating_type || ''}
              onValueChange={(v) => updateAttribute('seating_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="unreserved">Unreserved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Delivery Method</Label>
            <Select
              value={attributes.delivery_method || ''}
              onValueChange={(v) => updateAttribute('delivery_method', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collection_on_site">Collection on Site</SelectItem>
                <SelectItem value="postal">Postal</SelectItem>
                <SelectItem value="e_ticket">E-Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  // Transfer
  if (productType === 'transfer') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Transfer Type</Label>
            <Select
              value={attributes.transfer_type || ''}
              onValueChange={(v) => updateAttribute('transfer_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TRANSFER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Service Level</Label>
            <Select
              value={attributes.service_level || ''}
              onValueChange={(v) => updateAttribute('service_level', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
                <SelectItem value="shuttle">Shuttle</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Route From</Label>
          <Input
            value={attributes.route?.from || ''}
            onChange={(e) => updateNestedAttribute('route', 'from', e.target.value)}
            placeholder="e.g., Nice Airport (NCE)"
          />
        </div>

        <div>
          <Label>Route To</Label>
          <Input
            value={attributes.route?.to || ''}
            onChange={(e) => updateNestedAttribute('route', 'to', e.target.value)}
            placeholder="e.g., Monaco (any address)"
          />
        </div>
      </div>
    )
  }

  // Transport
  if (productType === 'transport') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Transport Mode</Label>
            <Select
              value={attributes.transport_mode || ''}
              onValueChange={(v) => updateAttribute('transport_mode', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flight">Flight</SelectItem>
                <SelectItem value="train">Train</SelectItem>
                <SelectItem value="ferry">Ferry</SelectItem>
                <SelectItem value="coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Route Type</Label>
            <Select
              value={attributes.route_type || ''}
              onValueChange={(v) => updateAttribute('route_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domestic">Domestic</SelectItem>
                <SelectItem value="international">International</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Origin Region</Label>
            <Input
              value={attributes.origin_region || ''}
              onChange={(e) => updateAttribute('origin_region', e.target.value)}
              placeholder="e.g., UK"
            />
          </div>

          <div>
            <Label>Destination Region</Label>
            <Input
              value={attributes.destination_region || ''}
              onChange={(e) => updateAttribute('destination_region', e.target.value)}
              placeholder="e.g., France"
            />
          </div>
        </div>
      </div>
    )
  }

  // Experience
  if (productType === 'experience') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Experience Type</Label>
            <Select
              value={attributes.experience_type || ''}
              onValueChange={(v) => updateAttribute('experience_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={attributes.category || ''}
              onValueChange={(v) => updateAttribute('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sightseeing">Sightseeing</SelectItem>
                <SelectItem value="adventure">Adventure</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
                <SelectItem value="water_activity">Water Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Group Type</Label>
            <Select
              value={attributes.group_type || ''}
              onValueChange={(v) => updateAttribute('group_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select group type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_GROUP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Activity Level</Label>
            <Select
              value={attributes.activity_level || ''}
              onValueChange={(v) => updateAttribute('activity_level', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_DIFFICULTY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Duration (hours)</Label>
            <Input
              type="number"
              value={attributes.duration?.value || ''}
              onChange={(e) =>
                updateNestedAttribute('duration', 'value', parseFloat(e.target.value) || 0)
              }
              min={0.5}
              step={0.5}
            />
          </div>

          <div>
            <Label>Min Participants</Label>
            <Input
              type="number"
              value={attributes.capacity?.min_participants || ''}
              onChange={(e) =>
                updateNestedAttribute('capacity', 'min_participants', parseInt(e.target.value) || 1)
              }
              min={1}
            />
          </div>

          <div>
            <Label>Max Participants</Label>
            <Input
              type="number"
              value={attributes.capacity?.max_participants || ''}
              onChange={(e) =>
                updateNestedAttribute('capacity', 'max_participants', parseInt(e.target.value) || 1)
              }
              min={1}
            />
          </div>
        </div>
      </div>
    )
  }

  // Extra
  if (productType === 'extra') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Extra Type</Label>
            <Select
              value={attributes.extra_type || ''}
              onValueChange={(v) => updateAttribute('extra_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="airport_service">Airport Service</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="merchandise">Merchandise</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select
              value={attributes.category || ''}
              onValueChange={(v) => updateAttribute('category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travel_convenience">Travel Convenience</SelectItem>
                <SelectItem value="event_related">Event Related</SelectItem>
                <SelectItem value="hotel_extra">Hotel Extra</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    )
  }

  // Default: Show nothing if no matching type
  return null
}
