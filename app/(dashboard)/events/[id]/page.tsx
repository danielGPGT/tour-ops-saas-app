import { Suspense } from 'react'
import { EventDetailsPageClient } from '@/components/events/EventDetailsPageClient'
import { getServerSessionOrRedirect } from '@/lib/auth/server-session'

interface EventDetailsPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: EventDetailsPageProps) {
  return {
    title: `Event Details | Tour Operations`,
    description: `Details for event ${params.id}`
  }
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { organizationId } = await getServerSessionOrRedirect()

  return (
    <div className="flex flex-col space-y-6">
      <Suspense fallback={<EventDetailsPageSkeleton />}>
        <EventDetailsPageClient 
          eventId={params.id}
          organizationId={organizationId}
        />
      </Suspense>
    </div>
  )
}

function EventDetailsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-8 w-96 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
      </div>

      {/* Tabs */}
      <div className="h-10 w-full bg-muted rounded animate-pulse" />

      {/* Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
