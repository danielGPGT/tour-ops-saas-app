'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { PoolCard } from './PoolCard';

interface InventoryPool {
  id: number;
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
  supplier?: {
    id: number;
    name: string;
  };
  pool_variants?: any[];
  utilization?: any;
}

interface PoolDashboardProps {
  pools: InventoryPool[];
  onAddPool?: () => void;
  onEditPool?: (pool: InventoryPool) => void;
  onDeletePool?: (pool: InventoryPool) => void;
  onViewPool?: (pool: InventoryPool) => void;
  onDuplicatePool?: (pool: InventoryPool) => void;
  onExport?: () => void;
  onImport?: () => void;
}

export function PoolDashboard({ 
  pools, 
  onAddPool, 
  onEditPool, 
  onDeletePool, 
  onViewPool, 
  onDuplicatePool,
  onExport,
  onImport 
}: PoolDashboardProps) {
  // Calculate summary statistics
  const totalPools = pools.length;
  const activePools = pools.filter(p => p.status === 'active').length;
  const committedPools = pools.filter(p => p.pool_type === 'committed').length;
  const totalCapacity = pools.reduce((sum, pool) => sum + (pool.total_capacity || 0), 0);
  const totalUtilization = pools.reduce((sum, pool) => {
    return sum + (pool.utilization?.utilization_percentage || 0);
  }, 0);
  const avgUtilization = totalPools > 0 ? totalUtilization / totalPools : 0;

  // Count pools by status
  const poolsByStatus = {
    active: pools.filter(p => p.status === 'active').length,
    inactive: pools.filter(p => p.status === 'inactive').length,
    released: pools.filter(p => p.status === 'released').length,
    expired: pools.filter(p => p.status === 'expired').length,
  };

  // Count pools by type
  const poolsByType = {
    committed: pools.filter(p => p.pool_type === 'committed').length,
    provisional: pools.filter(p => p.pool_type === 'provisional').length,
    on_request: pools.filter(p => p.pool_type === 'on_request').length,
    freesale: pools.filter(p => p.pool_type === 'freesale').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'released': return <Download className="w-4 h-4 text-blue-600" />;
      case 'expired': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPoolTypeIcon = (type: string) => {
    switch (type) {
      case 'committed': return <Building2 className="w-4 h-4 text-green-600" />;
      case 'provisional': return <Calendar className="w-4 h-4 text-yellow-600" />;
      case 'on_request': return <Users className="w-4 h-4 text-blue-600" />;
      case 'freesale': return <DollarSign className="w-4 h-4 text-purple-600" />;
      default: return <Building2 className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Pools</h1>
          <p className="text-muted-foreground">
            Manage your supplier inventory blocks and allocations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onImport && (
            <Button variant="outline" size="sm" onClick={onImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          {onAddPool && (
            <Button onClick={onAddPool}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pool
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPools}</div>
            <p className="text-xs text-muted-foreground">
              {activePools} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              units across all pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              across all active pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Committed Pools</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{committedPools}</div>
            <p className="text-xs text-muted-foreground">
              guaranteed allocations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search pools..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pool Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="committed">Committed</SelectItem>
                <SelectItem value="provisional">Provisional</SelectItem>
                <SelectItem value="on_request">On Request</SelectItem>
                <SelectItem value="freesale">Free Sale</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pool Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(poolsByType).map(([type, count]) => (
          <Card key={type}>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                {getPoolTypeIcon(type)}
                <div>
                  <p className="text-sm font-medium capitalize">
                    {type.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <PoolCard
            key={pool.id}
            pool={pool}
            onEdit={onEditPool}
            onDelete={onDeletePool}
            onView={onViewPool}
            onDuplicate={onDuplicatePool}
          />
        ))}
      </div>

      {pools.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pools found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first inventory pool to start managing supplier allocations
            </p>
            {onAddPool && (
              <Button onClick={onAddPool}>
                <Plus className="w-4 h-4 mr-2" />
                Create Pool
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
