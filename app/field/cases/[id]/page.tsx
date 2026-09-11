"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, FileText, AlertTriangle, Navigation, Image, File, Edit2, Save, X, Plus, Camera, MessageSquare, Send, CheckCircle2, Eye, Clock, Video, Music } from "lucide-react";
import EvidenceLightbox, { EvidenceLightboxItem } from "@/components/shared/EvidenceLightbox";
import { Badge } from "@/components/operations/shared/Badge";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerStatusStepper } from "@/components/field/shared/WorkerStatusStepper";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useFieldAlert, useFieldProfile, useUploadFieldEvidence, useAddFieldReport, useUpdateFieldReport, useSubmitFieldReport, usePostFieldLocation, useAcceptFieldCase, useDeclineFieldCase } from "@/lib/field/use-field-data";
import {
  workerStageFor,
  workerActionFor,
  NEXT_STATUS,
  backendStatusLabel,
  statusBadgeVariant,
  priorityVariant,
  incidentCoords,
} from "@/lib/field/utils";
import { incidentLabel, locationLabel, formatShortDate, caseShortId } from "@/lib/operations/utils";
import { toast } from "sonner";
import type { FieldReport, FieldEvidenceItem } from "@/types";
import "@/styles/field.css";

let _popupId = 0;
function dedupPopup(key: string, fn: () => void) {
  if ((globalThis as Record<string, unknown>)[`_popup_${key}`]) return;
  (globalThis as Record<string, unknown>)[`_popup_${key}`] = ++_popupId;
  fn();
  setTimeout(() => { delete (globalThis as Record<string, unknown>)[`_popup_${key}`]; }, 2500);
}

