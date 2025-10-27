'use client'

import { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUpload } from '@/components/common/ImageUpload'
import { Separator } from '@/components/ui/separator'

interface ProductOptionAttributesFormProps {
  productType: string
  form?: UseFormReturn<any>
}

export function ProductOptionAttributesForm({ productType, form }: ProductOptionAttributesFormProps) {
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
    console.log(`📝 Updating attribute: ${field} =`, value)
    const currentAttributes = form.getValues('attributes') || {}
    console.log('📥 Current attributes from getValues:', currentAttributes)
    const newAttributes = {
      ...currentAttributes,
      [field]: value
    }
    console.log('📤 Setting new attributes:', newAttributes)
    form.setValue('attributes', newAttributes, { shouldValidate: true, shouldDirty: true })
    
    // Verify it was set
    const afterSet = form.getValues('attributes')
    console.log('✅ After setValue, getValues returns:', afterSet)
  }

  const updateNestedAttribute = (parent: string, field: string, value: any) => {
    const current = attributes[parent] || {}
    const currentAttributes = form.getValues('attributes') || {}
    const newAttributes = {
      ...currentAttributes,
      [parent]: { ...current, [field]: value }
    }
    form.setValue('attributes', newAttributes, { shouldValidate: true, shouldDirty: true })
  }

  const updateArrayAttribute = (field: string, value: string, checked: boolean) => {
    const current = (attributes[field] as string[]) || []
    const updated = checked
      ? [...current, value]
      : current.filter(v => v !== value)
    const currentAttributes = form.getValues('attributes') || {}
    const newAttributes = {
      ...currentAttributes,
      [field]: updated
    }
    form.setValue('attributes', newAttributes, { shouldValidate: true, shouldDirty: true })
  }

  // ACCOMMODATION - Room Options
  if (productType === 'accommodation') {
    const bedConfigFixed = attributes.bed_configuration_fixed || false
    const availableBeds = attributes.bed_configurations_available || []

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Room Type</Label>
            <Select
              value={attributes.room_type || ''}
              onValueChange={(v) => updateAttribute('room_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="deluxe">Deluxe</SelectItem>
                <SelectItem value="suite">Suite</SelectItem>
                <SelectItem value="junior_suite">Junior Suite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bed Configuration - Fixed or Flexible */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label>Fixed Bed Configuration</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable if bed type is guaranteed and cannot change
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bed_fixed"
                  checked={bedConfigFixed}
                  onCheckedChange={(checked) => {
                    console.log('🛏️ Bed config fixed changed:', checked)
                    updateAttribute('bed_configuration_fixed', checked)
                    // Clear bed_configuration if disabling fixed mode
                    if (!checked) {
                      updateAttribute('bed_configuration', undefined)
                    }
                  }}
                />
              </div>
            </div>

            {bedConfigFixed ? (
              // Fixed: Single bed type
              <div>
                <Label>Bed Type *</Label>
                <Select
                  value={attributes.bed_configuration || ''}
                  onValueChange={(v) => {
                    console.log('🛏️ Bed configuration selected:', v)
                    updateAttribute('bed_configuration', v)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="king">King Bed (1 large bed)</SelectItem>
                    <SelectItem value="queen">Queen Bed (1 medium bed)</SelectItem>
                    <SelectItem value="double">Double Bed (1 small bed)</SelectItem>
                    <SelectItem value="twin">Twin Beds (2 single beds)</SelectItem>
                    <SelectItem value="single">Single Bed (1 single bed)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  This bed type is guaranteed
                </p>
              </div>
            ) : (
              // Flexible: Multiple bed options
              <div className="space-y-3">
                <Label>Available Bed Configurations *</Label>
                <p className="text-xs text-muted-foreground">
                  Select all bed types available for this room (guests choose at booking)
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bed-king"
                      checked={availableBeds.includes('king')}
                      onCheckedChange={(checked) => {
                        const current = availableBeds
                        updateAttribute('bed_configurations_available', checked
                          ? [...current, 'king']
                          : current.filter(v => v !== 'king'))
                      }}
                    />
                    <label htmlFor="bed-king" className="text-sm">
                      King Bed (1 large)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bed-queen"
                      checked={availableBeds.includes('queen')}
                      onCheckedChange={(checked) => {
                        const current = availableBeds
                        updateAttribute('bed_configurations_available', checked
                          ? [...current, 'queen']
                          : current.filter(v => v !== 'queen'))
                      }}
                    />
                    <label htmlFor="bed-queen" className="text-sm">
                      Queen Bed (1 medium)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bed-twin"
                      checked={availableBeds.includes('twin')}
                      onCheckedChange={(checked) => {
                        const current = availableBeds
                        updateAttribute('bed_configurations_available', checked
                          ? [...current, 'twin']
                          : current.filter(v => v !== 'twin'))
                      }}
                    />
                    <label htmlFor="bed-twin" className="text-sm">
                      Twin Beds (2 singles)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bed-double"
                      checked={availableBeds.includes('double')}
                      onCheckedChange={(checked) => {
                        const current = availableBeds
                        updateAttribute('bed_configurations_available', checked
                          ? [...current, 'double']
                          : current.filter(v => v !== 'double'))
                      }}
                    />
                    <label htmlFor="bed-double" className="text-sm">
                      Double Bed (1 small)
                    </label>
                  </div>
                </div>

                {/* Default preference */}
                {availableBeds.length > 0 && (
                  <div>
                    <Label>Default Configuration</Label>
                    <Select
                      value={attributes.default_bed_configuration || ''}
                      onValueChange={(v) => updateAttribute('default_bed_configuration', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableBeds.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Shown as default option to customers
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label>View Type</Label>
            <Select
              value={attributes.view_type || ''}
              onValueChange={(v) => updateAttribute('view_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="city">City View</SelectItem>
                <SelectItem value="sea">Sea View</SelectItem>
                <SelectItem value="garden">Garden View</SelectItem>
                <SelectItem value="partial_sea">Partial Sea View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Max Occupancy</Label>
            <Input
              type="number"
              placeholder="e.g., 3"
              value={attributes.max_occupancy || ''}
              onChange={(e) => updateAttribute('max_occupancy', parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Standard Occupancy</Label>
            <Input
              type="number"
              placeholder="e.g., 2"
              value={attributes.standard_occupancy || ''}
              onChange={(e) => updateAttribute('standard_occupancy', parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Minimum Nights</Label>
            <Input
              type="number"
              placeholder="e.g., 3"
              value={attributes.minimum_nights || ''}
              onChange={(e) => updateAttribute('minimum_nights', parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Maximum Nights</Label>
            <Input
              type="number"
              placeholder="e.g., 14"
              value={attributes.maximum_nights || ''}
              onChange={(e) => updateAttribute('maximum_nights', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="extra_bed"
            checked={attributes.extra_bed_available || false}
            onCheckedChange={(checked) => updateAttribute('extra_bed_available', checked)}
          />
          <label htmlFor="extra_bed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Extra Bed Available
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="smoking"
            checked={attributes.smoking || false}
            onCheckedChange={(checked) => updateAttribute('smoking', checked)}
          />
          <label htmlFor="smoking" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Smoking Room
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="accessible"
            checked={attributes.accessible || false}
            onCheckedChange={(checked) => updateAttribute('accessible', checked)}
          />
          <label htmlFor="accessible" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Accessible Room
          </label>
        </div>

        {/* Images Section */}
        <Separator />
        <div>
          <Label className="text-base">Option Images</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images specific to this room option
          </p>
          <ImageUpload
            images={attributes.images || []}
            onImagesChange={(newImages) => {
              updateAttribute('images', newImages)
            }}
            maxImages={5}
          />
        </div>
      </div>
    )
  }

  // EVENT TICKETS
  if (productType === 'event' || productType === 'event_tickets') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Ticket Type</Label>
            <Select
              value={attributes.ticket_type || ''}
              onValueChange={(v) => updateAttribute('ticket_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ticket type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3_day">3-Day Pass</SelectItem>
                <SelectItem value="sunday_only">Sunday Only</SelectItem>
                <SelectItem value="saturday_sunday">Saturday + Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Seat Category</Label>
            <Select
              value={attributes.seat_category || ''}
              onValueChange={(v) => updateAttribute('seat_category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Age Category</Label>
            <Select
              value={attributes.age_category || ''}
              onValueChange={(v) => updateAttribute('age_category', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">Adult</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="concession">Concession</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="requires_id"
            checked={attributes.requires_id || false}
            onCheckedChange={(checked) => updateAttribute('requires_id', checked)}
          />
          <label htmlFor="requires_id" className="text-sm font-medium">
            Requires ID
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="digital_ticket"
            checked={attributes.digital_ticket || false}
            onCheckedChange={(checked) => updateAttribute('digital_ticket', checked)}
          />
          <label htmlFor="digital_ticket" className="text-sm font-medium">
            Digital Ticket
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="physical_ticket"
            checked={attributes.physical_ticket || false}
            onCheckedChange={(checked) => updateAttribute('physical_ticket', checked)}
          />
          <label htmlFor="physical_ticket" className="text-sm font-medium">
            Physical Ticket
          </label>
        </div>

        {/* Images Section */}
        <Separator />
        <div>
          <Label className="text-base">Option Images</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images specific to this ticket option
          </p>
          <ImageUpload
            images={attributes.images || []}
            onImagesChange={(newImages) => {
              updateAttribute('images', newImages)
            }}
            maxImages={5}
          />
        </div>
      </div>
    )
  }

  // TRANSFERS
  if (productType === 'transfer' || productType === 'transfers') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Vehicle Type</Label>
            <Select
              value={attributes.vehicle_type || ''}
              onValueChange={(v) => updateAttribute('vehicle_type', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard_car">Standard Car</SelectItem>
                <SelectItem value="premium_car">Premium Car</SelectItem>
                <SelectItem value="minivan">Minivan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Vehicle Class</Label>
            <Input
              placeholder="e.g., Mercedes E-Class"
              value={attributes.vehicle_class || ''}
              onChange={(e) => updateAttribute('vehicle_class', e.target.value)}
            />
          </div>

          <div>
            <Label>Max Passengers</Label>
            <Input
              type="number"
              placeholder="e.g., 4"
              value={attributes.capacity?.passengers || ''}
              onChange={(e) => updateNestedAttribute('capacity', 'passengers', parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label>Pricing Basis</Label>
            <Select
              value={attributes.pricing_basis || ''}
              onValueChange={(v) => updateAttribute('pricing_basis', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select basis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_vehicle">Per Vehicle</SelectItem>
                <SelectItem value="per_person">Per Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Images Section */}
        <Separator />
        <div>
          <Label className="text-base">Option Images</Label>
          <p className="text-sm text-muted-foreground mb-4">
            Upload images specific to this product option
          </p>
          <ImageUpload
            images={attributes.images || []}
            onImagesChange={(newImages) => {
              updateAttribute('images', newImages)
            }}
            maxImages={5}
          />
        </div>
      </div>
    )
  }

  // Default fallback
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Option-specific attributes for {productType} will be configured here
        </p>
      </div>
      
      {/* Images Section */}
      <Separator />
      <div>
        <Label className="text-base">Option Images</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Upload images specific to this product option
        </p>
        <ImageUpload
          images={attributes.images || []}
          onImagesChange={(newImages) => {
            updateAttribute('images', newImages)
          }}
          maxImages={5}
        />
      </div>
    </div>
  )
}
