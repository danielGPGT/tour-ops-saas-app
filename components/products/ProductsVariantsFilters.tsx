"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ProductType {
  id: number;
  name: string;
}

interface ProductCollection {
  id: number;
  name: string;
  type: string;
}

interface ProductsVariantsFiltersProps {
  productTypes: ProductType[];
  productCollections: ProductCollection[];
  selectedType: string;
  selectedCollection: string;
  searchQuery: string;
}

export function ProductsVariantsFilters({
  productTypes,
  productCollections,
  selectedType,
  selectedCollection,
  searchQuery
}: ProductsVariantsFiltersProps) {
  const router = useRouter();
  const [typeOpen, setTypeOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);

  const handleTypeChange = (value: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (value && value !== 'all') params.set('type', value);
    if (selectedCollection && selectedCollection !== 'all') params.set('collection', selectedCollection);
    params.set('page', '1');
    router.push(`/products-variants?${params.toString()}`);
  };

  const handleCollectionChange = (value: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (value && value !== 'all') params.set('collection', value);
    params.set('page', '1');
    router.push(`/products-variants?${params.toString()}`);
  };

  const selectedTypeName = selectedType === 'all' || !selectedType 
    ? 'All Types' 
    : productTypes.find(t => t.name === selectedType)?.name || 'All Types';

  const selectedCollectionName = selectedCollection === 'all' || !selectedCollection 
    ? 'All Collections' 
    : productCollections.find(c => c.id.toString() === selectedCollection)?.name || 'All Collections';

  return (
    <div className="flex items-center gap-3">
      {/* Product Type Combobox */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={typeOpen}
            className="w-40 h-8 justify-between text-sm"
          >
            <span className="truncate">{selectedTypeName}</span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-0">
          <Command>
            <CommandInput placeholder="Search types..." />
            <CommandList>
              <CommandEmpty>No type found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    handleTypeChange('all');
                    setTypeOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      selectedType === 'all' || !selectedType ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Types
                </CommandItem>
                {productTypes.map((type) => (
                  <CommandItem
                    key={type.id}
                    value={type.name}
                    onSelect={() => {
                      handleTypeChange(type.name);
                      setTypeOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        selectedType === type.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {type.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Product Collection Combobox */}
      <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={collectionOpen}
            className="w-48 h-8 justify-between text-sm"
          >
            <span className="truncate">{selectedCollectionName}</span>
            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0">
          <Command>
            <CommandInput placeholder="Search collections..." />
            <CommandList>
              <CommandEmpty>No collection found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    handleCollectionChange('all');
                    setCollectionOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      selectedCollection === 'all' || !selectedCollection ? "opacity-100" : "opacity-0"
                    )}
                  />
                  All Collections
                </CommandItem>
                {productCollections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={collection.name}
                    onSelect={() => {
                      handleCollectionChange(collection.id.toString());
                      setCollectionOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3 w-3",
                        selectedCollection === collection.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {collection.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
