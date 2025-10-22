"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface InlineEditHintProps {
  className?: string;
  variant?: "default" | "subtle" | "highlighted";
}

export function InlineEditHint({ 
  className, 
  variant = "default" 
}: InlineEditHintProps) {
  const variantClasses = {
    default: "text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md",
    subtle: "text-xs text-muted-foreground/70 bg-muted/30 px-2 py-1 rounded-md",
    highlighted: "text-xs text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1",
      variantClasses[variant],
      className
    )}>
      <span className="text-xs">💡</span>
      <span>Click any field to edit inline</span>
    </div>
  );
}
