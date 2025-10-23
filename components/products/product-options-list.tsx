"use client"

import React, { useState } from 'react'
import { DataTable } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EnterpriseInlineEdit, InlineTextEdit, InlineNumberEdit, InlineSelectEdit } from '@/components/common/EnterpriseInlineEdit'
import { 
  Edit, 
  Trash2, 
  Users, 
  Bed,
  Hash,
  Plus,
  GripVertical
} from 'lucide-react'
import type { ProductOption } from '@/lib/types/product'

interface ProductOptionsListProps {
  options: ProductOption[]
  onEdit: (option: ProductOption) => void
  onDelete: (option: ProductOption) => void
  onAdd: () => void
  onUpdate: (optionId: string, data: Partial<ProductOption>) => Promise<void>
  onReorder: (optionId: string, newSortOrder: number) => Promise<void>
  isLoading?: boolean
}

export function ProductOptionsList({ 
  options, 
  onEdit, 
  onDelete, 
  onAdd, 
  onUpdate,
  onReorder,
  isLoading 
}: ProductOptionsListProps) {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const columns = [
    {
      key: 'sort_order',
      header: '',
      render: (option: ProductOption) => (
        <div className="flex items-center cursor-move">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      )
    },
    {
      key: 'option_name',
      header: 'Option Name',
      render: (option: ProductOption) => (
        <div className="space-y-2">
          <InlineTextEdit
            value={option.option_name}
            onSave={(value) => onUpdate(option.id, { option_name: value })}
            placeholder="Enter option name"
            className="font-medium"
          />
          <InlineTextEdit
            value={option.option_code}
            onSave={(value) => onUpdate(option.id, { option_code: value })}
            placeholder="Enter option code"
            className="text-sm text-muted-foreground flex items-center gap-1"
          />
        </div>
      )
    },
    {
      key: 'occupancy',
      header: 'Occupancy',
      render: (option: ProductOption) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <InlineNumberEdit
              value={option.standard_occupancy}
              onSave={(value) => onUpdate(option.id, { standard_occupancy: parseInt(value) })}
              placeholder="Standard"
              className="w-16"
            />
            <span className="text-xs text-muted-foreground">standard</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <InlineNumberEdit
              value={option.max_occupancy}
              onSave={(value) => onUpdate(option.id, { max_occupancy: parseInt(value) })}
              placeholder="Max"
              className="w-16"
            />
            <span className="text-xs text-muted-foreground">max</span>
          </div>
        </div>
      )
    },
    {
      key: 'bed_configuration',
      header: 'Bed Configuration',
      render: (option: ProductOption) => (
        <div className="flex items-center gap-1 text-sm">
          <Bed className="h-4 w-4" />
          <InlineTextEdit
            value={option.bed_configuration || ''}
            onSave={(value) => onUpdate(option.id, { bed_configuration: value })}
            placeholder="Not specified"
          />
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (option: ProductOption) => (
        <InlineSelectEdit
          value={option.is_active ? 'active' : 'inactive'}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
          ]}
          onSave={(value) => onUpdate(option.id, { is_active: value === 'active' })}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (option: ProductOption) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(option)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(option)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading options...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Product Options</CardTitle>
          <Button onClick={onAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Option
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={options}
          searchKey="option_name"
          emptyMessage="No product options found"
        />
      </CardContent>
    </Card>
  )
}
