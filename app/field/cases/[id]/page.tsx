"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetAlerts, useUpdateAlertStatus } from "@/lib/hooks/dispatch/use-dispatch-data";
import { useAlertStore } from "@/stores/useAlertStore";
import { useAgencyAuthStore } from "@/lib/store/agency-auth-store";
import { Badge } from "@/components/operations/shared/Badge";
import { Skeleton } from "@/components/operations/shared/LoadingSkeleton";
import { ArrowLeft, MapPin, AlertTriangle, Phone, FileText } from "lucide-react";
import {
  displayPriority,
  incidentLabel,
  locationLabel,
  formatShortDate,
} from "@/lib/operations/utils";
import type { Alert, AlertStatus } from "@/types";
import "@/styles/field.css";

type FieldWorkerStage = "active" | "en_route" | "on_site" | "resolved";

function resolveWorkerStage(alert: Alert): FieldWorkerStage {
  if (alert.status === "resolved") return "resolved";
  if (alert.status === "dispatched") return "on_site";
  if (alert.status === "acknowledged") return "en_route";
  return "active";
}

function mapWorkerStageToApiStatus(stage: FieldWorkerStage): AlertStatus {
  const map: Record<FieldWorkerStage, AlertStatus> = {
    active: "acknowledged",
    en_route: "dispatched",
    on_site: "resolved",
    resolved: "resolved",
  };
  return map[stage];
}

