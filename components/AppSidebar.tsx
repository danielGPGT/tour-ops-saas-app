"use client";

import Image from "next/image";
import * as React from "react";
import {
  LayoutGrid,
  PackageSearch,
  Ticket,
  Users,
  Building2,
  FileText,
  Wallet2,
  Settings,
  Database,
  Factory,
  Calendar,
  HelpCircle,
  Search,
  Map,
  TrendingUp
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutGrid,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: PackageSearch,
      items: [
        {
          title: "Suppliers",
          url: "/suppliers",
        },
        {
          title: "Contracts",
          url: "/contracts",
        },
        {
          title: "Products",
          url: "/products",
        },
        {
          title: "Product Types",
          url: "/product-types",
        },
        {
          title: "Rate Plans",
          url: "/rates",
        },
        {
          title: "Availability",
          url: "/availability",
        },
      ],
    },
    {
      title: "Sales",
      url: "/sales",
      icon: Ticket,
      items: [
        {
          title: "Quotes",
          url: "/quotes",
        },
        {
          title: "Bookings",
          url: "/bookings",
        },
      ],
    },
    {
      title: "Customers",
      url: "/customers",
      icon: Users,
      items: [
        {
          title: "Contacts",
          url: "/contacts",
        },
        {
          title: "Agents",
          url: "/agents",
        },
      ],
    },
    {
      title: "Finance",
      url: "/finance",
      icon: Wallet2,
      items: [
        {
          title: "Payments",
          url: "/payments",
        },
        {
          title: "Supplier Payables",
          url: "/payables",
        },
        {
          title: "Commissions",
          url: "/commissions",
        },
      ],
    },
  ],
  navDocuments: [
    {
      name: "Operations",
      url: "/operations",
      icon: Factory,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: FileText,
    },
    {
      name: "Analytics",
      url: "/analytics",
      icon: TrendingUp,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, user } = useAuth()
  
  // Create user data from authentication
  const userData = {
    name: profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'User',
    email: profile?.email || user?.email || '',
    avatar: profile?.avatar_url || '/avatars/user.jpg',
    organization: profile?.organization?.name || 'Organization'
  }

  return (
    <Sidebar collapsible="offcanvas" {...props} className="border-none">
      <SidebarHeader className="pt-20">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.navDocuments} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}


