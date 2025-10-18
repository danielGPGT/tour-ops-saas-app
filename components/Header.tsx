"use client";

import { Bell, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import {Top} from "@/components/top";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import Image from "next/image";
import { useTheme } from "next-themes";

export function Header() {
  const { theme, systemTheme } = useTheme();

  return (
    <header className="sticky top-0 border-b z-50 border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Top />
      <div className="h-14 px-4 md:px-4 flex items-center justify-between">
        
        <a href="/">
          <Image src={theme === "dark" ? "/newlight.png" : "/newdark.png"} alt="Pandora" width={150} height={150} />  
        </a>

        <div className="flex items-center gap-2">
          <OrganizationSwitcher />
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


