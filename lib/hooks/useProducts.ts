import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as productQueries from '@/lib/queries/products'
import type { Product, ProductType, ProductOption, SellingRate, ProductFilters, ProductSort } from '@/lib/types/product'

// Products hooks
export function useProducts(filters?: ProductFilters, sort?: ProductSort) {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['products', profile?.organization_id, filters, sort],
    queryFn: () => productQueries.getProducts(profile!.organization_id, filters, sort),
    enabled: !!profile?.organization_id
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productQueries.getProduct(id),
    enabled: !!id
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: Partial<Product>) => 
      productQueries.createProduct({
        ...data,
        organization_id: profile!.organization_id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productQueries.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', id] })
    }
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => productQueries.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    }
  })
}

// Product types hooks
export function useProductTypes() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['product-types', profile?.organization_id],
    queryFn: () => productQueries.getProductTypes(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}

export function useCreateProductType() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: Partial<ProductType>) => 
      productQueries.createProductType({
        ...data,
        organization_id: profile!.organization_id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-types'] })
    }
  })
}

// Product options hooks
export function useProductOptions(productId: string) {
  return useQuery({
    queryKey: ['product-options', productId],
    queryFn: () => productQueries.getProductOptions(productId),
    enabled: !!productId
  })
}

export function useCreateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ProductOption>) => productQueries.createProductOption(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product-options', variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.product_id] })
    }
  })
}

export function useUpdateProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductOption> }) =>
      productQueries.updateProductOption(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['product-options'] })
    }
  })
}

export function useDeleteProductOption() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => productQueries.deleteProductOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-options'] })
    }
  })
}

// Selling rates hooks
export function useSellingRates(productId: string) {
  return useQuery({
    queryKey: ['selling-rates', productId],
    queryFn: () => productQueries.getSellingRates(productId),
    enabled: !!productId
  })
}

export function useCreateSellingRate() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: Partial<SellingRate>) => 
      productQueries.createSellingRate({
        ...data,
        organization_id: profile!.organization_id
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates', variables.product_id] })
      queryClient.invalidateQueries({ queryKey: ['products', variables.product_id] })
    }
  })
}

export function useUpdateSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SellingRate> }) =>
      productQueries.updateSellingRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
    }
  })
}

export function useDeleteSellingRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => productQueries.deleteSellingRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['selling-rates'] })
    }
  })
}

// Product statistics hook
export function useProductStats() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['product-stats', profile?.organization_id],
    queryFn: () => productQueries.getProductStats(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}