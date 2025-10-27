import { createClient } from '@/lib/supabase/client'

export interface Event {
  id: string
  organization_id: string | null
  event_name: string
  event_code: string | null
  event_type: string | null
  venue_name: string | null
  city: string | null
  country: string | null
  event_date_from: string
  event_date_to: string
  event_status: string
  description: string | null
  event_image_url: string | null
  created_at: string
  updated_at: string
}

// Get all events for an organization
export async function getEvents(organizationId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('event_date_from', { ascending: true })
  
  if (error) throw error
  return data as Event[]
}

// Get a single event by ID
export async function getEvent(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as Event
}
