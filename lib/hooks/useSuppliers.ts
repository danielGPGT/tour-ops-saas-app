import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as supplierQueries from '@/lib/queries/suppliers'
import type { Supplier, SupplierFormData, SupplierStats } from '@/lib/types/supplier'

export function useSuppliers() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['suppliers', profile?.organization_id],
    queryFn: () => supplierQueries.getSuppliers(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: () => supplierQueries.getSupplier(id),
    enabled: !!id
  })
}

export function useSupplierStats() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['supplier-stats', profile?.organization_id],
    queryFn: () => supplierQueries.getSupplierStats(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  const { profile, loading } = useAuth()
  
  return useMutation({
    mutationFn: (data: SupplierFormData) => {
      if (!profile?.organization_id) {
        throw new Error('User profile or organization not loaded')
      }
      return supplierQueries.createSupplier({
        ...data,
        organization_id: profile.organization_id
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] })
    }
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplierFormData> }) =>
      supplierQueries.updateSupplier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers', id] })
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] })
    }
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => supplierQueries.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-stats'] })
    }
  })
}

export function useSearchSuppliers(query: string) {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['suppliers', 'search', query],
    queryFn: () => supplierQueries.searchSuppliers(profile!.organization_id, query),
    enabled: !!profile?.organization_id && query.length >= 2
  })
}
