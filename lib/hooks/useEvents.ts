'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as eventQueries from '@/lib/queries/events'
import type { EventFilters, EventSort } from '@/lib/queries/events'

// ===== QUERY HOOKS =====

export function useEvents(
  organizationId: string,
  filters?: EventFilters,
  sort?: EventSort,
  page?: number,
  pageSize?: number
) {
  return useQuery({
    queryKey: ['events', organizationId, filters, sort, page, pageSize],
    queryFn: () => eventQueries.getEvents(organizationId, filters, sort, page, pageSize),
    enabled: !!organizationId && organizationId !== '',
    retry: 1,
    staleTime: 2 * 60 * 1000 // Consider data stale after 2 minutes
  })
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventQueries.getEvent(id),
    enabled: !!id
  })
}

export function useEventProducts(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'products'],
    queryFn: () => eventQueries.getEventProducts(eventId),
    enabled: !!eventId
  })
}

export function useProductEvents(productId: string) {
  return useQuery({
    queryKey: ['products', productId, 'events'],
    queryFn: () => eventQueries.getProductEvents(productId),
    enabled: !!productId
  })
}

export function useEventAnalytics(eventId: string) {
  return useQuery({
    queryKey: ['events', eventId, 'analytics'],
    queryFn: () => eventQueries.getEventAnalytics(eventId),
    enabled: !!eventId
  })
}

export function useUpcomingEvents(organizationId: string, limit?: number) {
  return useQuery({
    queryKey: ['events', 'upcoming', organizationId, limit],
    queryFn: () => eventQueries.getUpcomingEvents(organizationId, limit),
    enabled: !!organizationId && organizationId !== '',
    retry: 1,
    staleTime: 5 * 60 * 1000 // Consider data stale after 5 minutes
  })
}

// ===== MUTATION HOOKS =====

export function useCreateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof eventQueries.createEvent>[0]) => 
      eventQueries.createEvent(data),
    onSuccess: (newEvent) => {
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] })
      
      // Add the new event to the cache
      queryClient.setQueryData(['events', newEvent.id], newEvent)
    }
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof eventQueries.updateEvent>[1] }) =>
      eventQueries.updateEvent(id, data),
    onSuccess: (updatedEvent, { id }) => {
      // Update the event in cache
      queryClient.setQueryData(['events', id], updatedEvent)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => eventQueries.deleteEvent(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['events', id] })
      
      // Invalidate events list
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })
}

// ===== EVENT-PRODUCT RELATIONSHIP HOOKS =====

export function useLinkProductToEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ eventId, productId }: { eventId: string; productId: string }) =>
      eventQueries.linkProductToEvent(eventId, productId),
    onSuccess: (_, { eventId, productId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'analytics'] })
    }
  })
}

export function useUnlinkProductFromEvent() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ eventId, productId }: { eventId: string; productId: string }) =>
      eventQueries.unlinkProductFromEvent(eventId, productId),
    onSuccess: (_, { eventId, productId }) => {
      // Invalidate related queries  
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products', productId, 'events'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'analytics'] })
    }
  })
}

// ===== BULK OPERATIONS =====

export function useBulkLinkProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ eventId, productIds }: { eventId: string; productIds: string[] }) => {
      const results = await Promise.all(
        productIds.map(productId => 
          eventQueries.linkProductToEvent(eventId, productId)
        )
      )
      return results
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'products'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'analytics'] })
    }
  })
}

export function useBulkUnlinkProducts() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ eventId, productIds }: { eventId: string; productIds: string[] }) => {
      const results = await Promise.all(
        productIds.map(productId => 
          eventQueries.unlinkProductFromEvent(eventId, productId)
        )
      )
      return results
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'products'] })
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'analytics'] })
    }
  })
}

// ===== HELPER HOOKS =====

export function useEventStatus(eventId: string) {
  const { data: event } = useQuery({
    queryKey: ['events', eventId],
    queryFn: () => eventQueries.getEvent(eventId),
    enabled: !!eventId
  })

  if (!event) return 'unknown'

  const now = new Date()
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)

  if (event.status === 'cancelled') return 'cancelled'
  if (now < startDate) return 'upcoming'
  if (now >= startDate && now <= endDate) return 'active'
  if (now > endDate) return 'completed'
  
  return event.status || 'unknown'
}

export function useEventMetrics(eventId: string) {
  const { data: analytics } = useEventAnalytics(eventId)
  
  if (!analytics) return null

  const { summary } = analytics
  
  return {
    totalProducts: summary.total_products,
    totalAllocations: summary.total_allocations,
    totalUnits: summary.total_units,
    totalSold: summary.total_sold,
    totalAvailable: summary.total_available,
    utilizationRate: summary.utilization_rate,
    totalCost: summary.total_cost,
    currency: summary.primary_currency,
    
    // Calculated metrics
    averageCostPerUnit: summary.total_units > 0 ? summary.total_cost / summary.total_units : 0,
    inventoryValue: summary.total_available * (summary.total_units > 0 ? summary.total_cost / summary.total_units : 0),
    salesValue: summary.total_sold * (summary.total_units > 0 ? summary.total_cost / summary.total_units : 0)
  }
}