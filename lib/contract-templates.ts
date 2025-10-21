export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: 'accommodation' | 'activity' | 'transfer' | 'event' | 'cruise' | 'package';
  contractType: 'net_rate' | 'commissionable' | 'allocation';
  icon: string;
  color: string;
  defaultTerms: {
    commissionRate?: number;
    currency?: string;
    paymentTerms?: string;
    cancellationPolicy?: string;
    specialTerms?: string;
    bookingCutoffDays?: number;
  };
  defaultDeadlines: Array<{
    type: 'payment' | 'cancellation' | 'attrition' | 'booking';
    name: string;
    daysBeforeEvent: number;
    penalty?: string;
  }>;
  suggestedSuppliers?: string[];
  tags: string[];
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'hotel-net-rate',
    name: 'Hotel Net Rate Contract',
    description: 'Standard hotel accommodation with net rate pricing',
    category: 'accommodation',
    contractType: 'net_rate',
    icon: '🏨',
    color: 'bg-blue-100 text-blue-800',
    defaultTerms: {
      commissionRate: 0,
      currency: 'USD',
      paymentTerms: 'Net 30 days',
      cancellationPolicy: '24 hours before arrival',
      specialTerms: 'Room upgrades subject to availability',
      bookingCutoffDays: 7
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Final Payment',
        daysBeforeEvent: 30,
        penalty: 'Contract cancellation'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 24,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Rooming List',
        daysBeforeEvent: 7,
        penalty: 'Auto-assignment'
      }
    ],
    suggestedSuppliers: ['Marriott', 'Hilton', 'IHG', 'Accor'],
    tags: ['hotel', 'accommodation', 'net-rate']
  },
  {
    id: 'hotel-commissionable',
    name: 'Hotel Commissionable Contract',
    description: 'Hotel accommodation with commission-based pricing',
    category: 'accommodation',
    contractType: 'commissionable',
    icon: '🏨',
    color: 'bg-green-100 text-green-800',
    defaultTerms: {
      commissionRate: 10,
      currency: 'USD',
      paymentTerms: 'Commission paid monthly',
      cancellationPolicy: '48 hours before arrival',
      specialTerms: 'Commission on room revenue only',
      bookingCutoffDays: 14
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Commission Payment',
        daysBeforeEvent: 30,
        penalty: 'Commission forfeiture'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 48,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Rooming List',
        daysBeforeEvent: 14,
        penalty: 'Auto-assignment'
      }
    ],
    suggestedSuppliers: ['Marriott', 'Hilton', 'IHG', 'Accor'],
    tags: ['hotel', 'accommodation', 'commission']
  },
  {
    id: 'activity-tour',
    name: 'Activity & Tour Contract',
    description: 'Guided tours, excursions, and activities',
    category: 'activity',
    contractType: 'commissionable',
    icon: '🎯',
    color: 'bg-purple-100 text-purple-800',
    defaultTerms: {
      commissionRate: 15,
      currency: 'USD',
      paymentTerms: 'Net 15 days',
      cancellationPolicy: '72 hours before activity',
      specialTerms: 'Minimum group size required',
      bookingCutoffDays: 3
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Final Payment',
        daysBeforeEvent: 15,
        penalty: 'Activity cancellation'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 72,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Participant List',
        daysBeforeEvent: 3,
        penalty: 'Standard pricing'
      }
    ],
    suggestedSuppliers: ['Local Tour Operators', 'Activity Providers'],
    tags: ['activity', 'tour', 'excursion']
  },
  {
    id: 'transfer-service',
    name: 'Transfer Service Contract',
    description: 'Airport transfers, ground transportation',
    category: 'transfer',
    contractType: 'allocation',
    icon: '🚌',
    color: 'bg-orange-100 text-orange-800',
    defaultTerms: {
      commissionRate: 8,
      currency: 'USD',
      paymentTerms: 'Net 7 days',
      cancellationPolicy: '24 hours before transfer',
      specialTerms: 'Vehicle capacity limits apply',
      bookingCutoffDays: 1
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Transfer Payment',
        daysBeforeEvent: 7,
        penalty: 'Transfer cancellation'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 24,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Passenger List',
        daysBeforeEvent: 1,
        penalty: 'Standard pricing'
      }
    ],
    suggestedSuppliers: ['Transfer Companies', 'Ground Transport'],
    tags: ['transfer', 'transport', 'ground']
  },
  {
    id: 'event-venue',
    name: 'Event Venue Contract',
    description: 'Conference rooms, event spaces, venues',
    category: 'event',
    contractType: 'net_rate',
    icon: '🎪',
    color: 'bg-red-100 text-red-800',
    defaultTerms: {
      commissionRate: 0,
      currency: 'USD',
      paymentTerms: 'Net 30 days',
      cancellationPolicy: '30 days before event',
      specialTerms: 'Setup time included',
      bookingCutoffDays: 30
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Venue Payment',
        daysBeforeEvent: 30,
        penalty: 'Contract cancellation'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 30,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Event Details',
        daysBeforeEvent: 30,
        penalty: 'Standard setup'
      }
    ],
    suggestedSuppliers: ['Event Venues', 'Conference Centers'],
    tags: ['event', 'venue', 'conference']
  },
  {
    id: 'cruise-package',
    name: 'Cruise Package Contract',
    description: 'Cruise ship accommodations and packages',
    category: 'cruise',
    contractType: 'commissionable',
    icon: '🚢',
    color: 'bg-cyan-100 text-cyan-800',
    defaultTerms: {
      commissionRate: 12,
      currency: 'USD',
      paymentTerms: 'Commission paid quarterly',
      cancellationPolicy: '90 days before sailing',
      specialTerms: 'Port fees additional',
      bookingCutoffDays: 60
    },
    defaultDeadlines: [
      {
        type: 'payment',
        name: 'Final Payment',
        daysBeforeEvent: 90,
        penalty: 'Cruise cancellation'
      },
      {
        type: 'cancellation',
        name: 'Free Cancellation',
        daysBeforeEvent: 90,
        penalty: 'No penalty'
      },
      {
        type: 'booking',
        name: 'Passenger Manifest',
        daysBeforeEvent: 60,
        penalty: 'Standard pricing'
      }
    ],
    suggestedSuppliers: ['Cruise Lines', 'Travel Agents'],
    tags: ['cruise', 'package', 'sailing']
  }
];

export const getTemplatesByCategory = (category: string) => {
  return CONTRACT_TEMPLATES.filter(template => template.category === category);
};

export const getTemplateById = (id: string) => {
  return CONTRACT_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByTags = (tags: string[]) => {
  return CONTRACT_TEMPLATES.filter(template => 
    tags.some(tag => template.tags.includes(tag))
  );
};
