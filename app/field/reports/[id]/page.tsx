"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, FileText, File, Video, Music,
  Image as ImageIcon, Clock, Navigation, Camera, X, Plus, Edit2,
  Save, Send, MessageSquare, CheckCircle2, AlertTriangle, Eye,
} from "lucide-react";
import EvidenceLightbox, { EvidenceLightboxItem } from "@/components/shared/EvidenceLightbox";
import { Badge } from "@/components/operations/shared/Badge";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerStatusStepper } from "@/components/field/shared/WorkerStatusStepper";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import {
  useFieldReport,
  useUploadFieldReportEvidence,
  useUpdateFieldReportStatus,
  usePostFieldLocation,
  useAddFieldReportNote,
  useSubmitFieldReportNote,
  useAcceptFieldReport,
  useDeclineFieldReport,
} from "@/lib/field/use-field-data";
import {
  reportWorkerStageFor,
  reportWorkerActionFor,
  NEXT_REPORT_STATUS,
} from "@/lib/field/utils";
import { formatShortDate, reportShortId } from "@/lib/operations/utils";
import { toast } from "sonner";
import type { FieldReport } from "@/types";
import "@/styles/field.css";

export default function FieldReportDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const router = useRouter();
  const { data: report, isLoading, isError, refetch } = useFieldReport(id);
  const uploadEvidence = useUploadFieldReportEvidence();
  const updateStatus = useUpdateFieldReportStatus();
  const postLocation = usePostFieldLocation();
  const addNote = useAddFieldReportNote();
  const submitNote = useSubmitFieldReportNote();
  const acceptReport = useAcceptFieldReport();
  const declineReport = useDeclineFieldReport();

  const stage = reportWorkerStageFor(report);
  const action = reportWorkerActionFor(stage);
  const nextStatus = NEXT_REPORT_STATUS[stage];

  const [evidenceType, setEvidenceType] = useState("photo");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [checkInNote, setCheckInNote] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  // Report / notes state
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteBody, setEditNoteBody] = useState("");
  const [preview, setPreview] = useState<EvidenceLightboxItem | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }, [report]);

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = () => setEvidencePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadEvidence = () => {
    if (!evidenceFile) return;
    uploadEvidence.mutate(
      { reportId: id, file: evidenceFile, fileType: evidenceType },
      {
        onSuccess: () => {
          setEvidenceFile(null);
          setEvidencePreview(null);
        },
        onError: () => toast.error("Upload failed"),
      }
    );
  };

  const handleCheckIn = (status: string) => {
    setCheckingIn(status);
    const done = (lat: number, lng: number) => {
      postLocation.mutate(
        { lat, lng, status, note: checkInNote.trim() || undefined, alert_id: id },
        {
          onSuccess: () => { setCheckingIn(null); },
          onError: () => { toast.error("Check-in failed"); setCheckingIn(null); },
        }
      );
    };
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setCheckingIn(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => done(pos.coords.latitude, pos.coords.longitude),
      () => {
        postLocation.mutate(
          { lat: 0, lng: 0, status, note: checkInNote.trim() || undefined, alert_id: id },
          {
            onSuccess: () => { setCheckingIn(null); },
            onError: () => { toast.error("Check-in failed"); setCheckingIn(null); },
          }
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAdvance = () => {
    if (!nextStatus) return;
    updateStatus.mutate({ reportId: id, status: nextStatus });
  };

  // ── Reports & Notes ─────────────────────────────────────────────────────
  const notes = ((report as any)?.field_reports ?? []) as FieldReport[];

  const handleAddNote = () => {
    if (!noteBody.trim() && !noteTitle.trim()) return;
    addNote.mutate(
      { reportId: id, title: noteTitle, body: noteBody },
      {
        onSuccess: () => {
          setShowAddNote(false);
          setNoteTitle("");
          setNoteBody("");
        },
        onError: () => toast.error("Failed to add note"),
      }
    );
  };

  const handleEditNote = (note: FieldReport) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title || "");
    setEditNoteBody(note.body || "");
  };

  const handleSaveNote = (noteId: string) => {
    // For now, optimistically update the local cache (edit endpoint can be added later)
    setEditingNoteId(null);
  };

  if (isLoading) return <div className="field-main"><Skeleton height={120} width="100%" /></div>;
  if (isError) return <ErrorRetry onRetry={() => refetch()} message="We couldn't load this report." />;
  if (!report) return <div className="field-main">Report not found.</div>;

  if (report.status === "resolved" || report.status === "closed") {
    return (
      <div className="field-main">
        <button className="field-back-btn" onClick={() => router.back()}>
          <ArrowLeft width={16} height={16} /> Back
        </button>
        <div className="field-case-view__empty" style={{ marginTop: 40 }}>
          <AlertTriangle width={36} height={36} />
          <h2>Report closed</h2>
          <p>This report has been {report.status === "resolved" ? "resolved" : "closed"}. Only your agency admin can access it.</p>
          <button className="field-primary-btn field-primary-btn--block" onClick={() => router.replace("/field")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (stage === "assigned") {
    return (
      <div className="field-case-view">
        <div className="field-case-view__topbar">
          <button className="field-case-view__back" onClick={() => router.back()}>
            <ArrowLeft width={18} height={18} />
            <span>Back</span>
          </button>
        </div>
        <div className="field-case-view__title">
          <h1 title={String(report.id)}>{reportShortId(report.id)}</h1>
          <p>{(report.category || "Report").replace(/_/g, " ")}</p>
        </div>
        <div className="field-detail-card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
          <AlertTriangle width={32} height={32} style={{ margin: "0 auto 12px", color: "var(--color-warning, #F59E0B)" }} />
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: 8 }}>Pending Your Acceptance</h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", maxWidth: 360, margin: "0 auto var(--space-4)" }}>
            You&apos;ve been assigned to this report. Accept to view details, add evidence, and submit notes. You cannot access report details until you accept.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              className="field-primary-btn"
              disabled={acceptReport.isPending || declineReport.isPending}
              onClick={() => acceptReport.mutate({ reportId: id })}
            >
              <CheckCircle2 width={16} height={16} /> {acceptReport.isPending ? "Accepting…" : "Accept Report"}
            </button>
            <button
              className="field-secondary-btn"
              disabled={acceptReport.isPending || declineReport.isPending}
              onClick={() => declineReport.mutate({ reportId: id })}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  const attachments = ((report as any).attachments ?? []) as Array<{
    name?: string; url?: string; uri?: string; type?: string;
    filename?: string; file_type?: string; file_url?: string;
  }>;

  const statusLabel = (() => {
    switch (report.status) {
      case "pending_analysis": return "Pending Analysis";
      case "triaged": return "Triaged";
      case "reviewing": return "Under Review";
      case "resolved": return "Resolved";
      case "closed": return "Closed";
      default: return report.status || "Pending";
    }
  })();

  const timeline: { label: string; time: string | null }[] = [
    { label: "Report submitted", time: report.createdAt || report.created_at },
    (report as any).assigned_staff_name ? { label: `Assigned to ${(report as any).assigned_staff_name}`, time: (report as any).assigned_at } : null,
    report.status === "reviewing" ? { label: "Review started", time: report.updatedAt || report.updated_at } : null,
    report.status === "resolved" ? { label: "Report resolved", time: report.updatedAt || report.updated_at } : null,
  ].filter(Boolean) as { label: string; time: string | null }[];

  return (
    <div className="field-case-view">
      <div className="field-case-view__topbar">
        <button className="field-case-view__back" onClick={() => router.back()}>
          <ArrowLeft width={18} height={18} /><span>Back</span>
        </button>
        <Badge variant={stage === "resolved" ? "resolved" : stage === "reviewing" ? "acknowledged" : "active"} tone="status">
          {statusLabel}
        </Badge>
      </div>

      <div className="field-case-view__title">
        <h1 title={String(report.id)}>{reportShortId(report.id)}</h1>
        <p>{String(report.category || "Report").replace(/_/g, " ")} &middot; {String(report.priority || "")}</p>
      </div>

      <div className="field-case-view__stepper-wrap">
        <WorkerStatusStepper stage={stage as any} />
      </div>

      <div className="field-detail-card">
        <div className="field-detail-row">
          <span className="field-detail-row__label">Status</span>
          <span className="field-detail-row__value">
            <Badge variant={stage === "resolved" ? "resolved" : stage === "reviewing" ? "acknowledged" : "active"} tone="report">{statusLabel}</Badge>
          </span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Priority</span>
          <span className="field-detail-row__value">{String(report.priority || "—")}</span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Category</span>
          <span className="field-detail-row__value">{String(report.category || "—")}</span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Submitted</span>
          <span className="field-detail-row__value"><Clock width={12} height={12} /> {formatShortDate(report.createdAt || report.created_at)}</span>
        </div>
        {(report as any).location?.address && (
          <div className="field-detail-row">
            <span className="field-detail-row__label">Location</span>
            <span className="field-detail-row__value"><MapPin width={12} height={12} /> {(report as any).location.address}</span>
          </div>
        )}
        {(report as any).assigned_staff_name && (
          <div className="field-detail-row" style={{marginBottom:"10px"}}>
            <span className="field-detail-row__label">Handler</span>
            <span className="field-detail-row__value">{(report as any).assigned_staff_name}</span>
            
          </div>

        )}
        {((report as any).location?.latitude || (report as any).location?.lat) && (
          <button className="field-inline-btn" onClick={() => router.push(`/field/map?report=${report.id}`)}>
            <Navigation width={14} height={14} /> Open Map for directions
          </button>
        )}
      </div>

      {/* Check-in */}
      <div className="field-detail-section">
        <div className="field-detail-section__label"><Navigation width={14} height={14} /> Check-in</div>
        <p className="field-detail-section__text" style={{ marginBottom: 8, fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
          Share your live status with dispatch — powers Live Map.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {[["en_route", "En route"], ["on_site", "On site"], ["safe", "Safe"]].map(([val, label]) => (
            <button key={val} className="field-primary-btn field-primary-btn--sm" disabled={!!checkingIn} onClick={() => handleCheckIn(val)} style={{ opacity: checkingIn === val ? 0.7 : 1 }}>
              {checkingIn === val ? "Sending…" : label}
            </button>
          ))}
        </div>
        <input className="field-input" placeholder="Note (optional) — e.g., ETA 5 min" value={checkInNote} onChange={(e) => setCheckInNote(e.target.value)} />
      </div>

      {/* Description */}
      <div className="field-detail-section">
        <div className="field-detail-section__label"><FileText width={14} height={14} /> Description</div>
        <p className="field-detail-section__text">{report.description || "No description"}</p>
        {report.timing && <p className="field-detail-section__text" style={{ marginTop: 8 }}><strong>Timing:</strong> {report.timing}</p>}
        {report.frequency && <p className="field-detail-section__text"><strong>Frequency:</strong> {report.frequency}</p>}
      </div>

      {/* Structured answers */}
      {report.answers && report.answers.length > 0 && (
        <div className="field-detail-section">
          <div className="field-detail-section__label">Structured answers</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {report.answers.map((a, i) => (
              <div key={i}>
                <div style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-tertiary)" }}>{a.question}</div>
                <div className="field-detail-section__text" style={{ marginTop: 4 }}>{a.answer}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidence */}
      <div id="evidence" className="field-detail-section">
        <div className="field-detail-section__label-row">
          <div className="field-detail-section__label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ImageIcon width={14} height={14} /> Evidence &middot; {attachments.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="field-input field-input--sm" style={{ width: "auto" }}>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
            <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" onChange={handleEvidenceFileChange} className="field-input field-input--sm" style={{ width: "auto", display: "none" }} id="report-evidence-file" />
            <label htmlFor="report-evidence-file" className="field-primary-btn field-primary-btn--sm"><Camera width={14} height={14} /> Add</label>
          </div>
        </div>
        {evidenceFile && evidencePreview && (
          <div className="field-evidence-preview">
            <div className="field-evidence-preview__media">
              {evidenceType === "photo" ? <img src={evidencePreview} alt="Preview" /> : evidenceType === "video" ? <video src={evidencePreview} controls /> : evidenceType === "audio" ? <audio src={evidencePreview} controls /> : <div className="field-evidence-doc"><File width={32} height={32} /><span>{evidenceFile.name}</span></div>}
            </div>
            <div className="field-evidence-preview__actions" style={{ marginTop: 20 }}>
              <button className="field-primary-btn field-primary-btn--sm" onClick={handleUploadEvidence} disabled={uploadEvidence.isPending} style={{ width: 100 }}>{uploadEvidence.isPending ? "Uploading…" : "Upload"}</button>
              <button className="btn btn--ghost btn--sm" style={{ marginLeft: 8, width: 100 }} onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}><X width={14} height={14} /></button>
            </div>
          </div>
        )}
        {attachments.length === 0 ? (
          <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", marginTop: 8 }}>No attachments yet — add photos, video, audio or documents.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 8 }}>
            {attachments.map((a, i) => {
              const name = a.name || a.filename || `file-${i + 1}`;
              const url = a.url || a.uri || a.file_url || "";
              const type = (a.type || a.file_type || "document").toLowerCase();
              return (
                <div key={i} className="card" style={{ padding: 0, overflow: "hidden", cursor: url ? "pointer" : "default" }} onClick={() => url && setPreview({ url, type, name })}>
                  <div style={{ aspectRatio: "4/3", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {url && (type.includes("image") || type === "photo") ? <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : type.includes("video") ? <Video width={24} height={24} /> : type.includes("audio") ? <Music width={24} height={24} /> : <File width={24} height={24} />}
                  </div>
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    {url && <button type="button" onClick={(e) => { e.stopPropagation(); setPreview({ url, type, name }); }} style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, color: "var(--color-brand)", cursor: "pointer" }}><Eye width={12} height={12} /> Preview</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reports & Notes — parity with case detail */}
      <div className="field-detail-section">
        <div className="field-detail-section__label-row">
          <div className="field-detail-section__label">
            <MessageSquare width={14} height={14} /> Reports & Notes
          </div>
          <button className="field-primary-btn field-primary-btn--sm" onClick={() => setShowAddNote(true)}>
            <Plus width={14} height={14} /> Add Note
          </button>
        </div>

        {showAddNote && (
          <div className="field-report-form">
            <div className="field-edit-row">
              <label className="field-edit-label">Title (optional)</label>
              <input className="field-input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="e.g., Scene assessment" />
            </div>
            <div className="field-edit-row">
              <label className="field-edit-label">Body</label>
              <textarea className="field-input" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Describe your findings, actions taken, observations..." rows={4} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "var(--space-2)" }}>
              <button className="field-primary-btn field-primary-btn--sm" onClick={handleAddNote} disabled={addNote.isPending}>
                {addNote.isPending ? "Saving..." : "Save Note"}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setShowAddNote(false); setNoteTitle(""); setNoteBody(""); }}>Cancel</button>
            </div>
          </div>
        )}

        {notes.length > 0 ? (
          <div className="field-reports-list">
            {notes.map((note: FieldReport, idx: number) => (
              <div key={`${note.id}-${idx}`} id={`note-${note.id}`} className="field-report-item" data-review={note.review_status || "draft"}>
                {editingNoteId === note.id ? (
                  <div className="field-report-edit">
                    <div className="field-edit-row">
                      <label className="field-edit-label">Title</label>
                      <input className="field-input" value={editNoteTitle} onChange={(e) => setEditNoteTitle(e.target.value)} />
                    </div>
                    <div className="field-edit-row">
                      <label className="field-edit-label">Body</label>
                      <textarea className="field-input" value={editNoteBody} onChange={(e) => setEditNoteBody(e.target.value)} rows={3} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="field-primary-btn field-primary-btn--sm" onClick={() => handleSaveNote(note.id)} disabled={false}>
                        <Save width={14} height={14} /> Save
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={() => setEditingNoteId(null)}><X width={14} height={14} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="field-report-view">
                    <div className="field-report-view__header">
                      {note.title && <div className="field-report-view__title">{note.title}</div>}
                      <div className="field-report-view__meta">
                        <span>{note.created_by_name || "Field Worker"}</span>
                        <span className="field-report-view__time">{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                        <span className={`field-report-review field-report-review--${note.review_status || "draft"}`}>
                          {(note.review_status || "draft").replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="field-report-view__body">{note.body}</div>
                    {note.review_status === "approved" && (
                      <div className="field-report-feedback field-report-feedback--approved">
                        <CheckCircle2 width={14} height={14} />
                        <span>Approved by the agency{note.reviewed_at ? ` • ${new Date(note.reviewed_at).toLocaleString()}` : ""}.</span>
                      </div>
                    )}
                    {note.review_status === "changes_requested" && note.review_feedback && (
                      <div className="field-report-feedback field-report-feedback--objection">
                        <span className="field-report-feedback__label">Agency objections:</span>
                        <span>{note.review_feedback}</span>
                      </div>
                    )}
                    <div className="field-report-view__actions">
                      {(!note.review_status || note.review_status === "draft") && (
                        <>
                          <button className="btn btn--ghost btn--sm" onClick={() => handleEditNote(note)}>
                            <Edit2 width={14} height={14} /> Edit
                          </button>
                          <button
                            className="field-primary-btn field-primary-btn--sm"
                            disabled={submitNote.isPending}
                            onClick={() =>
                              submitNote.mutate(
                                { reportId: id, noteId: String(note.id) },
                                { onError: () => toast.error("Failed to submit note") }
                              )
                            }
                          >
                            <Send width={14} height={14} /> {submitNote.isPending ? "Submitting..." : "Submit for check"}
                          </button>
                        </>
                      )}
                      {note.review_status === "submitted" && (
                        <span className="field-report-pending">Waiting for agency check…</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", marginTop: 8 }}>No notes yet — add one to document your work.</p>
        )}
      </div>

      {/* Timeline */}
      <div className="field-detail-section">
        <div className="field-detail-section__label">Timeline</div>
        <div className="field-timeline">
          {timeline.map((event, idx) => (
            <div key={idx} className="field-timeline__item">
              <div className="field-timeline__col">
                <div className="field-timeline__dot" />
                {idx < timeline.length - 1 && <div className="field-timeline__line" />}
              </div>
              <div>
                <div className="field-timeline__text">{event.label}</div>
                <div className="field-timeline__time">{formatShortDate(event.time)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      {(report.ai_Analysis || report.ai_analysis) && (
        <div className="field-detail-section">
          <div className="field-detail-section__label">AI Analysis</div>
          <pre style={{ fontSize: "var(--text-xs)", whiteSpace: "pre-wrap", background: "var(--color-surface-sunken)", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(report.ai_Analysis || report.ai_analysis, null, 2)}
          </pre>
        </div>
      )}

      {/* Accept / Decline assignment banner */}
      {(report as any).assignment_status === "pending" && (
        <div className="field-detail-section" style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.25)" }}>
          <div className="field-detail-section__label" style={{ color: "var(--color-text-primary)" }}>New Report Assignment</div>
          <p className="field-detail-section__text" style={{ fontSize: "var(--text-sm)", marginBottom: 12 }}>
            This report has been assigned to you. Accept to start working on it, or decline to send it back to the queue.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="field-primary-btn field-primary-btn--sm"
              disabled={acceptReport.isPending || declineReport.isPending}
              onClick={() => acceptReport.mutate({ reportId: id })}
            >
              <CheckCircle2 width={14} height={14} /> {acceptReport.isPending ? "Accepting..." : "Accept"}
            </button>
            <button
              className="field-secondary-btn"
              disabled={acceptReport.isPending || declineReport.isPending}
              onClick={() => declineReport.mutate({ reportId: id })}
              style={{ color: "var(--color-danger, #ef4444)" }}
            >
              <AlertTriangle width={14} height={14} /> {declineReport.isPending ? "Declining..." : "Decline"}
            </button>
          </div>
        </div>
      )}

      <Link href="/field/reports" className="field-secondary-btn field-secondary-btn--block" style={{ marginTop: 12 }}>Back to reported cases</Link>
      <EvidenceLightbox item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
