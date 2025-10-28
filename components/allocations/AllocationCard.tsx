'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Package, 
  Calendar, 
  DollarSign, 
  Building2,
  FileText,
  MoreVertical,
  Eye,
  Edit,
  ExternalLink,
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react'
import { format, differenceInDays, subDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AllocationCardProps {
  allocation: any
  onSelect?: () => void
  showContractInfo?: boolean
  className?: string
}

export function AllocationCard({ 
  allocation, 
  onSelect, 
  showContractInfo = false, 
  className 
}: AllocationCardProps) {
  const router = useRouter()

  // Calculate utilization
  const totalQuantity = allocation.total_quantity || 0
  const soldQuantity = allocation.sold_quantity || 0
  const availableQuantity = allocation.available_quantity ?? (totalQuantity - soldQuantity)
  const utilizationRate = totalQuantity > 0 ? (soldQuantity / totalQuantity) * 100 : 0

  // Calculate release urgency
  let releaseStatus = null
  let daysUntilRelease = null
  let releaseDate = null

  if (allocation.release_days && allocation.valid_from) {
    const validFromDate = new Date(allocation.valid_from)
    releaseDate = subDays(validFromDate, allocation.release_days)
    daysUntilRelease = differenceInDays(releaseDate, new Date())

    if (daysUntilRelease < 0) {
      releaseStatus = { 
        label: 'Overdue', 
        variant: 'destructive' as const, 
        color: 'text-destructive',
        bg: 'bg-destructive/10 border-destructive/20'
      }
    } else if (daysUntilRelease <= 3) {
      releaseStatus = { 
        label: daysUntilRelease === 0 ? 'Today' : `${daysUntilRelease} days`, 
        variant: 'destructive' as const, 
        color: 'text-destructive',
        bg: 'bg-destructive/10 border-destructive/20'
      }
    } else if (daysUntilRelease <= 7) {
      releaseStatus = { 
        label: `${daysUntilRelease} days`, 
        variant: 'secondary' as const, 
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200'
      }
    } else if (daysUntilRelease <= 30) {
      releaseStatus = { 
        label: `${daysUntilRelease} days`, 
        variant: 'outline' as const, 
        color: 'text-yellow-600',
        bg: 'bg-yellow-50 border-yellow-200'
      }
    }
  }

  const typeConfig = {
    committed: { 
      variant: 'default' as const, 
      label: 'Committed',
      icon: Target
    },
    on_request: { 
      variant: 'secondary' as const, 
      label: 'On Request',
      icon: Clock
    },
    free_sale: { 
      variant: 'outline' as const, 
      label: 'Free Sale',
      icon: Package
    }
  }

  const config = typeConfig[allocation.allocation_type as keyof typeof typeConfig] || typeConfig.committed
  const TypeIcon = config.icon

  const handleCardClick = () => {
    if (onSelect) {
      onSelect()
    }
  }

  const handleViewContract = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/contracts/${allocation.contract_id}?tab=allocations&highlight=${allocation.id}`)
  }

  const handleViewProduct = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/products/${allocation.product_id}?tab=allocations`)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Open edit dialog
    console.log('Edit allocation:', allocation.id)
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        releaseStatus?.bg,
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{allocation.allocation_name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Badge variant={config.variant} className="text-xs">
                <TypeIcon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              {releaseStatus && (
                <Badge variant={releaseStatus.variant} className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {releaseStatus.label}
                </Badge>
              )}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect?.() }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Allocation
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {showContractInfo && (
                <DropdownMenuItem onClick={handleViewContract}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Contract
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleViewProduct}>
                <Package className="h-4 w-4 mr-2" />
                View Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contract and Product Info (if global view) */}
        {showContractInfo && (
          <div className="space-y-2 pb-3 border-b">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{allocation.contract?.contract_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{allocation.product?.name}</span>
              <Badge variant="outline" className="text-xs">
                {allocation.product?.product_type}
              </Badge>
            </div>
            {allocation.contract?.supplier && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{allocation.contract.supplier.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Quantity and Utilization */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-sm font-semibold">{totalQuantity}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-sm font-semibold text-orange-600">{soldQuantity}</div>
              <div className="text-xs text-muted-foreground">Sold</div>
            </div>
            <div className="p-2 bg-muted/50 rounded">
              <div className="text-sm font-semibold text-green-600">{availableQuantity}</div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Utilization Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilization</span>
              <span>{utilizationRate.toFixed(0)}% sold</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
          </div>
        </div>

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-sm font-semibold">
              {allocation.currency} {allocation.total_cost ? Math.round(allocation.total_cost / 1000).toLocaleString() + 'k' : '0'}
            </div>
            <div className="text-xs text-muted-foreground">Total Cost</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold">
              {allocation.currency} {allocation.cost_per_unit ? Math.round(allocation.cost_per_unit).toLocaleString() : '0'}
            </div>
            <div className="text-xs text-muted-foreground">Per Unit</div>
          </div>
        </div>

        {/* Valid Period */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(allocation.valid_from), 'MMM d')} - {format(new Date(allocation.valid_to), 'MMM d, yyyy')}
            </span>
          </div>
          {releaseDate && (
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className={releaseStatus?.color || 'text-muted-foreground'}>
                Release: {format(releaseDate, 'MMM d, yyyy')}
                {daysUntilRelease !== null && daysUntilRelease >= 0 && (
                  <span className="ml-1">({daysUntilRelease} days)</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
          {showContractInfo && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={handleViewContract}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Contract
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
