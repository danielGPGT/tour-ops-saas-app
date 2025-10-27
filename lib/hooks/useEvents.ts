import { useQuery } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as eventQueries from '@/lib/queries/events'

// Get all events for organization
export function useEvents() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['events', profile?.organization_id],
    queryFn: () => eventQueries.getEvents(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}

// Get a single event by ID
export function useEvent(id: string) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventQueries.getEvent(id),
    enabled: !!id
  })
}
