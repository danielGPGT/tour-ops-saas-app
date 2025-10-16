"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export interface SummaryCard {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    icon: React.ReactNode;
    color?: string;
  };
  backgroundColor?: string;
  iconBackgroundColor?: string;
}

export interface SummaryCardsProps {
  cards: SummaryCard[];
  className?: string;
}

export function SummaryCards({ cards, className = "" }: SummaryCardsProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {cards.map((card) => (
        <Card key={card.id} className="border border-border/50 shadow-sm">
          <CardContent className="">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
                {card.trend && (
                  <div className="flex items-center gap-1 mt-2">
                    {card.trend.icon}
                    <span className={`text-xs ${card.trend.color || 'text-muted-foreground'}`}>
                      {card.trend.value}
                    </span>
                  </div>
                )}
                {card.description && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {card.description}
                    </span>
                  </div>
                )}
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-md ${card.iconBackgroundColor || 'bg-primary/10'}`}>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
