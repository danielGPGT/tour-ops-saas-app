import { Suspense } from 'react'
import { GlobalAllocationsPageClient } from '@/components/allocations/GlobalAllocationsPageClient'
import { getServerSessionOrRedirect } from '@/lib/auth/server-session'

export const metadata = {
  title: 'All Allocations | Tour Operations',
  description: 'View and manage all allocations across contracts'
}

export default async function GlobalAllocationsPage() {
  const { organizationId } = await getServerSessionOrRedirect()

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Allocations</h1>
          <p className="text-muted-foreground">
            View and manage inventory allocations across all contracts
          </p>
        </div>
      </div>

      <Suspense fallback={<GlobalAllocationsPageSkeleton />}>
        <GlobalAllocationsPageClient organizationId={organizationId} />
      </Suspense>
    </div>
  )
}

function GlobalAllocationsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Release Warnings */}
      <div className="h-32 bg-muted rounded-lg animate-pulse" />
      
      {/* Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}
