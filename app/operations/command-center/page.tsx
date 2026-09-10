"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useGetDashboardStats } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAlerts, useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAlertStore } from "@/stores/useAlertStore";
import type { Alert, Report } from "@/types";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Avatar } from "@/components/operations/shared/Avatar";
import { SkeletonRow, SkeletonKpi } from "@/components/operations/shared/LoadingSkeleton";
import {
  elapsedSince,
  displayPriority,
  incidentLabel,
  workerStatus,
  formatShortDate,
  agencyCoords,
  caseShortId,
  reportShortId,
} from "@/lib/operations/utils";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { AlertCircle, Clock, MapPin, UserX, CheckCircle, ArrowUpRight, X } from "lucide-react";
import "@/styles/operations/command-center.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "100%", width: "100%" }} />,
});

type PipelineFilter = "all" | "new" | "unassigned" | "assigned" | "active_reports";

export default function CommandCenterPage() {
  const router = useRouter();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: alertsResp, isLoading: alertsLoading } = useGetAlerts({ limit: 500, include_resolved: false });
  const { data: reportsResp, isLoading: reportsLoading } = useGetReports({ limit: 500, include_resolved: false });
  const { data: team = [], isLoading: teamLoading } = useGetAgencyTeam();
  const { agency } = useAgencyAuthStore();
  const { alerts: liveAlerts, latestEmergency } = useAlertStore();
  const agencyRef = agencyCoords(agency);
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");

  const isLoading = alertsLoading || reportsLoading;

  const allItems = useMemo(() => {
    const m = new Map<string, Alert>();
    for (const a of (alertsResp?.items ?? []) as Alert[]) m.set(String(a.id), a);
    for (const a of liveAlerts as Alert[]) if (!m.has(String(a.id))) m.set(String(a.id), a);
    for (const a of liveAlerts as Alert[]) if (m.has(String(a.id))) m.set(String(a.id), { ...m.get(String(a.id))!, ...a });
    for (const r of (reportsResp?.items ?? []) as Report[]) {
      const rid = String(r.id);
      if (m.has(rid)) continue;
      m.set(rid, {
        id: r.id,
        status: (r.status || "new") as Alert["status"],
        assigned_staff_id: r.assigned_staff_id ?? null,
        assigned_staff_name: r.assigned_staff_name ?? null,
        assignment_status: r.assignment_status ?? null,
        priority: r.priority_label || r.priority || "medium",
        incident_type: (r.category || r.incident_type || "report") as any,
        category: r.category,
        description: r.description || "",
        location: r.location,
        gps_lat: r.location?.latitude ?? r.location?.lat ?? null,
        gps_lng: r.location?.longitude ?? r.location?.lng ?? null,
        created_at: r.created_at || r.createdAt,
        updated_at: r.updated_at,
        user_name: r.user_name,
        user_phone: r.user_phone,
        user: r.userId
          ? { id: r.userId, name: String(r.userId).slice(-6).toUpperCase(), phone: "" }
          : undefined,
        _reportType: "safe_chat",
      } as Alert);
    }
    return Array.from(m.values());
  }, [liveAlerts, alertsResp, reportsResp]);

  const unassigned = useMemo(
    () => allItems.filter((a) => !a.assigned_staff_id && (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status)),
    [allItems]
  );

  const assigned = useMemo(
    () => allItems.filter((a) => (a.assigned_staff_id || a.assigned_staff_name) && (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status)),
    [allItems]
  );

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, moderate: 3, low: 4 };

  const filteredTableItems = useMemo(() => {
    let list = allItems;
    if (pipelineFilter === "new") list = list.filter((a) => a.status === "new");
    else if (pipelineFilter === "unassigned") list = unassigned;
    else if (pipelineFilter === "assigned") list = assigned;
    else if (pipelineFilter === "active_reports") list = allItems.filter((a) => (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status));
    else list = [...unassigned, ...assigned];
    return [...list].sort((a, b) => (priorityOrder[displayPriority(a.priority)] ?? 5) - (priorityOrder[displayPriority(b.priority)] ?? 5));
  }, [allItems, pipelineFilter, unassigned, assigned]);

  const attentionItems = useMemo(() => {
    const items: Array<{
      key: string;
      code: string;
      label: string;
      location: string;
      reason: string;
      elapsed: string;
      action: string;
      href: string;
    }> = [];

    const sortedUnassigned = [...unassigned].sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    );

    sortedUnassigned.slice(0, 5).forEach((a) => {
      const isReport = (a as Alert & { _reportType?: string })._reportType === "safe_chat";
      items.push({
        key: `unassigned-${a.id}`,
        code: isReport ? reportShortId(a.id) : caseShortId(a.id),
        label: incidentLabel(a.incident_type, a.description),
        location: a.location?.address || "Coordinates pending",
        reason: "Unassigned",
        elapsed: elapsedSince(a.created_at),
        action: "Assign Worker",
        href: isReport ? `/operations/reports/${a.id}` : `/operations/cases/${a.id}`,
      });
    });

    if (latestEmergency && !unassigned.some((u) => u.id === latestEmergency.id)) {
      items.unshift({
        key: `new-${latestEmergency.id}`,
        code: caseShortId(latestEmergency.id),
        label: incidentLabel(latestEmergency.incident_type, latestEmergency.description),
        location: latestEmergency.location?.address || "Coordinates pending",
        reason: "New emergency alert",
        elapsed: elapsedSince(latestEmergency.created_at),
        action: "Open Case",
        href: `/operations/cases/${latestEmergency.id}`,
      });
    }

    return items;
  }, [unassigned, latestEmergency]);

  const canShowMap = agencyRef !== null || allItems.some((a) => a.gps_lat || a.location?.latitude);

  const goToDetail = (c: Alert) => {
    const isReport = (c as Alert & { _reportType?: string })._reportType === "safe_chat";
    router.push(isReport ? `/operations/reports/${c.id}` : `/operations/cases/${c.id}`);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Command Center</h1>
          <p className="page-header__subtitle">
            Live operational overview for {agency?.name || "your agency"}
          </p>
        </div>
        <div className="page-header__actions">
          <Link href="/operations/cases" className="btn btn--secondary btn--sm">
            View Cases
          </Link>
          <Link href="/operations/live-map" className="btn btn--primary btn--sm">
            Live Map
          </Link>
        </div>
      </div>

      {/* ─── 1. KPI ROW — clickable filters on the same page ─── */}
      {statsLoading ? (
        <SkeletonKpi count={4} />
      ) : (
        <div className="kpi-grid">
          {([
            { key: "new" as PipelineFilter, label: "New Today", value: stats?.new_today ?? 0, sub: `${stats?.new_alerts_today ?? 0} alerts · ${stats?.new_reports_today ?? 0} reports`, warning: (stats?.new_today ?? 0) > 0 },
            { key: "unassigned" as PipelineFilter, label: "Unassigned", value: stats?.unassigned ?? unassigned.length, sub: `${stats?.unassigned_alerts ?? 0} alerts · ${stats?.unassigned_reports ?? 0} reports`, warning: (stats?.unassigned ?? unassigned.length) > 0 },
            { key: "assigned" as PipelineFilter, label: "Assigned", value: stats?.assigned ?? 0, sub: `${stats?.assigned_alerts ?? 0} alerts · ${stats?.assigned_reports ?? 0} reports` },
            { key: "active_reports" as PipelineFilter, label: "Active", value: stats?.active ?? 0, sub: `${stats?.active_alerts ?? 0} alerts + reports active`, warning: (stats?.active ?? 0) > 0 },
          ]).map((kpi) => {
            const isActive = pipelineFilter === kpi.key;
            return (
              <button
                key={kpi.key}
                type="button"
                className={`kpi-card ${isActive ? "kpi-card--active" : ""} ${kpi.warning ? "kpi-card--warning" : ""}`}
                onClick={() => setPipelineFilter(isActive ? "all" : kpi.key)}
                style={{ cursor: "pointer", textAlign: "left", border: isActive ? "2px solid var(--color-brand)" : undefined }}
              >
                <span className="kpi-card__label">{kpi.label}</span>
                <span className="kpi-card__value">{kpi.value}</span>
                <span className="kpi-card__sub">{kpi.sub}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── 2. NEEDS ATTENTION ─── */}
      {pipelineFilter === "all" && (
        <section style={{ marginBottom: "var(--space-8)" }}>
          <div className="section-header">
            <h2 className="section-header__title">Needs Attention</h2>
          </div>
          {alertsLoading ? (
            <SkeletonRow cols={3} rows={3} />
          ) : attentionItems.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<AlertCircle width={40} height={40} />}
                title="All clear"
                description="No cases require immediate attention right now."
              />
            </div>
          ) : (
            <div className="attention-list">
              {attentionItems.map((item) => (
                <div key={item.key} className="attention-card" onClick={() => (window.location.href = item.href)}>
                  <div className="attention-card__main">
                    <div className="attention-card__top">
                      <span className="attention-card__id">{item.code}</span>
                      <span className="attention-card__title">{item.label}</span>
                    </div>
                    <div className="attention-card__meta">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <MapPin width={12} height={12} /> {item.location}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Clock width={12} height={12} /> {item.elapsed}
                      </span>
                      <span className="text-critical">{item.reason}</span>
                    </div>
                  </div>
                  <Link href={item.href} className="btn btn--primary btn--sm">
                    {item.action}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── 3. CASES + REPORTS TABLE (filtered by KPI click) ─── */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <div className="section-header">
          <h2 className="section-header__title">
            {pipelineFilter === "all" ? "Active Cases & Reports" :
             pipelineFilter === "new" ? "New Cases & Reports" :
             pipelineFilter === "unassigned" ? "Unassigned Cases & Reports" :
             pipelineFilter === "assigned" ? "Assigned Cases & Reports" :
             "Active Cases & Reports"}
          </h2>
          {pipelineFilter !== "all" && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPipelineFilter("all")} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <X width={12} height={12} /> Clear filter
            </button>
          )}
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {isLoading ? (
            <SkeletonRow cols={9} rows={5} />
          ) : filteredTableItems.length === 0 ? (
            <EmptyState
              icon={<CheckCircle width={40} height={40} />}
              title="Nothing here"
              description="No items match the current filter."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Incident</th>
                  <th>Location</th>
                  <th>Worker</th>
                  <th>Status</th>
                  <th>Elapsed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTableItems.slice(0, 20).map((c) => {
                  const isReport = (c as Alert & { _reportType?: string })._reportType === "safe_chat";
                  return (
                    <tr key={c.id} onClick={() => goToDetail(c)} style={{ cursor: "pointer" }}>
                      <td className="mono">{isReport ? reportShortId(c.id) : caseShortId(c.id)}</td>
                      <td>
                        <Badge variant="new" tone="status">
                          {isReport ? "SafeChat" : "SOS"}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={displayPriority(c.priority)} tone="priority">
                          {displayPriority(c.priority)}
                        </Badge>
                      </td>
                      <td>{incidentLabel(c.incident_type, c.description)}</td>
                      <td style={{ maxWidth: 180 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }}>
                          {c.location?.address || "Coordinates pending"}
                        </span>
                      </td>
                      <td>{c.assigned_staff_name || <span className="text-critical">Unassigned</span>}</td>
                      <td>
                        <Badge variant={c.status} tone="status">
                          {c.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td>{elapsedSince(c.created_at)}</td>
                      <td>
                        {!c.assigned_staff_name ? (
                          <button type="button" className="btn btn--primary btn--sm" onClick={(e) => { e.stopPropagation(); goToDetail(c); }}>
                            Assign
                          </button>
                        ) : (
                          <button type="button" className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); goToDetail(c); }}>
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ─── 4. LIVE MAP + TEAM STATUS ─── */}
      <div className="cc-split">
        <div className="cc-map">
          <div className="section-header" style={{ margin: "var(--space-4)" }}>
            <h2 className="section-header__title">Live Map</h2>
          </div>
          <div className="cc-map__body">
            {canShowMap ? (
              <MapboxView
                alerts={allItems as any}
                compact
                agencyLocation={
                  agencyRef
                    ? {
                        latitude: agencyRef.lat,
                        longitude: agencyRef.lng,
                        name: agency?.name || "Agency HQ",
                      }
                    : undefined
                }
                interactive={false}
                showControls={false}
              />
            ) : (
              <EmptyState
                icon={<MapPin width={40} height={40} />}
                title="No map data"
                description="No coordinates available to display."
              />
            )}
            <Link href="/operations/live-map" className="btn btn--secondary btn--sm cc-map__link">
              View Full Map
              <ArrowUpRight width={13} height={13} />
            </Link>
          </div>
        </div>

        <div className="cc-team">
          <div className="section-header">
            <h2 className="section-header__title">Team Status</h2>
          </div>
          {teamLoading ? (
            <SkeletonRow cols={1} rows={5} />
          ) : team.length === 0 ? (
            <EmptyState
              icon={<UserX width={40} height={40} />}
              title="No team members"
              description="Invite field workers to begin dispatching."
            />
          ) : (
            <div className="cc-team__list">
              {team.slice(0, 8).map((t) => {
                const status = workerStatus(t);
                return (
                  <Link
                    key={t.id}
                    href={`/operations/caseworkers/${t.id}`}
                    className="cc-team__item"
                    style={{ textDecoration: "none" }}
                  >
                    <Avatar name={t.name} size="sm" />
                    <div className="cc-team__info">
                      <div className="cc-team__name">{t.name}</div>
                      <div className="cc-team__detail">
                        {t.role} • Last active {formatShortDate(t.updated_at)}
                      </div>
                    </div>
                    <Badge variant={status} tone="worker">
                      {status === "available" ? "AVAILABLE" : status === "busy" ? "ON CASE" : "OFFLINE"}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. PERFORMANCE SNAPSHOT ─── */}
      <section>
        <div className="section-header">
          <h2 className="section-header__title">Performance Snapshot</h2>
          <Link href="/operations/analytics" className="section-header__link">
            Analytics
          </Link>
        </div>
        <div className="perf-grid">
          <div className="card">
            <span className="kpi-card__label">Total Cases</span>
            <div className="kpi-card__value">{stats?.total_all_time ?? stats?.total ?? 0}</div>
            <span className="kpi-card__sub">All time for this agency</span>
          </div>
          <div className="card">
            <span className="kpi-card__label">Resolved Today</span>
            <div className="kpi-card__value">{stats?.resolved_today ?? stats?.resolved ?? 0}</div>
            <span className="kpi-card__sub"># {new Date().toLocaleDateString()}</span>
          </div>
          <div className="card">
            <span className="kpi-card__label">Avg Response</span>
            <div className="kpi-card__value">
              {stats?.avg_response_minutes ? `${stats.avg_response_minutes}m` : "—"}
            </div>
            <span className="kpi-card__sub">Case created → worker on site</span>
          </div>
        </div>
      </section>
    </div>
  );
}
