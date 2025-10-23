'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Copy, Trash2, GripVertical, Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, DataTableColumn } from '@/components/common/DataTable'
import { EnterpriseInlineEdit } from '@/components/common/EnterpriseInlineEdit'
import { InlineDropdown } from '@/components/common/InlineDropdown'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUpdateProductOption, useDeleteProductOption, useDuplicateProductOption, useReorderProductOptions } from '@/lib/hooks/useProductOptions'
import type { ProductOption } from '@/lib/types/product-option'

interface OptionsTableProps {
  options: ProductOption[]
  productType: string
  onEdit: (option: ProductOption) => void
}

// Sortable Table Row Component
function SortableTableRow({ 
  option, 
  productType, 
  onEdit, 
  onDelete, 
  onDuplicate 
}: {
  option: ProductOption
  productType: string
  onEdit: (option: ProductOption) => void
  onDelete: (option: ProductOption) => void
  onDuplicate: (option: ProductOption) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`hover:bg-primary/5 cursor-pointer ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20 opacity-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <TableCell>
        <div 
          {...attributes}
          {...listeners}
          className="flex items-center justify-center p-1 hover:bg-muted rounded cursor-grab"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      
      {/* Option Name */}
      <TableCell>
        <div className="flex flex-col">
          <div className="font-medium">{option.option_name}</div>
          <div className="text-xs text-muted-foreground font-mono">{option.option_code}</div>
        </div>
      </TableCell>
      
      {/* Type-specific columns */}
      {productType === 'accommodation' && (
        <>
          <TableCell>
            <span className="text-sm">
              {(option.attributes as any)?.bed_configuration || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm">
              {option.standard_occupancy}/{option.max_occupancy}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm text-muted-foreground">
              {(option.attributes as any)?.room_size_sqm && `${(option.attributes as any).room_size_sqm}m²`}
              {(option.attributes as any)?.view_type && ` • ${(option.attributes as any).view_type}`}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'event' && (
        <>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.ticket_type?.replace('_', ' ') || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm uppercase">
              {(option.attributes as any)?.access_level || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm">
              {(option.attributes as any)?.section || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {/* Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            option.is_active ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm">
            {option.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(option)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(option)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(option)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

interface OptionsTableProps {
  options: ProductOption[]
  productType: string
  onEdit: (option: ProductOption) => void
}

export function OptionsTable({ options, productType, onEdit }: OptionsTableProps) {
  const [deletingOption, setDeletingOption] = useState<ProductOption | null>(null)
  const updateOption = useUpdateProductOption()
  const deleteOption = useDeleteProductOption()
  const duplicateOption = useDuplicateProductOption()
  const reorderOptions = useReorderProductOptions()

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      await updateOption.mutateAsync({
        id,
        data: { [field]: value }
      })
    } catch (error) {
      console.error('Error updating option:', error)
    }
  }

  const handleDelete = async (option: ProductOption) => {
    if (confirm(`Are you sure you want to delete "${option.option_name}"? This action cannot be undone.`)) {
      try {
        await deleteOption.mutateAsync({
          id: option.id,
          productId: option.product_id
        })
      } catch (error) {
        console.error('Error deleting option:', error)
      }
    }
  }

  const handleDuplicate = async (option: ProductOption) => {
    try {
      await duplicateOption.mutateAsync({
        id: option.id,
        productId: option.product_id
      })
    } catch (error) {
      console.error('Error duplicating option:', error)
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: any) => {
    console.log('🚀 DRAG STARTED:', event.active.id)
  }

  const handleDragOver = (event: any) => {
    console.log('🔄 DRAG OVER:', event.over?.id)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    console.log('🏁 DRAG ENDED:', { active: active.id, over: over?.id })

    if (!over || active.id === over.id) {
      console.log('❌ No valid drop target or same position')
      return
    }

    const oldIndex = options.findIndex((item) => item.id === active.id)
    const newIndex = options.findIndex((item) => item.id === over.id)

    console.log('📍 Indices:', { oldIndex, newIndex })

    if (oldIndex === -1 || newIndex === -1) {
      console.log('❌ Invalid indices')
      return
    }

    try {
      // Create new array with reordered items
      const newOptions = arrayMove(options, oldIndex, newIndex)
      console.log('✅ New order:', newOptions.map(o => o.option_name))
      
      await reorderOptions.mutateAsync({
        productId: options[0]?.product_id || '',
        optionIds: newOptions.map(option => option.id)
      })
    } catch (error) {
      console.error('❌ Error reordering options:', error)
    }
  }

  // Dynamic columns based on product type
  const getColumns = (): DataTableColumn<ProductOption>[] => {
    const baseColumns: DataTableColumn<ProductOption>[] = [
           {
             key: 'drag',
             header: '',
             width: 'w-[40px]',
             render: (item, index) => (
               <div className="flex items-center justify-center">
                 <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab hover:text-foreground" />
               </div>
             )
           },
      {
        key: 'option_name',
        header: 'Option Name',
        width: 'w-[250px]',
        render: (item) => (
          <div className="flex flex-col">
            <EnterpriseInlineEdit
              value={item.option_name}
              onSave={(value) => handleUpdate(item.id, 'option_name', value)}
              className="font-medium"
              placeholder="Enter option name"
            />
            <span className="text-xs text-muted-foreground font-mono">{item.option_code}</span>
          </div>
        )
      },
      {
        key: 'is_active',
        header: 'Status',
        width: 'w-[100px]',
        render: (item) => (
          <InlineDropdown
            value={item.is_active ? 'active' : 'inactive'}
            onValueChange={(value) => handleUpdate(item.id, 'is_active', value === 'active')}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        )
      },
      {
        key: 'actions',
        header: '',
        width: 'w-[50px]',
        render: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(item)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    ]

    // Add type-specific columns
    if (productType === 'accommodation') {
      return [
        ...baseColumns.slice(0, 2), // drag, option_name
        {
          key: 'bed_configuration',
          header: 'Bed Configuration',
          width: 'w-[180px]',
          render: (item) => (
            <span className="text-sm">
              {(item.attributes as any)?.bed_configuration || '—'}
            </span>
          )
        },
        {
          key: 'occupancy',
          header: 'Occupancy',
          width: 'w-[120px]',
          render: (item) => (
            <div className="flex items-center gap-2">
              <EnterpriseInlineEdit
                value={item.standard_occupancy.toString()}
                onSave={(value) => handleUpdate(item.id, 'standard_occupancy', parseInt(value) || 1)}
                className="w-8 text-center text-sm font-medium"
                placeholder="2"
                type="number"
              />
              <span className="text-muted-foreground">/</span>
              <EnterpriseInlineEdit
                value={item.max_occupancy.toString()}
                onSave={(value) => handleUpdate(item.id, 'max_occupancy', parseInt(value) || 1)}
                className="w-8 text-center text-sm font-medium"
                placeholder="3"
                type="number"
              />
            </div>
          )
        },
        {
          key: 'room_details',
          header: 'Room Details',
          width: 'w-[200px]',
          render: (item) => {
            const attrs = item.attributes as any
            return (
              <div className="text-sm space-y-1">
                {attrs?.room_size_sqm && (
                  <div>{attrs.room_size_sqm}m²</div>
                )}
                {attrs?.view_type && (
                  <div className="text-muted-foreground">{attrs.view_type}</div>
                )}
                {attrs?.floor_range && (
                  <div className="text-muted-foreground">{attrs.floor_range}</div>
                )}
              </div>
            )
          }
        },
        ...baseColumns.slice(2) // status, actions
      ]
    }

    if (productType === 'event') {
      return [
        ...baseColumns.slice(0, 2), // drag, option_name
        {
          key: 'ticket_type',
          header: 'Ticket Type',
          width: 'w-[140px]',
          render: (item) => (
            <span className="text-sm capitalize">
              {(item.attributes as any)?.ticket_type?.replace('_', ' ') || '—'}
            </span>
          )
        },
        {
          key: 'access_level',
          header: 'Access Level',
          width: 'w-[120px]',
          render: (item) => (
            <span className="text-sm uppercase">
              {(item.attributes as any)?.access_level || '—'}
            </span>
          )
        },
        {
          key: 'section',
          header: 'Section',
          width: 'w-[180px]',
          render: (item) => (
            <div className="text-sm">
              {(item.attributes as any)?.section || '—'}
            </div>
          )
        },
        {
          key: 'seat_details',
          header: 'Seat Details',
          width: 'w-[150px]',
          render: (item) => (
            <div className="text-sm">
              {(item.attributes as any)?.seat_details || '—'}
            </div>
          )
        },
        ...baseColumns.slice(2) // status, actions
      ]
    }

    // Default columns for other types
    return baseColumns
  }

  const columns = getColumns()

  const getEmptyState = () => {
    const typeConfig = {
      accommodation: {
        icon: '🏨',
        title: 'No room options yet',
        description: 'Add room types and configurations for this accommodation',
        buttonText: 'Add First Room Option'
      },
      event: {
        icon: '🎫',
        title: 'No ticket options yet', 
        description: 'Add ticket categories and access levels for this event',
        buttonText: 'Add First Ticket Option'
      },
      transfer: {
        icon: '🚗',
        title: 'No vehicle options yet',
        description: 'Add vehicle types and configurations for this transfer',
        buttonText: 'Add First Vehicle Option'
      },
      activity: {
        icon: '🎯',
        title: 'No experience options yet',
        description: 'Add experience types and configurations for this activity',
        buttonText: 'Add First Experience Option'
      },
      extra: {
        icon: '➕',
        title: 'No extra options yet',
        description: 'Add extra services and add-ons for this product',
        buttonText: 'Add First Extra Option'
      }
    }

    const config = typeConfig[productType as keyof typeof typeConfig] || typeConfig.accommodation
    
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground mb-4">
          <div className="text-4xl mb-2">{config.icon}</div>
          <h3 className="text-lg font-medium">{config.title}</h3>
          <p className="text-sm">{config.description}</p>
        </div>
        <Button onClick={() => onEdit({} as ProductOption)}>
          <Plus className="h-4 w-4 mr-2" />
          {config.buttonText}
        </Button>
      </div>
    )
  }

  if (options.length === 0) {
    return getEmptyState()
  }

   return (
     <div className="space-y-4">
       
       <DndContext
         sensors={sensors}
         collisionDetection={closestCenter}
         onDragStart={handleDragStart}
         onDragOver={handleDragOver}
         onDragEnd={handleDragEnd}
       >
         <SortableContext 
           items={options.map(option => option.id)} 
           strategy={verticalListSortingStrategy}
         >
           <div className="bg-card border border-border shadow-sm rounded-md overflow-hidden">
             <Table>
               <TableHeader>
                 <TableRow className="bg-muted hover:bg-muted">
                   <TableHead className="w-12"></TableHead>
                   <TableHead>Option Name</TableHead>
                   {productType === 'accommodation' && (
                     <>
                       <TableHead>Bed Config</TableHead>
                       <TableHead>Occupancy</TableHead>
                       <TableHead>Room Details</TableHead>
                     </>
                   )}
                   {productType === 'event' && (
                     <>
                       <TableHead>Ticket Type</TableHead>
                       <TableHead>Access Level</TableHead>
                       <TableHead>Section</TableHead>
                     </>
                   )}
                   <TableHead>Status</TableHead>
                   <TableHead className="w-12"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {options.map((option) => (
                   <SortableTableRow
                     key={option.id}
                     option={option}
                     productType={productType}
                     onEdit={onEdit}
                     onDelete={handleDelete}
                     onDuplicate={handleDuplicate}
                   />
                 ))}
               </TableBody>
             </Table>
           </div>
         </SortableContext>
       </DndContext>
     </div>
   )
}
