# Common Components Guide

This guide covers all the reusable common components available throughout the application.

## 🎨 **Visual Components**

### **StatusBadge** - Status indicators with icons
```tsx
import { StatusBadge } from '@/components/common/StatusBadge';

<StatusBadge
  status="active"
  label="Active"
  size="md"
  variant="default"
/>
```

**Props:**
- `status`: "active" | "inactive" | "pending" | "error" | "success" | "warning"
- `label`: Custom label (optional)
- `size`: "sm" | "md" | "lg"
- `variant`: "default" | "outline" | "secondary"

**Features:**
- ✅ **Automatic icons** for each status type
- ✅ **Color-coded** status indicators
- ✅ **Multiple sizes** for different contexts
- ✅ **Dark mode support**

### **InfoCard** - Enhanced card component
```tsx
import { InfoCard } from '@/components/common/InfoCard';

<InfoCard
  title="Contact Information"
  description="Primary contact details"
  icon={<Building className="h-4 w-4" />}
  variant="bordered"
>
  {/* Card content */}
</InfoCard>
```

**Props:**
- `title`: Card title
- `description`: Optional description
- `icon`: Optional icon
- `variant`: "default" | "bordered" | "elevated"
- `className`: Custom styling

**Features:**
- ✅ **Consistent styling** across the app
- ✅ **Icon support** with proper spacing
- ✅ **Multiple variants** for different contexts
- ✅ **Flexible content** area

### **DetailRow** - Structured information display
```tsx
import { DetailRow } from '@/components/common/DetailRow';

<DetailRow
  label="Email Address"
  value={<InlineEditComponent />}
  icon={<Mail className="h-4 w-4" />}
  variant="default"
/>
```

**Props:**
- `label`: Field label
- `value`: Field value (React node)
- `icon`: Optional icon
- `variant`: "default" | "compact" | "spacious"

**Features:**
- ✅ **Consistent layout** for form fields
- ✅ **Icon integration** with proper spacing
- ✅ **Flexible content** support
- ✅ **Multiple spacing** variants

### **StatsGrid** - Statistics display grid
```tsx
import { StatsGrid } from '@/components/common/StatsGrid';

<StatsGrid
  stats={[
    {
      id: 'total-bookings',
      label: 'Total Bookings',
      value: 150,
      icon: <TrendingUp className="h-4 w-4" />,
      description: 'All time bookings'
    }
  ]}
  columns={4}
/>
```

**Props:**
- `stats`: Array of stat items
- `columns`: 2 | 3 | 4
- `className`: Custom styling

**Features:**
- ✅ **Responsive grid** layout
- ✅ **Icon support** for each stat
- ✅ **Trend indicators** (up/down/neutral)
- ✅ **Flexible column** counts

### **PageHeader** - Standardized page headers
```tsx
import { PageHeader } from '@/components/common/PageHeader';

<PageHeader
  title="Supplier Details"
  subtitle="Manage supplier information"
  backButton={{
    onClick: () => router.back(),
    label: "Back"
  }}
  actions={<Button>Edit</Button>}
/>
```

**Props:**
- `title`: Page title (React node)
- `subtitle`: Optional subtitle (React node)
- `backButton`: Optional back button config
- `actions`: Optional action buttons

**Features:**
- ✅ **Consistent layout** across pages
- ✅ **Back button** integration
- ✅ **Action buttons** area
- ✅ **Flexible content** support

## 🎯 **Usage Examples**

### **Supplier Details Page**
```tsx
// Page Header
<PageHeader
  title={<SupplierInlineEdit />}
  subtitle={<SupplierInfo />}
  backButton={{ onClick: () => router.back() }}
  actions={<ActionButtons />}
/>

// Status Badge
<StatusBadge status={supplier.is_active ? "active" : "inactive"} />

// Stats Grid
<StatsGrid stats={supplierStats} columns={4} />

// Info Cards
<InfoCard
  title="Contact Information"
  icon={<Building className="h-4 w-4" />}
  variant="bordered"
>
  <DetailRow
    label="Email"
    value={<SupplierContactEdit />}
    icon={<Mail className="h-4 w-4" />}
  />
</InfoCard>
```

