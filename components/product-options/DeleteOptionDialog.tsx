'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useDeleteProductOption } from '@/lib/hooks/useProductOptions'
import type { ProductOption } from '@/lib/types/product-option'

interface DeleteOptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  option: ProductOption | null
}

export function DeleteOptionDialog({
  open,
  onOpenChange,
  option
}: DeleteOptionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteOption = useDeleteProductOption()
  
  const handleDelete = async () => {
    if (!option) return
    
    setIsDeleting(true)
    try {
      await deleteOption.mutateAsync({
        id: option.id,
        productId: option.product_id
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting option:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  if (!option) return null
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Option</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>"{option.option_name}"</strong>?
            <br /><br />
            This action cannot be undone. Any rates or allocations using this option will need to be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
