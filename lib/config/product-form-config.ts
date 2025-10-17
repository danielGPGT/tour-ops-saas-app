// Dynamic Product Form Configuration
// Defines fields and sections for each product type

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'time' | 'checkbox' | 'multiselect';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  helpText?: string;
  dependsOn?: string; // Field that this field depends on
  showWhen?: (values: any) => boolean; // Function to determine visibility
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface ProductTypeConfig {
  type: string;
  name: string;
  description: string;
  icon: string;
  sections: FormSection[];
}

// Universal core fields that appear for all product types
export const universalCoreFields: FormField[] = [
  {
    id: 'name',
    type: 'text',
    label: 'Product Name',
    placeholder: 'Enter product name',
    required: true,
    validation: {
      min: 2,
      max: 100,
      message: 'Product name must be between 2 and 100 characters'
    }
  },
  {
    id: 'description',
    type: 'textarea',
    label: 'Description',
    placeholder: 'Describe this product...',
    helpText: 'Provide a detailed description of what this product includes'
  },
  {
    id: 'status',
    type: 'select',
    label: 'Status',
    required: true,
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'draft', label: 'Draft' }
    ]
  }
];

// Product type specific configurations
export const productTypeConfigs: ProductTypeConfig[] = [
  {
    type: 'accommodation',
    name: 'Accommodation',
    description: 'Hotels, resorts, hostels, and other lodging options',
    icon: 'Building2',
    sections: [
      {
        id: 'room-details',
        title: 'Room Details',
        description: 'Basic room information and configuration',
        fields: [
          {
            id: 'roomType',
            type: 'select',
            label: 'Room Type',
            required: true,
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'deluxe', label: 'Deluxe' },
              { value: 'suite', label: 'Suite' },
              { value: 'presidential', label: 'Presidential' }
            ]
          },
          {
            id: 'maxOccupancy',
            type: 'number',
            label: 'Maximum Occupancy',
            required: true,
            validation: {
              min: 1,
              max: 10,
              message: 'Maximum occupancy must be between 1 and 10'
            }
          },
          {
            id: 'bedConfiguration',
            type: 'select',
            label: 'Bed Configuration',
            options: [
              { value: 'single', label: 'Single Bed' },
              { value: 'double', label: 'Double Bed' },
              { value: 'twin', label: 'Twin Beds' },
              { value: 'king', label: 'King Bed' },
              { value: 'queen', label: 'Queen Bed' }
            ]
          }
        ]
      },
      {
        id: 'amenities',
        title: 'Amenities & Features',
        description: 'Room amenities and special features',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            id: 'amenities',
            type: 'multiselect',
            label: 'Amenities',
            options: [
              { value: 'wifi', label: 'Free WiFi' },
              { value: 'air_conditioning', label: 'Air Conditioning' },
              { value: 'minibar', label: 'Minibar' },
              { value: 'safe', label: 'In-room Safe' },
              { value: 'balcony', label: 'Balcony/Terrace' },
              { value: 'ocean_view', label: 'Ocean View' },
              { value: 'city_view', label: 'City View' },
              { value: 'pool_access', label: 'Pool Access' },
              { value: 'spa_access', label: 'Spa Access' },
              { value: 'gym_access', label: 'Gym Access' }
            ]
          },
          {
            id: 'roomSize',
            type: 'number',
            label: 'Room Size (sq ft)',
            validation: {
              min: 100,
              max: 5000
            }
          }
        ]
      },
      {
        id: 'policies',
        title: 'Booking Policies',
        description: 'Cancellation and booking policies',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            id: 'checkInTime',
            type: 'time',
            label: 'Check-in Time',
            required: true
          },
          {
            id: 'checkOutTime',
            type: 'time',
            label: 'Check-out Time',
            required: true
          },
          {
            id: 'cancellationPolicy',
            type: 'select',
            label: 'Cancellation Policy',
            options: [
              { value: 'free', label: 'Free Cancellation' },
              { value: '24h', label: '24 Hours Before' },
              { value: '48h', label: '48 Hours Before' },
              { value: '7d', label: '7 Days Before' },
              { value: 'non_refundable', label: 'Non-refundable' }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'event',
    name: 'Event',
    description: 'Concerts, festivals, shows, and special events',
    icon: 'Calendar',
    sections: [
      {
        id: 'event-details',
        title: 'Event Details',
        description: 'Basic event information',
        fields: [
          {
            id: 'eventDate',
            type: 'date',
            label: 'Event Date',
            required: true
          },
          {
            id: 'startTime',
            type: 'time',
            label: 'Start Time',
            required: true
          },
          {
            id: 'endTime',
            type: 'time',
            label: 'End Time',
            required: true
          },
          {
            id: 'venue',
            type: 'text',
            label: 'Venue Name',
            placeholder: 'Enter venue name',
            required: true
          },
          {
            id: 'capacity',
            type: 'number',
            label: 'Total Capacity',
            validation: {
              min: 1,
              max: 100000
            }
          }
        ]
      },
      {
        id: 'ticketing',
        title: 'Ticketing Information',
        description: 'Ticket types and restrictions',
        fields: [
          {
            id: 'ticketType',
            type: 'select',
            label: 'Ticket Type',
            required: true,
            options: [
              { value: 'general', label: 'General Admission' },
              { value: 'vip', label: 'VIP' },
              { value: 'premium', label: 'Premium' },
              { value: 'seated', label: 'Seated' },
              { value: 'standing', label: 'Standing' }
            ]
          },
          {
            id: 'ageRestriction',
            type: 'select',
            label: 'Age Restriction',
            options: [
              { value: 'all_ages', label: 'All Ages' },
              { value: '18+', label: '18+' },
              { value: '21+', label: '21+' },
              { value: 'family', label: 'Family Friendly' }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'transfer',
    name: 'Transfer',
    description: 'Transportation services between locations',
    icon: 'Car',
    sections: [
      {
        id: 'route-details',
        title: 'Route Details',
        description: 'Transportation route and vehicle information',
        fields: [
          {
            id: 'vehicleType',
            type: 'select',
            label: 'Vehicle Type',
            required: true,
            options: [
              { value: 'sedan', label: 'Sedan' },
              { value: 'suv', label: 'SUV' },
              { value: 'van', label: 'Van' },
              { value: 'bus', label: 'Bus' },
              { value: 'limousine', label: 'Limousine' }
            ]
          },
          {
            id: 'duration',
            type: 'number',
            label: 'Duration (minutes)',
            required: true,
            validation: {
              min: 5,
              max: 480
            }
          },
          {
            id: 'maxPassengers',
            type: 'number',
            label: 'Maximum Passengers',
            required: true,
            validation: {
              min: 1,
              max: 50
            }
          }
        ]
      },
      {
        id: 'pickup-dropoff',
        title: 'Pickup & Drop-off',
        description: 'Service locations and timing',
        fields: [
          {
            id: 'pickupLocation',
            type: 'text',
            label: 'Pickup Location',
            placeholder: 'Enter pickup location',
            required: true
          },
          {
            id: 'dropoffLocation',
            type: 'text',
            label: 'Drop-off Location',
            placeholder: 'Enter drop-off location',
            required: true
          },
          {
            id: 'flexibleTiming',
            type: 'checkbox',
            label: 'Flexible Timing Available'
          }
        ]
      }
    ]
  },
  {
    type: 'activity',
    name: 'Activity',
    description: 'Tours, excursions, and experiential activities',
    icon: 'Activity',
    sections: [
      {
        id: 'activity-details',
        title: 'Activity Details',
        description: 'Basic activity information',
        fields: [
          {
            id: 'duration',
            type: 'number',
            label: 'Duration (hours)',
            required: true,
            validation: {
              min: 0.5,
              max: 24
            }
          },
          {
            id: 'difficulty',
            type: 'select',
            label: 'Difficulty Level',
            options: [
              { value: 'easy', label: 'Easy' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'challenging', label: 'Challenging' },
              { value: 'expert', label: 'Expert' }
            ]
          },
          {
            id: 'groupSize',
            type: 'select',
            label: 'Group Size',
            options: [
              { value: 'private', label: 'Private' },
              { value: 'small', label: 'Small Group (2-8)' },
              { value: 'medium', label: 'Medium Group (9-20)' },
              { value: 'large', label: 'Large Group (20+)' }
            ]
          }
        ]
      },
      {
        id: 'equipment',
        title: 'Equipment & Requirements',
        description: 'Equipment provided and requirements',
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            id: 'equipmentProvided',
            type: 'multiselect',
            label: 'Equipment Provided',
            options: [
              { value: 'guide', label: 'Professional Guide' },
              { value: 'transportation', label: 'Transportation' },
              { value: 'equipment', label: 'Activity Equipment' },
              { value: 'safety_gear', label: 'Safety Gear' },
              { value: 'refreshments', label: 'Refreshments' }
            ]
          },
          {
            id: 'requirements',
            type: 'textarea',
            label: 'Requirements',
            placeholder: 'List any requirements or restrictions...'
          }
        ]
      }
    ]
  },
  {
    type: 'meal',
    name: 'Meal',
    description: 'Restaurants, dining experiences, and food services',
    icon: 'Utensils',
    sections: [
      {
        id: 'meal-details',
        title: 'Meal Details',
        description: 'Basic meal information',
        fields: [
          {
            id: 'cuisineType',
            type: 'select',
            label: 'Cuisine Type',
            required: true,
            options: [
              { value: 'local', label: 'Local Cuisine' },
              { value: 'international', label: 'International' },
              { value: 'fine_dining', label: 'Fine Dining' },
              { value: 'casual', label: 'Casual Dining' },
              { value: 'street_food', label: 'Street Food' }
            ]
          },
          {
            id: 'mealType',
            type: 'multiselect',
            label: 'Meal Type',
            options: [
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
              { value: 'snacks', label: 'Snacks' },
              { value: 'drinks', label: 'Drinks' }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'equipment',
    name: 'Equipment',
    description: 'Rental equipment, gear, and tools',
    icon: 'Wrench',
    sections: [
      {
        id: 'equipment-details',
        title: 'Equipment Details',
        description: 'Basic equipment information',
        fields: [
          {
            id: 'equipmentType',
            type: 'select',
            label: 'Equipment Type',
            required: true,
            options: [
              { value: 'sports', label: 'Sports Equipment' },
              { value: 'outdoor', label: 'Outdoor Gear' },
              { value: 'photography', label: 'Photography' },
              { value: 'audio_visual', label: 'Audio/Visual' },
              { value: 'transportation', label: 'Transportation' }
            ]
          },
          {
            id: 'rentalPeriod',
            type: 'select',
            label: 'Rental Period',
            options: [
              { value: 'hourly', label: 'Hourly' },
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'pass',
    name: 'Pass',
    description: 'Access passes, memberships, and entry tickets',
    icon: 'Ticket',
    sections: [
      {
        id: 'pass-details',
        title: 'Pass Details',
        description: 'Basic pass information',
        fields: [
          {
            id: 'passType',
            type: 'select',
            label: 'Pass Type',
            required: true,
            options: [
              { value: 'single_entry', label: 'Single Entry' },
              { value: 'multi_entry', label: 'Multi Entry' },
              { value: 'unlimited', label: 'Unlimited' },
              { value: 'seasonal', label: 'Seasonal' },
              { value: 'membership', label: 'Membership' }
            ]
          },
          {
            id: 'validityPeriod',
            type: 'number',
            label: 'Validity Period (days)',
            validation: {
              min: 1,
              max: 365
            }
          }
        ]
      }
    ]
  },
  {
    type: 'ancillary',
    name: 'Ancillary',
    description: 'Additional services, add-ons, and supplementary products',
    icon: 'Plus',
    sections: [
      {
        id: 'ancillary-details',
        title: 'Ancillary Details',
        description: 'Basic ancillary service information',
        fields: [
          {
            id: 'serviceType',
            type: 'select',
            label: 'Service Type',
            required: true,
            options: [
              { value: 'addon', label: 'Add-on Service' },
              { value: 'upgrade', label: 'Upgrade' },
              { value: 'insurance', label: 'Insurance' },
              { value: 'concierge', label: 'Concierge' },
              { value: 'other', label: 'Other' }
            ]
          }
        ]
      }
    ]
  },
  {
    type: 'other',
    name: 'Other',
    description: 'Other products and services not covered by standard categories',
    icon: 'MoreHorizontal',
    sections: [
      {
        id: 'other-details',
        title: 'Other Details',
        description: 'Custom product information',
        fields: [
          {
            id: 'customType',
            type: 'text',
            label: 'Custom Type',
            placeholder: 'Specify the type of product/service'
          }
        ]
      }
    ]
  }
];

// Helper function to get configuration for a specific product type
export function getProductTypeConfig(type: string): ProductTypeConfig | undefined {
  return productTypeConfigs.find(config => config.type === type);
}

// Helper function to get all available product types
export function getAvailableProductTypes(): Array<{ value: string; label: string; description: string; icon: string }> {
  return productTypeConfigs.map(config => ({
    value: config.type,
    label: config.name,
    description: config.description,
    icon: config.icon
  }));
}
