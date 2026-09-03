"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, FileText, AlertTriangle, Navigation, Image, File, Edit2, Save, X, Plus, Camera, MessageSquare } from "lucide-react";
import { Badge } from "@/components/operations/shared/Badge";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerStatusStepper } from "@/components/field/shared/WorkerStatusStepper";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useFieldAlert, useUploadFieldEvidence, useAddFieldReport, useUpdateFieldReport } from "@/lib/field/use-field-data";
import {
  workerStageFor,
  workerActionFor,
  NEXT_STATUS,
  backendStatusLabel,
  statusBadgeVariant,
  priorityVariant,
  incidentCoords,
} from "@/lib/field/utils";
import { incidentLabel, locationLabel, formatShortDate } from "@/lib/operations/utils";
import { toast } from "sonner";
import type { FieldReport, FieldEvidenceItem } from "@/types";
import "@/styles/field.css";

export default function FieldCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const { alert, isLoading, isError, refetch } = useFieldAlert(caseId);
  const updateStatus = useUpdateAlertStatus();
  const uploadEvidence = useUploadFieldEvidence();
  const addReport = useAddFieldReport();
  const updateReport = useUpdateFieldReport();

  const stage = workerStageFor(alert);
  const action = workerActionFor(stage);
  const nextStatus = NEXT_STATUS[stage];

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
    uploadEvidence.mutate(
      { alertId: alert.id, file: evidenceFile, fileType: evidenceType },
      {
        onSuccess: () => {
          setEvidenceFile(null);
          setEvidencePreview(null);
          toast.success("Evidence uploaded");
        },
        onError: () => toast.error("Upload failed"),
      }
    );
  };

  const handleAddReport = () => {
    if (!reportBody.trim() && !reportTitle.trim()) return;
    addReport.mutate(
      { alertId: alert!.id, data: { title: reportTitle, body: reportBody } },
      {
        onSuccess: () => {
          setShowAddReport(false);
          setReportTitle("");
          setReportBody("");
          toast.success("Report added");
        },
        onError: () => toast.error("Failed to add report"),
      }
    );
  };

  const handleEditReport = (report: FieldReport) => {
    setEditingReportId(report.id);
    setEditReportTitle(report.title || "");
    setEditReportBody(report.body || "");
    setEditReportProgress(report.progress || "");
  };

  const handleSaveReport = (reportId: string) => {
    updateReport.mutate(
      { alertId: alert!.id, reportId, data: { title: editReportTitle, body: editReportBody, progress: editReportProgress } },
      {
        onSuccess: () => {
          setEditingReportId(null);
          toast.success("Report updated");
        },
        onError: () => toast.error("Failed to update report"),
      }
    );
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

  const incident = incidentLabel(alert.incident_type, alert.description);
  const location = locationLabel(alert);
  const priority = priorityVariant(alert.priority);
  const statusLabel = backendStatusLabel(alert.status);

  const timeline: { label: string; time: string | null }[] = [
    { label: "Incident reported", time: alert.created_at },
    alert.assigned_at ? { label: `Assigned to ${alert.assigned_staff_name || "you"}`, time: alert.assigned_at } : null,
    stage !== "active" ? { label: "Assignment accepted", time: alert.updated_at } : null,
    alert.status === "resolved" ? { label: "Case completed", time: alert.resolved_at || alert.updated_at } : null,
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
        <h1>Case #{alert.id}</h1>
        <p>{incident}</p>
      </div>

      <div className="field-case-view__stepper-wrap">
        <WorkerStatusStepper stage={stage} />
      </div>

      <div className="field-detail-card">
        <div className="field-detail-row">
          <span className="field-detail-row__label">Priority</span>
          <Badge variant={priority} tone="priority">
            {alert.priority || "medium"}
          </Badge>
        </div>
        <div className="field-detail-row">
          <span className="field-detail-row__label">Location</span>
          <span className="field-detail-row__value">
            <MapPin width={14} height={14} /> {location}
          </span>
        </div>
        {coords && (
          <button className="field-inline-btn" onClick={() => router.push(`/field/map?case=${alert.id}`)}>
            <Navigation width={14} height={14} /> Open Map for directions
          </button>
        )}
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
      <div className="field-detail-section">
        <div className="field-detail-section__label-row">
          <div className="field-detail-section__label">
            <Image width={14} height={14} /> Evidence
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
            <div className="field-evidence-preview__actions">
              <button className="field-primary-btn field-primary-btn--sm" onClick={handleUploadEvidence} disabled={uploadEvidence.isPending}>
                {uploadEvidence.isPending ? "Uploading..." : "Upload"}
              </button>
              <button className="btn btn--ghost btn--sm" onClick={() => { setEvidenceFile(null); setEvidencePreview(null); }}>
                <X width={14} height={14} />
              </button>
            </div>
          </div>
        )}
        {evidence.length > 0 && (
          <div className="field-evidence-grid">
            {evidence.map((item: FieldEvidenceItem, idx: number) => (
              <div key={`${item.id}-${idx}`} className="field-evidence-item">
                {item.type === "photo" && item.url ? (
                  <img src={item.url} alt={item.name || "Evidence"} loading="lazy" />
                ) : item.type === "video" && item.url ? (
                  <video src={item.url} controls />
                ) : item.type === "audio" && item.url ? (
                  <audio src={item.url} controls />
                ) : (
                  <div className="field-evidence-doc">
                    <File width={32} height={32} />
                    <span>{item.name || "Document"}</span>
                  </div>
                )}
                <div className="field-evidence-item__meta">
                  <span>{item.name || "File"}</span>
                  <span className="field-evidence-item__time">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : ""}</span>
                </div>
              </div>
            ))}
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
              <div key={`${report.id}-${idx}`} className="field-report-item">
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
                      </div>
                    </div>
                    <div className="field-report-view__body">{report.body}</div>
                    <div className="field-report-view__actions">
                      <button className="btn btn--ghost btn--sm" onClick={() => handleEditReport(report)}>
                        <Edit2 width={14} height={14} /> Edit
                      </button>
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

      <div className="field-action-bar">
        {action ? (
          <button
            className={`field-primary-btn field-primary-btn--block field-primary-btn--${action.tone}`}
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Updating..." : action.label}
          </button>
        ) : (
          <div className="field-success-banner">
            <AlertTriangle width={18} height={18} />
            <span>This case is complete. No further action needed.</span>
          </div>
        )}
      </div>
    </div>
  );
}