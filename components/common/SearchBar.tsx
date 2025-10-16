"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SearchBarProps {
  placeholder?: string;
  searchParam?: string;
  debounceMs?: number;
  className?: string;
  showClearButton?: boolean;
}

export function SearchBar({ 
  placeholder = "Search...",
  searchParam = "q",
  debounceMs = 300,
  className = "",
  showClearButton = true
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get(searchParam) || "");
  const [isSearching, setIsSearching] = useState(false);

  // Update local state when URL changes (e.g., from browser back/forward)
  useEffect(() => {
    setQuery(searchParams.get(searchParam) || "");
  }, [searchParams, searchParam]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const trimmedQuery = searchQuery.trim();
      
      // Build new URL with search query
      const params = new URLSearchParams(searchParams.toString());
      if (trimmedQuery) {
        params.set(searchParam, trimmedQuery);
      } else {
        params.delete(searchParam);
      }
      // Reset to page 1 when searching
      params.set("page", "1");
      
      // Navigate to the same page with new search params
      router.push(`?${params.toString()}`);
      setIsSearching(false);
    },
    [router, searchParams, searchParam]
  );

  // Debounce effect
  useEffect(() => {
    if (query === searchParams.get(searchParam)) {
      return; // Don't search if query matches current URL param
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      debouncedSearch(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debouncedSearch, searchParams, searchParam, debounceMs]);

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(searchParam);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className={`relative flex items-center gap-2 ${className}`}>
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        )}
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-7 pr-8 h-8 w-64 text-sm"
        />
        {showClearButton && query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
