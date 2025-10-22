"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  variant?: "default" | "compact" | "spacious";
}

const variantClasses = {
  default: "space-y-1",
  compact: "space-y-0.5",
  spacious: "space-y-2"
};

export function DetailRow({
  label,
  value,
  icon,
  className,
  labelClassName,
  valueClassName,
  variant = "default"
}: DetailRowProps) {
  return (
    <div className={cn("flex items-start gap-3", variantClasses[variant], className)}>
      {icon && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "text-sm font-medium text-muted-foreground",
          labelClassName
        )}>
          {label}
        </div>
        <div className={cn(
          "text-sm",
          valueClassName
        )}>
          {value}
        </div>
      </div>
    </div>
  );
}
