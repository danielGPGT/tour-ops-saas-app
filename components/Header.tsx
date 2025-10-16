"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-14 px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-sm font-semibold truncate">Dashboard</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground truncate">Overview</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button className="rounded-md p-2 hover:bg-muted">
            <Bell className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <button className="inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted">
            <Sparkles className="h-4 w-4" />
            Quick Create
          </button>
        </div>
      </div>
    </header>
  );
}