export default function FieldCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params?.id as string;
  useAgencyAuthStore();
  const { data: alerts, isLoading } = useGetAlerts();
  const realtimeAlerts = useAlertStore((s) => s.alerts);
  const updateStatus = useUpdateAlertStatus();

  const merged = React.useMemo(() => {
    const base = alerts || [];
    const rt = realtimeAlerts || [];
    const map = new Map<string, Alert>();
    for (const a of [...rt, ...base]) {
      map.set(String(a.id), a);
    }
    return Array.from(map.values());
  }, [alerts, realtimeAlerts]);

  const alert = React.useMemo(
    () => merged.find((a) => String(a.id) === String(caseId)) || null,
    [merged, caseId]
  );

  const [localStage, setLocalStage] = useState<FieldWorkerStage | null>(null);

  const workerStage: FieldWorkerStage = localStage || (alert ? resolveWorkerStage(alert) : "active");

  const handleAdvance = useCallback(() => {
    if (!alert) return;

    const nextStageMap: Record<FieldWorkerStage, FieldWorkerStage> = {
      active: "en_route",
      en_route: "on_site",
      on_site: "resolved",
      resolved: "resolved",
    };

    const nextStage = nextStageMap[workerStage];
    if (nextStage === workerStage) return;

    setLocalStage(nextStage);

    const apiStatus = mapWorkerStageToApiStatus(nextStage);
    updateStatus.mutate(
      { id: alert.id, status: apiStatus },
      {
        onError: () => {
          setLocalStage(null);
        },
      }
    );
  }, [alert, workerStage, updateStatus]);

  const actionConfig: Record<
    FieldWorkerStage,
    { label: string; btnClass: string } | null
  > = {
    active: { label: "Accept & En Route", btnClass: "field-action-btn--accept" },
    en_route: { label: "Arrived On Site", btnClass: "field-action-btn--on-site" },
    on_site: { label: "Resolve Case", btnClass: "field-action-btn--resolve" },
    resolved: null,
  };

  const currentAction = actionConfig[workerStage];

  if (isLoading) {
    return (
      <div className="field-main">
        <Skeleton height={20} width="30%" />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={16} width="60%" />
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="field-main">
        <button
          onClick={() => router.back()}
          className="field-action-btn field-action-btn--en-route"
          style={{ marginBottom: 16, width: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <ArrowLeft width={16} height={16} /> Back
        </button>
        <div className="field-empty">Case not found.</div>
      </div>
    );
  }

  const priority = displayPriority(alert.priority);
  const incident = incidentLabel(alert.incident_type, alert.description);
  const location = locationLabel(alert);

  const timelineEvents: { label: string; time: string | null }[] = [
    { label: "Incident reported", time: alert.created_at },
    alert.assigned_at ? { label: `Assigned to ${alert.assigned_staff_name || "you"}`, time: alert.assigned_at } : null,
    workerStage !== "active" ? { label: "Accepted & en route", time: alert.updated_at } : null,
    workerStage === "on_site" || workerStage === "resolved" ? { label: "Arrived on site", time: alert.updated_at } : null,
    alert.status === "resolved" ? { label: "Case resolved", time: alert.resolved_at || alert.updated_at } : null,
  ].filter(Boolean) as { label: string; time: string | null }[];

  return (
    <div className="field-main" style={{ padding: 0 }}>
      <div className="field-case-detail__header">
        <button
          onClick={() => router.back()}
          style={{
            background: "none",
            border: "none",
            color: "var(--color-brand)",
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-semibold)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
            marginBottom: 8,
          }}
        >
          <ArrowLeft width={16} height={16} /> Back to cases
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", color: "var(--color-text-primary)" }}>
            Case #{alert.id}
          </span>
          <Badge variant={workerStage} tone="status">
            {workerStage === "active" ? "assigned" : workerStage}
          </Badge>
        </div>
      </div>

      <div className="field-case-detail__section">
        <div className="field-case-detail__label">Incident</div>
        <div className="field-case-detail__value" style={{ fontWeight: "var(--weight-semibold)" }}>
          {incident}
        </div>
      </div>

      <div className="field-case-detail__section">
        <div className="field-case-detail__label">Priority</div>
        <div className="field-case-detail__value">
          <Badge variant={priority} tone="priority">
            {priority}
          </Badge>
        </div>
      </div>

      {alert.description && (
        <div className="field-case-detail__section">
          <div className="field-case-detail__label">Description</div>
          <div className="field-case-detail__value">{alert.description}</div>
        </div>
      )}

      {alert.transcribed_text && (
        <div className="field-case-detail__section">
          <div className="field-case-detail__label">
            <FileText width={12} height={12} style={{ display: "inline", marginRight: 4 }} />
            Transcription
          </div>
          <div className="field-case-detail__value" style={{ fontStyle: "italic" }}>
            {alert.transcribed_text}
          </div>
        </div>
      )}

      <div className="field-case-detail__section">
        <div className="field-case-detail__label">
          <MapPin width={12} height={12} style={{ display: "inline", marginRight: 4 }} />
          Location
        </div>
        <div className="field-case-detail__value">{location}</div>
      </div>

      {(alert.user?.name || alert.user_phone) && (
        <div className="field-case-detail__section">
          <div className="field-case-detail__label">
            <Phone width={12} height={12} style={{ display: "inline", marginRight: 4 }} />
            Reporter
          </div>
          <div className="field-case-detail__value">
            {alert.user?.name || "Unknown"}
            {alert.user_phone && (
              <span style={{ color: "var(--color-text-tertiary)", marginLeft: 8 }}>
                {alert.user_phone}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="field-case-detail__section">
        <div className="field-case-detail__label">Timeline</div>
        <div className="field-case-detail__timeline">
          {timelineEvents.map((event, idx) => (
            <div key={idx} className="field-case-detail__timeline-item">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="field-case-detail__timeline-dot" />
                {idx < timelineEvents.length - 1 && (
                  <div className="field-case-detail__timeline-line" style={{ flex: 1 }} />
                )}
              </div>
              <div style={{ paddingBottom: idx < timelineEvents.length - 1 ? 16 : 0 }}>
                <div className="field-case-detail__timeline-text" style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
                  {event.label}
                </div>
                <div className="field-case-detail__timeline-text">
                  {formatShortDate(event.time)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentAction && (
        <div style={{ padding: "var(--space-4)" }}>
          <button
            className={`field-action-btn ${currentAction.btnClass}`}
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Updating..." : currentAction.label}
          </button>
        </div>
      )}

      {workerStage === "resolved" && (
        <div style={{ padding: "var(--space-4)" }}>
          <div className="field-empty" style={{ padding: "var(--space-4)" }}>
            <AlertTriangle width={24} height={24} style={{ color: "var(--color-success)", marginRight: 8 }} />
            Case resolved successfully
          </div>
        </div>
      )}
    </div>
  );
}
