"use client";

import React, { useMemo, useState, useRef, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetAlerts } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import Pagination from "@/components/operations/shared/Pagination";
import { ACTIVE_CASE_STATUSES } from "@/types";
import type { Alert } from "@/types";
import {
  elapsedSince,
  displayPriority,
  incidentLabel,
  formatShortDate,
  caseShortId,
} from "@/lib/operations/utils";
import { Search, Table2, Map as MapIcon, Filter, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";
import "@/styles/operations/cases.css";

const MapboxView = dynamic(() => import("@/components/map/MapboxView"), {
  ssr: false,
  loading: () => <div className="skeleton" style={{ height: 420 }} />,
});

const PAGE_SIZE = 25;

function CustomDropdown({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="cases-dd" ref={ref}>
      <span className="cases-lookup__label">{label}</span>
      <button className="cases-dd__trigger" onClick={() => setOpen(!open)}>
        <span className="cases-dd__value">{selected?.label || "All"}</span>
        <ChevronDown width={12} height={12} className={`cases-dd__chevron ${open ? "open" : ""}`} />
      </button>
      {open && (
        <div className="cases-dd__menu">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`cases-dd__item ${opt.value === value ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CasesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { alerts: liveAlerts } = useAlertStore();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [view, setView] = useState<"table" | "map">("table");
  const [page, setPage] = useState(1);
  const [includeResolved, setIncludeResolved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("besafe_show_resolved_cases") === "true";
    }
    return false;
  });

  // Keep query in sync when TopBar pushes ?q=
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Map frontend status filter to backend param
  const backendStatus = useMemo(() => {
    if (statusFilter === "active" || statusFilter === "new" || statusFilter === "acknowledged" ||
        statusFilter === "triaged" || statusFilter === "assigned" || statusFilter === "reviewing" ||
        statusFilter === "resolved" || statusFilter === "closed" || statusFilter === "false_alarm") {
      return statusFilter;
    }
    return undefined; // "all", "unassigned" → let backend return active by default
  }, [statusFilter]);

  const isSearching = query.trim().length > 0;
  const { data, isLoading: alertsLoading } = useGetAlerts({
    status: backendStatus,
    page: isSearching ? 1 : page,
    limit: isSearching ? 500 : PAGE_SIZE,
    include_resolved: includeResolved,
  });

  const isLoading = alertsLoading;
  const serverItems = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  // Merge live socket alerts into current page items
  const allCases = useMemo(() => {
    const m = new Map<string, Alert>();
    for (const a of serverItems) m.set(String(a.id), a);
    for (const a of liveAlerts) {
      if (m.has(String(a.id))) m.set(String(a.id), { ...m.get(String(a.id))!, ...a });
      else m.set(String(a.id), a);
    }
    return Array.from(m.values());
  }, [liveAlerts, serverItems]);

  // Client-side filters (unassigned/assigned, priority, search) on current page
  const filtered = useMemo(() => {
    let list = allCases;

    if (statusFilter === "unassigned")
      list = list.filter((a) => !a.assigned_staff_id && !a.assigned_staff_name);
    else if (statusFilter === "assigned")
      list = list.filter((a) => (a.assigned_staff_id || a.assigned_staff_name));

    if (priorityFilter !== "all")
      list = list.filter((a) => displayPriority(a.priority) === priorityFilter);

    if (query.trim()) {
      const raw = query.trim();
      // Normalize: strip #CASE- / #RPT- / dashes, lower-case. Supports full ObjectId, short tail (#CASE-AB12CD), and raw hex.
      const norm = raw.replace(/^#/, "").replace(/^(case|rpt)[-_]?/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const shortTail = norm.length >= 6 ? norm.slice(-6) : norm;
      const q = raw.toLowerCase();
      const normQ = norm.toLowerCase();
      list = list.filter((a) => {
        const idStr = String(a.id).toLowerCase();
        const idNorm = idStr.replace(/[^a-z0-9]/gi, "");
        const shortId = caseShortId(a.id).toLowerCase(); // #case-xxxxxx
        const shortIdNorm = shortId.replace(/[^a-z0-9]/gi, "");
        // ID match: full, normalized hex, or short-tail (covers #CASE-XXXXXX)
        if (idStr.includes(q) || idNorm.includes(normQ) || idNorm.endsWith(shortTail) || shortId.includes(q) || shortIdNorm.includes(normQ) || shortIdNorm.endsWith(shortTail)) return true;
        if ((a.description || "").toLowerCase().includes(q)) return true;
        if ((a.location?.address || "").toLowerCase().includes(q)) return true;
        if ((a.assigned_staff_name || "").toLowerCase().includes(q)) return true;
        if ((a.user?.name || "").toLowerCase().includes(q)) return true;
        if (String(a.incident_type || "").toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return list;
  }, [allCases, statusFilter, priorityFilter, query]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, includeResolved]);

  // Sync include_resolved to localStorage
  useEffect(() => {
    localStorage.setItem("besafe_show_resolved_cases", String(includeResolved));
  }, [includeResolved]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h1 className="page-header__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              Cases
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", padding: "2px 12px" }}>
                {totalCount.toLocaleString()}
              </span>
            </h1>
            <p className="page-header__subtitle">All incoming distress alerts and case records</p>
          </div>
        </div>
        <div className="page-header__actions">
          <div className="cases-lookup">
            <Search width={14} height={14} className="cases-lookup__icon" />
            <input
              className="cases-lookup__input"
              placeholder="Search ID, location, worker…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="cases-lookup__divider" />
            <CustomDropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "new", label: "New" },
                { value: "acknowledged", label: "Acknowledged" },
                { value: "triaged", label: "Triaged" },
                { value: "assigned", label: "Assigned" },
                { value: "reviewing", label: "Reviewing" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
                { value: "false_alarm", label: "False Alarm" },
                { value: "unassigned", label: "Unassigned" },
              ]}
            />
            <span className="cases-lookup__divider" />
            <CustomDropdown
              label="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "All Priorities" },
                { value: "critical", label: "Critical" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
            />
            <span className="cases-lookup__divider" />
            <label className="cases-toggle">
              <input
                type="checkbox"
                checked={includeResolved}
                onChange={(e) => setIncludeResolved(e.target.checked)}
                className="cases-toggle__input"
              />
              <span className="cases-toggle__label">Include resolved</span>
            </label>
          </div>
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
            compact
          />
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: "var(--space-4)", overflowX: "auto", overflowY: "hidden" }}>
            <table className="data-table" style={{ width: "max-content", minWidth: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Type</th>
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
                    <td className="mono">{caseShortId(c.id)}</td>
                    <td>
                      <Badge variant="new" tone="status">SOS</Badge>
                    </td>
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
          {!isSearching ? (
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          ) : filtered.length > PAGE_SIZE ? (
            <p className="text-tertiary" style={{ fontSize: "var(--text-xs)", textAlign: "center", marginTop: 12 }}>Showing {filtered.length} matches — refine your search to narrow results.</p>
          ) : null}
        </>
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
