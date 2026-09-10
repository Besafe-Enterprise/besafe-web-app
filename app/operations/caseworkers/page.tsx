"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useGetAlerts, useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { workerStatus } from "@/lib/operations/utils";
import { Users } from "lucide-react";
import "@/styles/operations/misc.css";

export default function CaseworkersPage() {
  const { data: team = [], isLoading } = useGetAgencyTeam();
  const { data: alertsResp } = useGetAlerts({ limit: 500, include_resolved: false });
  const { data: reportsResp } = useGetReports({ limit: 500, include_resolved: false });
  const [tab, setTab] = useState<"all" | "available" | "oncase" | "offline">("all");

  const casesByWorker = useMemo(() => {
    const map: Record<string, number> = {};
    (alertsResp?.items ?? []).forEach((a) => {
      if (a.assigned_staff_id) {
        map[String(a.assigned_staff_id)] = (map[String(a.assigned_staff_id)] || 0) + 1;
      }
    });
    (reportsResp?.items ?? []).forEach((r) => {
      if (r.assigned_staff_id) {
        map[String(r.assigned_staff_id)] = (map[String(r.assigned_staff_id)] || 0) + 1;
      }
    });
    return map;
  }, [alertsResp, reportsResp]);

  const filtered = team.filter((t) => {
    const status = workerStatus(t);
    if (tab === "available") return status === "available";
    if (tab === "offline") return status === "offline";
    if (tab === "oncase") return casesByWorker[String(t.id)] > 0;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Caseworkers</h1>
          <p className="page-header__subtitle">Field response team and their workload</p>
        </div>
        <div className="page-header__actions">
          <Link href="/operations/team" className="btn btn--secondary btn--sm">
            Manage Team
          </Link>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented">
          {(
            [
              ["all", "All"],
              ["available", "Available"],
              ["oncase", "On Case"],
              ["offline", "Offline"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`segmented__btn ${tab === key ? "segmented__btn--active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <SkeletonRow cols={3} rows={4} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users width={40} height={40} />}
            title="No caseworkers found"
            description="Add team members to start dispatching."
          />
        </div>
      ) : (
        <div className="worker-grid">
          {filtered.map((t) => {
            const status = workerStatus(t);
            return (
              <Link key={t.id} href={`/operations/caseworkers/${t.id}`} style={{ textDecoration: "none" }}>
                <div className="worker-card">
                  <div className="worker-card__head">
                    <Avatar name={t.name} size="lg" />
                    <div className="worker-card__info">
                      <div className="worker-card__name">{t.name}</div>
                      <div className="worker-card__role">{t.role}</div>
                    </div>
                    <Badge variant={status} tone="worker">
                      {status === "available" ? "AVAILABLE" : status === "busy" ? "ON CASE" : "OFFLINE"}
                    </Badge>
                  </div>
                  <div className="worker-card__stats">
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">{casesByWorker[String(t.id)] || 0}</span>
                      <span className="worker-card__stat-label">Active Cases</span>
                    </div>
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">{t.is_active ? "Yes" : "No"}</span>
                      <span className="worker-card__stat-label">Active</span>
                    </div>
                    <div className="worker-card__stat">
                      <span className="worker-card__stat-value">
                        {t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                      </span>
                      <span className="worker-card__stat-label">Joined</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
