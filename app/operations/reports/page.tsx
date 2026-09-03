"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { formatShortDate } from "@/lib/operations/utils";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const { data: reports = [], isLoading } = useGetReports({ status: "all" });
  const [tab, setTab] = useState<
    "all" | "submitted" | "reviewing" | "changes" | "approved"
  >("all");

  const filtered = reports.filter((r) => {
    const s = String(r.status).toLowerCase();
    if (tab === "submitted") return s === "submitted" || s === "pending" || s === "pending_analysis";
    if (tab === "reviewing") return s === "reviewing" || s === "investigating";
    if (tab === "changes") return s === "changes requested" || s.includes("change");
    if (tab === "approved") return s === "approved" || s === "resolved" || s === "closed";
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Reports</h1>
          <p className="page-header__subtitle">SafeChat reports and investigation reviews</p>
        </div>
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented">
          {(
            [
              ["all", "All"],
              ["submitted", "Submitted"],
              ["reviewing", "Under Review"],
              ["approved", "Approved"],
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
          <EmptyState icon={<FileText width={40} height={40} />} title="No reports" description="No reports match this view." />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Incident</th>
                <th>Worker</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => router.push(`/operations/reports/${r.id}`)}>
                  <td className="mono">#{r.id}</td>
                  <td>
                    {String(r.category || r.incident_type || "Report")
                      .replace(/[_-]/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td>{r.assigned_staff_name || "Unassigned"}</td>
                  <td>{formatShortDate(r.created_at || r.createdAt)}</td>
                  <td>
                    <Badge variant={r.status} tone="report">{String(r.status).replace(/[_-]/g, " ")}</Badge>
                  </td>
                  <td>{formatShortDate(r.updated_at || r.updatedAt)}</td>
                  <td>
                    <Link href={`/operations/reports/${r.id}`} className="btn btn--secondary btn--sm" onClick={(e) => e.stopPropagation()}>
                      Review
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
