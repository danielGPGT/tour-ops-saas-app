'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon | React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'warning' | 'success' | 'destructive'
  className?: string
}

export function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  trend = 'neutral',
  variant = 'default',
  className
}: SummaryCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-primary'
      case 'down': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getVariantStyles = () => {
    // No colored borders - use standard card styling
    return ''
  }

  return (
    <Card className={cn('transition-all hover:shadow-md', getVariantStyles(), className)}>
      <CardContent className="">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {Icon && (
            <div className={cn('p-2 rounded-full', {
              'bg-primary/10 text-primary': trend === 'up',
              'bg-destructive/10 text-destructive': trend === 'down',
              'bg-muted text-muted-foreground': trend === 'neutral'
            })}>
              {typeof Icon === 'function' ? <Icon className="h-4 w-4" /> : Icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
