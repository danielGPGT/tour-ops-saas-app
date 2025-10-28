'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  FileText, 
  Calendar, 
  DollarSign,
  Users,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityWidgetProps {
  className?: string
}

interface ActivityItem {
  id: string
  action: 'created' | 'updated' | 'deleted' | 'linked' | 'unlinked' | 'sold' | 'released'
  resource_type: 'product' | 'contract' | 'allocation' | 'event' | 'booking' | 'rate'
  resource_id: string
  resource_name: string
  details?: string
  user_id?: string
  user_name?: string
  user_avatar?: string
  created_at: string
  metadata?: any
}

export function RecentActivityWidget({ className }: RecentActivityWidgetProps) {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  const { data: activities = [], isLoading, error } = useQuery({
    queryKey: ['recent-activity', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return []
      
      const response = await fetch(`/api/dashboard/activity?organization_id=${profile.organization_id}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch activity')
      
      return response.json() as ActivityItem[]
    },
    enabled: !!profile?.organization_id && !authLoading,
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    retry: 1,
    staleTime: 1 * 60 * 1000 // Consider data stale after 1 minute
  })

  if (authLoading || isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-destructive">
            <p>Error loading activity: {error.message}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Auth: {authLoading ? 'Loading...' : profile?.organization_id ? 'OK' : 'No org ID'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!activities.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions and changes</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/activity')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-2">No recent activity</p>
            <p className="text-xs text-muted-foreground">
              Activity will appear here as you use the system
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions and changes</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/activity')}
          >
            View All <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 8).map(activity => (
            <ActivityItemComponent 
              key={activity.id} 
              activity={activity}
              onClick={() => handleActivityClick(activity, router)}
            />
          ))}
          
          {activities.length > 8 && (
            <Button 
              variant="ghost" 
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/activity')}
            >
              View all activity
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ActivityItemComponentProps {
  activity: ActivityItem
  onClick: () => void
}

function ActivityItemComponent({ activity, onClick }: ActivityItemComponentProps) {
  const getActivityIcon = () => {
    const iconClass = "h-4 w-4"
    
    switch (activity.resource_type) {
      case 'product':
        return <Package className={iconClass} />
      case 'contract':
        return <FileText className={iconClass} />
      case 'allocation':
        return <Package className={iconClass} />
      case 'event':
        return <Calendar className={iconClass} />
      case 'booking':
        return <Users className={iconClass} />
      case 'rate':
        return <DollarSign className={iconClass} />
      default:
        return <Activity className={iconClass} />
    }
  }

  const getActionIcon = () => {
    const iconClass = "h-3 w-3"
    
    switch (activity.action) {
      case 'created':
        return <Plus className={`${iconClass} text-green-600`} />
      case 'updated':
        return <Edit className={`${iconClass} text-blue-600`} />
      case 'deleted':
        return <Trash2 className={`${iconClass} text-destructive`} />
      default:
        return <Activity className={`${iconClass} text-muted-foreground`} />
    }
  }

  const getActionText = () => {
    const resourceType = activity.resource_type
    const resourceName = activity.resource_name
    
    switch (activity.action) {
      case 'created':
        return `Created ${resourceType} "${resourceName}"`
      case 'updated':
        return `Updated ${resourceType} "${resourceName}"`
      case 'deleted':
        return `Deleted ${resourceType} "${resourceName}"`
      case 'linked':
        return `Linked ${resourceName} ${activity.details || ''}`
      case 'unlinked':
        return `Unlinked ${resourceName} ${activity.details || ''}`
      case 'sold':
        return `Sold ${activity.metadata?.quantity || ''} units from "${resourceName}"`
      case 'released':
        return `Released allocation "${resourceName}"`
      default:
        return `${activity.action} ${resourceType} "${resourceName}"`
    }
  }

  return (
    <div 
      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="relative">
        <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
          {getActivityIcon()}
        </div>
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 bg-background border rounded-full">
          {getActionIcon()}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {getActionText()}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {activity.user_name && (
            <div className="flex items-center gap-1">
              <Avatar className="w-4 h-4">
                <AvatarImage src={activity.user_avatar} />
                <AvatarFallback className="text-xs">
                  {activity.user_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>{activity.user_name}</span>
            </div>
          )}
          <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
        </div>
      </div>
      
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}

function handleActivityClick(activity: ActivityItem, router: any) {
  // Navigate to the relevant resource based on type
  switch (activity.resource_type) {
    case 'product':
      router.push(`/products/${activity.resource_id}`)
      break
    case 'contract':
      router.push(`/contracts/${activity.resource_id}`)
      break
    case 'allocation':
      // Navigate to the contract with the allocation highlighted
      router.push(`/contracts/${activity.metadata?.contract_id || ''}?tab=allocations&highlight=${activity.resource_id}`)
      break
    case 'event':
      router.push(`/events/${activity.resource_id}`)
      break
    case 'booking':
      router.push(`/bookings/${activity.resource_id}`)
      break
    case 'rate':
      router.push(`/rates/${activity.resource_id}`)
      break
    default:
      // Fallback to a general activity page
      console.log('Navigate to activity details:', activity.id)
  }
}
