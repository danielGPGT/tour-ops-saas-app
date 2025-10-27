import { useState, useEffect } from 'react';

interface ProductType {
  id: string;
  title: string;
  description: string;
  icon: string;
  popular: boolean;
  badge?: string;
  examples: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  status: string;
}

interface ProductSubtype {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export function useWizardData() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWizardData();
  }, []);

  const loadWizardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product types and suppliers in parallel, but handle failures gracefully
      const [productTypesRes, suppliersRes] = await Promise.allSettled([
        fetch('/api/wizard/product-types'),
        fetch('/api/wizard/suppliers')
      ]);

      // Handle product types
      if (productTypesRes.status === 'fulfilled' && productTypesRes.value.ok) {
        const productTypesData = await productTypesRes.value.json();
        if (productTypesData.success) {
          setProductTypes(productTypesData.data);
        }
      } else {
        console.warn('Failed to load product types, using defaults');
        setProductTypes(getDefaultProductTypes());
      }

      // Handle suppliers
      if (suppliersRes.status === 'fulfilled' && suppliersRes.value.ok) {
        const suppliersData = await suppliersRes.value.json();
        if (suppliersData.success) {
          setSuppliers(suppliersData.data);
        }
      } else {
        console.warn('Failed to load suppliers, using empty list');
        setSuppliers([]);
      }

    } catch (err) {
      console.error('Error loading wizard data:', err);
      // Don't set error state, just use defaults
      setProductTypes(getDefaultProductTypes());
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProductTypes = () => [
    {
      id: 'accommodation',
      title: 'Accommodation',
      description: 'Hotels, apartments, villas, and lodging. Complex pricing with occupancy variations, contracted allocations, and inventory management.',
      icon: 'bed',
      popular: true,
      examples: 'Standard Room, Deluxe Suite, Villa',
      active: true,
      sort_order: 1
    },
    {
      id: 'event',
      title: 'Event Tickets',
      description: 'Race tickets, grandstand seats, paddock passes. Simple per-unit pricing with batch inventory allocations.',
      icon: 'ticket',
      popular: true,
      examples: 'Grandstand K, Paddock Club, VIP',
      active: true,
      sort_order: 2
    },
    {
      id: 'transfer',
      title: 'Transfers',
      description: 'Airport transfers, circuit shuttles, ground transport. On-request products with no inventory, priced per booking or per vehicle.',
      icon: 'car',
      popular: true,
      examples: 'Airport Transfer, Private Car, Shared Shuttle',
      active: true,
      sort_order: 3
    },
    {
      id: 'transport',
      title: 'Transport',
      description: 'Flights, trains, ferries. Dynamic products with generic catalog entries and specific details in transport_segments. Quoted per customer, no inventory.',
      icon: 'plane',
      popular: false,
      examples: 'Flight Package, Train Ticket, Ferry',
      active: true,
      sort_order: 4
    },
    {
      id: 'experience',
      title: 'Experiences',
      description: 'Tours, activities, yacht charters, helicopter rides. On-request products, typically priced per booking or per person, no inventory.',
      icon: 'compass',
      popular: true,
      examples: 'Yacht Tour, Helicopter Flight, Wine Tasting',
      active: true,
      sort_order: 5
    },
    {
      id: 'extra',
      title: 'Extras',
      description: 'Supplementary items and add-ons like lounge access, insurance, parking, merchandise. Simple products, typically on-request, high margins.',
      icon: 'package',
      popular: false,
      examples: 'Lounge Access, Insurance, Parking',
      active: true,
      sort_order: 6
    }
  ];

  const fetchProductSubtypes = async (productType: string): Promise<ProductSubtype[]> => {
    try {
      const response = await fetch(`/api/wizard/product-subtypes?productType=${productType}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch product subtypes: ${response.status}`);
        return getDefaultSubtypes(productType);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      
      return getDefaultSubtypes(productType);
    } catch (err) {
      console.error('Error fetching product subtypes:', err);
      return getDefaultSubtypes(productType);
    }
  };

  const getDefaultSubtypes = (productType: string): ProductSubtype[] => {
    switch (productType) {
      case 'accommodation':
        return [
          { id: 'standard_room', name: 'Standard Room', description: 'Standard hotel room', active: true },
          { id: 'deluxe_room', name: 'Deluxe Room', description: 'Deluxe hotel room', active: true },
          { id: 'suite', name: 'Suite', description: 'Hotel suite', active: true },
          { id: 'apartment', name: 'Apartment', description: 'Self-contained apartment', active: true }
        ];
      
      case 'activity':
        return [
          { id: 'adult', name: 'Adult', description: 'Adult ticket', active: true },
          { id: 'child', name: 'Child', description: 'Child ticket', active: true },
          { id: 'family', name: 'Family', description: 'Family ticket (2 adults + 2 children)', active: true },
          { id: 'group', name: 'Group', description: 'Group ticket (10+ people)', active: true }
        ];
      
      case 'transfer':
        return [
          { id: 'sedan', name: 'Sedan', description: 'Private sedan (up to 4 people)', active: true },
          { id: 'suv', name: 'SUV', description: 'Private SUV (up to 6 people)', active: true },
          { id: 'van', name: 'Van', description: 'Private van (up to 8 people)', active: true },
          { id: 'coach', name: 'Coach', description: 'Shared coach/bus', active: true }
        ];
      
      case 'package':
        return [
          { id: 'standard', name: 'Standard', description: 'Standard package', active: true },
          { id: 'premium', name: 'Premium', description: 'Premium package with extras', active: true },
          { id: 'luxury', name: 'Luxury', description: 'Luxury package with all inclusions', active: true },
          { id: 'custom', name: 'Custom', description: 'Custom package', active: true }
        ];
      
      default:
        return [];
    }
  };

  const createSupplier = async (supplierData: { name: string; email?: string; phone?: string }) => {
    try {
      const response = await fetch('/api/wizard/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      if (!response.ok) {
        throw new Error('Failed to create supplier');
      }

      const data = await response.json();
      
      if (data.success) {
        // Add the new supplier to the list
        setSuppliers(prev => [...prev, data.data]);
        return data.data;
      }
      
      throw new Error('Failed to create supplier');
    } catch (err) {
      console.error('Error creating supplier:', err);
      throw err;
    }
  };

  return {
    productTypes,
    suppliers,
    loading,
    error,
    fetchProductSubtypes,
    createSupplier,
    refetch: loadWizardData
  };
}
