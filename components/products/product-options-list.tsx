"use client"

import React from 'react'
import { DataTable } from '@/components/common/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  Users, 
  Bed,
  Hash,
  Plus
} from 'lucide-react'
import type { ProductOption } from '@/lib/types/product'

interface ProductOptionsListProps {
  options: ProductOption[]
  onEdit: (option: ProductOption) => void
  onDelete: (option: ProductOption) => void
  onAdd: () => void
  isLoading?: boolean
}

export function ProductOptionsList({ 
  options, 
  onEdit, 
  onDelete, 
  onAdd, 
  isLoading 
}: ProductOptionsListProps) {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const columns = [
    {
      key: 'option_name',
      header: 'Option Name',
      render: (option: ProductOption) => (
        <div className="space-y-1">
          <div className="font-medium">{option.option_name}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {option.option_code}
          </div>
        </div>
      )
    },
    {
      key: 'occupancy',
      header: 'Occupancy',
      render: (option: ProductOption) => (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Standard: {option.standard_occupancy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>Max: {option.max_occupancy}</span>
          </div>
        </div>
      )
    },
    {
      key: 'bed_configuration',
      header: 'Bed Configuration',
      render: (option: ProductOption) => (
        <div className="flex items-center gap-1 text-sm">
          {option.bed_configuration ? (
            <>
              <Bed className="h-4 w-4" />
              <span>{option.bed_configuration}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Not specified</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (option: ProductOption) => (
        <Badge className={getStatusColor(option.is_active)}>
          {option.is_active ? 'Active' : 'Inactive'}
        </Badge>
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
