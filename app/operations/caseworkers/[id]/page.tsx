"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { workerStatus, formatShortDate } from "@/lib/operations/utils";
import { User } from "lucide-react";
import "@/styles/operations/misc.css";

export default function CaseworkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;
  const { data: team = [], isLoading } = useGetAgencyTeam();
  const { data: alerts = [] } = useGetAlerts();
  const [tab, setTab] = useState<"profile" | "operational">("profile");

  const worker = team.find((t) => String(t.id) === String(id));
  const workerCases = alerts.filter((a) => String(a.assigned_staff_id) === String(id));

  if (isLoading) return <SkeletonRow cols={2} rows={8} />;

  if (!worker) {
    return <EmptyState icon={<User width={40} height={40} />} title="Caseworker not found" />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/operations/caseworkers" className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
            ← Back to caseworkers
          </Link>
          <h1 className="page-header__title" style={{ marginTop: 8 }}>{worker.name}</h1>
          <p className="page-header__subtitle">{worker.role} • {worker.email}</p>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented">
          {(
            [
              ["profile", "Profile"],
              ["operational", "Operational"],
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

      {tab === "profile" ? (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <Avatar name={worker.name} size="lg" />
            <div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>{worker.name}</div>
              <div className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>{worker.role}</div>
            </div>
            <Badge variant={worker.is_active ? "available" : "offline"} tone="worker">
              {worker.is_active ? "ACTIVE" : "OFFLINE"}
            </Badge>
          </div>
          <div className="info-grid">
            <div className="info-row"><span className="info-row__label">Email</span><span className="info-row__value">{worker.email}</span></div>
            <div className="info-row"><span className="info-row__label">Phone</span><span className="info-row__value">{worker.phone_number || "—"}</span></div>
            <div className="info-row"><span className="info-row__label">Role</span><span className="info-row__value">{worker.role}</span></div>
            <div className="info-row"><span className="info-row__label">Status</span><span className="info-row__value">{workerStatus(worker)}</span></div>
            <div className="info-row"><span className="info-row__label">Created</span><span className="info-row__value">{formatShortDate(worker.created_at)}</span></div>
            <div className="info-row"><span className="info-row__label">Active Cases</span><span className="info-row__value">{workerCases.length}</span></div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="section-header" style={{ margin: "var(--space-4)" }}>
            <h2 className="section-header__title">Current & Active Cases</h2>
          </div>
          {workerCases.length === 0 ? (
            <EmptyState title="No active cases" description="This worker has no assigned cases." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Incident</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {workerCases.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/operations/cases/${c.id}`)}>
                    <td className="mono">#{c.id}</td>
                    <td>{c.description || c.incident_type || "Safety Incident"}</td>
                    <td>
                      <Badge variant={c.status} tone="status">{String(c.status).replace(/_/g, " ")}</Badge>
                    </td>
                    <td>{formatShortDate(c.created_at)}</td>
                    <td>
                      <Link href={`/operations/cases/${c.id}`} className="btn btn--ghost btn--sm" onClick={(e) => e.stopPropagation()}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
