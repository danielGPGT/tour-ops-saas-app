"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown, Plus, Check } from "lucide-react";
import { useOrganization } from "@/lib/contexts/OrganizationContext";

export function OrganizationSwitcher() {
  const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization();
  const router = useRouter();

  const handleOrgChange = async (org: any) => {
    setCurrentOrg(org);
    
    // Force a full page reload to ensure server components get the new org
    window.location.href = `/?org=${org.id}`;
  };

  const handleCreateOrg = () => {
    // Navigate to create organization page
    router.push('/organizations/new');
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Building2 className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!currentOrg) {
    return (
      <Button variant="outline" onClick={handleCreateOrg} className="gap-2">
        <Plus className="h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">{currentOrg.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch Organization
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleOrgChange(org)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{org.name}</span>
            </div>
            {org.id === currentOrg.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCreateOrg} className="gap-2">
          <Plus className="h-4 w-4" />
          Create New Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
