'use client'

import React from 'react'
import { EntityInlineEdit } from '@/components/common/EntityInlineEdit'
import type { Contract } from '@/lib/types/contract'

interface ContractInlineEditProps {
  contract: Contract
  field: keyof Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  placeholder?: string
  multiline?: boolean
  type?: 'text' | 'email' | 'url' | 'number' | 'date' | 'select' | 'textarea'
  options?: Array<{ value: string; label: string }>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  emptyValue?: string
}

export function ContractInlineEdit({
  contract,
  field,
  onUpdate,
  placeholder,
  multiline = false,
  type = 'text',
  options,
  size = 'md',
  variant = 'default',
  emptyValue = 'Not set'
}: ContractInlineEditProps) {
  const value = contract[field]
  const displayValue = value || emptyValue

  return (
    <EntityInlineEdit
      value={displayValue}
      onSave={(newValue) => onUpdate(field, newValue)}
      placeholder={placeholder}
      multiline={multiline}
      type={type}
      options={options}
      size={size}
      variant={variant}
      emptyValue={emptyValue}
    />
  )
}

interface ContractFinancialEditProps {
  contract: Contract
  field: keyof Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  placeholder?: string
  type?: 'text' | 'number' | 'select'
  options?: Array<{ value: string; label: string }>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  emptyValue?: string
}

export function ContractFinancialEdit({
  contract,
  field,
  onUpdate,
  placeholder,
  type = 'text',
  options,
  size = 'md',
  variant = 'default',
  emptyValue = 'Not set'
}: ContractFinancialEditProps) {
  const value = contract[field]
  const displayValue = value || emptyValue

  return (
    <EntityInlineEdit
      value={displayValue}
      onSave={(newValue) => onUpdate(field, newValue)}
      placeholder={placeholder}
      type={type}
      options={options}
      size={size}
      variant={variant}
      emptyValue={emptyValue}
    />
  )
}

interface ContractStatusEditProps {
  contract: Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function ContractStatusEdit({
  contract,
  onUpdate,
  size = 'md',
  variant = 'default'
}: ContractStatusEditProps) {
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'suspended', label: 'Suspended' }
  ]

  return (
    <EntityInlineEdit
      value={contract.status}
      onSave={(newValue) => onUpdate('status', newValue)}
      type="select"
      options={statusOptions}
      size={size}
      variant={variant}
      placeholder="Select status"
    />
  )
}

interface ContractTypeEditProps {
  contract: Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function ContractTypeEdit({
  contract,
  onUpdate,
  size = 'md',
  variant = 'default'
}: ContractTypeEditProps) {
  const typeOptions = [
    { value: 'net_rate', label: 'Net Rate' },
    { value: 'commissionable', label: 'Commissionable' },
    { value: 'allocation', label: 'Allocation' },
    { value: 'on_request', label: 'On Request' }
  ]

  return (
    <EntityInlineEdit
      value={contract.contract_type}
      onSave={(newValue) => onUpdate('contract_type', newValue)}
      type="select"
      options={typeOptions}
      size={size}
      variant={variant}
      placeholder="Select contract type"
    />
  )
}

interface ContractCommissionTypeEditProps {
  contract: Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function ContractCommissionTypeEdit({
  contract,
  onUpdate,
  size = 'md',
  variant = 'default'
}: ContractCommissionTypeEditProps) {
  const commissionTypeOptions = [
    { value: 'percentage', label: 'Percentage' },
    { value: 'fixed_amount', label: 'Fixed Amount' },
    { value: 'tiered', label: 'Tiered' },
    { value: 'none', label: 'None' }
  ]

  return (
    <EntityInlineEdit
      value={contract.commission_type}
      onSave={(newValue) => onUpdate('commission_type', newValue)}
      type="select"
      options={commissionTypeOptions}
      size={size}
      variant={variant}
      placeholder="Select commission type"
    />
  )
}

interface ContractCurrencyEditProps {
  contract: Contract
  onUpdate: (field: string, value: string | number | boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function ContractCurrencyEdit({
  contract,
  onUpdate,
  size = 'md',
  variant = 'default'
}: ContractCurrencyEditProps) {
  const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'AED', label: 'AED - UAE Dirham' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CHF', label: 'CHF - Swiss Franc' }
  ]

  return (
    <EntityInlineEdit
      value={contract.currency}
      onSave={(newValue) => onUpdate('currency', newValue)}
      type="select"
      options={currencyOptions}
      size={size}
      variant={variant}
      placeholder="Select currency"
    />
  )
}
