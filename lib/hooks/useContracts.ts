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

// ===== ALLOCATION POOLS =====

export function useAllocationPools(organizationId: string, productId?: string) {
  return useQuery({
    queryKey: ['allocation-pools', organizationId, productId],
    queryFn: () => contractQueries.getAllocationPools(organizationId, productId),
    enabled: !!organizationId && organizationId !== ''
  })
}

export function useAllocationPool(id: string) {
  return useQuery({
    queryKey: ['allocation-pool', id],
    queryFn: () => contractQueries.getAllocationPool(id),
    enabled: !!id
  })
}

export function usePoolOptimizationData(poolId: string) {
  return useQuery({
    queryKey: ['pool-optimization', poolId],
    queryFn: () => contractQueries.getPoolOptimizationData(poolId),
    enabled: !!poolId
  })
}

export function useCreateAllocationPool() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.createAllocationPool,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pools'] })
      queryClient.setQueryData(['allocation-pool', data.id], data)
    }
  })
}

export function useUpdateAllocationPool() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      contractQueries.updateAllocationPool(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pools'] })
      queryClient.setQueryData(['allocation-pool', data.id], data)
    }
  })
}

export function useDeleteAllocationPool() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.deleteAllocationPool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pools'] })
    }
  })
}

export function useAddAllocationToPool() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ poolId, allocationId, priority = 0 }: { 
      poolId: string; 
      allocationId: string; 
      priority?: number 
    }) => contractQueries.addAllocationToPool(poolId, allocationId, priority),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pool', variables.poolId] })
      queryClient.invalidateQueries({ queryKey: ['pool-optimization', variables.poolId] })
      queryClient.invalidateQueries({ queryKey: ['allocation-pools'] })
    }
  })
}

export function useRemoveAllocationFromPool() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ poolId, allocationId }: { poolId: string; allocationId: string }) => 
      contractQueries.removeAllocationFromPool(poolId, allocationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pool', variables.poolId] })
      queryClient.invalidateQueries({ queryKey: ['pool-optimization', variables.poolId] })
      queryClient.invalidateQueries({ queryKey: ['allocation-pools'] })
    }
  })
}

export function useUpdatePoolMemberPriority() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ poolId, allocationId, priority }: { 
      poolId: string; 
      allocationId: string; 
      priority: number 
    }) => contractQueries.updatePoolMemberPriority(poolId, allocationId, priority),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-pool', variables.poolId] })
      queryClient.invalidateQueries({ queryKey: ['pool-optimization', variables.poolId] })
    }
  })
}

export function useAllocationStats(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'allocation-stats'],
    queryFn: () => contractQueries.getAllocationStats(contractId),
    enabled: !!contractId
  })
}

export function useAllocationDetails(allocationId: string) {
  return useQuery({
    queryKey: ['allocation-details', allocationId],
    queryFn: () => contractQueries.getAllocationDetails(allocationId),
    enabled: !!allocationId
  })
}

export function useAllocationInventory(allocationId: string) {
  return useQuery({
    queryKey: ['allocation-inventory', allocationId],
    queryFn: () => contractQueries.getAllocationInventory(allocationId),
    enabled: !!allocationId
  })
}

export function useCreateAllocationInventory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.createAllocationInventory,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-details'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    }
  })
}

export function useUpdateAllocationInventory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      contractQueries.updateAllocationInventory(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-details'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    }
  })
}

export function useDeleteAllocationInventory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.deleteAllocationInventory,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-details'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
    }
  })
}

// Availability Calendar hooks
export function useAvailabilityCalendar(
  allocationInventoryId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['availability-calendar', allocationInventoryId, startDate, endDate],
    queryFn: () => contractQueries.getAvailabilityCalendar(allocationInventoryId, startDate, endDate),
    enabled: !!allocationInventoryId && !!startDate && !!endDate
  })
}

export function useAvailabilityForAllocation(
  allocationId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: ['availability-allocation', allocationId, startDate, endDate],
    queryFn: () => contractQueries.getAvailabilityForAllocation(allocationId, startDate, endDate),
    enabled: !!allocationId && !!startDate && !!endDate
  })
}

