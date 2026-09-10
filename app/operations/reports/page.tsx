"use client";

import React, { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import Pagination from "@/components/operations/shared/Pagination";
import { ACTIVE_CASE_STATUSES } from "@/types";
import type { Report } from "@/types";
import { formatShortDate, reportShortId, elapsedSince } from "@/lib/operations/utils";
import { Search } from "lucide-react";
import { FileText } from "lucide-react";

const PAGE_SIZE = 25;

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "all");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [includeResolved, setIncludeResolved] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("besafe_show_resolved_reports") === "true";
    }
    return false;
  });

  // Map tab to backend status param
  const backendStatus = useMemo(() => {
    if (["new", "triaged", "assigned", "reviewing", "resolved", "closed"].includes(tab)) {
      return tab;
    }
    return undefined; // "all", "active", "unassigned" → let backend handle
  }, [tab]);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== query) setQuery(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isSearching = query.trim().length > 0;
  const { data, isLoading } = useGetReports({
    status: backendStatus,
    page: isSearching ? 1 : page,
    limit: isSearching ? 500 : PAGE_SIZE,
    include_resolved: includeResolved,
  });

  const serverItems = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  // Client-side filters for unassigned/assigned tabs + search
  const filtered = useMemo(() => {
    let list = serverItems as Report[];
    if (tab === "unassigned")
      list = list.filter((r) => !r.assigned_staff_id);
    else if (tab === "assigned")
      list = list.filter((r) => r.assigned_staff_id);
    if (query.trim()) {
      const raw = query.trim();
      const norm = raw.replace(/^#/, "").replace(/^(case|rpt)[-_]?/i, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const shortTail = norm.length >= 6 ? norm.slice(-6) : norm;
      const q = raw.toLowerCase();
      const normQ = norm.toLowerCase();
      list = list.filter((r) => {
        const idStr = String(r.id).toLowerCase();
        const idNorm = idStr.replace(/[^a-z0-9]/gi, "");
        const shortId = reportShortId(r.id).toLowerCase();
        const shortIdNorm = shortId.replace(/[^a-z0-9]/gi, "");
        if (idStr.includes(q) || idNorm.includes(normQ) || idNorm.endsWith(shortTail) || shortId.includes(q) || shortIdNorm.includes(normQ) || shortIdNorm.endsWith(shortTail)) return true;
        if ((r.description || "").toLowerCase().includes(q)) return true;
        if ((r.category || "").toLowerCase().includes(q)) return true;
        if ((r.user_name || "").toLowerCase().includes(q)) return true;
        if ((r.assigned_staff_name || "").toLowerCase().includes(q)) return true;
        return false;
      });
    }
    return list;
  }, [serverItems, tab, query]);

  // Reset to page 1 when tab or include_resolved changes
  useEffect(() => {
    setPage(1);
  }, [tab, includeResolved]);

  // Sync include_resolved to localStorage
  useEffect(() => {
    localStorage.setItem("besafe_show_resolved_reports", String(includeResolved));
  }, [includeResolved]);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <h1 className="page-header__title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              Safety Chat Reports
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-full)", padding: "2px 12px" }}>
                {totalCount.toLocaleString()}
              </span>
            </h1>
            <p className="page-header__subtitle">Submitted SafeChat reports and investigation reviews</p>
          </div>
        </div>
      </div>

      <div className="cases-lookup" style={{ marginBottom: "var(--space-3)", maxWidth: 420 }}>
        <Search width={14} height={14} className="cases-lookup__icon" />
        <input className="cases-lookup__input" placeholder="Search Report ID, category…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div className="segmented" style={{ flexWrap: "wrap" }}>
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["new", "New"],
              ["unassigned", "Unassigned"],
              ["assigned", "Assigned"],
              ["triaged", "Triaged"],
              ["reviewing", "Under Review"],
              ["resolved", "Resolved"],
              ["closed", "Closed"],
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

      {isLoading ? (
        <SkeletonRow cols={8} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText width={40} height={40} />}
            title="No reports"
            description={tab === "all" ? "No safety chat reports yet." : `No reports match "${tab}".`}
          />
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, overflowX: "auto", overflowY: "hidden" }}>
            <table className="data-table" style={{ width: "max-content", minWidth: "100%" }}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Category</th>
                  <th>Reporter</th>
                  <th>Worker</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Elapsed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} onClick={() => router.push(`/operations/reports/${r.id}`)}>
                    <td className="mono" title={String(r.id)}>{reportShortId(r.id)}</td>
                    <td>
                      {String(r.category || r.incident_type || "Report")
                        .replace(/[_-]/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </td>
                    <td title={r.user_phone || ""}>{r.user_name || "Anonymous"}</td>
                    <td>{r.assigned_staff_name || <span className="text-critical">Unassigned</span>}</td>
                    <td>{formatShortDate(r.created_at || r.createdAt)}</td>
                    <td>
                      <Badge variant={r.status} tone="report">{String(r.status).replace(/[_-]/g, " ")}</Badge>
                    </td>
                    <td>{elapsedSince(r.created_at || r.createdAt)}</td>
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
          {!isSearching ? (
            <Pagination
              currentPage={page}
              totalItems={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          ) : filtered.length > PAGE_SIZE ? (
            <p className="text-tertiary" style={{ fontSize: "var(--text-xs)", textAlign: "center", marginTop: 12 }}>Showing {filtered.length} matches — refine your search.</p>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="ops-page-loading">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
