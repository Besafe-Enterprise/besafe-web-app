"use client";
import React from "react";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";

/** Full-height loading for routes behind auth/data fetch. */
export function LoadingScreen({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="field-screen-loading">
      <Skeleton height={16} width="50%" />
      <Skeleton height={18} width="85%" />
      <Skeleton height={18} width="75%" />
      <p className="field-screen-loading__label">{label}</p>
    </div>
  );
}
