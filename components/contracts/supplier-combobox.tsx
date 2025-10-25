'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSuppliers } from '@/lib/hooks/useSuppliers'

interface SupplierComboBoxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function SupplierComboBox({
  value,
  onValueChange,
  placeholder = "Select supplier...",
  disabled = false,
  className
}: SupplierComboBoxProps) {
  const [open, setOpen] = useState(false)
  const { data: suppliers = [], isLoading } = useSuppliers()

  const selectedSupplier = suppliers.find((supplier) => supplier.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            "Loading suppliers..."
          ) : selectedSupplier ? (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{selectedSupplier.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search suppliers..." />
          <CommandList>
            <CommandEmpty>No suppliers found.</CommandEmpty>
            <CommandGroup>
              {suppliers.map((supplier) => (
                <CommandItem
                  key={supplier.id}
                  value={supplier.name}
                  onSelect={() => {
                    onValueChange?.(supplier.id === value ? "" : supplier.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === supplier.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{supplier.name}</span>
                    {supplier.contact_email && (
                      <span className="text-xs text-muted-foreground">
                        {supplier.contact_email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
