'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  Clock, 
  ExternalLink,
  Mail,
  DollarSign,
  Phone,
  ChevronRight,
  TrendingDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { format, differenceInDays, subDays } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReleaseWarning {
  id: string
  allocation_id: string
  allocation_name: string
  contract_id: string
  contract_name: string
  product_name: string
  total_quantity: number
  available_quantity: number
  sold_quantity: number
  total_cost: number
  currency: string
  valid_from: string
  valid_to: string
  release_days: number
  release_date: string
  days_until_release: number
  potential_loss: number
  urgency_level: 'critical' | 'high' | 'medium'
}

export function ReleaseWarningsWidget() {
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null)
  const router = useRouter()
  const { profile, loading: authLoading } = useAuth()

  const { data: warnings = [], isLoading, error } = useQuery({
    queryKey: ['release-warnings', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []
      
      // This would be a dedicated API endpoint that aggregates release warnings
      const response = await fetch(`/api/allocations/release-warnings?organization_id=${profile.organization_id}`)
      if (!response.ok) throw new Error('Failed to fetch release warnings')
      
      const data = await response.json() 
      
      // Transform and categorize warnings by urgency
      return data.map((item: any) => {
        const releaseDate = new Date(item.release_date)
        const daysUntil = differenceInDays(releaseDate, new Date())
        const potentialLoss = (item.available_quantity || 0) * (item.cost_per_unit || 0)
        
        let urgency: 'critical' | 'high' | 'medium' = 'medium'
        if (daysUntil <= 3) urgency = 'critical'
        else if (daysUntil <= 7) urgency = 'high'
        else if (daysUntil <= 14) urgency = 'medium'
        
        return {
          id: item.id,
          allocation_id: item.id,
          allocation_name: item.allocation_name,
          contract_id: item.contract_id,
          contract_name: item.contract?.contract_name || 'Unknown Contract',
          product_name: item.product?.name || 'Unknown Product',
          total_quantity: item.total_quantity || 0,
          available_quantity: item.available_quantity || 0,
          sold_quantity: item.sold_quantity || 0,
          total_cost: item.total_cost || 0,
          currency: item.currency || 'GBP',
          valid_from: item.valid_from,
          valid_to: item.valid_to,
          release_days: item.release_days || 0,
          release_date: item.release_date,
          days_until_release: daysUntil,
          potential_loss: potentialLoss,
          urgency_level: urgency
        }
      }).filter((warning: ReleaseWarning) => 
        warning.days_until_release >= 0 && 
        warning.days_until_release <= 30 && 
        warning.available_quantity > 0
      ).sort((a: ReleaseWarning, b: ReleaseWarning) => a.days_until_release - b.days_until_release)
    },
    enabled: !!profile?.organization_id && !authLoading,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    retry: 1,
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  })

  const handleNavigateToAllocation = (warning: ReleaseWarning) => {
    router.push(`/contracts/${warning.contract_id}?tab=allocations&highlight=${warning.allocation_id}`)
  }

  const handleSendReminder = async (warning: ReleaseWarning) => {
    try {
      const response = await fetch('/api/notifications/release-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocation_id: warning.allocation_id,
          contract_id: warning.contract_id,
          days_until_release: warning.days_until_release,
          potential_loss: warning.potential_loss
        })
      })
      
      if (!response.ok) throw new Error('Failed to send reminder')
      
      toast.success('Release reminder sent to sales team')
    } catch (error) {
      console.error('Error sending reminder:', error)
      toast.error('Failed to send reminder')
    }
  }

  const handleAdjustPricing = (warning: ReleaseWarning) => {
    router.push(`/products/${warning.allocation_id}/rates?action=reduce-price&urgency=${warning.urgency_level}`)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Release Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-green-600" />
            Release Alerts
          </CardTitle>
          <CardDescription>All allocations are well ahead of release dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl">✅</div>
              <p className="text-sm text-muted-foreground">No urgent release deadlines</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const criticalWarnings = warnings.filter(w => w.urgency_level === 'critical')
  const highWarnings = warnings.filter(w => w.urgency_level === 'high')
  const mediumWarnings = warnings.filter(w => w.urgency_level === 'medium')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                criticalWarnings.length > 0 ? "text-destructive" :
                highWarnings.length > 0 ? "text-orange-500" : "text-yellow-500"
              )} />
              Release Alerts
            </CardTitle>
            <CardDescription>
              {warnings.length} allocation{warnings.length !== 1 ? 's' : ''} need attention
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/allocations?filter=urgent-releases')}
          >
            View All <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Critical Warnings */}
        {criticalWarnings.map(warning => (
          <ReleaseWarningCard
            key={warning.id}
            warning={warning}
            isExpanded={expandedWarning === warning.id}
            onToggleExpand={() => setExpandedWarning(
              expandedWarning === warning.id ? null : warning.id
            )}
            onNavigate={() => handleNavigateToAllocation(warning)}
            onSendReminder={() => handleSendReminder(warning)}
            onAdjustPricing={() => handleAdjustPricing(warning)}
          />
        ))}
        
        {/* High Priority Warnings */}
        {highWarnings.slice(0, 2).map(warning => (
          <ReleaseWarningCard
            key={warning.id}
            warning={warning}
            isExpanded={expandedWarning === warning.id}
            onToggleExpand={() => setExpandedWarning(
              expandedWarning === warning.id ? null : warning.id
            )}
            onNavigate={() => handleNavigateToAllocation(warning)}
            onSendReminder={() => handleSendReminder(warning)}
            onAdjustPricing={() => handleAdjustPricing(warning)}
          />
        ))}
        
        {/* Show remaining count if there are more */}
        {(highWarnings.length > 2 || mediumWarnings.length > 0) && (
          <Button 
            variant="ghost" 
            className="w-full text-sm text-muted-foreground"
            onClick={() => router.push('/allocations?filter=urgent-releases')}
          >
            + {(highWarnings.length - 2) + mediumWarnings.length} more warnings
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface ReleaseWarningCardProps {
  warning: ReleaseWarning
  isExpanded: boolean
  onToggleExpand: () => void
  onNavigate: () => void
  onSendReminder: () => void
  onAdjustPricing: () => void
}

function ReleaseWarningCard({
  warning,
  isExpanded,
  onToggleExpand,
  onNavigate,
  onSendReminder,
  onAdjustPricing
}: ReleaseWarningCardProps) {
  const urgencyConfig = {
    critical: {
      variant: 'destructive' as const,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/20'
    },
    high: {
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    },
    medium: {
      variant: 'outline' as const,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200'
    }
  }

  const config = urgencyConfig[warning.urgency_level]
  const utilizationRate = warning.total_quantity > 0 ? 
    (warning.sold_quantity / warning.total_quantity) * 100 : 0

  return (
    <Alert className={cn(config.bg, config.border, "cursor-pointer")} onClick={onToggleExpand}>
      <config.icon className={cn("h-4 w-4", config.color)} />
      <div className="flex-1">
        <AlertTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{warning.allocation_name}</span>
            <Badge variant={config.variant} className="text-xs">
              {warning.days_until_release === 0 ? 'TODAY' :
                warning.days_until_release === 1 ? 'Tomorrow' :
                `${warning.days_until_release} days`}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={config.color}>
              {warning.available_quantity} units • {warning.currency} {Math.round(warning.potential_loss).toLocaleString()}
            </span>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )} />
          </div>
        </AlertTitle>
        <AlertDescription className="mt-1">
          <div className="flex items-center justify-between text-sm">
            <span>{warning.product_name} • {warning.contract_name}</span>
            <span>Release: {format(new Date(warning.release_date), 'MMM d, yyyy')}</span>
          </div>
          
          {/* Utilization bar */}
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Utilization</span>
              <span>{utilizationRate.toFixed(0)}% sold</span>
            </div>
            <Progress value={utilizationRate} className="h-2" />
          </div>
        </AlertDescription>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium">{warning.total_quantity}</div>
                <div className="text-xs text-muted-foreground">Total Units</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-orange-600">{warning.sold_quantity}</div>
                <div className="text-xs text-muted-foreground">Sold</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{warning.available_quantity}</div>
                <div className="text-xs text-muted-foreground">Available</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={(e) => { e.stopPropagation(); onNavigate() }}>
                <ExternalLink className="h-4 w-4 mr-1" />
                View Details
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onSendReminder() }}
              >
                <Mail className="h-4 w-4 mr-1" />
                Send Reminder
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={(e) => { e.stopPropagation(); onAdjustPricing() }}
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Reduce Price
              </Button>
            </div>
          </div>
        )}
      </div>
    </Alert>
  )
}
