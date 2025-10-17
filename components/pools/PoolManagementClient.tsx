'use client';

import { useState } from 'react';
import { PoolDashboard } from './PoolDashboard';
import { PoolWizard } from './PoolWizard';
import { toast } from 'sonner';

interface PoolVariant {
  id?: string;
  product_variant_id?: number;
  capacity_weight: number;
  cost_per_unit?: number;
  sell_price_per_unit?: number;
  priority: number;
  auto_allocate: boolean;
  status: string;
  product_variant?: {
    id: number;
    name: string;
    subtype: string;
  };
}

interface InventoryPool {
  id?: number;
  name: string;
  reference?: string;
  pool_type: 'committed' | 'provisional' | 'on_request' | 'freesale';
  valid_from: string;
  valid_to: string;
  total_capacity?: number;
  capacity_unit: string;
  min_commitment?: number;
  release_date?: string;
  cutoff_days?: number;
  currency: string;
  status: string;
  notes?: string;
  supplier_id?: number;
  supplier?: {
    id: number;
    name: string;
  };
  pool_variants?: PoolVariant[];
  utilization?: any;
}

interface PoolManagementClientProps {
  initialPools: InventoryPool[];
  suppliers: Array<{ id: number; name: string }>;
  productVariants: Array<{ id: number; name: string; subtype: string }>;
}

export function PoolManagementClient({ 
  initialPools, 
  suppliers, 
  productVariants 
}: PoolManagementClientProps) {
  const [pools, setPools] = useState<InventoryPool[]>(initialPools);
  const [showWizard, setShowWizard] = useState(false);
  const [editingPool, setEditingPool] = useState<InventoryPool | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddPool = () => {
    setEditingPool(null);
    setShowWizard(true);
  };

  const handleEditPool = (pool: InventoryPool) => {
    setEditingPool(pool);
    setShowWizard(true);
  };

  const handleDeletePool = async (pool: InventoryPool) => {
    if (!pool.id) return;
    
    if (!confirm(`Are you sure you want to delete "${pool.name}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/pools/${pool.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pool');
      }

      setPools(prev => prev.filter(p => p.id !== pool.id));
      toast.success('Pool deleted successfully');
    } catch (error) {
      console.error('Error deleting pool:', error);
      toast.error('Failed to delete pool');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPool = (pool: InventoryPool) => {
    // TODO: Implement pool details view
    console.log('View pool:', pool);
    toast.info('Pool details view coming soon');
  };

  const handleDuplicatePool = (pool: InventoryPool) => {
    const duplicatedPool = {
      ...pool,
      id: undefined,
      name: `${pool.name} (Copy)`,
      reference: pool.reference ? `${pool.reference}-COPY` : undefined,
      status: 'active' as const,
    };
    setEditingPool(duplicatedPool);
    setShowWizard(true);
  };

  const handleSavePool = async (poolData: InventoryPool) => {
    setLoading(true);
    try {
      const url = editingPool?.id ? `/api/pools/${editingPool.id}` : '/api/pools';
      const method = editingPool?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(poolData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save pool');
      }

      const savedPool = await response.json();

      if (editingPool?.id) {
        // Update existing pool
        setPools(prev => prev.map(p => p.id === editingPool.id ? savedPool : p));
        toast.success('Pool updated successfully');
      } else {
        // Add new pool
        setPools(prev => [savedPool, ...prev]);
        toast.success('Pool created successfully');
      }

      setShowWizard(false);
      setEditingPool(null);
    } catch (error) {
      console.error('Error saving pool:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save pool');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWizard = () => {
    setShowWizard(false);
    setEditingPool(null);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.info('Export functionality coming soon');
  };

  const handleImport = () => {
    // TODO: Implement import functionality
    toast.info('Import functionality coming soon');
  };

  if (showWizard) {
    return (
      <PoolWizard
        initialData={editingPool || undefined}
        onSave={handleSavePool}
        onCancel={handleCancelWizard}
        suppliers={suppliers}
        productVariants={productVariants}
      />
    );
  }

  return (
    <PoolDashboard
      pools={pools}
      onAddPool={handleAddPool}
      onEditPool={handleEditPool}
      onDeletePool={handleDeletePool}
      onViewPool={handleViewPool}
      onDuplicatePool={handleDuplicatePool}
      onExport={handleExport}
      onImport={handleImport}
    />
  );
}
