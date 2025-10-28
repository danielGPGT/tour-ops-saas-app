'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Calendar, 
  MapPin, 
  Building2, 
  Package, 
  FileText, 
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface EventCardProps {
  event: any
  className?: string
}

export function EventCard({ event, className }: EventCardProps) {
  const router = useRouter()

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
      bg: 'bg-blue-50 border-blue-200',
      label: isUpcoming && daysUntilStart <= 30 ? `${daysUntilStart} days` : 'Upcoming'
    },
    active: {
      variant: 'default' as const,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
      label: 'Active Now'
    },
    completed: {
      variant: 'outline' as const,
      color: 'text-muted-foreground',
      bg: 'bg-gray-50 border-gray-200',
      label: 'Completed'
    },
    cancelled: {
      variant: 'destructive' as const,
      color: 'text-destructive',
      bg: 'bg-destructive/10 border-destructive/20',
      label: 'Cancelled'
    }
  }

  const config = statusConfig[status]

  const handleViewDetails = () => {
    router.push(`/events/${event.id}`)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Open edit dialog or navigate to edit page
    console.log('Edit event:', event.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement duplicate functionality
    console.log('Duplicate event:', event.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement delete functionality
    console.log('Delete event:', event.id)
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]",
        config.bg,
        className
      )}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{event.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {event.code}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge variant={config.variant} className="text-xs">
              {config.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Event Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="text-xs text-muted-foreground ml-6">
            {duration} day{duration !== 1 ? 's' : ''} duration
            {isUpcoming && daysUntilStart <= 60 && (
              <span className={cn("ml-2 font-medium", config.color)}>
                • {daysUntilStart === 0 ? 'Starts today' :
                   daysUntilStart === 1 ? 'Starts tomorrow' :
                   `Starts in ${daysUntilStart} days`}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{event.location}</span>
        </div>

        {/* Venue (if different from location) */}
        {event.venue && event.venue !== event.location && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{event.venue}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {event._count_products || 0}
            </div>
            <div className="text-xs text-muted-foreground">Products</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {event._count_contracts || 0}
            </div>
            <div className="text-xs text-muted-foreground">Contracts</div>
          </div>
        </div>

        {/* Event Type */}
        {event.event_type && (
          <div className="pt-2">
            <Badge variant="outline" className="text-xs">
              {event.event_type}
            </Badge>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/events/${event.id}?tab=products`)
            }}
          >
            <Package className="h-3 w-3 mr-1" />
            Products
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/events/${event.id}?tab=contracts`)
            }}
          >
            <FileText className="h-3 w-3 mr-1" />
            Contracts
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
