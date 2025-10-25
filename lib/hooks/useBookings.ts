import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as bookingQueries from '@/lib/queries/bookings'
import type { Booking, BookingFormData, BookingStats } from '@/lib/types/booking'

export function useBookings() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['bookings', profile?.organization?.id],
    queryFn: () => bookingQueries.getBookings(profile?.organization?.id || ''),
    enabled: !!profile?.organization?.id
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingQueries.getBooking(id),
    enabled: !!id
  })
}

export function useBookingStats() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['booking-stats', profile?.organization?.id],
    queryFn: () => bookingQueries.getBookingStats(profile?.organization?.id || ''),
    enabled: !!profile?.organization?.id
  })
}

export function useCreateBooking() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: BookingFormData) => 
      bookingQueries.createBooking({
        ...data,
        organization_id: profile?.organization?.id || ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] })
    }
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BookingFormData> }) =>
      bookingQueries.updateBooking(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['bookings', id] })
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] })
    }
  })
}

export function useDeleteBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => bookingQueries.deleteBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] })
    }
  })
}

export function useConfirmBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      bookingQueries.updateBooking(id, { booking_status: 'confirmed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] })
    }
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => 
      bookingQueries.updateBooking(id, { booking_status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] })
    }
  })
}
