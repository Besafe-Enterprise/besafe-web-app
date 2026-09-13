"use client";

import React from "react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2.5">{action}</div>
      )}
    </div>
  );
}
