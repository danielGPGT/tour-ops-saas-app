'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Zap,
  Copy,
  Info
} from 'lucide-react';

interface Step2Props {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function Step2VariantDetails({ data, onNext, onBack }: Step2Props) {
  const [variantName, setVariantName] = useState('');
  const [cloneFrom, setCloneFrom] = useState<string>('none');
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [cloneMode, setCloneMode] = useState(false);

  // Get attribute fields based on product type
  const productType = data.product?.type || 'accommodation';
  const attributeFields = getAttributeFieldsForType(productType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!variantName.trim()) {
      return;
    }

    onNext({
      variantName,
      cloneFrom: cloneFrom === 'none' ? null : parseInt(cloneFrom),
      attributes,
      clonedVariant: cloneFrom !== 'none' ? data.product.variants?.find((v: any) => v.id.toString() === cloneFrom) : null
    });
  };

  const handleAttributeChange = (key: string, value: any) => {
    setAttributes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Variant details</h2>
          <p className="text-muted-foreground">
            Adding to: <strong>{data.product?.name}</strong> ({productType})
          </p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clone Option - Show First if Variants Exist */}
        {data.product?.variants?.length > 0 && (
          <Alert className="border-primary/50 bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertTitle>Quick Setup</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="space-y-2">
                <Label>Clone from existing variant?</Label>
                <Select 
                  value={cloneFrom} 
                  onValueChange={(val) => {
                    setCloneFrom(val);
                    setCloneMode(val !== 'none');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select to clone pricing & availability..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      No, create from scratch
                    </SelectItem>
                    {data.product.variants.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.name} - £{v.basePrice || '0'}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cloneMode && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✓ Will copy: pricing, occupancy rules, availability dates, supplier contract
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Variant Name */}
        <div>
          <Label htmlFor="variantName">Variant Name</Label>
          <Input
            id="variantName"
            value={variantName}
            onChange={(e) => setVariantName(e.target.value)}
            placeholder="e.g., Deluxe Room"
            className="text-lg mt-1"
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Examples: {attributeFields.examples.join(', ')}
          </p>
        </div>

        {/* Dynamic Attributes Based on Product Type */}
        <div className="space-y-4">
          <h3 className="font-semibold">Details</h3>
          
          {attributeFields.fields.map(attrField => (
            <div key={attrField.key}>
              <Label htmlFor={attrField.key}>{attrField.label}</Label>
              {attrField.type === 'select' ? (
                <Select 
                  value={attributes[attrField.key] || ''} 
                  onValueChange={(val) => handleAttributeChange(attrField.key, val)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={attrField.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {attrField.options.map(opt => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : attrField.type === 'number' ? (
                <Input
                  id={attrField.key}
                  type="number"
                  value={attributes[attrField.key] || ''}
                  onChange={(e) => handleAttributeChange(attrField.key, e.target.value)}
                  placeholder={attrField.placeholder}
                  className="mt-1"
                />
              ) : attrField.type === 'multiselect' ? (
                <MultiSelect
                  options={attrField.options}
                  value={attributes[attrField.key] || []}
                  onChange={(val) => handleAttributeChange(attrField.key, val)}
                  placeholder={attrField.placeholder}
                />
              ) : (
                <Input
                  id={attrField.key}
                  value={attributes[attrField.key] || ''}
                  onChange={(e) => handleAttributeChange(attrField.key, e.target.value)}
                  placeholder={attrField.placeholder}
                  className="mt-1"
                />
              )}
              {attrField.helpText && (
                <p className="text-xs text-muted-foreground mt-1">{attrField.helpText}</p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        </div>
      </form>
    </div>
  );
}

// Multi-Select Component
function MultiSelect({ 
  options, 
  value, 
  onChange, 
  placeholder 
}: { 
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="mt-1">
      <div className="grid grid-cols-2 gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggleOption(option)}
            className={`p-2 text-sm border rounded-md text-left transition ${
              value.includes(option)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {value.map(option => (
            <Badge key={option} variant="secondary" className="text-xs">
              {option}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper: Get attribute fields based on product type
function getAttributeFieldsForType(productType: string) {
  const fieldConfigs = {
    accommodation: {
      examples: ['Standard Room', 'Deluxe Room', 'Suite', 'Family Room'],
      fields: [
        {
          key: 'room_type',
          label: 'Room Type',
          type: 'select',
          options: ['Single', 'Double', 'Twin', 'Triple', 'Quad', 'Suite'],
          placeholder: 'Select room type'
        },
        {
          key: 'bedding',
          label: 'Bedding',
          type: 'select',
          options: ['King', 'Queen', '2x Single', 'Sofa Bed', 'Bunk Beds'],
          placeholder: 'Select bedding type'
        },
        {
          key: 'max_occupancy',
          label: 'Maximum Occupancy',
          type: 'number',
          placeholder: 'e.g., 4',
          helpText: 'Maximum number of guests'
        },
        {
          key: 'size_sqm',
          label: 'Room Size (sqm)',
          type: 'number',
          placeholder: 'e.g., 35',
          optional: true
        },
        {
          key: 'view',
          label: 'View',
          type: 'select',
          options: ['City', 'Garden', 'Sea', 'Mountain', 'Pool', 'Courtyard'],
          optional: true
        },
        {
          key: 'amenities',
          label: 'Amenities',
          type: 'multiselect',
          options: [
            'Balcony', 'Bathtub', 'Minibar', 'Coffee Machine', 
            'Air Conditioning', 'Safe', 'TV', 'WiFi'
          ],
          optional: true
        }
      ]
    },
    
    activity: {
      examples: ['Adult Ticket', 'Child Ticket', 'Family Pass', 'VIP Experience'],
      fields: [
        {
          key: 'duration',
          label: 'Duration',
          type: 'text',
          placeholder: 'e.g., 3 hours',
          helpText: 'How long does the activity last?'
        },
        {
          key: 'difficulty',
          label: 'Difficulty Level',
          type: 'select',
          options: ['Easy', 'Moderate', 'Challenging', 'Expert'],
          optional: true
        },
        {
          key: 'min_age',
          label: 'Minimum Age',
          type: 'number',
          placeholder: 'e.g., 12',
          optional: true
        },
        {
          key: 'max_group_size',
          label: 'Maximum Group Size',
          type: 'number',
          placeholder: 'e.g., 20',
          optional: true
        },
        {
          key: 'languages',
          label: 'Languages Available',
          type: 'multiselect',
          options: ['English', 'Spanish', 'French', 'German', 'Italian', 'Mandarin'],
          optional: true
        },
        {
          key: 'includes',
          label: 'What\'s Included',
          type: 'multiselect',
          options: [
            'Guide', 'Transport', 'Meals', 'Equipment', 
            'Entrance Fees', 'Photos', 'Insurance'
          ],
          optional: true
        }
      ]
    },
    
    transfer: {
      examples: ['Sedan', 'SUV', 'Van', 'Minibus'],
      fields: [
        {
          key: 'vehicle_type',
          label: 'Vehicle Type',
          type: 'select',
          options: ['Sedan', 'SUV', 'Van', 'Minibus', 'Coach', 'Luxury'],
          placeholder: 'Select vehicle type'
        },
        {
          key: 'max_passengers',
          label: 'Maximum Passengers',
          type: 'number',
          placeholder: 'e.g., 4'
        },
        {
          key: 'max_luggage',
          label: 'Maximum Luggage',
          type: 'number',
          placeholder: 'e.g., 4',
          helpText: 'Number of standard suitcases'
        },
        {
          key: 'features',
          label: 'Vehicle Features',
          type: 'multiselect',
          options: [
            'Air Conditioning', 'WiFi', 'Child Seat Available', 
            'Wheelchair Accessible', 'Luxury Interior', 'GPS'
          ],
          optional: true
        }
      ]
    },
    
    // Add more product types based on our schema
    package: {
      examples: ['3-Day Package', 'Weekend Getaway', 'Family Package', 'Luxury Package'],
      fields: [
        {
          key: 'duration_days',
          label: 'Duration (Days)',
          type: 'number',
          placeholder: 'e.g., 3',
          helpText: 'How many days is the package?'
        },
        {
          key: 'includes',
          label: 'What\'s Included',
          type: 'multiselect',
          options: [
            'Accommodation', 'Meals', 'Activities', 'Transport', 
            'Guide', 'Entrance Fees', 'Insurance'
          ],
          optional: true
        },
        {
          key: 'min_pax',
          label: 'Minimum Passengers',
          type: 'number',
          placeholder: 'e.g., 2',
          optional: true
        },
        {
          key: 'max_pax',
          label: 'Maximum Passengers',
          type: 'number',
          placeholder: 'e.g., 20',
          optional: true
        }
      ]
    },
    
    flight: {
      examples: ['Economy', 'Business', 'First Class'],
      fields: [
        {
          key: 'class',
          label: 'Flight Class',
          type: 'select',
          options: ['Economy', 'Premium Economy', 'Business', 'First Class'],
          placeholder: 'Select flight class'
        },
        {
          key: 'baggage_allowance',
          label: 'Baggage Allowance',
          type: 'text',
          placeholder: 'e.g., 23kg + 7kg hand luggage',
          optional: true
        },
        {
          key: 'meal_included',
          label: 'Meal Included',
          type: 'select',
          options: ['None', 'Snack', 'Light Meal', 'Full Meal'],
          optional: true
        }
      ]
    },
    
    cruise: {
      examples: ['Interior Cabin', 'Ocean View', 'Balcony', 'Suite'],
      fields: [
        {
          key: 'cabin_type',
          label: 'Cabin Type',
          type: 'select',
          options: ['Interior', 'Ocean View', 'Balcony', 'Suite', 'Penthouse'],
          placeholder: 'Select cabin type'
        },
        {
          key: 'deck_level',
          label: 'Deck Level',
          type: 'number',
          placeholder: 'e.g., 7',
          optional: true
        },
        {
          key: 'max_occupancy',
          label: 'Maximum Occupancy',
          type: 'number',
          placeholder: 'e.g., 2',
          helpText: 'Maximum number of guests'
        }
      ]
    }
  };
  
  return fieldConfigs[productType as keyof typeof fieldConfigs] || {
    examples: ['Standard', 'Premium', 'Deluxe'],
    fields: [
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        placeholder: 'Brief description of this variant',
        optional: true
      }
    ]
  };
}
