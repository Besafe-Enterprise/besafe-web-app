"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, FileText, AlertTriangle, Navigation } from "lucide-react";
import { Badge } from "@/components/operations/shared/Badge";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { WorkerStatusStepper } from "@/components/field/shared/WorkerStatusStepper";
import { ErrorRetry } from "@/components/field/shared/ErrorRetry";
import { useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useFieldAlert } from "@/lib/field/use-field-data";
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

export default function FieldCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  const { alert, isLoading, isError, refetch } = useFieldAlert(caseId);
  const updateStatus = useUpdateAlertStatus();

  const stage = workerStageFor(alert);
  const action = workerActionFor(stage);
  const nextStatus = NEXT_STATUS[stage];

  const handleAdvance = () => {
    if (!alert || !nextStatus) return;
    updateStatus.mutate({ id: alert.id, status: nextStatus });
  };

  const coords = alert ? incidentCoords(alert) : null;

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
