"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useGetDashboardStats } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { useAlertStore } from "@/stores/useAlertStore";
import type { Alert } from "@/types";
import { KpiCard } from "@/components/operations/shared/KpiCard";
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
} from "@/lib/operations/utils";
import { AlertCircle, Clock, MapPin, UserX, CheckCircle, ArrowUpRight } from "lucide-react";
import "@/styles/operations/command-center.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: "100%", width: "100%" }} />,
});

export default function CommandCenterPage() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: alerts = [], isLoading: alertsLoading } = useGetAlerts();
  const { data: team = [], isLoading: teamLoading } = useGetAgencyTeam();
  const { agency } = useAgencyAuthStore();
  const { alerts: liveAlerts, latestEmergency } = useAlertStore();
  const agencyRef = agencyCoords(agency);

  // Merge store (realtime) alerts with query alerts
  const allAlerts = useMemo(() => {
    if (liveAlerts.length > 0) return liveAlerts;
    return alerts;
  }, [liveAlerts, alerts]);

  const activeCases = allAlerts.filter((a) => a.status !== "resolved");
  const unassigned = activeCases.filter((a) => !a.assigned_staff_id && !a.assigned_staff_name);

  // Needs attention items
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

    unassigned.slice(0, 5).forEach((a) => {
      items.push({
        key: `unassigned-${a.id}`,
        code: `#${a.id}`,
        label: incidentLabel(a.incident_type, a.description),
        location: a.location?.address || "Coordinates pending",
        reason: "Unassigned",
        elapsed: elapsedSince(a.created_at),
        action: "Assign Worker",
        href: `/operations/cases/${a.id}`,
      });
    });

    if (latestEmergency && !unassigned.some((u) => u.id === latestEmergency.id)) {
      items.unshift({
        key: `new-${latestEmergency.id}`,
        code: `#${latestEmergency.id}`,
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

  const canShowMap = agencyRef !== null || allAlerts.some((a) => a.gps_lat || a.location?.latitude);

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

      {/* ─── 1. KPI ROW ─── */}
      {statsLoading ? (
        <SkeletonKpi count={4} />
      ) : (
        <div className="kpi-grid">
          <KpiCard
            label="Active Cases"
            value={stats?.active_alerts ?? stats?.active ?? activeCases.length}
            sub="Cases needing response"
            href="/operations/cases?status=active"
          />
          <KpiCard
            label="Unassigned"
            value={unassigned.length}
            sub="Awaiting worker assignment"
            warning={unassigned.length > 0}
            href="/operations/cases?status=unassigned"
          />
          <KpiCard
            label="Awaiting Review"
            value={stats?.pending_reports ?? 0}
            sub="Reports pending review"
            href="/operations/reports?status=under-review"
          />
          <KpiCard
            label="SLA Performance"
            value={stats?.avg_response_minutes ? `${stats.avg_response_minutes}m` : "—"}
            sub="Avg response time"
            href="/operations/analytics"
          />
        </div>
      )}

      {/* ─── 2. NEEDS ATTENTION ─── */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <div className="section-header">
          <h2 className="section-header__title">Needs Attention</h2>
          <Link href="/operations/cases" className="section-header__link">
            View all cases
          </Link>
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

      {/* ─── 3. ACTIVE CASES TABLE ─── */}
      <section style={{ marginBottom: "var(--space-8)" }}>
        <div className="section-header">
          <h2 className="section-header__title">Active Cases</h2>
          <Link href="/operations/cases" className="section-header__link">
            View all
          </Link>
        </div>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {alertsLoading ? (
            <SkeletonRow cols={8} rows={5} />
          ) : activeCases.length === 0 ? (
            <EmptyState
              icon={<CheckCircle width={40} height={40} />}
              title="No active cases"
              description="There are no active cases right now."
            />
          ) : (
            <ActiveCasesTable cases={activeCases} />
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
                alerts={allAlerts}
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

function ActiveCasesTable({ cases }: { cases: Alert[] }) {
  const router = useRouter();
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Case ID</th>
          <th>Priority</th>
          <th>Incident</th>
          <th>Location</th>
          <th>Worker</th>
          <th>Status</th>
          <th>Elapsed</th>
          <th>Last Update</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {cases.slice(0, 10).map((c) => (
          <tr key={c.id} onClick={() => router.push(`/operations/cases/${c.id}`)}>
            <td className="mono">{`#${c.id}`}</td>
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
            <td>{formatShortDate(c.updated_at || c.created_at)}</td>
            <td>
              {!c.assigned_staff_name ? (
                <Link href={`/operations/cases/${c.id}`} className="btn btn--primary btn--sm">
                  Assign
                </Link>
              ) : (
                <Link href={`/operations/cases/${c.id}`} className="btn btn--ghost btn--sm">
                  View
                </Link>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
