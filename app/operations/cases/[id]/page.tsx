"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetAlerts, useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { useAssignAlert } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useReviewFieldReport } from "@/lib/hooks/team/use-team-data";
import { useAlertStore } from "@/stores/useAlertStore";
import type { Alert, FieldReport, FieldEvidenceItem } from "@/types";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { CASE_STAGES, incidentLabel, displayPriority, elapsedSince, formatShortDate, workerStatus, caseShortId, type CaseStatus } from "@/lib/operations/utils";
import { toast } from "sonner";
import { Check, X, UserPlus, RotateCcw, FileText, Copy, Download, ExternalLink, MapPin, Phone, Mail, Shield, Clock, Image as ImageIcon, File, Video, Music, Eye, ChevronDown } from "lucide-react";
import EvidenceLightbox, { EvidenceLightboxItem } from "@/components/shared/EvidenceLightbox";
import "@/styles/operations/cases.css";

function CaseStepper({ status }: { status?: string }) {
  const current = useMemo(() => {
    if (!status) return 0;
    const s = String(status).toLowerCase().replace(/[_-]/g, " ").trim();
    return Math.max(0, CASE_STAGES.indexOf(s as CaseStatus));
  }, [status]);
  return (
    <div className="stepper">
      {CASE_STAGES.map((stage, i) => {
        const isDone = i < current;
        const isCurrent = i === current;
        return (
          <div key={stage} className={`stepper__stage ${isCurrent ? "stepper__stage--current" : ""} ${isDone ? "stepper__stage--done" : ""} ${i > current ? "stepper__stage--future" : ""}`}>
            <span className={`stepper__dot ${isDone ? "stepper__dot--done" : ""} ${isCurrent ? "stepper__dot--current" : ""}`}>{isDone ? <Check width={12} height={12} /> : i + 1}</span>
            <span className="stepper__stage-label">{stage.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

function ReviewBox({ alertId, report }: { alertId: string; report: FieldReport }) {
  const review = useReviewFieldReport();
  const [objecting, setObjecting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const rs = report.review_status || "draft";
  if (rs === "approved") return <span className="badge badge--success"><Check width={12} height={12} /> Approved</span>;
  if (rs === "changes_requested") return <span className="badge badge--critical">Changes requested</span>;
  if (!objecting) {
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn--primary btn--sm" disabled={review.isPending} onClick={() => review.mutate({ alertId, reportId: String(report.id), decision: "approved" })}><Check width={14} height={14} /> Approve</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={review.isPending} onClick={() => setObjecting(true)}><X width={14} height={14} /> Request changes</button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea className="input" rows={3} placeholder="What must the field worker change?" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" className="btn btn--danger btn--sm" disabled={review.isPending || !feedback.trim()} onClick={() => review.mutate({ alertId, reportId: String(report.id), decision: "changes_requested", feedback: feedback.trim() }, { onSuccess: () => { setObjecting(false); setFeedback(""); } })}>Send back</button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setObjecting(false)}>Cancel</button>
      </div>
    </div>
  );
}

async function doExportCasePdf(alert: Alert) {
  const tid = toast.loading("Generating PDF…");
  try {
    const { exportApi, downloadBlob } = await import("@/lib/api");
    const blob = await exportApi.casePdf(String(alert.id));
    downloadBlob(blob as Blob, `case-${alert.id}.pdf`);
    toast.success("Case PDF downloaded", { id: tid });
  } catch (e: unknown) {
    const raw = (e as { response?: { data?: Blob | { error?: string; message?: string } } })?.response?.data;
    let message = "PDF export failed — try again";
    if (raw instanceof Blob) {
      try {
        const text = await raw.text();
        message = text ? (JSON.parse(text)?.error || text) : message;
      } catch {
        message = "PDF export failed";
      }
    } else if (raw && typeof raw === "object") {
      message = (raw as { error?: string; message?: string }).error || (raw as { message?: string }).message || message;
    } else if (typeof raw === "string" && raw) {
      message = raw;
    }
    if (String(message).toLowerCase().includes("rate limited") || String(message).toLowerCase().includes("too many")) {
      message = "Too many exports — please wait a few seconds and try again.";
    }
    toast.error(message, { id: tid });
  }
}

function EvidenceIcon({ type }: { type?: string }) {
  const t = String(type || "").toLowerCase();
  if (t === "photo" || t === "image") return <ImageIcon width={14} height={14} />;
  if (t === "video") return <Video width={14} height={14} />;
  if (t === "audio") return <Music width={14} height={14} />;
  return <File width={14} height={14} />;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { data: alertsResp, isLoading } = useGetAlerts({ limit: 500, include_resolved: true });
  const { data: team = [], isLoading: teamLoading } = useGetAgencyTeam();
  const { alerts: liveAlerts } = useAlertStore();
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [lightbox, setLightbox] = useState<EvidenceLightboxItem | null>(null);
  const [openReports, setOpenReports] = useState<Record<string, boolean>>({});
  const { mutate: assignAlert, isPending: assigning } = useAssignAlert();
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateAlertStatus();

  const caseItem = useMemo(() => {
    // Merge API + live store — API wins so profile updates immediately after assign/status
    const merged = new Map<string, Alert>();
    for (const a of (alertsResp?.items ?? [])) merged.set(String(a.id), a);
    for (const a of liveAlerts) if (!merged.has(String(a.id))) merged.set(String(a.id), a);
    return merged.get(String(id)) || null;
  }, [liveAlerts, alertsResp, id]);

  const handler = useMemo(() => {
    if (!caseItem?.assigned_staff_id) return null;
    return team.find((t) => String(t.id) === String(caseItem.assigned_staff_id)) || null;
  }, [team, caseItem]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }, [caseItem]);

  const reports: FieldReport[] = (caseItem?.field_reports as FieldReport[]) || [];
  const evidence: FieldEvidenceItem[] = (caseItem?.field_evidence as FieldEvidenceItem[]) || [];
  const coords = caseItem?.gps_lat ?? caseItem?.location?.latitude ?? caseItem?.location?.lat;
  const lng = caseItem?.gps_lng ?? caseItem?.location?.longitude ?? caseItem?.location?.lng;

  const handleAssign = (staffId: string, staffName: string) => {
    if (!caseItem) return;
    assignAlert({ alertId: caseItem.id, staffId, staffName }, { onSuccess: () => { setAssignOpen(false); } });
  };

  const handleStatus = (status: string) => {
    if (!caseItem) return;
    updateStatus({ id: caseItem.id, status: status as never }, { onSuccess: () => { setStatusOpen(false); } });
  };

  if (isLoading) return <SkeletonRow cols={2} rows={8} />;
  if (!caseItem) return <EmptyState icon={<Copy width={40} height={40} />} title="Case not found" description={`No case found with ID ${caseShortId(id)}.`} />;

  return (
    <div>
      <Link href="/operations/cases" className="text-tertiary" style={{ fontSize: "var(--text-sm)", display: "inline-block", marginBottom: "var(--space-3)" }}>← Back to cases</Link>

      <div className="case-detail" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.9fr)", gap: "var(--space-4)", alignItems: "start" }}>
        {/* LEFT */}
        <div className="case-detail__left" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="case-header card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
              <div>
                <div className="case-header__row">
                  <span className="case-header__id mono" title={String(caseItem.id)}>{caseShortId(caseItem.id)}</span>
                  <Badge variant={displayPriority(caseItem.priority)} tone="priority">{displayPriority(caseItem.priority)}</Badge>
                  <Badge variant={caseItem.status} tone="status">{String(caseItem.status).replace(/_/g, " ")}</Badge>
                </div>
                <div className="case-header__title" style={{ marginTop: 8 }}>{incidentLabel(caseItem.incident_type, caseItem.description)}</div>
                <div className="case-header__sub" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  <Clock width={12} height={12} /> {elapsedSince(caseItem.created_at)} • <MapPin width={12} height={12} /> {caseItem.location?.address || (coords != null && lng != null ? `${Number(coords).toFixed(4)}, ${Number(lng).toFixed(4)}` : "Location pending")} • {caseItem.assigned_staff_name || "Unassigned"}
                </div>
              </div>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStatusOpen((v) => !v)} disabled={updatingStatus}>Change Status <ChevronDown width={14} height={14} /></button>
                {statusOpen && (
                  <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 20, minWidth: 200, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    {["new", "pending_acceptance", "assigned", "acknowledged", "reviewing", "resolved", "closed", "false_alarm"].map((s) => (
                      <button key={s} type="button" className="btn btn--ghost btn--sm" style={{ justifyContent: "flex-start" }} onClick={() => handleStatus(s)}>{s.replace(/_/g, " ")}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="case-header__actions" style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["resolved", "closed", "false_alarm"].includes(String(caseItem.status)) ? (
                <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>Cannot assign — case is {String(caseItem.status).replace(/_/g, " ")}</span>
              ) : !caseItem.assigned_staff_name ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setAssignOpen(true)}><UserPlus width={14} height={14} /> Assign handler</button>
              ) : (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setAssignOpen(true)}><RotateCcw width={14} height={14} /> Reassign</button>
              )}
              <Link href="/operations/reports" className="btn btn--secondary btn--sm"><FileText width={14} height={14} /> SafeChat Reports</Link>
              {coords != null && lng != null && (
                <Link href={`/operations/live-map?case=${caseItem.id}`} className="btn btn--secondary btn--sm"><MapPin width={14} height={14} /> Open in Map</Link>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Case Information</h2><span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{elapsedSince(caseItem.created_at)} ago</span></div>
            <div className="info-grid">
              <div className="info-row"><span className="info-row__label">Case ID</span><span className="info-row__value mono">#{caseItem.id}</span></div>
              <div className="info-row"><span className="info-row__label">Category</span><span className="info-row__value">{caseItem.incident_type || "sos"}</span></div>
              <div className="info-row"><span className="info-row__label">Priority</span><span className="info-row__value">{displayPriority(caseItem.priority)}</span></div>
              <div className="info-row"><span className="info-row__label">Status</span><span className="info-row__value">{String(caseItem.status).replace(/_/g, " ")}</span></div>
              <div className="info-row"><span className="info-row__label">Reporter</span><span className="info-row__value">{caseItem.user?.name || caseItem.user_name || "Anonymous"}</span></div>
              <div className="info-row"><span className="info-row__label">Phone</span><span className="info-row__value">{caseItem.user_phone || caseItem.user?.phone || "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Created</span><span className="info-row__value">{formatShortDate(caseItem.created_at)}</span></div>
              <div className="info-row"><span className="info-row__label">Location</span><span className="info-row__value mono">{coords != null && lng != null ? `${Number(coords).toFixed(4)}, ${Number(lng).toFixed(4)}` : "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Handling</span><span className="info-row__value">{caseItem.assigned_staff_name ? <Link href={handler ? `/operations/caseworkers/${handler.id}` : "#"} style={{ textDecoration: "underline" }}>{caseItem.assigned_staff_name}</Link> : "Unassigned"}</span></div>
              <div className="info-row"><span className="info-row__label">Elapsed</span><span className="info-row__value">{elapsedSince(caseItem.created_at)}</span></div>
            </div>
            {caseItem.description && <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-3)", lineHeight: 1.6 }}>{caseItem.description}</p>}
            {caseItem.transcribed_text && <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", marginTop: 8, fontStyle: "italic" }}>“{caseItem.transcribed_text}”</p>}
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Case Progress</h2></div>
            <CaseStepper status={caseItem.status} />
          </div>

          {/* EVIDENCE */}
          <div id="evidence" className="card">
            <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><ImageIcon width={16} height={16} /> Evidence • {evidence.length}</h2>
            </div>
            {evidence.length === 0 ? (
              <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No evidence uploaded yet. Field worker can add photos, video, audio or documents from the case file.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
                {evidence.map((ev) => (
                  <div key={ev.id} className="card" style={{ padding: 0, overflow: "hidden", cursor: ev.url ? "pointer" : "default" }} onClick={() => ev.url && setLightbox({ url: ev.url, type: ev.type, name: ev.name })}>
                    <div style={{ aspectRatio: "4/3", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {ev.type === "photo" && ev.url ? <img src={ev.url} alt={ev.name || "evidence"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ev.type === "video" && ev.url ? <video src={ev.url} style={{ width: "100%", height: "100%" }} muted /> : ev.type === "audio" && ev.url ? <Music width={28} height={28} /> : <File width={28} height={28} />}
                    </div>
                    <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><EvidenceIcon type={ev.type} /> {ev.name || ev.type || "file"}</span>
                      <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{ev.uploaded_at ? formatShortDate(ev.uploaded_at) : ""}</span>
                      {ev.url && <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox({ url: ev.url, type: ev.type, name: ev.name }); }} style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, color: "var(--color-brand)", cursor: "pointer" }}><Eye width={12} height={12} /> Preview</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REPORTS — the core agency review surface */}
          <div className="card">
            <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText width={16} height={16} /> Field Reports • {reports.length}</h2>
              <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{reports.filter((r) => (r.review_status || "draft") === "submitted").length} awaiting review</span>
            </div>
            {reports.length === 0 ? (
              <EmptyState title="No reports yet" description="The field worker hasn't submitted a report for this case. Reports appear here for your approval." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {reports.map((r) => {
                  const rid = String(r.id);
                  const open = !!openReports[rid];
                  const rs = r.review_status || "draft";
                    return (
                    <div key={rid} id={`report-${rid}`} className="card" style={{ padding: 0, overflow: "hidden", borderLeft: `3px solid ${rs === "approved" ? "var(--color-success)" : rs === "changes_requested" ? "var(--color-critical)" : rs === "submitted" ? "var(--color-info)" : "var(--color-border)"}` }}>
                      <button type="button" onClick={() => setOpenReports((p) => ({ ...p, [rid]: !open }))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                        <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.title || "Field report"}</span>
                          <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{r.created_by_name || "Field worker"} • {formatShortDate(r.created_at)} {r.progress ? `• ${r.progress}` : ""}</span>
                        </span>
                        <Badge variant={rs === "approved" ? "resolved" : rs === "changes_requested" ? "critical" : rs === "submitted" ? "assigned" : "pending"} tone="status">{rs.replace(/_/g, " ")}</Badge>
                        <ChevronDown width={16} height={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms", flexShrink: 0 }} />
                      </button>
                      {open && (
                        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--color-border)" }}>
                          <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: 10, whiteSpace: "pre-wrap" }}>{r.body}</p>
                          {rs === "changes_requested" && r.review_feedback && <p style={{ fontSize: "var(--text-sm)", color: "var(--color-critical)", background: "var(--color-critical-bg)", padding: "8px 10px", borderRadius: 8 }}>Objections: {r.review_feedback}</p>}
                          {rs === "approved" && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-success)" }}><Check width={12} height={12} style={{ display: "inline", marginRight: 4 }} />Approved{ r.reviewed_at ? ` • ${formatShortDate(r.reviewed_at)}` : ""}</p>}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            {(rs === "submitted" || rs === "draft") && <ReviewBox alertId={String(caseItem.id)} report={r} />}
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => { navigator.clipboard.writeText(r.body || ""); toast.success("Copied"); }}><Copy width={12} height={12} /> Copy</button>
                            <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{r.updated_at && r.updated_at !== r.created_at ? `Updated ${formatShortDate(r.updated_at)}` : ""}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Timeline</h2></div>
            <Timeline caseItem={caseItem} reports={reports} />
          </div>
        </div>

        {/* RIGHT */}
        <div className="case-detail__right" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* HANDLING — who is handling them */}
          <div className="card">
            <div className="section-header"><h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Shield width={14} height={14} /> Handling</h2><Badge variant={caseItem.assigned_staff_name ? "available" : "offline"} tone="worker">{caseItem.assigned_staff_name ? "ASSIGNED" : "UNASSIGNED"}</Badge></div>
            {caseItem.assigned_staff_name ? (
              <>
                <div className="worker-option" style={{ padding: 0, border: "none" }}>
                  <Avatar name={caseItem.assigned_staff_name} src={handler?.avatar_url} />
                  <div className="worker-option__info">
                    <div className="worker-option__name" style={{ display: "flex", alignItems: "center", gap: 6 }}>{caseItem.assigned_staff_name} <Badge variant={handler?.is_active ? "available" : "offline"} tone="worker">{handler ? (handler.is_active ? "ACTIVE" : "OFFLINE") : ""}</Badge></div>
                    <div className="worker-option__meta">{handler?.role || "FIELD_AGENT"} {handler?.email ? `• ${handler.email}` : ""}</div>
                    <div className="worker-option__meta">Assigned {formatShortDate(caseItem.assigned_at)}</div>
                  </div>
                </div>
                {handler && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: "var(--text-xs)" }}>
                    {handler.email && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail width={12} height={12} /> {handler.email}</span>}
                    {handler.phone_number && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone width={12} height={12} /> {handler.phone_number}</span>}
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Shield width={12} height={12} /> {handler.role}</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {handler && <Link href={`/operations/caseworkers/${handler.id}`} className="btn btn--primary btn--sm"><Eye width={14} height={14} /> View worker</Link>}
                  {!["resolved", "closed", "false_alarm"].includes(String(caseItem.status)) && (
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAssignOpen(true)}><RotateCcw width={14} height={14} /> Reassign</button>
                  )}
                </div>
                <p className="text-tertiary" style={{ fontSize: "var(--text-xs)", marginTop: 8 }}>All reports & evidence above are linked to this handler. Use Reassign to change who is handling them.</p>
              </>
            ) : (
              <>
                <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>No field worker handling this case. Pick an available worker — the reports/evidence review will move to them.</p>
                {teamLoading ? <SkeletonRow cols={1} rows={3} /> : team.length === 0 ? <EmptyState title="No workers" description="Invite field workers to assign cases." /> : (
                  <div className="assign-panel">
                    {team.slice(0, 5).map((t) => (
                      <div key={t.id} className="worker-option">
                        <Avatar name={t.name} src={t.avatar_url} size="sm" />
                        <div className="worker-option__info">
                          <div className="worker-option__name">{t.name}</div>
                          <div className="worker-option__meta">{workerStatus(t) === "available" ? "AVAILABLE" : "OFFLINE"} • {t.role}</div>
                        </div>
                        <button type="button" className="btn btn--primary btn--sm" disabled={assigning || !t.is_active} onClick={() => handleAssign(String(t.id), t.name)}>Assign</button>
                      </div>
                    ))}
                    {team.length > 5 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAssignOpen(true)}>View all {team.length} workers</button>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Findings</h2></div>
            <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>{caseItem.transcribed_text || caseItem.description || "No findings recorded yet."}</p>
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin width={14} height={14} /> Location</h2></div>
            <p className="mono text-secondary" style={{ fontSize: "var(--text-sm)" }}>{coords != null && lng != null ? `${Number(coords).toFixed(5)}, ${Number(lng).toFixed(5)}` : "No coordinates attached"}</p>
            {caseItem.location?.address && <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginTop: 6 }}>{caseItem.location.address}</p>}
            {coords != null && lng != null && <Link href={`/operations/live-map?case=${caseItem.id}`} className="btn btn--secondary btn--sm" style={{ marginTop: 8 }}><MapPin width={12} height={12} /> Open in Mapbox</Link>}
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Export</h2></div>
            <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", marginBottom: 8 }}>Download the full case file (reports + evidence) as PDF for archiving.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={`/operations/cases/${caseItem.id}/pdf`} className="btn btn--primary btn--sm"><Download width={14} height={14} /> View PDF</Link>
            </div>
          </div>
        </div>
      </div>

      {assignOpen && (
        <div className="modal-backdrop" onClick={() => setAssignOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Assign handler</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAssignOpen(false)}><X width={14} height={14} /></button>
            </div>
            {assigning ? <SkeletonRow cols={1} rows={3} /> : team.length === 0 ? <EmptyState title="No available workers" description="Invite field workers first." /> : (
              <div className="assign-panel">
                {team.filter((t) => t.is_active).map((t) => (
                  <div key={t.id} className="worker-option">
                    <Avatar name={t.name} src={t.avatar_url} size="sm" />
                    <div className="worker-option__info">
                      <div className="worker-option__name">{t.name}</div>
                      <div className="worker-option__meta">{t.role} • {t.email}</div>
                    </div>
                    <button type="button" className="btn btn--primary btn--sm" onClick={() => handleAssign(String(t.id), t.name)}>Assign</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <EvidenceLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Timeline({ caseItem, reports }: { caseItem: Alert; reports?: FieldReport[] }) {
  const events = useMemo(() => {
    const items: Array<{ time: string; actor: string; text: string; type: string }> = [];

    const history = caseItem.status_history ?? [];
    for (const h of history) {
      const status = String(h.status || "").replace(/_/g, " ");
      let text = "";
      let type = "status";
      if (h.detail) {
        text = h.detail;
      } else if (h.status?.startsWith("escalated_")) {
        text = `Priority escalated to ${h.status.replace("escalated_", "").toUpperCase()}`;
        type = "escalation";
      } else if (h.status === "assigned") {
        text = `Status changed to Assigned`;
      } else if (h.status === "unassigned") {
        text = "Case unassigned";
        type = "assignment";
      } else {
        text = `Status: ${status}`;
      }
      items.push({
        time: formatShortDate(h.timestamp),
        actor: h.actor || "System",
        text,
        type,
      });
    }

    (reports || []).forEach((r) => {
      if (r.created_at) items.push({
        time: formatShortDate(r.created_at),
        actor: r.created_by_name || "Field worker",
        text: `Field report: ${r.title || "Untitled"} (${(r.review_status || "draft").replace(/_/g, " ")})`,
        type: "report",
      });
      if (r.review_status === "approved" && r.reviewed_at) items.push({
        time: formatShortDate(r.reviewed_at),
        actor: "Agency",
        text: `Report ${String(r.id).slice(0, 6)} approved`,
        type: "report",
      });
    });

    items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return items;
  }, [caseItem.status_history, reports]);

  if (events.length === 0) return <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No timeline events recorded.</p>;
  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div key={i} className="timeline__item">
          <div className="timeline__gutter">
            <span className={`timeline__dot ${e.type === "escalation" ? "timeline__dot--warning" : e.type === "assignment" ? "timeline__dot--info" : ""}`} />
            {i < events.length - 1 && <span className="timeline__line" />}
          </div>
          <span className="timeline__time">{e.time}</span>
          <div className="timeline__body">
            <div className="timeline__text">{e.text}</div>
            <div className="timeline__meta">{e.actor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
