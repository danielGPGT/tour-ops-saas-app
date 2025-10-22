import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as contractQueries from '@/lib/queries/contracts'
import type { 
  Contract, 
  ContractFormData, 
  ContractAllocationFormData, 
  SupplierRateFormData,
  ContractFilters,
  ContractSort,
  ContractStats
} from '@/types/contract'

// Get all contracts
export function useContracts(filters?: ContractFilters, sort?: ContractSort) {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['contracts', profile?.organization_id, filters, sort],
    queryFn: () => contractQueries.getContracts(profile!.organization_id, filters, sort),
    enabled: !!profile?.organization_id
  })
}

// Get a single contract
export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: () => contractQueries.getContract(id),
    enabled: !!id
  })
}

// Get contract statistics
export function useContractStats() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['contracts', 'stats', profile?.organization_id],
    queryFn: () => contractQueries.getContractStats(profile!.organization_id),
    enabled: !!profile?.organization_id
  })
}

// Create contract
export function useCreateContract() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: ContractFormData) => 
      contractQueries.createContract({
        ...data,
        organization_id: profile!.organization_id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'stats'] })
    }
  })
}

// Update contract
export function useUpdateContract() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractFormData> }) =>
      contractQueries.updateContract(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', id] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'stats'] })
    }
  })
}

// Delete contract
export function useDeleteContract() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'stats'] })
    }
  })
}

// Contract Allocations
export function useContractAllocations(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'allocations'],
    queryFn: () => contractQueries.getContractAllocations(contractId),
    enabled: !!contractId
  })
}

export function useCreateContractAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createContractAllocation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id, 'allocations'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id] })
    }
  })
}

export function useUpdateContractAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContractAllocationFormData> }) =>
      contractQueries.updateContractAllocation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'allocations'] })
    }
  })
}

export function useDeleteContractAllocation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteContractAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'allocations'] })
    }
  })
}

// Supplier Rates
export function useSupplierRates(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'supplier-rates'],
    queryFn: () => contractQueries.getSupplierRates(contractId),
    enabled: !!contractId
  })
}

export function useCreateSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createSupplierRate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id, 'supplier-rates'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id] })
    }
  })
}

export function useUpdateSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updateSupplierRate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'supplier-rates'] })
    }
  })
}

export function useDeleteSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteSupplierRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'supplier-rates'] })
    }
  })
}

// ===== PAYMENT SCHEDULES =====

export function usePaymentSchedules(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'payment-schedules'],
    queryFn: () => contractQueries.getPaymentSchedules(contractId),
    enabled: !!contractId
  })
}

export function useCreatePaymentSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createPaymentSchedule(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id, 'payment-schedules'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id] })
    }
  })
}

export function useUpdatePaymentSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updatePaymentSchedule(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'payment-schedules'] })
    }
  })
}

export function useDeletePaymentSchedule() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deletePaymentSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'payment-schedules'] })
    }
  })
}

// ===== CANCELLATION POLICIES =====

export function useCancellationPolicies(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'cancellation-policies'],
    queryFn: () => contractQueries.getCancellationPolicies(contractId),
    enabled: !!contractId
  })
}

export function useCreateCancellationPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createCancellationPolicy(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id, 'cancellation-policies'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id] })
    }
  })
}

export function useUpdateCancellationPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updateCancellationPolicy(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'cancellation-policies'] })
    }
  })
}

export function useDeleteCancellationPolicy() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteCancellationPolicy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'cancellation-policies'] })
    }
  })
}

// ===== DEADLINES =====

export function useDeadlines(refType: string, refId: string) {
  return useQuery({
    queryKey: ['contracts', refType, refId, 'deadlines'],
    queryFn: () => contractQueries.getDeadlines(refType, refId),
    enabled: !!refType && !!refId
  })
}

export function useCreateDeadline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createDeadline(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.ref_type, variables.ref_id, 'deadlines'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.ref_id] })
    }
  })
}

export function useUpdateDeadline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updateDeadline(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'deadlines'] })
    }
  })
}

export function useDeleteDeadline() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteDeadline(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'deadlines'] })
    }
  })
}

// ===== COMMISSION TIERS =====

export function useCommissionTiers(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'commission-tiers'],
    queryFn: () => contractQueries.getCommissionTiers(contractId),
    enabled: !!contractId
  })
}

export function useCreateCommissionTier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createCommissionTier(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id, 'commission-tiers'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.contract_id] })
    }
  })
}

export function useUpdateCommissionTier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updateCommissionTier(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'commission-tiers'] })
    }
  })
}

export function useDeleteCommissionTier() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteCommissionTier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', 'commission-tiers'] })
    }
  })
}
