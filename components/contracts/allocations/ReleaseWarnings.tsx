'use client'

import React, { useState } from 'react'
import { useContractAllocations } from '@/lib/hooks/useContracts'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { ReleaseActionMenu } from './ReleaseActionMenu'
import { differenceInDays, subDays, format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ReleaseWarningsProps {
  contractId: string
}

export function ReleaseWarnings({ contractId }: ReleaseWarningsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedWarning, setExpandedWarning] = useState<string | null>(null)
  const { data: allocations } = useContractAllocations(contractId)

  const warnings = React.useMemo(() => {
    if (!allocations) return []

    return allocations.filter(allocation => {
      // Only show warnings for allocations with release days set
      if (!allocation.release_days || !allocation.valid_from) return false

      // Calculate release date
      const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
      const daysUntil = differenceInDays(releaseDate, new Date())

      // Show warning if release is upcoming (within 30 days) and there's available inventory
      const hasAvailableUnits = (allocation.total_quantity || 0) - (allocation.sold_quantity || 0) > 0
      return daysUntil >= -1 && daysUntil <= 30 && hasAvailableUnits // Include overdue items
    }).map(allocation => {
      const releaseDate = subDays(new Date(allocation.valid_from), allocation.release_days)
      const daysUntil = differenceInDays(releaseDate, new Date())
      const availableUnits = (allocation.total_quantity || 0) - (allocation.sold_quantity || 0)
      const soldUnits = allocation.sold_quantity || 0
      const totalUnits = allocation.total_quantity || 0
      const utilizationRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0
      const potentialLoss = availableUnits * (allocation.cost_per_unit || 0)

      let urgencyLevel: 'critical' | 'high' | 'medium' = 'medium'
      if (daysUntil <= 3) urgencyLevel = 'critical'
      else if (daysUntil <= 7) urgencyLevel = 'high'

      return {
        ...allocation,
        releaseDate,
        daysUntil,
        availableUnits,
        soldUnits,
        totalUnits,
        utilizationRate,
        potentialLoss,
        urgencyLevel
      }
    }).sort((a, b) => a.daysUntil - b.daysUntil) // Sort by urgency
  }, [allocations])

  if (warnings.length === 0) return null

  const criticalWarnings = warnings.filter(w => w.urgencyLevel === 'critical')
  const highWarnings = warnings.filter(w => w.urgencyLevel === 'high')
  const displayWarnings = isExpanded ? warnings : warnings.slice(0, 3)

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        criticalWarnings.length > 0 ? "border-destructive bg-destructive/10" :
        highWarnings.length > 0 ? "border-orange-200 bg-orange-50" :
        "border-yellow-200 bg-yellow-50"
      )}
    >
      <AlertTriangle className={cn(
        "h-4 w-4",
        criticalWarnings.length > 0 ? "text-destructive" :
        highWarnings.length > 0 ? "text-orange-500" :
        "text-yellow-600"
      )} />
      <div className="flex items-center justify-between">
        <AlertTitle>
          {criticalWarnings.length > 0 ? 'CRITICAL: Release Deadlines' :
           highWarnings.length > 0 ? 'URGENT: Release Deadlines' :
           'Upcoming Release Deadlines'}
        </AlertTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {warnings.length} allocation{warnings.length !== 1 ? 's' : ''}
          </Badge>
          {warnings.length > 3 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? 'Show Less' : `+${warnings.length - 3} More`}
            </Button>
          )}
        </div>
      </div>
      <AlertDescription>
        <div className="space-y-3 mt-4">
          {displayWarnings.map(allocation => (
            <div 
              key={allocation.id} 
              className={cn(
                "p-4 bg-background rounded-lg border transition-all",
                allocation.urgencyLevel === 'critical' && "border-destructive/20 bg-destructive/5",
                allocation.urgencyLevel === 'high' && "border-orange-200 bg-orange-50/50",
                expandedWarning === allocation.id && "ring-2 ring-primary/20"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium">{allocation.allocation_name}</div>
                    <Badge 
                      variant={
                        allocation.urgencyLevel === 'critical' ? 'destructive' :
                        allocation.urgencyLevel === 'high' ? 'secondary' : 'outline'
                      }
                      className={cn(
                        allocation.urgencyLevel === 'critical' && "animate-pulse",
                        "text-xs"
                      )}
                    >
                      {allocation.daysUntil === 0 ? 'DUE TODAY' :
                       allocation.daysUntil === 1 ? 'DUE TOMORROW' :
                       allocation.daysUntil < 0 ? 'OVERDUE' :
                       `${allocation.daysUntil} DAYS LEFT`}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {allocation.allocation_type}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-muted-foreground">Available</div>
                      <div className="font-medium text-orange-600">
                        {allocation.availableUnits} units
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Release Date</div>
                      <div className="font-medium">
                        {format(allocation.releaseDate, 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Potential Loss</div>
                      <div className="font-medium text-destructive">
                        {allocation.currency} {Math.round(allocation.potentialLoss).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Utilization Progress */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Utilization</span>
                      <span>{allocation.utilizationRate.toFixed(0)}% sold</span>
                    </div>
                    <Progress value={allocation.utilizationRate} className="h-2" />
                  </div>
                  
                  {expandedWarning === allocation.id && (
                    <div className="pt-3 border-t space-y-2">
                      <div className="text-sm">
                        <strong>Recommendations:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                          {allocation.urgencyLevel === 'critical' && (
                            <>
                              <li>Immediately contact supplier for extension</li>
                              <li>Consider emergency price reduction (20-40%)</li>
                              <li>Alert sales team for urgent action</li>
                            </>
                          )}
                          {allocation.urgencyLevel === 'high' && (
                            <>
                              <li>Schedule supplier call this week</li>
                              <li>Reduce prices to accelerate sales</li>
                              <li>Send urgent reminder to sales team</li>
                            </>
                          )}
                          {allocation.urgencyLevel === 'medium' && (
                            <>
                              <li>Monitor daily and prepare action plan</li>
                              <li>Consider promotional pricing</li>
                              <li>Weekly sales team reminder</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedWarning(
                      expandedWarning === allocation.id ? null : allocation.id
                    )}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <ReleaseActionMenu 
                    allocation={allocation}
                    warning={{
                      days_until_release: allocation.daysUntil,
                      available_quantity: allocation.availableUnits,
                      potential_loss: allocation.potentialLoss,
                      urgency_level: allocation.urgencyLevel
                    }}
                    onActionComplete={(action) => {
                      // Could add tracking or refresh logic here
                      console.log(`Completed action: ${action} for allocation ${allocation.id}`)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              <strong>Total at risk:</strong> {warnings[0]?.currency || 'GBP'} {warnings.reduce((sum, w) => sum + w.potentialLoss, 0).toLocaleString()}
            </p>
            <div className="flex gap-2">
              {criticalWarnings.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalWarnings.length} Critical
                </Badge>
              )}
              {highWarnings.length > 0 && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  {highWarnings.length} High Priority
                </Badge>
              )}
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
