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
  TrendingUp,
  Package,
  Target,
  RotateCcw,
  DollarSign,
  BarChart3,
  TrendingDown
} from "lucide-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthErrorHandler } from "@/components/auth/AuthErrorHandler";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Filter nav items based on user permissions - NEW COMPREHENSIVE ARCHITECTURE
const getNavItemsForRole = (userRole: string | null, hasRole: (role: string | string[]) => boolean): {
  title: string
  url: string
  icon?: React.ComponentType<{ className?: string }>
  isSection?: boolean
  items?: {
    title: string
    url: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
}[] => {
  const baseItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutGrid,
    },
    {
      title: "Events",
      url: "/events",
      icon: Calendar,
    },
  ];

  // INVENTORY MANAGEMENT Section
  const inventoryItems = {
    title: "Inventory",
    url: "#",
    icon: PackageSearch,
    isSection: true,
    items: [
      {
        title: "Products",
        url: "/products",
        icon: Package,
      },
      {
        title: "Contracts", 
        url: "/contracts",
        icon: FileText,
      },
      {
        title: "Allocations",
        url: "/allocations",
        icon: Target,
      },
      {
        title: "Allocation Pools",
        url: "/allocation-pools", 
        icon: RotateCcw,
      },
    ]
  };

  // PRICING Section
  const pricingItems = {
    title: "Pricing",
    url: "#",
    icon: DollarSign,
    isSection: true,
    items: [
      {
        title: "Selling Rates",
        url: "/selling-rates",
        icon: TrendingUp,
      },
      {
        title: "Supplier Rates", 
        url: "/supplier-rates",
        icon: TrendingDown,
      },
      {
        title: "Margin Analysis",
        url: "/margin-analysis",
        icon: BarChart3,
      },
    ]
  };

  // Build the main navigation
  const result = [
    ...baseItems,
    inventoryItems,
    pricingItems,
    {
      title: "Suppliers",
      url: "/suppliers",
      icon: Building2,
    },
  ];

  // Legacy Sales section (if needed)
  if (hasRole(['admin', 'owner', 'manager'])) {
    const salesItems = {
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
    };
    result.push(salesItems);
  }

  // Customer Management (if needed)
  if (hasRole(['admin', 'owner', 'manager'])) {
    const customerItems = {
      title: "Customers",
      url: "/customers", 
      icon: Users,
      items: [
        {
          title: "Contacts",
          url: "/contacts",
        },
      ],
    };

    // Only admins can manage agents
    if (hasRole(['admin', 'owner'])) {
      customerItems.items.push({
        title: "Agents",
        url: "/agents",
      });
    }

    result.push(customerItems);
  }

  // Finance section only for admins/owners
  if (hasRole(['admin', 'owner'])) {
    const financeSection = {
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
    };
    result.push(financeSection);
  }

  return result;
};

const navDocuments = [
  {
    name: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Reports",
    url: "/reports", 
    icon: FileText,
  },
];

const navSecondary = [
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
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // TEMPORARY: Disable auth hooks to fix infinite loading
  const profile = null
  const user = null 
  const loading = false
  const userRole = 'admin' // Default for testing
  const hasRole = (roles: string | string[]) => true // Allow all for testing
  
  // const { profile, user, loading, hasRole, userRole } = useAuth()
  // const { AuthErrorComponent } = useAuthErrorHandler()
  const AuthErrorComponent = null
  
  // Create user data from authentication
  const userData = {
    name: 'Monaco GP Admin', // Temporary for testing
    email: 'admin@monacogp.com', // Temporary for testing  
    avatar: '/avatars/user.jpg',
    organization: 'Monaco GP Experiences Ltd', // From seed data
    role: userRole || 'admin'
  }

  // Get role-based navigation
  const navMain = getNavItemsForRole(userRole, hasRole)

  // Show loading state
  if (false) { // Temporarily disabled
    return (
      <Sidebar collapsible="offcanvas" {...props} className="border-none">
        <SidebarHeader className="pt-20">
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </SidebarHeader>
      </Sidebar>
    )
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
        {/* Show auth errors */}
        {AuthErrorComponent && (
          <div className="px-2 pb-2">
            {AuthErrorComponent}
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={navDocuments} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}


