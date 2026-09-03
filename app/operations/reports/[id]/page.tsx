"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useGetReports } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useUpdateReportStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { Badge } from "@/components/operations/shared/Badge";
import { EmptyState } from "@/components/operations/shared/EmptyState";
import { SkeletonRow } from "@/components/operations/shared/LoadingSkeleton";
import { formatShortDate } from "@/lib/operations/utils";
import { toast } from "sonner";
import { FileText, ThumbsUp, RefreshCcw } from "lucide-react";

export default function ReportReviewPage() {
  const params = useParams();
  const id = params.id;
  const { data: reports = [], isLoading } = useGetReports({ status: "all" });
  const [changesText, setChangesText] = useState("");
  const [showChanges, setShowChanges] = useState(false);
  const { mutate: updateStatus } = useUpdateReportStatus();

  const report = useMemo(
    () => reports.find((r) => String(r.id) === String(id)),
    [reports, id]
  );

  if (isLoading) return <SkeletonRow cols={2} rows={8} />;

  if (!report) {
    return <EmptyState icon={<FileText width={40} height={40} />} title="Report not found" />;
  }

  const approve = () => {
    updateStatus({ id: report.id, status: "resolved" });
    toast.success(`Report #${report.id} approved`);
  };

  const requestChanges = () => {
    updateStatus({ id: report.id, status: "reviewing" });
    toast.success("Changes requested");
    setShowChanges(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{`Report #${report.id}`}</h1>
          <p className="page-header__subtitle">
            {String(report.category || report.incident_type || "Report").replace(/[_-]/g, " ")}
          </p>
        </div>
        <Badge variant={report.status} tone="report">{String(report.status).replace(/[_-]/g, " ")}</Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-5)", alignItems: "start" }}>
        <div className="case-detail__left" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Case summary */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Case Summary</h2>
            </div>
            <div className="info-grid">
              <div className="info-row"><span className="info-row__label">Report ID</span><span className="info-row__value mono">#{report.id}</span></div>
              <div className="info-row"><span className="info-row__label">Category</span><span className="info-row__value">{report.category || report.incident_type}</span></div>
              <div className="info-row"><span className="info-row__label">Reporter</span><span className="info-row__value">{report.user_name || "Anonymous"}</span></div>
              <div className="info-row"><span className="info-row__label">Submitted</span><span className="info-row__value">{formatShortDate(report.created_at || report.createdAt)}</span></div>
              <div className="info-row"><span className="info-row__label">Assigned</span><span className="info-row__value">{report.assigned_staff_name || "Unassigned"}</span></div>
              <div className="info-row"><span className="info-row__label">Priority</span><span className="info-row__value">{report.priority || "—"}</span></div>
            </div>
          </div>

          {/* Description */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Description</h2>
            </div>
            <p className="text-secondary" style={{ fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
              {report.description || "No description provided."}
            </p>
          </div>

          {/* Q&A */}
          {report.answers && report.answers.length > 0 && (
            <div className="card">
              <div className="section-header">
                <h2 className="section-header__title">Structured Answers</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {report.answers.map((a, i) => (
                  <div key={i}>
                    <div className="text-tertiary" style={{ fontSize: "var(--text-xs)", textTransform: "uppercase", fontWeight: 600 }}>
                      {a.question}
                    </div>
                    <div className="text-secondary" style={{ fontSize: "var(--text-sm)", marginTop: 2 }}>
                      {a.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="case-detail__right" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* AI analysis */}
          {(report.ai_analysis || report.ai_Analysis) && (
            <div className="card">
              <div className="section-header">
                <h2 className="section-header__title">AI Intelligence</h2>
              </div>
              <div className="info-grid">
                <div className="info-row">
                  <span className="info-row__label">Severity</span>
                  <span className="info-row__value">{report.ai_analysis?.severity_rating ?? report.ai_Analysis?.severity_rating ?? "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Risk</span>
                  <span className="info-row__value">{report.ai_analysis?.escalation_risk ?? report.ai_Analysis?.escalation_risk ?? "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Urgency</span>
                  <span className="info-row__value">{report.ai_analysis?.timeline_urgency ?? report.ai_Analysis?.timeline_urgency ?? "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-row__label">Pattern</span>
                  <span className="info-row__value">{report.ai_analysis?.identified_pattern_type ?? report.ai_Analysis?.identified_pattern_type ?? "—"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Review actions */}
          <div className="card">
            <div className="section-header">
              <h2 className="section-header__title">Review Actions</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <button type="button" className="btn btn--primary" onClick={approve}>
                <ThumbsUp width={14} height={14} /> Approve Report
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowChanges(!showChanges)}>
                <RefreshCcw width={14} height={14} /> Request Changes
              </button>
              {showChanges && (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Instructions for the field worker..."
                    value={changesText}
                    onChange={(e) => setChangesText(e.target.value)}
                  />
                  <button type="button" className="btn btn--danger btn--sm" onClick={requestChanges} disabled={!changesText.trim()}>
                    Submit Changes Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
