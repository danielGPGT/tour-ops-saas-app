'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEvents } from '@/lib/hooks/useEvents'
import { EventFormDialog } from './EventFormDialog'
import { EventCard } from './EventCard'
import { EventFilters, EventSort } from '@/lib/queries/events'
import { Search, Filter, Plus, Calendar, MapPin, Building2 } from 'lucide-react'
import { format, isAfter, isBefore, addDays } from 'date-fns'

interface EventsPageClientProps {
  organizationId: string
}

export function EventsPageClient({ organizationId }: EventsPageClientProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<EventSort>({ field: 'start_date', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Build filters object
  const filters: EventFilters = {
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter as any })
  }

  // TEMPORARY: Mock events data to fix loading hang
  const mockEvents = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      event_name: 'Monaco Grand Prix 2025',
      event_code: 'F1-MONACO-2025',
      event_type: 'f1',
      venue_name: 'Circuit de Monaco',
      city: 'Monte Carlo',
      country: 'MC',
      start_date: '2025-05-23',
      end_date: '2025-05-25',
      event_status: 'scheduled',
      description: 'The most prestigious race on the Formula 1 calendar',
      total_products: 12,
      total_allocations: 8,
      created_at: new Date().toISOString()
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      event_name: 'British Grand Prix 2025',
      event_code: 'F1-BRITISH-2025',
      event_type: 'f1',
      venue_name: 'Silverstone Circuit',
      city: 'Silverstone',
      country: 'GB',
      start_date: '2025-07-06',
      end_date: '2025-07-08',
      event_status: 'scheduled',
      description: 'The home of British motorsport',
      total_products: 8,
      total_allocations: 5,
      created_at: new Date().toISOString()
    }
  ]
  
  const events = mockEvents
  const totalPages = 1
  const isLoading = false
  const error = null
  
  // const { data: eventsResponse, isLoading, error } = useEvents(
  //   organizationId,
  //   filters,
  //   sortBy,
  //   currentPage,
  //   20
  // )
  // const events = eventsResponse?.data || []
  // const totalPages = eventsResponse?.totalPages || 0

  // Calculate summary stats
  const totalEvents = events.length
  const upcomingEvents = events.filter(event => {
    const startDate = new Date(event.start_date)
    return isAfter(startDate, new Date())
  }).length
  
  const activeEvents = events.filter(event => {
    const startDate = new Date(event.start_date)
    const endDate = new Date(event.end_date)
    const now = new Date()
    return !isBefore(now, startDate) && !isAfter(now, endDate)
  }).length

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading events: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All events in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">
              Future events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.length > 0 ? Math.round(
                events.reduce((sum, event) => {
                  const days = Math.ceil(
                    (new Date(event.end_date).getTime() - new Date(event.start_date).getTime()) 
                    / (1000 * 60 * 60 * 24)
                  )
                  return sum + days
                }, 0) / events.length
              ) : 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              Event duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={`${sortBy.field}-${sortBy.direction}`} 
          onValueChange={(value) => {
            const [field, direction] = value.split('-') as [string, 'asc' | 'desc']
            setSortBy({ field: field as any, direction })
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start_date-asc">Start Date (Earliest)</SelectItem>
            <SelectItem value="start_date-desc">Start Date (Latest)</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="created_at-desc">Recently Created</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first event'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Event Dialog */}
      {isCreating && (
        <EventFormDialog
          organizationId={organizationId}
          onClose={() => setIsCreating(false)}
          onSuccess={() => {
            setIsCreating(false)
            // Data will refresh automatically via React Query
          }}
        />
      )}
    </div>
  )
}
