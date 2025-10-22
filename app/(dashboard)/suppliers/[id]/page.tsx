'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Building, Phone, Mail, Globe, MapPin, Star, TrendingUp, DollarSign, Calendar, Users, FileText, Copy, Download, Share2 } from 'lucide-react'

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
import { formatDate } from '@/lib/utils/formatting'
import { 
  SupplierInlineEdit, 
  SupplierContactEdit, 
  SupplierPaymentEdit,
  SupplierStatusEdit 
} from '@/components/suppliers/SupplierInlineEditWrapper'
import { PageSkeleton } from '@/components/common/LoadingSkeleton'

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const { data: supplier, isLoading } = useSupplier(supplierId)
  const deleteSupplier = useDeleteSupplier()

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

  const { contact_info, payment_terms } = supplier

  // Prepare stats data
  const stats = [
    {
      id: 'total-bookings',
      label: 'Total Bookings',
      value: supplier.total_bookings || 0,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'All time bookings'
    },
    {
      id: 'commission-rate',
      label: 'Commission Rate',
      value: supplier.commission_rate ? `${supplier.commission_rate}%` : '0%',
      icon: <DollarSign className="h-4 w-4" />,
      description: 'Current rate'
    },
    {
      id: 'rating',
      label: 'Rating',
      value: supplier.rating ? `${supplier.rating}/5` : 'No rating',
      icon: <Star className="h-4 w-4" />,
      description: 'Supplier rating'
    },
    {
      id: 'created-date',
      label: 'Created',
      value: formatDate(supplier.created_at),
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
            className="text-xl font-bold tracking-tight"
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
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <SupplierInlineEdit
                    supplier={supplier}
                    field="rating"
                    label="Rating"
                    placeholder="Enter rating (1-5)"
                    className="text-muted-foreground"
                    emptyValue="No rating"
                    size="sm"
                    variant="minimal"
                    validation={(value) => {
                      const num = Number(value);
                      if (value && (isNaN(num) || num < 1 || num > 5)) {
                        return "Rating must be between 1 and 5";
                      }
                      return null;
                    }}
                  />
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
            Last updated: {formatDate(supplier.updated_at)}
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
                    <SupplierContactEdit
                      supplier={supplier}
                      field="email"
                      label="Email"
                      placeholder="Enter email address"
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
                    <SupplierContactEdit
                      supplier={supplier}
                      field="phone"
                      label="Phone"
                      placeholder="Enter phone number"
                      className="text-sm font-medium"
                      emptyValue="No phone"
                      size="sm"
                      variant="underline"
                    />
                  }
                  icon={<Phone className="h-4 w-4" />}
                />
                
                <DetailRow
                  label="Website"
                  value={
                    <SupplierContactEdit
                      supplier={supplier}
                      field="website"
                      label="Website"
                      placeholder="Enter website URL"
                      className="text-sm font-medium"
                      emptyValue="No website"
                      size="sm"
                      variant="underline"
                      validation={(value) => {
                        if (value && !/^https?:\/\/.+/.test(value)) {
                          return "Please enter a valid URL (include http:// or https://)";
                        }
                        return null;
                      }}
                    />
                  }
                  icon={<Globe className="h-4 w-4" />}
                />
                
                <DetailRow
                  label="Address"
                  value={
                    <SupplierContactEdit
                      supplier={supplier}
                      field="address"
                      label="Address"
                      placeholder="Enter full address"
                      className="text-sm font-medium"
                      multiline
                      emptyValue="No address"
                      size="sm"
                      variant="underline"
                    />
                  }
                  icon={<MapPin className="h-4 w-4" />}
                />
              </div>
            </InfoCard>

            {/* Payment Terms */}
            <InfoCard
              title="Payment Terms"
              description="Payment methods and credit terms"
              icon={<DollarSign className="h-4 w-4" />}
              variant="default"
              className="h-fit"
            >
              <div className="space-y-4">
                <DetailRow
                  label="Payment Method"
                  value={
                    <SupplierPaymentEdit
                      supplier={supplier}
                      field="payment_method"
                      label="Payment Method"
                      placeholder="Enter payment method"
                      className="text-sm font-medium"
                      emptyValue="Not specified"
                      size="sm"
                      variant="card"
                    />
                  }
                />
                
                <DetailRow
                  label="Credit Days"
                  value={
                    <SupplierPaymentEdit
                      supplier={supplier}
                      field="credit_days"
                      label="Credit Days"
                      placeholder="Enter credit days"
                      className="text-sm font-medium"
                      emptyValue="0"
                      size="sm"
                      variant="card"
                      validation={(value) => {
                        if (value && isNaN(Number(value))) {
                          return "Please enter a valid number";
                        }
                        return null;
                      }}
                    />
                  }
                />
                
                <DetailRow
                  label="Additional Terms"
                  value={
                    <SupplierPaymentEdit
                      supplier={supplier}
                      field="terms"
                      label="Additional Terms"
                      placeholder="Enter additional payment terms"
                      className="text-sm font-medium"
                      multiline
                      emptyValue="No additional terms"
                      size="sm"
                      variant="card"
                    />
                  }
                />
              </div>
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          <InfoCard
            title="Contracts"
            description="All contracts and agreements with this supplier"
            icon={<FileText className="h-4 w-4" />}
          >
            <EmptyState
              icon={<FileText className="h-8 w-8 text-muted-foreground" />}
              title="No contracts found"
              description="This supplier doesn't have any contracts yet. Create your first contract to get started."
              action={{
                label: "Create Contract",
                onClick: () => console.log("Create contract"),
                icon: <FileText className="h-4 w-4" />
              }}
            />
          </InfoCard>
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
