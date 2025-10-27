'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  productId,
  onEdit, 
  onDelete, 
  onDuplicate 
}: {
  option: ProductOption
  productType: string
  productId?: string
  onEdit: (option: ProductOption) => void
  onDelete: (option: ProductOption) => void
  onDuplicate: (option: ProductOption) => void
}) {
  const router = useRouter()
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

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on actions or drag handle
    const target = e.target as HTMLElement
    if (target.closest('button, [role="menuitem"]') || target.closest('[data-drag-handle]')) {
      return
    }
    if (productId) {
      router.push(`/products/${productId}/options/${option.id}`)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(option)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(option)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDuplicate(option)
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      onClick={handleRowClick}
      className={`hover:bg-primary/5 cursor-pointer ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20 opacity-50' : ''
      }`}
    >
      {/* Drag Handle */}
      <TableCell>
        <div 
          data-drag-handle
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
            <Badge variant="outline" className="capitalize">
              {(option.attributes as any)?.room_type || '—'}
            </Badge>
          </TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              {(option.attributes as any)?.bed_configurations_available && 
               (option.attributes as any).bed_configurations_available.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1">
                    {(option.attributes as any).bed_configurations_available.map((bed: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs capitalize">
                        {bed}
                      </Badge>
                    ))}
                  </div>
                  {(option.attributes as any)?.default_bed_configuration && (
                    <span className="text-xs text-muted-foreground">
                      Default: {(option.attributes as any).default_bed_configuration}
                    </span>
                  )}
                </>
              ) : (option.attributes as any)?.bed_configuration ? (
                <Badge variant="secondary" className="text-xs capitalize">
                  {(option.attributes as any).bed_configuration}
                </Badge>
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
          </TableCell>
          <TableCell>
            <span className="text-sm">
              Std: {(option.attributes as any)?.standard_occupancy || '—'} / Max: {(option.attributes as any)?.max_occupancy || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.view_type || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'event' && (
        <>
          <TableCell>
            <Badge variant="outline" className="capitalize">
              {(option.attributes as any)?.ticket_type?.replace(/_/g, ' ') || '—'}
            </Badge>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.seat_category || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.age_category || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'transfer' && (
        <>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.vehicle_type || '—'}
            </span>
          </TableCell>
          <TableCell>
            {(option.attributes as any)?.capacity ? (
              <span className="text-sm">
                {(option.attributes as any).capacity.passengers || '—'} pax, {(option.attributes as any).capacity.luggage_large || '—'}L
              </span>
            ) : (
              <span className="text-sm">—</span>
            )}
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.pricing_basis?.replace('_', ' ') || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'transport' && (
        <>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.service_class?.replace('_', ' ') || '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.ticket_flexibility?.replace('_', ' ') || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'experience' && (
        <>
          <TableCell>
            <span className="text-sm">
              {(option.attributes as any)?.duration_hours ? `${(option.attributes as any).duration_hours}h` : '—'}
            </span>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.option_type?.replace('_', ' ') || '—'}
            </span>
          </TableCell>
        </>
      )}
      
      {productType === 'extra' && (
        <>
          <TableCell>
            <Badge variant="outline" className="capitalize">
              {(option.attributes as any)?.extra_type?.replace('_', ' ') || '—'}
            </Badge>
          </TableCell>
          <TableCell>
            <span className="text-sm capitalize">
              {(option.attributes as any)?.access_type || '—'}
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
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
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
  productId?: string
  onEdit: (option: ProductOption) => void
}

export function OptionsTable({ options, productType, productId, onEdit }: OptionsTableProps) {
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
                       <TableHead>Room Type</TableHead>
                       <TableHead>Bed Config</TableHead>
                       <TableHead>Occupancy</TableHead>
                       <TableHead>View</TableHead>
                     </>
                   )}
                   {productType === 'event' && (
                     <>
                       <TableHead>Ticket Type</TableHead>
                       <TableHead>Seat Category</TableHead>
                       <TableHead>Age Category</TableHead>
                     </>
                   )}
                   {productType === 'transfer' && (
                     <>
                       <TableHead>Vehicle Type</TableHead>
                       <TableHead>Capacity</TableHead>
                       <TableHead>Pricing</TableHead>
                     </>
                   )}
                   {productType === 'transport' && (
                     <>
                       <TableHead>Service Class</TableHead>
                       <TableHead>Flexibility</TableHead>
                     </>
                   )}
                   {productType === 'experience' && (
                     <>
                       <TableHead>Duration</TableHead>
                       <TableHead>Type</TableHead>
                     </>
                   )}
                   {productType === 'extra' && (
                     <>
                       <TableHead>Extra Type</TableHead>
                       <TableHead>Access</TableHead>
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
                     productId={productId}
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
