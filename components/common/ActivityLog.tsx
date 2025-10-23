"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  User, 
  Edit, 
  Plus, 
  Trash2, 
  Eye, 
  Tag, 
  Image as ImageIcon,
  Settings,
  ArrowRight
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'

export interface ActivityItem {
  id: string
  type: 'created' | 'updated' | 'deleted' | 'viewed' | 'tagged' | 'image_added' | 'image_removed' | 'status_changed'
  title: string
  description?: string
  timestamp: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

interface ActivityLogProps {
  activities: ActivityItem[]
  className?: string
  maxHeight?: string
  showUserAvatars?: boolean
  showTimestamps?: boolean
  groupByDate?: boolean
}

const activityIcons = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  viewed: Eye,
  tagged: Tag,
  image_added: ImageIcon,
  image_removed: ImageIcon,
  status_changed: Settings
}

const activityColors = {
  created: 'bg-green-100 text-green-800',
  updated: 'bg-blue-100 text-blue-800',
  deleted: 'bg-red-100 text-red-800',
  viewed: 'bg-gray-100 text-gray-800',
  tagged: 'bg-purple-100 text-purple-800',
  image_added: 'bg-cyan-100 text-cyan-800',
  image_removed: 'bg-orange-100 text-orange-800',
  status_changed: 'bg-amber-100 text-amber-800'
}

export function ActivityLog({
  activities,
  className,
  maxHeight = '400px',
  showUserAvatars = true,
  showTimestamps = true,
  groupByDate = true
}: ActivityLogProps) {
  const getActivityIcon = (type: ActivityItem['type']) => {
    const IconComponent = activityIcons[type]
    return <IconComponent className="h-4 w-4" />
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    return activityColors[type]
  }

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: format(date, 'MMM dd, yyyy HH:mm')
    }
  }

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {}
    
    activities.forEach(activity => {
      const date = new Date(activity.timestamp)
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }

  const renderActivityItem = (activity: ActivityItem) => (
    <div key={activity.id} className="flex items-start gap-3 py-3">
      <div className="flex-shrink-0">
        {showUserAvatars ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
            <AvatarFallback className="text-xs">
              {activity.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            {getActivityIcon(activity.type)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge className={cn('text-xs', getActivityColor(activity.type))}>
            {activity.type.replace('_', ' ')}
          </Badge>
          <span className="text-sm font-medium">{activity.title}</span>
        </div>
        
        {activity.description && (
          <p className="text-sm text-muted-foreground mb-1">{activity.description}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{activity.user.name}</span>
          {showTimestamps && (
            <>
              <span>•</span>
              <span>{formatActivityTime(activity.timestamp).relative}</span>
            </>
          )}
        </div>

        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            {Object.entries(activity.metadata).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium">{key}:</span>
                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              Activity will appear here as changes are made to this item.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (groupByDate) {
    const groupedActivities = groupActivitiesByDate(activities)

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className={cn('w-full', `max-h-[${maxHeight}]`)}>
            <div className="space-y-6">
              {groupedActivities.map(([dateKey, dateActivities]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      {format(new Date(dateKey), 'EEEE, MMMM dd, yyyy')}
                    </h4>
                    <Separator className="flex-1" />
                  </div>
                  
                  <div className="space-y-1">
                    {dateActivities.map(renderActivityItem)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={cn('w-full', `max-h-[${maxHeight}]`)}>
          <div className="space-y-1">
            {activities.map(renderActivityItem)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// Mock data generator for development/testing
export function generateMockActivities(count: number = 10): ActivityItem[] {
  const types: ActivityItem['type'][] = ['created', 'updated', 'viewed', 'tagged', 'image_added', 'status_changed']
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com' }
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `activity-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    title: `Activity ${i + 1}`,
    description: `This is a description for activity ${i + 1}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 60 * Math.random() * 24).toISOString(),
    user: users[Math.floor(Math.random() * users.length)],
    metadata: Math.random() > 0.5 ? {
      field: 'name',
      oldValue: 'Old Value',
      newValue: 'New Value'
    } : undefined
  }))
}
