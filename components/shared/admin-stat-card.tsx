"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: "brand" | "critical" | "success" | "warning" | "purple";
  trend?: {
    value: string | number;
    direction: "up" | "down" | "neutral";
    description?: string;
  };
  subtext?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

const accentClasses = {
  brand: "bg-brand-500/10 text-brand-400 border-brand-500/20",
  critical: "bg-critical/10 text-critical border-critical/30",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const trendConfig = {
  up: { icon: TrendingUp, className: "bg-success/10 text-success border-success/20" },
  down: { icon: TrendingDown, className: "bg-critical/10 text-critical border-critical/20" },
  neutral: { icon: Minus, className: "bg-surface-300/10 text-text-secondary border-surface-300/20" },
};

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  accentColor = "brand",
  trend,
  subtext,
  onClick,
  className,
  loading = false,
}: AdminStatCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-border bg-card overflow-hidden transition-all duration-200 hover:border-brand-500/40 hover:shadow-md select-none",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border",
              accentClasses[accentColor]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-2">
          {loading ? (
            <div className="h-7 w-20 animate-pulse rounded bg-surface-300/50" />
          ) : (
            <span className="text-xl font-bold tracking-tight text-foreground">
              {value}
            </span>
          )}

          {trend && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] font-semibold",
                  trendConfig[trend.direction].className
                )}
              >
                {React.createElement(trendConfig[trend.direction].icon, { className: "h-2.5 w-2.5" })}
                {trend.value}
              </span>
              {trend.description && (
                <span className="text-[10px] text-muted-foreground truncate">
                  {trend.description}
                </span>
              )}
            </div>
          )}

          {subtext && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              {subtext}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}