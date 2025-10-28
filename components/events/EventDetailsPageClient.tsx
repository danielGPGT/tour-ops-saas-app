'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Package, 
  FileText, 
  TrendingUp, 
  Edit, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEvent, useEventProducts, useEventAnalytics } from '@/lib/hooks/useEvents'
import { EventFormDialog } from './EventFormDialog'
import { EventProductsManager } from './EventProductsManager'
import { EventContractsView } from './EventContractsView'
import { EventAnalyticsView } from './EventAnalyticsView'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EventDetailsPageClientProps {
  eventId: string
  organizationId: string
}

export function EventDetailsPageClient({ eventId, organizationId }: EventDetailsPageClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  const { data: event, isLoading, error } = useEvent(eventId)
  const { data: analytics } = useEventAnalytics(eventId)

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading event: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !event) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-96 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Calculate event status and timing
  const now = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  const isUpcoming = isAfter(startDate, now)
  const isActive = !isBefore(now, startDate) && !isAfter(now, endDate)
  const isCompleted = isAfter(now, endDate)
  
  const daysUntilStart = isUpcoming ? differenceInDays(startDate, now) : 0
  const duration = differenceInDays(endDate, startDate) + 1

  // Determine status
  let status: 'upcoming' | 'active' | 'completed' | 'cancelled' = 'upcoming'
  if (event.status === 'cancelled') status = 'cancelled'
  else if (isCompleted) status = 'completed'
  else if (isActive) status = 'active'
  else if (isUpcoming) status = 'upcoming'

  const statusConfig = {
    upcoming: {
      variant: 'secondary' as const,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: Clock,
      label: daysUntilStart <= 30 ? `${daysUntilStart} days` : 'Upcoming'
    },
    active: {
      variant: 'default' as const,
      color: 'text-green-600', 
      bg: 'bg-green-50',
      icon: CheckCircle,
      label: 'Active Now'
    },
    completed: {
      variant: 'outline' as const,
      color: 'text-muted-foreground',
      bg: 'bg-gray-50',
      icon: CheckCircle,
      label: 'Completed'
    },
    cancelled: {
      variant: 'destructive' as const,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      icon: AlertTriangle,
      label: 'Cancelled'
    }
  }

  const config = statusConfig[status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <Link href="/events">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              <Badge variant={config.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
              {event.code && (
                <div className="text-sm">
                  Code: <span className="font-mono">{event.code}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.summary.total_products || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Linked products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.summary.total_units || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.summary.utilization_rate 
                ? `${Math.round(analytics.summary.utilization_rate)}%`
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Sold vs total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.summary.primary_currency || 'GBP'} {analytics?.summary.total_cost 
                ? Math.round(analytics.summary.total_cost / 1000).toLocaleString() + 'k'
                : '0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Total cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Alert */}
      {isUpcoming && daysUntilStart <= 7 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Event Starting Soon</AlertTitle>
          <AlertDescription className="text-blue-800">
            This event starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}. 
            Make sure all preparations are complete.
          </AlertDescription>
        </Alert>
      )}

      {isActive && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Event Currently Active</AlertTitle>
          <AlertDescription className="text-green-800">
            This event is currently running. Monitor bookings and availability closely.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-muted-foreground">Event Type</div>
                    <div>{event.event_type}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Duration</div>
                    <div>{duration} day{duration !== 1 ? 's' : ''}</div>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Status</div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Code</div>
                    <div className="font-mono">{event.code}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="font-medium text-muted-foreground">Location</div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {event.location}
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {event.venue}
                    </div>
                  )}
                </div>

                {event.description && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="font-medium text-muted-foreground">Description</div>
                      <div className="text-sm">{event.description}</div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Event Start</div>
                        <div className="text-sm text-muted-foreground">
                          {format(startDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    {isUpcoming && (
                      <Badge variant="secondary">
                        {daysUntilStart} days
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Event End</div>
                        <div className="text-sm text-muted-foreground">
                          {format(endDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Type Breakdown */}
          {analytics?.product_type_breakdown && Object.keys(analytics.product_type_breakdown).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Product Type Breakdown</CardTitle>
                <CardDescription>
                  Distribution of products by type for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analytics.product_type_breakdown).map(([type, count]) => (
                    <div key={type} className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold">{count as number}</div>
                      <div className="text-sm text-muted-foreground capitalize">{type}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="products">
          <EventProductsManager eventId={eventId} organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="contracts">
          <EventContractsView eventId={eventId} />
        </TabsContent>

        <TabsContent value="analytics">
          <EventAnalyticsView eventId={eventId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {isEditing && (
        <EventFormDialog
          organizationId={organizationId}
          existingEvent={event}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            // Data will refresh automatically via React Query
          }}
        />
      )}
    </div>
  )
}
