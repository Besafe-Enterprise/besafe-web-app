"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGetDashboardStats } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAlerts, useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { KpiCard } from "@/components/operations/shared/KpiCard";
import { Avatar } from "@/components/operations/shared/Avatar";
import { Badge } from "@/components/operations/shared/Badge";
import { SkeletonKpi, SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { CheckCircle, AlertCircle, Clock, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useGetDashboardStats();
  const { data: alertsResp } = useGetAlerts({ limit: 500, include_resolved: true });
  const { data: reportsResp } = useGetReports({ limit: 500, include_resolved: true });
  const { data: team = [] } = useGetAgencyTeam();
  const [range, setRange] = useState<"24h" | "7d" | "30d">("7d");

  const volume = stats?.weekly_volume || [];
  const category = stats?.category_distribution || [];

  const maxVolume = Math.max(1, ...volume.map((v) => v.count || 0));
  const maxCat = Math.max(1, ...category.map((c) => c.count || 0));

  const alertsArr = (alertsResp?.items ?? []) as any[];
  const reportsArr = (reportsResp?.items ?? []) as any[];
  const totalAlerts = alertsArr.length;
  const totalReports = reportsArr.length;
  const activeAlerts = alertsArr.filter((a: any) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status)).length;
  const activeReports = reportsArr.filter((r: any) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(r.status)).length;
  const resolvedAlerts = alertsArr.filter((a: any) => ["resolved", "closed", "false_alarm"].includes(a.status)).length;
  const resolvedReports = reportsArr.filter((r: any) => ["resolved", "closed"].includes(r.status)).length;
  const activeTeam = team.filter((t: any) => t.is_active).length;
  const totalTeam = team.length;

  const alertStatusCounts = alertsArr.reduce((acc: Record<string, number>, a: any) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

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
        <SkeletonKpi count={4} />
      ) : (
        <>
          {/* ── Overview KPIs ── */}
          <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
            <KpiCard
              label="Total Cases"
              value={stats?.total_all_time ?? stats?.total ?? 0}
              sub={`${stats?.total_alerts ?? totalAlerts} alerts · ${stats?.total_reports ?? totalReports} reports`}
            />
            <KpiCard
              label="Active Now"
              value={(activeAlerts + activeReports)}
              sub={`${activeAlerts} alerts · ${activeReports} reports`}
              warning={(activeAlerts + activeReports) > 0}
            />
            <KpiCard
              label="Resolved"
              value={(resolvedAlerts + resolvedReports)}
              sub={`${resolvedAlerts} alerts · ${resolvedReports} reports`}
            />
            <KpiCard
              label="Team"
              value={activeTeam}
              sub={`${activeTeam} active of ${totalTeam} total`}
            />
          </div>

          {/* ── Case Volume Chart ── */}
          <div className="card" style={{ marginBottom: "var(--space-6)" }}>
            <div className="section-header">
              <h2 className="section-header__title"><BarChart3 width={16} height={16} /> Case Volume (7 Day)</h2>
            </div>
            {volume.length === 0 || volume.every((v: any) => v.count === 0) ? (
              <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", padding: "var(--space-4)" }}>No volume data for this period.</p>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-2)", height: 200, padding: "var(--space-4) var(--space-4) 0" }}>
                {volume.map((v: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      {v.alerts > 0 && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-destructive)" }}>{v.alerts}</span>}
                      {v.reports > 0 && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-brand)" }}>{v.reports}</span>}
                      <span className="text-secondary" style={{ fontSize: "var(--text-xs)" }}>{v.count}</span>
                    </div>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 1, alignItems: "stretch" }}>
                      {v.alerts > 0 && (
                        <div style={{ height: `${Math.max(2, (v.alerts / maxVolume) * 100)}px`, background: "var(--color-destructive)", borderRadius: "var(--radius-sm) var(--radius-sm) 0 0", opacity: 0.8 }} />
                      )}
                      {v.reports > 0 && (
                        <div style={{ height: `${Math.max(2, (v.reports / maxVolume) * 100)}px`, background: "var(--color-brand)", borderRadius: v.alerts > 0 ? "0 0 var(--radius-sm) var(--radius-sm)" : "var(--radius-sm)" }} />
                      )}
                      {v.count === 0 && (
                        <div style={{ height: 4, background: "var(--color-border)", borderRadius: "var(--radius-sm)" }} />
                      )}
                    </div>
                    <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{v.day}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: "var(--space-4)", padding: "var(--space-3) var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--color-destructive)" }} /> Alerts
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "var(--text-xs)" }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--color-brand)" }} /> Reports
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
            {/* ── Category Distribution ── */}
            <div className="card">
              <div className="section-header">
                <h2 className="section-header__title">Cases by Category</h2>
              </div>
              {category.length === 0 ? (
                <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", padding: "var(--space-4)" }}>No category data available.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "0 var(--space-4) var(--space-4)" }}>
                  {category.map((c: any, i: number) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 4 }}>
                        <span>{c.label}</span>
                        <span className="text-secondary">{c.count} ({c.percentage})</span>
                      </div>
                      <div style={{ height: 8, background: "var(--color-surface-sunken)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                        <div style={{ width: `${(c.count / maxCat) * 100}%`, height: "100%", background: "var(--color-brand)", borderRadius: "var(--radius-full)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Alert Status Breakdown ── */}
            <div className="card">
              <div className="section-header">
                <h2 className="section-header__title">Alert Status Breakdown</h2>
              </div>
              {Object.keys(alertStatusCounts).length === 0 ? (
                <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", padding: "var(--space-4)" }}>No alert data available.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", padding: "0 var(--space-4) var(--space-4)" }}>
                  {Object.entries(alertStatusCounts)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([status, count]) => (
                      <div key={status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                        <Badge variant={status} tone="status">{String(status).replace(/_/g, " ")}</Badge>
                        <span className="mono" style={{ fontSize: "var(--text-sm)" }}>{String(count)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Team Performance ── */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="section-header" style={{ margin: "var(--space-4)" }}>
              <h2 className="section-header__title">Team Performance</h2>
              <Link href="/operations/team" className="section-header__link">View all</Link>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Cases</th>
                </tr>
              </thead>
              <tbody>
                {team.slice(0, 8).map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={t.name} src={(t as any).avatar_url} size="sm" />
                        <span>{t.name}</span>
                      </div>
                    </td>
                    <td>{t.role}</td>
                    <td>
                      <span className={t.is_active ? "text-success" : "text-critical"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="mono">{t.active_cases ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
