"use client";

import React, { useState } from "react";
import { useGetDashboardStats } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { KpiCard } from "@/components/operations/shared/KpiCard";
import { Avatar } from "@/components/operations/shared/Avatar";
import { SkeletonKpi } from "@/components/operations/shared/LoadingSkeleton";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: team = [] } = useGetAgencyTeam();
  const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");

  const volume = stats?.weekly_volume || [];
  const category = stats?.category_distribution || [];

  const maxVolume = Math.max(1, ...volume.map((v) => v.count || 0));
  const maxCat = Math.max(1, ...category.map((c) => c.count || 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Analytics</h1>
          <p className="page-header__subtitle">Agency performance and case intelligence</p>
        </div>
        <div className="segmented">
          {(
            [
              ["24h", "24H"],
              ["7d", "7D"],
              ["30d", "30D"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`segmented__btn ${range === key ? "segmented__btn--active" : ""}`}
              onClick={() => setRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonKpi count={3} />
      ) : (
        <div className="kpi-grid">
          <KpiCard label="Total Cases" value={stats?.total_all_time ?? stats?.total ?? 0} sub="All time" />
          <KpiCard label="Active Now" value={stats?.active_alerts ?? stats?.active ?? 0} sub="Current open cases" />
          <KpiCard label="Resolved" value={stats?.resolved_today ?? stats?.resolved ?? 0} sub="Resolved" />
          <KpiCard label="Avg Response" value={stats?.avg_response_minutes ? `${stats.avg_response_minutes}m` : "—"} sub="Time to reach site" />
        </div>
      )}

      {/* Case volume */}
      <div className="card" style={{ marginBottom: "var(--space-6)" }}>
        <div className="section-header">
          <h2 className="section-header__title">Case Volume</h2>
        </div>
        {volume.length === 0 ? (
          <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No volume data available for this period.</p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)", height: 180 }}>
            {volume.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span className="text-secondary" style={{ fontSize: "var(--text-xs)" }}>{v.count}</span>
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(4, (v.count / maxVolume) * 140)}px`,
                    background: "var(--color-brand)",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{v.day}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        {/* Category breakdown */}
        <div className="card">
          <div className="section-header">
            <h2 className="section-header__title">Cases by Category</h2>
          </div>
          {category.length === 0 ? (
            <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No category distribution available.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {category.map((c, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 4 }}>
                    <span>{c.label}</span>
                    <span className="text-secondary">{c.count} ({c.percentage})</span>
                  </div>
                  <div style={{ height: 8, background: "var(--color-surface-sunken)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                    <div style={{ width: `${(c.count / maxCat) * 100}%`, height: "100%", background: "var(--color-brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Worker utilization */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="section-header" style={{ margin: "var(--space-4)" }}>
            <h2 className="section-header__title">Worker Utilization</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {team.slice(0, 8).map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={t.name} size="sm" />
                      <span>{t.name}</span>
                    </div>
                  </td>
                  <td>{t.role}</td>
                  <td>
                    <span className={t.is_active ? "text-success" : "text-critical"}>
                      {t.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
