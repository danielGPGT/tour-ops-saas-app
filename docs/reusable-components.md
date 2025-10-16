# Reusable Components Guide

This document outlines the reusable components extracted from the suppliers page that can be used across different entity management pages (contracts, products, etc.).

## 🎯 Overview

We've extracted the following reusable components from the suppliers page:

1. **`DataTable`** - Generic table with bulk selection
2. **`BulkActions`** - Generic bulk action bar
3. **`Pagination`** - Reusable pagination controls
4. **`SummaryCards`** - Dashboard-style summary cards
5. **`SearchBar`** - Debounced search input
6. **`EntityPageLayout`** - Complete page layout template

## 📊 DataTable Component

### Usage

```tsx
import { DataTable, DataTableColumn } from "@/components/common/DataTable";

const columns: DataTableColumn<Contract>[] = [
  {
    key: "name",
    header: "Contract Name",
    width: "w-[200px]",
    render: (contract) => (
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        <span className="font-medium">{contract.name}</span>
      </div>
    )
  },
  {
    key: "status",
    header: "Status",
    width: "w-[100px]",
    render: (contract) => (
      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
        {contract.status}
      </Badge>
    )
  }
];

<DataTable
  data={contracts}
  columns={columns}
  selectedItems={selectedContracts}
  onSelectionChange={setSelectedContracts}
  getId={(contract) => contract.id.toString()}
  emptyState={{
    icon: <FileText className="h-8 w-8" />,
    title: "No contracts found",
    description: "Create your first contract"
  }}
/>
```

### Features

- ✅ Bulk selection with "select all"
- ✅ Custom column rendering
- ✅ Automatic date formatting
- ✅ Array value display with overflow
- ✅ Empty state support
- ✅ Indeterminate checkbox state

## ⚡ BulkActions Component

### Usage

```tsx
import { BulkActions, BulkAction } from "@/components/common/BulkActions";

const bulkActions: BulkAction<Contract>[] = [
  {
    id: "edit",
    label: "Edit",
    icon: <Pencil className="h-3 w-3" />,
    onClick: (contracts) => handleBulkEdit(contracts)
  },
  {
    id: "delete",
    label: "Delete",
    icon: <Trash2 className="h-3 w-3" />,
    variant: "destructive",
    requiresConfirmation: true,
    confirmationTitle: "Delete Contracts",
    confirmationDescription: (contracts) => 
      `Delete ${contracts.length} contracts? This cannot be undone.`,
    onClick: (contracts) => handleBulkDelete(contracts)
  }
];

<BulkActions
  selectedItems={selectedContracts}
  actions={bulkActions}
  getItemName={(contract) => contract.name}
  getItemId={(contract) => contract.id.toString()}
  entityName="contract"
  onSelectionClear={() => setSelectedContracts([])}
/>
```

### Features

- ✅ Customizable actions
- ✅ Confirmation dialogs for destructive actions
- ✅ Loading states
- ✅ Primary and secondary action grouping
- ✅ Item preview in confirmations

## 📄 Pagination Component

### Usage

```tsx
import { Pagination } from "@/components/common/Pagination";

<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={totalCount}
  itemsPerPage={20}
  onPageChange={setPage}
  searchParams={{ q: searchQuery }}
/>
```

### Features

- ✅ Previous/Next navigation
- ✅ Page counter
- ✅ Item count display
- ✅ URL-based navigation
- ✅ Search param preservation

## 📈 SummaryCards Component

### Usage

```tsx
import { SummaryCards, SummaryCard } from "@/components/common/SummaryCards";

const summaryCards: SummaryCard[] = [
  {
    id: "total",
    title: "Total Contracts",
    value: 150,
    icon: <FileText className="h-4 w-4 text-primary" />,
    description: "Active agreements",
    trend: {
      value: "Growing network",
      icon: <TrendingUp className="h-3 w-3 text-green-600" />
    },
    iconBackgroundColor: "bg-primary/10"
  }
];

<SummaryCards cards={summaryCards} />
```

### Features

- ✅ Customizable icons and colors
- ✅ Trend indicators
- ✅ Number formatting
- ✅ Responsive grid layout

## 🔍 SearchBar Component

### Usage

```tsx
import { SearchBar } from "@/components/common/SearchBar";

<SearchBar
  placeholder="Search contracts..."
  searchParam="q"
  debounceMs={300}
  showClearButton={true}
/>
```

