"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboBoxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export function ComboBox({
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
  disabled = false,
  className,
  children,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)

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
          disabled={disabled}
        >
          {value ? children : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            {children}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ComboBoxItemProps {
  value: string
  onSelect?: (value: string) => void
  children: React.ReactNode
}

export function ComboBoxItem({ value, onSelect, children }: ComboBoxItemProps) {
  return (
    <CommandItem
      value={value}
      onSelect={(currentValue) => {
        onSelect?.(currentValue === value ? "" : currentValue)
      }}
    >
      <Check
        className={cn(
          "mr-2 h-4 w-4",
          value === value ? "opacity-100" : "opacity-0"
        )}
      />
      {children}
    </CommandItem>
  )
}
