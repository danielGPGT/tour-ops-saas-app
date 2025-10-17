"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductsVariantsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isSearching, setIsSearching] = useState(false);

  // Update local state when URL changes (e.g., from browser back/forward)
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Debounced search function
  const debouncedSearch = useCallback(
    (searchQuery: string) => {
      const trimmedQuery = searchQuery.trim();
      
      // Build new URL with search query
      const params = new URLSearchParams();
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }
      // Reset to page 1 when searching
      params.set("page", "1");
      
      // Navigate to the same page with new search params
      router.push(`/products-variants?${params.toString()}`);
      setIsSearching(false);
    },
    [router]
  );

  // Debounce effect
  useEffect(() => {
    if (query === searchParams.get("q")) {
      return; // Don't search if query matches current URL param
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      debouncedSearch(query);
    }, 300); // 300ms debounce for more responsive feel

    return () => clearTimeout(timeoutId);
  }, [query, debouncedSearch, searchParams]);

  const handleClear = () => {
    setQuery("");
    router.push("/products-variants");
  };

  return (
    <div className="relative flex items-center gap-2">
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
          placeholder="Search products..."
          className="pl-7 pr-8 h-8 w-64 text-sm"
        />
        {query && (
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
