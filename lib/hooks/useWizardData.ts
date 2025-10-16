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
      title: 'Hotel / Accommodation',
      description: 'Hotels, hostels, apartments, vacation rentals',
      icon: 'Building2',
      popular: true,
      examples: 'Standard Room, Deluxe Suite, Apartment',
      active: true,
      sort_order: 1
    },
    {
      id: 'activity',
      title: 'Activity / Experience', 
      description: 'Tours, excursions, attractions, events',
      icon: 'Ticket',
      popular: true,
      examples: 'City Tour, Museum Ticket, Cooking Class',
      active: true,
      sort_order: 2
    },
    {
      id: 'transfer',
      title: 'Transfer / Transport',
      description: 'Airport transfers, shuttles, private cars',
      icon: 'Car',
      popular: false,
      examples: 'Airport Shuttle, Private Transfer, Coach',
      active: true,
      sort_order: 3
    },
    {
      id: 'package',
      title: 'Multi-Day Package',
      description: 'Complete tours with accommodation, activities, transfers',
      icon: 'Package',
      popular: false,
      badge: 'Advanced',
      examples: '7-Day Italy Tour, Weekend Getaway',
      active: true,
      sort_order: 4
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