export default function FieldCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const { alert, isLoading, isError, refetch } = useFieldAlert(caseId);
  const updateStatus = useUpdateAlertStatus();
  const uploadEvidence = useUploadFieldEvidence();
  const addReport = useAddFieldReport();
  const updateReport = useUpdateFieldReport();
  const submitReport = useSubmitFieldReport();

  const stage = workerStageFor(alert);
  const action = workerActionFor(stage);
  const nextStatus = NEXT_STATUS[stage];

  const postLocation = usePostFieldLocation();
  const acceptCase = useAcceptFieldCase();
  const declineCase = useDeclineFieldCase();
  const [checkInNote, setCheckInNote] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);

  const [evidenceType, setEvidenceType] = useState("photo");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
  const [showAddReport, setShowAddReport] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editReportTitle, setEditReportTitle] = useState("");
  const [editReportBody, setEditReportBody] = useState("");
  const [editReportProgress, setEditReportProgress] = useState("");
  const [preview, setPreview] = useState<EvidenceLightboxItem | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setTimeout(() => document.querySelector(window.location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
    }
  }, [alert]);

  const prevPostLocation = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (postLocation.isSuccess && !prevPostLocation.current.isSuccess) {
      dedupPopup("checkin", () => toast.success("Check-in sent"));
      setCheckingIn(null);
    }
    if (postLocation.isError && !prevPostLocation.current.isError) {
      toast.error("Check-in failed");
      setCheckingIn(null);
    }
    prevPostLocation.current = { isSuccess: postLocation.isSuccess, isError: postLocation.isError };
  }, [postLocation.isSuccess, postLocation.isError]);

  const prevUpload = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (uploadEvidence.isSuccess && !prevUpload.current.isSuccess) {
      toast.dismiss("evidence-failed");
      toast.success("Evidence uploaded", { id: "evidence-uploaded" });
      setEvidenceFile(null);
      setEvidencePreview(null);
    }
    if (uploadEvidence.isError && !prevUpload.current.isError) {
      const msg = (uploadEvidence.error as { response?: { data?: { error?: string } } })?.response?.data?.error || (uploadEvidence.error as Error)?.message || "Upload failed";
      toast.dismiss("evidence-uploaded");
      toast.error(msg, { id: "evidence-failed" });
    }
    prevUpload.current = { isSuccess: uploadEvidence.isSuccess, isError: uploadEvidence.isError };
  }, [uploadEvidence.isSuccess, uploadEvidence.isError, uploadEvidence.error]);

  const prevAddReport = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (addReport.isSuccess && !prevAddReport.current.isSuccess) {
      dedupPopup("addreport", () => toast.success("Report added"));
      setShowAddReport(false);
      setReportTitle("");
      setReportBody("");
    }
    if (addReport.isError && !prevAddReport.current.isError) {
      toast.error("Failed to add report");
    }
    prevAddReport.current = { isSuccess: addReport.isSuccess, isError: addReport.isError };
  }, [addReport.isSuccess, addReport.isError]);

  const prevUpdateReport = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (updateReport.isSuccess && !prevUpdateReport.current.isSuccess) {
      dedupPopup("updatereport", () => toast.success("Report updated"));
      setEditingReportId(null);
    }
    if (updateReport.isError && !prevUpdateReport.current.isError) {
      toast.error("Failed to update report");
    }
    prevUpdateReport.current = { isSuccess: updateReport.isSuccess, isError: updateReport.isError };
  }, [updateReport.isSuccess, updateReport.isError]);

  const prevSubmitReport = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (submitReport.isSuccess && !prevSubmitReport.current.isSuccess) {
      dedupPopup("submitreport", () => toast.success("Report submitted for review"));
    }
    if (submitReport.isError && !prevSubmitReport.current.isError) {
      toast.error("Failed to submit report");
    }
    prevSubmitReport.current = { isSuccess: submitReport.isSuccess, isError: submitReport.isError };
  }, [submitReport.isSuccess, submitReport.isError]);

  const prevAccept = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (acceptCase.isError && !prevAccept.current.isError) {
      toast.error("Failed to accept case");
    }
    prevAccept.current = { isSuccess: acceptCase.isSuccess, isError: acceptCase.isError };
  }, [acceptCase.isSuccess, acceptCase.isError]);

  const prevDecline = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (declineCase.isSuccess && !prevDecline.current.isSuccess) {
      dedupPopup("decline", () => toast.success("Assignment declined"));
      router.replace("/field");
    }
    if (declineCase.isError && !prevDecline.current.isError) {
      toast.error("Failed to decline");
    }
    prevDecline.current = { isSuccess: declineCase.isSuccess, isError: declineCase.isError };
  }, [declineCase.isSuccess, declineCase.isError, router]);

  const prevStatus = useRef({ isSuccess: false, isError: false });
  useEffect(() => {
    if (updateStatus.isSuccess && !prevStatus.current.isSuccess) {
      dedupPopup("status", () => toast.success("Status updated"));
    }
    if (updateStatus.isError && !prevStatus.current.isError) {
      toast.error("Failed to update status");
    }
    prevStatus.current = { isSuccess: updateStatus.isSuccess, isError: updateStatus.isError };
  }, [updateStatus.isSuccess, updateStatus.isError]);

  const handleCheckIn = (status: string) => {
    if (!alert) return;
    setCheckingIn(status);
    const done = (lat: number, lng: number) => {
      postLocation.mutate({ lat, lng, status, note: checkInNote.trim() || undefined, alert_id: String(alert.id) });
    };
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setCheckingIn(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => done(pos.coords.latitude, pos.coords.longitude),
      () => {
        postLocation.mutate({ lat: 0, lng: 0, status, note: checkInNote.trim() || undefined, alert_id: String(alert.id) });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleAdvance = () => {
    if (!alert || !nextStatus) return;
    updateStatus.mutate({ id: alert.id, status: nextStatus });
  };

  const coords = alert ? incidentCoords(alert) : null;

  const handleEvidenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEvidenceFile(file);
    const reader = new FileReader();
    reader.onload = () => setEvidencePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadEvidence = async () => {
    if (!evidenceFile || !alert) return;
    uploadEvidence.mutate({ alertId: String(alert.id), file: evidenceFile, fileType: evidenceType });
  };

  const handleAddReport = () => {
    if (!reportBody.trim() && !reportTitle.trim()) return;
    addReport.mutate({ alertId: String(alert!.id), data: { title: reportTitle, body: reportBody } });
  };

  const handleEditReport = (report: FieldReport) => {
    setEditingReportId(report.id);
    setEditReportTitle(report.title || "");
    setEditReportBody(report.body || "");
    setEditReportProgress(report.progress || "");
  };

  const handleSaveReport = (reportId: string) => {
    updateReport.mutate({ alertId: String(alert!.id), reportId, data: { title: editReportTitle, body: editReportBody, progress: editReportProgress } });
  };

  const handleCancelReport = () => {
    setEditingReportId(null);
  };

  if (isLoading) {
    return (
      <div className="field-case-view">
        <Skeleton height={22} width="40%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={120} width="100%" />
          <Skeleton height={80} width="100%" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorRetry onRetry={() => refetch()} message="We couldn't load this case." />;
  }

  if (!alert) {
    return (
      <div className="field-case-view">
        <div className="field-case-view__empty">
          <AlertTriangle width={36} height={36} />
          <h2>Case not found</h2>
          <p>This case isn&apos;t assigned to you, or it no longer exists.</p>
          <button className="field-primary-btn field-primary-btn--block" onClick={() => router.replace("/field")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (alert.status === "resolved" || alert.status === "closed" || alert.status === "false_alarm") {
    return (
      <div className="field-case-view">
        <div className="field-case-view__topbar">
          <button className="field-case-view__back" onClick={() => router.back()}>
            <ArrowLeft width={18} height={18} />
            <span>Back</span>
          </button>
        </div>
        <div className="field-case-view__empty">
          <AlertTriangle width={36} height={36} />
          <h2>Case closed</h2>
          <p>This case has been {alert.status === "resolved" ? "resolved" : alert.status === "false_alarm" ? "marked as false alarm" : "closed"}. Only your agency admin can access it.</p>
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
          <h1 title={String(alert.id)}>{caseShortId(alert.id)}</h1>
          <p>{incidentLabel(alert.incident_type, alert.description)}</p>
        </div>
        <div className="field-detail-card" style={{ textAlign: "center", padding: "var(--space-6)" }}>
          <AlertTriangle width={32} height={32} style={{ margin: "0 auto 12px", color: "var(--color-warning, #F59E0B)" }} />
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700, marginBottom: 8 }}>Pending Your Acceptance</h2>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", maxWidth: 360, margin: "0 auto var(--space-4)" }}>
            You&apos;ve been assigned to this case. Accept to view full details, add evidence, and file reports. You cannot access case details until you accept.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button
              className="field-primary-btn"
              disabled={acceptCase.isPending || declineCase.isPending}
              onClick={() => acceptCase.mutate({ caseId })}
            >
              <CheckCircle2 width={16} height={16} /> {acceptCase.isPending ? "Accepting…" : "Accept Case"}
            </button>
            <button
              className="field-secondary-btn"
              disabled={acceptCase.isPending || declineCase.isPending}
              onClick={() => declineCase.mutate({ caseId })}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  const incident = incidentLabel(alert.incident_type, alert.description);
  const location = locationLabel(alert);
  const priority = priorityVariant(alert.priority);
  const statusLabel = backendStatusLabel(alert.status);

  const timeline: { label: string; time: string | null }[] = [
    { label: "Incident reported", time: alert.created_at },
    alert.assigned_at ? { label: `Assigned to ${alert.assigned_staff_name || "you"}`, time: alert.assigned_at } : null,
    stage !== "new" ? { label: "Assignment accepted", time: alert.updated_at } : null,
  ].filter(Boolean) as { label: string; time: string | null }[];

  const evidence = (alert.field_evidence as FieldEvidenceItem[]) || [];
  const reports = (alert.field_reports as FieldReport[]) || [];

  return (
    <div className="field-case-view">
      <div className="field-case-view__topbar">
        <button className="field-case-view__back" onClick={() => router.back()}>
          <ArrowLeft width={18} height={18} />
          <span>Back</span>
        </button>
        <div className="field-case-view__status">
          <Badge variant={statusBadgeVariant(alert.status)} tone="status">
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="field-case-view__title">
        <h1 title={String(alert.id)}>{caseShortId(alert.id)}</h1>
        <p>{incident} &middot; {String(alert.priority || "")}</p>
      </div>

      <div className="field-case-view__stepper-wrap">
        <WorkerStatusStepper stage={stage} />
      </div>

      <div className="field-detail-card">
        <div className="field-detail-row">
          <span className="field-detail-row__label">Status</span>
          <span className="field-detail-row__value">
            <Badge variant={statusBadgeVariant(alert.status)} tone="status">{statusLabel}</Badge>
          </span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Priority</span>
          <span className="field-detail-row__value">{String(alert.priority || "—")}</span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Submitted</span>
          <span className="field-detail-row__value"><Clock width={12} height={12} /> {formatShortDate(alert.created_at)}</span>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Location</span>
          <span className="field-detail-row__value"><MapPin width={12} height={12} /> {location}</span>
        </div>
        {alert.assigned_staff_name && (
          <div className="field-detail-row" style={{ marginBottom: "10px" }}>
            <span className="field-detail-row__label">Handler</span>
            <span className="field-detail-row__value">{alert.assigned_staff_name}</span>
          </div>
        )}
        {coords && (
          <button className="field-inline-btn" onClick={() => router.push(`/field/map?case=${alert.id}`)}>
            <Navigation width={14} height={14} /> Open Map for directions
          </button>
        )}
      </div>

      {/* Check-in — was missing, now posts to /field/location with status */}
      <div className="field-detail-section">
        <div className="field-detail-section__label">
          <Navigation width={14} height={14} /> Check-in
        </div>
        <p className="field-detail-section__text" style={{ marginBottom: 8, fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
          Share your live status with dispatch — this powers the agency Live Map and timeline.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {[
            ["en_route", "En route"],
            ["on_site", "On site"],
            ["safe", "Safe"],
          ].map(([val, label]) => (
            <button
              key={val}
              className="field-primary-btn field-primary-btn--sm"
              disabled={!!checkingIn}
              onClick={() => handleCheckIn(val)}
              style={{ opacity: checkingIn === val ? 0.7 : 1 }}
            >
              {checkingIn === val ? "Sending…" : label}
            </button>
          ))}
        </div>
        <input
          className="field-input"
          placeholder="Note (optional) — e.g., ETA 5 min, at gate"
          value={checkInNote}
          onChange={(e) => setCheckInNote(e.target.value)}
        />
      </div>

      {alert.description && (
        <div className="field-detail-section">
          <div className="field-detail-section__label">Description</div>
          <p className="field-detail-section__text">{alert.description}</p>
        </div>
      )}

      {alert.transcribed_text && (
        <div className="field-detail-section">
          <div className="field-detail-section__label">
            <FileText width={14} height={14} /> Transcription
          </div>
          <p className="field-detail-section__text" style={{ fontStyle: "italic" }}>
            {alert.transcribed_text}
          </p>
        </div>
      )}

      {(alert.user?.name || alert.user_phone) && (
        <div className="field-detail-section">
          <div className="field-detail-section__label">
            <Phone width={14} height={14} /> Reporter
          </div>
          <p className="field-detail-section__text">
            {alert.user?.name || "Unknown"}
            {alert.user_phone && (
              <span className="field-detail-section__muted"> {alert.user_phone}</span>
            )}
          </p>
        </div>
      )}

      {/* Evidence */}
      <div id="evidence" className="field-detail-section">
        <div className="field-detail-section__label-row">
          <div className="field-detail-section__label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Image width={14} height={14} /> Evidence &middot; {evidence.length}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="field-input field-input--sm"
              style={{ width: "auto" }}
            >
              <option value="photo">Photo</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
            <input
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleEvidenceFileChange}
              className="field-input field-input--sm"
              style={{ width: "auto", display: "none" }}
              id="evidence-file-input"
            />
            <label htmlFor="evidence-file-input" className="field-primary-btn field-primary-btn--sm">
              <Camera width={14} height={14} /> Add
            </label>
          </div>
        </div>
        {evidenceFile && evidencePreview && (
          <div className="field-evidence-preview">
            <div className="field-evidence-preview__media">
              {evidenceType === "photo" ? (
                <img src={evidencePreview} alt="Preview" />
              ) : evidenceType === "video" ? (
                <video src={evidencePreview} controls />
              ) : evidenceType === "audio" ? (
                <audio src={evidencePreview} controls />
              ) : (
                <div className="field-evidence-doc">
                  <File width={32} height={32} />
                  <span>{evidenceFile.name}</span>
                </div>
              )}
            </div>
            
            <div className="field-evidence-preview__actions" style={{marginTop:20}}>
              <button className="field-primary-btn field-primary-btn--sm" onClick={handleUploadEvidence} disabled={uploadEvidence.isPending} style={{width:100}}> 
                {uploadEvidence.isPending ? "Uploading..." : "Upload"}
              </button>
              <button className="btn btn--ghost btn--sm" style={{marginLeft:8, width:100}} onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}>
                <X width={14} height={14} />
              </button>
            </div>
          </div>
        )}
        {evidence.length === 0 ? (
          <p className="text-tertiary" style={{ fontSize: "var(--text-sm)", marginTop: 8 }}>No evidence yet — add photos, video, audio or documents.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginTop: 8 }}>
            {evidence.map((item: FieldEvidenceItem, idx: number) => {
              const name = item.name || `file-${idx + 1}`;
              const url = item.url || "";
              const type = (item.type || "document").toLowerCase();
              return (
                <div key={`${item.id}-${idx}`} className="card" style={{ padding: 0, overflow: "hidden", cursor: url ? "pointer" : "default" }} onClick={() => url && setPreview({ url, type, name })}>
                  <div style={{ aspectRatio: "4/3", background: "var(--color-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {(type.includes("image") || type === "photo") && url ? <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : type.includes("video") ? <Video width={24} height={24} /> : type.includes("audio") ? <Music width={24} height={24} /> : <File width={24} height={24} />}
                  </div>
                  <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <span className="text-tertiary" style={{ fontSize: "var(--text-xs)" }}>{item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : ""}</span>
                    {url && <button type="button" onClick={(e) => { e.stopPropagation(); setPreview({ url, type, name }); }} style={{ fontSize: "var(--text-xs)", display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", padding: 0, color: "var(--color-brand)", cursor: "pointer" }}><Eye width={12} height={12} /> Preview</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reports / Case Notes */}
      <div className="field-detail-section">
        <div className="field-detail-section__label-row">
          <div className="field-detail-section__label">
            <MessageSquare width={14} height={14} /> Reports & Notes
          </div>
          <button className="field-primary-btn field-primary-btn--sm" onClick={() => setShowAddReport(true)}>
            <Plus width={14} height={14} /> Add Report
          </button>
        </div>

        {showAddReport && (
          <div className="field-report-form">
            <div className="field-edit-row">
              <label className="field-edit-label">Title (optional)</label>
              <input
                className="field-input"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Scene assessment"
              />
            </div>
            <div className="field-edit-row">
              <label className="field-edit-label">Body</label>
              <textarea
                className="field-input"
                value={reportBody}
                onChange={(e) => setReportBody(e.target.value)}
                placeholder="Describe your findings, actions taken, observations..."
                rows={4}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: "var(--space-2)" }}>
              <button className="field-primary-btn field-primary-btn--sm" onClick={handleAddReport} disabled={addReport.isPending}>
                {addReport.isPending ? "Saving..." : "Save Report"}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setShowAddReport(false); setReportTitle(""); setReportBody(""); }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {reports.length > 0 && (
          <div className="field-reports-list">
            {reports.map((report: FieldReport, idx: number) => (
              <div key={`${report.id}-${idx}`} id={`report-${report.id}`} className="field-report-item" data-review={report.review_status || "draft"}>
                {editingReportId === report.id ? (
                  <div className="field-report-edit">
                    <div className="field-edit-row">
                      <label className="field-edit-label">Title</label>
                      <input className="field-input" value={editReportTitle} onChange={(e) => setEditReportTitle(e.target.value)} />
                    </div>
                    <div className="field-edit-row">
                      <label className="field-edit-label">Body</label>
                      <textarea className="field-input" value={editReportBody} onChange={(e) => setEditReportBody(e.target.value)} rows={3} />
                    </div>
                    <div className="field-edit-row">
                      <label className="field-edit-label">Progress</label>
                      <select className="field-input" value={editReportProgress} onChange={(e) => setEditReportProgress(e.target.value)}>
                        <option value="">—</option>
                        <option value="en_route">En Route</option>
                        <option value="on_site">On Site</option>
                        <option value="resolved">Resolved</option>
                        <option value="safe">Safe</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="field-primary-btn field-primary-btn--sm" onClick={() => handleSaveReport(report.id)} disabled={updateReport.isPending}>
                        <Save width={14} height={14} /> Save
                      </button>
                      <button className="btn btn--ghost btn--sm" onClick={handleCancelReport}>
                        <X width={14} height={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="field-report-view">
                    <div className="field-report-view__header">
                      {report.title && <div className="field-report-view__title">{report.title}</div>}
                      <div className="field-report-view__meta">
                        <span>{report.created_by_name || "Field Worker"}</span>
                        <span className="field-report-view__time">{report.created_at ? new Date(report.created_at).toLocaleString() : ""}</span>
                        {report.progress && <span className="field-report-progress">{report.progress}</span>}
                        <span className={`field-report-review field-report-review--${report.review_status || "draft"}`}>
                          {(report.review_status || "draft").replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="field-report-view__body">{report.body}</div>
                    {report.review_status === "approved" && (
                      <div className="field-report-feedback field-report-feedback--approved">
                        <CheckCircle2 width={14} height={14} />
                        <span>Approved by the agency{report.reviewed_at ? ` • ${new Date(report.reviewed_at).toLocaleString()}` : ""}.</span>
                      </div>
                    )}
                    {report.review_status === "changes_requested" && report.review_feedback && (
                      <div className="field-report-feedback field-report-feedback--objection">
                        <span className="field-report-feedback__label">Agency objections:</span>
                        <span>{report.review_feedback}</span>
                      </div>
                    )}
                    <div className="field-report-view__actions">
                      {(!report.review_status || report.review_status === "draft") && (
                        <>
                          <button className="btn btn--ghost btn--sm" onClick={() => handleEditReport(report)}>
                            <Edit2 width={14} height={14} /> Edit
                          </button>
                          <button
                            className="field-primary-btn field-primary-btn--sm"
                            disabled={submitReport.isPending}
                            onClick={() =>
                              submitReport.mutate(
                                { alertId: String(alert.id), reportId: String(report.id) }
                              )
                            }
                          >
                            <Send width={14} height={14} /> {submitReport.isPending ? "Submitting..." : "Submit for check"}
                          </button>
                        </>
                      )}
                      {report.review_status === "submitted" && (
                        <span className="field-report-pending">Waiting for agency check…</span>
                      )}
                    </div>
                    {report.updated_at && report.updated_at !== report.created_at && (
                      <div className="field-report-view__updated">Updated: {new Date(report.updated_at).toLocaleString()}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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

      {action && (
        <div className="field-action-bar">
          <button
            className={`field-primary-btn field-primary-btn--block field-primary-btn--${action.tone}`}
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Updating..." : action.label}
          </button>
        </div>
      )}
      <EvidenceLightbox item={preview} onClose={() => setPreview(null)} />
    </div>
  );
}