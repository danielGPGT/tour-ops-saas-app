'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Building, Phone, Mail, Globe, MapPin, TrendingUp, DollarSign, Calendar, Users, FileText, Copy, Download, Share2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/common/StatusBadge'
import { InfoCard } from '@/components/common/InfoCard'
import { DetailRow } from '@/components/common/DetailRow'
import { StatsGrid } from '@/components/common/StatsGrid'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { ActionButtons } from '@/components/common/ActionButtons'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { InlineEditHint } from '@/components/common/InlineEditHint'
import { useSupplier, useDeleteSupplier } from '@/lib/hooks/useSuppliers'
import { useContracts } from '@/lib/hooks/useContracts'
import { formatDate } from '@/lib/utils/formatting'
import { 
  SupplierInlineEdit, 
  SupplierContactEdit, 
  SupplierPaymentEdit,
  SupplierStatusEdit 
} from '@/components/suppliers/SupplierInlineEditWrapper'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'
import { ContractList } from '@/components/contracts/contract-list'

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const { data: supplier, isLoading } = useSupplier(supplierId)
  const deleteSupplier = useDeleteSupplier()
  
  // Fetch contracts for this supplier
  const { data: contracts = [], isLoading: contractsLoading } = useContracts(
    { supplier_id: supplierId },
    { field: 'created_at', direction: 'desc' }
  )

  const handleDelete = async () => {
    try {
      await deleteSupplier.mutateAsync(supplierId)
      router.push('/suppliers')
    } catch (error) {
      console.error('Error deleting supplier:', error)
    }
  }

  if (isLoading) {
    return <PageSkeleton />
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Supplier Not Found</h1>
            <p className="text-muted-foreground">
              The supplier you're looking for doesn't exist
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Note: Using direct fields instead of nested contact_info

  // Prepare stats data
  const stats = [
    {
      id: 'default-currency',
      label: 'Default Currency',
      value: supplier.default_currency || 'Not set',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Preferred currency'
    },
    {
      id: 'supplier-type',
      label: 'Type',
      value: supplier.supplier_type || 'Not specified',
      icon: <Building className="h-4 w-4" />,
      description: 'Supplier category'
    },
    {
      id: 'location',
      label: 'Location',
      value: [supplier.city, supplier.country].filter(Boolean).join(', ') || 'Not set',
      icon: <MapPin className="h-4 w-4" />,
      description: 'Business location'
    },
    {
      id: 'created-date',
      label: 'Created',
      value: supplier.created_at ? formatDate(supplier.created_at) : 'Not set',
      icon: <Calendar className="h-4 w-4" />,
      description: 'Member since'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          <SupplierInlineEdit
            supplier={supplier}
            field="name"
            label="Supplier Name"
            className="text-2xl font-bold"
            emptyValue="Unnamed Supplier"
            size="lg"
            variant="minimal"
          />
        }
        subtitle={
          <div className="space-y-3">
            {/* Status and Key Info Row */}
            <div className="flex items-center gap-4">
              <StatusBadge
                status={supplier.is_active ? "active" : "inactive"}
                size="sm"
              />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  <SupplierInlineEdit
                    supplier={supplier}
                    field="supplier_type"
                    label="Supplier Type"
                    placeholder="Enter supplier type"
                    className="text-muted-foreground"
                    emptyValue="Not specified"
                    size="sm"
                    variant="minimal"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium">Code:</span>
                  <SupplierInlineEdit
                    supplier={supplier}
                    field="code"
                    label="Supplier Code"
                    placeholder="Enter supplier code"
                    className="text-muted-foreground font-mono text-xs"
                    emptyValue="No code"
                    size="sm"
                    variant="minimal"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs text-muted-foreground">
                    {[supplier.city, supplier.country].filter(Boolean).join(', ') || 'No location'}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        }
        backButton={{
          onClick: () => router.back(),
          label: "Back"
        }}
        actions={
        
          <ActionButtons
            onDelete={() => setShowDeleteDialog(true)}
            onDuplicate={() => {
              // TODO: Implement duplicate functionality
              console.log("Duplicate supplier");
            }}
            onExport={() => {
              // TODO: Implement export functionality
              console.log("Export supplier data");
            }}
            onShare={() => {
              // TODO: Implement share functionality
              console.log("Share supplier");
            }}
            showEdit={false}
            showDelete={true}
            showDuplicate={true}
            showExport={true}
            showShare={true}
            size="sm"
            variant="compact"
          />
        }
      />



      {/* Stats Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Key Metrics</h3>
          <div className="text-sm text-muted-foreground">
            Last updated: {supplier.updated_at ? formatDate(supplier.updated_at) : 'Not set'}
          </div>
        </div>
        <StatsGrid stats={stats} columns={4} />
      </div>

      {/* Main Content */}
      <div className="space-y-2">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contracts
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Products
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Bookings
              </TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              {supplier.is_active ? (
                <span className="flex items-center gap-1 text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-600"></div>
                  Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
                  Offline
                </span>
              )}
            </div>
          </div>

                 <TabsContent value="overview" className="space-y-2">
           <div className="grid gap-4 lg:grid-cols-2">
             {/* Contact Information */}
             <InfoCard
               title="Contact Information"
               description="Primary contact details and business information"
               icon={<Building className="h-4 w-4" />}
               variant="default"
               className="h-fit"
             >
               <div className="space-y-4">
                 <DetailRow
                   label="Primary Contact"
                   value={
                     <SupplierContactEdit
                       supplier={supplier}
                       field="primary_contact"
                       label="Primary Contact"
                       placeholder="Enter primary contact name"
                       className="text-sm font-medium"
                       emptyValue="Not specified"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<Building className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="Email Address"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="email"
                       label="Email"
                       placeholder="Enter email"
                       className="text-sm font-medium"
                       emptyValue="No email"
                       size="sm"
                       variant="underline"
                       validation={(value) => {
                         if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                           return "Please enter a valid email address";
                         }
                         return null;
                       }}
                     />
                   }
                   icon={<Mail className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="Phone Number"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="phone"
                       label="Phone"
                       placeholder="Enter phone"
                       className="text-sm font-medium"
                       emptyValue="No phone"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<Phone className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="Address"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="address_line1"
                       label="Address"
                       placeholder="Enter address"
                       className="text-sm font-medium"
                       emptyValue="No address"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<MapPin className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="City"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="city"
                       label="City"
                       placeholder="Enter city"
                       className="text-sm font-medium"
                       emptyValue="Not set"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<MapPin className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="Country"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="country"
                       label="Country (ISO Code)"
                       placeholder="US, GB, etc."
                       className="text-sm font-medium uppercase"
                       emptyValue="Not set"
                       size="sm"
                       variant="underline"
                       maxLength={2}
                     />
                   }
                   icon={<Globe className="h-4 w-4" />}
                 />
                 
                 <DetailRow
                   label="Default Currency"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="default_currency"
                       label="Currency"
                       placeholder="USD"
                       className="text-sm font-medium"
                       emptyValue="Not set"
                       size="sm"
                       variant="underline"
                       maxLength={3}
                     />
                   }
                   icon={<DollarSign className="h-4 w-4" />}
                 />
                 
                 {supplier.notes && (
                   <DetailRow
                     label="Notes"
                     value={supplier.notes}
                     icon={<FileText className="h-4 w-4" />}
                   />
                 )}
               </div>
             </InfoCard>

             {/* Activity & Summary */}
             <InfoCard
               title="Activity & Summary"
               description="Recent activity and key statistics"
               icon={<TrendingUp className="h-4 w-4" />}
               variant="default"
               className="h-fit"
             >
               <div className="space-y-4">
                 <DetailRow
                   label="Active Contracts"
                   value={
                     <span className="flex items-center gap-2">
                       <FileText className="h-4 w-4 text-muted-foreground" />
                       <span className="text-sm font-medium">
                         {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
                       </span>
                                               <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const contractsTab = document.querySelector('button[value="contracts"]') as HTMLButtonElement
                            if (contractsTab) {
                              contractsTab.click()
                            }
                          }}
                          className="h-6 text-xs"
                        >
                          View All
                        </Button>
                     </span>
                   }
                   icon={<FileText className="h-4 w-4" />}
                 />

                 <DetailRow
                   label="Status"
                   value={
                     <StatusBadge
                       status={supplier.is_active ? "active" : "inactive"}
                       size="sm"
                     />
                   }
                   icon={<Building className="h-4 w-4" />}
                 />

                 <DetailRow
                   label="Created Date"
                   value={supplier.created_at ? formatDate(supplier.created_at) : 'Not set'}
                   icon={<Calendar className="h-4 w-4" />}
                 />

                 <DetailRow
                   label="Last Updated"
                   value={supplier.updated_at ? formatDate(supplier.updated_at) : 'Not set'}
                   icon={<Calendar className="h-4 w-4" />}
                 />

                 <DetailRow
                   label="Supplier Type"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="supplier_type"
                       label="Type"
                       placeholder="hotel, transport, etc."
                       className="text-sm font-medium"
                       emptyValue="Not specified"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<Building className="h-4 w-4" />}
                 />

                 <DetailRow
                   label="Supplier Code"
                   value={
                     <SupplierInlineEdit
                       supplier={supplier}
                       field="code"
                       label="Code"
                       placeholder="Enter code"
                       className="text-sm font-medium font-mono"
                       emptyValue="Not set"
                       size="sm"
                       variant="underline"
                     />
                   }
                   icon={<FileText className="h-4 w-4" />}
                 />
               </div>
             </InfoCard>

           </div>
         </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Contracts</h3>
              <p className="text-sm text-muted-foreground">
                {contracts.length} contract{contracts.length !== 1 ? 's' : ''} with this supplier
              </p>
            </div>
            <Button 
              onClick={() => router.push('/contracts/new')}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Contract
            </Button>
          </div>

          {contractsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading contracts...</div>
          ) : contracts.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="No contracts found"
              description="This supplier doesn't have any contracts yet. Create your first contract to get started."
              action={{
                label: "Create Contract",
                onClick: () => router.push('/contracts/new'),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <ContractList
              contracts={contracts}
              isLoading={false}
              onDuplicate={(id) => {
                // TODO: Implement duplicate functionality
                console.log('Duplicate contract:', id)
              }}
              onDelete={(id) => {
                // TODO: Implement delete functionality
                console.log('Delete contract:', id)
              }}
              onExport={(id) => {
                // TODO: Implement export functionality
                console.log('Export contract:', id)
              }}
              onShare={(id) => {
                // TODO: Implement share functionality
                console.log('Share contract:', id)
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="products">
          <InfoCard
            title="Products"
            description="All products and services from this supplier"
            icon={<Users className="h-4 w-4" />}
          >
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="No products found"
              description="This supplier doesn't have any products yet. Add your first product to get started."
              action={{
                label: "Add Product",
                onClick: () => console.log("Add product"),
                icon: <Users className="h-4 w-4" />
              }}
            />
          </InfoCard>
        </TabsContent>

        <TabsContent value="bookings">
          <InfoCard
            title="Recent Bookings"
            description="Recent bookings and transactions with this supplier"
            icon={<TrendingUp className="h-4 w-4" />}
          >
            <EmptyState
              icon={<TrendingUp className="h-8 w-8 text-muted-foreground" />}
              title="No bookings found"
              description="This supplier doesn't have any bookings yet. Create your first booking to get started."
              action={{
                label: "Create Booking",
                onClick: () => console.log("Create booking"),
                icon: <TrendingUp className="h-4 w-4" />
              }}
            />
          </InfoCard>
        </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${supplier.name}"? This action cannot be undone and will permanently remove all associated data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