### Features

- ✅ Debounced search
- ✅ URL synchronization
- ✅ Clear button
- ✅ Loading indicator
- ✅ Browser navigation support

## 🏗️ EntityPageLayout Component

### Usage

```tsx
import { EntityPageLayout } from "@/components/common/EntityPageLayout";

<EntityPageLayout
  title="Contracts"
  subtitle="150 total • 120 active"
  searchPlaceholder="Search contracts..."
  data={contracts}
  columns={columns}
  selectedItems={selectedContracts}
  onSelectionChange={setSelectedContracts}
  getId={(contract) => contract.id.toString()}
  bulkActions={bulkActions}
  getItemName={(contract) => contract.name}
  getItemId={(contract) => contract.id.toString()}
  entityName="contract"
  onSelectionClear={() => setSelectedContracts([])}
  currentPage={page}
  totalPages={totalPages}
  totalItems={totalCount}
  itemsPerPage={20}
  onPageChange={setPage}
  summaryCards={summaryCards}
  primaryAction={{
    label: "Add Contract",
    icon: <Plus className="h-3 w-3" />,
    onClick: () => setCreateModalOpen(true)
  }}
  searchQuery={searchQuery}
  onClearSearch={() => router.push('/contracts')}
>
  {/* Custom modals and forms */}
  <CreateContractModal />
  <BulkEditModal />
</EntityPageLayout>
```

### Features

- ✅ Complete page structure
- ✅ Integrated search, table, pagination
- ✅ Bulk actions integration
- ✅ Summary cards
- ✅ Custom content slots
- ✅ Search results display

## 🚀 Migration Guide

### From Suppliers Page

To migrate the suppliers page to use these components:

1. **Replace SuppliersTable** with `DataTable`
2. **Replace BulkActions** with generic `BulkActions`
3. **Replace pagination logic** with `Pagination` component
4. **Replace summary cards** with `SummaryCards`
5. **Use `EntityPageLayout`** to wrap everything

### For New Pages (Contracts, Products, etc.)

1. **Define your data types** (Contract, Product, etc.)
2. **Create column definitions** using `DataTableColumn`
3. **Define bulk actions** using `BulkAction`
4. **Create summary cards** using `SummaryCard`
5. **Use `EntityPageLayout`** as your page wrapper

## 📋 Example: Contracts Page

```tsx
// app/contracts/page.tsx
export default async function ContractsPage({ searchParams }) {
  // Server-side data fetching logic
  const contracts = await getContracts(searchParams);
  
  return (
    <ContractsPageClient
      contracts={contracts}
      searchParams={searchParams}
      // ... other props
    />
  );
}

// components/contracts/ContractsPageClient.tsx
export function ContractsPageClient({ contracts, searchParams }) {
  const [selectedContracts, setSelectedContracts] = useState([]);
  
  return (
    <EntityPageLayout
      title="Contracts"
      data={contracts}
      columns={contractColumns}
      selectedItems={selectedContracts}
      onSelectionChange={setSelectedContracts}
      getId={(contract) => contract.id.toString()}
      bulkActions={contractBulkActions}
      getItemName={(contract) => contract.name}
      getItemId={(contract) => contract.id.toString()}
      entityName="contract"
      onSelectionClear={() => setSelectedContracts([])}
      // ... other props
    >
      <CreateContractModal />
      <BulkEditModal />
    </EntityPageLayout>
  );
}
```

## 🎯 Benefits

### ✅ Consistency
- Uniform UI patterns across all entity pages
- Consistent user experience
- Standardized interactions

### ✅ Maintainability
- Single source of truth for common patterns
- Easier to update and fix issues
- Reduced code duplication

### ✅ Development Speed
- Faster implementation of new entity pages
- Less boilerplate code
- Focus on business logic, not UI patterns

### ✅ Quality
- Battle-tested components from suppliers page
- Comprehensive error handling
- Accessibility built-in

## 🔧 Customization

All components are highly customizable:

- **Styling**: Use className props and Tailwind classes
- **Behavior**: Custom render functions and event handlers
- **Content**: Custom icons, labels, and descriptions
- **Layout**: Responsive grid and spacing options

This reusable component system will significantly speed up development of the contracts page and future entity management pages! 🚀
