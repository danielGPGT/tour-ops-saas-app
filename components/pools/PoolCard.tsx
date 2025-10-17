'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Calendar, 
  Users, 
  DollarSign, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

interface PoolVariant {
  id: number;
  product_variant_id: number;
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

interface PoolUtilization {
  snapshot_date: string;
  total_capacity?: number;
  booked_units: number;
  held_units: number;
  available_units: number;
  utilization_percentage: number;
  is_released: boolean;
  is_overbooked: boolean;
}

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
  pool_variants?: PoolVariant[];
  utilization?: PoolUtilization;
}

interface PoolCardProps {
  pool: InventoryPool;
  onEdit?: (pool: InventoryPool) => void;
  onDelete?: (pool: InventoryPool) => void;
  onView?: (pool: InventoryPool) => void;
  onDuplicate?: (pool: InventoryPool) => void;
}

export function PoolCard({ pool, onEdit, onDelete, onView, onDuplicate }: PoolCardProps) {
  const getPoolTypeColor = (type: string) => {
    switch (type) {
      case 'committed': return 'bg-green-100 text-green-800';
      case 'provisional': return 'bg-yellow-100 text-yellow-800';
      case 'on_request': return 'bg-blue-100 text-blue-800';
      case 'freesale': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'released': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCapacity = (capacity?: number, unit: string = 'units') => {
    if (!capacity) return 'Unlimited';
    return `${capacity} ${unit}`;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const daysUntilRelease = pool.release_date 
    ? Math.ceil((new Date(pool.release_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{pool.name}</CardTitle>
            <CardDescription className="text-sm">
              {pool.supplier?.name} • {format(new Date(pool.valid_from), 'MMM dd')} - {format(new Date(pool.valid_to), 'MMM dd, yyyy')}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(pool)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(pool)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Pool
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={() => onDuplicate(pool)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {(onView || onEdit || onDuplicate) && onDelete && (
                <DropdownMenuSeparator />
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(pool)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getPoolTypeColor(pool.pool_type)}>
            {pool.pool_type.replace('_', ' ')}
          </Badge>
          <Badge className={getStatusColor(pool.status)}>
            {pool.status}
          </Badge>
          {pool.reference && (
            <Badge variant="outline" className="text-xs">
              {pool.reference}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capacity & Utilization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium">
              {formatCapacity(pool.total_capacity, pool.capacity_unit)}
            </span>
          </div>
          
          {pool.utilization && pool.total_capacity && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className={`font-medium ${getUtilizationColor(pool.utilization.utilization_percentage)}`}>
                    {pool.utilization.utilization_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={pool.utilization.utilization_percentage} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pool.utilization.booked_units} booked</span>
                  <span>{pool.utilization.held_units} held</span>
                  <span>{pool.utilization.available_units} available</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pool Variants */}
        {pool.pool_variants && pool.pool_variants.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Variants</span>
              <span className="font-medium">{pool.pool_variants.length}</span>
            </div>
            <div className="space-y-1">
              {pool.pool_variants.slice(0, 3).map((variant) => (
                <div key={variant.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {variant.product_variant?.name || `Variant ${variant.product_variant_id}`}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">
                      {variant.capacity_weight}x
                    </span>
                    {variant.sell_price_per_unit && (
                      <span className="font-medium">
                        {pool.currency} {variant.sell_price_per_unit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {pool.pool_variants.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{pool.pool_variants.length - 3} more variants
                </div>
              )}
            </div>
          </div>
        )}

        {/* Key Dates & Rules */}
        <div className="space-y-2 pt-2 border-t">
          {pool.min_commitment && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Min Commitment</span>
              <span className="font-medium">{pool.min_commitment} {pool.capacity_unit}</span>
            </div>
          )}
          
          {daysUntilRelease !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Release Date</span>
              <span className={`font-medium ${daysUntilRelease <= 7 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {daysUntilRelease <= 0 ? 'Released' : `${daysUntilRelease} days`}
              </span>
            </div>
          )}
          
          {pool.cutoff_days && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cutoff</span>
              <span className="font-medium">{pool.cutoff_days} days before</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onView && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onView(pool)}
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </Button>
          )}
          {onEdit && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onEdit(pool)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
