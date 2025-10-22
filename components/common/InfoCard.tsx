"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  variant?: "default" | "bordered" | "elevated";
}

const variantClasses = {
  default: "",
  bordered: "border-l-4 border-l-primary",
  elevated: "shadow-lg border-0"
};

export function InfoCard({
  title,
  description,
  icon,
  children,
  className,
  headerClassName,
  contentClassName,
  variant = "default"
}: InfoCardProps) {
  return (
    <Card className={cn(variantClasses[variant], className)}>
      <CardHeader className={cn("", headerClassName)}>
        <CardTitle className={cn(
          "flex items-center gap-2",
          icon && "text-lg"
        )}>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              {icon}
            </div>
          )}
          {title}
        </CardTitle>
        {description && (
          <CardDescription>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={contentClassName}>
        {children}
      </CardContent>
    </Card>
  );
}
