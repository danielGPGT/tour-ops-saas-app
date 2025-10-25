'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Search, X, LayoutGrid, List } from 'lucide-react'

interface InventoryFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  productTypeFilter: string
  onProductTypeFilterChange: (value: string) => void
  allocationFilter: string
  onAllocationFilterChange: (value: string) => void
  viewMode: 'table' | 'cards'
  onViewModeChange: (mode: 'table' | 'cards') => void
}

export function InventoryFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  productTypeFilter,
  onProductTypeFilterChange,
  allocationFilter,
  onAllocationFilterChange,
  viewMode,
  onViewModeChange
}: InventoryFiltersProps) {
  const handleClearFilters = () => {
    onSearchChange('')
    onStatusFilterChange('all')
    onProductTypeFilterChange('all')
    onAllocationFilterChange('all')
  }

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || productTypeFilter !== 'all' || allocationFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Search and View Mode */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-primary/20 focus:border-primary focus:ring-primary/20"
          />
        </div>
        
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => onViewModeChange(value as 'table' | 'cards')}>
          <ToggleGroupItem value="table" aria-label="Table view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="cards" aria-label="Cards view">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Product Type:</span>
          <Select value={productTypeFilter} onValueChange={onProductTypeFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="accommodation">Accommodation</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="activity">Activity</SelectItem>
              <SelectItem value="extra">Extra</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Allocation:</span>
          <Select value={allocationFilter} onValueChange={onAllocationFilterChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="allotment">Allotment</SelectItem>
              <SelectItem value="free_sell">Free Sell</SelectItem>
              <SelectItem value="on_request">On Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="border-primary/20 text-primary hover:bg-primary/5">
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20">
              Search: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {productTypeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {productTypeFilter}
              <button
                onClick={() => onProductTypeFilterChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {allocationFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Allocation: {allocationFilter}
              <button
                onClick={() => onAllocationFilterChange('all')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
