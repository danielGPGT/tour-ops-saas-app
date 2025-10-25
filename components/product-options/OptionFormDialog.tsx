'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AccommodationOptionForm } from './AccommodationOptionForm'
import { EventOptionForm } from './EventOptionForm'
import { TransferOptionForm } from './TransferOptionForm'
import { ActivityOptionForm } from './ActivityOptionForm'
import { ExtraOptionForm } from './ExtraOptionForm'
import type { ProductOption } from '@/lib/types/product-option'

interface OptionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  productType: 'accommodation' | 'event' | 'transfer' | 'activity' | 'extra'
  option?: ProductOption | null
}

export function OptionFormDialog({
  open,
  onOpenChange,
  productId,
  productType,
  option
}: OptionFormDialogProps) {
  const renderForm = () => {
    switch (productType) {
      case 'accommodation':
        return (
          <AccommodationOptionForm
            open={open}
            onOpenChange={onOpenChange}
            productId={productId}
            option={option}
          />
        )
      
      case 'event':
        return (
          <EventOptionForm
            open={open}
            onOpenChange={onOpenChange}
            productId={productId}
            option={option}
          />
        )
      
      case 'transfer':
        return (
          <TransferOptionForm
            open={open}
            onOpenChange={onOpenChange}
            productId={productId}
            option={option}
          />
        )
      
      case 'activity':
        return (
          <ActivityOptionForm
            open={open}
            onOpenChange={onOpenChange}
            productId={productId}
            option={option}
          />
        )
      
      case 'extra':
        return (
          <ExtraOptionForm
            open={open}
            onOpenChange={onOpenChange}
            productId={productId}
            option={option}
          />
        )
      
      default:
        return (
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unsupported Product Type</DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Product type "{productType}" is not supported for options.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        )
    }
  }

  return renderForm()
}
