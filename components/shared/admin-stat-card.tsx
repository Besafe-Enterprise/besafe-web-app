"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: "destructive" | "primary" | "emerald" | "amber" | "indigo";
  trend?: {
    value: string | number;
    isPositive: boolean;
    description?: string;
  };
  subtext?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function AdminStatCard({
  label,
  value,
  icon: Icon,
  accentColor = "primary",
  trend,
  subtext,
  onClick,
  className,
}: AdminStatCardProps) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "border-border/80 bg-card/90 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg select-none",
        onClick && "cursor-pointer active:scale-[0.99]",
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              accentClasses[accentColor]
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>

          {trend && (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "flex items-center gap-0.5 font-semibold rounded px-1.5 py-0.5 text-[11px]",
                  trend.isPositive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.value}
              </span>
              {trend.description && (
                <span className="text-muted-foreground text-[11px] truncate">
                  {trend.description}
                </span>
              )}
            </div>
          )}

          {subtext && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {subtext}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
