import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import * as customerQueries from '@/lib/queries/customers'
import type { Customer, CustomerFormData, CustomerStats } from '@/lib/types/customer'

export function useCustomers() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['customers', profile?.organization?.id],
    queryFn: () => customerQueries.getCustomers(profile?.organization?.id || ''),
    enabled: !!profile?.organization?.id
  })
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customerQueries.getCustomer(id),
    enabled: !!id
  })
}

export function useCustomerStats() {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['customer-stats', profile?.organization?.id],
    queryFn: () => customerQueries.getCustomerStats(profile?.organization?.id || ''),
    enabled: !!profile?.organization?.id
  })
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()
  
  return useMutation({
    mutationFn: (data: CustomerFormData) => 
      customerQueries.createCustomer({
        ...data,
        organization_id: profile?.organization?.id || ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] })
    }
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) =>
      customerQueries.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customers', id] })
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] })
    }
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => customerQueries.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer-stats'] })
    }
  })
}

export function useSearchCustomers(query: string) {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: () => customerQueries.searchCustomers(profile?.organization?.id || '', query),
    enabled: !!profile?.organization?.id && query.length >= 2
  })
}
