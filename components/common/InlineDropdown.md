# InlineDropdown Component

A reusable component for inline dropdown editing with automatic saving, loading states, and toast notifications.

## Basic Usage

```tsx
import { InlineDropdown } from '@/components/common/InlineDropdown'

const options = [
  { value: 'option1', label: 'Option 1', icon: <Icon /> },
  { value: 'option2', label: 'Option 2', icon: <Icon /> }
]

<InlineDropdown
  value={currentValue}
  onValueChange={async (newValue) => {
    // Handle the value change
    await updateValue(newValue)
  }}
  options={options}
  successMessage="Value updated successfully"
/>
```

## Preset Components

### ContractStatusDropdown
```tsx
import { ContractStatusDropdown } from '@/components/common/InlineDropdown'

<ContractStatusDropdown
  value={contract.status}
  onValueChange={async (status) => {
    await updateContractStatus(contract.id, status)
  }}
/>
```

### ContractTypeDropdown
```tsx
import { ContractTypeDropdown } from '@/components/common/InlineDropdown'

<ContractTypeDropdown
  value={contract.type}
  onValueChange={async (type) => {
    await updateContractType(contract.id, type)
  }}
/>
```

### DeadlineStatusDropdown
```tsx
import { DeadlineStatusDropdown } from '@/components/common/InlineDropdown'

<DeadlineStatusDropdown
  value={deadline.status}
  onValueChange={async (status) => {
    await updateDeadlineStatus(deadline.id, status)
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Current selected value |
| `onValueChange` | `(value: string) => Promise<void> \| void` | - | Handler for value changes |
| `options` | `InlineDropdownOption[]` | - | Array of dropdown options |
| `placeholder` | `string` | "Select an option" | Placeholder text |
| `disabled` | `boolean` | `false` | Whether the dropdown is disabled |
| `className` | `string` | - | Additional CSS classes |
| `triggerClassName` | `string` | - | CSS classes for the trigger |
| `loading` | `boolean` | `false` | External loading state |
| `successMessage` | `string` | "Updated successfully" | Success toast message |
| `errorMessage` | `string` | "Failed to update" | Error toast message |

## Option Interface

```tsx
interface InlineDropdownOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}
```

## Features

- **Automatic saving** with loading states
- **Toast notifications** for success/error feedback
- **Icon support** for visual options
- **Description support** for detailed options
- **Error handling** with user-friendly messages
- **Loading states** to prevent multiple simultaneous changes
- **Accessibility** with proper ARIA labels
