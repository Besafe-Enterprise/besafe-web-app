"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetMemberDetail, useReviewFieldReport } from "@/lib/hooks/team/use-team-data";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { workerStatus, formatShortDate } from "@/lib/operations/utils";
import { User, Check, X, FileText, Image as ImageIcon, MapPin, ChevronDown } from "lucide-react";
import "@/styles/operations/misc.css";

type Tab = "overview" | "cases";

const ReviewBox = React.memo(function ReviewBox({ alertId, reportId, current }: { alertId: string; reportId: string; current?: string }) {
  const review = useReviewFieldReport();
  const [objecting, setObjecting] = useState(false);
  const [feedback, setFeedback] = useState("");

  if (current === "approved") {
    return (
      <span className="badge badge--success">
        <Check width={12} height={12} /> Approved
      </span>
    );
  }

  if (!objecting) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn--primary btn--sm" disabled={review.isPending} onClick={() => review.mutate({ alertId, reportId, decision: "approved" })}>
          <Check width={14} height={14} /> Approve
        </button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={review.isPending} onClick={() => setObjecting(true)}>
          <X width={14} height={14} /> Object
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
      <textarea className="input" rows={3} placeholder="What must the worker change? (sent back to them)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="btn btn--danger btn--sm"
          disabled={review.isPending || !feedback.trim()}
          onClick={() => review.mutate({ alertId, reportId, decision: "changes_requested", feedback: feedback.trim() }, { onSuccess: () => { setObjecting(false); setFeedback(""); } })}
        >
          Send objections
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setObjecting(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
});

export default function CaseworkerDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string | undefined);

  const { data, isLoading, isError, refetch } = useGetMemberDetail(id);
  const [tab, setTab] = useState<Tab>("overview");
  const [openCase, setOpenCase] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const worker = useMemo(() => data?.member, [data?.member]);
  const cases = useMemo(() => data?.cases ?? [], [data?.cases]);
  const assignedReports = useMemo(() => data?.reports ?? [], [data?.reports]);
  const counts = useMemo(() => data?.counts ?? { total: 0, active: 0, resolved: 0, reports: 0, evidence: 0 }, [data?.counts]);
  const checkins = useMemo(() => data?.checkins ?? [], [data?.checkins]);

  const allItems = useMemo(() => {
    const caseItems = cases.map((c: any) => ({
      id: String(c.id),
      type: "case" as const,
      description: c.description || c.incident_type || "Safety Incident",
      status: c.status || "active",
      priority: c.priority || "medium",
      created_at: c.created_at,
      gps_lat: c.gps_lat,
      gps_lng: c.gps_lng,
      location: c.location,
      field_reports: c.field_reports ?? [],
      field_evidence: c.field_evidence ?? [],
    }));
    const reportItems = assignedReports.map((r: any) => ({
      id: String(r.id),
      type: "report" as const,
      description: r.description || `${(r.category || "Report").replace(/_/g, " ")}`,
      status: r.status || "pending",
      priority: r.priority || "low",
      created_at: r.created_at || r.createdAt,
      gps_lat: r.location?.latitude,
      gps_lng: r.location?.longitude,
      location: r.location,
      field_reports: [],
      field_evidence: [],
    }));
    return [...caseItems, ...reportItems].sort(
      (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""))
    );
  }, [cases, assignedReports]);

  const toggleCase = useCallback((cid: string) => {
    setOpenCase((prev) => (prev === cid ? null : cid));
  }, []);

  const visibleItems = useMemo(() => allItems.slice(0, visibleCount), [allItems, visibleCount]);

  if (!id) {
    return <EmptyState icon={<User width={40} height={40} />} title="Caseworker not found" />;
  }

  if (isLoading && !data) return <SkeletonRow cols={2} rows={8} />;

  if (isError || !data) {
    return (
      <div className="card" style={{ maxWidth: 560 }}>
        <EmptyState icon={<User width={40} height={40} />} title="Couldn't load this caseworker" description="The request failed. Check your connection and try again." />
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: "var(--space-4)" }}>
          <button type="button" className="btn btn--primary btn--sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!worker) {
    return <EmptyState icon={<User width={40} height={40} />} title="Caseworker not found" />;
  }

  return (
    <div style={{ maxWidth: "100%", overflow: "hidden" }}>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Link href="/operations/caseworkers" className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>
            ← Back to caseworkers
          </Link>
          <h1 className="page-header__title" style={{ marginTop: 8, overflowWrap: "anywhere" }}>{worker.name}</h1>
          <p className="page-header__subtitle" style={{ overflowWrap: "anywhere" }}>{worker.role} • {worker.email}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        {[
          ["Cases", counts.total],
          ["Active", counts.active],
          ["Resolved", counts.resolved],
          ["Reports", counts.reports],
          ["Evidence", counts.evidence],
        ].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: "var(--space-3)", textAlign: "center", minHeight: 72, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, lineHeight: 1 }}>{value}</div>
            <div className="text-tertiary" style={{ fontSize: "var(--text-xs)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "var(--space-4)" }}>
        <div className="segmented">
          {(
            [
              ["overview", "Overview"],
              ["cases", `All Items (${counts.total})`],
            ] as const
          ).map(([key, label]) => (
            <button key={key} type="button" className={`segmented__btn ${tab === key ? "segmented__btn--active" : ""}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="caseworker-overview-grid">
          <div className="card" style={{ minHeight: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", marginBottom: "var(--space-4)", minWidth: 0 }}>
              <Avatar name={worker.name} src={(worker as any).avatar_url} size="lg" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, overflowWrap: "anywhere", wordBreak: "break-word" }}>{worker.name}</div>
                <div className="text-tertiary" style={{ fontSize: "var(--text-sm)", overflowWrap: "anywhere" }}>{worker.role}</div>
              </div>
              <Badge variant={worker.is_active ? "available" : "offline"} tone="worker">{worker.is_active ? "ACTIVE" : "OFFLINE"}</Badge>
            </div>
            <div className="info-grid info-grid--single">
              <div className="info-row"><span className="info-row__label">Email</span><span className="info-row__value" style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}>{worker.email}</span></div>
              <div className="info-row"><span className="info-row__label">Phone</span><span className="info-row__value" style={{ overflowWrap: "anywhere", wordBreak: "break-all" }}>{worker.phone_number || "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Role</span><span className="info-row__value">{worker.role}</span></div>
              <div className="info-row"><span className="info-row__label">Status</span><span className="info-row__value">{workerStatus(worker)}</span></div>
              <div className="info-row"><span className="info-row__label">Created</span><span className="info-row__value">{formatShortDate(worker.created_at)}</span></div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden", minHeight: 240, display: "flex", flexDirection: "column" }}>
            <div className="section-header" style={{ margin: "var(--space-4)", flexShrink: 0 }}>
              <h2 className="section-header__title">Latest Location Check-ins</h2>
            </div>
            {checkins.length === 0 ? (
              <EmptyState title="No check-ins" description="This worker hasn't shared location yet." />
            ) : (
              <div style={{ overflowX: "auto", flex: 1 }}>
                <table className="data-table" style={{ width: "max-content", minWidth: "100%" }}>
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Status</th>
                      <th>Coords</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkins.slice(0, 10).map((c: { id: string; recorded_at?: string; status?: string; lat?: number; lng?: number; note?: string }) => (
                      <tr key={c.id}>
                        <td style={{ whiteSpace: "nowrap" }}>{formatShortDate(c.recorded_at)}</td>
                        <td>{c.status || "—"}</td>
                        <td className="mono" style={{ whiteSpace: "nowrap" }}>{c.lat != null && c.lng != null ? `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}` : "—"}</td>
                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {allItems.length === 0 ? (
            <div className="card">
              <EmptyState title="No cases" description="This worker has no assigned cases or reports yet." />
            </div>
          ) : (
            <>
              {visibleItems.map((item) => {
                const open = openCase === item.id;
                const reports = item.field_reports;
                const evidence = item.field_evidence;
                return (
                  <div key={item.id} className="card" style={{ contain: "layout" }}>
                    <button
                      type="button"
                      onClick={() => toggleCase(item.id)}
                      style={{ background: "none", border: "none", padding: 0, margin: 0, font: "inherit", display: "flex", alignItems: "center", gap: "var(--space-3)", width: "100%", cursor: "pointer", textAlign: "left", minWidth: 0 }}
                    >
                      <Badge variant={item.type === "report" ? "info" : "secondary"} tone="status">{item.type === "report" ? "REPORT" : "CASE"}</Badge>
                      <span className="mono" style={{ flexShrink: 0, fontSize: "var(--text-xs)" }}>#{item.id.slice(-6).toUpperCase()}</span>
                      <span style={{ flex: 1, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.description}</span>
                      <Badge variant={item.status} tone="status">{item.status.replace(/_/g, " ")}</Badge>
                      {(reports.length > 0 || evidence.length > 0) && (
                        <span className="text-tertiary" style={{ fontSize: "var(--text-xs)", flexShrink: 0, whiteSpace: "nowrap" }}>
                          {reports.length} • {evidence.length}
                        </span>
                      )}
                      <ChevronDown width={16} height={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms", flexShrink: 0 }} />
                    </button>

                    {open && (
                      <div style={{ marginTop: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                        <div className="info-grid">
                          <div className="info-row"><span className="info-row__label">Priority</span><span className="info-row__value">{item.priority || "—"}</span></div>
                          <div className="info-row"><span className="info-row__label">Created</span><span className="info-row__value">{formatShortDate(item.created_at)}</span></div>
                          {(item.gps_lat != null && item.gps_lng != null) && (
                            <div className="info-row">
                              <span className="info-row__label">Location</span>
                              <span className="info-row__value mono" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><MapPin width={12} height={12} /> {item.gps_lat.toFixed(4)}, {item.gps_lng.toFixed(4)}</span>
                            </div>
                          )}
                        </div>

                        {reports.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: 6 }}>
                              <FileText width={14} height={14} /> Reports ({reports.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                              {reports.map((r: any) => (
                                <div key={r.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                                    <strong style={{ overflowWrap: "anywhere", wordBreak: "break-word", minWidth: 0 }}>{r.title || "Field report"}</strong>
                                    <Badge variant={r.review_status === "approved" ? "resolved" : r.review_status === "changes_requested" ? "critical" : r.review_status === "submitted" ? "assigned" : "pending"} tone="status">{(r.review_status || "draft").replace(/_/g, " ")}</Badge>
                                  </div>
                                  <p style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-2)", overflowWrap: "anywhere", wordBreak: "break-word" }}>{r.body}</p>
                                  <p className="text-tertiary" style={{ fontSize: "var(--text-xs)", marginBottom: "var(--space-2)" }}>
                                    {r.created_by_name || worker.name} • {formatShortDate(r.created_at)}
                                    {r.progress ? ` • ${r.progress}` : ""}
                                  </p>
                                  {r.review_status === "changes_requested" && r.review_feedback && (
                                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-critical)", marginBottom: "var(--space-2)", overflowWrap: "anywhere" }}>
                                      Objections: {r.review_feedback}
                                    </p>
                                  )}
                                  {(r.review_status === "submitted" || !r.review_status || r.review_status === "draft") && (
                                    <ReviewBox alertId={item.id} reportId={String(r.id)} current={r.review_status} />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {evidence.length > 0 && (
                          <div>
                            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 700, marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: 6 }}>
                              <ImageIcon width={14} height={14} /> Evidence ({evidence.length})
                            </h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "var(--space-2)" }}>
                              {evidence.map((e: any) => (
                                <a key={e.id} href={e.url} target="_blank" rel="noreferrer" className="text-tertiary" style={{ fontSize: "var(--text-xs)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                                  [{e.type || "file"}] {e.name || "evidence"}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <Link href={item.type === "report" ? `/operations/reports/${item.id}` : `/operations/cases/${item.id}`} className="btn btn--ghost btn--sm">
                            Open full {item.type === "report" ? "report" : "case file"}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {visibleCount < allItems.length && (
                <button type="button" className="btn btn--secondary" onClick={() => setVisibleCount((n) => n + 20)} style={{ alignSelf: "center" }}>
                  Show {Math.min(20, allItems.length - visibleCount)} more ({allItems.length - visibleCount} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