### **Product Details Page**
```tsx
<PageHeader
  title={<ProductInlineEdit />}
  subtitle={<ProductInfo />}
  actions={<ProductActions />}
/>

<StatusBadge status="active" />

<StatsGrid
  stats={[
    { id: 'price', label: 'Price', value: '$299', icon: <DollarSign /> },
    { id: 'stock', label: 'Stock', value: '45', icon: <Package /> }
  ]}
  columns={2}
/>
```

### **Customer Details Page**
```tsx
<InfoCard
  title="Customer Information"
  icon={<User className="h-4 w-4" />}
>
  <DetailRow
    label="Phone"
    value={<CustomerContactEdit />}
    icon={<Phone className="h-4 w-4" />}
  />
</InfoCard>
```

## 🎨 **Design System**

### **Color Coding**
- **Active/Success**: Green (`bg-green-100 text-green-800`)
- **Inactive/Error**: Red (`bg-red-100 text-red-800`)
- **Pending/Warning**: Yellow (`bg-yellow-100 text-yellow-800`)
- **Neutral**: Gray (`bg-gray-100 text-gray-800`)

### **Size Scale**
- **Small (sm)**: `text-xs px-2 py-0.5`
- **Medium (md)**: `text-sm px-2.5 py-1`
- **Large (lg)**: `text-base px-3 py-1.5`

### **Spacing**
- **Compact**: `space-y-0.5`
- **Default**: `space-y-1`
- **Spacious**: `space-y-2`

## 🔧 **Best Practices**

### **StatusBadge Usage**
```tsx
// ✅ Good - Clear status indication
<StatusBadge status="active" />

// ✅ Good - Custom label for clarity
<StatusBadge status="pending" label="Awaiting Approval" />

// ❌ Avoid - Redundant labels
<StatusBadge status="active" label="Active" />
```

### **InfoCard Usage**
```tsx
// ✅ Good - Descriptive title and icon
<InfoCard
  title="Payment Information"
  description="Billing and payment details"
  icon={<CreditCard className="h-4 w-4" />}
  variant="bordered"
>

// ✅ Good - Simple card
<InfoCard title="Basic Information">
  <DetailRow label="Name" value={name} />
</InfoCard>
```

### **DetailRow Usage**
```tsx
// ✅ Good - Clear label and icon
<DetailRow
  label="Email Address"
  value={<InlineEditComponent />}
  icon={<Mail className="h-4 w-4" />}
/>

// ✅ Good - Simple display
<DetailRow
  label="Created Date"
  value={formatDate(createdAt)}
/>
```

### **StatsGrid Usage**
```tsx
// ✅ Good - Meaningful stats with icons
<StatsGrid
  stats={[
    {
      id: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="h-4 w-4" />,
      description: 'This month'
    }
  ]}
  columns={3}
/>
```

## 🚀 **Advanced Features**

### **Custom Styling**
```tsx
<StatusBadge
  status="active"
  className="custom-status-badge"
/>

<InfoCard
  className="custom-info-card"
  headerClassName="custom-header"
  contentClassName="custom-content"
/>
```

### **Responsive Design**
```tsx
<StatsGrid
  stats={stats}
  columns={4} // Automatically responsive
  className="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
/>
```

### **Integration with Inline Editing**
```tsx
<DetailRow
  label="Supplier Name"
  value={
    <SupplierInlineEdit
      supplier={supplier}
      field="name"
      label="Supplier Name"
      size="sm"
      variant="underline"
    />
  }
  icon={<Building className="h-4 w-4" />}
/>
```

## 📱 **Mobile Responsiveness**

All components are fully responsive:
- **StatusBadge**: Scales appropriately on mobile
- **InfoCard**: Stacks properly on small screens
- **DetailRow**: Maintains readability on mobile
- **StatsGrid**: Responsive grid layout
- **PageHeader**: Mobile-friendly action layout

## 🎯 **Accessibility**

All components include:
- ✅ **Proper ARIA labels**
- ✅ **Keyboard navigation**
- ✅ **Screen reader support**
- ✅ **Color contrast** compliance
- ✅ **Focus management**

## 🔄 **Reusability**

These components can be used for:
- ✅ **Suppliers** (already implemented)
- ✅ **Products** (ready to use)
- ✅ **Customers** (ready to use)
- ✅ **Bookings** (ready to use)
- ✅ **Contracts** (ready to use)
- ✅ **Any entity** in your application

This comprehensive component system provides consistent, professional UI elements throughout your entire application! 🎉
