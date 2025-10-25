'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, Package } from 'lucide-react'
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
import { useProducts } from '@/lib/hooks/useProducts'

interface ProductComboBoxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function ProductComboBox({
  value,
  onValueChange,
  placeholder = "Select product...",
  disabled = false,
  className
}: ProductComboBoxProps) {
  const [open, setOpen] = useState(false)
  const { data: products = [], isLoading } = useProducts()

  const selectedProduct = products.find((product) => product.id === value)

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
            "Loading products..."
          ) : selectedProduct ? (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{selectedProduct.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onValueChange?.(product.id === value ? "" : product.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                    {product.product_type && (
                      <span className="text-xs text-muted-foreground">
                        {typeof product.product_type === 'object' 
                          ? product.product_type.type_name || product.product_type.name
                          : product.product_type
                        }
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
