import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as allocationQueries from '@/lib/queries/allocations'
import type { ContractAllocation } from '@/lib/types/allocation'
import { toast } from 'sonner'

export function useAllocations() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['allocations', profile?.organization_id],
    queryFn: () => allocationQueries.getAllocations(profile?.organization_id || ''),
    enabled: !!profile?.organization_id
  })
}

export function useAllocationsByContract(contractId: string) {
  return useQuery({
    queryKey: ['allocations', 'contract', contractId],
    queryFn: () => allocationQueries.getAllocationsByContract(contractId),
    enabled: !!contractId
  })
}

export function useAllocationsByProduct(productId: string) {
  return useQuery({
    queryKey: ['allocations', 'product', productId],
    queryFn: () => allocationQueries.getAllocationsByProduct(productId),
    enabled: !!productId
  })
}

export function useAllocation(id: string) {
  return useQuery({
    queryKey: ['allocations', id],
    queryFn: () => allocationQueries.getAllocation(id),
    enabled: !!id
  })
}

export function useCreateAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<ContractAllocation>) =>
      allocationQueries.createAllocation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['allocations', 'contract', data.contract_id] })
      queryClient.invalidateQueries({ queryKey: ['allocations', 'product', data.product_id] })
      toast.success('Allocation created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create allocation')
    }
  })
}

export function useUpdateAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractAllocation> }) =>
      allocationQueries.updateAllocation(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['allocations', data.id] })
      queryClient.invalidateQueries({ queryKey: ['allocations', 'contract', data.contract_id] })
      toast.success('Allocation updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update allocation')
    }
  })
}

export function useDeleteAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, contractId }: { id: string; contractId: string }) =>
      allocationQueries.deleteAllocation(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
      queryClient.invalidateQueries({ queryKey: ['allocations', 'contract', variables.contractId] })
      toast.success('Allocation deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete allocation')
    }
  })
}
