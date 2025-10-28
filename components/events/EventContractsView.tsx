'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  ExternalLink,
  Package,
  TrendingUp
} from 'lucide-react'
import { useEvent } from '@/lib/hooks/useEvents'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface EventContractsViewProps {
  eventId: string
}

export function EventContractsView({ eventId }: EventContractsViewProps) {
  const { data: event, isLoading } = useEvent(eventId)
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const contracts = event?.contracts || []

  if (contracts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Contracts Found</h3>
            <p className="text-muted-foreground mb-4">
              No contracts are currently linked to this event. Contracts are typically
              linked when they include products that are associated with this event.
            </p>
            <Button variant="outline" onClick={() => router.push('/contracts')}>
              View All Contracts
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Related Contracts</h3>
          <p className="text-sm text-muted-foreground">
            Contracts with products linked to this event ({contracts.length} found)
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/contracts')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Contracts
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contracts.map((contract: any) => (
          <Card key={contract.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{contract.contract_name}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {contract.supplier?.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(contract.valid_from), 'MMM d')} - {format(new Date(contract.valid_to), 'MMM d, yyyy')}
                    </div>
                  </CardDescription>
                </div>
                <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                  {contract.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contract Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-lg font-semibold">
                    {contract._count_allocations || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Allocations</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-lg font-semibold">
                    £{contract.total_value ? Math.round(contract.total_value / 1000).toLocaleString() + 'k' : '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Value</div>
                </div>
                
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-lg font-semibold">
                    {Math.ceil((new Date(contract.valid_to).getTime() - new Date(contract.valid_from).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-xs text-muted-foreground">Days</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Contract
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/contracts/${contract.id}?tab=allocations`)}
                >
                  <Package className="h-3 w-3 mr-1" />
                  Allocations
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/contracts/${contract.id}?tab=rates`)}
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Rates
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
