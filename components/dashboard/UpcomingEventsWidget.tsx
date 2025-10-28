'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  MapPin, 
  Package, 
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react'
import { useUpcomingEvents } from '@/lib/hooks/useEvents'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { cn } from '@/lib/utils'

interface UpcomingEventsWidgetProps {
  className?: string
}

export function UpcomingEventsWidget({ className }: UpcomingEventsWidgetProps) {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const { data: events = [], isLoading, error } = useUpcomingEvents(
    profile?.organization_id || '', 
    6 // Show up to 6 events
  )

  if (authLoading || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-destructive">
            <p>Error loading events: {error.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Auth: {authLoading ? 'Loading...' : profile?.organization_id ? 'OK' : 'No org ID'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!events.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>Next 3 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => router.push('/events')}
            >
              Create Event
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Next 3 months ({events.length} events)</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/events')}
          >
            View All <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.slice(0, 5).map(event => (
            <EventItem 
              key={event.id} 
              event={event} 
              onClick={() => router.push(`/events/${event.id}`)}
            />
          ))}
          
          {events.length > 5 && (
            <Button 
              variant="ghost" 
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/events')}
            >
              + {events.length - 5} more events
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface EventItemProps {
  event: any
  onClick: () => void
}

function EventItem({ event, onClick }: EventItemProps) {
  const now = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  
  const isUpcoming = isAfter(startDate, now)
  const isActive = !isBefore(now, startDate) && !isAfter(now, endDate)
  const daysUntilStart = isUpcoming ? differenceInDays(startDate, now) : 0
  const duration = differenceInDays(endDate, startDate) + 1

  const getStatus = () => {
    if (isActive) {
      return { 
        label: 'Active Now', 
        variant: 'default' as const, 
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200'
      }
    }
    if (daysUntilStart <= 7) {
      return { 
        label: daysUntilStart === 0 ? 'Today' : daysUntilStart === 1 ? 'Tomorrow' : `${daysUntilStart} days`,
        variant: 'secondary' as const, 
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200'
      }
    }
    if (daysUntilStart <= 30) {
      return { 
        label: `${daysUntilStart} days`, 
        variant: 'outline' as const, 
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200'
      }
    }
    return { 
      label: format(startDate, 'MMM d'), 
      variant: 'outline' as const, 
      color: 'text-muted-foreground',
      bg: 'bg-muted/30'
    }
  }

  const status = getStatus()

  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all hover:shadow-sm",
        status.bg
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{event.name}</h4>
          <Badge variant={status.variant} className="text-xs flex-shrink-0">
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {format(startDate, 'MMM d')}
              {duration > 1 && ` - ${format(endDate, 'MMM d')}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{event.location}</span>
          </div>
          {event._count_products > 0 && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{event._count_products} products</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 ml-2">
        {isActive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
