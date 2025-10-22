"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive" | "pending" | "error" | "success" | "warning";
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    label: "Active"
  },
  inactive: {
    icon: XCircle,
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
    label: "Inactive"
  },
  pending: {
    icon: Clock,
    variant: "outline" as const,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    label: "Pending"
  },
  error: {
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    label: "Error"
  },
  success: {
    icon: CheckCircle,
    variant: "default" as const,
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    label: "Success"
  },
  warning: {
    icon: AlertTriangle,
    variant: "outline" as const,
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    label: "Warning"
  }
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5"
};

export function StatusBadge({
  status,
  label,
  size = "md",
  variant,
  className
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <Badge
      variant={variant || config.variant}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium",
        sizeClasses[size],
        config.className,
        className
      )}
    >
      <Icon className={cn(
        size === "sm" ? "h-3 w-3" : size === "md" ? "h-3.5 w-3.5" : "h-4 w-4"
      )} />
      {displayLabel}
    </Badge>
  );
}
