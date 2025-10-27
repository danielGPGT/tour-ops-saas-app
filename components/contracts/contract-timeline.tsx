'use client'

import React from 'react'
import { format, isAfter, isBefore, isWithinInterval } from 'date-fns'
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { Contract } from '@/lib/types/contract'

interface ContractTimelineProps {
  contract: Contract
  className?: string
}

export function ContractTimeline({ contract, className }: ContractTimelineProps) {
  const now = new Date()
  const validFrom = new Date(contract.valid_from)
  const validTo = new Date(contract.valid_to)
  const totalDays = Math.ceil((validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))
  const daysPassed = Math.ceil((now.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
  
  const getStatusInfo = () => {
    if (contract.status === 'cancelled') {
      return {
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        text: 'Cancelled',
        description: 'This contract has been cancelled'
      }
    }
    
    if (contract.status === 'expired') {
      return {
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        text: 'Expired',
        description: 'This contract has expired'
      }
    }
    
    if (contract.status === 'draft') {
      return {
        icon: AlertCircle,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        text: 'Draft',
        description: 'This contract is in draft status'
      }
    }
    
    if (isBefore(now, validFrom)) {
      return {
        icon: Clock,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: 'Not Started',
        description: 'This contract has not yet started'
      }
    }
    
    if (isAfter(now, validTo)) {
      return {
        icon: XCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        text: 'Expired',
        description: 'This contract has expired'
      }
    }
    
    if (isWithinInterval(now, { start: validFrom, end: validTo })) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        text: 'Active',
        description: 'This contract is currently active'
      }
    }
    
    return {
      icon: AlertCircle,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      text: 'Unknown',
      description: 'Status unknown'
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Contract Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            statusInfo.bgColor
          )}>
            <StatusIcon className={cn('h-4 w-4', statusInfo.color)} />
          </div>
          <div>
            <div className="font-medium">{statusInfo.text}</div>
            <div className="text-sm text-muted-foreground">
              {statusInfo.description}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {contract.status === 'active' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Contract Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{daysPassed} days passed</span>
              <span>{daysRemaining} days remaining</span>
            </div>
          </div>
        )}

        {/* Timeline Dates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-sm font-medium">Start Date</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(validFrom, 'MMM dd, yyyy')}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-sm font-medium">End Date</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(validTo, 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        {/* Contract Duration */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalDays}</div>
              <div className="text-xs text-muted-foreground">Total Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {contract.status === 'active' ? daysRemaining : 0}
              </div>
              <div className="text-xs text-muted-foreground">Days Remaining</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {contract.status === 'active' && daysRemaining <= 30 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div className="text-sm text-amber-800">
                <strong>Contract expires soon!</strong> Consider renewing or extending this contract.
              </div>
            </div>
          </div>
        )}

        {contract.status === 'draft' && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <div className="text-sm text-blue-800">
                <strong>Draft contract</strong> This contract needs to be activated to become effective.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Contract Status Timeline for multiple contracts
export function ContractStatusTimeline({ contracts }: { contracts: Contract[] }) {
  const now = new Date()
  
  const getContractStatus = (contract: Contract) => {
    const validFrom = new Date(contract.valid_from)
    const validTo = new Date(contract.valid_to)
    
    if (contract.status === 'cancelled' || contract.status === 'expired') {
      return { status: contract.status, color: 'text-destructive' }
    }
    
    if (contract.status === 'draft') {
      return { status: 'draft', color: 'text-warning' }
    }
    
    if (isBefore(now, validFrom)) {
      return { status: 'not_started', color: 'text-blue-600' }
    }
    
    if (isAfter(now, validTo)) {
      return { status: 'expired', color: 'text-destructive' }
    }
    
    if (isWithinInterval(now, { start: validFrom, end: validTo })) {
      return { status: 'active', color: 'text-green-600' }
    }
    
    return { status: 'unknown', color: 'text-muted-foreground' }
  }

  const statusCounts = contracts.reduce((acc, contract) => {
    const { status } = getContractStatus(contract)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-muted-foreground capitalize">
                {status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
