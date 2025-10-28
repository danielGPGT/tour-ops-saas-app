import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as sellingRateQueries from '@/lib/queries/selling-rates'
import { useAuth } from './useAuth'

// Selling Rates hooks
export function useSellingRates(
  organizationId: string,
  filters?: {
    product_id?: string
    product_option_id?: string
    is_active?: boolean
  }
) {
  return useQuery({
    queryKey: ['selling-rates', organizationId, filters],
    queryFn: () => sellingRateQueries.getSellingRates(organizationId, filters),
    enabled: !!organizationId
  })
}

export function useSellingRate(id: string) {
  return useQuery({
    queryKey: ['selling-rate', id],
    queryFn: () => sellingRateQueries.getSellingRate(id),
    enabled: !!id
  })
}

export function useSellingRatesForProduct(
  productId: string,
  organizationId: string,
  productOptionId?: string,
  dateRange?: { start: string; end: string }
) {
  return useQuery({
    queryKey: ['selling-rates-product', productId, organizationId, productOptionId, dateRange],
    queryFn: () => sellingRateQueries.getSellingRatesForProduct(productId, organizationId, productOptionId, dateRange),
    enabled: !!productId && !!organizationId
  })
}

export function useRateComparison(
  productId: string,
  productOptionId: string,
  organizationId: string
) {
  return useQuery({
    queryKey: ['rate-comparison', productId, productOptionId, organizationId],
    queryFn: () => sellingRateQueries.getRateComparison(productId, productOptionId, organizationId),
    enabled: !!productId && !!productOptionId && !!organizationId
  })
}

export function useSellingRateStats(
  productId: string,
  productOptionId: string,
  organizationId: string
) {
  return useQuery({
    queryKey: ['selling-rate-stats', productId, productOptionId, organizationId],
    queryFn: () => sellingRateQueries.getSellingRateStats(productId, productOptionId, organizationId),
    enabled: !!productId && !!productOptionId && !!organizationId
  })
}

export function useCreateSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sellingRateQueries.createSellingRate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rates-product'] })
      queryClient.invalidateQueries({ queryKey: ['rate-comparison'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rate-stats'] })
      toast.success('Selling rate created successfully')
    },
    onError: (error: any) => {
      console.error('Error creating selling rate:', error)
      toast.error('Failed to create selling rate')
    }
  })
}

export function useUpdateSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      sellingRateQueries.updateSellingRate(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['selling-rates-product'] })
      queryClient.invalidateQueries({ queryKey: ['rate-comparison'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rate-stats'] })
      toast.success('Selling rate updated successfully')
    },
    onError: (error: any) => {
      console.error('Error updating selling rate:', error)
      toast.error('Failed to update selling rate')
    }
  })
}

export function useDeleteSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sellingRateQueries.deleteSellingRate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rates-product'] })
      queryClient.invalidateQueries({ queryKey: ['rate-comparison'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rate-stats'] })
      toast.success('Selling rate deleted successfully')
    },
    onError: (error: any) => {
      console.error('Error deleting selling rate:', error)
      toast.error('Failed to delete selling rate')
    }
  })
}

export function useDuplicateSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: {
        rate_name?: string
        valid_from: string
        valid_to: string
        base_price?: number
      }
    }) => sellingRateQueries.duplicateSellingRate(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rates-product'] })
      queryClient.invalidateQueries({ queryKey: ['rate-comparison'] })
      queryClient.invalidateQueries({ queryKey: ['selling-rate-stats'] })
      toast.success('Selling rate duplicated successfully')
    },
    onError: (error: any) => {
      console.error('Error duplicating selling rate:', error)
      toast.error('Failed to duplicate selling rate')
    }
  })
}
