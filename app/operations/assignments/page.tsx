"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { ACTIVE_CASE_STATUSES } from "@/types";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { displayPriority, formatShortDate, incidentLabel } from "@/lib/operations/utils";
import { ClipboardList } from "lucide-react";

export default function AssignmentsPage() {
  const router = useRouter();
  const { data: alertsResp, isLoading } = useGetAlerts({ limit: 500, include_resolved: true });
  const { alerts: liveAlerts } = useAlertStore();
  const [tab, setTab] = useState<"all" | "active" | "unassigned">("all");

  const all = useMemo(() => (liveAlerts.length > 0 ? liveAlerts : (alertsResp?.items ?? [])), [liveAlerts, alertsResp]);

  const filtered = all.filter((a) => {
    if (tab === "unassigned") return !a.assigned_staff_id && !a.assigned_staff_name;
    if (tab === "active") return (ACTIVE_CASE_STATUSES as readonly string[]).includes(a.status) && (a.assigned_staff_id || a.assigned_staff_name);
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Assignments</h1>
          <p className="page-header__subtitle">Current worker assignments across all cases</p>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented">
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["unassigned", "Unassigned"],
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
        <SkeletonRow cols={7} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ClipboardList width={40} height={40} />} title="No assignments" description="No cases match this view." />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Priority</th>
                <th>Incident</th>
                <th>Worker</th>
                <th>Assigned At</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/operations/cases/${c.id}`)}>
                  <td className="mono">#{c.id}</td>
                  <td>
                    <Badge variant={displayPriority(c.priority)} tone="priority">{displayPriority(c.priority)}</Badge>
                  </td>
                  <td>{incidentLabel(c.incident_type, c.description)}</td>
                  <td>{c.assigned_staff_name || <span className="text-critical">Unassigned</span>}</td>
                  <td>{formatShortDate(c.assigned_at)}</td>
                  <td>
                    <Badge variant={c.status} tone="status">{String(c.status).replace(/_/g, " ")}</Badge>
                  </td>
                  <td>
                    <Link href={`/operations/cases/${c.id}`} className="btn btn--ghost btn--sm" onClick={(e) => e.stopPropagation()}>
                      View Case
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
