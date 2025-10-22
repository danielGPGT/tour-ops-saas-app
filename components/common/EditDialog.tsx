"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  X, 
  Save, 
  Trash2, 
  Edit, 
  Plus, 
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSave?: () => void
  onDelete?: () => void
  onCancel?: () => void
  saveLabel?: string
  deleteLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  isDeleting?: boolean
  variant?: 'default' | 'destructive' | 'warning'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showDelete?: boolean
  showSave?: boolean
  showCancel?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg', 
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

const variantClasses = {
  default: 'border-border',
  destructive: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50'
}

export function EditDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onDelete,
  onCancel,
  saveLabel = 'Save',
  deleteLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
  isDeleting = false,
  variant = 'default',
  size = 'lg',
  showDelete = false,
  showSave = true,
  showCancel = true,
  className
}: EditDialogProps) {
  const handleSave = () => {
    onSave?.()
  }

  const handleDelete = () => {
    onDelete?.()
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        showCloseButton={false}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6 py-4">
            {children}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            {showDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                className="gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {deleteLabel}
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isLoading || isDeleting}
              >
                {cancelLabel}
              </Button>
            )}
            
            {showSave && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isLoading || isDeleting}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {saveLabel}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Specialized dialog components for different use cases
export function PaymentScheduleDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Payment Schedule"
      description="Configure payment terms and due dates for this contract"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Schedule"
      size="md"
      className="border-blue-200"
    >
      {children}
    </EditDialog>
  )
}

export function CancellationPolicyDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cancellation Policy"
      description="Set cancellation terms and penalty structures"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Policy"
      size="md"
      className="border-amber-200"
    >
      {children}
    </EditDialog>
  )
}

export function DeadlineDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Contract Deadline"
      description="Set important deadlines and milestones for this contract"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Deadline"
      size="md"
      className="border-purple-200"
    >
      {children}
    </EditDialog>
  )
}

export function CommissionTierDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Commission Tier"
      description="Configure commission rates based on revenue thresholds"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Tier"
      size="md"
      className="border-green-200"
    >
      {children}
    </EditDialog>
  )
}

export function ContractAllocationDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Contract Allocation"
      description="Manage product allocations and inventory blocks for this contract"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Allocation"
      size="lg"
      className="border-blue-200"
    >
      {children}
    </EditDialog>
  )
}

export function SupplierRateDialog({
  open,
  onOpenChange,
  children,
  onSave,
  onDelete,
  onCancel,
  isLoading,
  isDeleting,
  showDelete = false
}: Omit<EditDialogProps, 'title' | 'description' | 'variant'>) {
  return (
    <EditDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Supplier Rate"
      description="Manage supplier rates and pricing for products in this contract"
      onSave={onSave}
      onDelete={onDelete}
      onCancel={onCancel}
      isLoading={isLoading}
      isDeleting={isDeleting}
      showDelete={showDelete}
      saveLabel="Save Rate"
      size="lg"
      className="border-purple-200"
    >
      {children}
    </EditDialog>
  )
}

// Dialog content components for better organization
export function DialogSection({ 
  title, 
  children, 
  icon, 
  className 
}: { 
  title: string
  children: React.ReactNode
  icon?: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon}
        {title}
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  )
}

export function DialogField({ 
  label, 
  value, 
  className 
}: { 
  label: string
  value: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

export function DialogBadge({ 
  children, 
  variant = "default" 
}: { 
  children: React.ReactNode
  variant?: "default" | "secondary" | "destructive" | "outline"
}) {
  return (
    <Badge variant={variant} className="text-xs">
      {children}
    </Badge>
  )
}
