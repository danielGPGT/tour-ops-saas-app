'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building, TrendingUp, Star, Users, Trash2, Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EntityPageLayout } from '@/components/common/EntityPageLayout'
import { SearchBar } from '@/components/common/SearchBar'
import { BulkActions } from '@/components/common/BulkActions'
import { SummaryCards } from '@/components/common/SummaryCards'
import { DataTable } from '@/components/common/DataTable'
import { SupplierDialogForm } from '@/components/suppliers/supplier-dialog-form'
import { useSuppliers, useDeleteSupplier } from '@/lib/hooks/useSuppliers'
import { toast } from 'sonner'
import type { Supplier } from '@/lib/types/supplier'

export default function SuppliersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedSuppliers, setSelectedSuppliers] = React.useState<string[]>([])
  const [viewMode, setViewMode] = React.useState<'table' | 'grid'>('table')

  const { data: suppliers = [], isLoading, error } = useSuppliers()
  const deleteSupplier = useDeleteSupplier()

  // Filter suppliers based on search term
  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm) return suppliers
    
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.supplier_type && supplier.supplier_type.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [suppliers, searchTerm])

  // Summary cards data
  const summaryCards = [
    {
      id: 'total-suppliers',
      title: 'Total Suppliers',
      value: suppliers.length.toString(),
      icon: <Building className="h-4 w-4" />,
      description: 'All suppliers'
    },
    {
      id: 'active-suppliers',
      title: 'Active Suppliers',
      value: suppliers.filter(s => s.is_active).length.toString(),
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'Active suppliers'
    },
    {
      id: 'total-bookings',
      title: 'Total Bookings',
      value: suppliers.reduce((sum, s) => sum + (s.total_bookings || 0), 0).toString(),
      icon: <Users className="h-4 w-4" />,
      description: 'All time bookings'
    },
    {
      id: 'average-rating',
      title: 'Average Rating',
      value: suppliers.length > 0 
        ? (suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length).toFixed(1)
        : '0.0',
      icon: <Star className="h-4 w-4" />,
      description: 'Supplier rating'
    }
  ]

  // Table columns
  const columns = [
    {
      key: 'name',
      header: 'Supplier Name',
      render: (supplier: Supplier) => (
        <div>
          <div className="font-medium">{supplier.name}</div>
          <div className="text-sm text-muted-foreground">{supplier.code}</div>
        </div>
      )
    },
    {
      key: 'supplier_type',
      header: 'Type',
      render: (supplier: Supplier) => (
        <span className="capitalize text-sm">{supplier.supplier_type || 'Not specified'}</span>
      )
    },
    {
      key: 'contact_info',
      header: 'Contact',
      render: (supplier: Supplier) => (
        <div className="text-sm">
          <div>{supplier.contact_info?.email || 'No email'}</div>
          <div className="text-muted-foreground">{supplier.contact_info?.phone || 'No phone'}</div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (supplier: Supplier) => (
        supplier.rating ? (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{supplier.rating}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No rating</span>
        )
      )
    },
    {
      key: 'total_bookings',
      header: 'Bookings',
      render: (supplier: Supplier) => (
        <div className="text-sm font-medium">{supplier.total_bookings || 0}</div>
      )
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (supplier: Supplier) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          supplier.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {supplier.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ]

  // Bulk actions
  const bulkActions = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive' as const,
      onClick: (items: Supplier[]) => {
        items.forEach(supplier => {
          deleteSupplier.mutate(supplier.id)
        })
        setSelectedSuppliers([])
        toast.success(`Deleted ${items.length} supplier${items.length > 1 ? 's' : ''}`)
      },
      requiresConfirmation: true,
      confirmationTitle: 'Delete Suppliers',
      confirmationDescription: (items: Supplier[]) => 
        `Are you sure you want to delete ${items.length} supplier${items.length > 1 ? 's' : ''}? This action cannot be undone.`
    },
    {
      id: 'duplicate',
      label: 'Duplicate Selected',
      icon: <Copy className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: (items: Supplier[]) => {
        // TODO: Implement duplicate functionality
        console.log('Duplicating suppliers:', items)
        setSelectedSuppliers([])
        toast.info('Duplicate functionality coming soon')
      }
    },
    {
      id: 'export',
      label: 'Export Selected',
      icon: <Download className="h-4 w-4" />,
      variant: 'outline' as const,
      onClick: (items: Supplier[]) => {
        // TODO: Implement export functionality
        console.log('Exporting suppliers:', items)
        setSelectedSuppliers([])
        toast.info('Export functionality coming soon')
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage your supplier relationships and contracts
          </p>
        </div>
        <SupplierDialogForm
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          }
        />
      </div>

      {/* Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <SearchBar
          placeholder="Search suppliers..."
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <BulkActions
            selectedItems={selectedSuppliers.map(id => suppliers.find(s => s.id === id)).filter(Boolean) as Supplier[]}
            actions={bulkActions as any}
            getItemName={(supplier: any) => supplier.name}
            getItemId={(supplier: any) => supplier.id}
            entityName="supplier"
            onSelectionClear={() => setSelectedSuppliers([])}
          />
        </div>
      </div>

      {/* Main Content */}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading suppliers...</p>
              </div>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No suppliers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first supplier.'}
              </p>
              {!searchTerm && (
                <SupplierDialogForm
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <DataTable
              data={filteredSuppliers}
              columns={columns}
              selectedItems={selectedSuppliers.map(id => suppliers.find(s => s.id === id)).filter(Boolean) as Supplier[]}
              onSelectionChange={(items: Supplier[]) => setSelectedSuppliers(items.map(s => s.id))}
              onRowClick={(supplier) => router.push(`/suppliers/${supplier.id}`)}
              getId={(supplier) => supplier.id}
            />
          )}

    </div>
  )
}
