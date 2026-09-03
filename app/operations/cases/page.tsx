"use client";

import React, { useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import {
  elapsedSince,
  displayPriority,
  incidentLabel,
  formatShortDate,
} from "@/lib/operations/utils";
import { Search, Table2, Map as MapIcon, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/operations/cases.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 420 }} />,
});

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: alerts = [], isLoading } = useGetAlerts();
  const { alerts: liveAlerts } = useAlertStore();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [view, setView] = useState<"table" | "map">("table");

  const allAlerts = useMemo(() => {
    if (liveAlerts.length > 0) return liveAlerts;
    return alerts;
  }, [liveAlerts, alerts]);

  const filtered = useMemo(() => {
    let list = allAlerts;
    if (statusFilter === "active") list = list.filter((a) => a.status !== "resolved");
    else if (statusFilter === "unassigned")
      list = list.filter((a) => !a.assigned_staff_id && !a.assigned_staff_name);
    else if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);

    if (priorityFilter !== "all")
      list = list.filter((a) => displayPriority(a.priority) === priorityFilter);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) =>
          String(a.id).includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.location?.address || "").toLowerCase().includes(q) ||
          (a.assigned_staff_name || "").toLowerCase().includes(q) ||
          (a.user?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [allAlerts, statusFilter, priorityFilter, query]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Cases</h1>
          <p className="page-header__subtitle">All incoming distress alerts and case records</p>
        </div>
        <div className="page-header__actions">
          <div className="segmented">
            <button
              type="button"
              className={`segmented__btn ${view === "table" ? "segmented__btn--active" : ""}`}
              onClick={() => setView("table")}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Table2 width={14} height={14} /> Table
              </span>
            </button>
            <button
              type="button"
              className={`segmented__btn ${view === "map" ? "segmented__btn--active" : ""}`}
              onClick={() => setView("map")}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <MapIcon width={14} height={14} /> Map
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar__search" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Search width={15} height={15} style={{ color: "var(--color-text-tertiary)" }} />
          <input
            className="input"
            placeholder="Search by case ID, location, reporter, worker..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input filter-bar__select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="unassigned">Unassigned</option>
          <option value="dispatched">Dispatched</option>
          <option value="resolved">Resolved</option>
        </select>
        <select
          className="input filter-bar__select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonRow cols={9} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Filter width={40} height={40} />}
            title="No cases match your filters"
            description="Try adjusting the search or filter criteria."
          />
        </div>
      ) : view === "map" ? (
        <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", height: 520 }}>
          <MapboxView
            alerts={filtered}
            interactive={true}
            mapStyle="dark"
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Priority</th>
                <th>Category</th>
                <th>Incident</th>
                <th>Location</th>
                <th>Worker</th>
                <th>Status</th>
                <th>Created</th>
                <th>SLA</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                  <tr key={c.id} onClick={() => router.push(`/operations/cases/${c.id}`)}>
                  <td className="mono">{`#${c.id}`}</td>
                  <td>
                    <Badge variant={displayPriority(c.priority)} tone="priority">
                      {displayPriority(c.priority)}
                    </Badge>
                  </td>
                  <td>{c.incident_type || c.category || "—"}</td>
                  <td style={{ maxWidth: 180 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {incidentLabel(c.incident_type, c.description)}
                    </span>
                  </td>
                  <td style={{ maxWidth: 160 }}>
                    <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.location?.address || "Coordinates pending"}
                    </span>
                  </td>
                  <td>
                    {c.assigned_staff_name || <span className="text-critical">Unassigned</span>}
                  </td>
                  <td>
                    <Badge variant={c.status} tone="status">
                      {String(c.status).replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td>{formatShortDate(c.created_at)}</td>
                  <td>{elapsedSince(c.created_at)}</td>
                  <td>
                    <Link href={`/operations/cases/${c.id}`} className="btn btn--ghost btn--sm" onClick={(e) => e.stopPropagation()}>
                      View
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

export default function CasesPage() {
  return (
    <Suspense fallback={<div className="ops-page-loading">Loading cases...</div>}>
      <CasesContent />
    </Suspense>
  );
}