export function useAvailabilitySummary(allocationId: string) {
  return useQuery({
    queryKey: ['availability-summary', allocationId],
    queryFn: () => contractQueries.getAvailabilitySummary(allocationId),
    enabled: !!allocationId
  })
}

export function useCreateAvailabilityRecord() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.createAvailabilityRecord,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-allocation'] })
      queryClient.invalidateQueries({ queryKey: ['availability-summary'] })
    }
  })
}

export function useUpdateAvailabilityRecord() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      contractQueries.updateAvailabilityRecord(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-allocation'] })
      queryClient.invalidateQueries({ queryKey: ['availability-summary'] })
    }
  })
}

export function useDeleteAvailabilityRecord() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.deleteAvailabilityRecord,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-allocation'] })
      queryClient.invalidateQueries({ queryKey: ['availability-summary'] })
    }
  })
}

export function useBulkCreateAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({
      allocationInventoryId,
      dateRange,
      defaultAvailable
    }: {
      allocationInventoryId: string
      dateRange: { start: string; end: string }
      defaultAvailable: number
    }) => contractQueries.bulkCreateAvailability(allocationInventoryId, dateRange, defaultAvailable),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['availability-calendar'] })
      queryClient.invalidateQueries({ queryKey: ['availability-allocation'] })
      queryClient.invalidateQueries({ queryKey: ['availability-summary'] })
    }
  })
}

// Supplier Rates hooks
export function useSupplierRates(
  organizationId: string,
  filters?: {
    product_id?: string
    contract_id?: string
    supplier_id?: string
    is_active?: boolean
  }
) {
  return useQuery({
    queryKey: ['supplier-rates', organizationId, filters],
    queryFn: () => contractQueries.getSupplierRates(organizationId, filters),
    enabled: !!organizationId
  })
}

export function useSupplierRate(id: string) {
  return useQuery({
    queryKey: ['supplier-rate', id],
    queryFn: () => contractQueries.getSupplierRate(id),
    enabled: !!id
  })
}

export function useSupplierRatesByContract(contractId: string) {
  return useQuery({
    queryKey: ['supplier-rates-contract', contractId],
    queryFn: () => contractQueries.getSupplierRatesByContract(contractId),
    enabled: !!contractId
  })
}

export function useSupplierRatesForProduct(
  productId: string,
  organizationId: string,
  dateRange?: { start: string; end: string }
) {
  return useQuery({
    queryKey: ['supplier-rates-product', productId, organizationId, dateRange],
    queryFn: () => contractQueries.getSupplierRatesForProduct(productId, organizationId, dateRange),
    enabled: !!productId && !!organizationId
  })
}

export function useCreateSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.createSupplierRate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-rates'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-contract'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-product'] })
    }
  })
}

export function useUpdateSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      contractQueries.updateSupplierRate(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-rates'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rate', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-contract'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-product'] })
    }
  })
}

export function useDeleteSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: contractQueries.deleteSupplierRate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-rates'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-contract'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-product'] })
    }
  })
}

export function useDuplicateSupplierRate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { 
      id: string; 
      updates: {
        rate_name?: string
        valid_from: string
        valid_to: string
        base_cost?: number
      }
    }) => contractQueries.duplicateSupplierRate(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-rates'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-contract'] })
      queryClient.invalidateQueries({ queryKey: ['supplier-rates-product'] })
    }
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

// Supplier Rates for Contract
export function useContractSupplierRates(contractId: string) {
  return useQuery({
    queryKey: ['contracts', contractId, 'supplier-rates'],
    queryFn: () => contractQueries.getSupplierRatesByContract(contractId),
    enabled: !!contractId
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

// ===== ALLOCATION RELEASES =====

export function useAllocationReleases(allocationId: string) {
  return useQuery({
    queryKey: ['allocations', allocationId, 'releases'],
    queryFn: () => contractQueries.getAllocationReleases(allocationId),
    enabled: !!allocationId
  })
}

export function useCreateAllocationRelease() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => contractQueries.createAllocationRelease(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocations', variables.contract_allocation_id, 'releases'] })
    }
  })
}

export function useUpdateAllocationRelease() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      contractQueries.updateAllocationRelease(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    }
  })
}

export function useDeleteAllocationRelease() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => contractQueries.deleteAllocationRelease(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] })
    }
  })
}
