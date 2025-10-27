'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { 
  Building, 
  Calendar, 
  DollarSign, 
  FileText, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ActionButtons } from '@/components/common/ActionButtons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { Contract } from '@/lib/types/contract'

interface ContractCardProps {
  contract: Contract
  onDelete?: (id: string) => void
  onDuplicate?: (id: string) => void
  onExport?: (id: string) => void
  onShare?: (id: string) => void
  variant?: 'default' | 'compact' | 'detailed'
  className?: string
}

export function ContractCard({ 
  contract, 
  onDelete,
  onDuplicate,
  onExport,
  onShare,
  variant = 'default',
  className 
}: ContractCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const getStatusInfo = () => {
    const now = new Date()
    const validFrom = new Date(contract.valid_from)
    const validTo = new Date(contract.valid_to)
    
    if (contract.status === 'cancelled') {
      return {
        icon: XCircle,
        color: 'destructive',
        text: 'Cancelled',
        description: 'This contract has been cancelled'
      }
    }
    
    if (contract.status === 'expired') {
      return {
        icon: XCircle,
        color: 'destructive',
        text: 'Expired',
        description: 'This contract has expired'
      }
    }
    
    if (contract.status === 'draft') {
      return {
        icon: AlertCircle,
        color: 'warning',
        text: 'Draft',
        description: 'This contract is in draft status'
      }
    }
    
    if (now < validFrom) {
      return {
        icon: Clock,
        color: 'blue',
        text: 'Not Started',
        description: 'This contract has not yet started'
      }
    }
    
    if (now > validTo) {
      return {
        icon: XCircle,
        color: 'destructive',
        text: 'Expired',
        description: 'This contract has expired'
      }
    }
    
    if (now >= validFrom && now <= validTo) {
      return {
        icon: CheckCircle,
        color: 'success',
        text: 'Active',
        description: 'This contract is currently active'
      }
    }
    
    return {
      icon: AlertCircle,
      color: 'secondary',
      text: 'Unknown',
      description: 'Status unknown'
    }
  }

  const getProgressInfo = () => {
    if (contract.status !== 'active') return null
    
    const now = new Date()
    const validFrom = new Date(contract.valid_from)
    const validTo = new Date(contract.valid_to)
    const totalDays = Math.ceil((validTo.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))
    const daysPassed = Math.ceil((now.getTime() - validFrom.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100)
    
    return {
      totalDays,
      daysPassed,
      daysRemaining,
      progressPercentage
    }
  }

  const statusInfo = getStatusInfo()
  const progressInfo = getProgressInfo()
  const StatusIcon = statusInfo.icon

  if (variant === 'compact') {
    return (
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium text-sm">{contract.contract_name}</div>
              <div className="text-xs text-muted-foreground">
                {contract.supplier?.name} • {contract.contract_number}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={statusInfo.color} size="sm">
                {statusInfo.text}
              </StatusBadge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contracts/${contract.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'detailed') {
    return (
      <>
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{contract.contract_name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {contract.contract_number}
                </div>
              </div>
              <StatusBadge status={statusInfo.color} size="sm">
                {statusInfo.text}
              </StatusBadge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Supplier Info */}
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">{contract.supplier?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {contract.supplier?.code}
                </div>
              </div>
            </div>

            {/* Valid Period */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                {format(new Date(contract.valid_from), 'MMM dd, yyyy')} - {format(new Date(contract.valid_to), 'MMM dd, yyyy')}
              </div>
            </div>

            {/* Progress Bar for Active Contracts */}
            {progressInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Contract Progress</span>
                  <span>{Math.round(progressInfo.progressPercentage)}%</span>
                </div>
                <Progress value={progressInfo.progressPercentage} className="h-2" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progressInfo.daysPassed} days passed</span>
                  <span>{progressInfo.daysRemaining} days remaining</span>
                </div>
              </div>
            )}

            {/* Currency & Commission */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono">
                {contract.currency}
              </Badge>
              {contract.commission_rate && (
                <div className="text-sm text-muted-foreground">
                  {contract.commission_rate}% commission
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/contracts/${contract.id}`)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/contracts/${contract.id}/edit`)}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDuplicate?.(contract.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.(contract.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare?.(contract.id)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete Contract"
          description={`Are you sure you want to delete "${contract.contract_name}"? This action cannot be undone and will permanently remove all associated data.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            onDelete?.(contract.id)
            setDeleteDialogOpen(false)
          }}
          variant="destructive"
        />
      </>
    )
  }

  // Default variant
  return (
    <>
      <Card className={cn('hover:shadow-md transition-shadow', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{contract.contract_name}</CardTitle>
              <div className="text-sm text-muted-foreground">
                {contract.contract_number}
              </div>
            </div>
            <StatusBadge status={statusInfo.color} size="sm">
              {statusInfo.text}
            </StatusBadge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Supplier Info */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">{contract.supplier?.name}</div>
              <div className="text-sm text-muted-foreground">
                {contract.supplier?.code}
              </div>
            </div>
          </div>

          {/* Valid Period */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {format(new Date(contract.valid_from), 'MMM dd, yyyy')} - {format(new Date(contract.valid_to), 'MMM dd, yyyy')}
            </div>
          </div>

          {/* Currency & Commission */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="font-mono">
              {contract.currency}
            </Badge>
            {contract.commission_rate && (
              <div className="text-sm text-muted-foreground">
                {contract.commission_rate}% commission
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/${contract.id}`)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/${contract.id}/edit`)}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDuplicate?.(contract.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.(contract.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onShare?.(contract.id)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Contract"
        description={`Are you sure you want to delete "${contract.contract_name}"? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          onDelete?.(contract.id)
          setDeleteDialogOpen(false)
        }}
        variant="destructive"
      />
    </>
  )
}
