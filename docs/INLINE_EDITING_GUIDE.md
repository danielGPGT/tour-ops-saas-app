# Enterprise Inline Editing Components

This guide shows how to use the enterprise-level inline editing components throughout the application.

## 🚀 **Core Components**

### **1. EntityInlineEdit** - For direct entity fields
```tsx
import { EntityInlineEdit } from '@/components/common/EntityInlineEdit';

<EntityInlineEdit
  entity={supplier}
  field="name"
  onUpdate={handleUpdate}
  label="Supplier Name"
  placeholder="Enter supplier name"
  className="text-2xl font-bold"
  emptyValue="Unnamed Supplier"
  size="lg"
  variant="minimal"
  validation={(value) => {
    if (!value.trim()) return "Name is required";
    return null;
  }}
/>
```

### **2. EntityNestedFieldEdit** - For nested object fields
```tsx
import { EntityNestedFieldEdit } from '@/components/common/EntityInlineEdit';

<EntityNestedFieldEdit
  entity={supplier}
  field="contact_info"
  nestedField="email"
  onUpdate={handleUpdate}
  label="Email"
  placeholder="Enter email address"
  className="text-sm"
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
```

### **3. EntityBooleanEdit** - For boolean fields
```tsx
import { EntityBooleanEdit } from '@/components/common/EntityInlineEdit';

<EntityBooleanEdit
  entity={supplier}
  field="is_active"
  onUpdate={handleUpdate}
  label="Status"
  trueLabel="Active"
  falseLabel="Inactive"
  className="text-sm"
  size="sm"
  variant="minimal"
/>
```

## 🎨 **Visual Variants**

### **Minimal** - Subtle hover effects
```tsx
<EntityInlineEdit
  variant="minimal"
  // Clean, minimal appearance with subtle hover
/>
```

### **Underline** - Dashed underline on hover
```tsx
<EntityInlineEdit
  variant="underline"
  // Dashed underline that appears on hover
/>
```

### **Card** - Card-like appearance
```tsx
<EntityInlineEdit
  variant="card"
  // Border and shadow effects like a card
/>
```

### **Default** - Standard appearance
```tsx
<EntityInlineEdit
  variant="default"
  // Standard border and background effects
/>
```

## 📏 **Size Options**

### **Small** - Compact for secondary info
```tsx
<EntityInlineEdit
  size="sm"
  // text-xs, compact spacing
/>
```

### **Medium** - Standard size
```tsx
<EntityInlineEdit
  size="md"
  // text-sm, standard spacing
/>
```

### **Large** - Prominent for important fields
```tsx
<EntityInlineEdit
  size="lg"
  // text-base, larger spacing
/>
```

## 🔧 **Specialized Wrappers**

### **Supplier Components**
```tsx
import { 
  SupplierInlineEdit, 
  SupplierContactEdit, 
  SupplierPaymentEdit,
  SupplierStatusEdit 
} from '@/components/suppliers/SupplierInlineEditWrapper';

// Direct supplier fields
<SupplierInlineEdit
  supplier={supplier}
  field="name"
  label="Supplier Name"
  size="lg"
  variant="minimal"
/>

// Contact information
<SupplierContactEdit
  supplier={supplier}
  field="email"
  label="Email"
  size="sm"
  variant="underline"
/>

// Payment terms
<SupplierPaymentEdit
  supplier={supplier}
  field="payment_method"
  label="Payment Method"
  size="sm"
  variant="card"
/>

// Status toggle
<SupplierStatusEdit
  supplier={supplier}
  size="sm"
  variant="minimal"
/>
```

## ✨ **Advanced Features**

### **Multiline Support**
```tsx
<EntityInlineEdit
  multiline={true}
  // Supports multi-line text editing
/>
```

### **Real-time Validation**
```tsx
<EntityInlineEdit
  validation={(value) => {
    if (!value.trim()) return "This field is required";
    if (value.length < 3) return "Must be at least 3 characters";
    if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces allowed";
    return null;
  }}
/>
```

### **Custom Styling**
```tsx
<EntityInlineEdit
  className="text-2xl font-bold text-blue-600"
  emptyValue="Click to add title"
  maxLength={100}
/>
```

### **Loading States**
```tsx
<EntityInlineEdit
  loading={isUpdating}
  disabled={!canEdit}
/>
```

## 🎯 **Usage Examples**

### **Product Name (Large, Prominent)**
```tsx
<EntityInlineEdit
  entity={product}
  field="name"
  onUpdate={updateProduct}
  label="Product Name"
  className="text-3xl font-bold"
  emptyValue="Untitled Product"
  size="lg"
  variant="minimal"
/>
```

### **Product Description (Multiline)**
```tsx
<EntityInlineEdit
  entity={product}
  field="description"
  onUpdate={updateProduct}
  label="Description"
  multiline={true}
  className="text-sm"
  emptyValue="No description"
  size="md"
  variant="card"
/>
```

### **Product Price (Numeric with validation)**
```tsx
<EntityInlineEdit
  entity={product}
  field="price"
  onUpdate={updateProduct}
  label="Price"
  placeholder="Enter price"
  className="text-lg font-semibold"
  validation={(value) => {
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      return "Please enter a valid positive number";
    }
    return null;
  }}
  size="md"
  variant="underline"
/>
```

### **Product Status (Boolean)**
```tsx
<EntityBooleanEdit
  entity={product}
  field="is_active"
  onUpdate={updateProduct}
  label="Status"
  trueLabel="Available"
  falseLabel="Unavailable"
  size="sm"
  variant="minimal"
/>
```

## 🔄 **Update Handler Pattern**

```tsx
const handleUpdate = async (id: string, data: Partial<EntityType>) => {
  try {
    await updateEntity.mutateAsync({ id, data });
    toast.success('Updated successfully');
  } catch (error) {
    console.error('Error updating:', error);
    toast.error('Failed to update');
    throw error; // Re-throw to let component handle error state
  }
};
```

## 🎨 **Styling Guidelines**

### **Headings and Titles**
- Use `size="lg"` and `variant="minimal"`
- Apply custom font classes: `className="text-3xl font-bold"`

### **Secondary Information**
- Use `size="sm"` and `variant="underline"`
- Keep styling subtle: `className="text-muted-foreground"`

### **Form Fields**
- Use `size="md"` and `variant="card"`
- Apply consistent spacing and borders

### **Status Fields**
- Use `size="sm"` and `variant="minimal"`
- Keep boolean editing simple and clear

## 🚀 **Best Practices**

1. **Always provide meaningful labels** for accessibility
2. **Use appropriate validation** for data integrity
3. **Choose the right variant** for the context
4. **Handle loading states** for better UX
5. **Provide helpful empty values** for better UX
6. **Use consistent sizing** throughout the application
7. **Test keyboard shortcuts** (Enter to save, Escape to cancel)

## 🎯 **Keyboard Shortcuts**

- **Enter** - Save changes (single-line fields)
- **Shift+Enter** - New line (multiline fields)
- **Escape** - Cancel changes
- **Click outside** - Auto-save after delay

## 🔧 **Technical Features**

- **Real-time validation** with error display
- **Auto-save on blur** with configurable delay
- **Loading states** with spinner animations
- **Error handling** with rollback capability
- **Accessibility** compliant with ARIA labels
- **Mobile responsive** design
- **TypeScript** fully typed
- **Professional animations** and transitions

This system provides enterprise-level inline editing that can be used consistently across the entire application! 🎉
