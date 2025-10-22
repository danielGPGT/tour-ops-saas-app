"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backButton?: {
    onClick: () => void;
    label?: string;
  };
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export function PageHeader({
  title,
  subtitle,
  backButton,
  actions,
  className,
  titleClassName,
  subtitleClassName
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div className="flex items-start space-x-4">
        {backButton && (
          <Button
            variant="ghost"
            size="sm"
            onClick={backButton.onClick}
            className="mt-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backButton.label || "Back"}
          </Button>
        )}
        <div className="space-y-1">
          <div className={cn(
            "text-2xl font-bold tracking-tight",
            titleClassName
          )}>
            {title}
          </div>
          {subtitle && (
            <div className={cn(
              "text-muted-foreground",
              subtitleClassName
            )}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}
