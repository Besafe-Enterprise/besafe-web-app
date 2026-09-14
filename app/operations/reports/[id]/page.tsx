"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetReports, useUpdateReportStatus, useAssignReport, useAnalyzeReport } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useGetAgencyTeam } from "@/lib/hooks/team/use-team-data";
import { Badge } from "@/components/operations/shared/Badge";
import { Avatar } from "@/components/operations/shared/Avatar";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { formatShortDate, workerStatus, reportShortId } from "@/lib/operations/utils";
import { toast } from "sonner";
import { FileText, Check, X, UserPlus, RotateCcw, Download, Printer, ExternalLink, MapPin, Mail, Phone, Shield, Clock, Image as ImageIcon, File, Video, Music, ChevronDown, Eye, Sparkles } from "lucide-react";
import EvidenceLightbox, { EvidenceLightboxItem } from "@/components/shared/EvidenceLightbox";
import { exportApi, downloadBlob } from "@/lib/api";
import { useReviewReportNote } from "@/lib/hooks/team/use-team-data";
import type { Report } from "@/types";

export default function ReportReviewPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { data: reportsResp, isLoading } = useGetReports({ status: "all" as unknown as string, limit: 500, include_resolved: true });
  const { data: team = [], isLoading: teamLoading } = useGetAgencyTeam();
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [lightbox, setLightbox] = useState<EvidenceLightboxItem | null>(null);
  const { mutate: updateStatus, isPending: updating } = useUpdateReportStatus();
  const { mutate: assignReport, isPending: assigning } = useAssignReport();
  const { mutate: analyzeReport, isPending: analyzing } = useAnalyzeReport();
  const prevAssigning = useRef(false);
  const prevUpdating = useRef(false);

  const report = useMemo(() => (reportsResp?.items ?? []).find((r) => String(r.id) === id), [reportsResp, id]);
  const handler = useMemo(() => {
    if (!report?.assigned_staff_id) return null;
    return team.find((t) => String(t.id) === String(report.assigned_staff_id)) || null;
  }, [team, report]);

  const attachments = (report?.attachments as Array<{ name?: string; url?: string; uri?: string; type?: string; filename?: string; file_type?: string; file_url?: string }>) || [];

  useEffect(() => {
    if (prevAssigning.current && !assigning) setAssignOpen(false);
    prevAssigning.current = assigning;
  }, [assigning]);

  useEffect(() => {
    if (prevUpdating.current && !updating) { setStatusOpen(false); setShowChanges(false); }
    prevUpdating.current = updating;
  }, [updating]);

  const doPdf = async () => {
    const tid = toast.loading("Generating PDF…");
    try {
      const b = await exportApi.reportPdf(id);
      downloadBlob(b as Blob, `report-${id}.pdf`);
      toast.success("Report PDF downloaded", { id: tid });
    } catch (e: unknown) {
      const raw = (e as { response?: { data?: Blob | { error?: string } } })?.response?.data;
      let msg = "PDF export failed";
      if (raw instanceof Blob) {
        try { msg = JSON.parse(await raw.text())?.error || await raw.text() || msg; } catch {}
      } else if (raw && typeof raw === "object") msg = (raw as { error?: string }).error || msg;
      toast.error(msg, { id: tid });
    }
  };

  if (isLoading) return <SkeletonRow cols={2} rows={8} />;
  if (!report) return <EmptyState icon={<FileText width={40} height={40} />} title="Report not found" description={`No report found with ID ${reportShortId(id)}.`} />;

  const handleStatus = (status: string) => {
    updateStatus({ id: report.id, status: status as never });
  };

  const handleAssign = (staffId: string, staffName: string) => {
    assignReport({ reportId: report.id, staffId, staffName });
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <Link href="/operations/reports" className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>← Back to reports</Link>
          <h1 className="page-header__title" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {reportShortId(report.id)}
          </h1>
          <p className="page-header__subtitle" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock width={12} height={12} /> {formatShortDate(report.created_at || report.createdAt)} • {report.category || report.incident_type || "Report"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/operations/reports/${id}/export`} className="btn btn--primary btn--sm"><Download width={14} height={14} /> View PDF</Link>
          <button type="button" className="btn btn--secondary btn--sm" onClick={doPdf}><Download width={14} height={14} /> Quick PDF</button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => window.print()}><Printer width={14} height={14} /> Print</button>
          <div style={{ position: "relative" }}>
            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setStatusOpen((v) => !v)} disabled={updating}>Change Status <ChevronDown width={14} height={14} /></button>
            {statusOpen && (
              <div className="card" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 20, minWidth: 180, padding: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                {["new", "pending_acceptance", "assigned", "triaged", "reviewing", "resolved", "closed"].map((s) => (
                  <button key={s} type="button" className="btn btn--ghost btn--sm" style={{ justifyContent: "flex-start" }} onClick={() => handleStatus(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.7fr) minmax(280px, 0.9fr)", gap: "var(--space-4)", alignItems: "start" }}>
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Case Summary</h2><span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{report.assigned_staff_name || "Unassigned"}</span></div>
            <div className="info-grid">
              <div className="info-row"><span className="info-row__label">Report ID</span><span className="info-row__value mono">{reportShortId(report.id)}</span></div>
              <div className="info-row"><span className="info-row__label">Category</span><span className="info-row__value">{report.category || report.incident_type || "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Priority</span><span className="info-row__value">{report.priority || "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Status</span><span className="info-row__value">{String(report.status).replace(/_/g, " ")}</span></div>
              <div className="info-row"><span className="info-row__label">Reporter</span><span className="info-row__value">{report.user_name || "Anonymous"}</span></div>
              <div className="info-row"><span className="info-row__label">Phone</span><span className="info-row__value">{report.user_phone || "—"}</span></div>
              <div className="info-row"><span className="info-row__label">Submitted</span><span className="info-row__value">{formatShortDate(report.created_at || report.createdAt)}</span></div>
              <div className="info-row"><span className="info-row__label">Handling</span><span className="info-row__value">{report.assigned_staff_name ? <Link href={handler ? `/operations/caseworkers/${handler.id}` : "#"} style={{ textDecoration: "underline" }}>{report.assigned_staff_name}</Link> : "Unassigned"}</span></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {["resolved", "closed"].includes(String(report.status)) ? (
                <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>Cannot assign — report is {String(report.status).replace(/_/g, " ")}</span>
              ) : !report.assigned_staff_name ? (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setAssignOpen(true)}><UserPlus width={14} height={14} /> Assign handler</button>
              ) : (
                <button type="button" className="btn btn--primary btn--sm" onClick={() => setAssignOpen(true)}><RotateCcw width={14} height={14} /> Reassign</button>
              )}
              <Link href={`/operations/reports/${id}/export`} className="btn btn--secondary btn--sm"><Download width={14} height={14} /> Export PDF</Link>
              {report.location?.latitude && report.location?.longitude && (
                <Link href={`/operations/live-map?case=${report.id}`} className="btn btn--secondary btn--sm"><MapPin width={14} height={14} /> Open in Map</Link>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Description</h2></div>
            <p className="text-secondary" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>{report.description || "No description provided."}</p>
            {(report.timing || report.frequency) && (
              <div className="info-grid" style={{ marginTop: 12 }}>
                {report.timing && <div className="info-row"><span className="info-row__label">Timing</span><span className="info-row__value">{report.timing}</span></div>}
                {report.frequency && <div className="info-row"><span className="info-row__label">Frequency</span><span className="info-row__value">{report.frequency}</span></div>}
              </div>
            )}
          </div>

          {/* Evidence — attachments */}
          <div className="card">
            <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><ImageIcon width={16} height={16} /> Evidence • {attachments.length}</h2>
              <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>attachments</span>
            </div>
            {attachments.length === 0 ? (
              <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No attachments. This report was filed without files — add evidence via the mobile app or request from reporter.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--space-3)" }}>
                {attachments.map((a, i) => {
                  const name = a.name || a.filename || a.file_url || a.url || `file-${i + 1}`;
                  const url = a.url || a.uri || a.file_url || "";
                  const type = (a.type || a.file_type || "document").toLowerCase();
                  return (
                    <div key={i} className="card" style={{ padding: 0, overflow: "hidden", cursor: url ? "pointer" : "default" }} onClick={() => url && setLightbox({ url, type, name })}>
                      <div style={{ aspectRatio: "4/3", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {url && (type.includes("image") || type === "image") ? <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : type.includes("video") ? <Video width={28} height={28} /> : type.includes("audio") ? <Music width={28} height={28} /> : <File width={28} height={28} />}
                      </div>
                      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{type === "image" ? <ImageIcon width={12} height={12} /> : type.includes("video") ? <Video width={12} height={12} /> : type.includes("audio") ? <Music width={12} height={12} /> : <File width={12} height={12} />}{name}</span>
                        {url && <button type="button" onClick={(e) => { e.stopPropagation(); setLightbox({ url, type, name }); }} style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, color: "var(--color-brand)", cursor: "pointer" }}><Eye width={12} height={12} /> Preview</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Field notes — same submit/approve flow as SOS case reports */}
          <FieldNotesSection report={report} />

          {report.answers && report.answers.length > 0 && (
            <div className="card">
              <div className="section-header"><h2 className="section-header__title">Structured Answers</h2></div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {report.answers.map((a, i) => (
                  <div key={i}>
                    <div className="text-tertiary" style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 600 }}>{a.question}</div>
                    <div className="text-secondary" style={{ fontSize: "var(--text-sm)", marginTop: 2 }}>{a.answer}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <div className="section-header"><h2 className="section-header__title">Timeline</h2></div>
            <ReportTimeline report={report} />
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="card">
            <div className="section-header"><h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Shield width={14} height={14} /> Handling</h2><Badge variant={report.assigned_staff_name ? "available" : "offline"} tone="worker">{report.assigned_staff_name ? "ASSIGNED" : "UNASSIGNED"}</Badge></div>
            {report.assigned_staff_name ? (
              <>
                <div className="worker-option" style={{ padding: 0, border: "none" }}>
                  <Avatar name={report.assigned_staff_name} src={(handler as any)?.avatar_url} />
                  <div className="worker-option__info">
                    <div className="worker-option__name" style={{ display: "flex", alignItems: "center", gap: 6 }}>{report.assigned_staff_name} <Badge variant={handler?.is_active ? "available" : "offline"} tone="worker">{handler ? (handler.is_active ? "ACTIVE" : "OFFLINE") : ""}</Badge></div>
                    <div className="worker-option__meta">{handler?.role || "FIELD_AGENT"} {handler?.email ? `• ${handler.email}` : ""}</div>
                    <div className="worker-option__meta">Assigned {formatShortDate(report.assigned_at)}</div>
                  </div>
                </div>
                {handler && (
                  <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: "var(--text-xs)" }}>
                    {handler.email && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Mail width={12} height={12} /> {handler.email}</span>}
                    {handler.phone_number && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Phone width={12} height={12} /> {handler.phone_number}</span>}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  {handler && <Link href={`/operations/caseworkers/${handler.id}`} className="btn btn--primary btn--sm"><Eye width={14} height={14} /> View worker</Link>}
                  {!["resolved", "closed"].includes(String(report.status)) && (
                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => setAssignOpen(true)}><RotateCcw width={14} height={14} /> Reassign</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-secondary" style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-3)" }}>No handler. Assign a field worker — evidence review and follow-up will move to them.</p>
                {teamLoading ? <div className="skeleton" style={{ height: 80 }} /> : team.length === 0 ? <EmptyState title="No workers" description="Invite field workers." /> : (
                  <div className="assign-panel">
                    {team.slice(0, 5).map((t) => (
                      <div key={t.id} className="worker-option">
                        <Avatar name={t.name} src={(t as any).avatar_url} size="sm" />
                        <div className="worker-option__info"><div className="worker-option__name">{t.name}</div><div className="worker-option__meta">{workerStatus(t) === "available" ? "AVAILABLE" : "OFFLINE"} • {t.role}</div></div>
                        <button type="button" className="btn btn--primary btn--sm" disabled={assigning || !t.is_active} onClick={() => handleAssign(String(t.id), t.name)}>Assign</button>
                      </div>
                    ))}
                    {team.length > 5 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAssignOpen(true)}>View all {team.length}</button>}
                  </div>
                )}
              </>
            )}
          </div>

          {!(report.ai_analysis || report.ai_Analysis) && (
            <div className="card">
              <div className="section-header">
                <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><Sparkles width={16} height={16} /> AI Intelligence</h2>
              </div>
              <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", marginBottom: 8 }}>No analysis yet — auto-analysis runs on submit, or trigger it manually.</p>
              <button type="button" className="btn btn--primary btn--sm" disabled={analyzing} onClick={() => analyzeReport({ reportId: report.id })}>
                <Sparkles width={14} height={14} /> {analyzing ? "Analyzing…" : "Analyze with AI"}
              </button>
            </div>
          )}

          {(report.ai_analysis || report.ai_Analysis) && (
            <div className="card">
              <div className="section-header"><h2 className="section-header__title">AI Intelligence</h2></div>
              <div className="info-grid">
                <div className="info-row"><span className="info-row__label">Severity</span><span className="info-row__value">{report.ai_analysis?.severity_rating ?? report.ai_Analysis?.severity_rating ?? "—"}</span></div>
                <div className="info-row"><span className="info-row__label">Risk</span><span className="info-row__value">{report.ai_analysis?.escalation_risk ?? report.ai_Analysis?.escalation_risk ?? "—"}</span></div>
                <div className="info-row"><span className="info-row__label">Urgency</span><span className="info-row__value">{report.ai_analysis?.timeline_urgency ?? report.ai_Analysis?.timeline_urgency ?? "—"}</span></div>
                <div className="info-row"><span className="info-row__label">Pattern</span><span className="info-row__value">{report.ai_analysis?.identified_pattern_type ?? report.ai_Analysis?.identified_pattern_type ?? "—"}</span></div>
              </div>
            </div>
          )}

          {report.location && (
            <div className="card">
              <div className="section-header"><h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin width={14} height={14} /> Location</h2></div>
              <p className="text-secondary" style={{ fontSize: "var(--text-sm)" }}>{report.location.address || `${report.location.latitude}, ${report.location.longitude}`}</p>
              {report.location.latitude && <a href={`https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`} target="_blank" rel="noreferrer" className="btn btn--secondary btn--sm" style={{ marginTop: 8 }}><MapPin width={12} height={12} /> Open in Maps</a>}
            </div>
          )}


        </div>
      </div>

      <EvidenceLightbox item={lightbox} onClose={() => setLightbox(null)} />

      {assignOpen && (
        <div className="modal-backdrop" onClick={() => setAssignOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header"><h3 className="modal__title">Assign handler</h3><button type="button" className="btn btn--ghost btn--sm" onClick={() => setAssignOpen(false)}><X width={14} height={14} /></button></div>
            <div className="assign-panel">
              {team.filter((t) => t.is_active).map((t) => (
                <div key={t.id} className="worker-option">
                  <Avatar name={t.name} src={(t as any).avatar_url} size="sm" />
                  <div className="worker-option__info"><div className="worker-option__name">{t.name}</div><div className="worker-option__meta">{t.role} • {t.email}</div></div>
                  <button type="button" className="btn btn--primary btn--sm" onClick={() => handleAssign(String(t.id), t.name)}>Assign</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldNotesSection({ report }: { report: Report }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const review = useReviewReportNote();
  const [objecting, setObjecting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const notes = ((report as unknown as { field_reports?: Array<Record<string, unknown>> }).field_reports as Array<{ id: string; title?: string; body?: string; progress?: string; review_status?: string; review_feedback?: string; created_by_name?: string; created_at?: string; updated_at?: string }>) || [];
  if (notes.length === 0) {
    return (
      <div className="card">
        <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText width={16} height={16} /> Field Notes • 0</h2>
        </div>
        <p className="text-tertiary" style={{ fontSize: "var(--text-sm)" }}>No field notes yet — worker notes will appear here for your approval.</p>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="section-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <h2 className="section-header__title" style={{ display: "flex", alignItems: "center", gap: 8 }}><FileText width={16} height={16} /> Field Notes • {notes.length}</h2>
        <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{notes.filter((r) => (r.review_status || "draft") === "submitted").length} awaiting review</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {notes.map((r) => {
          const rid = String(r.id);
          const isOpen = !!open[rid];
          const rs = r.review_status || "draft";
          return (
            <div key={rid} className="card" style={{ padding: 0, overflow: "hidden", borderLeft: `3px solid ${rs === "approved" ? "var(--color-success)" : rs === "changes_requested" ? "var(--color-critical)" : rs === "submitted" ? "var(--color-info)" : "var(--color-border)"}` }}>
              <button type="button" onClick={() => setOpen((p) => ({ ...p, [rid]: !isOpen }))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "12px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{(r.title as string) || "Field note"}</span>
                  <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{(r.created_by_name as string) || "Field worker"} • {formatShortDate(r.created_at as string)} {r.progress ? `• ${r.progress}` : ""}</span>
                </span>
                <Badge variant={rs === "approved" ? "resolved" : rs === "changes_requested" ? "critical" : rs === "submitted" ? "assigned" : "pending"} tone="status">{rs.replace(/_/g, " ")}</Badge>
                <ChevronDown width={16} height={16} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 150ms", flexShrink: 0 }} />
              </button>
              {isOpen && (
                <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--color-border)" }}>
                  <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, marginTop: 10, whiteSpace: "pre-wrap" }}>{(r.body as string) || ""}</p>
                  {rs === "changes_requested" && r.review_feedback && <p style={{ fontSize: "var(--text-sm)", color: "var(--color-critical)", background: "var(--color-critical-bg)", padding: "8px 10px", borderRadius: 8 }}>Objections: {r.review_feedback as string}</p>}
                  {rs === "approved" && <p style={{ fontSize: "var(--text-xs)", color: "var(--color-success)" }}><Check width={12} height={12} style={{ display: "inline", marginRight: 4 }} />Approved</p>}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {(rs === "submitted" || rs === "draft") && objecting !== rid && (
                      <>
                        <button type="button" className="btn btn--primary btn--sm" disabled={review.isPending} onClick={() => review.mutate({ reportId: String(report.id), noteId: rid, decision: "approved" })}><Check width={14} height={14} /> Approve</button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setObjecting(rid)}><X width={14} height={14} /> Request changes</button>
                      </>
                    )}
                    {objecting === rid && (
                      <>
                        <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Feedback for worker" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                        <button type="button" className="btn btn--danger btn--sm" disabled={review.isPending || !feedback.trim()} onClick={() => review.mutate({ reportId: String(report.id), noteId: rid, decision: "changes_requested", feedback: feedback.trim() }, { onSuccess: () => { setObjecting(null); setFeedback(""); } })}>Send back</button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setObjecting(null)}>Cancel</button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReportTimeline({ report }: { report: Report }) {
  const events = useMemo(() => {
    const items: Array<{ time: string; actor: string; text: string; type: string }> = [];

    const history = report.status_history ?? [];
    for (const h of history) {
      const status = String(h.status || "").replace(/_/g, " ");
      let text = h.detail || `Status: ${status}`;
      let type = "status";
      if (h.status === "assigned" || h.status === "unassigned") {
        type = "assignment";
        text = h.detail || (h.status === "assigned" ? "Report assigned" : "Report unassigned");
      }
      items.push({
        time: formatShortDate(h.timestamp),
        actor: h.actor || "System",
        text,
        type,
      });
    }

    items.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    return items;
  }, [report.status_history]);

  if (events.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "var(--text-sm)" }}>
        <div><span className="text-tertiary">Submitted:</span> {formatShortDate(report.created_at || report.createdAt)}</div>
        {report.assigned_at && <div><span className="text-tertiary">Assigned:</span> {formatShortDate(report.assigned_at)} → {report.assigned_staff_name}</div>}
        <div><span className="text-tertiary">Updated:</span> {formatShortDate(report.updated_at || report.updatedAt)}</div>
      </div>
    );
  }

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
