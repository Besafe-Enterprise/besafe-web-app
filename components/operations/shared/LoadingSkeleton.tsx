import React from "react";

export function Skeleton({ height = 16, width = "100%" }: { height?: number; width?: string | number }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, marginBottom: 8 }}
    />
  );
}

export function SkeletonRow({ cols = 4, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* header skeleton */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={12} width="100%" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 16, marginBottom: 14 }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} height={14} width="100%" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonKpi({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: "var(--space-4)" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ padding: "var(--space-5)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
          <Skeleton height={10} width="60%" />
          <Skeleton height={28} width="40%" />
        </div>
      ))}
    </div>
  );
}
