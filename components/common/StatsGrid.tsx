"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  description?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  itemClassName?: string;
}

const columnClasses = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
};

const trendColors = {
  up: "text-green-600",
  down: "text-red-600",
  neutral: "text-muted-foreground"
};

export function StatsGrid({
  stats,
  columns = 3,
  className,
  itemClassName
}: StatsGridProps) {
  return (
    <div className={cn(
      "grid gap-4",
      columnClasses[columns],
      className
    )}>
      {stats.map((stat) => (
        <Card key={stat.id} className={cn("shadow-sm", itemClassName)}>
           <CardContent className="">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-lg font-bold">
                  {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                </p>
                {stat.trend && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    trendColors[stat.trend.direction]
                  )}>
                    <span>{stat.trend.value}</span>
                  </div>
                )}
                {stat.description && (
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                )}
              </div>
              {stat.icon && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  {stat.icon}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
