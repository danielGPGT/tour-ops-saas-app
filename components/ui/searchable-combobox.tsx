'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface SearchableComboboxProps {
  value: string
  onValueChange: (value: string) => void
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

export function SearchableCombobox({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  className,
  disabled = false
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const commandListRef = useRef<HTMLDivElement>(null)

  // Handle scroll wheel events within dialog context
  useEffect(() => {
    const commandList = commandListRef.current
    if (!commandList || !open) return

    const handleWheel = (e: WheelEvent) => {
      // Check if the scroll is happening within the command list bounds
      const rect = commandList.getBoundingClientRect()
      const isWithinBounds = e.clientX >= rect.left && e.clientX <= rect.right && 
                             e.clientY >= rect.top && e.clientY <= rect.bottom
      
      if (isWithinBounds) {
        e.preventDefault()
        e.stopPropagation()
        
        // Calculate if we can scroll further
        const canScrollDown = commandList.scrollTop < (commandList.scrollHeight - commandList.clientHeight)
        const canScrollUp = commandList.scrollTop > 0
        
        if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
          commandList.scrollTop += e.deltaY
        }
      }
    }

    // Add event listener to the document to catch all wheel events
    document.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      document.removeEventListener('wheel', handleWheel)
    }
  }, [open])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-7 text-xs justify-between", className)}
          disabled={disabled}
        >
          {value ? value : placeholder}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-8 text-xs" />
          <CommandList 
            ref={commandListRef} 
            className="max-h-[200px] overflow-y-auto overflow-x-hidden"
            style={{ 
              scrollBehavior: 'smooth',
              overscrollBehavior: 'contain'
            }}
            onWheel={(e) => {
              e.stopPropagation()
              const element = e.currentTarget
              const canScrollDown = element.scrollTop < (element.scrollHeight - element.clientHeight)
              const canScrollUp = element.scrollTop > 0
              
              if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
                element.scrollTop += e.deltaY
                e.preventDefault()
              }
            }}
          >
            <CommandEmpty className="text-xs">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
