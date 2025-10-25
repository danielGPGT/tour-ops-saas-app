'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lock,
  Users,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import type { AvailabilityStats } from '@/lib/types/availability'

interface AvailabilityStatsProps {
  stats: AvailabilityStats
  isLoading?: boolean
  className?: string
}

export function AvailabilityStatsComponent({ 
  stats, 
  isLoading = false,
  className = '' 
}: AvailabilityStatsProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-muted animate-pulse rounded mb-2" />
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-orange-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getUtilizationBadge = (percentage: number) => {
    if (percentage >= 90) return { variant: 'destructive' as const, label: 'Critical' }
    if (percentage >= 70) return { variant: 'secondary' as const, label: 'High' }
    if (percentage >= 50) return { variant: 'outline' as const, label: 'Medium' }
    return { variant: 'default' as const, label: 'Low' }
  }

  const utilizationBadge = getUtilizationBadge(stats.utilization_percentage)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory</p>
                <p className="text-2xl font-bold">{stats.total_inventory.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total units</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.total_available.toLocaleString()}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {((stats.total_available / stats.total_inventory) * 100).toFixed(1)}% of total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Booked</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_booked.toLocaleString()}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {stats.utilization_percentage.toFixed(1)}% utilization
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                <p className={`text-2xl font-bold ${getUtilizationColor(stats.utilization_percentage)}`}>
                  {stats.utilization_percentage.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge variant={utilizationBadge.variant}>
                {utilizationBadge.label}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Utilization Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Utilization</span>
              <span className="text-sm text-muted-foreground">
                {stats.utilization_percentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={stats.utilization_percentage} 
              className="h-2"
            />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-600">Available</div>
                <div className="text-muted-foreground">
                  {stats.total_available.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">Booked</div>
                <div className="text-muted-foreground">
                  {stats.total_booked.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Total</div>
                <div className="text-muted-foreground">
                  {stats.total_inventory.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Sold Out Days</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.sold_out_days}
            </div>
            <div className="text-sm text-muted-foreground">
              Days with no availability
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Low Availability</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.low_availability_days}
            </div>
            <div className="text-sm text-muted-foreground">
              Days with &lt;10% availability
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Closed Days</span>
            </div>
            <div className="text-2xl font-bold text-gray-600">
              {stats.closed_days}
            </div>
            <div className="text-sm text-muted-foreground">
              Manually closed dates
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Availability Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {((stats.total_available / stats.total_inventory) * 100).toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={(stats.total_available / stats.total_inventory) * 100} 
                className="h-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Booking Rate</span>
                <span className="text-sm font-bold text-blue-600">
                  {stats.utilization_percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={stats.utilization_percentage} 
                className="h-2"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Quick Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Peak Utilization</div>
                <div className="font-medium">
                  {stats.utilization_percentage >= 80 ? 'High' : 
                   stats.utilization_percentage >= 50 ? 'Medium' : 'Low'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Inventory Health</div>
                <div className="font-medium">
                  {stats.sold_out_days === 0 ? 'Excellent' :
                   stats.sold_out_days <= 5 ? 'Good' : 'Needs Attention'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
