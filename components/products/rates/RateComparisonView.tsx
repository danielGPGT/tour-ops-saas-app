'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp } from 'lucide-react'

interface RateComparisonViewProps {
  comparison?: any[]
  isLoading: boolean
}

export function RateComparisonView({ comparison, isLoading }: RateComparisonViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate Comparison Analysis</CardTitle>
        <CardDescription>
          Compare selling rates with supplier costs and analyze profit margins
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-xl font-medium">Rate Comparison Coming Soon</h3>
          <p className="text-sm max-w-md mx-auto">
            Visual comparison charts showing selling vs supplier rates, margin analysis, 
            and profitability insights across different time periods
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
