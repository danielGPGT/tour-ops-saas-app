import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as productOptionQueries from '@/lib/queries/product-options'
import type { ProductOption } from '@/lib/types/product-option'
import { toast } from 'sonner'

export function useProductOptions(productId: string) {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: () => productOptionQueries.getProductOptions(productId),
    enabled: !!productId
  })
}

export function useProductOption(id: string) {
  return useQuery({
    queryKey: ['product-options', id],
    queryFn: () => productOptionQueries.getProductOption(id),
    enabled: !!id
  })
}

export function useCreateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ProductOption>) => 
      productOptionQueries.createProductOption(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      toast.success('Option created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create option')
    }
  })
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductOption> }) =>
      productOptionQueries.updateProductOption(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.id] 
      })
      toast.success('Option updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update option')
    }
  })
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      productOptionQueries.deleteProductOption(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', variables.productId] 
      })
      toast.success('Option deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete option')
    }
  })
}

export function useReorderProductOptions() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productId, optionIds }: { productId: string; optionIds: string[] }) =>
      productOptionQueries.reorderProductOptions(productId, optionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', variables.productId] 
      })
      toast.success('Options reordered')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder options')
    }
  })
}

export function useDuplicateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, productId }: { id: string; productId: string }) =>
      productOptionQueries.duplicateProductOption(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['product-options', data.product_id] 
      })
      toast.success('Option duplicated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to duplicate option')
    }
  })
}
