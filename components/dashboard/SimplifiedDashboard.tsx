"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings,
  Package,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCreationWizard } from "@/components/products/ProductCreationWizard";
import { ImportWizard } from "@/components/import/ImportWizard";
import { ReleaseWarningsWidget } from "./ReleaseWarningsWidget";
import { KeyMetricsCards } from "./KeyMetricsCards";
import { UpcomingEventsWidget } from "./UpcomingEventsWidget";
import { RecentActivityWidget } from "./RecentActivityWidget";
import { AuthDebugWidget } from "../debug/AuthDebugWidget";

interface DashboardProps {
  organizationId: string;
}

export function SimplifiedDashboard({ organizationId }: DashboardProps) {
  const [showProductWizard, setShowProductWizard] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Mock data - in real app this would come from API
  const dashboardData = {
    bookings: {
      pending: 3,
      confirmed: 12,
      today: 2,
      thisWeek: 8
    },
    revenue: {
      today: 4500,
      thisWeek: 18500,
      thisMonth: 67000,
      trend: "+12%"
    },
    upcoming: [
      { id: 1, type: "Hotel Check-in", time: "14:00", guests: 4, location: "Hotel ABC" },
      { id: 2, type: "Activity Pickup", time: "09:30", guests: 8, location: "City Center" }
    ],
    alerts: [
      { id: 1, type: "warning", message: "2 bookings need confirmation", count: 2 },
      { id: 2, type: "info", message: "Payment due for 3 bookings", count: 3 },
      { id: 3, type: "success", message: "5 new bookings this week", count: 5 }
    ]
  };

  const quickActions = [
    {
      id: "new-booking",
      title: "New Booking",
      description: "Create a booking for a customer",
      icon: BookOpen,
      color: "bg-blue-500",
      onClick: () => console.log("New booking")
    },
    {
      id: "add-product",
      title: "Add Product",
      description: "Add a new product to sell",
      icon: Package,
      color: "bg-green-500",
      onClick: () => setShowProductWizard(true)
    },
    {
      id: "import-data",
      title: "Import Data",
      description: "Import bookings or products",
      icon: Users,
      color: "bg-purple-500",
      onClick: () => setShowImportWizard(true)
    }
  ];

  const renderQuickActions = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Card 
            key={action.id}
            className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", action.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderTodaySummary = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Bookings</p>
              <p className="text-2xl font-bold">{dashboardData.bookings.today}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{dashboardData.bookings.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold">{dashboardData.bookings.confirmed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
              <p className="text-2xl font-bold">£{dashboardData.revenue.today.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAlerts = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Alerts & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dashboardData.alerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                alert.type === "warning" && "bg-yellow-50 border-yellow-200",
                alert.type === "info" && "bg-blue-50 border-blue-200",
                alert.type === "success" && "bg-green-50 border-green-200"
              )}
            >
              <div className="flex items-center gap-3">
                <Badge 
                  variant={alert.type === "warning" ? "destructive" : alert.type === "info" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {alert.count}
                </Badge>
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderUpcoming = () => (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Schedule
        </CardTitle>
        <CardDescription>Upcoming departures and check-ins</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dashboardData.upcoming.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium">{item.time}</p>
                  <p className="text-xs text-muted-foreground">{item.type}</p>
                </div>
                <div>
                  <p className="font-medium">{item.location}</p>
                  <p className="text-sm text-muted-foreground">{item.guests} guests</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderAdvancedSettings = () => (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup & Configuration
            </CardTitle>
            <CardDescription>Configure your system settings</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            {showAdvancedSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {showAdvancedSettings && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Products & Inventory</h4>
              <div className="space-y-1 text-sm">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Availability Calendar
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Suppliers & Contracts</h4>
              <div className="space-y-1 text-sm">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Suppliers
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Contract Templates
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (showProductWizard) {
    return (
      <ProductCreationWizard
        onComplete={(productData) => {
          console.log("Product created:", productData);
          setShowProductWizard(false);
          // Show success message, refresh data, etc.
        }}
        onCancel={() => setShowProductWizard(false)}
      />
    );
  }

  if (showImportWizard) {
    return (
      <ImportWizard
        onComplete={(importResults) => {
          console.log("Import completed:", importResults);
          setShowImportWizard(false);
          // Show success message, refresh data, etc.
        }}
        onCancel={() => setShowImportWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your tour operations today.
        </p>
      </div>

      {/* DEBUG INFO - TEMPORARY */}
      <AuthDebugWidget />

      {/* KEY METRICS - Enterprise Dashboard Style */}
      <KeyMetricsCards />

      {/* URGENT ALERTS - Release Warnings */}
      <ReleaseWarningsWidget />

      {/* Two Column Layout for Events and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPCOMING EVENTS */}
        <UpcomingEventsWidget />

        {/* RECENT ACTIVITY */}
        <RecentActivityWidget />
      </div>

      {/* Quick Actions - Still available but less prominent */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="p-4 h-auto flex flex-col items-center gap-2 hover:shadow-md transition-all"
                  onClick={() => {
                    if (action.id === "create-product") {
                      setShowProductWizard(true);
                    } else if (action.id === "import-data") {
                      setShowImportWizard(true);
                    }
                  }}
                >
                  <div className={cn("p-2 rounded-lg", action.color)}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{action.title}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings - Collapsed by default */}
      {renderAdvancedSettings()}
    </div>
  );
}
