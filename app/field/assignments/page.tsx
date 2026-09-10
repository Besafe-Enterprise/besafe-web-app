"use client";

import React, { useMemo } from "react";
import { Briefcase, Check, Search, ListFilter, FileText } from "lucide-react";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerCaseCard } from "@/components/field/shared/WorkerCaseCard";
import { WorkerReportCard } from "@/components/field/shared/WorkerReportCard";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useFieldActiveAlerts, useFieldReports } from "@/lib/field/use-field-data";
import { workerStageFor } from "@/lib/field/utils";
import type { Alert, Report } from "@/types";
import Link from "next/link";

type CombinedItem =
  | { kind: "case"; id: string | number; created_at?: string; data: Alert }
  | { kind: "report"; id: string | number; created_at?: string; data: Report };

export default function FieldAssignmentsPage() {
  const { alerts: active, isLoading, isError, refetch } = useFieldActiveAlerts();
  const { data: reports = [] } = useFieldReports();
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<"all" | "cases" | "reports">("all");

  const activeReports = useMemo(
    () => (reports as Report[]).filter((r) => r.status !== "resolved" && r.status !== "closed"),
    [reports]
  );

  const combined: CombinedItem[] = useMemo(() => {
    const items: CombinedItem[] = [
      ...active.map((a) => ({ kind: "case" as const, id: a.id, created_at: a.created_at, data: a })),
      ...activeReports.map((r) => ({ kind: "report" as const, id: r.id, created_at: r.created_at || r.createdAt, data: r })),
    ];
    return items.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
  }, [active, activeReports]);

  const filtered = useMemo(() => {
    let items = combined;
    if (tab === "cases") items = items.filter((i) => i.kind === "case");
    if (tab === "reports") items = items.filter((i) => i.kind === "report");
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((i) => {
      if (i.kind === "case") {
        const a = i.data;
        return String(a.id).toLowerCase().includes(needle) || (a.description || "").toLowerCase().includes(needle) || (a.incident_type || "").toLowerCase().includes(needle);
      }
      const r = i.data;
      return String(r.id).toLowerCase().includes(needle) || (r.category || "").toLowerCase().includes(needle) || (r.description || "").toLowerCase().includes(needle);
    });
  }, [combined, tab, q]);

  if (isLoading) {
    return (
      <div className="field-list">
        <Skeleton height={18} width="45%" />
        <div style={{ marginTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={120} width="100%" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load your assignments." />;
  }

  const pendingCount = active.filter((a) => a.assignment_status === "pending").length;

  return (
    <div className="field-list">
      <div className="field-list__header">
        <h1>Assignments</h1>
        <span className="field-list__count">{combined.length}</span>
      </div>
      <p className="field-list__subtitle">Active cases &amp; reports — tap to open, capture evidence, and file reports.</p>

      {pendingCount > 0 && (
        <Link href="/field/assignments" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "var(--color-surface)", border: "1px solid var(--color-warning, #F59E0B)", marginBottom: 12, textDecoration: "none" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}><Briefcase width={14} height={14} /> Awaiting your acceptance</span>
          <span style={{ fontSize: 12, color: "var(--color-warning, #F59E0B)", fontWeight: 600 }}>{pendingCount}</span>
        </Link>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {(["all", "cases", "reports"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 9999,
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              background: tab === t ? "var(--color-primary, #3B82F6)" : "var(--color-surface)",
              color: tab === t ? "#fff" : "var(--color-text-secondary)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {t === "all" ? `All (${combined.length})` : t === "cases" ? `Cases (${active.length})` : `Reports (${activeReports.length})`}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <label style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderRadius: 9999, background: "var(--color-surface)", border: "1px solid var(--color-border)", minHeight: 40 }}>
          <Search width={14} height={14} style={{ color: "var(--color-text-tertiary)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID, type, description" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--color-text-primary)" }} />
        </label>
        <Link href="/field/map" className="field-secondary-btn" style={{ minWidth: 44, padding: "0 12px" }}><ListFilter width={16} height={16} /></Link>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Briefcase width={40} height={40} />}
          title="No assignments"
          description={q ? `No results for "${q}".` : "You're all clear. New assignments from dispatch will appear here."}
        />
      ) : (
        filtered.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="field-assignment">
            {item.kind === "case" ? (
              <>
                <WorkerCaseCard alert={item.data} href={`/field/cases/${item.id}`} />
                <div className="field-assignment__hint">
                  {workerStageFor(item.data) === "new" ? (
                    <span className="field-assignment__hint--new">
                      <Check width={14} height={14} /> Awaiting your acceptance
                    </span>
                  ) : (
                    <span>In progress — tap to update</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <WorkerReportCard report={item.data} href={`/field/reports/${item.id}`} />
                <div className="field-assignment__hint">
                  <span>Tap to update</span>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
