import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as inventoryQueries from '@/lib/queries/allocation-inventory'
import type { AllocationInventory, InventoryWithStats } from '@/lib/types/inventory'
import { toast } from 'sonner'

// Get inventory for an allocation
export function useAllocationInventory(allocationId: string) {
  return useQuery({
    queryKey: ['allocation-inventory', allocationId],
    queryFn: () => inventoryQueries.getAllocationInventory(allocationId),
    enabled: !!allocationId
  })
}

// Get inventory with stats (availability data)
export function useInventoryWithStats(allocationId: string) {
  return useQuery({
    queryKey: ['allocation-inventory-stats', allocationId],
    queryFn: () => inventoryQueries.getInventoryWithStats(allocationId),
    enabled: !!allocationId
  })
}

// Get single inventory item
export function useInventoryItem(inventoryId: string) {
  return useQuery({
    queryKey: ['allocation-inventory', inventoryId],
    queryFn: () => inventoryQueries.getInventoryItem(inventoryId),
    enabled: !!inventoryId
  })
}

// Create inventory item
export function useCreateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<AllocationInventory>) =>
      inventoryQueries.createInventoryItem(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory-stats', data.contract_allocation_id] })
      toast.success('Inventory item created successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create inventory item')
    }
  })
}

// Update inventory item
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AllocationInventory> }) =>
      inventoryQueries.updateInventoryItem(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory-stats', data.contract_allocation_id] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory', data.id] })
      toast.success('Inventory item updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update inventory item')
    }
  })
}

// Delete inventory item
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, allocationId }: { id: string; allocationId: string }) =>
      inventoryQueries.deleteInventoryItem(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory-stats', variables.allocationId] })
      toast.success('Inventory item deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete inventory item')
    }
  })
}

// Generate availability for inventory items
export function useGenerateAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { inventoryIds: string[]; dateFrom: string; dateTo: string }) =>
      inventoryQueries.generateAvailability(data),
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory'] })
      queryClient.invalidateQueries({ queryKey: ['allocation-inventory-stats'] })
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      toast.success(`Availability generated for ${data.length} inventory items`)
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate availability')
    }
  })
}

// Get all inventory across all allocations
export function useAllInventory() {
  return useQuery({
    queryKey: ['all-inventory'],
    queryFn: () => inventoryQueries.getAllInventory()
  })
}