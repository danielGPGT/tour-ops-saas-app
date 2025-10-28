import { Suspense } from 'react'
import { EventsPageClient } from '@/components/events/EventsPageClient'
// import { getServerSessionOrRedirect } from '@/lib/auth/server-session'

export const metadata = {
  title: 'Events | Tour Operations',
  description: 'Manage your events and link them to products'
}

export default async function EventsPage() {
  // TEMPORARY: Use hardcoded organization ID from seed data to fix loading hang
  const organizationId = '20000000-0000-0000-0000-000000000001' // Monaco GP Experiences Ltd
  // const { organizationId } = await getServerSessionOrRedirect()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Manage events and link them to your products and contracts
          </p>
        </div>
      </div>

      <Suspense fallback={<EventsPageSkeleton />}>
        <EventsPageClient organizationId={organizationId} />
      </Suspense>
    </div>
  )
}

function EventsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="ml-auto h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
