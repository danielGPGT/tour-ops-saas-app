import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as availabilityQueries from '@/lib/queries/availability'
import type { Availability } from '@/lib/types/availability'
import { toast } from 'sonner'

export function useAvailability(
  inventoryId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['availability', inventoryId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAvailability(inventoryId, dateFrom, dateTo),
    enabled: !!inventoryId && !!dateFrom && !!dateTo
  })
}

export function useAllocationAvailability(
  allocationId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['allocation-availability', allocationId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAllocationAvailability(allocationId, dateFrom, dateTo),
    enabled: !!allocationId && !!dateFrom && !!dateTo
  })
}

export function useAvailabilityCalendar(
  allocationId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['availability-calendar', allocationId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAvailabilityCalendar(allocationId, dateFrom, dateTo),
    enabled: !!allocationId && !!dateFrom && !!dateTo
  })
}

export function useGenerateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (params: {
      inventoryId: string
      dateFrom: string
      dateTo: string
      totalAvailable: number
    }) => availabilityQueries.generateAvailability(
      params.inventoryId,
      params.dateFrom,
      params.dateTo,
      params.totalAvailable
    ),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability', variables.inventoryId] })
      queryClient.invalidateQueries({ queryKey: ['allocation-availability'] })
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] })
      toast.success('Availability generated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate availability')
    }
  })
}

export function useUpdateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Availability> }) =>
      availabilityQueries.updateAvailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-availability'] })
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] })
      toast.success('Availability updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability')
    }
  })
}

export function useBulkUpdateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ ids, data }: { ids: string[]; data: Partial<Availability> }) =>
      availabilityQueries.bulkUpdateAvailability(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-availability'] })
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-stats'] })
      toast.success('Availability updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update availability')
    }
  })
}

export function useAvailabilityStats(
  allocationId: string,
  dateFrom: string,
  dateTo: string
) {
  return useQuery({
    queryKey: ['availability-stats', allocationId, dateFrom, dateTo],
    queryFn: () => availabilityQueries.getAvailabilityStats(allocationId, dateFrom, dateTo),
    enabled: !!allocationId && !!dateFrom && !!dateTo
  })
}

export function useCheckAvailability() {
  return useMutation({
    mutationFn: (params: {
      inventoryId: string
      dateFrom: string
      dateTo: string
      quantity: number
    }) => availabilityQueries.checkAvailability(
      params.inventoryId,
      params.dateFrom,
      params.dateTo,
      params.quantity
    ),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check availability')
    }
  })
}
